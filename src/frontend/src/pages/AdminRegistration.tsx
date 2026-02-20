import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useAdminRegistration } from '../hooks/useAdminRegistration';
import { useGetCallerUserRole } from '../hooks/useQueries';
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
import { Copy, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { UserRole__1 } from '../backend';

export default function AdminRegistration() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [principalInput, setPrincipalInput] = useState('');
  const { mutate: registerAdmin, isPending } = useAdminRegistration();
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();

  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [proceedWithRegistration, setProceedWithRegistration] = useState(false);

  const isAuthenticated = !!identity;
  const currentPrincipal = identity?.getPrincipal().toString() || '';
  const isAdmin = userRole === UserRole__1.admin;

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

    // Show info dialog before proceeding
    setShowInfoDialog(true);
  };

  const handleProceedWithRegistration = () => {
    setShowInfoDialog(false);
    setProceedWithRegistration(true);

    registerAdmin(principalInput.trim(), {
      onSuccess: ({ result }) => {
        if (result.__kind__ === 'success') {
          setPrincipalInput('');
          // Navigate to admin dashboard after successful registration
          setTimeout(() => {
            navigate({ to: '/admin' });
          }, 2000);
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

        {/* Admin Status Badge */}
        {!roleLoading && isAdmin && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    You are an Administrator
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    You have permission to register other users as admins.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Initial Setup:</p>
              <p>
                The first admin registration does not require authorization. Anyone can register the first admin to initialize the system.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Adding More Admins:</p>
              <p>
                After the initial setup, only existing admins can register new admins. This ensures secure access control.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-gray-900 dark:text-white">Your Principal:</p>
              <p>
                Use the principal ID displayed below to register yourself or copy another user's principal to grant them admin access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current User Principal Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Internet Identity Principal</CardTitle>
            <CardDescription>
              This is your unique identifier. Copy it to register yourself as an admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 font-mono text-sm break-all">
                {currentPrincipal}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPrincipal}
                title="Copy principal"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Registration Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Register Admin</CardTitle>
            <CardDescription>
              Enter the Internet Identity principal to grant admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Internet Identity Principal</Label>
                <Input
                  id="principal"
                  type="text"
                  placeholder="Enter principal ID (e.g., 2vxsx-fae...)"
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  disabled={isPending}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Paste the principal ID of the user you want to register as admin
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isPending || !principalInput.trim()}
                  className="flex-1"
                >
                  {isPending ? 'Registering...' : 'Register as Admin'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '/' })}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Action Card */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Quick Tip
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  To register yourself as admin, copy your principal from above and paste it into the registration form.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Dialog - Shows before registration */}
      <AlertDialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Admin Role Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Only admin can assign user roles
              </p>
              <p>
                This is an admin-protected operation. After the initial setup, only existing administrators have permission to register new admins.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> If this is the first admin registration (no admins exist yet), the registration will proceed without authorization checks for initial system setup.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedWithRegistration}>
              Proceed with Registration
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog - Shows unauthorized errors */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Registration Failed
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {errorMessage}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you believe you should have admin access, please contact an existing administrator to register your principal.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
