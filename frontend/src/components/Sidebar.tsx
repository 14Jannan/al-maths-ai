import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../lib/use-auth';
import { getSubscriptionStatus } from '../lib/payments';
import { listConversations, renameConversation, deleteConversation, type ConversationSummary } from '../lib/conversations';
import { GlobalSearch } from './GlobalSearch';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/topics', label: 'Topics' },
  { to: '/papers', label: 'Past Papers' },
  { to: '/resources', label: 'Resources' },
  { to: '/settings', label: 'Settings' },
];

function groupConversations(conversations: ConversationSummary[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const groups: { label: string; items: ConversationSummary[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Older', items: [] },
  ];
  for (const c of conversations) {
    const updated = new Date(c.updatedAt);
    if (updated >= startOfToday) groups[0].items.push(c);
    else if (updated >= startOfYesterday) groups[1].items.push(c);
    else if (updated >= sevenDaysAgo) groups[2].items.push(c);
    else groups[3].items.push(c);
  }
  return groups.filter((g) => g.items.length > 0);
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();
  const { email, isAdmin, logout } = useAuth();

  const onTutorRoute = location.pathname.startsWith('/tutor');
  const activeConversationId = params.conversationId ? Number(params.conversationId) : null;

  const [tutorOpen, setTutorOpen] = useState(onTutorRoute);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (onTutorRoute) setTutorOpen(true);
  }, [onTutorRoute]);

  const { data: subscription } = useQuery({
    queryKey: ['subscriptionStatus'],
    queryFn: getSubscriptionStatus,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
    enabled: tutorOpen,
  });

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => renameConversation(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteConversation(id),
    onSuccess: (_d, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeConversationId === id) navigate('/tutor');
    },
  });

  const isPremium = subscription?.isPremium ?? false;
  const initials = (email ?? '?').slice(0, 2).toUpperCase();
  const groups = groupConversations(conversations ?? []);

  function isActive(path: string) {
    return location.pathname === path;
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    // width/minWidth/overflow here are the key fix: without an explicit
    // min-width:0, a flex child defaults to "never shrink smaller than my
    // content" — so one long chat title could silently push this whole
    // column (and the fixed-width wrapper around it) wider than intended.
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minWidth: 0,
        overflow: 'hidden',
        padding: 'var(--space-4) var(--space-3)',
        boxSizing: 'border-box',
      }}
    >
      <Link
        to="/dashboard"
        onClick={onNavigate}
        style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', padding: '4px 6px', marginBottom: 'var(--space-6)' }}
      >
        <span style={{ width: 22, height: 22, border: '1px solid var(--color-accent)', borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 12, color: 'var(--color-accent)', fontWeight: 600 }}>
          i
        </span>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>iMath</span>
      </Link>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <GlobalSearch />
      </div>

      <nav
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingRight: 4,
        }}
      >
        <Link
          to="/dashboard"
          onClick={onNavigate}
          style={{
            fontSize: 14,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            color: isActive('/dashboard') ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
            background: isActive('/dashboard') ? 'var(--color-surface)' : 'transparent',
            fontWeight: isActive('/dashboard') ? 500 : 400,
          }}
        >
          Dashboard
        </Link>

        {/* AI Tutor — expandable, with conversation history nested underneath */}
        <button
          onClick={() => {
            if (!onTutorRoute) navigate('/tutor');
            setTutorOpen((v) => !v);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            color: onTutorRoute ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
            background: onTutorRoute ? 'var(--color-surface)' : 'transparent',
            fontWeight: onTutorRoute ? 500 : 400,
          }}
        >
          <span>AI Tutor</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>{tutorOpen ? '▾' : '▸'}</span>
        </button>

        {tutorOpen && (
          <div
            style={{
              paddingLeft: 8,
              borderLeft: '1px solid var(--color-divider)',
              marginLeft: 12,
              width: 'calc(100% - 20px)',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              paddingTop: 4,
              paddingBottom: 6,
            }}
          >
            <button
              onClick={() => {
                navigate('/tutor');
                onNavigate?.();
              }}
              className="btn btn-ghost"
              style={{ fontSize: 12, justifyContent: 'flex-start', padding: '4px 8px', color: 'var(--color-accent)' }}
            >
              + New chat
            </button>

            {groups.map((g) => (
              <div key={g.label} style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 45%, transparent)', padding: '0 8px 3px' }}>
                  {g.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  {g.items.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        minWidth: 0,
                        borderRadius: 'var(--radius-sm)',
                        background: activeConversationId === c.id ? 'var(--color-surface)' : 'transparent',
                        padding: '4px 6px',
                      }}
                    >
                      {editingId === c.id ? (
                        <input
                          className="input"
                          style={{ fontSize: 11.5, padding: '2px 5px', flex: 1, minWidth: 0 }}
                          value={editTitle}
                          autoFocus
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => {
                            rename.mutate({ id: c.id, title: editTitle || c.title });
                            setEditingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              rename.mutate({ id: c.id, title: editTitle || c.title });
                              setEditingId(null);
                            }
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            navigate(`/tutor/${c.id}`);
                            onNavigate?.();
                          }}
                          title={c.title}
                          style={{
                            flex: 1,
                            minWidth: 0,
                            textAlign: 'left',
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            fontSize: 12.5,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            padding: 0,
                          }}
                        >
                          {c.title}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditTitle(c.title);
                        }}
                        className="btn btn-ghost btn-icon"
                        style={{ fontSize: 10, padding: 2, flexShrink: 0 }}
                        title="Rename"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => remove.mutate(c.id)}
                        className="btn btn-ghost btn-icon"
                        style={{ fontSize: 10, padding: 2, color: 'var(--color-neutral-300)', flexShrink: 0 }}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {conversations && conversations.length === 0 && (
              <div style={{ fontSize: 11.5, color: 'color-mix(in srgb, var(--color-text) 45%, transparent)', padding: '0 8px' }}>
                No conversations yet.
              </div>
            )}
          </div>
        )}

        {navItems.slice(1).map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            style={{
              fontSize: 14,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: isActive(item.to) ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
              background: isActive(item.to) ? 'var(--color-surface)' : 'transparent',
              fontWeight: isActive(item.to) ? 500 : 400,
            }}
          >
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            onClick={onNavigate}
            style={{
              fontSize: 14,
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              marginTop: 'var(--space-3)',
              color: isActive('/admin') ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 65%, transparent)',
              background: isActive('/admin') ? 'var(--color-surface)' : 'transparent',
            }}
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Compact account footer — plan status links straight to pricing,
          profile row links to account, logout is its own explicit action */}
      <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 0 }}>
        {!isPremium && (
          <button
            className="btn btn-success"
            style={{ fontSize: 12.5, padding: '6px 10px' }}
            onClick={() => {
              navigate('/pricing');
              onNavigate?.();
            }}
          >
            Upgrade
          </button>
        )}

        <button
          onClick={() => {
            navigate('/account');
            onNavigate?.();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
            background: 'none',
            border: 'none',
            padding: '6px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            color: 'inherit',
            textAlign: 'left',
          }}
        >
          <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-surface)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, flexShrink: 0 }}>
            {initials}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
            <div style={{ color: isPremium ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
              {isPremium ? 'Premium' : 'Free plan'}
            </div>
          </span>
        </button>

        <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
}