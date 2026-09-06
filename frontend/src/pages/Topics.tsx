import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface MathTopic {
  id: number;
  name: string;
  description: string;
  branch: string;
  icon: string;
}

type Branch = 'Pure' | 'Applied';

// A cycling palette of playful sticker colors — deliberately not the app's
// usual purple accent, since the whole point here is "colorful map", not
// "on-brand dashboard". Each entry is [background, ring] for a node.
const PALETTE: [string, string][] = [
  ['#ff6b6b', '#ee5253'],
  ['#ffa502', '#ff7f50'],
  ['#2ed573', '#17c0eb'],
  ['#1e90ff', '#3742fa'],
  ['#8854d0', '#5f27cd'],
  ['#ff6fa5', '#ee5a6f'],
  ['#00d2d3', '#01a3a4'],
  ['#ffc048', '#ffa502'],
];

function BranchCard({
  branch,
  count,
  onSelect,
}: {
  branch: Branch;
  count: number;
  onSelect: () => void;
}) {
  const isPure = branch === 'Pure';
  return (
    <button
      onClick={onSelect}
      style={{
        flex: '1 1 260px',
        cursor: 'pointer',
        border: 'none',
        borderRadius: 'var(--radius-lg)',
        padding: 'clamp(28px,5vw,44px) var(--space-6)',
        textAlign: 'left',
        color: '#fff',
        background: isPure
          ? 'linear-gradient(135deg, #8854d0, #3742fa)'
          : 'linear-gradient(135deg, #2ed573, #01a3a4)',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ fontSize: 40 }}>{isPure ? '🧮' : '🚀'}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22 }}>{branch} Mathematics</div>
      <div style={{ fontSize: 13.5, opacity: 0.9 }}>{count} topics on the map — tap to explore</div>
    </button>
  );
}

function RoadmapNode({ topic, index, onClick }: { topic: MathTopic; index: number; onClick: () => void }) {
  const [bg, ring] = PALETTE[index % PALETTE.length];
  const alignLeft = index % 2 === 0;
  const rotate = index % 2 === 0 ? -3 : 3;

  return (
    <div style={{ display: 'flex', width: '100%', justifyContent: alignLeft ? 'flex-start' : 'flex-end', position: 'relative', zIndex: 1 }}>
      <button
        onClick={onClick}
        title={topic.description}
        style={{
          cursor: 'pointer',
          border: 'none',
          background: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          width: 128,
          marginLeft: alignLeft ? '6%' : 0,
          marginRight: alignLeft ? 0 : '6%',
        }}
      >
        <span
          style={{
            position: 'relative',
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: `linear-gradient(145deg, ${bg}, ${ring})`,
            display: 'grid',
            placeItems: 'center',
            fontSize: 32,
            boxShadow: `0 6px 0 ${ring}, var(--shadow-md)`,
            border: '3px solid color-mix(in srgb, white 55%, transparent)',
            transform: `rotate(${rotate}deg)`,
          }}
        >
          {topic.icon}
          <span
            style={{
              position: 'absolute',
              top: -6,
              left: -6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontSize: 11,
              fontWeight: 700,
              display: 'grid',
              placeItems: 'center',
              boxShadow: 'var(--shadow-sm)',
              transform: 'rotate(0deg)',
            }}
          >
            {index + 1}
          </span>
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: 1.25,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-sm)',
            color: 'var(--color-text)',
          }}
        >
          {topic.name}
        </span>
      </button>
    </div>
  );
}

function Roadmap({ topics, branch, onBack }: { topics: MathTopic[]; branch: Branch; onBack: () => void }) {
  const navigate = useNavigate();

  function handleSelect(t: MathTopic) {
    // Keep the branch in the URL (see Topics()) so that navigating to
    // resources and hitting the browser Back button returns here to the
    // roadmap, not all the way back to the Pure/Applied picker.
    navigate('/resources', { state: { topicId: t.id, topicName: t.name } });
  }

  return (
    <div>
      <button className="btn btn-ghost" style={{ fontSize: 13, marginBottom: 'var(--space-4)' }} onClick={onBack}>
        ← Back to Pure / Applied
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-8)' }}>
        <span className={branch === 'Pure' ? 'tag tag-accent' : 'tag tag-accent-2'}>{branch} Mathematics</span>
        <span style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
          Tap a stop on the map to see resources for that topic
        </span>
      </div>

      <div style={{ position: 'relative', maxWidth: 480, margin: '0 auto', paddingBottom: 'var(--space-8)' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            top: 20,
            bottom: 20,
            width: 4,
            transform: 'translateX(-50%)',
            background: 'repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 35%, transparent) 0 10px, transparent 10px 22px)',
            zIndex: 0,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {topics.map((t, i) => (
            <RoadmapNode key={t.id} topic={t} index={i} onClick={() => handleSelect(t)} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 28 }}>🏁</div>
      </div>
    </div>
  );
}

export function Topics() {
  const [query, setQuery] = useState('');
  // Branch lives in the URL, not just component state — so that after
  // navigating away to a topic's resources, pressing the browser Back
  // button restores the roadmap you were on instead of dropping you back
  // at the Pure/Applied picker (a fresh mount would otherwise always start
  // with branch = null).
  const [searchParams, setSearchParams] = useSearchParams();
  const branchParam = searchParams.get('branch');
  const branch: Branch | null = branchParam === 'Pure' || branchParam === 'Applied' ? branchParam : null;

  function setBranch(next: Branch | null) {
    if (next) setSearchParams({ branch: next });
    else setSearchParams({});
  }

  const { data: topics, isLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  // Dropping into a branch's roadmap doesn't make sense mid-search — clear
  // it so the user isn't confused by a filtered map with gaps.
  useEffect(() => {
    if (branch) setQuery('');
  }, [branch]);

  const filtered = (topics ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.description.toLowerCase().includes(query.toLowerCase())
  );

  const pureTopics = (topics ?? []).filter((t) => t.branch === 'Pure');
  const appliedTopics = (topics ?? []).filter((t) => t.branch === 'Applied');

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1180, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 'var(--space-6)', flexWrap: 'wrap', marginBottom: 'var(--space-8)' }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>Math topics</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
            {branch ? 'Your route through the syllabus.' : 'Pick a branch to start your route through the syllabus.'}
          </p>
        </div>
        {!branch && (
          <input
            className="input"
            placeholder="Search topics"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: 'min(280px,100%)' }}
          />
        )}
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading topics…</p>}

      {!isLoading && !branch && filtered.length === 0 && (
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

      {!branch && query && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 'var(--space-4)' }}>
          {filtered.map((t) => (
            <button
              key={t.id}
              className="card"
              style={{ padding: 'var(--space-4)', gap: 'var(--space-2)', textAlign: 'left', cursor: 'pointer', border: 'none' }}
              onClick={() => setBranch(t.branch as Branch)}
            >
              <div style={{ fontSize: 24 }}>{t.icon}</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{t.name}</div>
              <span className={t.branch === 'Pure' ? 'tag tag-accent' : 'tag tag-accent-2'} style={{ alignSelf: 'flex-start' }}>
                {t.branch}
              </span>
            </button>
          ))}
        </div>
      )}

      {!isLoading && !branch && !query && topics && topics.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
          <BranchCard branch="Pure" count={pureTopics.length} onSelect={() => setBranch('Pure')} />
          <BranchCard branch="Applied" count={appliedTopics.length} onSelect={() => setBranch('Applied')} />
        </div>
      )}

      {branch && (
        <Roadmap
          branch={branch}
          topics={branch === 'Pure' ? pureTopics : appliedTopics}
          onBack={() => setBranch(null)}
        />
      )}
    </main>
  );
}
