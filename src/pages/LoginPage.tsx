import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  User,
  ArrowRight,
  ShieldCheck,
  Wifi,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { usePosStore } from '../store/usePosStore';
import { posSound } from '../utils/sound';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = usePosStore();

  const [username, setUsername] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !pin.trim()) {
      setError('Please enter both username and password.');
      posSound.playErrorBeep();
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const success = login(username.trim(), pin.trim());
      if (success) {
        posSound.playClick();
        navigate('/', { replace: true });
      } else {
        setError('Invalid username or password.');
        posSound.playErrorBeep();
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/90 border border-slate-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 space-y-7 text-white">
          {/* Header Brand */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/30 text-white mb-1">
              <Store className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <span>Kalaasagar SuperMarket</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Enterprise Point of Sale & Retail Management System
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/60 border border-blue-800/40 rounded-full text-[11px] text-blue-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>POS Terminal Ready</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400 font-mono">v2.4 Enterprise</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Username / Terminal ID
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* PIN / Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Password / Security PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to POS Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badges */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted Session</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-blue-400" />
              <span>Offline POS Ready</span>
            </div>
          </div>
        </div>

        {/* Store Location Footer */}
        <p className="text-center text-xs text-slate-500 mt-4">
          © {new Date().getFullYear()} Kalaasagar SuperMarket • All Rights Reserved
        </p>
      </div>
    </div>
  );
};
