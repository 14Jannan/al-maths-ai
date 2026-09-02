import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, ApiError } from '../lib/api';
import { getConversation } from '../lib/conversations';
import { RenderedMessage } from '../components/RenderedMessage';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

interface ChatResponseDto {
  reply: string;
  conversationId: number;
}

export function Tutor() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();
  const initialTopic = (location.state as { topic?: string } | null)?.topic;

  const conversationId = params.conversationId ? Number(params.conversationId) : null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: usage } = useQuery({
    queryKey: ['chatUsage'],
    queryFn: () => apiFetch<{ isPremium: boolean; used: number; limit: number | null }>('/api/Chat/usage'),
  });

  // Load an existing conversation's messages when the URL points at one.
  // Clears the chat when the user picks "New chat" (conversationId becomes null).
  useEffect(() => {
    if (conversationId == null) {
      setMessages([]);
      return;
    }
    setIsLoadingHistory(true);
    getConversation(conversationId)
      .then((detail) => {
        setMessages(detail.messages.map((m) => ({ id: String(m.id), role: m.role as 'user' | 'ai', text: m.content })));
      })
      .catch(() => setError('Could not load that conversation.'))
      .finally(() => setIsLoadingHistory(false));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  async function sendMessage(text: string) {
    if (!text.trim() || isThinking) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setDraft('');
    setError(null);
    setIsThinking(true);

    try {
      const result = await apiFetch<ChatResponseDto>('/api/Chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, conversationId }),
      });
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', text: result.reply }]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chatUsage'] });

      // Brand new conversation — move the URL to include its id so refreshing
      // the page or picking it from the sidebar keeps working correctly.
      if (conversationId == null) {
        navigate(`/tutor/${result.conversationId}`, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('You\u2019ve used all 10 free questions today. Upgrade to Premium for unlimited questions.');
      } else {
        setError(err instanceof ApiError ? err.message : 'The tutor is unavailable right now. Try again in a moment.');
      }
    } finally {
      setIsThinking(false);
    }
  }

    const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function sendImage(file: File) {
    if (isThinking || isUploadingImage) return;

    setIsUploadingImage(true);
    setError(null);

    // Show the photo immediately as the user's message, before the server responds
    const previewUrl = URL.createObjectURL(file);
    const placeholderId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: placeholderId, role: 'user', text: `![question image](${previewUrl})` }]);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('message', draft);
      if (conversationId) formData.append('conversationId', String(conversationId));

      const result = await apiFetch<{ reply: string; imageUrl: string; conversationId: number }>('/api/Chat/image', {
        method: 'POST',
        body: formData,
      });

      setDraft('');
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'ai', text: result.reply }]);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chatUsage'] });

      if (conversationId == null) {
        navigate(`/tutor/${result.conversationId}`, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('You\u2019ve used all 10 free questions today. Upgrade to Premium for unlimited questions.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not process the image. Try again.');
      }
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) sendImage(file);
    e.target.value = ''; // allow selecting the same file again later
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(draft);
  }

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0, width: '100%' }}>
      <main
        style={{
          flex: 1,
          minWidth: 0,
          maxWidth: 900,
          margin: '0 auto',
          padding: 'var(--space-6) clamp(14px,4vw,40px) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap', paddingBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0 }}>AI Tutor</h4>
            {initialTopic && <span className="tag tag-neutral">Context: {initialTopic}</span>}
            {usage && !usage.isPremium && <span className="tag tag-outline">{usage.used}/{usage.limit} today</span>}
            {usage?.isPremium && <span className="tag tag-accent">Premium — unlimited</span>}
          </div>
          <div style={{ fontSize: 12, color: 'color-mix(in srgb, var(--color-text) 58%, transparent)' }}>
            Ask in English or தமிழ் — the answer follows your question
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', padding: 'var(--space-4) 0 var(--space-8)', minHeight: 0, overflowY: 'auto' }}>
          {isLoadingHistory && (
            <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', textAlign: 'center', marginTop: 'var(--space-8)' }}>
              Loading conversation…
            </div>
          )}

          {!isLoadingHistory && messages.length === 0 && (
            <div style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', textAlign: 'center', marginTop: 'var(--space-8)' }}>
              Ask your first question below to get started.
            </div>
          )}

          {messages.map((m) =>
            m.role === 'user' ? (
              <div
                key={m.id}
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: 'min(600px,88%)',
                  border: '1px solid var(--color-divider)',
                  borderRadius: '14px 14px 4px 14px',
                  padding: '10px 14px',
                  fontSize: 14.5,
                  lineHeight: 1.6,
                }}
              >
                {m.text}
              </div>
            ) : (
              <div
                key={m.id}
                style={{
                  maxWidth: '100%',
                  overflowX: 'hidden',
                  background: 'var(--color-surface)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-6)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 52%, transparent)' }}>
                  <span style={{ width: 5, height: 5, background: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
                  iMath tutor
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.75 }}><RenderedMessage text={m.text} /></div>
              </div>
            )
          )}

          {isThinking && (
            <div style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 0.2, 0.4].map((delay) => (
                  <span
                    key={delay}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--color-accent)',
                      animation: `im-dot 1.4s ease-in-out ${delay}s infinite`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
                Working through it — checking the syllabus method first.
              </span>
            </div>
          )}

          {isUploadingImage && (
            <div style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{ fontSize: 13.5, color: 'color-mix(in srgb, var(--color-text) 60%, transparent)' }}>
                Reading the question from your photo…
              </span>
            </div>
          )}

          {error && (
            <div style={{ fontSize: 13, color: 'var(--color-neutral-300)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3) var(--space-4)' }}>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, var(--color-bg) 70%, transparent)', paddingBottom: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <form style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }} onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileSelected}
          />
          <button
            type="button"
            className="btn btn-secondary btn-icon"
            style={{ height: 46, width: 46, flexShrink: 0 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking || isUploadingImage}
            title="Upload a photo of a question"
          >
            📷
          </button>
          <textarea
              className="input"
              placeholder="Ask a question about differentiation, integration, vectors…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(draft);
                }
              }}
              style={{ minHeight: 46, maxHeight: 120, resize: 'none', padding: 12, fontSize: 14.5 }}
            />
            <button className="btn btn-primary" type="submit" disabled={isThinking || isUploadingImage || !draft.trim()} style={{ height: 46, paddingInline: 18 }}>
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}