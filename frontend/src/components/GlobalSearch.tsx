import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { search, type SearchResult } from '../lib/search';

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce: wait 300ms after the user stops typing before searching, so
  // we're not firing a request on every single keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useQuery<SearchResult>({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => search(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  });

  // Close the dropdown when clicking outside it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function goTo(path: string) {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  }

  const hasResults = data && (data.topics.length + data.papers.length + data.resources.length > 0);
  const showDropdown = isOpen && debouncedQuery.trim().length >= 2;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        className="input"
        placeholder="Search topics, papers, resources…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={{ fontSize: 13, padding: '7px 10px' }}
      />

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            maxHeight: 360,
            overflowY: 'auto',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md, 0 8px 24px rgba(0,0,0,0.35))',
            zIndex: 50,
            padding: 'var(--space-2)',
          }}
        >
          {isFetching && <div style={{ fontSize: 12.5, padding: 'var(--space-2)', opacity: 0.6 }}>Searching…</div>}

          {!isFetching && !hasResults && (
            <div style={{ fontSize: 12.5, padding: 'var(--space-2)', opacity: 0.6 }}>No results for "{debouncedQuery}"</div>
          )}

          {data && data.topics.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', padding: '4px 8px' }}>
                Topics
              </div>
              {data.topics.map((t) => (
                <button
                  key={t.id}
                  onClick={() => goTo('/topics')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontSize: 13 }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subtitle}</div>
                </button>
              ))}
            </div>
          )}

          {data && data.papers.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', padding: '4px 8px' }}>
                Past Papers
              </div>
              {data.papers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goTo('/papers')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontSize: 13 }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.subtitle}</div>
                </button>
              ))}
            </div>
          )}

          {data && data.resources.length > 0 && (
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--color-text) 50%, transparent)', padding: '4px 8px' }}>
                Resources
              </div>
              {data.resources.map((r) => (
                <button
                  key={r.id}
                  onClick={() => goTo('/resources')}
                  style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '6px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'inherit' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <div style={{ fontSize: 13 }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: 'color-mix(in srgb, var(--color-text) 55%, transparent)' }}>{r.subtitle}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}