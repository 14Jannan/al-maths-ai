import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../lib/api';

interface MathTopic {
  id: number;
  name: string;
  description: string;
}

export function Admin() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: topics, isLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  const createTopic = useMutation({
    mutationFn: (newTopic: { name: string; description: string }) =>
      apiFetch<MathTopic>('/api/MathTopics', {
        method: 'POST',
        body: JSON.stringify(newTopic),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mathTopics'] });
      setName('');
      setDescription('');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to create topic'),
  });

  const deleteTopic = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/MathTopics/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mathTopics'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    createTopic.mutate({ name, description });
  }

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 900, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Admin · Math Topics</h2>
      <p style={{ margin: '0 0 var(--space-8)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Add and remove topics. Students see these on the Dashboard and Topics page.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}
      >
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label>Topic name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Differentiation" required />
        </div>
        <div className="field" style={{ flex: '2 1 300px' }}>
          <label>Description</label>
          <input
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Rates of change, derivatives, and applications"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={createTopic.isPending}>
          {createTopic.isPending ? 'Adding…' : 'Add topic'}
        </button>
      </form>

      {error && (
        <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>
      )}

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading topics…</p>}

      {topics && topics.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 6 }}>No topics yet</div>
          <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
            Add your first topic using the form above.
          </div>
        </div>
      )}

      {topics && topics.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td style={{ color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>{t.description}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }}
                    onClick={() => deleteTopic.mutate(t.id)}
                    disabled={deleteTopic.isPending}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}