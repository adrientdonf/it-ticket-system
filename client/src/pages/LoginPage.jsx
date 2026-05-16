import React, { useState } from 'react';
import { loginUser } from '../services/api';
import './AuthPage.css';

// ── LoginPage ─────────────────────────────────────────────────────────────────
// Renders the login form. On success, saves the JWT token and user info
// to localStorage, then calls onLogin() to tell App.js the user is authenticated.
// ─────────────────────────────────────────────────────────────────────────────

function LoginPage({ onLogin, onGoToRegister }) {
  // Form field state
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // ── Handle form submit ──────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser({ email, password });

      // Save token + user to localStorage so they persist on page refresh
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));

      // Notify App.js that login succeeded
      onLogin(res.data.user);

    } catch (err) {
      // Show the error message from the API, or a fallback
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left panel: branding ── */}
      <div className="auth-panel auth-panel--left">
        <div className="auth-brand">
          <span className="auth-brand__icon">🎫</span>
          <h1 className="auth-brand__name">TicketDesk</h1>
          <p className="auth-brand__tagline">IT Support, simplified.</p>
        </div>

        {/* Decorative floating cards */}
        <div className="auth-deco">
          <div className="deco-card deco-card--1">
            <span className="deco-badge deco-badge--high">High</span>
            <p>Production server down</p>
          </div>
          <div className="deco-card deco-card--2">
            <span className="deco-badge deco-badge--low">Low</span>
            <p>Update office WiFi password</p>
          </div>
          <div className="deco-card deco-card--3">
            <span className="deco-badge deco-badge--medium">Medium</span>
            <p>Laptop keyboard not working</p>
          </div>
        </div>
      </div>

      {/* ── Right panel: login form ── */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-box">

          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your TicketDesk account</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>

          </form>

          {/* Switch to register */}
          <p className="auth-switch">
            Don't have an account?{' '}
            <button className="auth-switch__link" onClick={onGoToRegister}>
              Create one
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}

export default LoginPage;