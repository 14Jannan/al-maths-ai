import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export function Layout() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCurrent = (path: string) => (location.pathname === path ? 'page' : undefined);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        className="nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          gap: 'var(--space-6)',
          padding: '10px clamp(14px,4vw,40px)',
          background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 0 var(--color-divider)',
          flexWrap: 'wrap',
        }}
      >
        <Link
          className="nav-brand"
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 'auto', textDecoration: 'none' }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              border: '1px solid var(--color-accent)',
              borderRadius: 6,
              display: 'grid',
              placeItems: 'center',
              fontSize: 12,
              color: 'var(--color-accent)',
              fontWeight: 600,
            }}
          >
            i
          </span>
          <span>iMath</span>
        </Link>

        {isLoggedIn ? (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,20px)', flexWrap: 'wrap', fontSize: 14 }}>
            <Link to="/dashboard" aria-current={isCurrent('/dashboard')}>Dashboard</Link>
            <Link to="/tutor" aria-current={isCurrent('/tutor')}>AI Tutor</Link>
            <Link to="/topics" aria-current={isCurrent('/topics')}>Topics</Link>
            <Link to="/papers" aria-current={isCurrent('/papers')}>Past Papers</Link>
            <Link to="/resources" aria-current={isCurrent('/resources')}>Resources</Link>
          </nav>
        ) : (
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,20px)', flexWrap: 'wrap', fontSize: 14 }}>
            <Link to="/pricing" aria-current={isCurrent('/pricing')}>Pricing</Link>
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {isLoggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Link to="/pricing" style={{ fontSize: 13 }} aria-current={isCurrent('/pricing')}>Pricing</Link>
              <button
                className="btn btn-icon btn-secondary"
                title="Account"
                onClick={() => navigate('/account')}
                style={{ borderRadius: '50%', fontSize: 12, letterSpacing: '0.02em' }}
              >
                {/* Simple initials avatar placeholder */}
                AC
              </button>
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/login')}>Log in</button>
              <button className="btn btn-primary" onClick={() => navigate('/register')}>Start free</button>
            </div>
          )}
        </div>
      </header>

      {/* Outlet renders whichever page's route matched — this is how nested routing works */}
      <Outlet />
    </div>
  );
}
