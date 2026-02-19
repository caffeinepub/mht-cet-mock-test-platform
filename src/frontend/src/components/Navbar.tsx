import { Link, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    clear();
    navigate({ to: '/' });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-[oklch(0.145_0_240)] text-white shadow-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <span className="text-2xl font-bold">Δ</span>
          </div>
          <span className="text-xl font-bold">Concept Delta</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-6 md:flex">
          {identity ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium transition-colors hover:text-white/80"
              >
                Dashboard
              </Link>
              <Link
                to="/admin"
                className="text-sm font-medium transition-colors hover:text-white/80"
              >
                Admin
              </Link>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="bg-white text-[oklch(0.145_0_240)] hover:bg-white/90"
            >
              {isLoggingIn ? 'Connecting...' : 'Login'}
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[oklch(0.145_0_240)] md:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
            {identity ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium transition-colors hover:text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin"
                  className="text-sm font-medium transition-colors hover:text-white/80"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="outline"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  handleLogin();
                  setMobileMenuOpen(false);
                }}
                disabled={isLoggingIn}
                className="bg-white text-[oklch(0.145_0_240)] hover:bg-white/90"
              >
                {isLoggingIn ? 'Connecting...' : 'Login'}
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
