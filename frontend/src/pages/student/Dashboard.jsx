import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatCard, Badge, Spinner, EmptyState } from '../../components/ui';
import { applicationAPI, scholarshipAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function WelcomeBanner({ firstName, completion, navigate }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, rgba(14,165,233,0.08) 50%, rgba(139,92,246,0.06) 100%)',
      border: '1px solid rgba(245,166,35,0.2)',
      borderRadius: 20, padding: '28px 32px', marginBottom: 24,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--primary), var(--teal), transparent)' }} />
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(245,166,35,0.08), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{greeting} ☀️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text1)', letterSpacing: -0.5, marginBottom: 6 }}>Welcome back, {firstName}!</h2>
        <p style={{ fontSize: 13.5, color: 'var(--text2)' }}>Your scholarship journey continues. {completion < 80 ? `Complete your profile to unlock better AI matches.` : `Your profile is strong — great matches await!`}</p>
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {completion < 80 && (
          <button className="btn btn-primary" onClick={() => navigate('/profile')} style={{ whiteSpace: 'nowrap' }}>
            Complete Profile <span style={{ opacity: 0.8, fontSize: 11, marginLeft: 2 }}>{completion}%</span>
          </button>
        )}
        <button className="btn btn-ghost" onClick={() => navigate('/matches')} style={{ whiteSpace: 'nowrap' }}>View Matches →</button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authAPI.me().then((r) => updateUser(r.data)).catch(() => {});
    Promise.all([
      applicationAPI.getMy().then((r) => setApps(r.data)).catch(() => {}),
      scholarshipAPI.getMatches().then((r) => setMatches(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const profile = user?.profile || {};
  const profileFields = ['marks', 'category', 'course', 'gender', 'annualIncome', 'state', 'institution'];
  const filled = profileFields.filter((f) => profile[f] && profile[f] !== 0 && profile[f] !== '').length;
  const completion = Math.round((filled / profileFields.length) * 100);

  const pending = apps.filter((a) => a.status === 'pending').length;
  const approved = apps.filter((a) => a.status === 'approved').length;
  const firstName = user?.name?.split(' ')[0] || 'Student';

  const statItems = [
    { icon: '📋', value: apps.length, label: 'Total Applications', bg: 'rgba(99,102,241,0.12)', color: 'var(--violet)' },
    { icon: '⏳', value: pending, label: 'Pending Review', bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)' },
    { icon: '✅', value: approved, label: 'Approved', bg: 'rgba(16,185,129,0.12)', color: 'var(--emerald)' },
    { icon: '🎯', value: matches.length, label: 'AI Matches', bg: 'rgba(14,165,233,0.12)', color: 'var(--teal)' },
  ];

  return (
    <AppLayout title={`Dashboard`} subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
          <Spinner size={36} />
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>Loading your dashboard...</span>
        </div>
      ) : (
        <>
          <WelcomeBanner firstName={firstName} completion={completion} navigate={navigate} />

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {statItems.map((s) => (
              <div key={s.label} className="stat-card" style={{ cursor: 'default' }}>
                <div className="stat-icon" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>{s.icon}</div>
                <div className="stat-value" style={{ color: s.value > 0 ? s.color : 'var(--text1)' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
            {/* Recent Applications */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📋 Recent Applications</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/applications')}>View All →</button>
              </div>
              {apps.length === 0 ? (
                <div style={{ padding: '32px 24px' }}>
                  <EmptyState icon="📋" title="No applications yet" sub="Browse scholarships and apply to get started" />
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Scholarship</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apps.slice(0, 5).map((a) => (
                        <tr key={a.id}>
                          <td>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.scholarship?.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.scholarship?.provider}</div>
                          </td>
                          <td>
                            <span style={{ color: 'var(--emerald)', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 14 }}>₹{a.scholarship?.amount?.toLocaleString('en-IN')}</span>
                          </td>
                          <td><Badge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top AI Matches */}
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.05), transparent)' }}>
                <span className="card-title">✦ Top AI Matches</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>See All →</button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {matches.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                    Complete your profile to get AI matches
                  </div>
                ) : (
                  matches.slice(0, 4).map((m, i) => (
                    <div key={m.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      background: i === 0 ? 'rgba(245,166,35,0.05)' : 'transparent',
                      border: i === 0 ? '1px solid rgba(245,166,35,0.12)' : '1px solid transparent',
                      transition: 'background 0.2s',
                    }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'var(--text3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>#{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700 }}>₹{m.amount?.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{
                        flexShrink: 0,
                        background: m.matchScore >= 80 ? 'rgba(16,185,129,0.15)' : 'rgba(245,166,35,0.15)',
                        border: `1px solid ${m.matchScore >= 80 ? 'rgba(16,185,129,0.3)' : 'rgba(245,166,35,0.3)'}`,
                        borderRadius: 8, padding: '3px 8px',
                        fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        color: m.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)',
                      }}>
                        {m.matchScore}%
                      </div>
                    </div>
                  ))
                )}
                <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => navigate('/scholarships')}>
                  Browse All Scholarships →
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
