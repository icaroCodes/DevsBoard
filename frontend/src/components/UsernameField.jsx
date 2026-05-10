import { useEffect, useState, useRef } from 'react';
import { Check, X, Loader2, AtSign } from 'lucide-react';
import { api } from '../lib/api';

const REASON_LABELS = {
  invalid_format: 'Use 3–30 caracteres: letras minúsculas, números ou _ (deve começar com letra).',
  reserved: 'Esse username é reservado pelo sistema.',
  taken: 'Username já está em uso.',
  empty: 'Digite um username.',
};

/**
 * Controlled username input with debounced live availability check against
 * GET /auth/username/check. The parent owns `value` and gets notified via
 * `onChange(rawValue)` and `onValidityChange({ ok, reason })`.
 *
 * The check endpoint is rate-limited globally, so we debounce 350ms and
 * skip the network call if the format check fails locally.
 */
export default function UsernameField({
  value,
  onChange,
  onValidityChange,
  autoFocus = false,
  disabled = false,
}) {
  const [status, setStatus] = useState({ state: 'idle', reason: null });
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = (value || '').trim();
    if (!trimmed) {
      setStatus({ state: 'idle', reason: null });
      onValidityChange?.({ ok: false, reason: 'empty' });
      return;
    }

    setStatus({ state: 'checking', reason: null });
    const myRequest = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api(
          `/auth/username/check?username=${encodeURIComponent(trimmed)}`
        );
        // Drop stale responses if a newer request started after this one.
        if (myRequest !== requestIdRef.current) return;
        if (result?.available) {
          setStatus({ state: 'ok', reason: null });
          onValidityChange?.({ ok: true, username: result.username });
        } else {
          setStatus({ state: 'error', reason: result?.reason || 'invalid_format' });
          onValidityChange?.({ ok: false, reason: result?.reason || 'invalid_format' });
        }
      } catch (err) {
        if (myRequest !== requestIdRef.current) return;
        setStatus({ state: 'error', reason: 'network' });
        onValidityChange?.({ ok: false, reason: 'network' });
        console.warn('[username check]', err.message);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onValidityChange]);

  const helperText =
    status.state === 'error' && status.reason
      ? (REASON_LABELS[status.reason] ||
         (status.reason === 'network' ? 'Erro de conexão.' : 'Username inválido.'))
      : status.state === 'ok'
      ? 'Disponível!'
      : 'Letras minúsculas, números e _. Esse será seu @.';

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">
        Username
      </label>
      <div className="relative">
        <AtSign
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
        />
        <input
          type="text"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          maxLength={30}
          placeholder="seuusername"
          className="w-full bg-zinc-900/60 border border-zinc-700 rounded-md pl-9 pr-10 py-2 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 disabled:opacity-50"
          autoComplete="off"
          spellCheck={false}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status.state === 'checking' && (
            <Loader2 size={16} className="animate-spin text-zinc-400" />
          )}
          {status.state === 'ok' && <Check size={16} className="text-emerald-400" />}
          {status.state === 'error' && <X size={16} className="text-red-400" />}
        </div>
      </div>
      <p
        className={`mt-1.5 text-xs ${
          status.state === 'error'
            ? 'text-red-400'
            : status.state === 'ok'
            ? 'text-emerald-400'
            : 'text-zinc-500'
        }`}
      >
        {helperText}
      </p>
    </div>
  );
}
