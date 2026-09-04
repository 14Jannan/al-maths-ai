import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

export function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword, forgotPassword } = useAuth();

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const passwordsMatch = confirmPassword.length === 0 || newPassword === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords don’t match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email, code, newPassword);
      navigate('/login', { state: { resetSuccess: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setIsResending(true);
    setResendMessage(null);
    try {
      await forgotPassword(email);
      setResendMessage('A new code was sent to your email.');
    } catch {
      setResendMessage('Could not resend right now. Try again shortly.');
    } finally {
      setIsResending(false);
    }
  }

  if (!email) {
    // Someone landed here directly without going through "forgot password" first
    return (
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px)' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 'var(--space-4)' }}>No email to reset. Start from "forgot password".</p>
          <Link to="/forgot-password" className="btn btn-primary">Go to forgot password</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px) clamp(18px,4vw,40px)' }}>
      <div style={{ width: 'min(400px,100%)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Enter your reset code</h2>
        <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', marginBottom: 'var(--space-8)' }}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below with your new password.
        </p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={handleSubmit}>
          <div className="field">
            <label>Reset code</label>
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
          </div>
          <div className="field">
            <label>New password</label>
            <input
              className="input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              required
            />
            {!passwordsMatch && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)' }}>Passwords don’t match.</div>
            )}
            {error && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)' }}>{error}</div>
            )}
          </div>
          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={isSubmitting || code.length !== 6 || !passwordsMatch || newPassword.length < 6}
            style={{ padding: 9 }}
          >
            {isSubmitting ? 'Resetting…' : 'Reset password'}
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
