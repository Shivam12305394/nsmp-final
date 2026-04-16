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

  return (
    <AppLayout title="AI Smart Matches" subtitle="Scholarships ranked by compatibility with your profile">
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      ) : matches.length === 0 ? (
        <EmptyState icon="🤖" title="No matches found" sub="Complete your profile with marks, category and course to get AI recommendations" />
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ background: 'var(--primary-dim)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>✦</span>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--primary-h)' }}>{matches.length} Scholarship Matches Found</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>Ranked by AI compatibility score</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={getStrategy} disabled={stratLoading}>
              {stratLoading ? <><Spinner size={16} color="#fff" /> Analyzing...</> : '🤖 Get AI Strategy'}
            </button>
          </div>

          {strategy && (
            <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '18px 22px', marginBottom: 24 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--primary-h)', marginBottom: 10 }}>🤖 Your Personalized AI Strategy</div>
              <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{strategy}</p>
            </div>
          )}

          <div className="scholarship-grid">
            {matches.map((m, i) => (
              <div key={m.id} style={{ position: 'relative' }}>
                {i === 0 && <div style={{ position: 'absolute', top: -10, left: 16, zIndex: 2, background: 'linear-gradient(90deg, var(--amber), #F97316)', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 99, letterSpacing: 0.5 }}>🏆 BEST MATCH</div>}
                <div style={{ background: 'var(--bg1)', border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, marginTop: i === 0 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', background: 'linear-gradient(135deg, #10B981, #38BDF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>₹{m.amount.toLocaleString('en-IN')}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>{m.provider}</div>
                    </div>
                    <MatchRing score={m.matchScore} size={56} />
                  </div>

                  {m.reasons?.length > 0 && (
                    <div className="match-reasons">
                      {m.reasons.slice(0, 3).map((r, ri) => <div key={ri} className="match-reason">{r}</div>)}
                    </div>
                  )}

                  <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
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
        </>
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

  return (
    <AppLayout title="My Applications" subtitle="Track all your scholarship applications">
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
            <div key={a.id} className="card">
              <div style={{ padding: '18px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{a.scholarship?.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text3)', marginTop: 2 }}>{a.scholarship?.provider} · Applied {new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

  return (
    <AppLayout title="My Profile" subtitle="Keep your profile updated for better AI matches">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
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

          <button className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
            {saving ? <><Spinner size={18} color="#fff" /> Saving...</> : '💾 Save Profile'}
          </button>

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto 16px' }}>
                <svg width={96} height={96}>
                  <circle cx={48} cy={48} r={40} fill="none" stroke="var(--bg3)" strokeWidth={6} />
                  <circle cx={48} cy={48} r={40} fill="none"
                    stroke={completion >= 80 ? 'var(--emerald)' : completion >= 50 ? 'var(--primary)' : 'var(--amber)'}
                    strokeWidth={6} strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 - (completion / 100) * 2 * Math.PI * 40}
                    transform="rotate(-90 48 48)"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900 }}>{completion}%</span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>Complete</span>
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>Profile Strength</div>
              <div style={{ fontSize: 12.5, color: 'var(--text2)', lineHeight: 1.6 }}>
                {completion >= 80 ? '🎉 Excellent! You\'ll get highly accurate AI matches.' : completion >= 50 ? '👍 Good. Add more details for better matches.' : '⚠️ Low completion — AI accuracy will be limited.'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title" style={{ fontSize: 13 }}>Required Fields</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {fields.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ color: (p[f] && p[f] !== 0 && p[f] !== '') ? 'var(--emerald)' : 'var(--text3)', fontSize: 14 }}>
                    {(p[f] && p[f] !== 0 && p[f] !== '') ? '✓' : '○'}
                  </span>
                  <span style={{ color: (p[f] && p[f] !== 0 && p[f] !== '') ? 'var(--text1)' : 'var(--text3)', textTransform: 'capitalize' }}>
                    {f === 'annualIncome' ? 'Annual Income' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </span>
                </div>
              ))}
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

  const uploadedNames = files.map((f) => f.name.toLowerCase());

  return (
    <AppLayout title="Documents" subtitle="Upload and manage your scholarship documents">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
        <div>
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            style={{
              border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 16,
              padding: '40px 24px',
              textAlign: 'center',
              background: dragging ? 'var(--primary-dim)' : 'var(--bg1)',
              transition: 'all 0.2s',
              marginBottom: 20,
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>📎</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 6 }}>Drop files here or click to upload</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>PDF, JPG, PNG · Max 5MB per file</div>
            <input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)} />
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
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header"><span className="card-title">Required Documents</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {REQUIRED.map((doc) => {
              const uploaded = files.some((f) => f.name.toLowerCase().includes(doc.toLowerCase().split(' ')[0]));
              return (
                <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: uploaded ? 'var(--emerald)' : 'var(--bg3)', border: `1px solid ${uploaded ? 'var(--emerald)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 }}>
                    {uploaded ? <span style={{ color: '#fff' }}>✓</span> : null}
                  </div>
                  <span style={{ fontSize: 12.5, color: uploaded ? 'var(--text1)' : 'var(--text3)' }}>{doc}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
