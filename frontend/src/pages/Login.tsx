import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// NOTE: Hackathon-grade prototype auth — no password reset, refresh tokens, etc.
// Backend uses a simple username/password check and returns a JWT access_token.

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: unknown) {
      const axErr = err as { response?: { status: number } };
      if (axErr?.response?.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError('Connection error — is the backend running?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at 30% 60%, rgba(139,92,246,0.15) 0%, #0a0a12 50%, #0a0a12 100%)',
      }}
    >
      {/* Decorative glows */}
      <div
        className="fixed top-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
      />
      <div
        className="fixed bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
              boxShadow: '0 0 40px rgba(139,92,246,0.5)',
            }}
          >
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ATAS</h1>
          <p className="text-sm text-slate-500 mt-1">Autonomous Tax Audit Swarm</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          <h2 className="text-base font-semibold text-white mb-6">Sign in to your workspace</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Username</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="input-field pl-9"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pl-9"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5 animate-fade-in">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading || !username || !password}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            Prototype auth — use credentials configured in the FastAPI backend
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
