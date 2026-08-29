// Temporary placeholder so routing + navigation works end to end while we
// build out Dashboard, AI Tutor, Topics, Past Papers, Resources, Pricing
// and Account one at a time. Each of these gets replaced with a real page.
export function ComingSoon({ title }: { title: string }) {
  return (
    <main style={{ flex: 1, maxWidth: 1180, margin: '0 auto', width: '100%', padding: 'clamp(40px,6vw,72px) clamp(18px,4vw,40px)' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>{title}</h2>
      <p style={{ fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        This screen is coming in the next build step.
      </p>
    </main>
  );
}
