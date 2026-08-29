import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathProps {
  tex: string;
  display?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

// Renders a LaTeX formula. Use display={true} for a standalone formula block
// (like the design's data-display="1"), or leave it false for inline math.
export function Math({ tex, display = false, style, className }: MathProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [tex, display]);

  return <div ref={ref} style={style} className={className} />;
}
