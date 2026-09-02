import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/use-auth';
import { Math } from '../components/Math';

const steps = [
  { n: '01', title: 'Ask in English or Tamil', body: 'Type your question the way you\u2019d ask a teacher — the tutor answers in the same language.' },
  { n: '02', title: 'Get the syllabus method', body: 'The tutor solves it the A/L way first, and clearly labels anything outside the syllabus.' },
  { n: '03', title: 'See every step', body: 'Full working, not just the final answer — expand steps at your own pace.' },
  { n: '04', title: 'Practise from past papers', body: 'Jump straight into similar past-paper questions once a topic clicks.' },
];

export function Landing() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Logged-in users hitting "/" should land on their dashboard, not the
  // marketing page — the landing page is only for logged-out visitors.
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main style={{ flex: 1 }}>
      <section
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          padding: 'clamp(36px,7vw,90px) clamp(18px,4vw,40px) clamp(28px,5vw,56px)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
          gap: 'clamp(24px,5vw,56px)',
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div className="tag tag-outline" style={{ marginBottom: 'var(--space-4)' }}>
            G.C.E. Advanced Level · Combined Maths
          </div>
          <h1 style={{ fontSize: 'clamp(34px,5.4vw,54px)', letterSpacing: '-0.02em', marginBottom: 'var(--space-4)' }}>
            A/L Maths, explained one step at a time.
          </h1>
          <p
            style={{
              fontSize: 'clamp(15px,1.5vw,18px)',
              lineHeight: 1.6,
              maxWidth: '46ch',
              color: 'color-mix(in srgb, var(--color-text) 78%, transparent)',
            }}
          >
            An AI tutor that stays inside the Sri Lankan syllabus — nothing extra, nothing missing. Ask in
            English or Tamil, work through past papers, and see the full working, not just the answer.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-6)' }}>
            <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 15 }} onClick={() => navigate('/register')}>
              Start free — 10 questions a day
            </button>
            <button className="btn btn-secondary" style={{ padding: '10px 18px', fontSize: 15 }} onClick={() => navigate('/login')}>
              See a sample answer
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
              marginTop: 'var(--space-8)',
              fontSize: 13,
              color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            }}
          >
            <span>Syllabus-aligned</span>
            <span>English + Tamil</span>
            <span>Past papers 2019–2024</span>
          </div>
        </div>

        <div className="card elev-sm" style={{ minWidth: 0, padding: 'var(--space-6)', gap: 'var(--space-4)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            <span style={{ width: 5, height: 5, background: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
            Sample tutor answer
          </div>
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: '82%',
              border: '1px solid var(--color-divider)',
              borderRadius: '12px 12px 3px 12px',
              padding: '9px 13px',
              fontSize: 14,
            }}
          >
            Differentiate <Math tex="x^{2}\sin x" /> with respect to <Math tex="x" />.
          </div>
          <div
            style={{
              background: 'color-mix(in srgb, var(--color-neutral-900) 70%, var(--color-surface))',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
              Answer
            </div>
            <Math
              tex="\frac{d}{dx}\left(x^{2}\sin x\right)=2x\sin x+x^{2}\cos x"
              display
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-4) var(--space-3)',
                lineHeight: 2,
              }}
            />
            <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}>
              Product rule, then differentiate each factor. Full working in three steps →
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: 'var(--color-section)',
          backgroundImage: 'radial-gradient(120% 140% at 12% 0%, var(--color-section-glow), transparent 62%)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: 'clamp(26px,4vw,44px) clamp(18px,4vw,40px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
            gap: 'var(--space-8)',
          }}
        >
          <div>
            <div style={{ fontSize: 'clamp(26px,3vw,34px)', fontFamily: 'var(--font-heading)' }}>6 years</div>
            <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4 }}>of past papers, question by question</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(26px,3vw,34px)', fontFamily: 'var(--font-heading)' }}>18 topics</div>
            <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4 }}>mapped to the official syllabus sections</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(26px,3vw,34px)', fontFamily: 'var(--font-heading)' }}>2 languages</div>
            <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4 }}>explanations in English and Tamil</div>
          </div>
          <div>
            <div style={{ fontSize: 'clamp(26px,3vw,34px)', fontFamily: 'var(--font-heading)' }}>0 detours</div>
            <div style={{ fontSize: 13, opacity: 0.72, marginTop: 4 }}>anything outside the syllabus is labelled</div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(40px,6vw,72px) clamp(18px,4vw,40px)' }}>
        <h6 style={{ color: 'var(--color-accent)', marginBottom: 'var(--space-6)' }}>How it works</h6>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 'var(--space-6)' }}>
          {steps.map((s) => (
            <div key={s.n} style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-4)' }}>
              <div style={{ fontSize: 12, color: 'var(--color-accent)', marginBottom: 'var(--space-3)' }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 'var(--space-2)' }}>{s.title}</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.6, color: 'color-mix(in srgb, var(--color-text) 68%, transparent)' }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 clamp(18px,4vw,40px) clamp(48px,7vw,88px)' }}>
        <div className="card elev-sm" style={{ padding: 'clamp(20px,3vw,32px)', gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ marginBottom: 6 }}>Free covers the whole syllabus</h3>
              <p style={{ fontSize: 14, margin: 0, color: 'color-mix(in srgb, var(--color-text) 68%, transparent)' }}>
                Premium raises the daily limit and unlocks full model answers.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/pricing')}>Compare plans</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 14 }}>
              <div className="tag tag-neutral" style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-2)' }}>Free</div>
              <div>10 tutor questions a day</div>
              <div>All topics and past papers</div>
              <div>Step-by-step working</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 14 }}>
              <div className="tag tag-accent" style={{ alignSelf: 'flex-start', marginBottom: 'var(--space-2)' }}>Premium</div>
              <div>Unlimited tutor questions</div>
              <div>Model answers for every paper question</div>
              <div>Generated practice sets by topic</div>
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          padding: 'var(--space-8) clamp(18px,4vw,40px) var(--space-8)',
          fontSize: 12.5,
          color: 'color-mix(in srgb, var(--color-text) 45%, transparent)',
          boxShadow: '0 -1px 0 var(--color-divider)',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <span>iMath — A/L Combined Maths tutor</span>
          <span>Not affiliated with the Department of Examinations.</span>
        </div>
      </footer>
    </main>
  );
}