import { Math } from './Math';

// Splits AI reply text on LaTeX delimiters — \[ ... \] (display math),
// \( ... \) (inline math) — and renders each piece with KaTeX or as plain
// text. This keeps the AI's chat-style answer readable instead of showing
// raw LaTeX source.
export function RenderedMessage({ text }: { text: string }) {
  const parts = text.split(/(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g);

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
        return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
      })}
    </>
  );
}