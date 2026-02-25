import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores';
import { Button } from '../ui';

export function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-paper-300 bg-paper-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-lg font-semibold text-ink hover:text-primary-600 transition-colors"
        >
          <img src="/logo.svg" alt="" className="h-7 w-7 opacity-80" />
          Caderno
        </Link>

        {/* Desktop nav — hidden on md and smaller */}
        <nav className="hidden md:flex items-center gap-6">
          {isAuthenticated ? (
            <>
              <Link
                to="/entries"
                className="text-sm text-ink-500 hover:text-ink transition-colors"
              >
                {t('nav.entries')}
              </Link>
              <Link
                to="/safety-timer"
                className="text-sm text-ink-500 hover:text-ink transition-colors"
              >
                {t('nav.safetyTimer')}
              </Link>
              <Link
                to="/settings"
                className="text-sm text-ink-500 hover:text-ink transition-colors"
              >
                {t('nav.settings')}
              </Link>

              <div className="flex items-center gap-3 border-l border-paper-300 pl-6">
                <span className="text-sm text-ink-400">
                  {user?.email}
                </span>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  {t('auth.logout')}
                </Button>
              </div>
            </>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t('auth.login')}
              </Button>
            </Link>
          )}
        </nav>

        {/* Hamburger button — visible on md and smaller */}
        <button
          onClick={() => setMenuOpen(true)}
          className="md:hidden text-ink-500 hover:text-ink transition-colors"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile sliding drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-ink/30"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer panel */}
          <nav className="fixed inset-y-0 right-0 w-64 bg-paper-50 border-l border-paper-300 shadow-sm flex flex-col">
            {/* Drawer header */}
            <div className="flex h-14 items-center justify-between px-4 border-b border-paper-300">
              <span className="text-base font-semibold text-ink">
                Caderno
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-ink-500 hover:text-ink transition-colors"
                aria-label="Close menu"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {isAuthenticated ? (
                <div className="flex flex-col gap-0.5">
                  <Link
                    to="/entries"
                    className="rounded-sm px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 hover:text-ink transition-colors"
                  >
                    {t('nav.entries')}
                  </Link>
                  <Link
                    to="/safety-timer"
                    className="rounded-sm px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 hover:text-ink transition-colors"
                  >
                    {t('nav.safetyTimer')}
                  </Link>
                  <Link
                    to="/settings"
                    className="rounded-sm px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 hover:text-ink transition-colors"
                  >
                    {t('nav.settings')}
                  </Link>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="block rounded-sm px-3 py-2 text-sm text-ink-500 hover:bg-paper-200 hover:text-ink transition-colors"
                >
                  {t('auth.login')}
                </Link>
              )}
            </div>

            {/* Drawer footer — user info + logout */}
            {isAuthenticated && (
              <div className="border-t border-paper-300 px-4 py-4">
                <p className="text-sm text-ink-400 truncate">
                  {user?.email}
                </p>
                <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={handleLogout}>
                  {t('auth.logout')}
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
