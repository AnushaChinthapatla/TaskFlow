import { useState, type FormEvent } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-xl font-bold text-white">✓</div>
          <h1 className="text-2xl font-bold">TaskFlow</h1>
          <p className="text-sm text-slate-500">
            {mode === 'login' ? 'Welcome back — sign in to your board.' : 'Create an account to start organising.'}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={mode === 'register' ? 8 : 1} />
            {mode === 'register' && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}
          </div>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button className="font-medium text-indigo-600 hover:underline"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
