import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/use-auth';
import { useTheme } from '../lib/use-theme';
import { getSubscriptionStatus } from '../lib/payments';

function SettingsRow({ title, description, control }: { title: string; description: string; control: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 'var(--space-6)',
        flexWrap: 'wrap',
        padding: 'var(--space-4) 0',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14.5 }}>{title}</div>
        <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginTop: 2 }}>
          {description}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 'var(--space-8)' }}>
      <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-3)' }}>{title}</h6>
      <div className="card elev-sm" style={{ padding: '0 var(--space-5)', gap: 0 }}>
        {children}
      </div>
    </section>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid var(--color-divider)' }} />;
}

export function Settings() {
  const { email, username, isAdmin, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const { data: subscription } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: getSubscriptionStatus,
  });
  const isPremium = subscription?.isPremium ?? false;

  // A username-less legacy account falls back to email for display —
  // show it only once (as the name), and derive initials from letters
  // only, so an email like "1407jannan@..." doesn't show "14".
  const displayName = username ?? email ?? '—';
  const showEmailSubtitle = Boolean(email) && email !== displayName;
  const letters = (username ?? email ?? '').match(/[a-zA-Z]/g) ?? [];
  const initials = (letters.slice(0, 2).join('') || '?').toUpperCase();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 720, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Settings</h2>
      <p style={{ margin: '0 0 var(--space-8)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Manage your account, appearance, and how iMath works for you.
      </p>

      {/* Account */}
      <SettingsSection title="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0' }}>
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--color-inset)',
              display: 'grid',
              placeItems: 'center',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              color: 'var(--color-accent)',
            }}
          >
            {initials}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </div>
            {showEmailSubtitle && (
              <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                {email}
              </div>
            )}
          </div>
          <button className="btn btn-secondary" style={{ fontSize: 12.5, flexShrink: 0 }} onClick={() => navigate('/account')}>
            Manage
          </button>
        </div>

        <Divider />

        <SettingsRow
          title="Plan"
          description={isPremium ? 'Unlimited questions and full model answers.' : '10 free tutor questions a day.'}
          control={
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className={isPremium ? 'tag tag-accent' : 'tag tag-neutral'}>{isPremium ? 'Premium' : 'Free'}</span>
              {!isPremium && (
                <button className="btn btn-success" style={{ fontSize: 12.5, padding: '5px 10px' }} onClick={() => navigate('/pricing')}>
                  Upgrade
                </button>
              )}
            </div>
          }
        />

        {isAdmin && (
          <>
            <Divider />
            <SettingsRow
              title="Admin panel"
              description="Manage topics, papers, resources, and users."
              control={
                <button className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={() => navigate('/admin')}>
                  Open admin
                </button>
              }
            />
          </>
        )}
      </SettingsSection>

      {/* Appearance */}
      <SettingsSection title="Appearance">
        <SettingsRow
          title="Theme"
          description="Switch between dark and light mode. Saved on this device."
          control={
            <div className="seg">
              <label className="seg-opt">
                <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => setTheme('dark')} />
                🌙 Dark
              </label>
              <label className="seg-opt">
                <input type="radio" name="theme" checked={theme === 'light'} onChange={() => setTheme('light')} />
                ☀️ Light
              </label>
            </div>
          }
        />
      </SettingsSection>

      {/* Security */}
      <SettingsSection title="Security">
        <SettingsRow
          title="Password"
          description="Reset it by email — a 6-digit code confirms it's you."
          control={
            <button className="btn btn-secondary" style={{ fontSize: 12.5 }} onClick={() => navigate('/forgot-password')}>
              Change password
            </button>
          }
        />
        <Divider />
        <SettingsRow
          title="Sign out"
          description="End your session on this device."
          control={
            <button className="btn btn-danger" style={{ fontSize: 12.5 }} onClick={handleLogout}>
              Log out
            </button>
          }
        />
      </SettingsSection>

      {/* About */}
      <section>
        <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-3)' }}>About</h6>
        <div className="card elev-sm" style={{ padding: 'var(--space-5)', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 24, height: 24, border: '1px solid var(--color-accent)', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>
              i
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>iMath</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)', margin: 0 }}>
            An AI tutor for G.C.E. Advanced Level Combined Mathematics, built to stay inside the official
            Sri Lankan syllabus — nothing extra, nothing missing, in English and Tamil.
          </p>
          <Divider />
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div>Past papers sourced from Past Papers WiKi, MathsApi, and ExamKuppiya.</div>
            <div>Not affiliated with the Department of Examinations, Sri Lanka.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
