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

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  );
}

  // Logged-in app shell: sidebar + content.
  return (
    <div style={{ ...shellStyle, display: 'flex' }}>
      {/* Desktop sidebar — width is fixed and overflow is clipped so nothing
          inside (like a long chat title) can ever force this box wider. */}
      <div
        className="app-sidebar-desktop"
        style={{ borderRight: '1px solid var(--color-divider)', overflow: 'hidden' }}
      >
        <Sidebar />
      </div>

      {/* Mobile top bar + slide-over sidebar — shown/hidden via explicit
          media-query classes (index.css), not Tailwind's md: variants, so
          this doesn't depend on Tailwind's responsive class generation. */}
      <div
        className="app-topbar-mobile"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
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
          className="app-topbar-mobile"
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

      <div className="app-content-wrapper" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Spacer so content isn't hidden behind the fixed mobile top bar */}
        <div className="app-topbar-mobile" style={{ height: 52 }} />
        <Outlet />
      </div>
    </div>
  );
}