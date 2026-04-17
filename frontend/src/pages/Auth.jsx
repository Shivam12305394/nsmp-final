import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import api from '../utils/api';

function AuthShell({ children, title, subtitle, step, totalSteps }) {
  return (
    <div className="auth-page" style={{ position: 'relative' }}>
      {/* Animated background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(245,166,35,0.07), transparent 70%)', top: -200, right: -100, borderRadius: '50%', animation: 'orbFloat 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(14,165,233,0.06), transparent 70%)', bottom: -100, left: -100, borderRadius: '50%', animation: 'orbFloat 25s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary) 0%, #E8890A 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14, boxShadow: '0 8px 24px rgba(245,166,35,0.4), inset 0 1px 0 rgba(255,255,255,0.2)', animation: 'logoFloat 3s ease-in-out infinite' }}>🎓</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>NSMP</span>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, background: 'var(--primary-dim)', color: 'var(--primary-h)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>BETA</span>
          </div>
          <h1 className="auth-title" style={{ marginBottom: 4 }}>{title}</h1>
          <p className="auth-sub" style={{ marginBottom: 0 }}>{subtitle}</p>
        </div>

        {/* Step indicator */}
        {totalSteps && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} style={{ height: 3, borderRadius: 99, flex: 1, background: i < step ? 'var(--primary)' : 'var(--bg4)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

// ── LOGIN ──
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to your NSMP account">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <><Spinner size={18} color="#fff" /> Signing in...</> : 'Sign In →'}
        </button>
      </form>

      <div style={{ margin: '16px 0', padding: '12px 16px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔑</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Demo Admin</div>
          <span style={{ color: 'var(--text2)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>admin@nsmp.gov.in / admin123</span>
        </div>
      </div>

      <p className="auth-switch">
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Register here</Link>
      </p>
      <p className="auth-switch" style={{ marginTop: 10 }}>
        ← <Link to="/" style={{ color: 'var(--text3)', fontWeight: 500 }}>Back to Home</Link>
      </p>
    </AuthShell>
  );
}

// ── REGISTER (OTP flow) ──
export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', form);
      if (res.data.demoOtp) {
        setOtp(res.data.demoOtp);
        toast('📋 Email delivery failed. OTP auto-filled: ' + res.data.demoOtp, { duration: 8000, icon: '⚠️' });
      } else {
        toast.success('OTP sent to your email! 📧');
      }
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: form.email, otp });
      localStorage.setItem('nsmp_token', res.data.token);
      localStorage.setItem('nsmp_user', JSON.stringify(res.data.user));
      await login(form.email, form.password);
      toast.success('Account created! Welcome to NSMP 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={step === 1 ? 'Create Account' : 'Verify Email'}
      subtitle={step === 1 ? 'Join NSMP and find your perfect scholarship' : `OTP sent to ${form.email}`}
      step={step}
      totalSteps={2}
    >
      {step === 1 ? (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your full name" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span style={{ color: 'var(--text4)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" type="tel" placeholder="10-digit mobile number" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Sending OTP...</> : 'Send OTP →'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--teal-h)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>📧</span>
            <span>OTP sent to <strong>{form.email}</strong></span>
          </div>
          <div className="form-group">
            <label className="form-label">6-Digit OTP</label>
            <input
              className="form-input"
              placeholder="• • • • • •"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              style={{ letterSpacing: 12, fontSize: 26, textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading || otp.length < 6} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Verifying...</> : '✓ Verify & Create Account'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => setStep(1)}>← Back</button>
        </form>
      )}

      <p className="auth-switch" style={{ marginTop: 16 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Sign in</Link>
      </p>
      <p className="auth-switch" style={{ marginTop: 10 }}>
        ← <Link to="/" style={{ color: 'var(--text3)', fontWeight: 500 }}>Back to Home</Link>
      </p>
    </AuthShell>
  );
}
