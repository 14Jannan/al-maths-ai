import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';

const freeFeatures = [
  '10 tutor questions a day',
  'All topics and past papers',
  'Step-by-step working',
  'English + Tamil',
];

const premiumFeatures = [
  'Unlimited tutor questions',
  'Model answers for every paper question',
  'Generated practice sets by topic',
  'Priority response time',
];

export function Pricing() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px,6vw,64px) clamp(18px,4vw,40px) 64px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Simple pricing</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>
          Free covers the whole syllabus. Premium removes the daily limit.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--space-6)' }}>
        {/* Free plan */}
        <div className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)' }}>
          <div className="tag tag-neutral" style={{ alignSelf: 'flex-start' }}>Free</div>
          <div>
            <span style={{ fontSize: 34, fontFamily: 'var(--font-heading)' }}>Rs. 0</span>
            <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}> / forever</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 14 }}>
            {freeFeatures.map((f) => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-accent)' }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}
          >
            {isLoggedIn ? 'Current plan' : 'Start free'}
          </button>
        </div>

        {/* Premium plan */}
        <div
          className="card elev-sm"
          style={{ padding: 'var(--space-6)', gap: 'var(--space-4)', border: '1px solid var(--color-accent)' }}
        >
          <div className="tag tag-accent" style={{ alignSelf: 'flex-start' }}>Premium</div>
          <div>
            <span style={{ fontSize: 34, fontFamily: 'var(--font-heading)' }}>Rs. 990</span>
            <span style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}> / month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 14 }}>
            {premiumFeatures.map((f) => (
              <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--color-accent)' }}>✓</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
          {/* Payment integration (PayHere) isn't wired up yet — this is a
              placeholder button so the page is complete and ready for that
              next step. */}
          <button className="btn btn-primary btn-block" disabled title="Payment integration coming soon">
            Upgrade — coming soon
          </button>
        </div>
      </div>
    </main>
  );
}