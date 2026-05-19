// LoginPage.jsx — Redesigned with Stitch dark glassmorphism UI
// Uses prop-based navigation to match App.js (no React Router needed)
import React, { useState } from 'react';
import { loginUser } from '../services/api';

const LoginPage = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    // Login returns both the token AND the user — no need for a second getMe() call
    const res = await loginUser({ email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));

    // Tell App.js we're logged in
    if (onLogin) onLogin(res.data.user);
  } catch (err) {
    setError('Invalid email or password. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="flex flex-col md:flex-row min-h-screen w-full">

      {/* ── LEFT PANEL: Branding ── */}
      <section className="relative w-full md:w-1/2 flex items-center justify-center bg-surface-container overflow-hidden border-r border-white/5 p-xl">

        {/* Decorative background glows */}
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary-container/5 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary-container/10 rounded-full blur-[150px]"></div>

        <div className="relative z-10 flex flex-col items-center text-center space-y-lg max-w-md">

          {/* Logo */}
          <div className="p-lg rounded-xl glass-panel brand-glow mb-md">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: '80px', fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}
            >
              confirmation_number
            </span>
          </div>

          <h1 className="text-display-lg text-primary tracking-tighter glow-accent">
            TicketDesk
          </h1>

          <p className="text-title-md text-on-surface-variant max-w-xs leading-relaxed">
            Your IT support, simplified.
          </p>

          {/* Badges */}
          <div className="mt-xl pt-xl border-t border-white/10 w-full flex justify-center gap-md">
            <div className="flex items-center gap-sm px-md py-xs rounded-full glass-panel">
              <span className="material-symbols-outlined text-primary text-[20px]">speed</span>
              <span className="text-label-caps text-on-surface-variant">Fast</span>
            </div>
            <div className="flex items-center gap-sm px-md py-xs rounded-full glass-panel">
              <span className="material-symbols-outlined text-primary text-[20px]">security</span>
              <span className="text-label-caps text-on-surface-variant">Secure</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── RIGHT PANEL: Login Form ── */}
      <section className="w-full md:w-1/2 flex items-center justify-center bg-black p-margin md:p-xl">
        <div className="w-full max-w-md space-y-xl">

          {/* Heading */}
          <div className="space-y-sm">
            <h2 className="text-headline-lg text-on-surface">Welcome back</h2>
            <p className="text-body-lg text-on-surface-variant">
              Enter your credentials to access the command center.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-panel p-md rounded-lg border border-error/40 text-error text-body-sm flex items-center gap-sm">
              <span className="material-symbols-outlined text-[18px]">error_outline</span>
              {error}
            </div>
          )}

          <form className="space-y-lg" onSubmit={handleSubmit}>

            {/* Email field */}
            <div className="space-y-xs">
              <label className="text-label-caps text-primary uppercase ml-xs" htmlFor="email">
                Corporate Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  alternate_email
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-md pl-[48px] pr-md text-on-surface placeholder:text-on-surface-variant focus:outline-none input-glow transition-all duration-300"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center px-xs">
                <label className="text-label-caps text-primary uppercase" htmlFor="password">
                  Secure Password
                </label>
                {/* Forgot password — button styled as link, no href="#" */}
                <button
                  type="button"
                  className="text-body-sm text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                  lock_open
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-md pl-[48px] pr-md text-on-surface placeholder:text-on-surface-variant focus:outline-none input-glow transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-sm px-xs">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-black"
              />
              <label htmlFor="remember" className="text-body-sm text-on-surface-variant cursor-pointer select-none">
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-container text-on-primary-container text-title-md py-md rounded-lg shadow-[0_0_20px_rgba(137,207,240,0.3)] hover:shadow-[0_0_30px_rgba(137,207,240,0.5)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login to Dashboard'}
            </button>

          </form>

          {/* Register link — uses onGoToRegister prop from App.js */}
          <div className="text-center pt-md">
            <p className="text-body-lg text-on-surface-variant">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onGoToRegister}
                className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30 transition-all ml-xs bg-transparent border-none cursor-pointer"
              >
                Register
              </button>
            </p>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-sm pt-xl opacity-40">
            <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></div>
            <span className="text-label-caps text-on-surface-variant">All systems operational</span>
          </div>

        </div>
      </section>

    </main>
  );
};

export default LoginPage;