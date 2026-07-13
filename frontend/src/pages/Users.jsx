import { useState } from 'react';
import { UsersAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState, StatusBadge, formatDate } from '../components/UI';
import { IconUsers, IconEdit, IconTrash, IconShield } from '../components/Icons';

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const { items, meta, setParams, setPage, loading, reload } = useApiList(UsersAPI.list, { sortBy: 'fullName', sortOrder: 'asc' });

  const [search, setSearch] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ fullName: '', role: 'STORE', isActive: true });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };
  const openEdit = (u) => { setForm({ fullName: u.fullName, role: u.role?.name || 'STORE', isActive: u.isActive }); setEditModal(u); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await UsersAPI.update(editModal.id, form);
      toast.success('User updated.');
      setEditModal(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await UsersAPI.remove(toDelete.id); toast.success('User deleted.'); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await UsersAPI.resetPassword(resetModal.id, { newPassword });
      toast.success(`Password reset for ${resetModal.fullName}.`);
      setResetModal(null);
      setNewPassword('');
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Users</h2>
          <div className="desc">Manage who can access Nadi, and their role.</div>
        </div>
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search users…" />
        <div className="filter-row">
          <select onChange={(e) => setParams({ role: e.target.value || undefined })}>
            <option value="">Any role</option>
            <option value="ADMIN">Admin</option>
            <option value="STORE">Store</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconUsers} title="No users found" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th /></tr></thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="cell-strong">{u.fullName}{u.id === me?.id && <span className="badge badge-blue" style={{ marginLeft: 6 }}>You</span>}</td>
                  <td className="text-muted">{u.email}</td>
                  <td><StatusBadge status={u.role?.name} /></td>
                  <td><Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="text-muted">{u.lastLogin ? formatDate(u.lastLogin, true) : 'Never'}</td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><IconEdit /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setResetModal(u)}><IconShield /></button>
                      {u.id !== me?.id && <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(u)}><IconTrash /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit ${editModal?.fullName || ''}`}
        footer={<><button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <form onSubmit={submit}>
          <div className="field"><label>Full name</label><input required minLength={3} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
          <div className="field"><label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="STORE">Store staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span>Account active</span></label>
        </form>
      </Modal>

      <Modal open={!!resetModal} onClose={() => setResetModal(null)} title={`Reset password · ${resetModal?.fullName || ''}`}
        footer={<><button className="btn btn-ghost" onClick={() => setResetModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submitReset} disabled={saving}>{saving ? 'Resetting…' : 'Reset password'}</button></>}>
        <form onSubmit={submitReset}>
          <div className="field"><label>New password</label><input required minLength={8} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete user" desc={`Delete ${toDelete?.fullName}'s account? This cannot be undone.`} />
    </>
  );
}
