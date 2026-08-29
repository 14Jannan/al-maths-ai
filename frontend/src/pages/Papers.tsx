import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

interface PastPaper {
  id: number;
  year: number;
  paper: string;
  questionNumber: string;
  questionText: string;
  answer: string;
  explanation: string;
  difficulty: string;
  language: string;
  mathTopicName: string | null;
}

export function Papers() {
  const [yearFilter, setYearFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const params = new URLSearchParams();
  if (yearFilter) params.set('year', yearFilter);
  if (difficultyFilter) params.set('difficulty', difficultyFilter);

  const { data: papers, isLoading } = useQuery({
    queryKey: ['pastPapers', yearFilter, difficultyFilter],
    queryFn: () => apiFetch<PastPaper[]>(`/api/PastPapers?${params.toString()}`),
  });

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Past papers</h2>
      <p style={{ margin: '0 0 var(--space-6)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Filter by year or difficulty, then expand a question to see the model answer.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <select className="input" style={{ width: 150 }} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All years</option>
          {[2024, 2023, 2022, 2021, 2020, 2019].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select className="input" style={{ width: 150 }} value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
          <option value="">All difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {papers && papers.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, marginBottom: 6 }}>No questions match</div>
          <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>Try different filters.</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {(papers ?? []).map((p) => {
          const isOpen = expandedId === p.id;
          return (
            <div key={p.id} className="card" style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', cursor: 'pointer' }}
                onClick={() => setExpandedId(isOpen ? null : p.id)}
              >
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="tag tag-neutral">{p.year} · {p.paper}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>Q{p.questionNumber}</span>
                  {p.mathTopicName && <span style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{p.mathTopicName}</span>}
                </div>
                <span className="tag tag-outline">{p.difficulty}</span>
              </div>

              <div style={{ fontSize: 14.5 }}>{p.questionText}</div>

              {isOpen && (
                <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 4 }}>Answer</div>
                    <div style={{ fontSize: 14 }}>{p.answer}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 4 }}>Explanation</div>
                    <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 72%, transparent)' }}>{p.explanation}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}