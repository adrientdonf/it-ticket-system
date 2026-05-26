import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { uploadAvatar, changeUsername } from '../services/api';

function ProfilePage({ currentUser, tickets, onBack, onSelectTicket, onUserUpdate }) {

  // ── Password form state ─────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirm,         setConfirm]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState('');
  const [error,           setError]           = useState('');

  // ── Username form state ─────────────────────────────────────────────────────
  const [newUsername,       setNewUsername]       = useState('');
  const [usernamePassword,  setUsernamePassword]  = useState('');
  const [usernameLoading,   setUsernameLoading]   = useState(false);
  const [usernameSuccess,   setUsernameSuccess]   = useState('');
  const [usernameError,     setUsernameError]     = useState('');

  // ── Avatar state ────────────────────────────────────────────────────────────
  const [avatarUrl,     setAvatarUrl]     = useState(currentUser.avatar_url || null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // ── Displayed username (updates instantly after successful change) ───────────
  const [displayUsername, setDisplayUsername] = useState(currentUser.username);

  // ── Canvas ref for particle field ──────────────────────────────────────────
  const canvasRef = useRef(null);

  // ── Filter tickets belonging to this user ───────────────────────────────────
  const myTickets = tickets.filter(
    (t) => t.created_by?.toLowerCase() === currentUser.username?.toLowerCase()
  );

  // ── Password change handler ─────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirm) { setError('New passwords do not match.'); return; }
    if (newPassword.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password updated successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirm('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // ── Username change handler ─────────────────────────────────────────────────
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameError(''); setUsernameSuccess('');

    const trimmed = newUsername.trim();
    if (!trimmed || !usernamePassword) {
      setUsernameError('Both fields are required.'); return;
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameError('Username must be 3–30 characters.'); return;
    }
    if (/\s/.test(trimmed)) {
      setUsernameError('Username cannot contain spaces.'); return;
    }

    setUsernameLoading(true);
    try {
      const res = await changeUsername(trimmed, usernamePassword);
      const { token, user } = res.data;

      const storageKey = 'user';
      const inLocal    = localStorage.getItem(storageKey);
      const storage    = inLocal ? localStorage : sessionStorage;
      storage.setItem('token', token);
      storage.setItem(storageKey, JSON.stringify(user));

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setDisplayUsername(user.username);
      setUsernameSuccess('Username updated successfully!');
      setNewUsername(''); setUsernamePassword('');

      if (onUserUpdate) onUserUpdate(user);

    } catch (err) {
      setUsernameError(err.response?.data?.message || 'Failed to update username.');
    } finally {
      setUsernameLoading(false);
    }
  };

  // ── Avatar upload handler ───────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        setAvatarLoading(true);
        const res = await uploadAvatar(reader.result);
        const newUrl = res.data.avatarUrl;
        setAvatarUrl(newUrl);
        const stored = JSON.parse(localStorage.getItem('user'));
        localStorage.setItem('user', JSON.stringify({ ...stored, avatar_url: newUrl }));
      } catch (err) {
        setError('Failed to upload photo.');
      } finally {
        setAvatarLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Canvas particle field ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Build particle pool
    const COUNT = 90;
    const particles = Array.from({ length: COUNT }, () => ({
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      r:    Math.random() * 1.4 + 0.3,
      dx:   (Math.random() - 0.5) * 0.28,
      dy:   (Math.random() - 0.5) * 0.28,
      // each particle gets a hue: cyan (189) or violet (270)
      hue:  Math.random() > 0.5 ? 189 : 270,
      alpha: Math.random() * 0.45 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw faint connection lines
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(137,207,240,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width)  p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 85%, 75%, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── Priority + status color maps ────────────────────────────────────────────
  const priorityColor = {
    low:    { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',   border: 'rgba(74,222,128,0.25)',   bar: '#4ade80' },
    medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.25)',   bar: '#fbbf24' },
    high:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.25)',  bar: '#f87171' },
  };
  const statusColor = {
    open:        { color: '#89CFF0', bg: 'rgba(137,207,240,0.1)', border: 'rgba(137,207,240,0.25)' },
    in_progress: { color: '#c084fc', bg: 'rgba(192,132,252,0.1)', border: 'rgba(192,132,252,0.25)' },
    closed:      { color: '#899297', bg: 'rgba(137,146,151,0.1)', border: 'rgba(137,146,151,0.2)'  },
  };

  // ── Ticket stat counts ──────────────────────────────────────────────────────
  const openCount       = myTickets.filter(t => t.status === 'open').length;
  const inProgressCount = myTickets.filter(t => t.status === 'in_progress').length;
  const closedCount     = myTickets.filter(t => t.status === 'closed').length;

  // ── Shared styles ───────────────────────────────────────────────────────────
  const glass = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#e2e2e2',
    fontSize: '14px',
    outline: 'none',
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#899297',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: '8px',
  };

  const sectionDivider = {
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    marginBottom: '20px',
    paddingBottom: '20px',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: "'Hanken Grotesk', sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* ALL ANIMATION KEYFRAMES — injected once, touches nothing else           */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <style>{`
        /* 1. Floating particle canvas is drawn by JS — no keyframe needed */

        /* 2. Radial glow orbs */
        @keyframes orbDrift1 {
          0%   { transform: translate(0px,   0px)   scale(1);    opacity: 0.18; }
          33%  { transform: translate(60px,  -40px) scale(1.08); opacity: 0.26; }
          66%  { transform: translate(-30px, 50px)  scale(0.94); opacity: 0.20; }
          100% { transform: translate(0px,   0px)   scale(1);    opacity: 0.18; }
        }
        @keyframes orbDrift2 {
          0%   { transform: translate(0px,  0px)   scale(1);    opacity: 0.14; }
          40%  { transform: translate(-70px, 30px) scale(1.12); opacity: 0.22; }
          75%  { transform: translate(50px, -60px) scale(0.9);  opacity: 0.16; }
          100% { transform: translate(0px,  0px)   scale(1);    opacity: 0.14; }
        }
        @keyframes orbDrift3 {
          0%   { transform: translate(0px,  0px)  scale(1);    opacity: 0.10; }
          50%  { transform: translate(40px, 70px) scale(1.15); opacity: 0.18; }
          100% { transform: translate(0px,  0px)  scale(1);    opacity: 0.10; }
        }

        /* 3. Floating decorative icons */
        @keyframes iconFloat1 {
          0%, 100% { transform: translateY(0px) rotate(-6deg); opacity: 0.10; }
          50%      { transform: translateY(-22px) rotate(-2deg); opacity: 0.18; }
        }
        @keyframes iconFloat2 {
          0%, 100% { transform: translateY(0px) rotate(8deg);  opacity: 0.08; }
          50%      { transform: translateY(-16px) rotate(12deg); opacity: 0.15; }
        }
        @keyframes iconFloat3 {
          0%, 100% { transform: translateY(0px) rotate(-4deg);  opacity: 0.07; }
          50%      { transform: translateY(-28px) rotate(2deg);  opacity: 0.13; }
        }
        @keyframes iconFloat4 {
          0%, 100% { transform: translateY(0px) rotate(6deg);   opacity: 0.09; }
          50%      { transform: translateY(-18px) rotate(10deg); opacity: 0.16; }
        }
        @keyframes iconFloat5 {
          0%, 100% { transform: translateY(0px) rotate(-10deg); opacity: 0.06; }
          50%      { transform: translateY(-24px) rotate(-4deg); opacity: 0.12; }
        }

        /* 4. Scanline sweep */
        @keyframes scanline {
          0%   { top: -4px;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100vh; opacity: 0; }
        }

        /* 5. Staggered entrance animations */
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* header entrance */
        .profile-header-anim {
          animation: fadeDown 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* avatar card */
        .profile-avatar-card-anim {
          animation: slideInLeft 0.65s cubic-bezier(0.22,1,0.36,1) 0.12s both;
        }
        /* account details card */
        .profile-account-card-anim {
          animation: slideInRight 0.65s cubic-bezier(0.22,1,0.36,1) 0.20s both;
        }
        /* tickets list */
        .profile-tickets-anim {
          animation: slideInLeft 0.65s cubic-bezier(0.22,1,0.36,1) 0.30s both;
        }
        /* security card */
        .profile-security-anim {
          animation: slideInRight 0.65s cubic-bezier(0.22,1,0.36,1) 0.38s both;
        }
        /* form field stagger */
        .profile-field-anim-1 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.55s both; }
        .profile-field-anim-2 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.65s both; }
        .profile-field-anim-3 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.75s both; }
        .profile-field-anim-4 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.85s both; }
        .profile-field-anim-5 { animation: fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) 0.95s both; }

        /* 6. Shimmer sweep on primary button */
        @keyframes shimmerSweep {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .profile-btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .profile-btn-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(137,207,240,0.18) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: shimmerSweep 2.4s linear infinite;
          pointer-events: none;
        }

        .profile-btn-shimmer-violet::after {
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(192,132,252,0.18) 50%,
            transparent 70%
          );
          background-size: 200% 100%;
          animation: shimmerSweep 2.4s linear infinite;
        }

        /* 7. Input glow on focus — already handled inline via onFocus/onBlur,
              but we strengthen it with a CSS class for the animation pulse */
        @keyframes inputGlowPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(137,207,240,0.15); }
          50%      { box-shadow: 0 0 22px rgba(137,207,240,0.30); }
        }
        @keyframes inputGlowPulseViolet {
          0%, 100% { box-shadow: 0 0 10px rgba(192,132,252,0.15); }
          50%      { box-shadow: 0 0 22px rgba(192,132,252,0.30); }
        }
        .profile-input-focused-cyan:focus {
          border-color: #89CFF0 !important;
          animation: inputGlowPulse 1.8s ease-in-out infinite;
        }
        .profile-input-focused-violet:focus {
          border-color: #c084fc !important;
          animation: inputGlowPulseViolet 1.8s ease-in-out infinite;
        }

        /* 8. Logo breathing glow */
        @keyframes logoBreath {
          0%, 100% { box-shadow: 0 0 10px rgba(137,207,240,0.35), 0 0 22px rgba(137,207,240,0.12); }
          50%      { box-shadow: 0 0 22px rgba(137,207,240,0.65), 0 0 44px rgba(137,207,240,0.25); }
        }
        .profile-logo-glow {
          animation: logoBreath 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── 1. Canvas particle field (fixed, behind everything) ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── 2. Radial glow orbs ── */}
      {/* Orb 1 — cyan, top-left */}
      <div style={{
        position: 'fixed', top: '-180px', left: '-120px',
        width: '600px', height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(137,207,240,0.22) 0%, transparent 70%)',
        animation: 'orbDrift1 18s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Orb 2 — violet, bottom-right */}
      <div style={{
        position: 'fixed', bottom: '-200px', right: '-150px',
        width: '700px', height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(192,132,252,0.18) 0%, transparent 70%)',
        animation: 'orbDrift2 24s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />
      {/* Orb 3 — cyan, center-right, subtle */}
      <div style={{
        position: 'fixed', top: '35%', right: '-80px',
        width: '420px', height: '420px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(137,207,240,0.10) 0%, transparent 70%)',
        animation: 'orbDrift3 30s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── 3. Floating decorative IT icons ── */}
      {[
        { icon: 'terminal',       top: '12%',  left: '4%',   size: '52px', anim: 'iconFloat1 9s  ease-in-out infinite' },
        { icon: 'dns',            top: '68%',  left: '2%',   size: '44px', anim: 'iconFloat2 12s ease-in-out infinite 1.5s' },
        { icon: 'lock',           top: '25%',  right: '3%',  size: '40px', anim: 'iconFloat3 11s ease-in-out infinite 0.8s' },
        { icon: 'badge',          top: '78%',  right: '4%',  size: '48px', anim: 'iconFloat4 10s ease-in-out infinite 2.2s' },
        { icon: 'manage_accounts',top: '50%',  left: '1.5%', size: '36px', anim: 'iconFloat5 14s ease-in-out infinite 0.4s' },
      ].map(({ icon, top, left, right, size, anim }) => (
        <span
          key={icon}
          className="material-symbols-outlined"
          style={{
            position: 'fixed',
            top, left, right,
            fontSize: size,
            color: '#89CFF0',
            pointerEvents: 'none',
            zIndex: 0,
            animation: anim,
            userSelect: 'none',
          }}
        >
          {icon}
        </span>
      ))}

      {/* ── 4. Scanline sweep ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, transparent, rgba(137,207,240,0.18), rgba(192,132,252,0.14), transparent)',
        animation: 'scanline 8s linear infinite',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ORIGINAL JSX — untouched except wrapper gets position:relative, z-index */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* ── Sticky top header bar ── */}
      <header
        className="profile-header-anim"
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          height: '68px',
          background: 'rgba(19,19,19,0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
          padding: '0 40px',
          gap: '16px',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* 8. Logo breathing glow — class added to the logo box */}
          <div
            className="profile-logo-glow"
            style={{
              width: '36px', height: '36px', borderRadius: '9px',
              background: '#89CFF0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <span className="material-symbols-outlined" style={{ color: '#003546', fontSize: '20px' }}>terminal</span>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#bce8ff', letterSpacing: '-0.02em' }}>
            TicketDesk
          </span>
        </div>
        <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.08)' }} />
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px', padding: '8px 16px',
            color: '#bfc8cd', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif",
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(137,207,240,0.1)'; e.currentTarget.style.color = '#89CFF0'; e.currentTarget.style.borderColor = 'rgba(137,207,240,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#bfc8cd'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
          Back to Dashboard
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e2e2' }}>My Profile</span>
          <span style={{
            background: 'rgba(137,207,240,0.1)', border: '1px solid rgba(137,207,240,0.25)',
            borderRadius: '999px', padding: '3px 12px',
            color: '#89CFF0', fontSize: '11px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            {currentUser.role}
          </span>
        </div>
      </header>

      {/* ── Page content ── */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '40px 40px 60px',
        display: 'flex', flexDirection: 'column', gap: '24px',
        position: 'relative', zIndex: 2,
      }}>

        {/* ── Row 1: Avatar card + Account details ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px' }}>

          {/* Avatar card — 5. slideInLeft */}
          <div
            className="profile-avatar-card-anim"
            style={{ ...glass, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', textAlign: 'center' }}>
            <div style={{ position: 'relative' }}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: '0 0 32px rgba(137,207,240,0.3)',
                    border: '2px solid rgba(137,207,240,0.3)',
                  }}
                />
              ) : (
                <div style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #89CFF0, #005974)',
                  boxShadow: '0 0 32px rgba(137,207,240,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '36px', fontWeight: 700, color: '#003546',
                }}>
                  {displayUsername.charAt(0).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                title="Upload photo"
                style={{
                  position: 'absolute', bottom: '-2px', right: '-2px',
                  width: '26px', height: '26px', borderRadius: '50%',
                  background: avatarLoading ? '#899297' : '#89CFF0',
                  border: '2px solid #000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: avatarLoading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '13px', color: '#003546' }}>
                  {avatarLoading ? 'hourglass_empty' : 'edit'}
                </span>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#89CFF0' }}>{displayUsername}</div>
              <div style={{ fontSize: '13px', color: '#899297', marginTop: '4px' }}>{currentUser.email}</div>
            </div>

            <p style={{ fontSize: '11px', color: '#899297', margin: '-8px 0 0', lineHeight: 1.4 }}>
              Click the pencil icon to upload a photo
            </p>

            <div style={{
              width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
              gap: '8px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.07)',
            }}>
              {[
                { label: 'Open',    value: openCount,       color: '#89CFF0' },
                { label: 'In Prog', value: inProgressCount, color: '#c084fc' },
                { label: 'Closed',  value: closedCount,     color: '#899297' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '20px', fontWeight: 700, color }}>{value}</span>
                  <span style={{ fontSize: '10px', color: '#899297', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1.2, textAlign: 'center' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Account details card — 5. slideInRight */}
          <div
            className="profile-account-card-anim"
            style={{ ...glass, padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
              <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>badge</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>Account Details</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              {[
                { label: 'Username',      value: displayUsername },
                { label: 'Email Address', value: currentUser.email },
                { label: 'Role',          value: currentUser.role },
                { label: 'Total Tickets', value: `${myTickets.length} created` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{
                    fontSize: '15px', color: '#e2e2e2',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px', padding: '10px 14px',
                    textTransform: label === 'Role' ? 'capitalize' : 'none',
                  }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: My tickets + Security settings ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

          {/* My tickets list — 5. slideInLeft */}
          <div
            className="profile-tickets-anim"
            style={{ ...glass, padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>confirmation_number</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>My Tickets</span>
              </div>
              <span style={{ fontSize: '11px', color: '#899297', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {myTickets.length} total
              </span>
            </div>

            {myTickets.length === 0 ? (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#899297', opacity: 0.4 }}>inbox</span>
                <p style={{ color: '#899297', fontSize: '13px', margin: 0 }}>You haven't created any tickets yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {myTickets.map((ticket) => {
                  const pc = priorityColor[ticket.priority] || priorityColor.low;
                  const sc = statusColor[ticket.status]     || statusColor.closed;
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => onSelectTicket && onSelectTicket(ticket)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '14px',
                        padding: '14px 16px', borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        cursor: onSelectTicket ? 'pointer' : 'default',
                        transition: 'all 0.18s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(137,207,240,0.05)'; e.currentTarget.style.borderColor = 'rgba(137,207,240,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                    >
                      <div style={{ width: '3px', borderRadius: '999px', alignSelf: 'stretch', background: pc.bar, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '11px', color: '#89CFF0', fontWeight: 700 }}>#{ticket.id}</span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: pc.color, background: pc.bg, border: `1px solid ${pc.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {ticket.priority}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e2e2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ticket.title}
                        </div>
                        {ticket.description && (
                          <div style={{ fontSize: '12px', color: '#899297', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {ticket.description}
                          </div>
                        )}
                      </div>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#899297', flexShrink: 0 }}>chevron_right</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Security settings card — 5. slideInRight ── */}
          <div
            className="profile-security-anim"
            style={{ ...glass, padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>lock</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e2e2' }}>Security Settings</span>
            </div>

            {/* ── SECTION 1: Change Username ── */}
            <div style={sectionDivider}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '16px' }}>manage_accounts</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Change Username
                </span>
              </div>

              {usernameSuccess && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  {usernameSuccess}
                </div>
              )}

              {usernameError && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                  {usernameError}
                </div>
              )}

              {/* 5. Staggered field entrance */}
              <form onSubmit={handleUsernameChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="profile-field-anim-1">
                  <label style={labelStyle}>New Username</label>
                  {/* 7. input glow class — violet */}
                  <input
                    type="text"
                    placeholder={displayUsername}
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    className="profile-input-focused-violet"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#c084fc'; e.target.style.boxShadow = '0 0 14px rgba(192,132,252,0.15)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                <div className="profile-field-anim-2">
                  <label style={labelStyle}>Confirm with Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={usernamePassword}
                    onChange={e => setUsernamePassword(e.target.value)}
                    className="profile-input-focused-violet"
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor = '#c084fc'; e.target.style.boxShadow = '0 0 14px rgba(192,132,252,0.15)'; }}
                    onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
                {/* 6. Shimmer button — violet variant */}
                <button
                  type="submit"
                  disabled={usernameLoading}
                  className="profile-btn-shimmer profile-btn-shimmer-violet"
                  style={{
                    width: '100%', padding: '11px',
                    borderRadius: '10px', background: 'transparent',
                    border: '1px solid rgba(192,132,252,0.35)',
                    color: '#c084fc', fontSize: '13px', fontWeight: 700,
                    cursor: usernameLoading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    opacity: usernameLoading ? 0.5 : 1, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!usernameLoading) e.currentTarget.style.background = 'rgba(192,132,252,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {usernameLoading ? 'Updating…' : 'Change Username'}
                </button>
              </form>
            </div>

            {/* ── SECTION 2: Change Password ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '16px' }}>key</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#89CFF0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Change Password
                </span>
              </div>

              {success && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                  {success}
                </div>
              )}

              {error && (
                <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.2)', color: '#ffb4ab' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, animClass: 'profile-field-anim-3' },
                  { label: 'New Password',     value: newPassword,     setter: setNewPassword,     animClass: 'profile-field-anim-4' },
                  { label: 'Confirm Password', value: confirm,         setter: setConfirm,         animClass: 'profile-field-anim-5' },
                ].map(({ label, value, setter, animClass }) => (
                  <div key={label} className={animClass}>
                    <label style={labelStyle}>{label}</label>
                    {/* 7. input glow class — cyan */}
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      required
                      className="profile-input-focused-cyan"
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                ))}
                {/* 6. Shimmer button — cyan */}
                <button
                  type="submit"
                  disabled={loading}
                  className="profile-btn-shimmer"
                  style={{
                    width: '100%', padding: '11px',
                    borderRadius: '10px', background: 'transparent',
                    border: '1px solid rgba(137,207,240,0.35)',
                    color: '#89CFF0', fontSize: '13px', fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: "'Hanken Grotesk', sans-serif",
                    opacity: loading ? 0.5 : 1, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(137,207,240,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {loading ? 'Updating…' : 'Change Password'}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;