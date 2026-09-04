import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { Sidebar } from './Sidebar';

export function Layout() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const shellStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
  };

  // Logged-out visitors see a simple top nav (marketing pages) — no app sidebar.
  if (!isLoggedIn) {
    return (
      <div style={{ ...shellStyle, display: 'flex', flexDirection: 'column' }}>
        <header
          className="nav"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            gap: 'var(--space-6)',
            flexWrap: 'wrap',
            padding: '10px clamp(14px,4vw,40px)',
            background: 'color-mix(in srgb, var(--color-bg) 88%, transparent)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 1px 0 var(--color-divider)',
          }}
        >
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 'auto', textDecoration: 'none' }}>
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
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px,2vw,20px)', fontSize: 14 }}>
            <Link to="/pricing">Pricing</Link>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            <button className="btn btn-secondary" onClick={() => navigate('/login')}>Log in</button>
            <button className="btn btn-primary" onClick={() => navigate('/register')}>Start free</button>
          </div>
        </header>
        <Outlet />
      </div>
    );
  }

  // Logged-in app shell: sidebar + content, laid out with CSS Grid so the
  // sidebar column is always reserved space — it can never overlap content.
  return (
    <div className="app-shell" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)' }}>
      <div className="app-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div
        className="app-topbar-mobile"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'color-mix(in srgb, var(--color-bg) 92%, transparent)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 1px 0 var(--color-divider)',
        }}
      >
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ width: 20, height: 20, border: '1px solid var(--color-accent)', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--color-accent)' }}>i</span>
          <span style={{ fontSize: 14 }}>iMath</span>
        </Link>
        <button className="btn btn-ghost btn-icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          ☰
        </button>
      </div>

      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{ width: 250, height: '100%', overflow: 'hidden', background: 'var(--color-bg)', borderRight: '1px solid var(--color-divider)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="app-content" style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}
