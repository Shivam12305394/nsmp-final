import React, { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { MatchRing, ScholarshipCard, Badge, Spinner, EmptyState, Alert, Toggle } from '../../components/ui';
import { scholarshipAPI, applicationAPI, authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ═══════════════════════════════════════════════════════
// AI MATCHES
// ═══════════════════════════════════════════════════════
export function SmartMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myApps, setMyApps] = useState([]);
  const [applying, setApplying] = useState('');
  const [strategy, setStrategy] = useState('');
  const [stratLoading, setStratLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    Promise.all([
      scholarshipAPI.getMatches().then((r) => setMatches(r.data)),
      applicationAPI.getMy().then((r) => setMyApps(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const appliedIds = new Set(myApps.map((a) => a.scholarshipId));

  const apply = async (id) => {
    setApplying(id);
    try {
      await applicationAPI.apply(id);
      setMyApps((prev) => [...prev, { scholarshipId: id }]);
      toast.success('Application submitted! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
    setApplying('');
  };

  const getStrategy = async () => {
    setStratLoading(true);
    try {
      const top3 = matches.slice(0, 3).map((m) => `${m.name} (score: ${m.matchScore}%)`).join(', ');
      const profile = user?.profile || {};
      const res = await scholarshipAPI.getStrategy({ profile, topMatches: top3 });
      setStrategy(res.data.reply || 'Could not generate strategy.');
    } catch (err) {
      setStrategy(err.response?.data?.message || 'Network error. Please try again.');
    }
    setStratLoading(false);
  };

  const strongMatches = matches.filter((m) => m.matchScore >= 85).length;
  const appliedCount = matches.filter((m) => appliedIds.has(m.id)).length;
  const readyToApply = matches.filter((m) => !appliedIds.has(m.id)).length;

  return (
    <AppLayout title="AI Smart Matches" subtitle="Scholarships ranked by compatibility with your profile">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      ) : matches.length === 0 ? (
        <EmptyState icon="🤖" title="No matches found" sub="Complete your profile with marks, category and course to get AI recommendations" />
      ) : (
        <div className="smart-shell">
          <div className="smart-hero card">
            <div className="smart-hero-body">
              <div>
                <div className="smart-hero-eyebrow">AI Matching Engine</div>
                <div className="smart-hero-title">Your best-fit scholarships are ranked and ready to act on.</div>
                <div className="smart-hero-copy">
                  Review high-confidence opportunities first, understand why they fit, and generate an AI application strategy in one place.
                </div>
              </div>

              <div className="smart-hero-side">
                <div className="smart-summary-chip">
                  <span style={{ fontSize: 20 }}>✦</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--primary-h)' }}>{matches.length} Scholarship Matches Found</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>Ranked by AI compatibility score</div>
                  </div>
                </div>
                <div className="smart-hero-metrics">
                  <div className="smart-hero-stat">
                    <div className="smart-hero-stat-value">{strongMatches}</div>
                    <div className="smart-hero-stat-label">Strong Fits</div>
                  </div>
                  <div className="smart-hero-stat">
                    <div className="smart-hero-stat-value">{readyToApply}</div>
                    <div className="smart-hero-stat-label">Ready To Apply</div>
                  </div>
                  <div className="smart-hero-stat">
                    <div className="smart-hero-stat-value">{appliedCount}</div>
                    <div className="smart-hero-stat-label">Already Applied</div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={getStrategy} disabled={stratLoading}>
                  {stratLoading ? <><Spinner size={16} color="#fff" /> Analyzing...</> : '🤖 Get AI Strategy'}
                </button>
              </div>
            </div>
          </div>

          {strategy && (
            <div className="smart-strategy-card">
              <div className="smart-strategy-line" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--primary-h)' }}>Your Personalized AI Strategy</div>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{strategy}</p>
            </div>
          )}

          <div className="smart-results-head">
            <div>
              <div className="smart-results-title">Prioritized Match List</div>
              <div className="smart-results-sub">
                Start with the highest compatibility scholarships, then review the supporting fit reasons before applying.
              </div>
            </div>
          </div>

          <div className="scholarship-grid">
            {matches.map((m, i) => (
              <div key={m.id} className="smart-card-wrap">
                {i === 0 && <div className="smart-best-badge">🏆 Best Match</div>}
                <div className={`smart-match-card${i === 0 ? ' is-featured' : ''}`}>
                  <div className="smart-match-top">
                    <div>
                      <div className="smart-match-amount">₹{m.amount.toLocaleString('en-IN')}</div>
                      <div className="smart-match-name">{m.name}</div>
                      <div className="smart-match-provider">{m.provider}</div>
                    </div>
                    <MatchRing score={m.matchScore} size={56} />
                  </div>

                  {m.reasons?.length > 0 && (
                    <div className="match-reasons">
                      {m.reasons.slice(0, 3).map((r, ri) => <div key={ri} className="match-reason">{r}</div>)}
                    </div>
                  )}

                  <div className="smart-match-footer">
                    <span className={`tag ${m.matchScore >= 85 ? 'tag-emerald' : 'tag-neutral'}`} style={{ fontSize: 11 }}>
                      {m.matchScore >= 85 ? 'High Priority' : 'Worth Reviewing'}
                    </span>
                    {appliedIds.has(m.id) ? (
                      <span className="tag tag-emerald" style={{ padding: '8px 14px', fontSize: 12 }}>✓ Applied</span>
                    ) : (
                      <button className="btn btn-primary btn-sm" onClick={() => apply(m.id)} disabled={applying === m.id}>
                        {applying === m.id ? <><Spinner size={14} color="#fff" /> Applying...</> : '⚡ Apply Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// STUDENT APPLICATIONS
// ═══════════════════════════════════════════════════════
export function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    applicationAPI.getMy()
      .then((r) => setApps(r.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'all' ? apps : apps.filter((a) => a.status === tab);
  const counts = { all: apps.length, pending: apps.filter((a) => a.status === 'pending').length, review: apps.filter((a) => a.status === 'review').length, approved: apps.filter((a) => a.status === 'approved').length, rejected: apps.filter((a) => a.status === 'rejected').length };

  const tabList = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'review', label: 'In Review', count: counts.review },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  const timelineSteps = [
    { key: 'applied', label: 'Applied' },
    { key: 'review', label: 'In Review' },
    { key: 'decided', label: 'Decision' },
  ];

  const getStepState = (stepKey, status) => {
    if (status === 'approved' || status === 'rejected') return { applied: 'done', review: 'done', decided: status === 'approved' ? 'done' : 'rejected' }[stepKey];
    if (status === 'review') return { applied: 'done', review: 'active', decided: 'idle' }[stepKey];
    return { applied: 'active', review: 'idle', decided: 'idle' }[stepKey];
  };

  const statusColors = { pending: 'var(--amber)', review: 'var(--teal)', approved: 'var(--emerald)', rejected: 'var(--rose)' };

  return (
    <AppLayout title="My Applications" subtitle="Track all your scholarship applications">
      <div className="student-intro-card card">
        <div className="student-intro-body">
          <div>
            <div className="student-intro-eyebrow">Application Pipeline</div>
            <div className="student-intro-title">Track every scholarship submission from applied to final decision.</div>
            <div className="student-intro-copy">
              Follow the current stage, review feedback, and focus on the scholarships that still need your attention.
            </div>
          </div>
          <div className="student-intro-metrics">
            {[{ label: 'Total', count: counts.all, color: 'var(--text1)' },
              { label: 'Active', count: counts.pending + counts.review, color: 'var(--primary-h)' },
              { label: 'Approved', count: counts.approved, color: 'var(--emerald)' },
            ].map((item) => (
              <div key={item.label} className="student-intro-stat">
                <div className="student-intro-stat-value" style={{ color: item.color }}>{item.count}</div>
                <div className="student-intro-stat-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {apps.length > 0 && (
        <div className="mini-stats-grid">
          {[{ label: 'Pending', count: counts.pending, color: 'var(--amber)' },
            { label: 'In Review', count: counts.review, color: 'var(--teal)' },
            { label: 'Approved', count: counts.approved, color: 'var(--emerald)' },
            { label: 'Rejected', count: counts.rejected, color: 'var(--rose)' },
          ].map((s) => (
            <div
              key={s.label}
              className="mini-stat"
              onClick={() => setTab(s.label.toLowerCase().replace(' ', ''))}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: 16 }}>📌</span>
              <div>
                <div className="mini-stat-value" style={{ color: s.color }}>{s.count}</div>
                <div className="mini-stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div className="tabs">
          {tabList.map((t) => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label} <span className="tab-count">{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}><Spinner size={28} /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📋" title="No applications" sub={tab === 'all' ? 'Browse scholarships and apply to get started' : `No ${tab} applications`} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((a) => (
            <div key={a.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Status accent bar */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${statusColors[a.status] || 'var(--border)'}, transparent)` }} />
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{a.scholarship?.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 2 }}>{a.scholarship?.provider} · Applied {new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--emerald)' }}>₹{a.scholarship?.amount?.toLocaleString('en-IN')}</div>
                    <Badge status={a.status} />
                  </div>
                </div>

                {/* Timeline */}
                <div className="app-timeline">
                  {timelineSteps.map((step, i) => {
                    const state = getStepState(step.key, a.status);
                    return (
                      <React.Fragment key={step.key}>
                        <div className="timeline-step">
                          <div className={`timeline-dot ${state}`}>
                            {state === 'done' ? '✓' : state === 'rejected' ? '✗' : state === 'active' ? '⬤' : '○'}
                          </div>
                          <div className="timeline-label">{step.label}</div>
                        </div>
                        {i < timelineSteps.length - 1 && <div className={`timeline-line ${state === 'done' ? 'done' : ''}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {a.reviewNote && (
                  <div style={{ marginTop: 12, background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--text2)', borderLeft: '3px solid var(--primary)' }}>
                    <strong style={{ color: 'var(--text1)' }}>Reviewer Note:</strong> {a.reviewNote}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// STUDENT PROFILE
// ═══════════════════════════════════════════════════════
export function StudentProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', profile: { ...user?.profile } });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updP = (k, v) => setForm((f) => ({ ...f, profile: { ...f.profile, [k]: v } }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await authAPI.updateProfile(form);
      updateUser(res.data);
      toast.success('Profile saved successfully!');
      setSaved(true);
    } catch {
      toast.error('Failed to save profile');
    }
    setSaving(false);
  };

  const CATEGORIES = ['', 'General', 'OBC', 'SC', 'ST', 'EWS'];
  const COURSES = ['', 'Engineering', 'Medical', 'Science', 'Commerce', 'Arts', 'Law', 'Pharmacy', 'Sports Management', 'Physical Education', 'Fine Arts', 'Music'];
  const STATES = ['', 'Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'];

  const fields = ['marks', 'category', 'course', 'gender', 'annualIncome', 'state', 'institution'];
  const p = form.profile || {};
  const filled = fields.filter((f) => p[f] && p[f] !== 0 && p[f] !== '').length;
  const completion = Math.round((filled / fields.length) * 100);
  const missingFields = fields.filter((f) => !p[f] || p[f] === 0 || p[f] === '');
  const initials = form.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'NS';
  const summaryChips = [
    p.state,
    p.course,
    p.category,
    p.institution,
  ].filter(Boolean).slice(0, 4);
  const completionTone = completion >= 80 ? 'var(--emerald)' : completion >= 50 ? 'var(--primary)' : 'var(--amber)';
  const completionMessage = completion >= 80
    ? 'Excellent! Your profile is ready for highly accurate AI matches.'
    : completion >= 50
      ? 'Good progress. Add the remaining details to improve scholarship recommendations.'
      : 'Profile is still light. Fill the important academic details to unlock better matching.';

  return (
    <AppLayout title="My Profile" subtitle="Keep your profile updated for better AI matches">
      <div className="profile-shell">
        <div className="profile-overview card">
          <div className="profile-overview-body">
            <div className="profile-overview-main">
              <div className="profile-overview-avatar">{initials}</div>
              <div>
                <div className="profile-overview-eyebrow">Student Identity</div>
                <div className="profile-overview-name">{form.name || 'Your Profile'}</div>
                <div className="profile-overview-meta">{user?.email} {form.phone ? `· ${form.phone}` : ''}</div>
                <div className="profile-overview-copy">{completionMessage}</div>
                {summaryChips.length > 0 && (
                  <div className="profile-overview-chips">
                    {summaryChips.map((chip) => <span key={chip} className="tag tag-neutral">{chip}</span>)}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-overview-side">
              <div className="profile-overview-metric" style={{ color: completionTone }}>{completion}%</div>
              <div className="profile-overview-side-label">Profile Completion</div>
              <div className="profile-overview-side-copy">
                {missingFields.length === 0 ? 'All required fields are complete.' : `${missingFields.length} important field${missingFields.length > 1 ? 's are' : ' is'} still missing.`}
              </div>
              <button className="btn btn-primary btn-lg" onClick={save} disabled={saving} style={{ width: '100%' }}>
                {saving ? <><Spinner size={18} color="#fff" /> Saving...</> : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

        <div className="profile-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Personal Info */}
          <div className="card">
            <div className="card-header"><span className="card-title">👤 Personal Information</span></div>
            <div className="card-body">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.name} onChange={(e) => upd('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input className="form-input" value={form.phone} onChange={(e) => upd('phone', e.target.value)} type="tel" />
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" value={user?.email} disabled style={{ opacity: 0.5 }} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <select className="form-select" value={p.state || ''} onChange={(e) => updP('state', e.target.value)}>
                    {STATES.map((s) => <option key={s} value={s}>{s || 'Select State'}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" value={p.address || ''} onChange={(e) => updP('address', e.target.value)} placeholder="Your full address" rows={2} />
              </div>
            </div>
          </div>

          {/* Academic Profile */}
          <div className="card">
            <div className="card-header"><span className="card-title">🎓 Academic Profile</span></div>
            <div className="card-body">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Class 12 Marks % <span className="form-required">*</span></label>
                  <input className="form-input" type="number" min={0} max={100} value={p.marks || ''} onChange={(e) => updP('marks', +e.target.value)} placeholder="e.g. 85" />
                </div>
                <div className="form-group">
                  <label className="form-label">CGPA (if applicable)</label>
                  <input className="form-input" type="number" step={0.1} min={0} max={10} value={p.cgpa || ''} onChange={(e) => updP('cgpa', +e.target.value)} placeholder="e.g. 8.5" />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Family Income ₹ <span className="form-required">*</span></label>
                  <input className="form-input" type="number" value={p.annualIncome || ''} onChange={(e) => updP('annualIncome', +e.target.value)} placeholder="e.g. 400000" />
                </div>
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Category <span className="form-required">*</span></label>
                  <select className="form-select" value={p.category || ''} onChange={(e) => updP('category', e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c || 'Select Category'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Course / Programme <span className="form-required">*</span></label>
                  <select className="form-select" value={p.course || ''} onChange={(e) => updP('course', e.target.value)}>
                    {COURSES.map((c) => <option key={c} value={c}>{c || 'Select Course'}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Gender <span className="form-required">*</span></label>
                  <select className="form-select" value={p.gender || ''} onChange={(e) => updP('gender', e.target.value)}>
                    {['', 'Male', 'Female', 'Other'].map((g) => <option key={g} value={g}>{g || 'Select Gender'}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Institution Name</label>
                  <input className="form-input" value={p.institution || ''} onChange={(e) => updP('institution', e.target.value)} placeholder="e.g. IIT Delhi" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: 10 }}>Person with Disability (PwD)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <Toggle checked={!!p.disability} onChange={(v) => updP('disability', v)} id="disability" />
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.disability ? 'Yes — disability certificate available' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Post-save nudge */}
          {saved && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '14px 18px', animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
              <span style={{ fontSize: 22 }}>🎉</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--emerald)', fontSize: 14 }}>Profile updated!</div>
                <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2 }}>Your AI matches have been recalculated based on your new profile.</div>
              </div>
              <a href="/matches" className="btn btn-emerald btn-sm">🤖 View My Matches →</a>
            </div>
          )}
        </div>

        {/* Sidebar: Completion */}
        <div className="profile-sidebar">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${completionTone}, transparent)` }} />
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 100, height: 100, margin: '0 auto 16px' }}>
                <svg width={100} height={100}>
                  <circle cx={50} cy={50} r={42} fill="none" stroke="var(--bg3)" strokeWidth={7} />
                  <circle cx={50} cy={50} r={42} fill="none"
                    stroke={completionTone}
                    strokeWidth={7} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 - (completion / 100) * 2 * Math.PI * 42}
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 1s var(--ease-out), stroke 0.5s' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: completion >= 80 ? 'var(--emerald)' : completion >= 50 ? 'var(--primary-h)' : 'var(--amber)' }}>{completion}%</span>
                  <span style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase', fontWeight: 700 }}>Complete</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Profile Strength</div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
                {completion >= 80 ? '🎉 Excellent! Highly accurate AI matches.' : completion >= 50 ? '👍 Good. Add more details for better matches.' : '⚠️ Low — AI accuracy will be limited.'}
              </div>
              {completion < 100 && (
                <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${completion}%`, background: completion >= 80 ? 'var(--emerald)' : completion >= 50 ? 'linear-gradient(90deg, var(--primary), var(--amber))' : 'var(--amber)', borderRadius: 99, transition: 'width 1s var(--ease-out)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ fontSize: 13 }}>Required Fields</span>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{filled}/{fields.length}</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((f) => {
                const done = p[f] && p[f] !== 0 && p[f] !== '';
                return (
                  <div key={f} className="profile-check-item">
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? 'var(--emerald)' : 'var(--bg3)', border: `1px solid ${done ? 'var(--emerald)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                      {done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800 }}>✓</span>}
                    </div>
                    <span style={{ color: done ? 'var(--text1)' : 'var(--text3)', textTransform: 'capitalize', transition: 'color 0.3s' }}>
                      {f === 'annualIncome' ? 'Annual Income' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </span>
                    <span className={`tag ${done ? 'tag-emerald' : 'tag-neutral'}`} style={{ marginLeft: 'auto', fontSize: 10 }}>
                      {done ? 'Done' : 'Pending'}
                    </span>
                  </div>
                );
              })}
              {missingFields.length > 0 && (
                <div className="profile-check-note">
                  Next best improvement: complete <strong>{missingFields[0] === 'annualIncome' ? 'Annual Income' : missingFields[0].charAt(0).toUpperCase() + missingFields[0].slice(1)}</strong>.
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════
export function Documents() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);

  const REQUIRED = [
    'Class 12 Marksheet', 'Income Certificate', 'Category Certificate',
    'Aadhaar Card', 'Bank Passbook', 'Passport Photo', 'College Admission Letter', 'Domicile Certificate',
  ];

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      size: (f.size / 1024).toFixed(1) + ' KB',
      type: f.type,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    // Simulate auto-verify after 2s
    setTimeout(() => {
      setFiles((prev) => prev.map((f) => newFiles.find((n) => n.id === f.id) ? { ...f, status: 'verified' } : f));
    }, 2000);
  };

  const isDocUploaded = (doc) => files.some((f) => f.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0]));
  const verifiedCount = files.filter((f) => f.status === 'verified').length;
  const requiredUploaded = REQUIRED.filter((doc) => isDocUploaded(doc)).length;
  const remainingRequired = REQUIRED.length - requiredUploaded;

  return (
    <AppLayout title="Documents" subtitle="Upload and manage your scholarship documents">
      <div className="docs-shell">
        <div className="docs-hero card">
          <div className="docs-hero-body">
            <div>
              <div className="docs-hero-eyebrow">Verification Workspace</div>
              <div className="docs-hero-title">Keep every scholarship document organized, verified, and ready to submit.</div>
              <div className="docs-hero-copy">
                Upload once, track verification status, and make sure your core documents are always available for applications.
              </div>
            </div>

            <div className="docs-hero-metrics">
              <div className="docs-hero-stat">
                <div className="docs-hero-stat-value">{files.length}</div>
                <div className="docs-hero-stat-label">Uploaded</div>
              </div>
              <div className="docs-hero-stat">
                <div className="docs-hero-stat-value">{verifiedCount}</div>
                <div className="docs-hero-stat-label">Verified</div>
              </div>
              <div className="docs-hero-stat">
                <div className="docs-hero-stat-value">{remainingRequired}</div>
                <div className="docs-hero-stat-label">Still Needed</div>
              </div>
            </div>
          </div>
        </div>

      <div className="docs-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`docs-upload-zone${dragging ? ' is-dragging' : ''}`}
            onClick={() => document.getElementById('file-input').click()}
          >
            {dragging && <div style={{ position: 'absolute', inset: 0, background: 'rgba(245,166,35,0.04)', animation: 'pulse 1s infinite' }} />}
            <div className="docs-upload-icon">📤</div>
            <div className="docs-upload-title" style={{ color: dragging ? 'var(--primary-h)' : 'var(--text1)' }}>
              {dragging ? 'Drop files here!' : 'Drop files here or click to upload'}
            </div>
            <div className="docs-upload-sub">PDF, JPG, PNG · Max 5MB per file</div>
            <input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)} />
          </div>

          <div className="mini-stats-grid">
            <div className="mini-stat">
              <span style={{ fontSize: 18 }}>📁</span>
              <div>
                <div className="mini-stat-value">{files.length}</div>
                <div className="mini-stat-label">Total Files</div>
              </div>
            </div>
            <div className="mini-stat">
              <span style={{ fontSize: 18 }}>✅</span>
              <div>
                <div className="mini-stat-value" style={{ color: 'var(--emerald)' }}>{verifiedCount}</div>
                <div className="mini-stat-label">Verified Files</div>
              </div>
            </div>
            <div className="mini-stat">
              <span style={{ fontSize: 18 }}>📌</span>
              <div>
                <div className="mini-stat-value">{requiredUploaded}</div>
                <div className="mini-stat-label">Required Covered</div>
              </div>
            </div>
            <div className="mini-stat">
              <span style={{ fontSize: 18 }}>⏳</span>
              <div>
                <div className="mini-stat-value" style={{ color: remainingRequired === 0 ? 'var(--emerald)' : 'var(--amber)' }}>{remainingRequired}</div>
                <div className="mini-stat-label">Still Needed</div>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Uploaded Files ({files.length})</span></div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Size</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.id}>
                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>{f.type.includes('pdf') ? '📄' : '🖼️'}</span>
                          <span style={{ fontSize: 13 }}>{f.name}</span>
                        </td>
                        <td style={{ color: 'var(--text3)', fontSize: 12 }}>{f.size}</td>
                        <td>
                          {f.status === 'verified'
                            ? <span className="tag tag-emerald">✓ Verified</span>
                            : <span className="tag tag-amber">⏳ Pending</span>}
                        </td>
                        <td style={{ color: 'var(--text3)', fontSize: 12 }}>{new Date(f.uploadedAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }}
                            onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="docs-sidebar">
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <span className="card-title">Required Documents</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{requiredUploaded}/{REQUIRED.length}</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REQUIRED.map((doc) => {
              const uploaded = isDocUploaded(doc);
              return (
                <div key={doc} className="docs-check-item">
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: uploaded ? 'var(--emerald)' : 'var(--bg3)', border: `1px solid ${uploaded ? 'var(--emerald)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 }}>
                    {uploaded ? <span style={{ color: '#fff' }}>✓</span> : null}
                  </div>
                  <span style={{ fontSize: 12.5, color: uploaded ? 'var(--text1)' : 'var(--text3)' }}>{doc}</span>
                  <span className={`tag ${uploaded ? 'tag-emerald' : 'tag-neutral'}`} style={{ marginLeft: 'auto', fontSize: 10 }}>
                    {uploaded ? 'Ready' : 'Missing'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="docs-tip-card">
          <div className="docs-tip-title">Submission Tip</div>
          <div className="docs-tip-copy">
            Keep file names clear like `income-certificate.pdf` or `aadhaar-front.jpg` so you can identify them quickly while applying.
          </div>
        </div>
        </div>
      </div>
      </div>
    </AppLayout>
  );
}
