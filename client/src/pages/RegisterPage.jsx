import React, { useState } from 'react';
import { registerUser } from '../services/api';

// ── RegisterPage ──────────────────────────────────────────────────────────────
// Redesigned with the Stitch glassmorphism dark SaaS design system.
// Mirrors the LoginPage layout: left branding panel + right form panel.
// On success, saves JWT + user to localStorage and calls onLogin().
// ─────────────────────────────────────────────────────────────────────────────

function RegisterPage({ onLogin, onGoToLogin }) {
  // Form field state
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Handle form submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side check: passwords must match before hitting the API
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({ username, email, password });

      // Save token + user so the user is immediately logged in
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));

      // Tell App.js the user is now authenticated
      onLogin(res.data.user);

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Full-screen container: pure black background ──
    <div className="min-h-screen w-full flex bg-black font-sans">

      {/* ── LEFT PANEL: Branding ───────────────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1f2d 100%)' }}
      >
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(137,207,240,0.15)', border: '1px solid rgba(137,207,240,0.3)' }}
          >
            <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
          </div>
          <span className="text-on-surface font-semibold text-lg tracking-wide">TicketDesk</span>
        </div>

        {/* Center hero text */}
        <div className="flex flex-col gap-6">
          <h1
            className="text-display-lg text-on-surface glow-accent leading-tight"
            style={{ maxWidth: '420px' }}
          >
            Join your team's support hub.
          </h1>
          <p className="text-body-lg text-on-surface-variant" style={{ maxWidth: '360px' }}>
            Create an account and start submitting, tracking, and resolving IT tickets — all in one place.
          </p>

          {/* Feature badges */}
          <div className="flex gap-3 flex-wrap">
            {[
              { icon: 'bolt',   label: 'Fast' },
              { icon: 'shield', label: 'Secure' },
              { icon: 'group',  label: 'Team-ready' },
            ].map(({ icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(137,207,240,0.08)', border: '1px solid rgba(137,207,240,0.2)' }}
              >
                <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                <span className="text-label-caps text-primary">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative floating ticket cards */}
        <div className="flex flex-col gap-3">
          {[
            { priority: 'High',   color: '#f87171', label: 'Production server down' },
            { priority: 'Medium', color: '#fbbf24', label: 'Laptop keyboard not working' },
            { priority: 'Low',    color: '#4ade80', label: 'Update office WiFi password' },
          ].map(({ priority, color, label }) => (
            <div
              key={label}
              className="glass-panel flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ maxWidth: '300px' }}
            >
              <span
                className="text-label-caps px-2 py-0.5 rounded-full font-bold"
                style={{ background: `${color}22`, color }}
              >
                {priority}
              </span>
              <span className="text-body-sm text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL: Register form ─────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center p-6 bg-black">
        <div className="w-full" style={{ maxWidth: '440px' }}>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-headline-lg text-on-surface mb-2">Create account</h2>
            <p className="text-body-lg text-on-surface-variant">
              Join TicketDesk to manage IT tickets
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-body-sm"
              style={{ background: 'rgba(255,75,75,0.1)', border: '1px solid rgba(255,75,75,0.3)', color: '#f87171' }}
            >
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Username field */}
            <div className="flex flex-col gap-2">
              <label className="text-label-caps text-on-surface-variant">Username</label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  style={{ fontSize: '20px' }}
                >
                  person
                </span>
                <input
                  type="text"
                  placeholder="e.g. adrien"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label className="text-label-caps text-on-surface-variant">Email</label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  style={{ fontSize: '20px' }}
                >
                  mail
                </span>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label className="text-label-caps text-on-surface-variant">Password</label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  style={{ fontSize: '20px' }}
                >
                  lock
                </span>
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Confirm password field */}
            <div className="flex flex-col gap-2">
              <label className="text-label-caps text-on-surface-variant">Confirm Password</label>
              <div className="relative">
                <span
                  className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  style={{ fontSize: '20px' }}
                >
                  lock_reset
                </span>
                <input
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-title-md font-semibold transition-all mt-1"
              style={{
                background: loading ? 'rgba(137,207,240,0.5)' : '#89CFF0',
                color: '#003546',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

          </form>

          {/* Switch to login */}
          <p className="text-body-sm text-on-surface-variant text-center mt-6">
            Already have an account?{' '}
            <button
              onClick={onGoToLogin}
              className="text-primary font-semibold hover:underline transition-all"
            >
              Sign in
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}

export default RegisterPage;