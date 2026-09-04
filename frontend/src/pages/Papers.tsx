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

interface ExamPaperDocument {
  id: number;
  year: number;
  paper: string;
  medium: string;
  questionPaperUrl: string;
  markingSchemeUrl: string | null;
  sourceLabel: string;
}

type ViewMode = 'questions' | 'fullpapers';

export function Papers() {
  const [view, setView] = useState<ViewMode>('fullpapers');

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Past papers</h2>
      <p style={{ margin: '0 0 var(--space-6)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Download full papers by year and medium, or practise question by question.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-divider)' }}>
        {([
          { key: 'fullpapers', label: 'Full papers (2015–2024)' },
          { key: 'questions', label: 'Practice by question' },
        ] as { key: ViewMode; label: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: view === t.key ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: view === t.key ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'fullpapers' ? <FullPapersView /> : <QuestionPracticeView />}
    </main>
  );
}

// ───────────────────────── Full Papers (by year/medium) ─────────────────────────

function FullPapersView() {
  const [medium, setMedium] = useState<'All' | 'English' | 'Tamil'>('All');

  const { data: papers, isLoading } = useQuery({
    queryKey: ['examPapers', medium],
    queryFn: () => apiFetch<ExamPaperDocument[]>(medium === 'All' ? '/api/ExamPapers' : `/api/ExamPapers?medium=${medium}`),
  });

  const grouped = (papers ?? []).reduce<Record<number, ExamPaperDocument[]>>((acc, p) => {
    (acc[p.year] ??= []).push(p);
    return acc;
  }, {});
  const years = Object.keys(grouped).map(Number).sort((a, b) => b - a);

  return (
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <select className="input" style={{ width: 160 }} value={medium} onChange={(e) => setMedium(e.target.value as typeof medium)}>
          <option value="All">All mediums</option>
          <option value="English">English</option>
          <option value="Tamil">Tamil</option>
        </select>
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {!isLoading && years.length === 0 && (
        <div style={{ border: '1px dashed color-mix(in srgb, var(--color-text) 22%, transparent)', borderRadius: 'var(--radius-md)', padding: 'clamp(28px,5vw,52px)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>No papers found</div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {years.map((year) => (
          <div key={year} className="card" style={{ padding: 'var(--space-4)', gap: 'var(--space-3)' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17 }}>{year}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {grouped[year].map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '6px 0', borderTop: '1px solid var(--color-divider)' }}>
                  <span className="tag tag-neutral">{p.medium}</span>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <a href={p.questionPaperUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: 12.5, padding: '5px 11px' }}>
                      Question paper
                    </a>
                    {p.markingSchemeUrl ? (
                      <a href={p.markingSchemeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ fontSize: 12.5, padding: '5px 11px' }}>
                        Marking scheme
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 45%, transparent)', alignSelf: 'center' }}>
                        Scheme not yet available
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────── Question-level practice (existing feature) ─────────────────────────

function QuestionPracticeView() {
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
    <div>
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
        <select className="input" style={{ width: 150 }} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
          <option value="">All years</option>
          {[2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015].map((y) => (
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
          <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>Try different filters, or an admin can add more via the admin panel.</div>
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
    </div>
  );
}
