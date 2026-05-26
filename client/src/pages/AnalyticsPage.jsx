import React, { useMemo, useState, useEffect } from 'react';

// ── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target, duration = 1000, started = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!started) return;
    if (target === 0) { setValue(0); return; }
    let startTs = null;
    const step = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, started, duration]);
  return value;
}

// ── Animated stat card ───────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delay, started, glass }) {
  const count = useCountUp(value, 950, started);
  return (
    <div
      className="an-stat-card"
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

// ── Animated progress bar ────────────────────────────────────────────────────
function ProgressBar({ pct, color, bg, delay, started, height = '8px' }) {
  const [width, setWidth] = useState('0%');
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setWidth(`${pct}%`), parseFloat(delay) * 1000 + 100);
    return () => clearTimeout(t);
  }, [started, pct, delay]);
  return (
    <div style={{ height, borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: '999px',
        width,
        background: bg || color,
        border: color ? `1px solid ${color}40` : undefined,
        transition: 'width 0.9s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  );
}

function AnalyticsPage({ currentUser, tickets, onBack }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const glass = {
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '16px',
  };

  // ── Computed Stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total       = tickets.length;
    const open        = tickets.filter(t => t.status === 'open').length;
    const inProgress  = tickets.filter(t => t.status === 'in_progress').length;
    const closed      = tickets.filter(t => t.status === 'closed').length;
    const high        = tickets.filter(t => t.priority === 'high').length;
    const medium      = tickets.filter(t => t.priority === 'medium').length;
    const low         = tickets.filter(t => t.priority === 'low').length;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), date: d.toDateString(), count: 0 };
    });
    tickets.forEach(t => {
      const ticketDate = new Date(t.created_at).toDateString();
      const day = days.find(d => d.date === ticketDate);
      if (day) day.count++;
    });
    const maxDay = Math.max(...days.map(d => d.count), 1);

    const creatorMap = {};
    tickets.forEach(t => { creatorMap[t.created_by] = (creatorMap[t.created_by] || 0) + 1; });
    const topCreators = Object.entries(creatorMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCreator  = Math.max(...topCreators.map(c => c[1]), 1);

    const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, open, inProgress, closed, high, medium, low, days, maxDay, topCreators, maxCreator, resolutionRate };
  }, [tickets]);

  // Bar chart heights animate up from 0
  const [barHeights, setBarHeights] = useState(stats.days.map(() => '4%'));
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      setBarHeights(stats.days.map(d => `${Math.max((d.count / stats.maxDay) * 100, 4)}%`));
    }, 500);
    return () => clearTimeout(t);
  }, [mounted, stats.days, stats.maxDay]);

  // Resolution rate count-up
  const resCount = useCountUp(stats.resolutionRate, 1200, mounted);

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ── Ambient orbs ── */
        @keyframes orbA {
          0%,100% { transform: translate(0,0) scale(1);         opacity: 0.16; }
          33%      { transform: translate(50px,-35px) scale(1.08); opacity: 0.26; }
          66%      { transform: translate(-25px,-55px) scale(0.94); opacity: 0.14; }
        }
        @keyframes orbB {
          0%,100% { transform: translate(0,0) scale(1);        opacity: 0.12; }
          40%      { transform: translate(-40px,28px) scale(1.1); opacity: 0.22; }
          80%      { transform: translate(18px,48px) scale(0.9);  opacity: 0.10; }
        }
        @keyframes orbC {
          0%,100% { transform: translate(0,0) scale(1);         opacity: 0.10; }
          50%      { transform: translate(30px,35px) scale(1.12); opacity: 0.20; }
        }

        /* ── Scanline ── */
        @keyframes scanline {
          0%   { top: -2%; opacity: 0; }
          4%   { opacity: 0.30; }
          96%  { opacity: 0.18; }
          100% { top: 102%; opacity: 0; }
        }

        /* ── Section entrance ── */
        .an-section { opacity: 0; }
        .an-section.visible { animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) forwards; }

        /* ── Stat card hover ── */
        .an-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .an-stat-card:hover { transform: translateY(-2px); box-shadow: 0 0 26px rgba(137,207,240,0.12) !important; }

        /* ── Bar chart grow from bottom ── */
        .chart-bar {
          transition: height 0.85s cubic-bezier(0.22,1,0.36,1);
        }
        /* stagger each bar */
        .chart-bar:nth-child(1) { transition-delay: 0.50s; }
        .chart-bar:nth-child(2) { transition-delay: 0.58s; }
        .chart-bar:nth-child(3) { transition-delay: 0.66s; }
        .chart-bar:nth-child(4) { transition-delay: 0.74s; }
        .chart-bar:nth-child(5) { transition-delay: 0.82s; }
        .chart-bar:nth-child(6) { transition-delay: 0.90s; }
        .chart-bar:nth-child(7) { transition-delay: 0.98s; }

        /* Bar hover glow */
        .chart-bar-inner:hover {
          filter: brightness(1.3);
          box-shadow: 0 0 12px rgba(137,207,240,0.5);
        }

        /* ── Top submitter row stagger ── */
        .an-creator-row {
          opacity: 0;
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Status row stagger ── */
        .an-status-row {
          opacity: 0;
          animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
        }

        /* ── Resolution rate pulse ── */
        @keyframes resGlow {
          0%,100% { text-shadow: 0 0 12px rgba(16,185,129,0.3); }
          50%      { text-shadow: 0 0 28px rgba(16,185,129,0.6), 0 0 50px rgba(16,185,129,0.2); }
        }
        .resolution-rate {
          animation: resGlow 3s ease-in-out infinite;
        }

        /* ── Card glow on hover ── */
        .an-card {
          transition: box-shadow 0.3s, transform 0.2s;
        }
        .an-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(137,207,240,0.08);
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#000000',
        fontFamily: "'Hanken Grotesk', sans-serif",
        padding: '40px', position: 'relative', overflow: 'hidden',
      }}>

        {/* ── Ambient orbs ── */}
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'6%',  left:'4%',  width:480, height:480, borderRadius:'50%', background:'radial-gradient(circle, rgba(137,207,240,0.07) 0%, transparent 70%)', filter:'blur(55px)', animation:'orbA 18s ease-in-out infinite' }} />
          <div style={{ position:'absolute', bottom:'8%', right:'3%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(192,132,252,0.06) 0%, transparent 70%)', filter:'blur(50px)', animation:'orbB 22s ease-in-out infinite' }} />
          <div style={{ position:'absolute', top:'40%', left:'42%', width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', filter:'blur(44px)', animation:'orbC 14s ease-in-out infinite' }} />
        </div>

        {/* ── Scanline ── */}
        <div style={{ position:'fixed', left:0, right:0, height:'2px', background:'linear-gradient(90deg, transparent, rgba(137,207,240,0.35), transparent)', animation:'scanline 11s linear infinite', zIndex:1, pointerEvents:'none' }} />

        <div style={{ maxWidth:'1200px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'24px', position:'relative', zIndex:2 }}>

          {/* ── Page Header ── */}
          <div
            className={`an-section ${mounted ? 'visible' : ''}`}
            style={{ animationDelay:'0.05s', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}
          >
            <div>
              <button
                onClick={onBack}
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', color:'#899297', fontSize:'13px', fontWeight:600, fontFamily:"'Hanken Grotesk', sans-serif", marginBottom:'12px', padding:0, transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
                onMouseLeave={e => e.currentTarget.style.color = '#899297'}
              >
                <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>arrow_back</span>
                Back to Dashboard
              </button>
              <h1 style={{ margin:0, fontSize:'32px', fontWeight:700, color:'#e2e2e2', letterSpacing:'-0.02em' }}>Analytics</h1>
              <p style={{ margin:'4px 0 0', fontSize:'14px', color:'#899297' }}>Real-time insights across all support tickets.</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(255,180,171,0.08)', border:'1px solid rgba(255,180,171,0.2)', borderRadius:'999px', padding:'8px 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'16px', color:'#ffb4ab' }}>shield</span>
              <span style={{ color:'#ffb4ab', fontSize:'12px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>Admin Only</span>
            </div>
          </div>

          {/* ── Stat Cards ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'16px' }}>
            {[
              { label:'Total Tickets', value:stats.total,      icon:'confirmation_number',  color:'#89CFF0', delay:'0.12s' },
              { label:'Open',          value:stats.open,       icon:'radio_button_checked', color:'#60a5fa', delay:'0.22s' },
              { label:'In Progress',   value:stats.inProgress, icon:'pending',               color:'#c084fc', delay:'0.32s' },
              { label:'Closed',        value:stats.closed,     icon:'check_circle',          color:'#10b981', delay:'0.42s' },
            ].map(p => <StatCard key={p.label} {...p} started={mounted} glass={glass} />)}
          </div>

          {/* ── Row 2: Activity Chart + Priority Breakdown ── */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px' }}>

            {/* Activity Chart */}
            <div
              className={`an-section an-card ${mounted ? 'visible' : ''}`}
              style={{ animationDelay:'0.50s', ...glass, padding:'24px' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{ color:'#89CFF0', fontSize:'20px' }}>bar_chart</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>Ticket Activity</div>
                  <div style={{ fontSize:'12px', color:'#899297' }}>Tickets created — last 7 days</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', height:'140px' }}>
                {stats.days.map((day, i) => (
                  <div
                    key={i}
                    className="chart-bar"
                    style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'8px', height:'100%', justifyContent:'flex-end' }}
                  >
                    <span style={{ fontSize:'11px', fontWeight:700, color: day.count > 0 ? '#89CFF0' : 'transparent', transition:'opacity 0.3s', opacity: barHeights[i] !== '4%' && day.count > 0 ? 1 : 0 }}>
                      {day.count}
                    </span>
                    <div
                      className="chart-bar-inner"
                      style={{
                        width:'100%', borderRadius:'6px 6px 0 0',
                        height: barHeights[i],
                        background: day.count > 0
                          ? 'linear-gradient(180deg, rgba(137,207,240,0.9), rgba(137,207,240,0.25))'
                          : 'rgba(255,255,255,0.05)',
                        transition: `height 0.85s cubic-bezier(0.22,1,0.36,1) ${0.50 + i * 0.08}s`,
                        cursor: day.count > 0 ? 'default' : undefined,
                        boxShadow: day.count > 0 ? '0 0 8px rgba(137,207,240,0.20)' : 'none',
                      }}
                    />
                    <span style={{ fontSize:'11px', color:'#899297', fontWeight:600 }}>{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Breakdown */}
            <div
              className={`an-section an-card ${mounted ? 'visible' : ''}`}
              style={{ animationDelay:'0.60s', ...glass, padding:'24px' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{ color:'#fbbf24', fontSize:'20px' }}>flag</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>By Priority</div>
                  <div style={{ fontSize:'12px', color:'#899297' }}>Ticket distribution</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                {[
                  { label:'High',   value:stats.high,   color:'#f87171', bg:'rgba(248,113,113,0.15)', delay:'0.65s' },
                  { label:'Medium', value:stats.medium, color:'#fbbf24', bg:'rgba(251,191,36,0.15)',  delay:'0.75s' },
                  { label:'Low',    value:stats.low,    color:'#4ade80', bg:'rgba(74,222,128,0.15)',  delay:'0.85s' },
                ].map(({ label, value, color, bg, delay }) => (
                  <div key={label}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#bfc8cd' }}>{label}</span>
                      <span style={{ fontSize:'13px', fontWeight:700, color }}>{value}</span>
                    </div>
                    <ProgressBar
                      pct={stats.total > 0 ? (value / stats.total) * 100 : 0}
                      color={color} bg={bg} delay={delay} started={mounted}
                    />
                  </div>
                ))}
              </div>

              {/* Resolution rate */}
              <div style={{ marginTop:'24px', paddingTop:'20px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
                <div
                  className="resolution-rate"
                  style={{ fontSize:'36px', fontWeight:700, color:'#10b981', lineHeight:1, fontVariantNumeric:'tabular-nums' }}
                >
                  {resCount}%
                </div>
                <div style={{ fontSize:'11px', color:'#899297', textTransform:'uppercase', letterSpacing:'0.07em' }}>Resolution Rate</div>
              </div>
            </div>
          </div>

          {/* ── Row 3: Top Creators + Status Summary ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

            {/* Top Submitters */}
            <div
              className={`an-section an-card ${mounted ? 'visible' : ''}`}
              style={{ animationDelay:'0.68s', ...glass, padding:'24px' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{ color:'#c084fc', fontSize:'20px' }}>leaderboard</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>Top Submitters</div>
                  <div style={{ fontSize:'12px', color:'#899297' }}>Most tickets created</div>
                </div>
              </div>
              {stats.topCreators.length === 0 ? (
                <div style={{ textAlign:'center', color:'#899297', fontSize:'13px', padding:'24px 0' }}>No data yet</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  {stats.topCreators.map(([name, count], i) => (
                    <div
                      key={name}
                      className="an-creator-row"
                      style={{
                        display:'flex', alignItems:'center', gap:'12px',
                        animationDelay: mounted ? `${0.72 + i * 0.08}s` : '0s',
                      }}
                    >
                      <span style={{ width:'22px', fontSize:'12px', fontWeight:700, flexShrink:0, textAlign:'center', color: i===0 ? '#fbbf24' : i===1 ? '#899297' : i===2 ? '#cd7c3a' : '#555e63' }}>
                        #{i + 1}
                      </span>
                      <div style={{ width:'32px', height:'32px', borderRadius:'8px', flexShrink:0, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:700, color:'#bfc8cd' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'13px', fontWeight:700, color:'#e2e2e2', marginBottom:'4px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
                        <ProgressBar
                          pct={(count / stats.maxCreator) * 100}
                          bg="linear-gradient(90deg, rgba(192,132,252,0.8), rgba(192,132,252,0.3))"
                          delay={`${0.72 + i * 0.08}`} started={mounted} height="5px"
                        />
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:700, color:'#c084fc', flexShrink:0 }}>{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Overview */}
            <div
              className={`an-section an-card ${mounted ? 'visible' : ''}`}
              style={{ animationDelay:'0.75s', ...glass, padding:'24px' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'24px' }}>
                <span className="material-symbols-outlined" style={{ color:'#60a5fa', fontSize:'20px' }}>donut_large</span>
                <div>
                  <div style={{ fontSize:'14px', fontWeight:700, color:'#e2e2e2' }}>Status Overview</div>
                  <div style={{ fontSize:'12px', color:'#899297' }}>Current ticket states</div>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {[
                  { label:'Open',        value:stats.open,       color:'#60a5fa', icon:'radio_button_checked', delay:'0.80s' },
                  { label:'In Progress', value:stats.inProgress, color:'#c084fc', icon:'pending',               delay:'0.90s' },
                  { label:'Closed',      value:stats.closed,     color:'#10b981', icon:'check_circle',          delay:'1.00s' },
                ].map(({ label, value, color, icon, delay }, i) => (
                  <div
                    key={label}
                    className="an-status-row"
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 16px', borderRadius:'10px',
                      background:'rgba(255,255,255,0.02)',
                      border:'1px solid rgba(255,255,255,0.05)',
                      animationDelay: mounted ? delay : '0s',
                      transition:'background 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow=`0 0 16px ${color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.boxShadow='none'; }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize:'18px', color }}>{icon}</span>
                      <span style={{ fontSize:'13px', fontWeight:600, color:'#bfc8cd' }}>{label}</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                      <div style={{ width:'80px', height:'6px', borderRadius:'999px', background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                        <ProgressBar
                          pct={stats.total > 0 ? (value / stats.total) * 100 : 0}
                          bg={color} delay={delay} started={mounted} height="6px"
                        />
                      </div>
                      <span style={{ fontSize:'20px', fontWeight:700, color, minWidth:'28px', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'13px', color:'#899297', fontWeight:600 }}>Total Tickets</span>
                <span style={{ fontSize:'22px', fontWeight:700, color:'#89CFF0', fontVariantNumeric:'tabular-nums' }}>{stats.total}</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

export default AnalyticsPage;