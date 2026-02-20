import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserRole, useIsCallerAdmin } from '../hooks/useQueries';
import { Menu, X, Settings } from 'lucide-react';
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

  // Enhanced diagnostic logging for debugging admin link visibility
  useEffect(() => {
    const timestamp = new Date().toISOString();
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         Navbar Admin Link Visibility Diagnostic               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log(`[${timestamp}] Timestamp:`, timestamp);
    console.log('');
    console.log('--- Authentication State ---');
    console.log(`[${timestamp}] isAuthenticated:`, isAuthenticated);
    console.log(`[${timestamp}] identity exists:`, !!identity);
    console.log(`[${timestamp}] identity principal:`, identity?.getPrincipal().toString());
    console.log(`[${timestamp}] actor available:`, !!actor);
    console.log('');
    console.log('--- Method 1: useGetCallerUserRole ---');
    console.log(`[${timestamp}] userRole value:`, userRole);
    console.log(`[${timestamp}] userRole type:`, typeof userRole);
    console.log(`[${timestamp}] roleLoading:`, roleLoading);
    console.log(`[${timestamp}] roleFetched:`, roleFetched);
    console.log(`[${timestamp}] roleError:`, roleError);
    console.log(`[${timestamp}] Comparison (userRole === "admin"):`, userRole === 'admin');
    console.log(`[${timestamp}] isAdmin derived:`, isAdmin);
    console.log('');
    console.log('--- Method 2: useIsCallerAdmin ---');
    console.log(`[${timestamp}] isAdminDirect value:`, isAdminDirect);
    console.log(`[${timestamp}] isAdminDirect type:`, typeof isAdminDirect);
    console.log(`[${timestamp}] adminLoading:`, adminLoading);
    console.log(`[${timestamp}] adminFetched:`, adminFetched);
    console.log(`[${timestamp}] adminError:`, adminError);
    console.log('');
    console.log('--- Visibility Logic ---');
    console.log(`[${timestamp}] Method 1 condition (!roleLoading && isAdmin):`, !roleLoading && isAdmin);
    console.log(`[${timestamp}] Method 2 condition (!adminLoading && isAdminDirect):`, !adminLoading && isAdminDirect);
    console.log(`[${timestamp}] Combined condition (Method 1 OR Method 2):`, (!roleLoading && isAdmin) || (!adminLoading && isAdminDirect));
    console.log('');
    console.log('--- Final Decision ---');
    const shouldShowAdminLink = (!roleLoading && isAdmin) || (!adminLoading && isAdminDirect);
    console.log(`[${timestamp}] Should show Admin Panel link:`, shouldShowAdminLink);
    console.log('═══════════════════════════════════════════════════════════════');
  }, [isAuthenticated, identity, actor, userRole, roleLoading, roleFetched, roleError, isAdmin, isAdminDirect, adminLoading, adminFetched, adminError]);

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      navigate({ to: '/' });
    } else {
      await login();
    }
  };

  // Show Admin Setup link only for authenticated users who are NOT admins
  const showAdminSetupLink = isAuthenticated && !roleLoading && !isAdmin;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Concept Delta
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
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
            {/* Admin Panel Link - Using fallback logic with both verification methods */}
            {((!roleLoading && isAdmin) || (!adminLoading && isAdminDirect)) && (
              <Link
                to="/admin"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Admin Panel
              </Link>
            )}
            {/* Admin Setup Link - Only for authenticated non-admin users */}
            {showAdminSetupLink && (
              <Link
                to="/admin/register"
                className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium"
              >
                <Settings className="h-4 w-4" />
                Admin Setup
              </Link>
            )}
            <Button
              onClick={handleAuth}
              disabled={isLoggingIn}
              variant={isAuthenticated ? 'outline' : 'default'}
            >
              {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              to="/"
              className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {/* Admin Panel Link - Mobile */}
            {((!roleLoading && isAdmin) || (!adminLoading && isAdminDirect)) && (
              <Link
                to="/admin"
                className="block px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            {/* Admin Setup Link - Mobile */}
            {showAdminSetupLink && (
              <Link
                to="/admin/register"
                className="flex items-center gap-2 px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Admin Setup
              </Link>
            )}
            <div className="px-4 pt-2">
              <Button
                onClick={() => {
                  handleAuth();
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingIn}
                variant={isAuthenticated ? 'outline' : 'default'}
                className="w-full"
              >
                {isLoggingIn ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Login'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
