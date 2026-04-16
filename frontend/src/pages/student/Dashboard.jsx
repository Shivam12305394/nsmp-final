import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatCard, MatchRing, Badge, Spinner, AmountChip, EmptyState } from '../../components/ui';
import { scholarshipAPI, applicationAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      scholarshipAPI.getMatches().then((r) => setMatches(r.data)).catch(() => {}),
      applicationAPI.getMy().then((r) => setApps(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const profile = user?.profile || {};
  const fields = ['marks', 'category', 'course', 'gender', 'annualIncome', 'state', 'institution'];
  const filled = fields.filter((f) => profile[f] && profile[f] !== 0 && profile[f] !== '').length;
  const completion = Math.round((filled / fields.length) * 100);

  const approved = apps.filter((a) => a.status === 'approved').length;
  const totalAid = apps.filter((a) => a.status === 'approved').reduce((sum, a) => sum + (a.scholarship?.amount || 0), 0);

  const deadlines = matches
    .filter((m) => new Date(m.deadline) > new Date())
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 6);

  if (loading) return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}`}>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
    </AppLayout>
  );

  return (
    <AppLayout title="Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}>
      {/* Profile completion banner */}
      {completion < 70 && (
        <div className="completion-card" style={{ marginBottom: 24 }}>
          <div className="completion-ring">
            <svg width={64} height={64}>
              <circle className="match-ring-track" cx={32} cy={32} r={26} style={{ stroke: 'rgba(99,102,241,0.2)' }} />
              <circle className="match-ring-fill" cx={32} cy={32} r={26}
                stroke="var(--primary)" strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 - (completion / 100) * 2 * Math.PI * 26}
                transform="rotate(-90 32 32)" fill="none" strokeWidth="4" strokeLinecap="round"
              />
            </svg>
            <div className="completion-ring-label" style={{ color: 'var(--primary-h)' }}>{completion}%</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Complete Your Profile</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>A complete profile gets you <strong style={{ color: 'var(--emerald)' }}>3× more matches</strong> and higher AI accuracy.</div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/profile')}>Complete Profile →</button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="✦" value={matches.length} label="AI Matches Found" bg="rgba(99,102,241,0.12)" change={matches.length > 5 ? 'Great match rate' : undefined} />
        <StatCard icon="📋" value={apps.length} label="Applications Submitted" bg="rgba(56,189,248,0.12)" />
        <StatCard icon="✅" value={approved} label="Approved" bg="rgba(16,185,129,0.12)" />
        <StatCard icon="💰" value={totalAid > 0 ? `₹${(totalAid / 1000).toFixed(0)}K` : '—'} label="Total Aid Approved" bg="rgba(245,158,11,0.12)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Top Matches */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🤖 Top AI Matches</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>View All →</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {matches.length === 0 ? (
              <EmptyState icon="🤖" title="No matches yet" sub="Complete your profile to get AI recommendations" />
            ) : (
              matches.slice(0, 5).map((m, i) => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 22px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,166,35,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => navigate('/scholarships')}
                >
                  <MatchRing score={m.matchScore} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2 }}>{m.provider}</div>
                  </div>
                  <AmountChip amount={m.amount} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Recent Applications</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/applications')}>View All →</button>
          </div>
          <div style={{ padding: '8px 0' }}>
            {apps.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet" sub="Browse and apply to matching scholarships" />
            ) : (
              apps.slice(0, 5).map((a, i) => (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 22px',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--teal-dim), var(--violet-dim))',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.scholarship?.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>{new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                  </div>
                  <Badge status={a.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {deadlines.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">⏰ Upcoming Deadlines</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{deadlines.length} scholarships closing soon</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12, padding: 20 }}>
            {deadlines.map((s) => {
              const days = Math.ceil((new Date(s.deadline) - new Date()) / (1000 * 60 * 60 * 24));
              const urgent = days <= 30;
              return (
                <div key={s.id}
                  style={{
                    background: urgent ? 'rgba(245,158,11,0.05)' : 'var(--bg2)',
                    border: `1px solid ${urgent ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    display: 'flex', gap: 12, alignItems: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onClick={() => navigate('/scholarships')}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
                    background: urgent ? 'rgba(245,158,11,0.12)' : 'var(--bg3)',
                    border: `1px solid ${urgent ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 900, color: urgent ? 'var(--amber)' : 'var(--text1)', lineHeight: 1 }}>{days}</span>
                    <span style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>days</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--emerald)', marginTop: 3, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>₹{s.amount.toLocaleString('en-IN')}/yr</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
