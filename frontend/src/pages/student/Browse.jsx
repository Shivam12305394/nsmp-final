import React, { useEffect, useState, useMemo } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ScholarshipCard, SearchBar, Modal, Spinner, AmountChip, EmptyState } from '../../components/ui';
import { scholarshipAPI, applicationAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

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
const SOURCES = ['', 'Government', 'State', 'Private', 'International'];
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
  const [source, setSource] = useState('');
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

  const sanitize = (str) => String(str || 'N/A').replace(/₹/g, 'Rs.').replace(/[^\x00-\x7F]/g, '');

  const downloadPDF = (s, matchScore) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(30, 30, 46);
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NSMP - Scholarship Details', 14, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('National Scholarship Matching Portal', 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageW - 14, 28, { align: 'right' });

    let y = 52;
    doc.setTextColor(30, 30, 46);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const nameLines = doc.splitTextToSize(s.name, pageW - 28);
    doc.text(nameLines, 14, y);
    y += nameLines.length * 8 + 2;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 120);
    doc.text(s.provider, 14, y);
    y += 10;

    if (matchScore !== undefined) {
      const scoreColor = matchScore >= 80 ? [52, 211, 153] : matchScore >= 50 ? [34, 211, 238] : [245, 158, 11];
      doc.setFillColor(...scoreColor);
      doc.roundedRect(14, y, 80, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`AI Match Score: ${matchScore}%`, 18, y + 9);
      y += 22;
    }

    const fields = [
      ['Amount', `Rs. ${s.amount.toLocaleString('en-IN')} per year`],
      ['Deadline', new Date(s.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Source', s.source || 'Government'],
      ['Location', s.location],
      ['Min. Marks', `${s.minMarks}%`],
      ['Max. Income', `Rs. ${(s.maxIncome / 100000).toFixed(1)} Lakh/year`],
      ['Gender', s.gender],
      ['Categories', s.categories?.join(', ')],
      ['Courses', s.courses?.join(', ')],
    ];

    doc.setDrawColor(220, 220, 235);
    doc.setLineWidth(0.3);
    doc.line(14, y, pageW - 14, y);
    y += 8;

    fields.forEach(([label, value]) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 120);
      doc.text(label.toUpperCase(), 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 46);
      doc.setFontSize(10);
      const valLines = doc.splitTextToSize(sanitize(value), pageW - 80);
      doc.text(valLines, 80, y);
      y += Math.max(valLines.length * 6, 8) + 2;
    });

    y += 4;
    doc.setDrawColor(220, 220, 235);
    doc.line(14, y, pageW - 14, y);
    y += 10;

    [['Eligibility Criteria', s.eligibility], ['Description', s.description], ['Benefits', s.benefits]].forEach(([heading, text]) => {
      if (!text) return;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 46);
      doc.text(heading, 14, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 80);
      const lines = doc.splitTextToSize(sanitize(text), pageW - 28);
      if (y + lines.length * 6 > 270) { doc.addPage(); y = 20; }
      doc.text(lines, 14, y);
      y += lines.length * 6 + 10;
    });

    doc.save(`${s.name.replace(/[^a-z0-9]/gi, '_')}_NSMP.pdf`);
    toast.success('PDF downloaded!');
  };

  // Attach match scores + filter by source + sort by match if selected
  const displayList = useMemo(() => {
    let list = scholarships.map((s) => ({ ...s, matchScore: calcMatch(s, profile) }));
    if (source) list = list.filter((s) => s.source === source);
    if (sort === 'match') return [...list].sort((a, b) => b.matchScore - a.matchScore);
    return list;
  }, [scholarships, profile, sort, source]);

  const appliedIds = new Set(myApps.map((a) => a.scholarshipId));
  const activeFilterCount = [category, course, sort, source].filter(Boolean).length;
  const selectedWithScore = selected ? { ...selected, matchScore: calcMatch(selected, profile) } : null;
  const featuredCount = displayList.filter((s) => s.featured).length;
  const appliedCount = displayList.filter((s) => appliedIds.has(s.id)).length;
  const topMatchCount = profileFilled ? displayList.filter((s) => s.matchScore >= 80).length : 0;
  const eligibleCount = profileFilled ? displayList.filter((s) => s.matchScore >= 50).length : 0;
  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setCourse('');
    setSource('');
    setSort('');
  };

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
      <div className="browse-shell">
        <div className="browse-hero card">
          <div className="browse-hero-body">
            <div>
              <div className="browse-hero-eyebrow">Discovery Workspace</div>
              <div className="browse-hero-title">Find the right scholarship faster, with clearer filters and smarter matching.</div>
              <div className="browse-hero-copy">
                Explore curated programs, compare fit instantly, and focus on opportunities that actually match your profile.
              </div>
            </div>

            <div className="browse-hero-metrics">
              <div className="browse-hero-stat">
                <div className="browse-hero-stat-value">{displayList.length}</div>
                <div className="browse-hero-stat-label">Visible Results</div>
              </div>
              <div className="browse-hero-stat">
                <div className="browse-hero-stat-value">{featuredCount}</div>
                <div className="browse-hero-stat-label">Featured</div>
              </div>
              <div className="browse-hero-stat">
                <div className="browse-hero-stat-value">{profileFilled ? topMatchCount : appliedCount}</div>
                <div className="browse-hero-stat-label">{profileFilled ? 'Top Matches' : 'Applied'}</div>
              </div>
            </div>
          </div>
        </div>

      {/* Profile incomplete nudge */}
      {!profileFilled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(34,211,238,0.06))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 14, padding: '14px 20px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, var(--primary), transparent)' }} />
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>i</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--primary-h)', fontSize: 13.5 }}>Complete your profile to unlock match scores</div>
            <div style={{ fontSize: 12.5, color: 'var(--text2)', marginTop: 2 }}>See exactly how well each scholarship fits you</div>
          </div>
          <a href="/profile" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>Update Profile</a>
        </div>
      )}
      <div className="browse-filter-card card">
        <div className="card-header">
          <span className="card-title">Refine Search</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeFilterCount > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>{activeFilterCount} active</span>}
            <button
              className="btn btn-ghost filter-accordion-toggle"
              style={{ display: 'none', gap: 6, flexShrink: 0 }}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Filters{activeFilterCount > 0 && <span className="nav-badge" style={{ background: 'var(--primary)', color: '#eef2ff' }}>{activeFilterCount}</span>}
            </button>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search scholarships, ministries, programmes..." style={{ flex: 1 }} />
            {activeFilterCount > 0 && (
              <button className="btn btn-ghost" onClick={clearFilters} style={{ whiteSpace: 'nowrap' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Desktop filter row */}
          <div className="filter-row browse-filter-grid" style={{ marginBottom: 0, display: 'flex' }} id="desktop-filters">
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All Courses</option>
              {COURSES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">All Sources</option>
              {SOURCES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Mobile filter accordion */}
          <div className={`filter-accordion-body ${filtersOpen ? 'open' : ''}`} style={{ marginBottom: filtersOpen ? 0 : 0 }}>
            <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">All Courses</option>
              {COURSES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="form-select" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">All Sources</option>
              {SOURCES.filter(Boolean).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select className="form-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {(search || category || course || sort) && (
            <div className="browse-active-filters">
              {search && <span className="tag tag-neutral">Search: {search}</span>}
              {category && <span className="tag tag-primary">{category}</span>}
              {course && <span className="tag tag-neutral">{course}</span>}
              {source && <span className="tag tag-amber">{source}</span>}
              {sort && <span className="tag tag-emerald">{SORTS.find((s) => s.value === sort)?.label || sort}</span>}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}><Spinner size={32} /></div>
      ) : displayList.length === 0 ? (
        <EmptyState icon="🔍" title="No scholarships found" sub="Try adjusting your filters or search term" />
      ) : (
        <>
          <div className="browse-results-head">
            <div>
              <div className="browse-results-title">Scholarship Results</div>
              <div className="browse-results-sub">
                {profileFilled
                  ? `${eligibleCount} scholarships look reasonably aligned with your profile, including ${topMatchCount} strong matches.`
                  : 'Complete your profile to unlock personal fit scores and smarter prioritization.'}
              </div>
            </div>
            <div className="browse-results-side">
              <span className="tag tag-neutral">{appliedCount} applied</span>
              <span className="tag tag-emerald">{featuredCount} featured</span>
            </div>
          </div>

          <div className="scholarship-grid">
            {displayList.map((s) => (
              <div key={s._id || s.id} style={{ position: 'relative' }}>
                <ScholarshipCard
                  s={s}
                  applied={appliedIds.has(s._id || s.id)}
                  onClick={setSelected}
                  matchScore={profileFilled ? s.matchScore : undefined}
                />
              </div>
            ))}
          </div>
        </>
      )}
      </div>

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
              <button className="btn btn-ghost" onClick={() => downloadPDF(selected, profileFilled ? selectedWithScore?.matchScore : undefined)} style={{ gap: 6 }}>
                ⬇ Download PDF
              </button>
              {appliedIds.has(selected?._id || selected?.id) ? (
                <span className="tag tag-emerald" style={{ padding: '8px 16px', fontSize: 13 }}>Already Applied</span>
              ) : (
                <button className="btn btn-primary" onClick={() => apply(selected._id || selected.id)} disabled={applying}>
                  {applying ? <><Spinner size={16} color="#fff" /> Applying...</> : 'Apply Now'}
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
              <div style={{ background: selectedWithScore.matchScore >= 80 ? 'rgba(52,211,153,0.08)' : 'rgba(34,211,238,0.08)', border: `1px solid ${selectedWithScore.matchScore >= 80 ? 'rgba(52,211,153,0.2)' : 'rgba(34,211,238,0.18)'}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)' }}>
                    {selectedWithScore.matchScore >= 80 ? 'Excellent fit for your profile' : selectedWithScore.matchScore >= 50 ? 'Good fit for your profile' : 'Partial fit for your profile'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 15, color: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'var(--primary-h)' }}>{selectedWithScore.matchScore}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${selectedWithScore.matchScore}%`, background: selectedWithScore.matchScore >= 80 ? 'var(--emerald)' : 'linear-gradient(90deg, var(--primary), var(--teal))', borderRadius: 99, transition: 'width 0.8s' }} />
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

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[
                { label: 'Min. Marks', value: `${selected.minMarks}%` },
                { label: 'Max. Income', value: `₹${(selected.maxIncome / 100000).toFixed(1)}L/yr` },
                { label: 'Deadline', value: new Date(selected.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Source', value: selected.source || 'Government' },
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
