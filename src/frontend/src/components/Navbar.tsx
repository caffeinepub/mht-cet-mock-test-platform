import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole, useIsCallerAdmin } from '../hooks/useQueries';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useActor } from '../hooks/useActor';

export default function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { actor } = useActor();
  
  // Primary verification method: useGetCallerUserRole
  const { data: userRole, isLoading: roleLoading, error: roleError, isFetched: roleFetched } = useGetCallerUserRole();
  
  // Secondary verification method: useIsCallerAdmin
  const { data: isAdminDirect, isLoading: adminLoading, error: adminError, isFetched: adminFetched } = useIsCallerAdmin();
  
  const isAuthenticated = !!identity;
  const isAdmin = userRole === 'admin';

  // Direct backend actor query for independent verification
  useEffect(() => {
    const verifyRoleDirectly = async () => {
      if (!actor || !isAuthenticated) return;
      
      const timestamp = new Date().toISOString();
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════╗');
      console.log('║         Navbar Direct Backend Verification Check              ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
      console.log(`[${timestamp}] Initiating direct actor.getUserRole() call...`);
      
      try {
        const directRoleResponse = await actor.getUserRole();
        console.log(`[${timestamp}] ✓ Direct call successful`);
        console.log(`[${timestamp}] Direct response:`, directRoleResponse);
        console.log(`[${timestamp}] Direct response type:`, typeof directRoleResponse);
        console.log(`[${timestamp}] Direct response stringified:`, JSON.stringify(directRoleResponse));
        
        console.log('');
        console.log('--- Comparison with Hook Result ---');
        console.log(`[${timestamp}] Hook userRole value:`, userRole);
        console.log(`[${timestamp}] Hook userRole type:`, typeof userRole);
        console.log(`[${timestamp}] Hook isAdmin derived:`, isAdmin);
        
        // Check for discrepancies
        const directIsAdmin = 
          (directRoleResponse && typeof directRoleResponse === 'object' && '__kind__' in directRoleResponse && (directRoleResponse as any).__kind__ === 'admin') ||
          (typeof directRoleResponse === 'string' && directRoleResponse === 'admin') ||
          (directRoleResponse && typeof directRoleResponse === 'object' && Object.keys(directRoleResponse).includes('admin'));
        
        console.log(`[${timestamp}] Direct call indicates admin:`, directIsAdmin);
        console.log(`[${timestamp}] Hook indicates admin:`, isAdmin);
        
        if (directIsAdmin !== isAdmin) {
          console.warn(`[${timestamp}] ⚠️ DISCREPANCY DETECTED!`);
          console.warn(`[${timestamp}] Direct call says admin: ${directIsAdmin}`);
          console.warn(`[${timestamp}] Hook says admin: ${isAdmin}`);
          console.warn(`[${timestamp}] This indicates a parsing issue in the hook!`);
        } else {
          console.log(`[${timestamp}] ✓ Direct call and hook results match`);
        }
        
      } catch (error) {
        console.error(`[${timestamp}] ❌ ERROR in direct getUserRole call:`, error);
        console.error(`[${timestamp}] Error details:`, JSON.stringify(error, null, 2));
      }
      
      console.log('═══════════════════════════════════════════════════════════════');
    };

    verifyRoleDirectly();
  }, [actor, isAuthenticated, userRole, isAdmin]);

  // Comprehensive diagnostic logging
  useEffect(() => {
    if (!isAuthenticated) return;

    const timestamp = new Date().toISOString();
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              Navbar Admin Status Diagnostic                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`[${timestamp}] Authentication Status: ${isAuthenticated ? '✓ Authenticated' : '✗ Not Authenticated'}`);
    console.log(`[${timestamp}] Principal: ${identity?.getPrincipal().toString() || 'N/A'}`);
    console.log('');
    console.log('--- Primary Method: useGetCallerUserRole ---');
    console.log(`[${timestamp}] Loading: ${roleLoading}`);
    console.log(`[${timestamp}] Fetched: ${roleFetched}`);
    console.log(`[${timestamp}] Role Value: ${userRole}`);
    console.log(`[${timestamp}] Role Type: ${typeof userRole}`);
    console.log(`[${timestamp}] Is Admin (derived): ${isAdmin}`);
    if (roleError) {
      console.error(`[${timestamp}] Error:`, roleError);
    }
    console.log('');
    console.log('--- Secondary Method: useIsCallerAdmin ---');
    console.log(`[${timestamp}] Loading: ${adminLoading}`);
    console.log(`[${timestamp}] Fetched: ${adminFetched}`);
    console.log(`[${timestamp}] Is Admin (direct): ${isAdminDirect}`);
    if (adminError) {
      console.error(`[${timestamp}] Error:`, adminError);
    }
    console.log('');
    console.log('--- Fallback Logic ---');
    const fallbackIsAdmin = isAdmin || (isAdminDirect === true);
    console.log(`[${timestamp}] Final Admin Status (with fallback): ${fallbackIsAdmin}`);
    console.log('═══════════════════════════════════════════════════════════════');
  }, [isAuthenticated, identity, userRole, roleLoading, roleFetched, roleError, isAdminDirect, adminLoading, adminFetched, adminError, isAdmin]);

  const handleLogout = async () => {
    await clear();
    navigate({ to: '/' });
  };

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Use fallback logic: if either method confirms admin, show admin links
  const showAdminLinks = isAdmin || (isAdminDirect === true);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Concept Delta
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Dashboard
              </Link>
            )}
            {showAdminLinks && (
              <Link
                to="/admin"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Admin
              </Link>
            )}
            <Button
              onClick={isAuthenticated ? handleLogout : handleLogin}
              disabled={isLoggingIn}
              variant={isAuthenticated ? 'outline' : 'default'}
            >
              {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/"
              className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {showAdminLinks && (
              <Link
                to="/admin"
                className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}
            <Button
              onClick={() => {
                if (isAuthenticated) {
                  handleLogout();
                } else {
                  handleLogin();
                }
                setMobileMenuOpen(false);
              }}
              disabled={isLoggingIn}
              variant={isAuthenticated ? 'outline' : 'default'}
              className="w-full"
            >
              {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
