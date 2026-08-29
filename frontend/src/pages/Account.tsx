import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';

export function Account() {
  const { email, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 640, margin: '0 auto', padding: 'clamp(32px,6vw,64px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-8)' }}>Account</h2>

      <div className="card" style={{ padding: 'var(--space-6)', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 4 }}>
            Email
          </div>
          <div style={{ fontSize: 15 }}>{email ?? '—'}</div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-4)' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 4 }}>
            Plan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span className="tag tag-neutral">Free</span>
            <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/pricing')}>
              View plans
            </button>
          </div>
        </div>

        {isAdmin && (
          <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-4)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 4 }}>
              Admin
            </div>
            <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/admin')}>
              Manage topics
            </button>
          </div>
        )}
      </div>

      <button className="btn btn-ghost" style={{ color: 'var(--color-neutral-300)' }} onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}