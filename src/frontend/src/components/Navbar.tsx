import { Link, useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { GraduationCap, LogOut, LogIn, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export default function Navbar() {
  const { identity, clear, login, loginStatus } = useInternetIdentity();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Dual admin verification using both hooks
  const { data: userRole, isLoading: roleLoading, isFetched: roleFetched } = useGetCallerUserRole();
  const { data: isAdminCheck, isLoading: adminCheckLoading, isFetched: adminCheckFetched } = useIsCallerAdmin();
  
  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  // Comprehensive diagnostic logging for role changes
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] === Navbar Role State Update ===`);
    console.log(`[${timestamp}] isAuthenticated: ${isAuthenticated}`);
    console.log(`[${timestamp}] userRole: ${userRole}`);
    console.log(`[${timestamp}] roleLoading: ${roleLoading}`);
    console.log(`[${timestamp}] roleFetched: ${roleFetched}`);
    console.log(`[${timestamp}] isAdminCheck: ${isAdminCheck}`);
    console.log(`[${timestamp}] adminCheckLoading: ${adminCheckLoading}`);
    console.log(`[${timestamp}] adminCheckFetched: ${adminCheckFetched}`);
    console.log(`[${timestamp}] Should show Admin link: ${isAuthenticated && (userRole === 'admin' || isAdminCheck === true)}`);
  }, [isAuthenticated, userRole, roleLoading, roleFetched, isAdminCheck, adminCheckLoading, adminCheckFetched]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/' });
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  // Determine if user is admin using both checks
  const isAdmin = isAuthenticated && (userRole === 'admin' || isAdminCheck === true);
  const showAdminSetupLink = isAuthenticated && !isAdmin && !roleLoading && !adminCheckLoading && roleFetched && adminCheckFetched;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <GraduationCap className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Concept Delta
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Home
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Dashboard
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
              >
                Admin
              </Link>
            )}

            {showAdminSetupLink && (
              <Link
                to="/admin/register"
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-semibold"
              >
                Admin Setup
              </Link>
            )}

            {/* Auth Button */}
            {isAuthenticated ? (
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                disabled={isLoggingIn}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button
                onClick={handleLogin}
                size="sm"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
