import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
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
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
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
