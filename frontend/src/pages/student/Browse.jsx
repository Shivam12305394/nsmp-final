import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ScholarshipCard, SearchBar, Modal, Spinner, AmountChip, Badge, EmptyState } from '../../components/ui';
import { scholarshipAPI, applicationAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// Client-side match score — mirrors backend logic
function calcMatch(s, profile) {
  if (!profile) return 0;
  let score = 0;
  if (profile.category && s.categories?.includes(profile.category)) score += 25;
  if (profile.marks && profile.marks >= s.minMarks) {
    score += 20;
    if (profile.marks >= s.minMarks + 10) score += 8;
  }
  if (profile.annualIncome && profile.annualIncome <= s.maxIncome) {
    score += 20;
    if (profile.annualIncome <= s.maxIncome * 0.5) score += 5;
  }
  if (profile.course && s.courses?.includes(profile.course)) score += 15;
  if (s.gender === 'All' || (profile.gender && s.gender === profile.gender)) score += 10;
  if (s.location === 'All India' || (profile.state && s.location?.toLowerCase().includes(profile.state.toLowerCase()))) score += 5;
  if (s.disability && profile.disability) score += 5;
  return Math.min(score, 100);
}

const CATEGORIES = ['', 'General', 'OBC', 'SC', 'ST', 'EWS'];
const COURSES = ['', 'Engineering', 'Medical', 'Science', 'Commerce', 'Arts', 'Law', 'Pharmacy'];
const SORTS = [
  { value: '', label: 'Default' },
  { value: 'match', label: '🎯 Profile Match' },
  { value: 'amount_desc', label: 'Amount: High → Low' },
  { value: 'amount_asc', label: 'Amount: Low → High' },
  { value: 'deadline', label: 'Earliest Deadline' },
  { value: 'popular', label: 'Most Popular' },
];

export default function BrowseScholarships() {
  const [scholarships, setScholarships] = useState([]);
  const [myApps, setMyApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [course, setCourse] = useState('');
  const [sort, setSort] = useState('');

  const profile = user?.profile || null;
  const profileFilled = profile && (profile.marks || profile.category || profile.course);

  const fetchAll = () => {
    setLoading(true);
    const apiSort = sort === 'match' ? '' : sort;
    Promise.all([
      scholarshipAPI.getAll({ search, category, course, sort: apiSort }).then((r) => setScholarships(r.data)),
      applicationAPI.getMy().then((r) => setMyApps(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  };

  useEffect(fetchAll, [search, category, course, sort]);

  // Attach match scores + sort by match if selected
  const displayList = useMemo(() => {
    const withScore = scholarships.map((s) => ({ ...s, matchScore: calcMatch(s, profile) }));
    if (sort === 'match') return [...withScore].sort((a, b) => b.matchScore - a.matchScore);
    return withScore;
  }, [scholarships, profile, sort]);

  const appliedIds = new Set(myApps.map((a) => a.scholarshipId));
  const activeFilterCount = [category, course, sort].filter(Boolean).length;
  const selectedWithScore = selected ? { ...selected, matchScore: calcMatch(selected, profile) } : null;

  const apply = async (scholarshipId) => {
    setApplying(true);
    try {
      await applicationAPI.apply(scholarshipId);
      setMyApps((prev) => [...prev, { scholarshipId }]);
      toast.success('Application submitted successfully! 🎉');
      setSelected(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
    setApplying(false);
  };

  return (
    <AppLayout title="Browse Scholarships" subtitle={`${displayList.length} scholarships available`}>

      {/* Profile incomplete nudge */}
      {!profileFilled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)', borderRadius: 12, padding: '12px 18px', marginBottom: 20 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary-h)', fontSize: 13.5 }}>Complete your profile</span>
            <span style={{ fontSize: 13, color: 'var(--text2)', marginLeft: 6 }}>to see your match score on every scholarship</span>
          </div>
          <a href="/profile" className="btn btn-primary btn-sm">Update Profile →</a>
        </div>
      )}
      {/* Search always visible */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Search scholarships..." style={{ flex: 1 }} />
        <button
          className="btn btn-ghost filter-accordion-toggle"
          style={{ display: 'none', gap: 6, flexShrink: 0 }}
          onClick={() => setFiltersOpen((v) => !v)}
        >
          ⚙ Filters{activeFilterCount > 0 && <span className="nav-badge" style={{ background: 'var(--primary)', color: '#1A0F00' }}>{activeFilterCount}</span>}
        </button>
      </div>

      {/* Desktop filter row */}
      <div className="filter-row" style={{ marginBottom: 24, display: 'flex' }} id="desktop-filters">
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All Courses</option>
          {COURSES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Mobile filter accordion */}
      <div className={`filter-accordion-body ${filtersOpen ? 'open' : ''}`} style={{ marginBottom: filtersOpen ? 16 : 0 }}>
        <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}>
          <option value="">All Courses</option>
          {COURSES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      ) : displayList.length === 0 ? (
        <EmptyState icon="🔍" title="No scholarships found" sub="Try adjusting your filters or search term" />
      ) : (
        <div className="scholarship-grid">
          {displayList.map((s) => (
            <div key={s.id} style={{ position: 'relative' }}>
              {/* Match score badge */}
              {profileFilled && s.matchScore > 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12, zIndex: 2,
                  background: s.matchScore >= 80 ? 'rgba(16,185,129,0.15)' : s.matchScore >= 50 ? 'rgba(245,166,35,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${s.matchScore >= 80 ? 'rgba(16,185,129,0.35)' : s.matchScore >= 50 ? 'rgba(245,166,35,0.35)' : 'var(--border)'}`,
                  borderRadius: 99, padding: '3px 10px',
                  fontSize: 11, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: s.matchScore >= 80 ? 'var(--emerald)' : s.matchScore >= 50 ? 'var(--primary-h)' : 'var(--text3)',
                }}>
                  {s.matchScore}% match
                </div>
              )}
              <ScholarshipCard
                s={s}
                applied={appliedIds.has(s.id)}
                onClick={setSelected}
              />
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected?.provider}
        size="lg"
        footer={
          selected && (
            <>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
              {appliedIds.has(selected?.id) ? (
                <span className="tag tag-emerald" style={{ padding: '8px 16px', fontSize: 13 }}>✓ Already Applied</span>
              ) : (
                <button className="btn btn-primary" onClick={() => apply(selected.id)} disabled={applying}>
                  {applying ? <><Spinner size={16} color="#fff" /> Applying...</> : '⚡ Apply Now'}
                </button>
              )}
            </>
          )
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Match score bar in modal */}
            {profileFilled && selectedWithScore.matchScore > 0 && (
              <div style={{ background: selectedWithScore.matchScore >= 80 ? 'rgba(16,185,129,0.07)' : 'rgba(245,166,35,0.07)', border: `1px solid ${selectedWithScore.matchScore >= 80 ? 'rgba(16,185,129,0.2)' : 'rgba(245,166,35,0.2)'}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)' }}>
                    {selectedWithScore.matchScore >= 80 ? '🌟 Great match for you!' : selectedWithScore.matchScore >= 50 ? '👍 Decent match' : '⚠️ Partial match'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)' }}>{selectedWithScore.matchScore}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedWithScore.matchScore}%`, background: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'linear-gradient(90deg, var(--primary), var(--amber))', borderRadius: 99, transition: 'width 0.8s' }} />
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <AmountChip amount={selected.amount} />
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.categories?.map((c) => <span key={c} className="tag tag-primary">{c}</span>)}
                {selected.courses?.slice(0, 3).map((c) => <span key={c} className="tag tag-neutral">{c}</span>)}
                {selected.gender !== 'All' && <span className="tag tag-rose">{selected.gender}</span>}
                {selected.disability && <span className="tag tag-amber">PwD</span>}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Description</div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>{selected.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Eligibility</div>
                <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.eligibility}</p>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Benefits</div>
                <p style={{ fontSize: 13.5, color: 'var(--text2)', lineHeight: 1.6 }}>{selected.benefits}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Min. Marks', value: `${selected.minMarks}%` },
                { label: 'Max. Income', value: `₹${(selected.maxIncome / 100000).toFixed(1)}L/yr` },
                { label: 'Deadline', value: new Date(selected.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Location', value: selected.location },
                { label: 'Applicants', value: selected.applicants?.toLocaleString() },
                { label: 'Gender', value: selected.gender },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text1)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
