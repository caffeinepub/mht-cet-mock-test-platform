/**
 * AdminRegistration Component
 * 
 * This page allows authenticated users to register Internet Identity principals as administrators.
 * Includes comprehensive diagnostic logging, timeout detection, progressive status indicators, retry functionality, and development debug panel.
 */

import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminRegistration } from '../hooks/useAdminRegistration';
import { useGetCallerUserRole, useIsCallerAdmin } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, CheckCircle2, AlertCircle, ShieldAlert, Loader2, PartyPopper, Info, RefreshCw, Clock, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { UserRole__1 } from '../backend';
import { useQueryClient } from '@tanstack/react-query';
import { Principal } from '@dfinity/principal';

// Connection phases for progressive status display
type ConnectionPhase = 'initializing' | 'authenticating' | 'connecting' | 'verifying' | 'ready' | 'timeout' | 'error';

export default function AdminRegistration() {
  const { identity, loginStatus } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [principalInput, setPrincipalInput] = useState('');
  const { mutate: registerAdmin, isPending } = useAdminRegistration();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();
  const { data: isAdminCheck, isLoading: adminCheckLoading } = useIsCallerAdmin();

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showTroubleshootingDialog, setShowTroubleshootingDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [isCanisterStoppedError, setIsCanisterStoppedError] = useState(false);
  const [proceedWithRegistration, setProceedWithRegistration] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  
  // New state for checking if principal is already admin
  const [checkingPrincipalStatus, setCheckingPrincipalStatus] = useState(false);
  const [principalIsAlreadyAdmin, setPrincipalIsAlreadyAdmin] = useState(false);

  // New state for connection timeout and retry
  const [connectionPhase, setConnectionPhase] = useState<ConnectionPhase>('initializing');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [connectionStartTime, setConnectionStartTime] = useState<number>(Date.now());
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  // Health check state
  const [healthCheckStatus, setHealthCheckStatus] = useState<'idle' | 'checking' | 'success' | 'failed'>('idle');
  const [healthCheckError, setHealthCheckError] = useState<string>('');

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString() || '';
  const isAdmin = userRole === 'admin';

  // Comprehensive diagnostic logging with timestamps
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] === AdminRegistration Component State ===`);
    console.log(`[${timestamp}] isAuthenticated: ${isAuthenticated}`);
    console.log(`[${timestamp}] loginStatus: ${loginStatus}`);
    console.log(`[${timestamp}] currentPrincipal: ${currentPrincipal}`);
    console.log(`[${timestamp}] actor available: ${!!actor}`);
    console.log(`[${timestamp}] actorFetching: ${actorFetching}`);
    console.log(`[${timestamp}] userRole: ${userRole}`);
    console.log(`[${timestamp}] roleLoading: ${roleLoading}`);
    console.log(`[${timestamp}] roleFetched: ${roleFetched}`);
    console.log(`[${timestamp}] isAdmin: ${isAdmin}`);
    console.log(`[${timestamp}] isAdminCheck: ${isAdminCheck}`);
    console.log(`[${timestamp}] isPending: ${isPending}`);
    console.log(`[${timestamp}] connectionPhase: ${connectionPhase}`);
    console.log(`[${timestamp}] elapsedSeconds: ${elapsedSeconds}`);
    console.log(`[${timestamp}] hasTimedOut: ${hasTimedOut}`);
    console.log(`[${timestamp}] retryAttempt: ${retryAttempt}`);
    console.log(`[${timestamp}] healthCheckStatus: ${healthCheckStatus}`);
  }, [isAuthenticated, loginStatus, currentPrincipal, actor, actorFetching, userRole, roleLoading, roleFetched, isAdmin, isAdminCheck, isPending, connectionPhase, elapsedSeconds, hasTimedOut, retryAttempt, healthCheckStatus]);

  // Health check on mount
  useEffect(() => {
    if (!actor || actorFetching || healthCheckStatus !== 'idle') {
      return;
    }

    const performHealthCheck = async () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] === Performing Health Check ===`);
      setHealthCheckStatus('checking');

      try {
        const healthCheckTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Health check timeout')), 5000);
        });

        const healthCheckPromise = actor.getTotalQuestions();
        
        await Promise.race([healthCheckPromise, healthCheckTimeout]);
        
        console.log(`[${timestamp}] Health check successful`);
        setHealthCheckStatus('success');
        setHealthCheckError('');
      } catch (error: any) {
        console.error(`[${timestamp}] Health check failed:`, error);
        setHealthCheckStatus('failed');
        setHealthCheckError(error.message || 'Health check failed');
      }
    };

    performHealthCheck();
  }, [actor, actorFetching, healthCheckStatus]);

  // Track connection phases based on state
  useEffect(() => {
    const timestamp = new Date().toISOString();
    
    if (hasTimedOut) {
      console.log(`[${timestamp}] Connection phase: timeout`);
      setConnectionPhase('timeout');
      return;
    }

    if (healthCheckStatus === 'failed') {
      console.log(`[${timestamp}] Connection phase: error (health check failed)`);
      setConnectionPhase('error');
      return;
    }

    if (healthCheckStatus === 'success' && actor && !actorFetching) {
      console.log(`[${timestamp}] Connection phase: ready (health check passed)`);
      setConnectionPhase('ready');
      return;
    }

    if (healthCheckStatus === 'checking') {
      console.log(`[${timestamp}] Connection phase: verifying (health check in progress)`);
      setConnectionPhase('verifying');
      return;
    }

    if (!isAuthenticated) {
      console.log(`[${timestamp}] Connection phase: initializing (not authenticated)`);
      setConnectionPhase('initializing');
      return;
    }

    if (loginStatus === 'logging-in') {
      console.log(`[${timestamp}] Connection phase: authenticating`);
      setConnectionPhase('authenticating');
      return;
    }

    if (actorFetching) {
      console.log(`[${timestamp}] Connection phase: connecting (actor fetching)`);
      setConnectionPhase('connecting');
      return;
    }

    if (isAuthenticated && !actor) {
      console.log(`[${timestamp}] Connection phase: verifying (authenticated but no actor)`);
      setConnectionPhase('verifying');
      return;
    }

    console.log(`[${timestamp}] Connection phase: initializing (default)`);
    setConnectionPhase('initializing');
  }, [actor, actorFetching, isAuthenticated, loginStatus, hasTimedOut, healthCheckStatus]);

  // Elapsed time counter - updates every second
  useEffect(() => {
    if (connectionPhase === 'ready' || hasTimedOut) {
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - connectionStartTime) / 1000);
      setElapsedSeconds(elapsed);
      
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Connection elapsed time: ${elapsed}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionPhase, connectionStartTime, hasTimedOut]);

  // Timeout detection - 15 seconds
  useEffect(() => {
    if (connectionPhase === 'ready' || hasTimedOut) {
      return;
    }

    const timeoutDuration = 15000; // 15 seconds
    const timeoutId = setTimeout(() => {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] === CONNECTION TIMEOUT DETECTED ===`);
      console.error(`[${timestamp}] Connection phase: ${connectionPhase}`);
      console.error(`[${timestamp}] Elapsed time: ${Math.floor((Date.now() - connectionStartTime) / 1000)}s`);
      console.error(`[${timestamp}] Actor available: ${!!actor}`);
      console.error(`[${timestamp}] Actor fetching: ${actorFetching}`);
      console.error(`[${timestamp}] Health check status: ${healthCheckStatus}`);
      
      setHasTimedOut(true);
      toast.error('Connection timeout', {
        description: 'Unable to establish connection to the backend service within 15 seconds.'
      });
    }, timeoutDuration);

    return () => clearTimeout(timeoutId);
  }, [connectionPhase, connectionStartTime, hasTimedOut, actor, actorFetching, healthCheckStatus]);

  // Reset connection state on retry
  const handleRetryConnection = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] === Retry Connection Initiated ===`);
    console.log(`[${timestamp}] Retry attempt: ${retryAttempt + 1}`);
    
    setHasTimedOut(false);
    setConnectionStartTime(Date.now());
    setElapsedSeconds(0);
    setRetryAttempt(prev => prev + 1);
    setHealthCheckStatus('idle');
    setHealthCheckError('');
    
    // Force re-render by invalidating actor query
    queryClient.invalidateQueries({ queryKey: ['actor'] });
    
    toast.info('Retrying connection...', {
      description: 'Attempting to reconnect to the backend service.'
    });
  };

  const handleCopyPrincipal = () => {
    navigator.clipboard.writeText(currentPrincipal);
    toast.success('Principal ID copied to clipboard');
  };

  const handlePrincipalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrincipalInput(e.target.value);
    setPrincipalIsAlreadyAdmin(false);
  };

  const handleRegisterAdmin = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] === Register Admin Button Clicked ===`);
    console.log(`[${timestamp}] Principal input: ${principalInput}`);
    console.log(`[${timestamp}] Current user role: ${userRole}`);
    console.log(`[${timestamp}] Is admin: ${isAdmin}`);

    if (!principalInput.trim()) {
      toast.error('Please enter a principal ID');
      return;
    }

    // Validate principal format
    try {
      Principal.fromText(principalInput.trim());
      console.log(`[${timestamp}] Valid principal format`);
    } catch (error) {
      console.error(`[${timestamp}] Invalid principal format:`, error);
      toast.error('Invalid principal ID format');
      return;
    }

    if (!isAdmin && !isFirstAdmin) {
      console.log(`[${timestamp}] Opening first admin confirmation dialog`);
      setIsFirstAdmin(true);
      return;
    }

    console.log(`[${timestamp}] Proceeding with admin registration`);
    // Pass the principal as a string to the mutation
    registerAdmin(principalInput.trim(), {
      onSuccess: ({ result, principal }) => {
        const successTimestamp = new Date().toISOString();
        console.log(`[${successTimestamp}] === Admin Registration Success ===`);
        console.log(`[${successTimestamp}] Result:`, result);
        
        if (result.__kind__ === 'success') {
          console.log(`[${successTimestamp}] Registered principal: ${result.success.registeredPrincipal.toString()}`);
          setShowSuccessDialog(true);
          setPrincipalInput('');
          queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
          queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
        } else if (result.__kind__ === 'alreadyRegistered') {
          console.log(`[${successTimestamp}] Principal already registered as admin`);
          setPrincipalIsAlreadyAdmin(true);
          toast.info('This principal is already registered as an admin');
        } else if (result.__kind__ === 'unauthorized') {
          console.error(`[${successTimestamp}] Unauthorized: Caller is not an admin`);
          setErrorMessage('Unauthorized');
          setErrorDetails('You do not have permission to register admins. Only existing admins can register new admins.');
          setShowErrorDialog(true);
        } else {
          console.error(`[${successTimestamp}] Internal error during registration`);
          setErrorMessage('Internal Error');
          setErrorDetails('An internal error occurred during registration. Please try again.');
          setShowErrorDialog(true);
        }
      },
      onError: (error: any) => {
        const errorTimestamp = new Date().toISOString();
        console.error(`[${errorTimestamp}] === Admin Registration Error ===`);
        console.error(`[${errorTimestamp}] Error:`, error);
        console.error(`[${errorTimestamp}] Error message:`, error.message);
        
        if (error.message?.includes('Canister') || error.message?.includes('stopped')) {
          console.error(`[${errorTimestamp}] Canister stopped error detected`);
          setIsCanisterStoppedError(true);
          setErrorMessage('Backend Service Unavailable');
          setErrorDetails('The backend canister appears to be stopped. Please contact the system administrator to start the canister.');
        } else {
          setErrorMessage('Registration Failed');
          setErrorDetails(error.message || 'An unexpected error occurred during registration.');
        }
        setShowErrorDialog(true);
      }
    });
  };

  const handleFirstAdminConfirm = () => {
    setIsFirstAdmin(false);
    setProceedWithRegistration(true);
    handleRegisterAdmin();
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    setCountdown(3);
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate({ to: '/' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Render connection timeout or error
  if (hasTimedOut || healthCheckStatus === 'failed') {
    const errorMsg = hasTimedOut ? 'Connection timeout' : 'Connection failed';
    const errorDetail = hasTimedOut 
      ? 'Unable to establish connection to the backend service within 15 seconds'
      : healthCheckError || 'Health check failed - backend service may be unavailable';

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <WifiOff className="h-8 w-8 text-destructive" />
              <div>
                <CardTitle className="text-2xl">Connection Timeout</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{elapsedSeconds}s elapsed</span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold">{errorMsg}</div>
                <div className="text-sm mt-1">{errorDetail}</div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Troubleshooting steps:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Check your internet connection</li>
                <li>Verify the backend canister is running</li>
                <li>Try refreshing the page</li>
                <li>Clear your browser cache and cookies</li>
                <li>Contact the system administrator if the issue persists</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRetryConnection} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Connection
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
                Refresh Page
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <div>Retry attempt: {retryAttempt}</div>
              <div>Connection phase: {connectionPhase}</div>
              <div>Health check status: {healthCheckStatus}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render loading state with progressive status
  if (connectionPhase !== 'ready') {
    const phaseMessages = {
      initializing: 'Initializing connection...',
      authenticating: 'Authenticating with Internet Identity...',
      connecting: 'Connecting to backend service...',
      verifying: 'Verifying connection health...',
      ready: 'Connection established',
      timeout: 'Connection timeout',
      error: 'Connection error'
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <CardTitle className="text-2xl">Connecting to Backend</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4" />
                    <span>{elapsedSeconds}s elapsed</span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{phaseMessages[connectionPhase]}</span>
                <Badge variant="outline">{connectionPhase}</Badge>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ 
                    width: connectionPhase === 'initializing' ? '20%' :
                           connectionPhase === 'authenticating' ? '40%' :
                           connectionPhase === 'connecting' ? '60%' :
                           connectionPhase === 'verifying' ? '80%' :
                           '100%'
                  }}
                />
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please wait while we establish a secure connection to the backend service. This may take a few seconds.
              </AlertDescription>
            </Alert>

            {elapsedSeconds > 10 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connection is taking longer than expected. If this persists, try refreshing the page or check your network connection.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main registration UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Admin Registration</h1>
          <p className="text-slate-600 dark:text-slate-400">Register Internet Identity principals as administrators</p>
        </div>

        {/* Your Principal ID Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              <CardTitle>Your Principal ID</CardTitle>
            </div>
            <CardDescription>
              This is your Internet Identity principal. You can register yourself or another principal as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                value={currentPrincipal}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={handleCopyPrincipal}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register New Admin</CardTitle>
            <CardDescription>
              Enter the principal ID of the user you want to register as an administrator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Principal ID</Label>
              <Input
                id="principal"
                value={principalInput}
                onChange={handlePrincipalInputChange}
                placeholder="Enter principal ID (e.g., xxxxx-xxxxx-xxxxx-xxxxx-xxx)"
                className="font-mono"
              />
              {principalIsAlreadyAdmin && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This principal is already registered as an admin
                </p>
              )}
            </div>

            <Button
              onClick={handleRegisterAdmin}
              disabled={isPending || !principalInput.trim()}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Register as Admin
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> Only existing admins can register new admins. If this is the first admin registration,
            the system will automatically allow it.
          </AlertDescription>
        </Alert>
      </div>

      {/* First Admin Confirmation Dialog */}
      <AlertDialog open={isFirstAdmin} onOpenChange={setIsFirstAdmin}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>First Admin Registration</AlertDialogTitle>
            <AlertDialogDescription>
              This appears to be the first admin registration for this system. Are you sure you want to proceed?
              This will grant full administrative privileges to the specified principal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstAdminConfirm}>
              Confirm Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <PartyPopper className="h-8 w-8 text-green-600" />
              <DialogTitle className="text-2xl">Registration Successful!</DialogTitle>
            </div>
            <DialogDescription>
              The principal has been successfully registered as an administrator.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                The new admin can now access all administrative features and register additional admins.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={handleSuccessDialogClose}>
              Close (Redirecting in {countdown}s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <DialogTitle className="text-2xl">{errorMessage}</DialogTitle>
            </div>
            <DialogDescription>{errorDetails}</DialogDescription>
          </DialogHeader>
          {isCanisterStoppedError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Canister Stopped:</strong> The backend canister needs to be started by a system administrator.
                Please contact support for assistance.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button onClick={() => setShowErrorDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
