'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Eye, EyeOff, Lock, User, Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError('Ingresa tu usuario');
      return;
    }
    if (!password.trim()) {
      setError('Ingresa tu contraseña');
      return;
    }

    setError(null);
    setLoading(true);

    // Small delay for UX feedback
    setTimeout(() => {
      const result = signIn(username.trim(), password);
      if (result.error) {
        setError(result.error);
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex flex-col items-center gap-3 mb-4">
            <img
              src="https://assets.cdn.filesafe.space/0M6K8lmvNdLqq7S28Bmn/media/69aa284636702f476fff7b74.png"
              alt="Hidasol"
              className="h-20 w-auto object-contain"
            />
          </div>
          <p className="text-[#64748B] text-sm uppercase tracking-widest">
            Sistema de Gestión de Órdenes
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0d1525] border border-[#1a2436] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold font-['Bricolage_Grotesque'] text-white mb-2">
            Iniciar sesión
          </h2>
          <p className="text-[#64748B] text-sm mb-8">
            Ingresa tu usuario y contraseña para continuar
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Escribe tu usuario"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-[#1a2436] rounded-[10px] text-white placeholder-[#374151] focus:outline-none focus:border-[#F97316] transition-all duration-200 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#94A3B8] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Escribe tu contraseña"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-3 bg-[#111827] border border-[#1a2436] rounded-[10px] text-white placeholder-[#374151] focus:outline-none focus:border-[#F97316] transition-all duration-200 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#94A3B8] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-[10px] px-4 py-3 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-[10px] bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#F97316]/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        {/* Credentials reference */}
        <div className="mt-6 bg-[#0d1525]/80 border border-[#1a2436] rounded-xl p-4">
          <p className="text-[#64748B] text-xs uppercase tracking-widest mb-3 text-center">Accesos disponibles</p>
          <div className="space-y-1.5">
            {[
              { role: 'Admin', user: 'admin', pass: 'Hid@s0l-Admin2025' },
              { role: 'Ventas', user: 'ventas', pass: 'Hid@s0l-Ventas2025' },
              { role: 'Diseño', user: 'diseno', pass: 'Hid@s0l-Diseno2025' },
              { role: 'Operario', user: 'operario', pass: 'Hid@s0l-Operario2025' },
              { role: 'Taller', user: 'taller', pass: 'Hid@s0l-Taller2025' },
            ].map(c => (
              <div key={c.role} className="flex items-center justify-between text-xs gap-3">
                <span className="text-[#94A3B8] w-16 shrink-0">{c.role}</span>
                <span className="font-mono text-[#64748B] w-16 shrink-0">{c.user}</span>
                <span className="font-mono text-[#4B5563] text-[10px] truncate">{c.pass}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[#374151] text-xs mt-4">
          © 2025 Hidasol — Sistema Interno
        </p>
      </div>
    </div>
  );
}
