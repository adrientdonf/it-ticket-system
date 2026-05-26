// LoginPage.jsx — Redesigned with Stitch dark glassmorphism UI
// Uses prop-based navigation to match App.js (no React Router needed)
import React, { useState, useEffect, useRef } from 'react';
import { loginUser } from '../services/api';
import api from '../services/api';

// ── Floating particle canvas ────────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;

    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);

    // Particles — tiny glowing dots that drift upward
    const COUNT = 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.4 + 0.15,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
      hue:   Math.random() < 0.6 ? 200 : Math.random() < 0.5 ? 185 : 220, // baby blue family
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 75%, ${p.alpha})`;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 80%, 0.7)`;
        ctx.fill();

        p.y -= p.speed;
        p.x += p.drift;
        if (p.y < -4)  { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4)  p.x = W + 4;
        if (p.x > W + 4) p.x = -4;
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  );
};

const LoginPage = ({ onLogin, onGoToRegister }) => {
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [remember, setRemember]             = useState(false);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [mounted, setMounted]               = useState(false);

  // ── Forgot password modal state ─────────────────────────────────────────────
  const [showForgot, setShowForgot]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState('');
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [forgotSuccess, setForgotSuccess]   = useState('');
  const [forgotError, setForgotError]       = useState('');

  // Trigger entrance animations after mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // ── Login handler ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email, password });
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('token', res.data.token);
      storage.setItem('user', JSON.stringify(res.data.user));
      if (onLogin) onLogin(res.data.user);
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password handler ─────────────────────────────────────────────────
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

  const closeForgotModal = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotSuccess('');
    setForgotError('');
  };

  return (
    <>
      {/* ── All keyframe animations ── */}
      <style>{`
        /* Entrance slides */
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Logo icon breathing glow */
        @keyframes iconGlow {
          0%, 100% { filter: drop-shadow(0 0 12px #89CFF0aa) drop-shadow(0 0 30px #89CFF044); }
          50%       { filter: drop-shadow(0 0 22px #89CFF0ee) drop-shadow(0 0 55px #89CFF066); }
        }
        /* Logo panel pulse border */
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 18px rgba(137,207,240,0.18), inset 0 0 18px rgba(137,207,240,0.04); }
          50%       { box-shadow: 0 0 40px rgba(137,207,240,0.38), inset 0 0 30px rgba(137,207,240,0.10); }
        }

        /* Floating IT icons */
        @keyframes floatA {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.18; }
          33%  { transform: translateY(-18px) rotate(4deg); opacity: 0.30; }
          66%  { transform: translateY(-8px) rotate(-3deg); opacity: 0.22; }
          100% { transform: translateY(0px) rotate(0deg);   opacity: 0.18; }
        }
        @keyframes floatB {
          0%   { transform: translateY(0px) rotate(0deg);    opacity: 0.13; }
          40%  { transform: translateY(14px) rotate(-5deg);  opacity: 0.25; }
          80%  { transform: translateY(-6px) rotate(3deg);   opacity: 0.16; }
          100% { transform: translateY(0px) rotate(0deg);    opacity: 0.13; }
        }
        @keyframes floatC {
          0%   { transform: translateY(0px) scale(1);    opacity: 0.12; }
          50%  { transform: translateY(-22px) scale(1.08); opacity: 0.26; }
          100% { transform: translateY(0px) scale(1);    opacity: 0.12; }
        }

        /* Drifting glow orbs */
        @keyframes orbDrift1 {
          0%   { transform: translate(0, 0)    scale(1);    opacity: 0.22; }
          25%  { transform: translate(30px, -20px) scale(1.08); opacity: 0.32; }
          50%  { transform: translate(15px, -45px) scale(0.94); opacity: 0.18; }
          75%  { transform: translate(-20px, -25px) scale(1.05); opacity: 0.28; }
          100% { transform: translate(0, 0)    scale(1);    opacity: 0.22; }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0, 0)       scale(1);   opacity: 0.15; }
          30%  { transform: translate(-25px, 18px)  scale(1.1); opacity: 0.25; }
          60%  { transform: translate(10px, 35px)   scale(0.9); opacity: 0.18; }
          100% { transform: translate(0, 0)       scale(1);   opacity: 0.15; }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0, 0)       scale(1);    opacity: 0.20; }
          35%  { transform: translate(20px, 22px)  scale(1.12); opacity: 0.30; }
          70%  { transform: translate(-15px, 40px) scale(0.92); opacity: 0.16; }
          100% { transform: translate(0, 0)       scale(1);    opacity: 0.20; }
        }

        /* Scanline sweep across left panel */
        @keyframes scanline {
          0%   { top: -4%; opacity: 0; }
          5%   { opacity: 0.55; }
          95%  { opacity: 0.35; }
          100% { top: 104%; opacity: 0; }
        }

        /* Badge shimmer */
        @keyframes badgeShimmer {
          0%, 100% { box-shadow: 0 0 8px rgba(137,207,240,0.10); }
          50%       { box-shadow: 0 0 18px rgba(137,207,240,0.30); }
        }

        /* Status dot extra ring */
        @keyframes statusRing {
          0%   { box-shadow: 0 0 0 0 rgba(137,207,240,0.5); }
          70%  { box-shadow: 0 0 0 6px rgba(137,207,240,0); }
          100% { box-shadow: 0 0 0 0 rgba(137,207,240,0); }
        }

        /* Input glow on focus */
        .td-input:focus {
          border-color: rgba(137,207,240,0.45) !important;
          box-shadow: 0 0 0 3px rgba(137,207,240,0.12), 0 0 18px rgba(137,207,240,0.18) !important;
        }

        /* Submit button shimmer */
        @keyframes btnShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .td-submit-btn {
          background-size: 200% auto;
          background-image: linear-gradient(110deg, #89CFF0 0%, #b8e4f9 40%, #89CFF0 60%, #6bbcd6 100%);
          animation: btnShimmer 3.5s linear infinite;
        }
        .td-submit-btn:hover {
          animation: btnShimmer 1.8s linear infinite;
          box-shadow: 0 0 32px rgba(137,207,240,0.55) !important;
        }

        /* Staggered form field entrance */
        .td-field { opacity: 0; }
        .td-field.visible {
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <main className="flex flex-col md:flex-row min-h-screen w-full">

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL: Branding + all ambient animations
        ══════════════════════════════════════════════════════ */}
        <section
          className="relative w-full md:w-1/2 flex items-center justify-center bg-surface-container overflow-hidden border-r border-white/5 p-xl"
          style={{
            animation: mounted ? 'slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* ── Particle field ── */}
          <ParticleField />

          {/* ── Static background glows (original) ── */}
          <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary-container/5 rounded-full blur-[120px]" />
          <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-primary-container/10 rounded-full blur-[150px]" />

          {/* ── Drifting glow orbs ── */}
          <div style={{
            position: 'absolute', top: '18%', left: '12%',
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(137,207,240,0.18) 0%, transparent 70%)',
            filter: 'blur(28px)',
            animation: 'orbDrift1 11s ease-in-out infinite',
            zIndex: 1,
          }} />
          <div style={{
            position: 'absolute', bottom: '14%', right: '10%',
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(100,180,240,0.22) 0%, transparent 70%)',
            filter: 'blur(22px)',
            animation: 'orbDrift2 14s ease-in-out infinite',
            zIndex: 1,
          }} />
          <div style={{
            position: 'absolute', top: '55%', left: '55%',
            width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(170,220,255,0.16) 0%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'orbDrift3 9s ease-in-out infinite',
            zIndex: 1,
          }} />

          {/* ── Scanline sweep ── */}
          <div style={{
            position: 'absolute', left: 0, right: 0, height: '3px',
            background: 'linear-gradient(90deg, transparent, rgba(137,207,240,0.55), transparent)',
            animation: 'scanline 7s linear infinite',
            zIndex: 2,
            pointerEvents: 'none',
          }} />

          {/* ── Floating IT icons ── */}
          {[
            { icon: 'wifi',            top: '8%',  left: '8%',  size: 38, anim: 'floatA 7.5s ease-in-out infinite',        delay: '0s'    },
            { icon: 'terminal',        top: '15%', right: '9%', size: 32, anim: 'floatB 9s ease-in-out infinite',           delay: '1.2s'  },
            { icon: 'router',          top: '72%', left: '6%',  size: 34, anim: 'floatC 8.5s ease-in-out infinite',         delay: '2.1s'  },
            { icon: 'memory',          top: '80%', right: '8%', size: 30, anim: 'floatA 11s ease-in-out infinite',          delay: '0.7s'  },
            { icon: 'cloud',           top: '42%', left: '5%',  size: 28, anim: 'floatB 10s ease-in-out infinite',          delay: '3.3s'  },
            { icon: 'settings_ethernet', top: '32%', right: '6%', size: 26, anim: 'floatC 8s ease-in-out infinite',         delay: '1.8s'  },
            { icon: 'dns',             top: '90%', left: '42%', size: 24, anim: 'floatA 12s ease-in-out infinite',          delay: '4s'    },
            { icon: 'lock',            top: '4%',  left: '48%', size: 22, anim: 'floatB 7s ease-in-out infinite',           delay: '2.6s'  },
          ].map(({ icon, top, left, right, size, anim, delay }) => (
            <span
              key={icon + top}
              className="material-symbols-outlined"
              style={{
                position: 'absolute', top, left, right,
                fontSize: size, color: '#89CFF0',
                animation: anim, animationDelay: delay,
                zIndex: 2, pointerEvents: 'none',
                fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48",
              }}
            >
              {icon}
            </span>
          ))}

          {/* ── Content ── */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-lg max-w-md">

            {/* Logo — breathing glow + border pulse */}
            <div
              className="p-lg rounded-xl glass-panel mb-md"
              style={{ animation: 'iconGlow 3s ease-in-out infinite, borderPulse 3s ease-in-out infinite' }}
            >
              <span
                className="material-symbols-outlined text-primary"
                style={{
                  fontSize: '80px',
                  fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48",
                  display: 'block',
                }}
              >
                confirmation_number
              </span>
            </div>

            <h1
              className="text-display-lg text-primary tracking-tighter glow-accent"
              style={{ animation: 'fadeUp 0.7s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              TicketDesk
            </h1>

            <p
              className="text-title-md text-on-surface-variant max-w-xs leading-relaxed"
              style={{ animation: 'fadeUp 0.7s 0.35s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              Your IT support, simplified.
            </p>

            {/* Badges — shimmer glow */}
            <div
              className="mt-xl pt-xl border-t border-white/10 w-full flex justify-center gap-md"
              style={{ animation: 'fadeUp 0.7s 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              {[
                { icon: 'speed',    label: 'Fast'   },
                { icon: 'security', label: 'Secure' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-sm px-md py-xs rounded-full glass-panel"
                  style={{ animation: 'badgeShimmer 3s ease-in-out infinite' }}
                >
                  <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
                  <span className="text-label-caps text-on-surface-variant">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL: Login Form
        ══════════════════════════════════════════════════════ */}
        <section
          className="w-full md:w-1/2 flex items-center justify-center bg-black p-margin md:p-xl"
          style={{
            animation: mounted ? 'slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          <div className="w-full max-w-md space-y-xl">

            {/* Heading */}
            <div
              className="space-y-sm"
              style={{ animation: 'fadeUp 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <h2 className="text-headline-lg text-on-surface">Welcome back</h2>
              <p className="text-body-lg text-on-surface-variant">
                Enter your credentials to access the command center.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="glass-panel p-md rounded-lg border border-error/40 text-error text-body-sm flex items-center gap-sm"
                style={{ animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}
              >
                <span className="material-symbols-outlined text-[18px]">error_outline</span>
                {error}
              </div>
            )}

            <form className="space-y-lg" onSubmit={handleSubmit}>

              {/* Email field */}
              <div
                className="space-y-xs td-field visible"
                style={{ animationDelay: '0.35s' }}
              >
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
                    className="td-input w-full bg-white/5 border border-white/10 rounded-lg py-md pl-[48px] pr-md text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password field */}
              <div
                className="space-y-xs td-field visible"
                style={{ animationDelay: '0.45s' }}
              >
                <div className="flex justify-between items-center px-xs">
                  <label className="text-label-caps text-primary uppercase" htmlFor="password">
                    Secure Password
                  </label>
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
                    className="td-input w-full bg-white/5 border border-white/10 rounded-lg py-md pl-[48px] pr-md text-on-surface placeholder:text-on-surface-variant focus:outline-none transition-all duration-300"
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
              <div
                className="flex items-center space-x-sm px-xs td-field visible"
                style={{ animationDelay: '0.52s' }}
              >
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

              {/* Submit button — shimmer */}
              <div
                className="td-field visible"
                style={{ animationDelay: '0.60s' }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="td-submit-btn w-full text-on-primary-container text-title-md py-md rounded-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#003546' }}
                >
                  {loading ? 'Logging in...' : 'Login to Dashboard'}
                </button>
              </div>

            </form>

            {/* Register link */}
            <div
              className="text-center pt-md td-field visible"
              style={{ animationDelay: '0.68s' }}
            >
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

            {/* Status indicator — pulse ring */}
            <div
              className="flex items-center justify-center gap-sm pt-xl opacity-40 td-field visible"
              style={{ animationDelay: '0.75s' }}
            >
              <div
                className="w-2 h-2 rounded-full bg-primary-container animate-pulse"
                style={{ animation: 'statusRing 2s ease-out infinite, pulse 2s ease-in-out infinite' }}
              />
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
            animation: 'fadeIn 0.25s ease forwards',
          }}>
            <div style={{
              background: '#131313',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              padding: '36px',
              width: '100%',
              maxWidth: '420px',
              fontFamily: "'Hanken Grotesk', sans-serif",
              animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1) forwards',
              boxShadow: '0 0 60px rgba(137,207,240,0.12)',
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
                <div style={{
                  padding: '14px', borderRadius: '10px',
                  background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                  color: '#4ade80', fontSize: '13px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '8px',
                  animation: 'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  {forgotSuccess}
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {forgotError && (
                    <div style={{
                      padding: '10px 14px', borderRadius: '10px',
                      background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)',
                      color: '#ffb4ab', fontSize: '13px', fontWeight: 600,
                      animation: 'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
                    }}>
                      {forgotError}
                    </div>
                  )}

                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    className="td-input"
                    style={{
                      width: '100%', padding: '11px 14px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e2e2e2', fontSize: '14px', outline: 'none',
                      fontFamily: "'Hanken Grotesk', sans-serif",
                      boxSizing: 'border-box', transition: 'all 0.3s',
                    }}
                  />

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="td-submit-btn"
                    style={{
                      width: '100%', padding: '11px', borderRadius: '10px',
                      color: '#003546',
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
    </>
  );
};

export default LoginPage;