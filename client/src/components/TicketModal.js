import React, { useState, useEffect, useRef } from 'react';

const getLoggedInUsername = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.username || '';
  } catch {
    return '';
  }
};

// ── Pill selector config ────────────────────────────────────────────────────
const PRIORITY_OPTIONS = [
  { value: 'low',    label: 'Low',    color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  border: 'rgba(74,222,128,0.3)'  },
  { value: 'medium', label: 'Medium', color: '#facc15', bg: 'rgba(250,204,21,0.12)',  border: 'rgba(250,204,21,0.3)'  },
  { value: 'high',   label: 'High',   color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
];

const STATUS_OPTIONS = [
  { value: 'open',        label: 'Open',        color: '#89CFF0', bg: 'rgba(137,207,240,0.12)', border: 'rgba(137,207,240,0.3)' },
  { value: 'in_progress', label: 'In Progress', color: '#c084fc', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' },
  { value: 'closed',      label: 'Closed',      color: '#899297', bg: 'rgba(137,146,151,0.12)', border: 'rgba(137,146,151,0.3)' },
];

// ── PillGroup ────────────────────────────────────────────────────────────────
const PillGroup = ({ options, value, onChange }) => (
  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
    {options.map((opt) => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            padding: '7px 16px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: "'Hanken Grotesk', sans-serif",
            transition: 'all 0.18s',
            background:   active ? opt.bg     : 'rgba(255,255,255,0.03)',
            border:       active ? `1px solid ${opt.border}` : '1px solid rgba(255,255,255,0.08)',
            color:        active ? opt.color  : '#899297',
            boxShadow:    active ? `0 0 10px ${opt.bg}` : 'none',
          }}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

// ── TicketModal ──────────────────────────────────────────────────────────────
function TicketModal({ isOpen, onClose, onSubmit, editingTicket }) {
  const isEditing = Boolean(editingTicket);
  const canvasRef = useRef(null);

  const [form, setForm] = useState({
    title:       '',
    description: '',
    priority:    'medium',
    status:      'open',
    created_by:  getLoggedInUsername(),
  });

  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  // ── Canvas particle field ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
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

    const COUNT = 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x:   Math.random() * window.innerWidth,
      y:   Math.random() * window.innerHeight,
      vx:  (Math.random() - 0.5) * 0.4,
      vy:  (Math.random() - 0.5) * 0.4,
      r:   Math.random() * 1 + 0.8,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,240,255,0.45)';
        ctx.fill();
      });

      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,112,255,${0.18 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (editingTicket) {
      setForm({
        title:       editingTicket.title       || '',
        description: editingTicket.description || '',
        priority:    editingTicket.priority    || 'medium',
        status:      editingTicket.status      || 'open',
        created_by:  editingTicket.created_by  || '',
      });
    } else {
      setForm({
        title:       '',
        description: '',
        priority:    'medium',
        status:      'open',
        created_by:  getLoggedInUsername(),
      });
    }
    setErrors({});
  }, [editingTicket, isOpen]);

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setErrors({ api: err.response?.data?.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e2e2',
    borderRadius: '10px',
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    fontSize: '14px',
    fontFamily: "'Hanken Grotesk', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    color: '#bfc8cd',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '24px',
      }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(32px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes orbDrift1 {
          0%,100% { transform: translate(0px, 0px); }
          33%     { transform: translate(60px, -50px); }
          66%     { transform: translate(-40px, 70px); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0px, 0px); }
          40%     { transform: translate(-70px, 40px); }
          70%     { transform: translate(50px, -60px); }
        }
        @keyframes orbDrift3 {
          0%,100% { transform: translate(0px, 0px); }
          50%     { transform: translate(80px, 50px); }
        }
        @keyframes scanline {
          0%   { top: -2px;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100vh; opacity: 0; }
        }
        @keyframes float0 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-22px) rotate(5deg)}  }
        @keyframes float1 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-18px) rotate(-6deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-26px) rotate(4deg)}  }
        @keyframes float3 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-20px) rotate(-4deg)} }
        @keyframes float4 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-24px) rotate(6deg)}  }
        @keyframes float5 { 0%,100%{transform:translateY(0px)   rotate(0deg)}  50%{transform:translateY(-16px) rotate(-5deg)} }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(250%);  }
        }
        @keyframes breatheGlow {
          0%,100% { filter: drop-shadow(0 0 4px rgba(137,207,240,0.3)); }
          50%     { filter: drop-shadow(0 0 16px rgba(137,207,240,0.85)) drop-shadow(0 0 32px rgba(137,207,240,0.35)); }
        }
        .shimmer-btn {
          position: relative;
          overflow: hidden;
        }
        .shimmer-btn::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 50%; height: 100%;
          background: linear-gradient(30deg, transparent 0%, rgba(255,255,255,0.28) 50%, transparent 100%);
          animation: shimmerSweep 2.5s ease-in-out infinite;
          pointer-events: none;
        }
        .ticket-input:focus {
          border-color: #89CFF0 !important;
          box-shadow: 0 0 0 2px rgba(137,207,240,0.18), 0 0 16px rgba(137,207,240,0.12) !important;
        }
      `}</style>

      {/* ── Canvas particle field ── */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── Glow orbs ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
          filter: 'blur(80px)', top: '-120px', left: '-100px',
          animation: 'orbDrift1 72s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '440px', height: '440px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.18) 0%, transparent 70%)',
          filter: 'blur(90px)', bottom: '-100px', right: '-80px',
          animation: 'orbDrift2 85s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute', width: '360px', height: '360px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,63,94,0.14) 0%, transparent 70%)',
          filter: 'blur(100px)', top: '40%', left: '55%',
          animation: 'orbDrift3 60s ease-in-out infinite',
        }} />
      </div>

      {/* ── Floating decorative icons ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {[
          { icon: '⚙',  top: '8%',  left: '5%',  anim: 'float0', delay: '0s'   },
          { icon: '🔒', top: '15%', right: '7%', anim: 'float1', delay: '1.2s' },
          { icon: '📡', top: '72%', left: '3%',  anim: 'float2', delay: '0.6s' },
          { icon: '💻', top: '80%', right: '5%', anim: 'float3', delay: '2s'   },
          { icon: '🛡',  top: '45%', left: '2%',  anim: 'float4', delay: '3.1s' },
          { icon: '🔧', top: '55%', right: '3%', anim: 'float5', delay: '1.8s' },
          { icon: '⚡', top: '25%', left: '8%',  anim: 'float1', delay: '0.4s' },
          { icon: '🖥',  top: '88%', left: '45%', anim: 'float0', delay: '2.5s' },
        ].map((item, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: item.top, left: item.left, right: item.right,
            fontSize: '22px',
            opacity: 0.08,
            animation: `${item.anim} ${3.8 + i * 0.4}s ease-in-out infinite`,
            animationDelay: item.delay,
            userSelect: 'none',
          }}>
            {item.icon}
          </div>
        ))}
      </div>

      {/* ── Scanline sweep ── */}
      <div style={{
        position: 'fixed',
        left: 0, width: '100%', height: '2px',
        background: 'linear-gradient(to right, transparent, rgba(0,240,255,0.15), transparent)',
        zIndex: 3,
        pointerEvents: 'none',
        animation: 'scanline 6s linear infinite',
      }} />

      {/* ── Modal card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(19,19,19,0.97)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '18px',
          width: '100%',
          maxWidth: '540px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          position: 'relative',
          zIndex: 10,
          animation: 'modalSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
        }}
      >

        {/* ── Header ── */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'fadeUp 0.5s ease both',
            animationDelay: '0.1s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'rgba(137,207,240,0.12)',
              border: '1px solid rgba(137,207,240,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'breatheGlow 3s ease-in-out infinite',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#89CFF0' }}>
                {isEditing ? 'edit' : 'confirmation_number'}
              </span>
            </div>
            <div>
              <h2 style={{ color: '#e2e2e2', fontSize: '17px', fontWeight: 700, margin: 0 }}>
                {isEditing ? 'Edit Ticket' : 'New Ticket'}
              </h2>
              <p style={{ color: '#899297', fontSize: '12px', margin: 0, marginTop: '2px' }}>
                {isEditing ? 'Update the ticket details below' : 'Fill in the details for your new ticket'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#bfc8cd',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '-12px 0' }} />

        {/* ── API Error ── */}
        {errors.api && (
          <div style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: '10px', padding: '12px 14px',
            color: '#f87171', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
            {errors.api}
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* Title */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.18s',
          }}>
            <label style={labelStyle}>Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Printer not working on 3rd floor"
              className="ticket-input"
              style={{ ...inputStyle, border: errors.title ? '1px solid rgba(248,113,113,0.5)' : inputStyle.border }}
              onFocus={e  => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
              onBlur={e   => { e.target.style.borderColor = errors.title ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.title && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>error</span>
                {errors.title}
              </span>
            )}
          </div>

          {/* Description */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.26s',
          }}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the issue in detail..."
              rows={4}
              className="ticket-input"
              style={{
                ...inputStyle,
                border: errors.description ? '1px solid rgba(248,113,113,0.5)' : inputStyle.border,
                resize: 'vertical',
                lineHeight: '1.6',
              }}
              onFocus={e  => { e.target.style.borderColor = '#89CFF0'; e.target.style.boxShadow = '0 0 14px rgba(137,207,240,0.15)'; }}
              onBlur={e   => { e.target.style.borderColor = errors.description ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
            />
            {errors.description && (
              <span style={{ color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>error</span>
                {errors.description}
              </span>
            )}
          </div>

          {/* Priority */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.34s',
          }}>
            <label style={labelStyle}>Priority</label>
            <PillGroup
              options={PRIORITY_OPTIONS}
              value={form.priority}
              onChange={(val) => setForm((prev) => ({ ...prev, priority: val }))}
            />
          </div>

          {/* Status */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '10px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.42s',
          }}>
            <label style={labelStyle}>Status</label>
            <PillGroup
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
            />
          </div>

          {/* Created By — read-only */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '8px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.5s',
          }}>
            <label style={labelStyle}>Created By</label>
            <div style={{
              ...inputStyle,
              display: 'flex', alignItems: 'center', gap: '8px',
              opacity: 0.55, cursor: 'not-allowed',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#89CFF0' }}>account_circle</span>
              <span style={{ color: '#bfc8cd', fontSize: '14px' }}>{form.created_by}</span>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px',
            animation: 'fadeUp 0.5s ease both', animationDelay: '0.58s',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', padding: '10px 20px',
                color: '#bfc8cd', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Hanken Grotesk', sans-serif",
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="shimmer-btn"
              style={{
                background: loading ? 'rgba(137,207,240,0.4)' : '#89CFF0',
                border: 'none', borderRadius: '10px',
                padding: '10px 24px', color: '#003546',
                fontSize: '13px', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: "'Hanken Grotesk', sans-serif",
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {isEditing ? 'save' : 'confirmation_number'}
              </span>
              {loading ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default TicketModal;