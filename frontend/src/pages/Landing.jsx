import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BubbleBackground } from '../components/SplashScreen';

/* ── Animated counter hook ── */
function useCounter(target, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(ease * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return val;
}

/* ── Intersection observer hook ── */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

/* ── Floating scholarship card ── */
function FloatCard({ style, name, amount, match, delay }) {
  return (
    <div className="lp-float-card" style={{ ...style, animationDelay: delay }}>
      <div className="lp-float-card-top">
        <span className="lp-float-amount">{amount}</span>
        <span className="lp-float-match">{match}% match</span>
      </div>
      <div className="lp-float-name">{name}</div>
      <div className="lp-float-bar">
        <div className="lp-float-bar-fill" style={{ width: `${match}%` }} />
      </div>
    </div>
  );
}

/* ── Ticker ── */
const TICKER_ITEMS = [
  '🎉 Rahul from Bihar got ₹75,000 NSP scholarship',
  '✅ Priya from Tamil Nadu matched 94% with PM YASASVI',
  '🚀 Amit from UP applied to 3 scholarships in 2 minutes',
  '💰 Sneha from Maharashtra received ₹1.2L disbursement',
  '🎓 Kiran from Rajasthan found 8 matching scholarships',
  '⚡ 240+ students registered today',
];

function Ticker() {
  return (
    <div className="lp-ticker-wrap">
      <div className="lp-ticker-label">LIVE</div>
      <div className="lp-ticker-track">
        <div className="lp-ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span key={i} className="lp-ticker-item">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Stat card with counter ── */
function StatCard({ value, suffix, prefix, label, icon, color, start }) {
  const count = useCounter(value, 2200, start);
  return (
    <div className="lp-stat-card">
      <div className="lp-stat-icon" style={{ background: color }}>{icon}</div>
      <div className="lp-stat-value">
        {prefix}{count.toLocaleString('en-IN')}{suffix}
      </div>
      <div className="lp-stat-label">{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [statsRef, statsInView] = useInView(0.3);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    { icon: '🤖', color: 'rgba(245,166,35,0.15)', border: 'rgba(245,166,35,0.2)', title: 'AI-Powered Matching', text: '7-factor algorithm scores every scholarship against your profile and ranks by compatibility.' },
    { icon: '⚡', color: 'rgba(14,165,233,0.15)', border: 'rgba(14,165,233,0.2)', title: 'Instant Discovery', text: '500+ government scholarships in one place. Find in seconds what takes days to research.' },
    { icon: '📊', color: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.2)', title: 'Real-Time Tracking', text: 'Live application status updates. Know exactly where every application stands.' },
    { icon: '🔔', color: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.2)', title: 'Smart Alerts', text: 'Never miss a deadline. Instant notifications when your application status changes.' },
    { icon: '🛡️', color: 'rgba(244,63,94,0.15)', border: 'rgba(244,63,94,0.2)', title: 'Verified Data', text: 'All scholarships from official Ministry sources. Verified and updated regularly.' },
    { icon: '📱', color: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.2)', title: 'Mobile Ready', text: "Apply on any device. Fully responsive for India's mobile-first students." },
  ];

  return (
    <div className="lp-root">
      {/* ── Bubble background ── */}
      <BubbleBackground />
      
      {/* ── Mesh background ── */}
      <div className="lp-mesh" aria-hidden="true">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-grid" />
      </div>

      {/* ── NAV ── */}
      <nav className={`lp-nav${scrolled ? ' lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-icon">🎓</div>
          <span className="lp-nav-logo-text">NSMP</span>
          <span className="lp-nav-logo-badge">BETA</span>
        </div>
        <div style={{ flex: 1 }} />
        <div className="lp-nav-links">
          <span className="lp-nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</span>
          <span className="lp-nav-link" onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>How it works</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Sign In</button>
        <button className="btn btn-primary btn-sm lp-nav-cta" onClick={() => navigate('/register')}>
          Get Started Free →
        </button>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          {/* Left content */}
          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              <span>500+ Active Government Scholarships</span>
              <span className="lp-hero-badge-arrow">→</span>
            </div>

            <h1 className="lp-hero-title">
              Find Your Perfect<br />
              <span className="lp-hero-title-gradient">Scholarship</span>
              <br />with AI
            </h1>

            <p className="lp-hero-sub">
              India's most advanced scholarship discovery platform. AI-powered matching, one-click applications, real-time tracking — all in one place.
            </p>

            <div className="lp-hero-cta">
              <button className="btn btn-primary btn-lg lp-cta-primary" onClick={() => navigate('/register')}>
                <span>Start for Free</span>
                <span className="lp-cta-arrow">→</span>
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>
                Sign In
              </button>
            </div>

            <div className="lp-hero-trust">
              <div className="lp-trust-avatars">
                {['R','P','A','S','K'].map((l, i) => (
                  <div key={i} className="lp-trust-avatar" style={{ zIndex: 5 - i, marginLeft: i ? -10 : 0 }}>{l}</div>
                ))}
              </div>
              <div className="lp-trust-text">
                <span className="lp-trust-count">2.4L+ students</span> already matched
              </div>
            </div>
          </div>

          {/* Right — floating cards */}
          <div className="lp-hero-visual">
            <div className="lp-hero-visual-inner">
              <FloatCard
                style={{ top: '8%', left: '5%' }}
                delay="0s"
                name="NSP Pre-Matric Scholarship"
                amount="₹75,000"
                match={96}
              />
              <FloatCard
                style={{ top: '38%', right: '0%' }}
                delay="0.4s"
                name="PM YASASVI Scheme"
                amount="₹1,25,000"
                match={89}
              />
              <FloatCard
                style={{ bottom: '10%', left: '10%' }}
                delay="0.8s"
                name="Begum Hazrat Mahal"
                amount="₹10,000"
                match={82}
              />

              {/* Center glow orb */}
              <div className="lp-visual-orb" />

              {/* Match score ring */}
              <div className="lp-visual-ring">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(245,166,35,0.08)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#ringGrad)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray="314" strokeDashoffset="47"
                    transform="rotate(-90 60 60)" />
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F5A623" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="lp-visual-ring-label">
                  <span className="lp-visual-ring-pct">85%</span>
                  <span className="lp-visual-ring-sub">Avg Match</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticker */}
        <Ticker />
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats-section" ref={statsRef}>
        <div className="lp-stats-grid">
          <StatCard value={850} prefix="₹" suffix="Cr+" label="Total Scholarship Pool" icon="💰" color="rgba(245,166,35,0.15)" start={statsInView} />
          <StatCard value={240000} suffix="+" label="Students Registered" icon="🎓" color="rgba(14,165,233,0.15)" start={statsInView} />
          <StatCard value={98} suffix="%" label="Match Accuracy" icon="🎯" color="rgba(16,185,129,0.15)" start={statsInView} />
          <StatCard value={14} suffix="" label="Govt. Schemes Listed" icon="🏛️" color="rgba(139,92,246,0.15)" start={statsInView} />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section" id="how">
        <div className="lp-section-head">
          <div className="lp-eyebrow">Process</div>
          <h2 className="lp-section-title">How NSMP Works</h2>
          <p className="lp-section-sub">From profile to payout in three simple steps</p>
        </div>
        <div className="lp-steps">
          {[
            { n: '01', icon: '👤', title: 'Create Your Profile', text: 'Enter academic details, category, income, and course. Takes under 3 minutes.' },
            { n: '02', icon: '🤖', title: 'Get AI Recommendations', text: 'Our algorithm instantly matches you with the most relevant scholarships — sorted by fit score.' },
            { n: '03', icon: '💸', title: 'Apply & Get Funded', text: 'Apply in one click. Track your application and receive disbursement directly.' },
          ].map((s, i) => (
            <div key={s.n} className="lp-step">
              <div className="lp-step-num">{s.n}</div>
              <div className="lp-step-icon">{s.icon}</div>
              <div className="lp-step-title">{s.title}</div>
              <div className="lp-step-text">{s.text}</div>
              {i < 2 && <div className="lp-step-arrow">→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-section" id="features">
        <div className="lp-section-head">
          <div className="lp-eyebrow">Features</div>
          <h2 className="lp-section-title">Everything you need to succeed</h2>
          <p className="lp-section-sub">Powerful tools to find, apply, and track government scholarships</p>
        </div>
        <div className="lp-features-grid">
          {features.map((f) => (
            <div key={f.title} className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: f.color, borderColor: f.border }}>{f.icon}</div>
              <div className="lp-feature-title">{f.title}</div>
              <div className="lp-feature-text">{f.text}</div>
              <div className="lp-feature-shine" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-section">
        <div className="lp-cta-glow" />
        <div className="lp-cta-inner">
          <div className="lp-cta-emoji">🎓</div>
          <h2 className="lp-cta-title">Ready to find your scholarship?</h2>
          <p className="lp-cta-sub">Join thousands of students who discovered their scholarship matches on NSMP.</p>
          <div className="lp-cta-btns">
            <button className="btn btn-primary btn-lg lp-cta-primary" onClick={() => navigate('/register')}>
              Create Free Account →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/login')}>
              Sign In Instead
            </button>
          </div>
          <div className="lp-cta-note">✓ No credit card &nbsp;·&nbsp; ✓ Free forever &nbsp;·&nbsp; ✓ Govt. verified data</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <div className="lp-nav-logo-icon" style={{ width: 28, height: 28, fontSize: 12 }}>🎓</div>
          <span className="lp-nav-logo-text" style={{ fontSize: 13 }}>NSMP</span>
        </div>
        <div className="lp-footer-copy">© 2025 National Scholarship Matching Portal · Ministry of Education, GoI</div>
        <div className="lp-footer-links">
          {['Privacy', 'Terms', 'Contact'].map((t) => (
            <span key={t} className="lp-footer-link">{t}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
