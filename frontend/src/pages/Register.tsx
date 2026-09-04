import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'var(--color-neutral-300)' };
  if (score <= 3) return { score, label: 'Okay', color: '#d4a72c' };
  return { score, label: 'Strong', color: 'var(--color-accent)' };
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px) clamp(18px,4vw,40px)' }}>
      <div style={{ width: 'min(400px,100%)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', marginBottom: 'var(--space-8)' }}>
          Start free \u2014 10 questions a day.
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
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
            {password.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength.score ? strength.color : 'var(--color-divider)' }} />
                  ))}
                </div>
                <div style={{ fontSize: 11.5, color: strength.color }}>{strength.label}</div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Confirm password</label>
            <input
              className="input"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
            {!passwordsMatch && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)' }}>Passwords don\u2019t match.</div>
            )}
          </div>

          {error && (
            <div style={{ fontSize: 12, color: 'var(--color-neutral-300)', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ width: 13, height: 13, border: '1px solid currentColor', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 9 }}>!</span>
              {error}
            </div>
          )}

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={isSubmitting || !passwordsMatch || password.length < 6}
            style={{ padding: 9 }}
          >
            {isSubmitting ? 'Creating account\u2026' : 'Create account'}
          </button>
        </form>
        <div className="hr" />
        <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </main>
  );
}