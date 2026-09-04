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
//
// The wrapper element must be inline (span) for display=false — a block
// element (div) forces a line break before/after every formula, which
// breaks up a sentence like "Differentiate <Math/> with respect to <Math/>."
// into one fragment per line instead of flowing as normal text.
export function Math({ tex, display = false, style, className }: MathProps) {
  const ref = useRef<HTMLSpanElement & HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      katex.render(tex, ref.current, {
        displayMode: display,
        throwOnError: false,
      });
    }
  }, [tex, display]);

  if (display) {
    return <div ref={ref} style={style} className={className} />;
  }
  return <span ref={ref} style={style} className={className} />;
}
