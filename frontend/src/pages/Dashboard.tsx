import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuth } from '../lib/use-auth';
import { getSubscriptionStatus } from '../lib/payments';
import { listConversations } from '../lib/conversations';

interface MathTopic {
  id: number;
  name: string;
  description: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { email, username } = useAuth();

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  const { data: usage } = useQuery({
    queryKey: ['chatUsage'],
    queryFn: () => apiFetch<{ isPremium: boolean; used: number; limit: number | null }>('/api/Chat/usage'),
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: getSubscriptionStatus,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  });

  const isPremium = subscription?.isPremium ?? false;
  const recentChat = conversations?.[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(18px,4vw,40px) 56px' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h3 style={{ marginBottom: 4, fontWeight: 600 }}>{greeting}{username ? `, ${username}` : email ? `, ${email.split('@')[0]}` : ''}</h3>
        <p style={{ margin: 0, fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
          {recentChat ? 'Pick up where you left off, or start something new.' : 'Ask your first question to get started.'}
        </p>
      </div>

      {/* Hero row: continue chat + usage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div
          className="card elev-sm"
          style={{
            gridColumn: 'span 2',
            padding: 'var(--space-6)',
            gap: 'var(--space-4)',
            minWidth: 0,
            background: 'linear-gradient(135deg, var(--color-surface), color-mix(in srgb, var(--color-accent) 6%, var(--color-surface)))',
          }}
        >
          <div className="card-kicker">AI Tutor</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recentChat ? `Continue "${recentChat.title}"` : 'Have a question right now?'}
          </div>
          <div style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>
            Ask in English or Tamil — the tutor stays inside the A/L syllabus and shows full working.
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary"
              onClick={() => navigate(recentChat ? `/tutor/${recentChat.id}` : '/tutor')}
            >
              {recentChat ? 'Continue chat' : 'Open AI Tutor'}
            </button>
            {recentChat && (
              <button className="btn btn-secondary" onClick={() => navigate('/tutor')}>New chat</button>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-6)', gap: 'var(--space-3)', justifyContent: 'space-between' }}>
          <div className="card-kicker">{isPremium ? 'Plan' : 'Today\u2019s usage'}</div>
          {isPremium ? (
            <>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, color: 'var(--color-accent)' }}>Premium</div>
              <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>Unlimited questions</div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26 }}>
                {usage?.used ?? 0}<span style={{ fontSize: 15, opacity: 0.55 }}> / {usage?.limit ?? 10}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--color-divider)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, ((usage?.used ?? 0) / (usage?.limit ?? 10)) * 100)}%`,
                    background: 'var(--color-accent)',
                  }}
                />
              </div>
              <button className="btn btn-ghost" style={{ fontSize: 12, padding: 0, alignSelf: 'flex-start' }} onClick={() => navigate('/pricing')}>
                Upgrade for unlimited →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Topics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-3)' }}>
        <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', margin: 0 }}>Topics</h6>
        <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => navigate('/topics')}>All topics →</button>
      </div>

      {topicsLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {topics && topics.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(24px,4vw,40px)', textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
            No topics yet — check back once your admin has added some.
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(215px,1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {(topics ?? []).slice(0, 4).map((t) => (
          <div
            key={t.id}
            className="card"
            style={{ padding: 'var(--space-4)', gap: 'var(--space-3)', cursor: 'pointer', transition: 'border-color 0.15s' }}
            onClick={() => navigate('/tutor', { state: { topic: t.name } })}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{t.name}</div>
            <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {t.description}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 'var(--space-3)' }}>
        <button
          className="card"
          style={{ padding: 'var(--space-4)', textAlign: 'left', cursor: 'pointer', border: 'none' }}
          onClick={() => navigate('/papers')}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>Past papers</div>
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>Practice by year & difficulty</div>
        </button>
        <button
          className="card"
          style={{ padding: 'var(--space-4)', textAlign: 'left', cursor: 'pointer', border: 'none' }}
          onClick={() => navigate('/resources')}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15 }}>Resources</div>
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>Curated videos & notes</div>
        </button>
      </div>
    </main>
  );
}