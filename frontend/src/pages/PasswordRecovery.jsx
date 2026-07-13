import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthAPI } from '../api/resources';
import AuthShell from './AuthShell';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await AuthAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell headline="Locked out happens." sub="We'll email a secure reset link that expires in 15 minutes.">
      <div className="auth-box">
        <h1>Reset your password</h1>
        <p className="sub">Enter the email on your account.</p>
        {error && <div className="auth-error">{error}</div>}
        {sent ? (
          <div className="card" style={{ padding: 16, background: 'var(--green-100)', border: 'none' }}>
            <strong style={{ color: 'var(--green-600)' }}>Check your inbox</strong>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-700)' }}>
              If an account exists for {email}, a reset link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoFocus />
            </div>
            <button className="btn btn-accent" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <div className="foot-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: params.get('token') || '', password: '' });
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await AuthAPI.resetPassword(form);
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell headline="Almost there." sub="Set a new password to get back into your workspace.">
      <div className="auth-box">
        <h1>Set new password</h1>
        <p className="sub">Paste the token from your email if it wasn't pre-filled.</p>
        {error && <div className="auth-error">{error}</div>}
        {done ? (
          <div className="card" style={{ padding: 16, background: 'var(--green-100)', border: 'none' }}>
            <strong style={{ color: 'var(--green-600)' }}>Password reset. Redirecting to sign in…</strong>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Reset token</label>
              <input type="text" required value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
            </div>
            <div className="field">
              <label>New password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
              <div className="hint">8+ characters, with an uppercase letter, lowercase letter and a number.</div>
            </div>
            <button className="btn btn-accent" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
          </form>
        )}
        <div className="foot-link">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}
