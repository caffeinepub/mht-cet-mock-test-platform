/**
 * AdminRegistration Component
 * 
 * This page remains fully functional and accessible via direct URL navigation at '/admin/register'.
 * Users can access this page by typing the URL directly in their browser, even though the navigation
 * link has been removed from the Navbar component. All admin registration functionality, including
 * validation, authentication checks, and user interface elements, remain intact and operational.
 */

import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminRegistration } from '../hooks/useAdminRegistration';
import { useGetCallerUserRole } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Copy, CheckCircle2, AlertCircle, ShieldAlert, Loader2, PartyPopper } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { UserRole__1 } from '../backend';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminRegistration() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [principalInput, setPrincipalInput] = useState('');
  const { mutate: registerAdmin, isPending } = useAdminRegistration();
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [proceedWithRegistration, setProceedWithRegistration] = useState(false);
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString() || '';
  const isAdmin = userRole === UserRole__1.admin;

  // Determine if the actor is still loading
  const isActorLoading = actorFetching || !actor;
  
  // Disable form while actor is loading or during submission
  const isFormDisabled = isPending || isActorLoading;

  // Hide the registration form if user is already an admin
  const showRegistrationForm = !isAdmin || roleLoading;

  // Auto-navigate after successful first admin registration
  useEffect(() => {
    if (showSuccessDialog && isFirstAdmin) {
      const timer = setTimeout(() => {
        navigate({ to: '/admin' });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessDialog, isFirstAdmin, navigate]);

  const handleCopyPrincipal = () => {
    if (currentPrincipal) {
      navigator.clipboard.writeText(currentPrincipal);
      toast.success('Copied!', {
        description: 'Your principal has been copied to clipboard.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!principalInput.trim()) {
      toast.error('Validation Error', {
        description: 'Please enter a principal ID.',
      });
      return;
    }

    // Check if actor is available before proceeding
    if (!actor || actorFetching) {
      toast.error('Connection Not Ready', {
        description: 'Backend connection is still initializing. Please wait a moment and try again.',
      });
      return;
    }

    // Show info dialog before proceeding
    setShowInfoDialog(true);
  };

  const handleProceedWithRegistration = () => {
    setShowInfoDialog(false);
    setProceedWithRegistration(true);

    registerAdmin(principalInput.trim(), {
      onSuccess: ({ result }) => {
        if (result.__kind__ === 'success') {
          // Determine if this was the first admin registration
          const wasFirstAdmin = principalInput.trim() === currentPrincipal;
          setIsFirstAdmin(wasFirstAdmin);
          
          // Invalidate user role queries to refresh admin status
          queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
          queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
          
          // Show success dialog
          setShowSuccessDialog(true);
          setPrincipalInput('');
        } else if (result.__kind__ === 'unauthorized') {
          setErrorMessage(
            'Unauthorized: Only admins can assign user roles. After the initial setup, only existing administrators can register new admins.'
          );
          setShowErrorDialog(true);
        }
      },
      onError: (error: Error) => {
        if (error.message.includes('Unauthorized')) {
          setErrorMessage(
            'Unauthorized: Only admins can assign user roles. You do not have permission to register new administrators.'
          );
          setShowErrorDialog(true);
        }
      },
      onSettled: () => {
        setProceedWithRegistration(false);
      },
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              Please log in with Internet Identity to access admin registration.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show success message if user is now an admin after registration
  if (isAdmin && roleFetched && !roleLoading && !showRegistrationForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              You Are an Administrator
            </CardTitle>
            <CardDescription>
              You have successfully been registered as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              You now have full administrative privileges. You can access the admin dashboard to manage tests, questions, and users.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate({ to: '/admin' })} className="flex-1">
                Go to Admin Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Admin Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Register Internet Identity principals as administrators
          </p>
        </div>

        {/* Backend Connection Status */}
        {isActorLoading && (
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-spin" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    Connecting to backend...
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Please wait while we establish a connection to the backend service.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              Your Principal ID
            </CardTitle>
            <CardDescription>
              This is your Internet Identity principal. You can register yourself or another principal as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-sm break-all">
                {currentPrincipal}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPrincipal}
                disabled={!currentPrincipal}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Register Admin</CardTitle>
            <CardDescription>
              Enter the principal ID of the user you want to register as an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Principal ID</Label>
                <Input
                  id="principal"
                  type="text"
                  placeholder="Enter principal ID"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  disabled={isFormDisabled}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paste the principal ID of the user you want to make an admin. You can use your own principal ID shown above.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isFormDisabled}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : isActorLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Register as Admin'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold">Important Information:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>The first admin registration requires no authorization</li>
                  <li>After the first admin is registered, only existing admins can register new admins</li>
                  <li>Admin privileges grant full access to create tests, questions, and manage users</li>
                  <li>Make sure to register a trusted principal as the first admin</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              Confirm Admin Registration
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to register the following principal as an administrator:
              </p>
              <code className="block bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded text-xs break-all">
                {principalInput}
              </code>
              <p className="text-amber-600 dark:text-amber-400 font-medium">
                Admin privileges grant full access to the platform. Make sure you trust this principal.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedWithRegistration}>
              Confirm Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Registration Failed
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-red-600 dark:text-red-400">{errorMessage}</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-green-600" />
              {isFirstAdmin ? 'You are now registered as the first admin!' : 'Admin Registered Successfully'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {isFirstAdmin ? (
                <>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    Congratulations! You have been registered as the first administrator.
                  </p>
                  <p>
                    You now have full administrative privileges. Redirecting to admin dashboard...
                  </p>
                </>
              ) : (
                <p className="text-green-600 dark:text-green-400">
                  The principal has been successfully registered as an administrator.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setShowSuccessDialog(false);
              if (isFirstAdmin) {
                navigate({ to: '/admin' });
              }
            }}>
              {isFirstAdmin ? 'Go to Dashboard' : 'Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
