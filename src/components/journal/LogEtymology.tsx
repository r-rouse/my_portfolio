import { useEffect, useId, useRef, useState } from 'react';

export default function LogEtymologyTooltip() {
  const tooltipId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <span
      ref={rootRef}
      className={`log-tip ${open ? 'log-tip-open' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="log-tip-trigger"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        onClick={() => setOpen((value) => !value)}
      >
        Log
      </button>

      <span
        id={tooltipId}
        role="tooltip"
        className="log-tip-panel"
        hidden={!open}
      >
        <span className="log-tip-kicker">Etymology</span>
        <span className="log-tip-lineage">
          wood → chip log → log-book → work log
        </span>
        <span className="log-tip-text">
          Sailors measured speed by throwing a weighted chip of wood overboard on a
          knotted line. Counting the knots that paid out over a fixed time gave the
          ship’s speed — and the nautical “knot.” Those readings went into a
          log-book with course, weather, and notable events.
        </span>
        <span className="log-tip-text">
          The sense widened from navigation records to any chronological record,
          then into computing: ship’s log → engineering log → computer / server /
          Git logs.
        </span>
        <span className="log-tip-close">
          A chronological record of where we are, how we got here, and what
          happened along the way.
        </span>
      </span>
    </span>
  );
}
