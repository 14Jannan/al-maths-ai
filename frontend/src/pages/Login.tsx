import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

export function Login() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resetSuccess = Boolean((location.state as { resetSuccess?: boolean } | null)?.resetSuccess);

  // Already logged in (e.g. hit Back after a successful login) — don't show
  // the login form again, and don't leave "/login" as a page Back can land
  // on, or the next Back press just bounces here again instead of leaving.
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      // replace, not push — once logged in, "/login" shouldn't linger as a
      // Back target the user can land back on.
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        navigate('/verify-otp', { state: { email } });
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px) clamp(18px,4vw,40px)' }}>
      <div style={{ width: 'min(400px,100%)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Welcome back</h2>
        <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', marginBottom: 'var(--space-8)' }}>
          Log in to continue where you left off.
        </p>
        {resetSuccess && (
          <div style={{ fontSize: 13, color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>
            Password reset — log in with your new password.
          </div>
        )}
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
              <label style={{ marginBottom: 0, fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 70%, transparent)' }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: 12.5 }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', padding: 4 }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '\u{1F648}' : '\u{1F441}\u{FE0F}'}
              </button>
            </div>
            {error && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 13, height: 13, border: '1px solid currentColor', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 9 }}>!</span>
                {error}
              </div>
            )}
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting} style={{ padding: 9 }}>
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <div className="hr" />
        <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}>
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </main>
  );
}
