import React, { useState, useEffect, useRef } from 'react';
import { registerUser } from '../services/api';

// ── Floating particle canvas (same as LoginPage) ────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width  = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', resize);
    const COUNT = 50;
    const particles = Array.from({ length: COUNT }, () => ({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.4 + 0.15,
      drift: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
      hue:   Math.random() < 0.6 ? 200 : Math.random() < 0.5 ? 185 : 220,
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
        if (p.y < -4)    { p.y = H + 4; p.x = Math.random() * W; }
        if (p.x < -4)    p.x = W + 4;
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  );
};

// ── RegisterPage ──────────────────────────────────────────────────────────────
function RegisterPage({ onLogin, onGoToLogin }) {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await registerUser({ username, email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ticketCards = [
    { priority: 'High',   color: '#f87171', label: 'Production server down',        delay: '0.55s' },
    { priority: 'Medium', color: '#fbbf24', label: 'Laptop keyboard not working',   delay: '0.70s' },
    { priority: 'Low',    color: '#4ade80', label: 'Update office WiFi password',   delay: '0.85s' },
  ];

  const floatingIcons = [
    { icon: 'wifi',              top: '10%',  left: '7%',   size: 34, anim: 'floatA 7.5s ease-in-out infinite',  delay: '0s'   },
    { icon: 'terminal',          top: '18%',  right: '8%',  size: 28, anim: 'floatB 9s ease-in-out infinite',    delay: '1.3s' },
    { icon: 'dns',               top: '45%',  left: '5%',   size: 26, anim: 'floatC 8s ease-in-out infinite',    delay: '2.5s' },
    { icon: 'memory',            top: '62%',  right: '7%',  size: 30, anim: 'floatA 11s ease-in-out infinite',   delay: '0.8s' },
    { icon: 'settings_ethernet', top: '82%',  left: '8%',   size: 24, anim: 'floatB 10s ease-in-out infinite',   delay: '3.1s' },
    { icon: 'cloud',             top: '5%',   left: '50%',  size: 22, anim: 'floatC 9.5s ease-in-out infinite',  delay: '1.9s' },
    { icon: 'lock',              top: '35%',  right: '6%',  size: 20, anim: 'floatA 12s ease-in-out infinite',   delay: '4.2s' },
  ];

  return (
    <>
      <style>{`
        /* ── Entrances ── */
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

        /* ── Logo glow ── */
        @keyframes logoGlow {
          0%, 100% { box-shadow: 0 0 14px rgba(137,207,240,0.22), inset 0 0 12px rgba(137,207,240,0.06); }
          50%       { box-shadow: 0 0 32px rgba(137,207,240,0.45), inset 0 0 22px rgba(137,207,240,0.14); }
        }

        /* ── Floating icons ── */
        @keyframes floatA {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.16; }
          33%  { transform: translateY(-16px) rotate(4deg); opacity: 0.28; }
          66%  { transform: translateY(-7px) rotate(-3deg); opacity: 0.20; }
          100% { transform: translateY(0px) rotate(0deg);   opacity: 0.16; }
        }
        @keyframes floatB {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0.12; }
          40%  { transform: translateY(13px) rotate(-5deg); opacity: 0.24; }
          80%  { transform: translateY(-5px) rotate(3deg);  opacity: 0.15; }
          100% { transform: translateY(0px) rotate(0deg);   opacity: 0.12; }
        }
        @keyframes floatC {
          0%   { transform: translateY(0px) scale(1);      opacity: 0.10; }
          50%  { transform: translateY(-20px) scale(1.08); opacity: 0.24; }
          100% { transform: translateY(0px) scale(1);      opacity: 0.10; }
        }

        /* ── Glow orbs ── */
        @keyframes orbDrift1 {
          0%   { transform: translate(0,0)          scale(1);    opacity: 0.20; }
          25%  { transform: translate(28px,-18px)   scale(1.07); opacity: 0.30; }
          50%  { transform: translate(12px,-40px)   scale(0.94); opacity: 0.17; }
          75%  { transform: translate(-18px,-22px)  scale(1.04); opacity: 0.27; }
          100% { transform: translate(0,0)          scale(1);    opacity: 0.20; }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0,0)      scale(1);   opacity: 0.14; }
          30%  { transform: translate(-22px,16px) scale(1.1); opacity: 0.24; }
          60%  { transform: translate(9px,30px)  scale(0.9); opacity: 0.16; }
          100% { transform: translate(0,0)      scale(1);   opacity: 0.14; }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0,0)       scale(1);    opacity: 0.18; }
          40%  { transform: translate(18px,20px) scale(1.12); opacity: 0.28; }
          80%  { transform: translate(-12px,36px) scale(0.92); opacity: 0.14; }
          100% { transform: translate(0,0)       scale(1);    opacity: 0.18; }
        }

        /* ── Scanline ── */
        @keyframes scanline {
          0%   { top: -4%; opacity: 0; }
          5%   { opacity: 0.50; }
          95%  { opacity: 0.30; }
          100% { top: 104%; opacity: 0; }
        }

        /* ── Ticket card float (subtle vertical bob) ── */
        @keyframes ticketFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        /* Ticket card glow shimmer */
        @keyframes ticketGlow {
          0%, 100% { box-shadow: 0 0 0 transparent; }
          50%       { box-shadow: 0 4px 24px rgba(137,207,240,0.10); }
        }

        /* ── Badge shimmer ── */
        @keyframes badgeShimmer {
          0%, 100% { box-shadow: 0 0 6px rgba(137,207,240,0.08); }
          50%       { box-shadow: 0 0 16px rgba(137,207,240,0.26); }
        }

        /* ── Submit button shimmer ── */
        @keyframes btnShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .rg-submit-btn {
          background-size: 200% auto;
          background-image: linear-gradient(110deg, #89CFF0 0%, #b8e4f9 40%, #89CFF0 60%, #6bbcd6 100%);
          animation: btnShimmer 3.5s linear infinite;
        }
        .rg-submit-btn:hover {
          animation: btnShimmer 1.8s linear infinite;
          box-shadow: 0 0 32px rgba(137,207,240,0.55) !important;
        }
        .rg-submit-btn:disabled {
          animation: none;
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ── Input focus glow ── */
        .rg-input:focus {
          border-color: rgba(137,207,240,0.45) !important;
          box-shadow: 0 0 0 3px rgba(137,207,240,0.12), 0 0 18px rgba(137,207,240,0.18) !important;
        }

        /* ── Staggered form fields ── */
        .rg-field { opacity: 0; }
        .rg-field.visible {
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }
      `}</style>

      <div className="min-h-screen w-full flex bg-black font-sans">

        {/* ══════════════════════════════════════════════════════
            LEFT PANEL: Branding + ambient animations
        ══════════════════════════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 p-12 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1f2d 100%)',
            position: 'relative',
            animation: mounted ? 'slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* Particle field */}
          <ParticleField />

          {/* Drifting glow orbs */}
          <div style={{ position:'absolute', top:'15%', left:'10%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(137,207,240,0.18) 0%, transparent 70%)', filter:'blur(26px)', animation:'orbDrift1 11s ease-in-out infinite', zIndex:1 }} />
          <div style={{ position:'absolute', bottom:'18%', right:'8%', width:170, height:170, borderRadius:'50%', background:'radial-gradient(circle, rgba(100,180,240,0.20) 0%, transparent 70%)', filter:'blur(22px)', animation:'orbDrift2 14s ease-in-out infinite', zIndex:1 }} />
          <div style={{ position:'absolute', top:'52%', left:'52%', width:130, height:130, borderRadius:'50%', background:'radial-gradient(circle, rgba(170,220,255,0.15) 0%, transparent 70%)', filter:'blur(18px)', animation:'orbDrift3 9s ease-in-out infinite', zIndex:1 }} />

          {/* Scanline sweep */}
          <div style={{ position:'absolute', left:0, right:0, height:'3px', background:'linear-gradient(90deg, transparent, rgba(137,207,240,0.50), transparent)', animation:'scanline 8s linear infinite', zIndex:2, pointerEvents:'none' }} />

          {/* Floating IT icons */}
          {floatingIcons.map(({ icon, top, left, right, size, anim, delay }) => (
            <span
              key={icon + top}
              className="material-symbols-outlined"
              style={{ position:'absolute', top, left, right, fontSize:size, color:'#89CFF0', animation:anim, animationDelay:delay, zIndex:2, pointerEvents:'none', fontVariationSettings:"'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 48" }}
            >
              {icon}
            </span>
          ))}

          {/* ── Logo + title ── */}
          <div
            className="flex items-center gap-3"
            style={{ position:'relative', zIndex:3, animation:'fadeUp 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) both' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(137,207,240,0.15)', border:'1px solid rgba(137,207,240,0.3)', animation:'logoGlow 3s ease-in-out infinite' }}
            >
              <span className="material-symbols-outlined text-primary text-xl">confirmation_number</span>
            </div>
            <span className="text-on-surface font-semibold text-lg tracking-wide">TicketDesk</span>
          </div>

          {/* ── Hero text + badges ── */}
          <div
            className="flex flex-col gap-6"
            style={{ position:'relative', zIndex:3 }}
          >
            <h1
              className="text-display-lg text-on-surface glow-accent leading-tight"
              style={{ maxWidth:'420px', animation:'fadeUp 0.7s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              Join your team's support hub.
            </h1>
            <p
              className="text-body-lg text-on-surface-variant"
              style={{ maxWidth:'360px', animation:'fadeUp 0.7s 0.32s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              Create an account and start submitting, tracking, and resolving IT tickets — all in one place.
            </p>

            {/* Feature badges */}
            <div
              className="flex gap-3 flex-wrap"
              style={{ animation:'fadeUp 0.7s 0.44s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              {[
                { icon: 'bolt',   label: 'Fast'       },
                { icon: 'shield', label: 'Secure'     },
                { icon: 'group',  label: 'Team-ready' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background:'rgba(137,207,240,0.08)', border:'1px solid rgba(137,207,240,0.2)', animation:'badgeShimmer 3s ease-in-out infinite' }}
                >
                  <span className="material-symbols-outlined text-primary text-sm">{icon}</span>
                  <span className="text-label-caps text-primary">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Floating ticket cards ── */}
          <div className="flex flex-col gap-3" style={{ position:'relative', zIndex:3 }}>
            {ticketCards.map(({ priority, color, label, delay }) => (
              <div
                key={label}
                className="glass-panel flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  maxWidth:'300px',
                  animation: `fadeUp 0.6s ${delay} cubic-bezier(0.22,1,0.36,1) both, ticketFloat ${4 + ticketCards.indexOf(ticketCards.find(t=>t.label===label))}s ${delay} ease-in-out infinite, ticketGlow 4s ease-in-out infinite`,
                }}
              >
                <span
                  className="text-label-caps px-2 py-0.5 rounded-full font-bold"
                  style={{ background:`${color}22`, color }}
                >
                  {priority}
                </span>
                <span className="text-body-sm text-on-surface-variant">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT PANEL: Register form
        ══════════════════════════════════════════════════════ */}
        <div
          className="flex flex-1 items-center justify-center p-6 bg-black"
          style={{
            animation: mounted ? 'slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            opacity: mounted ? undefined : 0,
          }}
        >
          <div className="w-full" style={{ maxWidth:'440px' }}>

            {/* Header */}
            <div
              className="mb-8"
              style={{ animation:'fadeUp 0.6s 0.25s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <h2 className="text-headline-lg text-on-surface mb-2">Create account</h2>
              <p className="text-body-lg text-on-surface-variant">Join TicketDesk to manage IT tickets</p>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-body-sm"
                style={{ background:'rgba(255,75,75,0.1)', border:'1px solid rgba(255,75,75,0.3)', color:'#f87171', animation:'fadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both' }}
              >
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Username */}
              <div className="flex flex-col gap-2 rg-field visible" style={{ animationDelay:'0.33s' }}>
                <label className="text-label-caps text-on-surface-variant">Username</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize:'20px' }}>person</span>
                  <input
                    type="text"
                    placeholder="e.g. adrien"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required autoFocus
                    className="rg-input input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-2 rg-field visible" style={{ animationDelay:'0.42s' }}>
                <label className="text-label-caps text-on-surface-variant">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize:'20px' }}>mail</span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rg-input input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2 rg-field visible" style={{ animationDelay:'0.51s' }}>
                <label className="text-label-caps text-on-surface-variant">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize:'20px' }}>lock</span>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rg-input input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-2 rg-field visible" style={{ animationDelay:'0.60s' }}>
                <label className="text-label-caps text-on-surface-variant">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" style={{ fontSize:'20px' }}>lock_reset</span>
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    className="rg-input input-glow w-full pl-11 pr-4 py-3 rounded-xl text-body-lg text-on-surface placeholder-on-surface-variant outline-none transition-all"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="rg-field visible" style={{ animationDelay:'0.68s' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="rg-submit-btn w-full py-3 rounded-xl text-title-md font-semibold transition-all mt-1"
                  style={{ color:'#003546', cursor: loading ? 'not-allowed' : 'pointer' }}
                >
                  {loading ? 'Creating account...' : 'Create Account →'}
                </button>
              </div>

            </form>

            {/* Switch to login */}
            <p
              className="text-body-sm text-on-surface-variant text-center mt-6 rg-field visible"
              style={{ animationDelay:'0.75s' }}
            >
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
    </>
  );
}

export default RegisterPage;