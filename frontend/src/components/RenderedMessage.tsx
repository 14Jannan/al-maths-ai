import { Math } from './Math';

// Splits AI reply text on LaTeX delimiters (\[ \], \( \)) and markdown-style
// image syntax (![alt](url)) — used to render both formulas and uploaded
// question photos inline in the chat.
export function RenderedMessage({ text }: { text: string }) {
  const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|!\[[^\]]*\]\([^)]+\))/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('\\[') && part.endsWith('\\]')) {
          const tex = part.slice(2, -2).trim();
          return <Math key={i} tex={tex} display style={{ margin: '8px 0' }} />;
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
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
}