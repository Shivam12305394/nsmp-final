import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { StatCard, Badge, Spinner, Modal, ConfirmDialog, SearchBar, EmptyState } from '../../components/ui';
import { scholarshipAPI, applicationAPI, userAPI } from '../../utils/api';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════
export function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userAPI.getAnalytics().then((r) => setAnalytics(r.data)),
      applicationAPI.getAll().then((r) => setRecentApps(r.data.slice(0, 8))),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Dashboard" subtitle="Admin overview">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      </AppLayout>
    );
  }

  const maxBar = analytics ? Math.max(...analytics.monthly.map((m) => m.count || 0), 1) : 1;

  const statusItems = [
    { label: 'Pending', count: analytics?.pending, color: 'var(--amber)', icon: '⏳' },
    { label: 'In Review', count: analytics?.review, color: 'var(--teal-h)', icon: '🔍' },
    { label: 'Approved', count: analytics?.approved, color: 'var(--emerald)', icon: '✅' },
    { label: 'Rejected', count: analytics?.rejected, color: 'var(--rose)', icon: '❌' },
  ];

  return (
    <AppLayout title="Admin Dashboard" subtitle="Overview of scholarship portal activity">
      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="🎓" value={analytics?.totalScholarships ?? 0} label="Active Scholarships" bg="rgba(99,102,241,0.12)" />
        <StatCard icon="👥" value={analytics?.totalStudents ?? 0} label="Registered Students" bg="rgba(56,189,248,0.12)" />
        <StatCard icon="📋" value={analytics?.totalApplications ?? 0} label="Total Applications" bg="rgba(16,185,129,0.12)" />
        <StatCard icon="✅" value={`${analytics?.approvalRate ?? 0}%`} label="Approval Rate" bg="rgba(245,158,11,0.12)" />
      </div>

      {/* Status mini-cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {statusItems.map(({ label, count, color, icon }) => (
          <div key={label} style={{
            background: 'var(--bg1)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
            transition: 'border-color 0.2s',
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>{count ?? 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Applications — Last 6 Months</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>Monthly volume</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
              {(analytics?.monthly || []).map((m) => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 11, color: 'var(--text1)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{m.count}</span>
                  <div style={{
                    width: '100%',
                    height: `${Math.max((m.count / maxBar) * 100, 4)}%`,
                    background: 'linear-gradient(to top, var(--primary), var(--violet))',
                    borderRadius: '6px 6px 0 0',
                    minHeight: 4,
                    boxShadow: '0 0 12px rgba(245,166,35,0.2)',
                    transition: 'height 0.8s cubic-bezier(0.16,1,0.3,1)',
                  }} />
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="card">
          <div className="card-header"><span className="card-title">📋 Status Breakdown</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {statusItems.map(({ label, count, color }) => {
              const pct = analytics?.totalApplications > 0 ? ((count || 0) / analytics.totalApplications) * 100 : 0;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12.5 }}>
                    <span style={{ color: 'var(--text2)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{count || 0}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent applications table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🕐 Recent Applications</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Latest {recentApps.length} entries</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Scholarship</th>
                <th>Amount</th>
                <th>Applied</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApps.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No applications yet</td></tr>
              ) : recentApps.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, var(--primary), var(--violet))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 2px 8px rgba(245,166,35,0.25)',
                      }}>
                        {a.student?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.student?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.student?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text2)' }}>{a.scholarship?.name}</td>
                  <td>
                    <span style={{ color: 'var(--emerald)', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-mono)' }}>₹{a.scholarship?.amount?.toLocaleString('en-IN')}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td><Badge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN SCHOLARSHIPS
// ═══════════════════════════════════════════════════════
export function AdminScholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving] = useState(false);

  const CATS = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const COURSES = ['Engineering', 'Medical', 'Science', 'Commerce', 'Arts', 'Law', 'Pharmacy', 'Sports Management', 'Physical Education', 'Fine Arts', 'Music'];

  const emptyForm = {
    name: '', provider: '', amount: '', deadline: '', minMarks: '', maxIncome: '',
    categories: [], courses: [], gender: 'All', location: 'All India',
    disability: false, description: '', eligibility: '', benefits: '', featured: false,
  };
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(() => {
    setLoading(true);
    scholarshipAPI.getAll({ search }).then((r) => setScholarships(r.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ ...s, amount: String(s.amount), minMarks: String(s.minMarks), maxIncome: String(s.maxIncome) });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.provider || !form.amount || !form.deadline) {
      toast.error('Fill all required fields');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), minMarks: Number(form.minMarks) || 0, maxIncome: Number(form.maxIncome) || 0 };
      if (editing) {
        await scholarshipAPI.update(editing.id, payload);
        toast.success('Scholarship updated!');
      } else {
        await scholarshipAPI.create(payload);
        toast.success('Scholarship created!');
      }
      setModalOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to save scholarship');
    }
    setSaving(false);
  };

  const doDelete = async () => {
    try {
      await scholarshipAPI.delete(deleteId);
      toast.success('Scholarship deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
    setDeleteId(null);
  };

  const toggleArr = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: (f[key] || []).includes(val)
        ? f[key].filter((x) => x !== val)
        : [...(f[key] || []), val],
    }));
  };

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <AppLayout title="Manage Scholarships" subtitle={`${scholarships.length} scholarships in the system`}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search scholarships..." style={{ flex: 1 }} />
        <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={openAdd}>✦ Add Scholarship</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Provider</th>
                <th>Amount</th>
                <th>Deadline</th>
                <th>Min. Marks</th>
                <th>Applicants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}><Spinner size={24} /></td></tr>
              ) : scholarships.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No scholarships found</td></tr>
              ) : scholarships.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                    {s.featured && <span className="tag tag-amber" style={{ fontSize: 10, marginTop: 4, display: 'inline-block' }}>⭐ Featured</span>}
                  </td>
                  <td style={{ color: 'var(--text3)', fontSize: 12 }}>{s.provider}</td>
                  <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>₹{s.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12 }}>{new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                  <td style={{ fontSize: 13 }}>{s.minMarks}%</td>
                  <td style={{ fontSize: 13 }}>{s.applicants}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>✏️ Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--rose)' }} onClick={() => setDeleteId(s.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Scholarship' : 'Add New Scholarship'}
        size="lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <Spinner size={16} color="#fff" /> : editing ? 'Save Changes' : 'Create Scholarship'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Scholarship Name <span className="form-required">*</span></label>
              <input className="form-input" value={form.name} onChange={(e) => upd('name', e.target.value)} placeholder="e.g. PM Merit Scholarship" />
            </div>
            <div className="form-group">
              <label className="form-label">Provider / Ministry <span className="form-required">*</span></label>
              <input className="form-input" value={form.provider} onChange={(e) => upd('provider', e.target.value)} placeholder="e.g. Ministry of Education" />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="form-required">*</span></label>
              <input className="form-input" type="number" value={form.amount} onChange={(e) => upd('amount', e.target.value)} placeholder="75000" />
            </div>
            <div className="form-group">
              <label className="form-label">Deadline <span className="form-required">*</span></label>
              <input className="form-input" type="date" value={form.deadline} onChange={(e) => upd('deadline', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Min. Marks (%)</label>
              <input className="form-input" type="number" value={form.minMarks} onChange={(e) => upd('minMarks', e.target.value)} placeholder="60" />
            </div>
          </div>
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Max. Income (₹/yr)</label>
              <input className="form-input" type="number" value={form.maxIncome} onChange={(e) => upd('maxIncome', e.target.value)} placeholder="500000" />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={(e) => upd('gender', e.target.value)}>
                {['All', 'Male', 'Female', 'Other'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={form.location} onChange={(e) => upd('location', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Eligible Categories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {CATS.map((c) => (
                <button key={c} type="button"
                  className={`tag ${(form.categories || []).includes(c) ? 'tag-primary' : 'tag-neutral'}`}
                  style={{ cursor: 'pointer', padding: '5px 12px', fontSize: 12 }}
                  onClick={() => toggleArr('categories', c)}
                >{c}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Eligible Courses</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
              {COURSES.map((c) => (
                <button key={c} type="button"
                  className={`tag ${(form.courses || []).includes(c) ? 'tag-emerald' : 'tag-neutral'}`}
                  style={{ cursor: 'pointer', padding: '5px 12px', fontSize: 11 }}
                  onClick={() => toggleArr('courses', c)}
                >{c}</button>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => upd('description', e.target.value)} rows={2} />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Eligibility Criteria</label>
              <textarea className="form-textarea" value={form.eligibility} onChange={(e) => upd('eligibility', e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Benefits</label>
              <textarea className="form-textarea" value={form.benefits} onChange={(e) => upd('benefits', e.target.value)} rows={2} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => upd('featured', e.target.checked)} />
              Mark as Featured
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.disability} onChange={(e) => upd('disability', e.target.checked)} />
              PwD Scholarship
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={doDelete}
        title="Delete Scholarship"
        message="This will permanently delete the scholarship. This action cannot be undone."
        confirmLabel="Delete Permanently"
        danger
      />
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN APPLICATIONS
// ═══════════════════════════════════════════════════════
export function AdminApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('pending');
  const [reviewModal, setReviewModal] = useState(null);
  const [note, setNote] = useState('');
  const [actioning, setActioning] = useState(false);

  const fetchApps = useCallback(() => {
    setLoading(true);
    applicationAPI.getAll({ status: tab === 'all' ? '' : tab, search })
      .then((r) => setApps(r.data))
      .finally(() => setLoading(false));
  }, [tab, search]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = async (status) => {
    setActioning(true);
    try {
      await applicationAPI.updateStatus(reviewModal.id, { status, reviewNote: note });
      toast.success(`Application marked as ${status}!`);
      setReviewModal(null);
      setNote('');
      fetchApps();
    } catch {
      toast.error('Failed to update status');
    }
    setActioning(false);
  };

  const tabList = [
    { id: 'pending', label: 'Pending' },
    { id: 'review', label: 'In Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All' },
  ];

  return (
    <AppLayout title="Applications" subtitle="Review and process student applications">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs">
          {tabList.map((t) => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === tab && apps.length > 0 && <span className="tab-count">{apps.length}</span>}
            </button>
          ))}
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by student name..." style={{ flex: 1, minWidth: 200 }} />
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Scholarship</th>
                <th>Amount</th>
                <th>Applied On</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 48 }}><Spinner size={24} /></td></tr>
              ) : apps.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No applications found</td></tr>
              ) : apps.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {a.student?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{a.student?.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{a.student?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.scholarship?.name}</td>
                  <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>₹{a.scholarship?.amount?.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(a.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><Badge status={a.status} /></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setReviewModal(a); setNote(a.reviewNote || ''); }}>
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        open={!!reviewModal}
        onClose={() => { setReviewModal(null); setNote(''); }}
        title="Review Application"
        subtitle={reviewModal?.scholarship?.name}
        size="sm"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setReviewModal(null); setNote(''); }}>Close</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--sky)', borderColor: 'rgba(56,189,248,0.3)' }}
              onClick={() => updateStatus('review')} disabled={actioning}>
              Set Review
            </button>
            <button className="btn btn-rose btn-sm" onClick={() => updateStatus('rejected')} disabled={actioning}>
              Reject
            </button>
            <button className="btn btn-emerald btn-sm" onClick={() => updateStatus('approved')} disabled={actioning}>
              {actioning ? <Spinner size={14} color="#fff" /> : 'Approve'}
            </button>
          </>
        }
      >
        {reviewModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Student', value: reviewModal.student?.name },
                { label: 'Category', value: reviewModal.student?.profile?.category || '—' },
                { label: 'Marks', value: reviewModal.student?.profile?.marks ? `${reviewModal.student.profile.marks}%` : '—' },
                { label: 'Course', value: reviewModal.student?.profile?.course || '—' },
                { label: 'Income', value: reviewModal.student?.profile?.annualIncome ? `₹${(reviewModal.student.profile.annualIncome / 100000).toFixed(1)}L` : '—' },
                { label: 'Status', value: <Badge status={reviewModal.status} /> },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Review Note (optional — shown to student)</label>
              <textarea className="form-textarea" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Congratulations! / Documents need re-verification." rows={3} />
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// ADMIN STUDENTS
// ═══════════════════════════════════════════════════════
export function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    userAPI.getAll({ search }).then((r) => setStudents(r.data)).finally(() => setLoading(false));
  }, [search]);

  return (
    <AppLayout title="Students" subtitle={`${students.length} registered students`}>
      <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." style={{ marginBottom: 20 }} />

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Category</th>
                <th>Course</th>
                <th>Marks</th>
                <th>Income</th>
                <th>Applications</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}><Spinner size={24} /></td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text3)', padding: 32 }}>No students found</td></tr>
              ) : students.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 9,
                        background: 'linear-gradient(135deg, var(--primary), #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>{s.name[0]}</div>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{s.email}</div>
                        {s.phone && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {s.profile?.category
                      ? <span className="tag tag-primary">{s.profile.category}</span>
                      : <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>{s.profile?.course || '—'}</td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.profile?.marks >= 80 ? 'var(--emerald)' : s.profile?.marks ? 'var(--text1)' : 'var(--text3)' }}>
                      {s.profile?.marks ? `${s.profile.marks}%` : '—'}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {s.profile?.annualIncome ? `₹${(s.profile.annualIncome / 100000).toFixed(1)}L` : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{s.applicationCount}</td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════
export function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userAPI.getAnalytics().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout title="Analytics" subtitle="Portal statistics">
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      </AppLayout>
    );
  }

  const maxBar = Math.max(...(data?.monthly?.map((m) => m.count) || [1]), 1);
  const catEntries = Object.entries(data?.categories || {}).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catEntries.map(([, v]) => v), 1);

  return (
    <AppLayout title="Analytics" subtitle="Detailed scholarship portal insights">
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="✅" value={`${data?.approvalRate ?? 0}%`} label="Approval Rate" bg="rgba(16,185,129,0.12)" />
        <StatCard icon="💰" value={`₹${((data?.totalPoolAmount || 0) / 10000000).toFixed(1)}Cr`} label="Total Pool Value" bg="rgba(245,158,11,0.12)" />
        <StatCard icon="🎓" value={data?.totalScholarships ?? 0} label="Active Scholarships" bg="rgba(99,102,241,0.12)" />
        <StatCard icon="👥" value={data?.totalStudents ?? 0} label="Total Students" bg="rgba(56,189,248,0.12)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Monthly */}
        <div className="card">
          <div className="card-header"><span className="card-title">📈 Monthly Application Volume</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {(data?.monthly || []).map((m) => (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>{m.count}</span>
                  <div style={{ width: '100%', height: `${Math.max((m.count / maxBar) * 100, 4)}%`, background: 'linear-gradient(to top, var(--emerald), var(--sky))', borderRadius: '4px 4px 0 0', minHeight: 4 }} />
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category distribution */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Students by Category</span></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catEntries.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>No data yet</div>
            ) : catEntries.map(([cat, count]) => (
              <div key={cat}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12.5 }}>
                  <span className="tag tag-primary" style={{ fontSize: 11 }}>{cat}</span>
                  <span style={{ color: 'var(--primary-h)', fontWeight: 700 }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(count / maxCat) * 100}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top scholarships */}
      <div className="card">
        <div className="card-header"><span className="card-title">🏆 Top Scholarships by Applications</span></div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Scholarship</th>
                <th>Amount</th>
                <th>Applicants</th>
                <th>Demand</th>
              </tr>
            </thead>
            <tbody>
              {(data?.topScholarships || []).map((s, i) => {
                const maxApplicants = data.topScholarships[0]?.applicants || 1;
                return (
                  <tr key={s.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--text2)' : 'var(--text3)', fontSize: 16 }}>
                        #{i + 1}
                      </span>
                    </td>
                    <td style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>₹{s.amount?.toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: 13 }}>{s.applicants}</td>
                    <td style={{ width: 160 }}>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${(s.applicants / maxApplicants) * 100}%`, background: 'linear-gradient(90deg, var(--primary), #8B5CF6)' }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}

export function FraudDetection() {
  const [scanning, setScanning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [alerts, setAlerts] = useState([
    { id: '1', student: 'Rahul Kumar', type: 'Duplicate Documents', risk: 'high', detail: 'Same Aadhaar number detected across 3 different accounts.', time: new Date().toISOString(), dismissed: false },
    { id: '2', student: 'Priya Sharma', type: 'Income Anomaly', risk: 'medium', detail: 'Declared income ₹1.2L but bank statement shows ₹6.8L.', time: new Date().toISOString(), dismissed: false },
    { id: '3', student: 'Amit Singh', type: 'Bulk Applications', risk: 'medium', detail: 'Applied to 11 scholarships within 2 hours.', time: new Date().toISOString(), dismissed: false },
  ]);

  const scan = async () => {
    setScanning(true);
    await new Promise((r) => setTimeout(r, 2000));
    setScanning(false);
    toast.success('Fraud scan complete — 3 alerts found');
  };

  const dismiss = (id) => setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, dismissed: true } : a));
  const blacklist = (id) => { toast.error('Student blacklisted'); dismiss(id); };

  const getAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const summary = alerts.filter((a) => !a.dismissed).map((a) => `${a.student}: ${a.type} (${a.risk} risk) - ${a.detail}`).join('\n');
      const res = await api.post('/ai/fraud', { summary });
      setAiReport(res.data.reply || 'Analysis failed.');
    } catch (err) {
      setAiReport(err.response?.data?.message || 'Failed to generate analysis.');
    }
    setAiLoading(false);
  };

  const active = alerts.filter((a) => !a.dismissed);
  const high = active.filter((a) => a.risk === 'high').length;
  const medium = active.filter((a) => a.risk === 'medium').length;
  const dismissed = alerts.filter((a) => a.dismissed).length;

  const riskColor = { high: 'var(--rose)', medium: 'var(--amber)', low: 'var(--emerald)' };
  const riskBg = { high: 'rgba(244,63,94,0.1)', medium: 'rgba(245,158,11,0.1)', low: 'rgba(16,185,129,0.1)' };

  return (
    <AppLayout title="Fraud Detection" subtitle="Monitor and investigate suspicious activities">
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <button className="btn btn-primary" onClick={scan} disabled={scanning}>
          {scanning ? <><Spinner size={16} color="#fff" /> Scanning...</> : '🔍 Run Fraud Scan'}
        </button>
        <button className="btn btn-ghost" onClick={getAiAnalysis} disabled={aiLoading}>
          {aiLoading ? <><Spinner size={16} /> Analyzing...</> : '🤖 AI Analysis'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard icon="🔴" value={high} label="High Risk Alerts" bg="rgba(244,63,94,0.1)" />
        <StatCard icon="🟡" value={medium} label="Medium Risk Alerts" bg="rgba(245,158,11,0.1)" />
        <StatCard icon="🟢" value={0} label="Low Risk Alerts" bg="rgba(16,185,129,0.1)" />
        <StatCard icon="✓" value={dismissed} label="Dismissed" bg="rgba(99,102,241,0.1)" />
      </div>

      {aiReport && (
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '18px 22px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--primary-h)', marginBottom: 10 }}>🤖 AI Fraud Analysis</div>
          <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{aiReport}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {active.length === 0 ? (
          <div className="card"><div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>✅ No active fraud alerts</div></div>
        ) : active.map((a) => (
          <div key={a.id} className="card">
            <div style={{ padding: '18px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: riskBg[a.risk], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {a.risk === 'high' ? '🚨' : '⚠️'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>{a.student}</div>
                  <span style={{ fontSize: 11, padding: '3px 9px', background: riskBg[a.risk], color: riskColor[a.risk], borderRadius: 99, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{a.risk} risk</span>
                  <span className="tag tag-neutral" style={{ fontSize: 11 }}>{a.type}</span>
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text2)', marginBottom: 10 }}>{a.detail}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(a.time).toLocaleString('en-IN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => dismiss(a.id)}>Dismiss</button>
                <button className="btn btn-rose btn-sm" onClick={() => blacklist(a.id)}>Blacklist</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
