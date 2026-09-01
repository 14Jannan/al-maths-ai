import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { listConversations, renameConversation, deleteConversation, type ConversationSummary } from '../lib/conversations';

interface ChatSidebarProps {
  activeId: number | null;
  onSelect: (id: number | null) => void;
}

// Groups conversations into Today / Yesterday / Previous 7 days / Older,
// the same pattern used by most modern AI chat products.
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

export function ChatSidebar({ activeId, onSelect }: ChatSidebarProps) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  });

  const rename = useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => renameConversation(id, title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteConversation(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (activeId === id) onSelect(null);
    },
  });

  const groups = groupConversations(conversations ?? []);

  return (
    <aside
      style={{
        width: 230,
        flexShrink: 0,
        borderRight: '1px solid var(--color-divider)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-4) var(--space-3)',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}
    >
      <button className="btn btn-secondary" style={{ fontSize: 13 }} onClick={() => onSelect(null)}>
        + New chat
      </button>

      {groups.map((g) => (
        <div key={g.label}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--color-text) 50%, transparent)',
              marginBottom: 6,
              paddingLeft: 4,
            }}
          >
            {g.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {g.items.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  borderRadius: 'var(--radius-sm)',
                  background: activeId === c.id ? 'var(--color-surface)' : 'transparent',
                  padding: '6px 8px',
                }}
              >
                {editingId === c.id ? (
                  <input
                    className="input"
                    style={{ fontSize: 12.5, padding: '3px 6px', flex: 1 }}
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
                    onClick={() => onSelect(c.id)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      color: 'inherit',
                      fontSize: 13,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      padding: 0,
                    }}
                    title={c.title}
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
                  style={{ fontSize: 11, padding: 2 }}
                  title="Rename"
                >
                  ✎
                </button>
                <button
                  onClick={() => remove.mutate(c.id)}
                  className="btn btn-ghost btn-icon"
                  style={{ fontSize: 11, padding: 2, color: 'var(--color-neutral-300)' }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(!conversations || conversations.length === 0) && (
        <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', padding: '0 4px' }}>
          No conversations yet.
        </div>
      )}
    </aside>
  );
}