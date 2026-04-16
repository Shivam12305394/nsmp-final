import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import api from '../utils/api';

// ── LOGIN ──
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-sub">Sign in to your NSMP account</p>

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
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-hint">
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>Admin: admin@nsmp.gov.in / admin123</span>
        </div>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Register here</Link>
        </p>
        <p className="auth-switch" style={{ marginTop: 16 }}>
          ← <Link to="/" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Back to Home</Link>
        </p>
      </div>
    </div>
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
      // Re-login to sync context
      await login(form.email, form.password);
      toast.success('Account created! Welcome to NSMP 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🎓</div>
        <h1 className="auth-title">{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
        <p className="auth-sub">
          {step === 1 ? 'Join NSMP and find your perfect scholarship' : `Enter the OTP sent to ${form.email}`}
        </p>

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
              <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Phone (optional)</label>
              <input className="form-input" type="tel" placeholder="10-digit mobile number" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <><Spinner size={18} color="#fff" /> Sending OTP...</> : 'Send OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--text2)' }}>
              📧 OTP sent to <strong style={{ color: 'var(--primary-h)' }}>{form.email}</strong> — check your inbox.
            </div>
            <div className="form-group">
              <label className="form-label">6-Digit OTP</label>
              <input
                className="form-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={{ letterSpacing: 8, fontSize: 22, textAlign: 'center', fontWeight: 700 }}
                required
              />
            </div>
            <button className="btn btn-primary btn-lg" type="submit" disabled={loading || otp.length < 6} style={{ marginTop: 4 }}>
              {loading ? <><Spinner size={18} color="#fff" /> Verifying...</> : 'Verify & Create Account'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
          </form>
        )}

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Sign in</Link>
        </p>
        <p className="auth-switch" style={{ marginTop: 16 }}>
          ← <Link to="/" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
