'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-gutter-mobile">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary">Omega POS</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Management Console</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8">
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6">Sign in</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="manager@yourstore.com"
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="font-label-mono text-label-mono text-on-surface-variant uppercase tracking-wider block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-surface border border-outline rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary font-body-sm text-body-sm outline-none transition-all"
              />
            </div>

            {error && (
              <p className="font-body-sm text-body-sm text-error bg-error-container px-4 py-3 rounded-lg">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[48px] bg-primary text-on-primary font-body-sm text-body-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
