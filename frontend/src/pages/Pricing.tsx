import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/AuthContext';
import { startUpgrade, getSubscriptionStatus } from '../lib/payments';

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
  const { isLoggedIn, email } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: getSubscriptionStatus,
    enabled: isLoggedIn,
  });

  async function handleUpgrade() {
    if (!isLoggedIn || !email) {
      navigate('/login');
      return;
    }
    setIsProcessing(true);
    setMessage(null);
    await startUpgrade(email, (success) => {
      setIsProcessing(false);
      setMessage(success ? 'Payment completed — your plan will update shortly.' : 'Payment was not completed.');
    });
  }

  const isPremium = subscription?.isPremium ?? false;

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(32px,6vw,64px) clamp(18px,4vw,40px) 64px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Simple pricing</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>
          Free covers the whole syllabus. Premium removes the daily limit.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--space-6)' }}>
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
          <button className="btn btn-secondary btn-block" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/register')}>
            {isPremium ? 'Downgrade' : isLoggedIn ? 'Current plan' : 'Start free'}
          </button>
        </div>

        <div className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)', border: '1px solid var(--color-accent)' }}>
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
          <button className="btn btn-primary btn-block" onClick={handleUpgrade} disabled={isProcessing || isPremium}>
            {isPremium ? 'Active' : isProcessing ? 'Opening checkout…' : 'Upgrade now'}
          </button>
          {message && <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}>{message}</div>}
        </div>
      </div>
    </main>
  );
}