import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../utils/api';
import { BubbleBackground } from '../SplashScreen';

const StudentNav = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/scholarships', icon: '🎓', label: 'Browse Scholarships' },
  { to: '/matches', icon: '✦', label: 'AI Matches' },
  { to: '/applications', icon: '📋', label: 'My Applications' },
  { to: '/profile', icon: '👤', label: 'Profile' },
  { to: '/documents', icon: '📎', label: 'Documents' },
];

const AdminNav = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/scholarships', icon: '🎓', label: 'Scholarships' },
  { to: '/applications', icon: '📋', label: 'Applications' },
  { to: '/students', icon: '👥', label: 'Students' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
  { to: '/fraud', icon: '🛡️', label: 'Fraud Detection' },
];

function NotificationPanel({ onClose }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    userAPI.getNotifications()
      .then((r) => setNotifs(r.data))
      .catch(() => {});
  }, []);

  const markRead = async (id) => {
    await userAPI.markRead(id).catch(() => {});
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAll = async () => {
    await userAPI.markAllRead().catch(() => {});
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const typeColors = { success: '#10B981', danger: '#F43F5E', info: '#38BDF8', warning: '#F59E0B' };

  return (
    <div className="notif-panel">
      <div className="notif-header">
        <div className="notif-title">Notifications</div>
        <button className="btn btn-ghost btn-sm" onClick={markAll}>Mark all read</button>
      </div>
      <div className="notif-list">
        {notifs.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications yet</div>
        ) : (
          notifs.map((n) => (
            <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`} onClick={() => markRead(n.id)}>
              <div className={`notif-dot-indicator ${n.read ? 'read' : 'unread'}`} />
              <div>
                <div className="notif-item-title" style={{ color: typeColors[n.type] || 'var(--text1)' }}>{n.title}</div>
                <div className="notif-item-msg">{n.message}</div>
                <div className="notif-item-time">{new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'admin' ? AdminNav : StudentNav;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  const avatarColors = ['#F5A623', '#0EA5E9', '#10B981', '#8B5CF6', '#F43F5E'];
  const avatarColor = avatarColors[(user?.name?.charCodeAt(0) || 0) % avatarColors.length];

  return (
    <>
      {mobileOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(2px)' }}
          onClick={onClose}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🎓</div>
          <div className="logo-text">
            <h2>NSMP</h2>
            <span>National Scholarship Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">{user?.role === 'admin' ? 'Admin Panel' : 'Student Portal'}</div>
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-card">
            <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)` }}>{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--emerald)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                {user?.role}
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({ title, subtitle, onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef();

  useEffect(() => {
    userAPI.getNotifications()
      .then((r) => setUnread(r.data.filter((n) => !n.read).length))
      .catch(() => {});
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="topbar">
      <button
        className="btn btn-ghost btn-icon"
        style={{ display: 'none', flexShrink: 0 }}
        id="menu-btn"
        onClick={onMenuClick}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>

      <div className="topbar-spacer" />

      <div style={{ position: 'relative' }} ref={panelRef}>
        <button className="notif-btn" onClick={() => setNotifOpen((v) => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unread > 0 && <div className="notif-dot" />}
        </button>
        {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
      </div>
    </header>
  );
}

export function AppLayout({ children, title, subtitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => setMenuOpen(false), [location]);

  // Show hamburger on small screens via CSS
  useEffect(() => {
    const btn = document.getElementById('menu-btn');
    if (!btn) return;
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => { btn.style.display = mq.matches ? 'flex' : 'none'; };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [location]);

  return (
    <div className="app-layout" style={{ position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <BubbleBackground />
      </div>
      <Sidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-area" style={{ position: 'relative', zIndex: 1 }}>
        <Topbar title={title} subtitle={subtitle} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
