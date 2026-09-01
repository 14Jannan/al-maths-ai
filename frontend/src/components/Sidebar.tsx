import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/use-auth';
import { getSubscriptionStatus } from '../lib/payments';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tutor', label: 'AI Tutor' },
  { to: '/topics', label: 'Topics' },
  { to: '/papers', label: 'Past Papers' },
  { to: '/resources', label: 'Resources' },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, isAdmin, logout } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: getSubscriptionStatus,
  });

  const isPremium = subscription?.isPremium ?? false;
  const initials = (email ?? '?').slice(0, 2).toUpperCase();

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-4) var(--space-3)' }}>
      <Link
        to="/dashboard"
        onClick={onNavigate}
        style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', padding: '4px 6px', marginBottom: 'var(--space-6)' }}
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
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>iMath</span>
      </Link>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            style={{
              fontSize: 14,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: isActive(item.to) ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
              background: isActive(item.to) ? 'var(--color-surface)' : 'transparent',
              fontWeight: isActive(item.to) ? 500 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            style={{
              fontSize: 14,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              marginTop: 'var(--space-3)',
              color: isActive('/admin') ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
              background: isActive('/admin') ? 'var(--color-surface)' : 'transparent',
            }}
          >
            Admin
          </Link>
        )}
      </nav>

      <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {!isPremium && (
          <button
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: '6px 10px' }}
            onClick={() => {
              navigate('/pricing');
              onNavigate?.();
            }}
          >
            Upgrade to Premium
          </button>
        )}

        <button
          onClick={() => {
            navigate('/account');
            onNavigate?.();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--color-surface)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            <div style={{ fontSize: 11, color: isPremium ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {isPremium ? 'Premium' : 'Free plan'}
            </div>
          </span>
        </button>

        <button className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--color-neutral-300)' }} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}