import React, { useState } from 'react';

// ── SPINNER ──
export function Spinner({ size = 20, color = 'currentColor' }) {
  return (
    <div className="spinner" style={{
      width: size, height: size,
      borderWidth: size > 24 ? 3 : 2,
      borderColor: `${color}30`,
      borderTopColor: color,
    }} />
  );
}

// ── ALERT ──
export function Alert({ type = 'info', children, onClose }) {
  const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', danger: '❌' };
  return (
    <div className={`alert alert-${type}`}>
      <span>{icons[type]}</span>
      <span style={{ flex: 1 }}>{children}</span>
      {onClose && <span className="alert-close" onClick={onClose}>✕</span>}
    </div>
  );
}

// ── BADGE ──
export function Badge({ status }) {
  return <span className={`badge badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

// ── MATCH RING ──
export function MatchRing({ score, size = 48 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#34D399' : score >= 60 ? '#22D3EE' : score >= 40 ? '#F59E0B' : '#F43F5E';

  return (
    <div className="match-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="match-ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="match-ring-fill"
          cx={size / 2} cy={size / 2} r={r}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="match-label" style={{ color }}>{score}%</div>
    </div>
  );
}

// ── STAT CARD ──
export function StatCard({ icon, value, label, change, changeDir, bg = 'var(--primary-dim)' }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bg, borderColor: 'var(--border)' }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {change !== undefined && (
        <div className={`stat-change ${changeDir || 'up'}`}>
          {changeDir === 'down' ? '↓' : '↑'} {change}
        </div>
      )}
    </div>
  );
}

// ── MODAL ──
export function Modal({ open, onClose, title, subtitle, children, footer, size = '' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal-${size}` : ''}`}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── CONFIRM DIALOG ──
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-rose' : 'btn-primary'}`} onClick={onConfirm}>{confirmLabel}</button>
      </>}
    >
      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

// ── EMPTY STATE ──
export function EmptyState({ icon = '🔍', title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}

// ── TOGGLE ──
export function Toggle({ checked, onChange, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track"><span className="toggle-thumb" /></span>
    </label>
  );
}

// ── TABS ──
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${active === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ── AMOUNT CHIP ──
export function AmountChip({ amount }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--primary-dim)',
      border: '1px solid var(--primary-glow)',
      borderRadius: 12,
      padding: '6px 14px',
    }}>
      <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>₹</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-h)', fontFamily: 'var(--font-display)' }}>
        {amount >= 100000 ? `${(amount / 100000).toFixed(1)}L` : `${(amount / 1000).toFixed(0)}K`}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text3)' }}>/yr</span>
    </div>
  );
}

// ── PROGRESS BAR ──
export function ProgressBar({ value, max = 100, color = 'var(--primary)' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ── SEARCH BAR ──
export function SearchBar({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div className="search-bar" style={style}>
      <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && (
        <span onClick={() => onChange('')} style={{ cursor: 'pointer', color: 'var(--text3)', fontSize: 12 }}>✕</span>
      )}
    </div>
  );
}

// ── SCHOLARSHIP CARD ──
export function ScholarshipCard({ s, onClick, applied, matchScore }) {
  const today = new Date();
  const deadline = new Date(s.deadline);
  const daysLeft = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  const urgent = daysLeft <= 30 && daysLeft > 0;
  const expired = daysLeft <= 0;

  return (
    <div className={`scholarship-card ${s.featured ? 'featured' : ''}`} onClick={() => onClick && onClick(s)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div>
          <div className="sc-amount">₹{s.amount.toLocaleString('en-IN')}</div>
          <div className="sc-name">{s.name}</div>
          <div className="sc-provider">{s.provider}</div>
        </div>
        {matchScore !== undefined && <MatchRing score={matchScore} />}
      </div>

      <div className="sc-tags">
        {s.source && s.source !== 'Government' && (
          <span className={`tag ${
            s.source === 'International' ? 'tag-amber' :
            s.source === 'Private' ? 'tag-rose' : 'tag-emerald'
          }`}>{s.source}</span>
        )}
        {s.categories.slice(0, 2).map((c) => (
          <span key={c} className="tag tag-primary">{c}</span>
        ))}
        {s.courses.slice(0, 2).map((c) => (
          <span key={c} className="tag tag-neutral">{c}</span>
        ))}
        {s.gender !== 'All' && <span className="tag tag-rose">{s.gender}</span>}
        {s.disability && <span className="tag tag-amber">PwD</span>}
      </div>

      <div className="sc-footer">
        <div className={`sc-deadline ${urgent ? 'urgent' : ''}`}>
          {expired ? '⛔ Expired' : urgent ? `⏰ ${daysLeft}d left` : `📅 ${deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>👥 {s.applicants?.toLocaleString()}</span>
          {applied && <span className="tag tag-emerald" style={{ fontSize: 10 }}>✓ Applied</span>}
        </div>
      </div>
    </div>
  );
}
