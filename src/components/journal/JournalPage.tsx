import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { JournalFile } from '../../../lib/journal/journalStore';
import {
  clearJournalCode,
  createJournalFile,
  fetchJournalFiles,
  getStoredJournalCode,
  storeJournalCode,
} from '../../services/journalService';
import './Journal.css';

function todayISO(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function previewText(text: string, max = 110): string {
  const flat = text
    .replace(/^#\s+.+$/m, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!flat) return 'Markdown notes';
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max).trimEnd()}…`;
}

function toggleId(prev: Set<string>, id: string): Set<string> {
  const next = new Set(prev);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

/** Lightweight markdown rendering for a full .md file body. */
function renderMarkdown(markdown: string): ReactNode[] {
  const blocks = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  blocks.forEach((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return;

    const key = `md-${index}`;

    if (/^```/.test(trimmed)) {
      const lines = trimmed.split('\n');
      const body = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined).join('\n');
      nodes.push(
        <pre key={key} className="journal-md-code">
          <code>{body}</code>
        </pre>
      );
      return;
    }

    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)?.[0].length ?? 1;
      const text = trimmed.replace(/^#{1,3}\s+/, '');
      if (level === 1) {
        nodes.push(
          <h3 key={key} className="journal-md-h1">
            {text}
          </h3>
        );
      } else if (level === 2) {
        nodes.push(
          <h4 key={key} className="journal-md-h2">
            {text}
          </h4>
        );
      } else {
        nodes.push(
          <h5 key={key} className="journal-md-h3">
            {text}
          </h5>
        );
      }
      return;
    }

    if (/^>\s?/.test(trimmed)) {
      nodes.push(
        <blockquote key={key} className="journal-md-quote">
          {trimmed.replace(/^(>\s?)/gm, '')}
        </blockquote>
      );
      return;
    }

    if (/^(- |\* |\d+\. )/.test(trimmed)) {
      const items = trimmed.split('\n').filter(Boolean);
      nodes.push(
        <ul key={key} className="journal-md-list">
          {items.map((item) => (
            <li key={item}>{item.replace(/^(- |\* |\d+\. )/, '')}</li>
          ))}
        </ul>
      );
      return;
    }

    nodes.push(
      <p key={key} className="journal-md-p">
        {trimmed}
      </p>
    );
  });

  return nodes;
}

export default function JournalPage() {
  const [code, setCode] = useState(getStoredJournalCode);
  const [unlocked, setUnlocked] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [files, setFiles] = useState<JournalFile[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [date, setDate] = useState(todayISO);
  const [body, setBody] = useState('');
  const [writeCode, setWriteCode] = useState('');
  const [needsWriteCode, setNeedsWriteCode] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (accessCode = '') => {
    const next = await fetchJournalFiles(accessCode);
    setFiles(next);
    setUnlocked(true);
    setUnlockError('');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        await load('');
        if (!cancelled) {
          setAuthRequired(false);
        }
        return;
      } catch {
        // Auth is required — fall through to stored / unlock form.
      }

      if (cancelled) return;

      setAuthRequired(true);
      const stored = getStoredJournalCode();
      if (!stored) {
        setUnlocked(false);
        return;
      }

      try {
        await load(stored);
      } catch (error: unknown) {
        clearJournalCode();
        setCode('');
        setUnlocked(false);
        setUnlockError(error instanceof Error ? error.message : 'Access denied');
      }
    }

    boot().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [load]);

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setBusy(true);
    setUnlockError('');
    try {
      await load(trimmed);
      storeJournalCode(trimmed);
      setAuthRequired(true);
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : 'Access denied');
    } finally {
      setBusy(false);
    }
  };

  const handleLock = () => {
    clearJournalCode();
    setUnlocked(false);
    setAuthRequired(true);
    setCode('');
    setFiles([]);
    setExpanded(new Set());
    setBody('');
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;

    const accessCode = getStoredJournalCode() || writeCode.trim();
    setBusy(true);
    setStatus('');
    try {
      const file = await createJournalFile({ date, body }, accessCode);
      if (accessCode) {
        storeJournalCode(accessCode);
        setWriteCode('');
        setNeedsWriteCode(false);
      }
      setFiles((prev) => [file, ...prev.filter((item) => item.id !== file.id)]);
      setExpanded((prev) => new Set(prev).add(file.id));
      setBody('');
      setDate(todayISO());
      setStatus(`Saved ${file.id}`);
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        setNeedsWriteCode(true);
        setStatus('Enter the journal access code to save.');
        return;
      }
      setStatus(error instanceof Error ? error.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="journal-page">
        <p className="journal-subtitle">Loading journal…</p>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="journal-page">
        <section className="journal-lock">
          <h1 className="journal-title">Journal Log</h1>
          <p className="journal-subtitle">Enter the access code to open your notes.</p>
          <form className="journal-form" onSubmit={handleUnlock}>
            <label htmlFor="journal-code">Access code</label>
            <input
              id="journal-code"
              type="password"
              autoComplete="current-password"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            {unlockError && <p className="journal-error">{unlockError}</p>}
            <button type="submit" disabled={busy}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="journal-page">
      <header className="journal-header">
        <div>
          <h1 className="journal-title">Journal Log</h1>
          <p className="journal-subtitle">
            Each <code>.md</code> in <code>src/components/journal/</code> is one entry.
          </p>
        </div>
        {authRequired && (
          <button type="button" className="journal-lock-btn" onClick={handleLock}>
            Lock
          </button>
        )}
      </header>

      <form className="journal-form journal-entry-form" onSubmit={handleSave}>
        <label htmlFor="journal-date">Date</label>
        <input
          id="journal-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
        />

        <label htmlFor="journal-body">Notes</label>
        <textarea
          id="journal-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          placeholder="What moved forward today? Saved as a new .md file."
          required
        />

        {(needsWriteCode || !getStoredJournalCode()) && (
          <>
            <label htmlFor="journal-write-code">Access code (required to save)</label>
            <input
              id="journal-write-code"
              type="password"
              autoComplete="current-password"
              value={writeCode}
              onChange={(event) => setWriteCode(event.target.value)}
              required={needsWriteCode}
            />
          </>
        )}

        {status && <p className="journal-status">{status}</p>}
        <button type="submit" disabled={busy || !body.trim()}>
          {busy ? 'Saving…' : 'Save entry'}
        </button>
      </form>

      <section className="journal-list" aria-label="Journal markdown files">
        <h2>Entries</h2>
        {files.length === 0 ? (
          <p className="journal-empty">No markdown files yet.</p>
        ) : (
          <ol>
            {files.map((file) => {
              const open = expanded.has(file.id);
              return (
                <li
                  key={file.id}
                  className={`journal-entry ${open ? 'journal-entry-open' : ''}`}
                >
                  <div className="journal-entry-head">
                    <button
                      type="button"
                      className="journal-toggle"
                      aria-expanded={open}
                      onClick={() => setExpanded((prev) => toggleId(prev, file.id))}
                    >
                      <span className="journal-toggle-caret" aria-hidden="true" />
                      <span className="journal-toggle-label">
                        <span className="journal-file-title">{file.title}</span>
                        <span className="journal-file-meta">
                          {file.date ? formatDate(file.date) : file.id}
                        </span>
                        {!open && (
                          <span className="journal-toggle-preview">
                            {previewText(file.content)}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                  {open && (
                    <div className="journal-file-body">
                      {renderMarkdown(file.content)}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
