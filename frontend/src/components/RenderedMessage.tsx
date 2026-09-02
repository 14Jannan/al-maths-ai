import { Math } from './Math';

// Splits AI reply text on LaTeX delimiters (\[ \], \( \)), markdown-style
// image syntax (![alt](url)), and **bold** markdown — used to render
// formulas, uploaded photos, and basic emphasis inline in the chat.
export function RenderedMessage({ text }: { text: string }) {
  const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|!\[[^\]]*\]\([^)]+\)|\*\*[^*]+\*\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const tex = part.slice(2, -2).trim();
          return (
            <div key={i} style={{ overflowX: 'auto', maxWidth: '100%' }}>
              <Math tex={tex} display style={{ margin: '8px 0' }} />
            </div>
          );
        }
        if (part.startsWith('\\(') && part.endsWith('\\)')) {
          const tex = part.slice(2, -2).trim();
          return <Math key={i} tex={tex} style={{ display: 'inline-block' }} />;
        }
        const imageMatch = part.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imageMatch) {
          const [, alt, url] = imageMatch;
          return (
            <img
              key={i}
              src={url}
              alt={alt || 'question'}
              style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 'var(--radius-md)', display: 'block', margin: '6px 0' }}
            />
          );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return (
          <span key={i} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word', wordBreak: 'break-word' }}>
            {part}
          </span>
        );
      })}
    </>
  );
}