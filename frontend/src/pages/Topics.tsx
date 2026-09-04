import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface MathTopic {
  id: number;
  name: string;
  description: string;
  branch: string;
}

function TopicGrid({ topics, onSelect }: { topics: MathTopic[]; onSelect: (t: MathTopic) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 'var(--space-4)' }}>
      {topics.map((t) => (
        <div key={t.id} className="card" style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17 }}>{t.name}</div>
          <p className="card-body" style={{ lineHeight: 1.55 }}>{t.description}</p>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12.5, padding: '5px 11px', alignSelf: 'flex-start' }}
            onClick={() => onSelect(t)}
          >
            View resources
          </button>
        </div>
      ))}
    </div>
  );
}

export function Topics() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const { data: topics, isLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  const filtered = (topics ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  const pureTopics = filtered.filter((t) => t.branch === 'Pure');
  const appliedTopics = filtered.filter((t) => t.branch === 'Applied');

  function goToResources(t: MathTopic) {
    navigate('/resources', { state: { topicId: t.id, topicName: t.name } });
  }

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1180, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Math topics</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
            Ask the tutor about any topic, with the right A/L method every time.
          </p>
        </div>
        <input
          className="input"
          placeholder="Search topics"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 'min(280px,100%)' }}
        />
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading topics…</p>}

      {!isLoading && filtered.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 6 }}>
            {topics && topics.length === 0 ? 'No topics yet' : `No topic matches "${query}"`}
          </div>
          <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
            {topics && topics.length === 0
              ? 'An admin needs to add topics before they show up here.'
              : 'Try a different search term, or ask the tutor directly.'}
          </div>
        </div>
      )}

      {pureTopics.length > 0 && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <span className="tag tag-accent">Pure Mathematics</span>
            <span style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{pureTopics.length} topics</span>
          </div>
          <TopicGrid topics={pureTopics} onSelect={goToResources} />
        </div>
      )}

      {appliedTopics.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)' }}>
            <span className="tag tag-accent-2">Applied Mathematics</span>
            <span style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{appliedTopics.length} topics</span>
          </div>
          <TopicGrid topics={appliedTopics} onSelect={goToResources} />
        </div>
      )}
    </main>
  );
}
