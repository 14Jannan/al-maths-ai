import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/use-auth';

interface MathTopic {
  id: number;
  name: string;
  description: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { email } = useAuth();

  const { data: topics, isLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1180, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ marginBottom: 4 }}>Welcome{email ? `, ${email.split('@')[0]}` : ''}</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
          Ask the tutor a question, or browse a topic to get started.
        </p>
      </div>

      <div className="card elev-sm" style={{ padding: 'var(--space-6)', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div className="card-kicker">AI Tutor</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>Have a question right now?</div>
        <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>
          Ask in English or Tamil — the tutor stays inside the A/L syllabus and shows full working.
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => navigate('/tutor')}>
          Open AI Tutor
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
        <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', margin: 0 }}>Topics</h6>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/topics')}>All topics</button>
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {topics && topics.length === 0 && (
        <p style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
          No topics yet — check back once your teacher/admin has added some.
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(215px,1fr))', gap: 'var(--space-4)' }}>
        {(topics ?? []).slice(0, 4).map((t) => (
          <div
            key={t.id}
            className="card"
            style={{ padding: 'var(--space-4)', gap: 'var(--space-3)', cursor: 'pointer' }}
            onClick={() => navigate('/tutor', { state: { topic: t.name } })}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{t.name}</div>
            <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{t.description}</div>
          </div>
        ))}
      </div>
    </main>
  );
}