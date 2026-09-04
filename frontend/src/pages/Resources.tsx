import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface Resource {
  id: number;
  title: string;
  url: string;
  sourceType: string;
  language: string;
  mathTopicName: string | null;
}

export function Resources() {
  const [language, setLanguage] = useState<'English' | 'Tamil'>('English');

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', language],
    queryFn: () => apiFetch<Resource[]>(`/api/Resources?language=${language}`),
  });

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Resources</h2>
      <p style={{ margin: '0 0 var(--space-6)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Curated videos and notes, picked by your teacher/admin — not AI-generated.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-divider)' }}>
        {(['English', 'Tamil'] as const).map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: language === lang ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: language === lang ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {resources && resources.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 6 }}>No {language} resources yet</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 'var(--space-4)' }}>
        {(resources ?? []).map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card"
            style={{ padding: 'var(--space-4)', gap: 'var(--space-2)', textDecoration: 'none', color: 'inherit' }}
          >
            <span className="tag tag-outline" style={{ alignSelf: 'flex-start' }}>{r.sourceType}</span>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{r.title}</div>
            {r.mathTopicName && (
              <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{r.mathTopicName}</div>
            )}
          </a>
        ))}
      </div>
    </main>
  );
}
