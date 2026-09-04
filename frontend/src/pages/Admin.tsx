import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../lib/api';

interface MathTopic {
  id: number;
  name: string;
  description: string;
}

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
  mathTopicId: number;
  mathTopicName: string | null;
}

interface Resource {
  id: number;
  title: string;
  url: string;
  sourceType: string;
  language: string;
  mathTopicId: number;
  mathTopicName: string | null;
}

type Tab = 'topics' | 'papers' | 'resources' | 'documents' | 'exampapers';

export function Admin() {
  const [tab, setTab] = useState<Tab>('topics');

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>Admin</h2>
      <p style={{ margin: '0 0 var(--space-6)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Manage the content students see.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-8)', borderBottom: '1px solid var(--color-divider)' }}>
        {(['topics', 'papers', 'resources', 'documents', 'exampapers'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="btn btn-ghost"
            style={{
              borderRadius: 0,
              borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
              color: tab === t ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 55%, transparent)',
              textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'topics' && <TopicsAdmin />}
      {tab === 'papers' && <PapersAdmin />}
      {tab === 'resources' && <ResourcesAdmin />}
      {tab === 'documents' && <DocumentsAdmin />}
      {tab === 'exampapers' && <ExamPapersAdmin />}
    </main>
  );
}

// ───────────────────────── Topics ─────────────────────────

function TopicsAdmin() {
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
      apiFetch<MathTopic>('/api/MathTopics', { method: 'POST', body: JSON.stringify(newTopic) }),
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
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label>Topic name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Differentiation" required />
        </div>
        <div className="field" style={{ flex: '2 1 300px' }}>
          <label>Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rates of change..." required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={createTopic.isPending}>
          {createTopic.isPending ? 'Adding…' : 'Add topic'}
        </button>
      </form>

      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {topics && topics.length > 0 && (
        <table className="table">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td style={{ color: 'color-mix(in srgb, var(--color-text) 62%, transparent)' }}>{t.description}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deleteTopic.mutate(t.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ───────────────────────── Past Papers ─────────────────────────

function PapersAdmin() {
  const queryClient = useQueryClient();
  const { data: topics } = useQuery({ queryKey: ['mathTopics'], queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics') });
  const { data: papers, isLoading } = useQuery({ queryKey: ['pastPapers', 'admin'], queryFn: () => apiFetch<PastPaper[]>('/api/PastPapers') });

  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    paper: 'Paper I',
    questionNumber: '',
    questionText: '',
    answer: '',
    explanation: '',
    difficulty: 'Medium',
    language: 'English',
    mathTopicId: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const createPaper = useMutation({
    mutationFn: (dto: typeof form) => apiFetch<PastPaper>('/api/PastPapers', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastPapers'] });
      setForm({ ...form, questionNumber: '', questionText: '', answer: '', explanation: '' });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to create question'),
  });

  const deletePaper = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/PastPapers/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pastPapers'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.mathTopicId) {
      setError('Pick a topic');
      return;
    }
    createPaper.mutate(form);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div className="field" style={{ width: 100 }}>
            <label>Year</label>
            <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
          </div>
          <div className="field" style={{ width: 130 }}>
            <label>Paper</label>
            <select className="input" value={form.paper} onChange={(e) => setForm({ ...form, paper: e.target.value })}>
              <option>Paper I</option>
              <option>Paper II</option>
            </select>
          </div>
          <div className="field" style={{ width: 110 }}>
            <label>Question #</label>
            <input className="input" value={form.questionNumber} onChange={(e) => setForm({ ...form, questionNumber: e.target.value })} placeholder="3(a)" required />
          </div>
          <div className="field" style={{ flex: '1 1 180px' }}>
            <label>Topic</label>
            <select className="input" value={form.mathTopicId} onChange={(e) => setForm({ ...form, mathTopicId: Number(e.target.value) })} required>
              <option value={0}>Select topic</option>
              {(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ width: 120 }}>
            <label>Difficulty</label>
            <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div className="field" style={{ width: 120 }}>
            <label>Language</label>
            <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option>English</option>
              <option>Tamil</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Question text</label>
          <textarea className="input" style={{ minHeight: 60 }} value={form.questionText} onChange={(e) => setForm({ ...form, questionText: e.target.value })} required />
        </div>
        <div className="field">
          <label>Answer</label>
          <input className="input" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required />
        </div>
        <div className="field">
          <label>Explanation</label>
          <textarea className="input" style={{ minHeight: 60 }} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} />
        </div>

        {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)' }}>{error}</div>}
        <button className="btn btn-primary" type="submit" disabled={createPaper.isPending} style={{ alignSelf: 'flex-start' }}>
          {createPaper.isPending ? 'Adding…' : 'Add question'}
        </button>
      </form>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}
      {papers && papers.length > 0 && (
        <table className="table">
          <thead><tr><th>Year</th><th>Q#</th><th>Topic</th><th></th></tr></thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>{p.year} · {p.paper}</td>
                <td>{p.questionNumber}</td>
                <td>{p.mathTopicName}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deletePaper.mutate(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ───────────────────────── Resources ─────────────────────────

function ResourcesAdmin() {
  const queryClient = useQueryClient();
  const { data: topics } = useQuery({ queryKey: ['mathTopics'], queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics') });
  const { data: resources, isLoading } = useQuery({ queryKey: ['resources', 'admin'], queryFn: () => apiFetch<Resource[]>('/api/Resources') });

  const [form, setForm] = useState({ title: '', url: '', sourceType: 'YouTube', language: 'English', mathTopicId: 0 });
  const [error, setError] = useState<string | null>(null);

  const createResource = useMutation({
    mutationFn: (dto: typeof form) => apiFetch<Resource>('/api/Resources', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setForm({ title: '', url: '', sourceType: 'YouTube', language: 'English', mathTopicId: 0 });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to add resource'),
  });

  const deleteResource = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/Resources/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.mathTopicId) {
      setError('Pick a topic');
      return;
    }
    createResource.mutate(form);
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
        <div className="field" style={{ flex: '2 1 220px' }}>
          <label>Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="field" style={{ flex: '3 1 260px' }}>
          <label>URL</label>
          <input className="input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://youtube.com/..." required />
        </div>
        <div className="field" style={{ width: 130 }}>
          <label>Type</label>
          <select className="input" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
            <option>YouTube</option>
            <option>Article</option>
            <option>Notes</option>
          </select>
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Language</label>
          <select className="input" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            <option>English</option>
            <option>Tamil</option>
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 160px' }}>
          <label>Topic</label>
          <select className="input" value={form.mathTopicId} onChange={(e) => setForm({ ...form, mathTopicId: Number(e.target.value) })} required>
            <option value={0}>Select topic</option>
            {(topics ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={createResource.isPending}>
          {createResource.isPending ? 'Adding…' : 'Add resource'}
        </button>
      </form>

      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {resources && resources.length > 0 && (
        <table className="table">
          <thead><tr><th>Title</th><th>Type</th><th>Language</th><th>Topic</th><th></th></tr></thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.title}</td>
                <td>{r.sourceType}</td>
                <td>{r.language}</td>
                <td>{r.mathTopicName}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deleteResource.mutate(r.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ───────────────────────── Documents ─────────────────────────

function DocumentsAdmin() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiFetch<{ sourceTitle: string; chunkCount: number; uploadedAt: string }[]>('/api/Documents'),
  });

  const deleteDoc = useMutation({
    mutationFn: (sourceTitle: string) => apiFetch<void>(`/api/Documents/${encodeURIComponent(sourceTitle)}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiFetch<{ sourceTitle: string; chunksCreated: number }>('/api/Documents/upload', {
        method: 'POST',
        body: formData,
      });
      setResult(`"${res.sourceTitle}" processed — ${res.chunksCreated} chunks indexed.`);
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)', marginBottom: 'var(--space-4)' }}>
        Upload a PDF (notes, textbook chapter, etc.) — it will be split into searchable chunks the AI tutor can reference alongside the official syllabus.
      </p>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? 'Processing…' : 'Upload & Index'}
        </button>
      </div>

      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {result && <div style={{ fontSize: 13, color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>{result}</div>}

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {documents && documents.length > 0 && (
        <table className="table">
          <thead><tr><th>Document</th><th>Chunks</th><th></th></tr></thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.sourceTitle}>
                <td style={{ fontWeight: 500 }}>{d.sourceTitle}</td>
                <td>{d.chunkCount}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deleteDoc.mutate(d.sourceTitle)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ───────────────────────── Exam Papers ─────────────────────────

interface ExamPaperDocument {
  id: number;
  year: number;
  paper: string;
  medium: string;
  questionPaperUrl: string;
  markingSchemeUrl: string | null;
  sourceLabel: string;
}

function ExamPapersAdmin() {
  const queryClient = useQueryClient();
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const [form, setForm] = useState({ year: new Date().getFullYear(), paper: 'Combined', medium: 'English', questionPaperUrl: '', markingSchemeUrl: '', sourceLabel: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: papers, isLoading } = useQuery({
    queryKey: ['examPapers', 'admin'],
    queryFn: () => apiFetch<ExamPaperDocument[]>('/api/ExamPapers'),
  });

  const saveOne = useMutation({
    mutationFn: async (payload: typeof form & { id?: number }) => {
      if (payload.id) {
        await apiFetch<void>(`/api/ExamPapers/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch<ExamPaperDocument>('/api/ExamPapers', { method: 'POST', body: JSON.stringify(payload) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examPapers'] });
      setForm({ year: new Date().getFullYear(), paper: 'Combined', medium: 'English', questionPaperUrl: '', markingSchemeUrl: '', sourceLabel: '' });
      setEditingId(null);
    },
  });

  const bulkImport = useMutation({
    mutationFn: (items: unknown[]) => apiFetch<{ added: number }>('/api/ExamPapers/bulk', { method: 'POST', body: JSON.stringify({ items }) }),
    onSuccess: (res) => {
      setBulkResult(`${res.added} entries imported.`);
      setBulkJson('');
      queryClient.invalidateQueries({ queryKey: ['examPapers'] });
    },
    onError: (err) => setBulkError(err instanceof ApiError ? err.message : 'Import failed'),
  });

  const deleteOne = useMutation({
    mutationFn: (id: number) => apiFetch<void>(`/api/ExamPapers/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['examPapers'] }),
  });

  function handleBulkSubmit() {
    setBulkError(null);
    setBulkResult(null);
    try {
      const parsed = JSON.parse(bulkJson);
      if (!Array.isArray(parsed)) throw new Error('Must be a JSON array');
      bulkImport.mutate(parsed);
    } catch (e) {
      setBulkError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  function startEdit(p: ExamPaperDocument) {
    setEditingId(p.id);
    setForm({ year: p.year, paper: p.paper, medium: p.medium, questionPaperUrl: p.questionPaperUrl, markingSchemeUrl: p.markingSchemeUrl ?? '', sourceLabel: p.sourceLabel });
  }

  return (
    <div>
      {/* Bulk import — paste a JSON array here (e.g. from a compiled research list) */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Bulk import (JSON array)</label>
        <textarea
          className="input"
          style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 12.5 }}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='[{"year":2024,"paper":"Combined","medium":"English","questionPaperUrl":"https://...","markingSchemeUrl":"https://...","sourceLabel":"Past Papers WiKi"}]'
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={!bulkJson.trim() || bulkImport.isPending}>
            {bulkImport.isPending ? 'Importing…' : 'Import all'}
          </button>
          {bulkError && <span style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }}>{bulkError}</span>}
          {bulkResult && <span style={{ fontSize: 12.5, color: 'var(--color-accent)' }}>{bulkResult}</span>}
        </div>
      </div>

      {/* Single add / edit form */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
        <div className="field" style={{ width: 90 }}>
          <label>Year</label>
          <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Medium</label>
          <select className="input" value={form.medium} onChange={(e) => setForm({ ...form, medium: e.target.value })}>
            <option>English</option>
            <option>Tamil</option>
          </select>
        </div>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label>Question paper URL</label>
          <input className="input" value={form.questionPaperUrl} onChange={(e) => setForm({ ...form, questionPaperUrl: e.target.value })} />
        </div>
        <div className="field" style={{ flex: '1 1 220px' }}>
          <label>Marking scheme URL (optional)</label>
          <input className="input" value={form.markingSchemeUrl} onChange={(e) => setForm({ ...form, markingSchemeUrl: e.target.value })} />
        </div>
        <div className="field" style={{ width: 130 }}>
          <label>Source</label>
          <input className="input" value={form.sourceLabel} onChange={(e) => setForm({ ...form, sourceLabel: e.target.value })} placeholder="Past Papers WiKi" />
        </div>
        <button className="btn btn-primary" onClick={() => saveOne.mutate({ ...form, id: editingId ?? undefined })} disabled={saveOne.isPending}>
          {editingId ? 'Save changes' : 'Add'}
        </button>
        {editingId && (
          <button className="btn btn-ghost" onClick={() => { setEditingId(null); setForm({ year: new Date().getFullYear(), paper: 'Combined', medium: 'English', questionPaperUrl: '', markingSchemeUrl: '', sourceLabel: '' }); }}>
            Cancel
          </button>
        )}
      </div>

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}
      {papers && papers.length > 0 && (
        <table className="table">
          <thead><tr><th>Year</th><th>Medium</th><th>Scheme?</th><th>Source</th><th></th></tr></thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>{p.year}</td>
                <td>{p.medium}</td>
                <td>{p.markingSchemeUrl ? '✓' : '—'}</td>
                <td>{p.sourceLabel}</td>
                <td style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => startEdit(p)}>Edit</button>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deleteOne.mutate(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}