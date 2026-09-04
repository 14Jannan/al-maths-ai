import { useTheme } from '../lib/use-theme';

export function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 700, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Settings</h2>
      <p style={{ margin: '0 0 var(--space-8)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Appearance and information about iMath.
      </p>

      {/* Appearance */}
      <section style={{ marginBottom: 'var(--space-8)' }}>
        <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-4)' }}>Appearance</h6>
        <div className="card" style={{ padding: 'var(--space-5)', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, marginBottom: 2 }}>Theme</div>
              <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
                Switch between dark and light mode. Saved on this device.
              </div>
            </div>
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
          </div>
        </div>
      </section>

      {/* Credits */}
      <section>
        <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-4)' }}>Credits</h6>
        <div className="card" style={{ padding: 'var(--space-5)', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 24, height: 24, border: '1px solid var(--color-accent)', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 13, color: 'var(--color-accent)', fontWeight: 600 }}>
              i
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 17 }}>iMath</span>
          </div>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)', margin: 0 }}>
            An AI tutor for G.C.E. Advanced Level Combined Mathematics, built to stay inside the official
            Sri Lankan syllabus — nothing extra, nothing missing, in English and Tamil.
          </p>
          <div className="hr" />
          <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div>Past papers sourced from Past Papers WiKi, MathsApi, and ExamKuppiya.</div>
            <div>Not affiliated with the Department of Examinations, Sri Lanka.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
