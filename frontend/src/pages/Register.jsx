import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthShell from './AuthShell';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'STORE' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      headline="Set up your team's shelf-to-sale system."
      sub="Track products, batches, purchases and payroll with one account. Add teammates once you're in."
    >
      <div className="auth-box">
        <h1>Create your account</h1>
        <p className="sub">Get a Nadi workspace running in a minute.</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="field">
            <label>Full name</label>
            <input type="text" required minLength={3} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Amara Bekele" autoFocus />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@company.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
            <div className="hint">8+ characters, with an uppercase letter, lowercase letter and a number.</div>
          </div>
          <div className="field">
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STORE">Store staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <button className="btn btn-accent" style={{ width: '100%', marginTop: 6 }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <div className="foot-link">
          Already have a workspace? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}
