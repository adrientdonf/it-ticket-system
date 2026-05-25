import React, { useMemo } from 'react';

function AnalyticsPage({ currentUser, tickets, onBack }) {

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

    // Tickets per day (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date:  d.toDateString(),
        count: 0,
      };
    });
    tickets.forEach(t => {
      const ticketDate = new Date(t.created_at).toDateString();
      const day = days.find(d => d.date === ticketDate);
      if (day) day.count++;
    });
    const maxDay = Math.max(...days.map(d => d.count), 1);

    // Top creators
    const creatorMap = {};
    tickets.forEach(t => {
      creatorMap[t.created_by] = (creatorMap[t.created_by] || 0) + 1;
    });
    const topCreators = Object.entries(creatorMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const maxCreator = Math.max(...topCreators.map(c => c[1]), 1);

    // Resolution rate
    const resolutionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    return { total, open, inProgress, closed, high, medium, low, days, maxDay, topCreators, maxCreator, resolutionRate };
  }, [tickets]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#000000',
      fontFamily: "'Hanken Grotesk', sans-serif",
      padding: '40px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* ── Page Header ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#899297', fontSize: '13px', fontWeight: 600,
                fontFamily: "'Hanken Grotesk', sans-serif",
                marginBottom: '12px', padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#89CFF0'}
              onMouseLeave={e => e.currentTarget.style.color = '#899297'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Back to Dashboard
            </button>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#e2e2e2', letterSpacing: '-0.02em' }}>
              Analytics
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#899297' }}>
              Real-time insights across all support tickets.
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,180,171,0.08)',
            border: '1px solid rgba(255,180,171,0.2)',
            borderRadius: '999px', padding: '8px 16px',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#ffb4ab' }}>shield</span>
            <span style={{ color: '#ffb4ab', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Admin Only
            </span>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total Tickets',  value: stats.total,       icon: 'confirmation_number', color: '#89CFF0' },
            { label: 'Open',           value: stats.open,        icon: 'radio_button_checked', color: '#60a5fa' },
            { label: 'In Progress',    value: stats.inProgress,  icon: 'pending',              color: '#c084fc' },
            { label: 'Closed',         value: stats.closed,      icon: 'check_circle',         color: '#10b981' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ ...glass, padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span className="material-symbols-outlined" style={{ color, fontSize: '22px' }}>{icon}</span>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '11px', color: '#899297', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '4px' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Row 2: Activity Chart + Priority Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>

          {/* Activity Chart — last 7 days */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#89CFF0', fontSize: '20px' }}>bar_chart</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e2e2' }}>Ticket Activity</div>
                <div style={{ fontSize: '12px', color: '#899297' }}>Tickets created — last 7 days</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
              {stats.days.map((day, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: day.count > 0 ? '#89CFF0' : 'transparent' }}>
                    {day.count}
                  </span>
                  <div style={{
                    width: '100%', borderRadius: '6px 6px 0 0',
                    height: `${Math.max((day.count / stats.maxDay) * 100, 4)}%`,
                    background: day.count > 0
                      ? 'linear-gradient(180deg, rgba(137,207,240,0.9), rgba(137,207,240,0.3))'
                      : 'rgba(255,255,255,0.05)',
                    transition: 'height 0.3s ease',
                  }} />
                  <span style={{ fontSize: '11px', color: '#899297', fontWeight: 600 }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Breakdown */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }}>flag</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e2e2' }}>By Priority</div>
                <div style={{ fontSize: '12px', color: '#899297' }}>Ticket distribution</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'High',   value: stats.high,   color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
                { label: 'Medium', value: stats.medium, color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
                { label: 'Low',    value: stats.low,    color: '#4ade80', bg: 'rgba(74,222,128,0.15)'  },
              ].map(({ label, value, color, bg }) => (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#bfc8cd' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>{value}</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: '999px',
                      width: `${stats.total > 0 ? (value / stats.total) * 100 : 0}%`,
                      background: bg,
                      border: `1px solid ${color}40`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Resolution rate */}
            <div style={{
              marginTop: '24px', paddingTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
            }}>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
                {stats.resolutionRate}%
              </div>
              <div style={{ fontSize: '11px', color: '#899297', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Resolution Rate
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 3: Top Creators + Status Summary ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

          {/* Top Creators */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#c084fc', fontSize: '20px' }}>leaderboard</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e2e2' }}>Top Submitters</div>
                <div style={{ fontSize: '12px', color: '#899297' }}>Most tickets created</div>
              </div>
            </div>
            {stats.topCreators.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#899297', fontSize: '13px', padding: '24px 0' }}>No data yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {stats.topCreators.map(([name, count], i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      width: '22px', fontSize: '12px', fontWeight: 700, flexShrink: 0, textAlign: 'center',
                      color: i === 0 ? '#fbbf24' : i === 1 ? '#899297' : i === 2 ? '#cd7c3a' : '#555e63',
                    }}>
                      #{i + 1}
                    </span>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: 700, color: '#bfc8cd',
                    }}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e2e2', marginBottom: '4px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                      </div>
                      <div style={{ height: '5px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '999px',
                          width: `${(count / stats.maxCreator) * 100}%`,
                          background: 'linear-gradient(90deg, rgba(192,132,252,0.8), rgba(192,132,252,0.3))',
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#c084fc', flexShrink: 0 }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status Summary */}
          <div style={{ ...glass, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ color: '#60a5fa', fontSize: '20px' }}>donut_large</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e2e2' }}>Status Overview</div>
                <div style={{ fontSize: '12px', color: '#899297' }}>Current ticket states</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Open',        value: stats.open,       color: '#60a5fa', icon: 'radio_button_checked' },
                { label: 'In Progress', value: stats.inProgress, color: '#c084fc', icon: 'pending'              },
                { label: 'Closed',      value: stats.closed,     color: '#10b981', icon: 'check_circle'         },
              ].map(({ label, value, color, icon }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color }}>{icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#bfc8cd' }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '80px', height: '6px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: '999px',
                        width: `${stats.total > 0 ? (value / stats.total) * 100 : 0}%`,
                        background: color,
                        opacity: 0.7,
                      }} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 700, color, minWidth: '28px', textAlign: 'right' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div style={{
              marginTop: '16px', paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '13px', color: '#899297', fontWeight: 600 }}>Total Tickets</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#89CFF0' }}>{stats.total}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AnalyticsPage;