import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface Resource {
  id: number;
  title: string;
  url: string;
  sourceType: string;
  language: string;
  branch: string;
  mathTopicId: number;
  mathTopicName: string | null;
}

// Pulls the video id out of the common YouTube URL shapes (watch?v=, youtu.be/,
// /embed/) so we can show a real video thumbnail instead of a plain link.
function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/embed/')[1] || null;
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/shorts/')[1] || null;
    }
  } catch {
    // not a valid URL — fall through
  }
  return null;
}

export function Resources() {
  const location = useLocation();
  const navState = location.state as { topicId?: number; topicName?: string } | null;

  const [language, setLanguage] = useState<'English' | 'Tamil'>('English');
  const [topicFilter, setTopicFilter] = useState<{ id: number; name: string } | null>(
    navState?.topicId ? { id: navState.topicId, name: navState.topicName ?? '' } : null
  );

  const { data: resources, isLoading } = useQuery({
    queryKey: ['resources', language, topicFilter?.id],
    queryFn: () => {
      const params = new URLSearchParams({ language });
      if (topicFilter) params.set('topicId', String(topicFilter.id));
      return apiFetch<Resource[]>(`/api/Resources?${params.toString()}`);
    },
  });

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Resources</h2>
      <p style={{ margin: '0 0 var(--space-6)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Curated videos and notes, picked by your teacher/admin — not AI-generated.
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-divider)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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

        {topicFilter && (
          <button
            className="tag tag-accent"
            style={{ border: 'none', cursor: 'pointer', marginBottom: 8 }}
            onClick={() => setTopicFilter(null)}
            title="Clear topic filter"
          >
            {topicFilter.name || 'Topic'} ✕
          </button>
        )}
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {resources && resources.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 6 }}>
            No {language} resources{topicFilter ? ` for ${topicFilter.name}` : ''} yet
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 'var(--space-4)' }}>
        {(resources ?? []).map((r) => {
          const videoId = r.sourceType === 'YouTube' ? getYouTubeVideoId(r.url) : null;
          return (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
              style={{ padding: videoId ? 0 : 'var(--space-4)', gap: 0, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
            >
              {videoId && (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', background: 'var(--color-bg)' }}>
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      background: 'color-mix(in srgb, black 25%, transparent)',
                    }}
                  >
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'color-mix(in srgb, black 55%, transparent)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 16,
                        color: '#fff',
                      }}
                    >
                      ▶
                    </span>
                  </span>
                </div>
              )}
              <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="tag tag-outline">{r.sourceType}</span>
                  <span className="tag tag-neutral">{r.branch}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>{r.title}</div>
                {r.mathTopicName && (
                  <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{r.mathTopicName}</div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}
