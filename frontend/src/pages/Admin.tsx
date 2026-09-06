import { useState, useRef, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, LabelList, PieChart, Pie, Legend,
} from 'recharts';
import { apiFetch, ApiError } from '../lib/api';

interface MathTopic {
  id: number;
  name: string;
  description: string;
  branch: string;
  icon: string;
}

interface PastPaper {
  id: number;
  year: number;
  paper: string;
  questionNumber: string;
  questionText: string;
  questionImageUrl: string | null;
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
  branch: string;
  mathTopicId: number;
  mathTopicName: string | null;
}

type Tab = 'overview' | 'users' | 'topics' | 'papers' | 'resources' | 'documents' | 'exampapers';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  users: 'Users',
  topics: 'Topics',
  papers: 'Papers',
  resources: 'Resources',
  documents: 'Documents',
  exampapers: 'Exam Papers',
};

const VALID_TABS = Object.keys(TAB_LABELS) as Tab[];

// Which section shows is now driven by the URL (/admin, /admin/users, ...)
// — the sidebar (see Sidebar.tsx) renders these as real nav links instead
// of an in-page tab bar, so the browser Back/Forward buttons and direct
// links to e.g. /admin/papers work correctly.
export function Admin() {
  const { tab: tabParam } = useParams<{ tab?: string }>();
  const tab: Tab = VALID_TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'overview';

  return (
    <main style={{ flex: 1, width: '100%', maxWidth: 1000, margin: '0 auto', padding: 'clamp(22px,4vw,40px) clamp(18px,4vw,40px) 64px' }}>
      <h2 style={{ marginBottom: 'var(--space-2)' }}>{TAB_LABELS[tab]}</h2>
      <p style={{ margin: '0 0 var(--space-8)', fontSize: 14, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
        Manage the content students see.
      </p>

      {tab === 'overview' && <OverviewAdmin />}
      {tab === 'users' && <UsersAdmin />}
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
  const [branch, setBranch] = useState('Pure');
  const [icon, setIcon] = useState('📘');
  const [error, setError] = useState<string | null>(null);

  const { data: topics, isLoading } = useQuery({
    queryKey: ['mathTopics'],
    queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics'),
  });

  const createTopic = useMutation({
    mutationFn: (newTopic: { name: string; description: string; branch: string; icon: string }) =>
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
    createTopic.mutate({ name, description, branch, icon });
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 'var(--space-8)' }}>
        <div className="field" style={{ width: 70 }}>
          <label>Icon</label>
          <input className="input" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="📘" style={{ textAlign: 'center' }} />
        </div>
        <div className="field" style={{ flex: '1 1 200px' }}>
          <label>Topic name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Differentiation" required />
        </div>
        <div className="field" style={{ flex: '2 1 300px' }}>
          <label>Description</label>
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Rates of change..." required />
        </div>
        <div className="field" style={{ width: 110 }}>
          <label>Branch</label>
          <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option>Pure</option>
            <option>Applied</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit" disabled={createTopic.isPending}>
          {createTopic.isPending ? 'Adding…' : 'Add topic'}
        </button>
      </form>

      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {topics && topics.length > 0 && (
        <div className="table-wrap">
        <table className="table">
          <thead><tr><th></th><th>Name</th><th>Branch</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <td style={{ fontSize: 18 }}>{t.icon}</td>
                <td style={{ fontWeight: 500 }}>{t.name}</td>
                <td>{t.branch}</td>
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
        </div>
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
    questionImageUrl: '',
    answer: '',
    explanation: '',
    difficulty: 'Medium',
    language: 'English',
    mathTopicId: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedImageUrl, setExtractedImageUrl] = useState<string | null>(null);
  const [bulkJson, setBulkJson] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const createPaper = useMutation({
    mutationFn: (dto: typeof form) => apiFetch<PastPaper>('/api/PastPapers', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastPapers'] });
      setForm({ ...form, questionNumber: '', questionText: '', questionImageUrl: '', answer: '', explanation: '' });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to create question'),
  });

  // Each item computes its own embedding server-side (same as single Create)
  // — this is what actually makes newly-imported questions show up in the
  // AI Tutor's "related past paper" grounding.
  const bulkImport = useMutation({
    mutationFn: (items: unknown[]) => apiFetch<{ added: number }>('/api/PastPapers/bulk', { method: 'POST', body: JSON.stringify(items) }),
    onSuccess: (res) => {
      setBulkResult(`${res.added} questions imported.`);
      setBulkJson('');
      queryClient.invalidateQueries({ queryKey: ['pastPapers'] });
    },
    onError: (err) => setBulkError(err instanceof ApiError ? err.message : 'Import failed'),
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

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setError(null);
    setExtractedImageUrl(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await apiFetch<{ extractedText: string; imageUrl: string }>('/api/PastPapers/extract-from-image', {
        method: 'POST',
        body: formData,
      });
      // Pre-fill the question text field with what the AI transcribed —
      // the admin should still read it over and correct anything before saving.
      setForm((prev) => ({ ...prev, questionText: result.extractedText, questionImageUrl: result.imageUrl }));
      setExtractedImageUrl(result.imageUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not read the photo. Try a clearer image.');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  }

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
      {/* Bulk import — paste a JSON array of questions here. Each item needs
          year/paper/questionNumber/questionText/answer/explanation/
          difficulty/language/mathTopicId; embeddings are computed
          server-side, same as adding one at a time. */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Bulk import (JSON array)</label>
        <textarea
          className="input"
          style={{ minHeight: 120, fontFamily: 'monospace', fontSize: 12.5 }}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='[{"year":2023,"paper":"Paper I","questionNumber":"5(a)","questionText":"...","answer":"...","explanation":"...","difficulty":"Medium","language":"English","mathTopicId":1}]'
        />
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginTop: 8 }}>
          <button className="btn btn-primary" onClick={handleBulkSubmit} disabled={!bulkJson.trim() || bulkImport.isPending}>
            {bulkImport.isPending ? 'Importing…' : 'Import all'}
          </button>
          {bulkError && <span style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }}>{bulkError}</span>}
          {bulkResult && <span style={{ fontSize: 12.5, color: 'var(--color-accent)' }}>{bulkResult}</span>}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', border: '1px dashed color-mix(in srgb, var(--color-text) 25%, transparent)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Upload a question photo (optional)</div>
          <p style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)', margin: '0 0 10px' }}>
            The AI will transcribe the text from the photo into the Question text field below — review and correct it before saving.
          </p>
          <input
            ref={fileInputRef}
            className="file-input-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoUpload}
            disabled={isExtracting}
          />
          {isExtracting && <div style={{ fontSize: 12.5, color: 'var(--color-accent)', marginTop: 8 }}>Reading the question from the photo…</div>}
          {extractedImageUrl && !isExtracting && (
            <div style={{ marginTop: 10 }}>
              <img src={extractedImageUrl} alt="Uploaded question" style={{ maxWidth: 220, maxHeight: 160, borderRadius: 'var(--radius-sm)', display: 'block' }} />
            </div>
          )}
        </div>
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
        <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Year</th><th>Q#</th><th>Topic</th><th>Image?</th><th></th></tr></thead>
          <tbody>
            {papers.map((p) => (
              <tr key={p.id}>
                <td>{p.year} · {p.paper}</td>
                <td>{p.questionNumber}</td>
                <td>{p.mathTopicName}</td>
                <td>{p.questionImageUrl ? '🖼️' : '—'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5, color: 'var(--color-neutral-300)' }} onClick={() => deletePaper.mutate(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Resources ─────────────────────────

function ResourcesAdmin() {
  const queryClient = useQueryClient();
  const { data: topics } = useQuery({ queryKey: ['mathTopics'], queryFn: () => apiFetch<MathTopic[]>('/api/MathTopics') });
  const { data: resources, isLoading } = useQuery({ queryKey: ['resources', 'admin'], queryFn: () => apiFetch<Resource[]>('/api/Resources') });

  const [form, setForm] = useState({ title: '', url: '', sourceType: 'YouTube', language: 'English', branch: 'Pure', mathTopicId: 0 });
  const [error, setError] = useState<string | null>(null);

  const createResource = useMutation({
    mutationFn: (dto: typeof form) => apiFetch<Resource>('/api/Resources', { method: 'POST', body: JSON.stringify(dto) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setForm({ title: '', url: '', sourceType: 'YouTube', language: 'English', branch: 'Pure', mathTopicId: 0 });
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
        <div className="field" style={{ width: 110 }}>
          <label>Branch</label>
          <select className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            <option>Pure</option>
            <option>Applied</option>
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
        <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Title</th><th>Type</th><th>Language</th><th>Branch</th><th>Topic</th><th></th></tr></thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.title}</td>
                <td>{r.sourceType}</td>
                <td>{r.language}</td>
                <td>{r.branch}</td>
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
        </div>
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
  const [startPage, setStartPage] = useState(0);

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
      formData.append('startPage', String(startPage));
      const res = await apiFetch<{ sourceTitle: string; chunksCreated: number; stoppedReason: string | null }>('/api/Documents/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.stoppedReason) {
        setResult(`${res.chunksCreated} pages saved this run. ${res.stoppedReason}`);
      } else {
        setResult(`"${res.sourceTitle}" processed — ${res.chunksCreated} chunks indexed.`);
        setFile(null);
        setStartPage(0);
      }
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

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <label style={{ fontSize: 12.5 }}>Resume from page:</label>
        <input
          className="input"
          type="number"
          style={{ width: 80 }}
          value={startPage}
          onChange={(e) => setStartPage(Number(e.target.value))}
          min={0}
        />
        <span style={{ fontSize: 11.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>
          (0 = from the start; use the number shown after a quota stop)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <input className="file-input-pdf" type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button className="btn btn-primary" onClick={handleUpload} disabled={!file || isUploading}>
          {isUploading ? 'Processing…' : 'Upload & Index'}
        </button>
      </div>

      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      {result && <div style={{ fontSize: 13, color: 'var(--color-accent)', marginBottom: 'var(--space-4)' }}>{result}</div>}

      {isLoading && <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>}

      {documents && documents.length > 0 && (
        <div className="table-wrap">
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
        </div>
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
        <div className="table-wrap">
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
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Overview ─────────────────────────

interface AdminOverview {
  totalUsers: number;
  adminCount: number;
  premiumSubscribers: number;
  topicsCount: number;
  pastPaperQuestionsCount: number;
  resourcesCount: number;
  examPaperDocumentsCount: number;
  documentChunksCount: number;
  chatMessagesToday: number;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', gap: 6, borderTop: color ? `3px solid ${color}` : undefined }}>
      <div style={{ fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, color: color ?? 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

// Backs the three charts below — all computed server-side from real rows
// (see AdminController.GetAnalytics), nothing here is mocked.
interface UserGrowthPoint {
  date: string;
  newUsers: number;
  cumulativeUsers: number;
}
interface TopicUsage {
  topic: string;
  mentionCount: number;
}
interface AdminAnalytics {
  userGrowth: UserGrowthPoint[];
  mostAskedTopics: TopicUsage[];
  freeUsers: number;
  premiumUsers: number;
}

// Fixed categorical order (see design-system.css --chart-series-1..8) — never
// cycled or reassigned per-render, so a given slot always means the same thing.
const CHART_SERIES = [
  'var(--chart-series-1)', 'var(--chart-series-2)', 'var(--chart-series-3)', 'var(--chart-series-4)',
  'var(--chart-series-5)', 'var(--chart-series-6)', 'var(--chart-series-7)', 'var(--chart-series-8)',
];

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: 'var(--space-4)', gap: 4, overflow: 'visible' }}>
      <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-3)' }}>{subtitle}</div>
      {children}
    </div>
  );
}

const tooltipStyle = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-divider)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12.5,
  color: 'var(--color-text)',
};

function UserGrowthChart({ data }: { data: UserGrowthPoint[] }) {
  const isFlat = data.length === 0 || data.every((d) => d.newUsers === 0);
  return (
    <ChartCard title="User growth" subtitle="Cumulative signups, last 30 days — the platform is growing.">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-series-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-series-1)" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10.5, fill: 'var(--chart-axis)' }}
            tickFormatter={(d: string) => d.slice(5)}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 10.5, fill: 'var(--chart-axis)' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(d) => String(d)}
            formatter={(value) => [String(value), 'Total users']}
            allowEscapeViewBox={{ x: true, y: true }}
            cursor={{ stroke: 'var(--chart-axis)', strokeDasharray: '3 3' }}
          />
          <Area type="monotone" dataKey="cumulativeUsers" name="Total users" stroke="var(--chart-series-1)" strokeWidth={2} fill="url(#userGrowthFill)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      {isFlat && (
        <div style={{ fontSize: 11.5, color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', marginTop: 4 }}>
          No new signups in the last 30 days yet.
        </div>
      )}
    </ChartCard>
  );
}

function MostAskedTopicsChart({ data }: { data: TopicUsage[] }) {
  if (data.length === 0) {
    return (
      <ChartCard title="Most-asked topics" subtitle="How students actually use the AI tutor.">
        <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', padding: '24px 0', textAlign: 'center' }}>
          Not enough chat activity yet to surface a trend.
        </div>
      </ChartCard>
    );
  }
  // Chart reads top-to-bottom by rank, so reverse for recharts' bottom-up
  // vertical-bar layout.
  const chartData = [...data].reverse();
  return (
    <ChartCard title="Most-asked topics" subtitle="Chat mentions by topic — an AI-tutor usage signal, top 8.">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 28, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10.5, fill: 'var(--chart-axis)' }} axisLine={{ stroke: 'var(--chart-grid)' }} tickLine={false} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="topic"
            width={110}
            tick={{ fontSize: 11, fill: 'var(--color-text)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [String(value), 'Mentions']} allowEscapeViewBox={{ x: true, y: true }} cursor={{ fill: 'color-mix(in srgb, var(--color-text) 6%, transparent)' }} />
          <Bar dataKey="mentionCount" name="Mentions" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {chartData.map((_, i) => (
              // Original (unreversed) rank picks the color slot, so topic #1
              // always gets slot 1 regardless of the vertical-layout reversal.
              <Cell key={i} fill={CHART_SERIES[(data.length - 1 - i) % CHART_SERIES.length]} />
            ))}
            <LabelList dataKey="mentionCount" position="right" style={{ fill: 'var(--color-text)', fontSize: 11 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const RADIAN = Math.PI / 180;

// Outside labels ("Free 6 (86%)") kept spilling past the card edge in a
// narrow 3-column grid and got clipped by the SVG's own bounds. Drawing the
// percent INSIDE the ring instead (the standard donut-label placement —
// project a point partway between inner/outer radius onto the slice's
// midAngle) can never overflow the chart, regardless of card width. The
// legend below still carries the Free/Premium identity + exact counts via
// tooltip, so nothing is lost — just relocated somewhere that can't clip.
function insidePercentLabel(props: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number }) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 } = props;
  if (percent === 0) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={12} fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
}

function FreeVsPremiumChart({ freeUsers, premiumUsers }: { freeUsers: number; premiumUsers: number }) {
  const total = freeUsers + premiumUsers;
  const pieData = [
    { name: 'Free', value: freeUsers, fill: 'var(--chart-series-1)' },
    { name: 'Premium', value: premiumUsers, fill: 'var(--chart-series-2)' },
  ];
  return (
    <ChartCard title="Free vs Premium" subtitle="Subscription split — proof the business model works.">
      {total === 0 ? (
        <div style={{ fontSize: 12.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', padding: '24px 0', textAlign: 'center' }}>
          No users yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="var(--color-surface)"
              strokeWidth={2}
              label={insidePercentLabel}
              labelLine={false}
            >
              {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [String(value), String(name)]} allowEscapeViewBox={{ x: true, y: true }} />
            <Legend verticalAlign="bottom" height={24} wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

function OverviewAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminOverview'],
    queryFn: () => apiFetch<AdminOverview>('/api/Admin/overview'),
  });
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => apiFetch<AdminAnalytics>('/api/Admin/analytics'),
  });

  if (isLoading || !data) return <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        <StatCard label="Total users" value={data.totalUsers} color="var(--chart-series-1)" />
        <StatCard label="Premium subscribers" value={data.premiumSubscribers} color="var(--chart-series-2)" />
        <StatCard label="Admins" value={data.adminCount} color="var(--chart-series-7)" />
        <StatCard label="Chat messages today" value={data.chatMessagesToday} color="var(--chart-series-3)" />
      </div>

      <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-4)' }}>Insights</h6>
      {analyticsLoading || !analytics ? (
        <p style={{ fontSize: 14, opacity: 0.7, marginBottom: 'var(--space-8)' }}>Loading charts…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <UserGrowthChart data={analytics.userGrowth} />
          <MostAskedTopicsChart data={analytics.mostAskedTopics} />
          <FreeVsPremiumChart freeUsers={analytics.freeUsers} premiumUsers={analytics.premiumUsers} />
        </div>
      )}

      <h6 style={{ color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', marginBottom: 'var(--space-4)' }}>Content</h6>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 'var(--space-3)' }}>
        <StatCard label="Topics" value={data.topicsCount} color="var(--chart-series-4)" />
        <StatCard label="Past paper questions" value={data.pastPaperQuestionsCount} color="var(--chart-series-5)" />
        <StatCard label="Resources" value={data.resourcesCount} color="var(--chart-series-6)" />
        <StatCard label="Full exam papers" value={data.examPaperDocumentsCount} color="var(--chart-series-8)" />
        <StatCard label="Document chunks (RAG)" value={data.documentChunksCount} color="var(--chart-series-1)" />
      </div>
    </div>
  );
}

// ───────────────────────── Users ─────────────────────────

interface AdminUser {
  id: string;
  email: string;
  userName: string;
  emailConfirmed: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  subscriptionExpiresAt: string | null;
}

// Replaces the old standalone "Make Admin"/"Remove Admin" button — editing
// a user's email/username and their role now happens together in one Edit
// row, saved with a single PUT /api/Admin/users/{id}.
function UsersAdmin() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', userName: '', isAdmin: false });
  const [error, setError] = useState<string | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => apiFetch<AdminUser[]>('/api/Admin/users'),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, ...dto }: { id: string; email: string; userName: string; isAdmin: boolean }) =>
      apiFetch<void>(`/api/Admin/users/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setEditingId(null);
      setError(null);
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Failed to save changes'),
  });

  function startEdit(u: AdminUser) {
    setEditingId(u.id);
    setForm({ email: u.email, userName: u.userName, isAdmin: u.isAdmin });
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function saveEdit(id: string) {
    updateUser.mutate({ id, ...form });
  }

  if (isLoading) return <p style={{ fontSize: 14, opacity: 0.7 }}>Loading…</p>;

  return (
    <div>
      {error && <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', marginBottom: 'var(--space-4)' }}>{error}</div>}
      <div className="table-wrap">
      <table className="table">
        <thead><tr><th>Username</th><th>Email</th><th>Verified</th><th>Plan</th><th>Role</th><th></th></tr></thead>
        <tbody>
          {(users ?? []).map((u) =>
            editingId === u.id ? (
              <tr key={u.id}>
                <td>
                  <input className="input" style={{ minHeight: 30, fontSize: 13 }} value={form.userName} onChange={(e) => setForm({ ...form, userName: e.target.value })} />
                </td>
                <td>
                  <input className="input" style={{ minHeight: 30, fontSize: 13 }} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </td>
                <td>{u.emailConfirmed ? '✓' : '—'}</td>
                <td>{u.isPremium ? `Premium (until ${u.subscriptionExpiresAt})` : 'Free'}</td>
                <td>
                  <select className="input" style={{ minHeight: 30, fontSize: 13 }} value={form.isAdmin ? 'Admin' : 'Student'} onChange={(e) => setForm({ ...form, isAdmin: e.target.value === 'Admin' })}>
                    <option>Student</option>
                    <option>Admin</option>
                  </select>
                </td>
                <td style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" style={{ fontSize: 12.5 }} onClick={() => saveEdit(u.id)} disabled={updateUser.isPending}>
                    {updateUser.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={cancelEdit} disabled={updateUser.isPending}>
                    Cancel
                  </button>
                </td>
              </tr>
            ) : (
              <tr key={u.id}>
                <td>{u.userName}</td>
                <td>{u.email}</td>
                <td>{u.emailConfirmed ? '✓' : '—'}</td>
                <td>{u.isPremium ? `Premium (until ${u.subscriptionExpiresAt})` : 'Free'}</td>
                <td>{u.isAdmin ? <span className="tag tag-accent">Admin</span> : <span className="tag tag-neutral">Student</span>}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn btn-ghost" style={{ fontSize: 12.5 }} onClick={() => startEdit(u)}>
                    Edit
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}