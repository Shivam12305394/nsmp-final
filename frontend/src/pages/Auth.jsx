import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import toast from 'react-hot-toast';
import api from '../utils/api';

function AuthShell({ children, title, subtitle, step, totalSteps }) {
  return (
    <div className="auth-page" style={{ position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(52,211,153,0.14), transparent 70%)', top: -200, right: -100, borderRadius: '50%', animation: 'orbFloat 20s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 400, height: 400, background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)', bottom: -100, left: -100, borderRadius: '50%', animation: 'orbFloat 25s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)' }} />
      </div>

      <div className="auth-card" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary) 0%, var(--teal) 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 14, boxShadow: '0 10px 28px rgba(52,211,153,0.28), inset 0 1px 0 rgba(255,255,255,0.18)', animation: 'logoFloat 3s ease-in-out infinite', color: '#04221d' }}>🎓</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800, color: 'var(--text1)' }}>NSMP</span>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, background: 'var(--primary-dim)', color: 'var(--primary-h)', border: '1px solid rgba(52,211,153,0.22)', borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)' }}>PORTAL</span>
          </div>
          <h1 className="auth-title" style={{ marginBottom: 4 }}>{title}</h1>
          <p className="auth-sub" style={{ marginBottom: 0 }}>{subtitle}</p>
        </div>

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
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password });
      const { token, user } = res.data;
      localStorage.setItem('nsmp_token', token);
      localStorage.setItem('nsmp_user', JSON.stringify(user));
      updateUser(user);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! 👋`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in to continue your scholarship journey">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" type="email" placeholder="you@example.com"
            value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: 'relative' }}>
            <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              required style={{ paddingRight: 44 }} />
            <button type="button" onClick={() => setShowPass(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: -6 }}>
          <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--primary-h)', fontWeight: 600, textDecoration: 'none' }}>
            Forgot Password?
          </Link>
        </div>

        <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? <><Spinner size={18} color="#fff" /> Signing in...</> : 'Sign In'}
        </button>
      </form>

      <div style={{ margin: '16px 0', padding: '12px 16px', background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔑</span>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>Demo Admin Access</div>
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
  const { updateUser } = useAuth();
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
      await api.post('/auth/send-otp', form);
      toast.success('OTP sent to your email! 📧');
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
      const { token, user } = res.data;
      localStorage.setItem('nsmp_token', token);
      localStorage.setItem('nsmp_user', JSON.stringify(user));
      updateUser(user);
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
      subtitle={step === 1 ? 'Create your account and unlock smarter scholarship recommendations' : `Check your inbox — OTP sent to ${form.email}`}
      step={step}
      totalSteps={2}
    >
      {step === 1 ? (
        <form onSubmit={sendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder="Your full name" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                required minLength={6} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone <span style={{ color: 'var(--text4)', fontWeight: 400 }}>(optional)</span></label>
            <input className="form-input" type="tel" placeholder="10-digit mobile number" value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Sending OTP...</> : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--primary-h)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>📧</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Check your inbox</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>OTP sent to <strong style={{ color: 'var(--text2)' }}>{form.email}</strong></div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Enter 6-Digit OTP</label>
            <input
              className="form-input"
              placeholder="______"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              style={{ letterSpacing: 14, fontSize: 28, textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading || otp.length < 6} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Verifying...</> : 'Verify & Create Account'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => { setStep(1); setOtp(''); }}>← Back</button>
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

// ── FORGOT PASSWORD (3-step: email → OTP → new password) ──
export function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const sendResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Reset OTP sent to your email! 📧');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const verifyResetOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      toast.success('OTP verified! Set your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    }
    setLoading(false);
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! 🎉');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
    setLoading(false);
  };

  return (
    <AuthShell
      title={step === 1 ? 'Forgot Password' : step === 2 ? 'Verify OTP' : 'Set New Password'}
      subtitle={
        step === 1 ? 'Enter your registered email to receive a reset code' :
        step === 2 ? `OTP sent to ${email} — check your inbox` :
        'Create a strong new password for your account'
      }
      step={step}
      totalSteps={3}
    >
      {step === 1 && (
        <form onSubmit={sendResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Sending...</> : 'Send Reset Code'}
          </button>
          <Link to="/login" className="btn btn-ghost btn-block" style={{ textAlign: 'center', textDecoration: 'none' }}>← Back to Login</Link>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={verifyResetOtp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: 'var(--primary-h)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔐</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Check your inbox</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Reset code sent to <strong style={{ color: 'var(--text2)' }}>{email}</strong></div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Enter 6-Digit OTP</label>
            <input
              className="form-input"
              placeholder="______"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoFocus
              style={{ letterSpacing: 14, fontSize: 28, textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-mono)' }}
              required
            />
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading || otp.length < 6} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Verifying...</> : 'Verify OTP'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => { setStep(1); setOtp(''); }}>← Back</button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={resetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Min 6 characters"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                required minLength={6} autoFocus style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter new password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                required minLength={6} style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="form-error">Passwords do not match</p>
            )}
          </div>
          <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><Spinner size={18} color="#fff" /> Resetting...</> : 'Reset Password'}
          </button>
        </form>
      )}

      <p className="auth-switch" style={{ marginTop: 16 }}>
        Remember your password?{' '}
        <Link to="/login" style={{ color: 'var(--primary-h)', fontWeight: 600 }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
