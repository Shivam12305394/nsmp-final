import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Badge, Spinner, EmptyState, MatchRing } from '../../components/ui';
import { applicationAPI, scholarshipAPI, authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function WelcomeBanner({ firstName, completion, navigate, pending, matchesCount, strongestMatch }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <section className="dashboard-hero">
      <div className="dashboard-hero-copy">
        <div className="dashboard-eyebrow">{greeting}</div>
        <h2 className="dashboard-hero-title">Welcome back, {firstName}!</h2>
        <p className="dashboard-hero-sub">
          {completion < 80
            ? 'Complete a few more profile details to unlock more accurate and useful AI recommendations.'
            : 'Your profile looks strong. Use this dashboard to manage best-fit scholarships, applications, and progress in one place.'}
        </p>

        <div className="dashboard-hero-tags">
          <div className="dashboard-hero-tag">
            <span className="dashboard-hero-tag-dot" />
            <span>{matchesCount} AI matches ready</span>
          </div>
          <div className="dashboard-hero-tag">
            <span className="dashboard-hero-tag-dot" />
            <span>{pending} pending reviews</span>
          </div>
          <div className="dashboard-hero-tag">
            <span className="dashboard-hero-tag-dot" />
            <span>{strongestMatch}% strongest fit</span>
          </div>
        </div>

        <div className="dashboard-hero-actions">
          {completion < 80 && (
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              Complete Profile
              <span className="dashboard-btn-stat">{completion}%</span>
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => navigate('/matches')}>View Matches →</button>
          <button className="btn btn-ghost" onClick={() => navigate('/applications')}>Track Applications</button>
        </div>
      </div>

      <div className="dashboard-hero-panel">
        <div className="dashboard-hero-panel-head">
          <span className="dashboard-panel-label">Scholarship Radar</span>
          <span className="dashboard-panel-pill">Live</span>
        </div>

        <div className="dashboard-hero-panel-main">
          <div className="dashboard-hero-ring">
            <MatchRing score={completion} size={86} />
          </div>
          <div>
            <div className="dashboard-panel-value">{completion}%</div>
            <div className="dashboard-panel-title">Profile readiness</div>
            <p className="dashboard-panel-text">
              {completion < 80
                ? 'Add a few more details to make eligibility scoring sharper and more reliable.'
                : 'Excellent. Your recommendations and tracking sections are fully ready to support you.'}
            </p>
          </div>
        </div>

        <div className="dashboard-hero-metrics">
          <div className="dashboard-hero-metric">
            <span className="dashboard-hero-metric-label">Best match</span>
            <span className="dashboard-hero-metric-value">{strongestMatch}%</span>
          </div>
          <div className="dashboard-hero-metric">
            <span className="dashboard-hero-metric-label">Pending</span>
            <span className="dashboard-hero-metric-value">{pending}</span>
          </div>
          <div className="dashboard-hero-metric">
            <span className="dashboard-hero-metric-label">Matches</span>
            <span className="dashboard-hero-metric-value">{matchesCount}</span>
          </div>
        </div>
      </div>
    </section>
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
  const sortedMatches = [...matches].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  const strongestMatch = sortedMatches[0]?.matchScore || 0;
  const recentApps = apps.slice(0, 5);

  const nextActions = [
    completion < 80 ? { title: 'Complete your profile', text: 'Add academic and eligibility details to strengthen the recommendation engine.', cta: 'Open Profile', onClick: () => navigate('/profile') } : null,
    matches.length === 0 ? { title: 'Unlock AI matches', text: 'Update your profile data to generate more relevant scholarship suggestions.', cta: 'View Matches', onClick: () => navigate('/matches') } : null,
    apps.length === 0 ? { title: 'Submit your first application', text: 'Start your dashboard activity by applying to a shortlisted scholarship.', cta: 'Browse Scholarships', onClick: () => navigate('/scholarships') } : null,
  ].filter(Boolean).slice(0, 2);

  const statItems = [
    { icon: '📋', value: apps.length, label: 'Total Applications', bg: 'rgba(99,102,241,0.12)', color: 'var(--violet)', note: 'submitted' },
    { icon: '⏳', value: pending, label: 'Pending Review', bg: 'rgba(245,158,11,0.12)', color: 'var(--amber)', note: 'active' },
    { icon: '✅', value: approved, label: 'Approved', bg: 'rgba(16,185,129,0.12)', color: 'var(--emerald)', note: approved ? 'success' : 'waiting' },
    { icon: '🎯', value: matches.length, label: 'AI Matches', bg: 'rgba(14,165,233,0.12)', color: 'var(--teal)', note: strongestMatch ? `${strongestMatch}% best` : 'ready' },
  ];

  return (
    <AppLayout title="Dashboard" subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
          <Spinner size={36} />
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>Loading your dashboard...</span>
        </div>
      ) : (
        <div className="dashboard-page">
          <WelcomeBanner
            firstName={firstName}
            completion={completion}
            navigate={navigate}
            pending={pending}
            matchesCount={matches.length}
            strongestMatch={strongestMatch}
          />

          <div className="dashboard-kpi-grid">
            {statItems.map((s) => (
              <div key={s.label} className="stat-card dashboard-kpi-card">
                <div className="stat-icon" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>{s.icon}</div>
                <div className="dashboard-kpi-copy">
                  <div className="stat-value" style={{ color: s.value > 0 ? s.color : 'var(--text1)' }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
                <div className="dashboard-kpi-note">{s.note}</div>
              </div>
            ))}
          </div>

          <div className="dashboard-main-grid">
            <div className="dashboard-main-left">
              <section className="dashboard-action-strip">
                <div className="dashboard-action-intro">
                  <div className="dashboard-eyebrow">Next Best Steps</div>
                  <h3 className="dashboard-section-title">Where to focus next</h3>
                  <p className="dashboard-section-sub">These priority cards turn the dashboard into an action center, not just a reporting screen.</p>
                </div>

                <div className="dashboard-action-grid">
                  {nextActions.length === 0 ? (
                    <div className="dashboard-action-card">
                      <div className="dashboard-action-icon">✓</div>
                      <div className="dashboard-action-title">All set for now</div>
                      <div className="dashboard-action-text">Your profile and application pipeline look healthy. Focus on your top matches next.</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>Open Matches</button>
                    </div>
                  ) : (
                    nextActions.map((action) => (
                      <div key={action.title} className="dashboard-action-card">
                        <div className="dashboard-action-icon">✦</div>
                        <div className="dashboard-action-title">{action.title}</div>
                        <div className="dashboard-action-text">{action.text}</div>
                        <button className="btn btn-ghost btn-sm" onClick={action.onClick}>{action.cta}</button>
                      </div>
                    ))
                  )}
                </div>
              </section>

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
                        {recentApps.map((a) => (
                          <tr key={a.id}>
                            <td>
                              <div className="dashboard-table-title">{a.scholarship?.name}</div>
                              <div className="dashboard-table-sub">{a.scholarship?.provider}</div>
                            </td>
                            <td>
                              <span className="dashboard-amount">₹{a.scholarship?.amount?.toLocaleString('en-IN')}</span>
                            </td>
                            <td><Badge status={a.status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <aside className="dashboard-main-right">
              <div className="card dashboard-side-card">
                <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.08), transparent)' }}>
                  <span className="card-title">✦ Top AI Matches</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate('/matches')}>See All →</button>
                </div>
                <div className="card-body dashboard-match-list">
                  {matches.length === 0 ? (
                    <div className="dashboard-empty-copy">Complete your profile to get AI matches</div>
                  ) : (
                    sortedMatches.slice(0, 4).map((m, i) => (
                      <div key={m.id} className={`dashboard-match-item${i === 0 ? ' dashboard-match-item-highlight' : ''}`}>
                        <div className="dashboard-match-rank">#{i + 1}</div>
                        <div className="dashboard-match-copy">
                          <div className="dashboard-match-name">{m.name}</div>
                          <div className="dashboard-match-amount">₹{m.amount?.toLocaleString('en-IN')}</div>
                        </div>
                        <div className={`dashboard-match-score${m.matchScore >= 80 ? ' is-strong' : ''}`}>{m.matchScore}%</div>
                      </div>
                    ))
                  )}
                  <button className="btn btn-primary btn-sm dashboard-side-btn" onClick={() => navigate('/scholarships')}>
                    Browse All Scholarships →
                  </button>
                </div>
              </div>

              <div className="card dashboard-side-card">
                <div className="card-header">
                  <span className="card-title">⚡ Smart Snapshot</span>
                </div>
                <div className="card-body dashboard-snapshot">
                  <div className="dashboard-snapshot-row">
                    <span className="dashboard-snapshot-label">Profile readiness</span>
                    <span className="dashboard-snapshot-value">{completion}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completion}%`, background: 'linear-gradient(90deg, var(--primary), var(--teal))' }} />
                  </div>
                  <div className="dashboard-snapshot-list">
                    <div className="dashboard-snapshot-item">
                      <span className="dashboard-snapshot-bullet" />
                      <span>{pending ? `${pending} applications are currently under review` : 'There are no pending applications right now'}</span>
                    </div>
                    <div className="dashboard-snapshot-item">
                      <span className="dashboard-snapshot-bullet" />
                      <span>{strongestMatch ? `Your strongest eligibility match is currently ${strongestMatch}%` : 'Complete your profile to unlock stronger fit scores'}</span>
                    </div>
                    <div className="dashboard-snapshot-item">
                      <span className="dashboard-snapshot-bullet" />
                      <span>{approved ? `${approved} applications have already been approved` : 'Your approval pipeline is still building'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
