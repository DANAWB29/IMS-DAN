import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StatusBadge, formatDate } from '../components/UI';
import { AuthAPI } from '../api/resources';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await AuthAPI.updateProfile({ fullName });
      await refreshUser();
      toast.success('Profile updated.');
    } catch (err) { toast.error(err.message); } finally { setSavingProfile(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await AuthAPI.changePassword(pwForm);
      toast.success('Password changed. Please sign back in on other devices.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.message); } finally { setSavingPw(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>My profile</h2>
          <div className="desc">Your account details and security settings.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="kv-grid" style={{ marginBottom: 18 }}>
            <div className="kv-item"><span>Email</span><strong>{user?.email}</strong></div>
            <div className="kv-item"><span>Role</span><strong><StatusBadge status={user?.role?.name} /></strong></div>
            <div className="kv-item"><span>Member since</span><strong>{formatDate(user?.createdAt)}</strong></div>
            <div className="kv-item"><span>Last login</span><strong>{user?.lastLogin ? formatDate(user.lastLogin, true) : '—'}</strong></div>
          </div>
          <form onSubmit={saveProfile}>
            <div className="field"><label>Full name</label><input required minLength={3} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <button className="btn btn-accent" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 15, marginBottom: 14 }}>Change password</h2>
          <form onSubmit={changePassword}>
            <div className="field"><label>Current password</label><input required type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} /></div>
            <div className="field"><label>New password</label><input required type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
              <div className="hint">8+ characters, with an uppercase letter, lowercase letter and a number.</div>
            </div>
            <div className="field"><label>Confirm new password</label><input required type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })} /></div>
            <button className="btn btn-accent" disabled={savingPw}>{savingPw ? 'Updating…' : 'Change password'}</button>
          </form>
        </div>
      </div>
    </>
  );
}
