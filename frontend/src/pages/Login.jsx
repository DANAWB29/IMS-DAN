import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from './AuthShell';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Every unit accounted for."
      sub="Nadi keeps stock, sales, purchasing and payroll in one clean ledger — from warehouse shelf to receipt."
    >
      <div className="auth-box">
        <h1>Welcome back</h1>
        <p className="sub">Sign in to your Nadi workspace.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <div className="hint" style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ color: 'var(--amber-600)', fontWeight: 600 }}>Forgot password?</Link>
            </div>
          </div>
          <button className="btn btn-accent" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="foot-link">
          New to Nadi? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </AuthShell>
  );
}
