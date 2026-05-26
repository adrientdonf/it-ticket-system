import React, { useState, useEffect } from 'react';import api from '../services/api';
import { getResetRequests, resolveResetRequest, detectIncidents } from '../services/api';

// ── Animated count-up hook ──────────────────────────────────────────────────
function useCountUp(target, duration = 900, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started || target === 0) { setValue(target); return; }
    let start = null;
    const from = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, started, duration]);
  return value;
}

// ── Stat card with count-up ─────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delay, started, glass }) {
  const count = useCountUp(value, 900, started);
  return (
    <div
      className="admin-stat-card"
      style={{
        ...glass, padding: '24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        opacity: 0,
        animation: started ? `fadeUp 0.6s ${delay} cubic-bezier(0.22,1,0.36,1) forwards` : 'none',
      }}
    >
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        boxShadow: `0 0 18px ${color}22`,
      }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: '22px' }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}</div>
        <div style={{ fontSize: '11px', color: '#899297', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '4px' }}>{label}</div>
      </div>
    </div>
  );
}

function AdminPage({ currentUser, onBack }) {
  const [users,          setUsers]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [message,        setMessage]        = useState('');
  const [search,         setSearch]         = useState('');
  const [resetRequests,  setResetRequests]  = useState([]);
  const [showResets,     setShowResets]     = useState(false);
  const [incidents,      setIncidents]      = useState(null);
  const [incidentSummary,setIncidentSummary]= useState('');
  const [scanLoading,    setScanLoading]    = useState(false);
  const [mounted,        setMounted]        = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true); setError('');
      const res = await api.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const res = await getResetRequests();
      setResetRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to load reset requests:', err);
    }
  };

  useEffect(() => { fetchUsers(); fetchResetRequests(); }, []);

  const handleRoleChange = async (user) => {
    const newRole = user.role === 'admin' ? 'employee' : 'admin';
    if (!window.confirm(`Change ${user.username}'s role to ${newRole}?`)) return;
    try {
      await api.put(`/admin/users/${user.id}/role`, { role: newRole });
      setMessage(`${user.username}'s role updated to ${newRole}.`); setError('');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role.'); setMessage('');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.username}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      setMessage(`${user.username} has been deleted.`); setError('');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.'); setMessage('');
    }
  };

  const handleResolveReset = async (request) => {
    if (!window.confirm(`Reset ${request.username}'s password to temp1234?`)) return;
    try {
      await resolveResetRequest(request.id);
      setMessage(`${request.username}'s password has been reset to temp1234.`); setError('');
      fetchResetRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.'); setMessage('');
    }
  };

  const handleDetectIncidents = async () => {
    try {
      setScanLoading(true);
      const ticketsRes = await api.get('/tickets');
      const openTickets = (ticketsRes.data.data || []).filter(t => t.status !== 'closed');
      if (openTickets.length === 0) {
        setIncidents([]);
        setIncidentSummary('No open tickets to analyze.');
        return;
      }
      const res = await detectIncidents({ tickets: openTickets });
      setIncidents(res.data.data.incidents || []);
      setIncidentSummary(res.data.data.summary || '');
    } catch (err) {
      setIncidents([]);
      setIncidentSummary('Failed to run incident scan. Please try again.');
    } finally {
      setScanLoading(false);
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const filteredUsers  = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  const adminCount    = users.filter(u => u.role === 'admin').length;
  const employeeCount = users.filter(u => u.role === 'employee').length;

  const glass = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
  };

  const severityConfig = {
    critical: { color: '#ffb4ab', bg: 'rgba(255,180,171,0.08)', border: 'rgba(255,180,171,0.2)', icon: 'emergency' },
    high:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  icon: 'warning'   },
    medium:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  icon: 'info'      },
  };

  return (
    <>
      <style>{`
        /* ── Entrances ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Ambient orbs ── */
        @keyframes orbA {
          0%,100% { transform: translate(0,0)           scale(1);    opacity: 0.18; }
          33%      { transform: translate(40px,-30px)    scale(1.08); opacity: 0.28; }
          66%      { transform: translate(-20px,-50px)   scale(0.94); opacity: 0.16; }
        }
        @keyframes orbB {
          0%,100% { transform: translate(0,0)          scale(1);   opacity: 0.14; }
          40%      { transform: translate(-35px,25px)   scale(1.1); opacity: 0.24; }
          80%      { transform: translate(15px,45px)    scale(0.9); opacity: 0.12; }
        }
        @keyframes orbC {
          0%,100% { transform: translate(0,0)          scale(1);    opacity: 0.12; }
          50%      { transform: translate(25px,30px)    scale(1.12); opacity: 0.22; }
        }

        /* ── Scanline ── */
        @keyframes scanline {
          0%   { top: -2%; opacity: 0; }
          4%   { opacity: 0.35; }
          96%  { opacity: 0.20; }
          100% { top: 102%; opacity: 0; }
        }

        /* ── Stat card border pulse ── */
        @keyframes cardBorderPulse {
          0%,100% { box-shadow: 0 0 0 transparent; }
          50%      { box-shadow: 0 0 22px rgba(137,207,240,0.10); }
        }
        .admin-stat-card {
          animation-fill-mode: forwards;
          transition: box-shadow 0.3s, transform 0.2s;
        }
        .admin-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 28px rgba(137,207,240,0.14) !important;
        }

        /* ── AI scan button radar pulse ── */
        @keyframes radarPing {
          0%   { box-shadow: 0 0 0 0 rgba(137,207,240,0.4); }
          70%  { box-shadow: 0 0 0 10px rgba(137,207,240,0); }
          100% { box-shadow: 0 0 0 0 rgba(137,207,240,0); }
        }
        .scan-btn-idle {
          animation: radarPing 2.2s ease-out infinite;
        }

        /* ── Scan loading icon spin ── */
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .scan-spin { animation: spinSlow 1.2s linear infinite; display: inline-block; }

        /* ── Incident cards stagger in ── */
        .incident-card {
          opacity: 0;
          animation: fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Table rows fade in ── */
        .admin-row {
          opacity: 0;
          animation: fadeIn 0.4s ease forwards;
        }

        /* ── Message banners ── */
        .admin-banner {
          animation: slideDown 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* ── Section block entrance ── */
        .admin-section {
          opacity: 0;
        }
        .admin-section.visible {
          animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Summary bar shimmer ── */
        @keyframes summaryGlow {
          0%,100% { box-shadow: 0 0 0 transparent; }
          50%      { box-shadow: 0 0 16px rgba(137,207,240,0.12); }
        }
        .summary-bar { animation: summaryGlow 3s ease-in-out infinite; }

        /* ── Reset requests badge pulse ── */
        @keyframes badgePop {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.12); }
        }
        .reset-badge { animation: badgePop 2s ease-in-out infinite; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: '#000000',
        fontFamily: "'Hanken Grotesk', sans-serif",
        padding: '40px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* ── Ambient background orbs ── */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'8%',  left:'5%',  width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(137,207,240,0.07) 0%, transparent 70%)', filter:'blur(60px)', animation:'orbA 16s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'10%', right:'4%', width:420, height:420, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)',  filter:'blur(55px)', animation:'orbB 20s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'45%', left:'45%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(137,207,240,0.05) 0%, transparent 70%)', filter:'blur(45px)', animation:'orbC 13s ease-in-out infinite' }} />
        </div>

        {/* ── Scanline sweep ── */}
        <div style={{ position:'fixed', left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent, rgba(137,207,240,0.40), transparent)', animation:'scanline 10s linear infinite', zIndex:1, pointerEvents:'none' }} />

        {/* ── Page content ── */}
        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px', position:'relative', zIndex:2 }}>

          {/* ── Page Header ── */}
          <div
            className={`admin-section ${mounted ? 'visible' : ''}`}
            style={{ animationDelay:'0.05s', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'16px' }}
          >
            <div>
              <button
                onClick={onBack}
                style={{
                  display:'flex', alignItems:'center', gap:'6px',
                  background:'none', border:'none', cursor:'pointer',
                  color:'#899297', fontSize:'13px', fontWeight:600,
                  fontFamily:"'Hanken Grotesk', sans-serif",
                  marginBottom:'12px', padding:0, transition:'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
                onMouseLeave={e => e.currentTarget.style.color = '#899297'}
              >
                <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>arrow_back</span>
                Back to Dashboard
              </button>
              <h1 style={{ margin:0, fontSize:'32px', fontWeight:700, color:'#e2e2e2', letterSpacing:'-0.02em' }}>
                User Management
              </h1>
              <p style={{ margin:'4px 0 0', fontSize:'14px', color:'#899297' }}>
                Manage system access levels and operational permissions.
              </p>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>

              {/* Reset Requests button */}
              <div style={{ position:'relative' }}>
                <button
                  onClick={() => setShowResets(!showResets)}
                  style={{
                    display:'flex', alignItems:'center', gap:'8px',
                    background: resetRequests.length > 0 ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.04)',
                    border:`1px solid ${resetRequests.length > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius:'10px', padding:'10px 16px',
                    color: resetRequests.length > 0 ? '#fbbf24' : '#899297',
                    fontSize:'13px', fontWeight:700, cursor:'pointer',
                    fontFamily:"'Hanken Grotesk', sans-serif",
                    transition:'all 0.2s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>lock_reset</span>
                  Reset Requests
                  {resetRequests.length > 0 && (
                    <span className="reset-badge" style={{
                      background:'#fbbf24', color:'#000',
                      borderRadius:'999px', fontSize:'11px', fontWeight:800,
                      padding:'1px 7px',
                    }}>
                      {resetRequests.length}
                    </span>
                  )}
                </button>

                {showResets && (
                  <div style={{
                    position:'absolute', top:'calc(100% + 8px)', right:0,
                    width:'340px', zIndex:100,
                    background:'#1a1a1a',
                    border:'1px solid rgba(255,255,255,0.08)',
                    borderRadius:'14px',
                    boxShadow:'0 16px 48px rgba(0,0,0,0.5)',
                    overflow:'hidden',
                    animation:'fadeUp 0.3s cubic-bezier(0.22,1,0.36,1) both',
                  }}>
                    <div style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.06)', fontSize:'13px', fontWeight:700, color:'#e2e2e2', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#fbbf24' }}>lock_reset</span>
                      Pending Password Resets
                    </div>
                    {resetRequests.length === 0 ? (
                      <div style={{ padding:'24px', textAlign:'center', color:'#899297', fontSize:'13px' }}>No pending reset requests</div>
                    ) : (
                      resetRequests.map((req) => (
                        <div key={req.id} style={{ padding:'14px 18px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px' }}>
                          <div>
                            <div style={{ fontSize:'13px', fontWeight:700, color:'#e2e2e2' }}>{req.username}</div>
                            <div style={{ fontSize:'11px', color:'#899297', marginTop:'2px' }}>{req.email}</div>
                            <div style={{ fontSize:'10px', color:'#899297', marginTop:'2px' }}>{formatDate(req.created_at)}</div>
                          </div>
                          <button
                            onClick={() => handleResolveReset(req)}
                            style={{ background:'#89CFF0', color:'#003546', border:'none', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:"'Hanken Grotesk', sans-serif" }}
                          >
                            Reset Password
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Admin Only badge */}
              <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,180,171,0.08)', border:'1px solid rgba(255,180,171,0.2)', borderRadius:'999px', padding:'8px 16px' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#ffb4ab' }}>shield</span>
                <span style={{ color:'#ffb4ab', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Admin Only</span>
              </div>
            </div>
          </div>

          {/* ── Feedback Messages ── */}
          {message && (
            <div className="admin-banner" style={{ padding:'12px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', color:'#10b981' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>check_circle</span>
              {message}
            </div>
          )}
          {error && (
            <div className="admin-banner" style={{ padding:'12px 16px', borderRadius:'10px', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,180,171,0.1)', border:'1px solid rgba(255,180,171,0.2)', color:'#ffb4ab' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>warning</span>
              {error}
            </div>
          )}

          {/* ── Stats Row ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'16px' }}>
            {[
              { label:'Total Users', value:users.length,   icon:'group',               color:'#89CFF0', delay:'0.15s' },
              { label:'Admins',      value:adminCount,     icon:'admin_panel_settings', color:'#fbbf24', delay:'0.25s' },
              { label:'Employees',   value:employeeCount,  icon:'badge',                color:'#60a5fa', delay:'0.35s' },
            ].map((props) => (
              <StatCard key={props.label} {...props} started={mounted} glass={glass} />
            ))}
          </div>

          {/* ── AI Incident Monitor ── */}
          <div
            className={`admin-section ${mounted ? 'visible' : ''}`}
            style={{ animationDelay:'0.42s', ...glass, overflow:'hidden' }}
          >
            {/* Header */}
            <div style={{
              padding:'20px 24px',
              borderBottom: incidents !== null ? '1px solid rgba(255,255,255,0.05)' : 'none',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{
                  width:'36px', height:'36px', borderRadius:'10px',
                  background:'rgba(137,207,240,0.08)', border:'1px solid rgba(137,207,240,0.15)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow: scanLoading ? '0 0 22px rgba(137,207,240,0.25)' : 'none',
                  transition:'box-shadow 0.4s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'20px', color:'#89CFF0' }}>monitor_heart</span>
                </div>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>AI Incident Monitor</div>
                  <div style={{ fontSize:'12px', color:'#899297', marginTop:'2px' }}>Powered by Groq · llama-3.3-70b</div>
                </div>
              </div>

              <button
                onClick={handleDetectIncidents}
                disabled={scanLoading}
                className={!scanLoading && incidents === null ? 'scan-btn-idle' : ''}
                style={{
                  display:'flex', alignItems:'center', gap:'8px',
                  background: scanLoading ? 'rgba(137,207,240,0.05)' : 'rgba(137,207,240,0.1)',
                  border:'1px solid rgba(137,207,240,0.25)',
                  borderRadius:'10px', padding:'10px 18px',
                  color: scanLoading ? '#899297' : '#89CFF0',
                  fontSize:'13px', fontWeight:700,
                  cursor: scanLoading ? 'not-allowed' : 'pointer',
                  fontFamily:"'Hanken Grotesk', sans-serif",
                  transition:'all 0.2s',
                }}
                onMouseEnter={e => { if (!scanLoading) e.currentTarget.style.background = 'rgba(137,207,240,0.15)'; }}
                onMouseLeave={e => { if (!scanLoading) e.currentTarget.style.background = 'rgba(137,207,240,0.1)'; }}
              >
                <span className={`material-symbols-outlined ${scanLoading ? 'scan-spin' : ''}`} style={{ fontSize:'18px' }}>
                  {scanLoading ? 'autorenew' : incidents !== null ? 'refresh' : 'play_arrow'}
                </span>
                {scanLoading ? 'Scanning...' : incidents !== null ? 'Re-scan' : 'Run Scan'}
              </button>
            </div>

            {/* Idle state */}
            {incidents === null && !scanLoading && (
              <div style={{ padding:'48px 24px', textAlign:'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'40px', color:'#2a3a40', display:'block', marginBottom:'12px' }}>radar</span>
                <p style={{ margin:0, fontSize:'14px', color:'#899297' }}>Run a scan to detect potential incidents across open tickets.</p>
              </div>
            )}

            {/* Loading state */}
            {scanLoading && (
              <div style={{ padding:'48px 24px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
                <div className="spinner" />
                <p style={{ margin:0, fontSize:'14px', color:'#899297' }}>Analyzing open tickets for incidents...</p>
              </div>
            )}

            {/* Results */}
            {incidents !== null && !scanLoading && (
              <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'16px' }}>

                {incidentSummary && (
                  <div className="summary-bar" style={{ padding:'12px 16px', borderRadius:'10px', background:'rgba(137,207,240,0.05)', border:'1px solid rgba(137,207,240,0.1)', fontSize:'13px', color:'#89CFF0', display:'flex', alignItems:'flex-start', gap:'8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'18px', flexShrink:0, marginTop:'1px' }}>analytics</span>
                    {incidentSummary}
                  </div>
                )}

                {incidents.length === 0 && (
                  <div style={{ padding:'32px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', animation:'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
                    <span className="material-symbols-outlined" style={{ fontSize:'40px', color:'#10b981' }}>check_circle</span>
                    <p style={{ margin:0, fontSize:'14px', fontWeight:600, color:'#10b981' }}>All Clear</p>
                    <p style={{ margin:0, fontSize:'13px', color:'#899297' }}>No incidents detected across open tickets.</p>
                  </div>
                )}

                {incidents.length > 0 && incidents.map((incident, i) => {
                  const cfg = severityConfig[incident.severity] || severityConfig.medium;
                  return (
                    <div
                      key={i}
                      className="incident-card"
                      style={{
                        padding:'20px', borderRadius:'12px',
                        background: cfg.bg, border:`1px solid ${cfg.border}`,
                        animationDelay:`${i * 0.12}s`,
                      }}
                    >
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'12px', marginBottom:'12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <span className="material-symbols-outlined" style={{ color:cfg.color, fontSize:'22px' }}>{cfg.icon}</span>
                          <span style={{ fontSize:'14px', fontWeight:700, color:cfg.color }}>{incident.title}</span>
                        </div>
                        <span style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', padding:'3px 10px', borderRadius:'6px', background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, flexShrink:0 }}>
                          {incident.severity}
                        </span>
                      </div>
                      <p style={{ margin:'0 0 12px', fontSize:'13px', color:'#bfc8cd', lineHeight:1.6 }}>{incident.description}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap', marginBottom:'12px' }}>
                        <span style={{ fontSize:'11px', color:'#899297', fontWeight:600 }}>Affected tickets:</span>
                        {incident.affectedTickets.map(id => (
                          <span key={id} style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'5px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e2e2' }}>#{id}</span>
                        ))}
                      </div>
                      <div style={{ padding:'10px 14px', borderRadius:'8px', background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', color:'#899297', marginBottom:'4px' }}>Recommended Action</div>
                        <div style={{ fontSize:'13px', color:'#bfc8cd', lineHeight:1.5 }}>{incident.recommendedAction}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── User Directory Table ── */}
          <div
            className={`admin-section ${mounted ? 'visible' : ''}`}
            style={{ animationDelay:'0.55s', ...glass, overflow:'hidden' }}
          >
            {/* Search Bar */}
            <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'16px' }}>
              <div style={{ position:'relative', flex:1, maxWidth:'400px' }}>
                <span className="material-symbols-outlined" style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'#899297', fontSize:'20px' }}>search</span>
                <input
                  type="text"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width:'100%', padding:'10px 14px 10px 40px', borderRadius:'10px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e2e2', fontSize:'14px', outline:'none', fontFamily:"'Hanken Grotesk', sans-serif", boxSizing:'border-box', transition:'all 0.3s' }}
                  onFocus={e => { e.target.style.borderColor='#89CFF0'; e.target.style.boxShadow='0 0 15px rgba(137,207,240,0.15)'; }}
                  onBlur={e  => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.boxShadow='none'; }}
                />
              </div>
              <span style={{ fontSize:'13px', color:'#899297' }}>{filteredUsers.length} of {users.length} users</span>
            </div>

            {/* Table */}
            {loading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px', gap:'16px', color:'#899297' }}>
                <div className="spinner" />
                <p style={{ margin:0, fontSize:'14px' }}>Loading users...</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'rgba(137,207,240,0.03)' }}>
                      {['Username','Email','Role','Joined','Actions'].map((h, i) => (
                        <th key={h} style={{ padding:'14px 24px', textAlign: i===4 ? 'right' : 'left', fontSize:'11px', fontWeight:700, color:'#89CFF0', textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign:'center', padding:'60px', color:'#899297', fontSize:'14px' }}>No users found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const isSelf = user.id === currentUser.id;
                        return (
                          <tr
                            key={user.id}
                            className="admin-row"
                            style={{
                              borderBottom:'1px solid rgba(255,255,255,0.04)',
                              transition:'background 0.15s',
                              animationDelay:`${0.05 + idx * 0.04}s`,
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding:'16px 24px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                                <div style={{ width:'36px', height:'36px', borderRadius:'10px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, background: isSelf ? 'rgba(137,207,240,0.15)' : 'rgba(255,255,255,0.05)', border: isSelf ? '1px solid rgba(137,207,240,0.3)' : '1px solid rgba(255,255,255,0.08)', color: isSelf ? '#89CFF0' : '#bfc8cd' }}>
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>{user.username}</div>
                                  {isSelf && (
                                    <span style={{ fontSize:'9px', fontWeight:700, textTransform:'uppercase', background:'rgba(137,207,240,0.1)', color:'#89CFF0', border:'1px solid rgba(137,207,240,0.2)', borderRadius:'4px', padding:'1px 6px' }}>You</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding:'16px 24px', fontSize:'13px', color:'#899297' }}>{user.email}</td>
                            <td style={{ padding:'16px 24px' }}>
                              <span style={{ fontSize:'10px', fontWeight:700, padding:'3px 10px', borderRadius:'6px', textTransform:'uppercase', letterSpacing:'0.05em', background: user.role==='admin' ? 'rgba(137,207,240,0.1)' : 'rgba(255,255,255,0.05)', border:`1px solid ${user.role==='admin' ? 'rgba(137,207,240,0.2)' : 'rgba(255,255,255,0.1)'}`, color: user.role==='admin' ? '#89CFF0' : '#899297' }}>
                                {user.role === 'admin' ? 'Admin' : 'Employee'}
                              </span>
                            </td>
                            <td style={{ padding:'16px 24px', fontSize:'13px', color:'#899297' }}>{formatDate(user.created_at)}</td>
                            <td style={{ padding:'16px 24px', textAlign:'right' }}>
                              {isSelf ? (
                                <span style={{ color:'#899297', fontSize:'13px' }}>—</span>
                              ) : (
                                <div style={{ display:'flex', justifyContent:'flex-end', gap:'8px' }}>
                                  <button
                                    onClick={() => handleRoleChange(user)}
                                    style={{ background:'#89CFF0', color:'#003546', border:'none', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:"'Hanken Grotesk', sans-serif", transition:'box-shadow 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 16px rgba(137,207,240,0.4)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                                  >
                                    {user.role === 'admin' ? 'Make Employee' : 'Make Admin'}
                                  </button>
                                  <button
                                    onClick={() => handleDelete(user)}
                                    style={{ background:'transparent', color:'#ffb4ab', border:'1px solid rgba(255,180,171,0.3)', borderRadius:'8px', padding:'7px 14px', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:"'Hanken Grotesk', sans-serif", transition:'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,180,171,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && (
              <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)', fontSize:'13px', color:'#899297' }}>
                Showing {filteredUsers.length} of {users.length} users
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

export default AdminPage;