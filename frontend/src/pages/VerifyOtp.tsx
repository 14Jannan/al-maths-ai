import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

export function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyOtp(email, code);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setResendMessage(null);
    try {
      await resendOtp(email);
      setResendMessage('A new code was sent to your email.');
    } catch {
      setResendMessage('Could not resend right now. Try again shortly.');
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    // Someone landed here directly without registering first
    return (
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 'var(--space-4)' }}>No email to verify. Start by registering.</p>
          <Link to="/register" className="btn btn-primary">Go to register</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px) clamp(18px,4vw,40px)' }}>
      <div style={{ width: 'min(400px,100%)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Check your email</h2>
        <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', marginBottom: 'var(--space-8)' }}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your account.
        </p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={handleSubmit}>
          <div className="field">
            <label>Verification code</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              required
              style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
            />
            {error && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)' }}>{error}</div>
            )}
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting || code.length !== 6} style={{ padding: 9 }}>
            {isSubmitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <div className="hr" />
        <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div>
            Didn't get a code?{' '}
            <button className="btn btn-ghost" style={{ padding: 0, fontSize: 13.5 }} onClick={handleResend} disabled={isResending}>
              {isResending ? 'Sending…' : 'Resend code'}
            </button>
          </div>
          {resendMessage && <div style={{ color: 'var(--color-accent)' }}>{resendMessage}</div>}
        </div>
      </div>
    </main>
  );
}
