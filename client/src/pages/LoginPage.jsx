// LoginPage.jsx — Redesigned with Stitch dark glassmorphism UI
// Uses prop-based navigation to match App.js (no React Router needed)
import React, { useState } from 'react';
import { loginUser } from '../services/api';
import api from '../services/api';

const LoginPage = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [remember, setRemember]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');

  // ── Forgot password modal state ─────────────────────────────────────────────
  const [showForgot, setShowForgot]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [forgotSuccess, setForgotSuccess]   = useState('');
  const [forgotError, setForgotError]       = useState('');

  // ── Login handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Login returns both the token AND the user — no need for a second getMe() call
      const res = await loginUser({ email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      if (onLogin) onLogin(res.data.user);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handler ─────────────────────────────────────────────────
  // Submits a reset request to the backend — admin will be notified
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotSuccess('Reset request submitted! Please contact your IT admin.');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Close forgot modal and reset its state ──────────────────────────────────
  const closeForgotModal = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotSuccess('');
    setForgotError('');
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
                {/* Forgot password — opens modal, does not submit the login form */}
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
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

          {/* Register link */}
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

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#131313',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '36px',
            width: '100%',
            maxWidth: '420px',
            fontFamily: "'Hanken Grotesk', sans-serif",
          }}>

            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ color: '#e2e2e2', fontSize: '18px', fontWeight: 700, margin: 0 }}>Forgot Password?</h3>
              <button
                onClick={closeForgotModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#899297' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p style={{ color: '#899297', fontSize: '13px', marginBottom: '24px' }}>
              Enter your email and your IT admin will be notified to reset your password.
            </p>

            {/* Success state */}
            {forgotSuccess ? (
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                {forgotSuccess}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Error banner */}
                {forgotError && (
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab', fontSize: '13px', fontWeight: 600 }}>
                    {forgotError}
                  </div>
                )}

                {/* Email input */}
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e2e2', fontSize: '14px', outline: 'none',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    boxSizing: 'border-box',
                  }}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%', padding: '11px', borderRadius: '10px',
                    background: '#89CFF0', color: '#003546',
                    fontSize: '14px', fontWeight: 700, border: 'none',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    opacity: forgotLoading ? 0.6 : 1,
                    fontFamily: "'Hanken Grotesk', sans-serif",
                  }}
                >
                  {forgotLoading ? 'Submitting...' : 'Submit Reset Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </main>
  );
};

export default LoginPage;