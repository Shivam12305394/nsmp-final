import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatCard, Badge, Spinner, EmptyState } from '../../components/ui';
import { applicationAPI, scholarshipAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  return (
    <AppLayout title={`Welcome back, ${firstName}! 👋`} subtitle="Here's your scholarship overview">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      ) : (
        <>
          {/* Profile completion nudge */}
          {completion < 80 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <span style={{ fontSize: 22 }}>⚠️</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--primary-h)' }}>Profile {completion}% complete</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2 }}>Complete your profile to unlock accurate AI scholarship matches.</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/profile')}>Complete Profile →</button>
            </div>
          )}

          {/* Stats */}
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <StatCard icon="📋" value={apps.length} label="Total Applications" bg="rgba(99,102,241,0.12)" />
            <StatCard icon="⏳" value={pending} label="Pending Review" bg="rgba(245,158,11,0.12)" />
            <StatCard icon="✅" value={approved} label="Approved" bg="rgba(16,185,129,0.12)" />
            <StatCard icon="🎯" value={matches.length} label="AI Matches" bg="rgba(56,189,248,0.12)" />
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
                          <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>₹{a.scholarship?.amount?.toLocaleString('en-IN')}</td>
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
              <div className="card-header">
                <span className="card-title">✦ Top AI Matches</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>See All →</button>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {matches.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                    No perfect matches yet — complete your profile
                  </div>
                ) : (
                  matches.slice(0, 4).map((m) => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700 }}>₹{m.amount?.toLocaleString('en-IN')}</div>
                      </div>
                      <div style={{ flexShrink: 0, background: m.matchScore >= 80 ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)', borderRadius: 8, padding: '4px 8px', fontSize: 12, fontWeight: 800, color: m.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)' }}>
                        {m.matchScore}%
                      </div>
                    </div>
                  ))
                )}
                <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }} onClick={() => navigate('/scholarships')}>
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
