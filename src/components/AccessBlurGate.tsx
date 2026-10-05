import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  isContentUnlocked,
  setContentUnlocked,
  verifyAccessCode,
} from '../services/accessService';
import './AccessBlurGate.css';

interface AccessBlurGateProps {
  children: ReactNode;
  label?: string;
}

export default function AccessBlurGate({
  children,
  label = 'this content',
}: AccessBlurGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUnlocked(isContentUnlocked());
    setReady(true);
  }, []);

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setBusy(true);
    setError('');
    try {
      await verifyAccessCode(trimmed);
      setContentUnlocked(true);
      setUnlocked(true);
      setCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Access denied');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <div className="access-gate access-gate-loading" aria-hidden="true" />;
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="access-gate">
      <div className="access-gate-blurred" aria-hidden="true">
        {children}
      </div>
      <div className="access-gate-overlay">
        <form className="access-gate-form" onSubmit={handleUnlock}>
          <p className="access-gate-kicker">Access required</p>
          <p className="access-gate-copy">Enter the access code to view {label}.</p>
          <label htmlFor={`access-code-${label.replace(/\s+/g, '-')}`}>
            Access code
          </label>
          <input
            id={`access-code-${label.replace(/\s+/g, '-')}`}
            type="password"
            autoComplete="current-password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          {error && <p className="access-gate-error">{error}</p>}
          <button type="submit" disabled={busy || !code.trim()}>
            {busy ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
