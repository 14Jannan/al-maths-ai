import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { ApiError } from '../lib/api';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note: fullName isn't sent to the backend yet — RegisterDto only has
  // email/password today. We collect it here so the form matches the design;
  // wiring it up is a small backend follow-up (add a Name field to
  // RegisterDto and IdentityUser) once you're ready for it.

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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

  // Matches the backend's actual Identity password policy (Program.cs):
  // at least 6 characters, one digit, one uppercase letter.
  const passwordLooksStrong = password.length >= 6 && /\d/.test(password) && /[A-Z]/.test(password);

  return (
    <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 'clamp(24px,6vw,64px) clamp(18px,4vw,40px)' }}>
      <div style={{ width: 'min(400px,100%)' }}>
        <h2 style={{ marginBottom: 'var(--space-2)' }}>Create your account</h2>
        <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 65%, transparent)', marginBottom: 'var(--space-8)' }}>
          Start free — 10 questions a day.
        </p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nirosha Perera"
              required
            />
          </div>
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
            {error && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-neutral-300)', display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ width: 13, height: 13, border: '1px solid currentColor', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 9 }}>!</span>
                {error}
              </div>
            )}
          </div>
          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters, with a number and a capital letter"
              required
            />
            {passwordLooksStrong && (
              <div style={{ fontSize: 12, marginTop: 5, color: 'var(--color-accent-300)' }}>Strong enough.</div>
            )}
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={isSubmitting} style={{ padding: 9 }}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
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
