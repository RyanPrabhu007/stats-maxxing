import { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import type { AuthApi } from '../hooks/useAuth';

interface Props {
  auth: AuthApi;
}

type Mode = 'signin' | 'signup';

export function AuthGate({ auth }: Props) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email || !password) {
      setError('Email and password required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    const result =
      mode === 'signin'
        ? await auth.signIn(email.trim(), password)
        : await auth.signUp(email.trim(), password);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === 'signup') {
      setInfo('Account created. Check your email if confirmation is required, then sign in.');
      setMode('signin');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="status-window w-full max-w-sm p-6"
      >
        <div className="corner-tr" />
        <div className="corner-bl" />
        <div className="text-center mb-6">
          <div className="font-display text-sm tracking-[0.4em] text-text-muted mb-1">
            STATS·MAXXING
          </div>
          <div className="font-heading text-accent-cyan uppercase tracking-[0.25em] text-base">
            {mode === 'signin' ? 'Hunter Sign In' : 'Register Hunter'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block">
            <span className="text-[11px] font-heading uppercase tracking-[0.3em] text-text-muted">
              Email
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-bg-deep/70 border border-text-dim/30 focus:border-accent-cyan/70 rounded px-3 py-2 text-sm outline-none transition-colors"
              placeholder="you@example.com"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-heading uppercase tracking-[0.3em] text-text-muted">
              Password
            </span>
            <input
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-bg-deep/70 border border-text-dim/30 focus:border-accent-cyan/70 rounded px-3 py-2 text-sm outline-none transition-colors"
              placeholder="••••••••"
              disabled={busy}
            />
          </label>

          {error && (
            <div className="text-danger text-xs border border-danger/40 bg-danger/10 rounded px-3 py-2">
              {error}
            </div>
          )}
          {info && (
            <div className="text-success text-xs border border-success/40 bg-success/10 rounded px-3 py-2">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {mode === 'signin' ? <LogIn size={14} /> : <UserPlus size={14} />}
            {busy ? 'Working…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-text-muted">
          {mode === 'signin' ? (
            <>
              No account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setInfo(null);
                }}
                className="text-accent-cyan hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have one?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setInfo(null);
                }}
                className="text-accent-cyan hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
