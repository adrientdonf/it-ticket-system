import React, { useState } from 'react';
import { registerUser } from '../services/api';
import './AuthPage.css';

// ── RegisterPage ──────────────────────────────────────────────────────────────
// Renders the registration form. On success, saves the JWT token and user
// to localStorage, then calls onLogin() to take the user straight to the
// dashboard — no need to log in again after registering.
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

    // Client-side check: passwords must match before we even hit the API
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await registerUser({ username, email, password });

      // Save token + user so the user is immediately logged in after registering
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));

      // Tell App.js the user is now authenticated
      onLogin(res.data.user);

    } catch (err) {
      // Show the server's error message (e.g. "Email already registered")
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* ── Left panel: branding (same as login) ── */}
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

      {/* ── Right panel: register form ── */}
      <div className="auth-panel auth-panel--right">
        <div className="auth-form-box">

          <div className="auth-form-header">
            <h2>Create account</h2>
            <p>Join TicketDesk to manage IT tickets</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Username */}
            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="e.g. adrien"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm password */}
            <div className="auth-field">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm"
                type="password"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>

          </form>

          {/* Switch to login */}
          <p className="auth-switch">
            Already have an account?{' '}
            <button className="auth-switch__link" onClick={onGoToLogin}>
              Sign in
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}

export default RegisterPage;