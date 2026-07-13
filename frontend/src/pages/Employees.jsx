import { useState } from 'react';
import { EmployeeAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState, money, formatDate } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../components/Icons';

const emptyForm = { firstName: '', lastName: '', phone: '', email: '', address: '', salary: '', hireDate: '', position: '', department: '' };

export default function Employees() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { items, meta, setParams, setPage, loading, reload } = useApiList(EmployeeAPI.list, { sortBy: 'firstName', sortOrder: 'asc' });

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };
  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (e) => {
    setForm({
      firstName: e.firstName, lastName: e.lastName, phone: e.phone || '', email: e.email || '', address: e.address || '',
      salary: e.salary, hireDate: e.hireDate?.slice(0, 10), position: e.position || '', department: e.department || '',
    });
    setModal({ mode: 'edit', data: e });
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) };
      if (modal.mode === 'create') { await EmployeeAPI.create(payload); toast.success('Employee added.'); }
      else { await EmployeeAPI.update(modal.data.id, payload); toast.success('Employee updated.'); }
      setModal(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await EmployeeAPI.remove(toDelete.id); toast.success('Employee deleted.'); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Employees</h2>
          <div className="desc">Your team roster, roles and pay.</div>
        </div>
        {isAdmin && <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New employee</button>}
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search employees…" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconUsers} title="No employees yet" desc="Add your team to start tracking attendance and sales." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Position</th><th>Department</th><th>Phone</th><th className="text-right">Salary</th><th>Hired</th><th>Status</th>{isAdmin && <th />}</tr></thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id}>
                  <td className="cell-strong">{e.firstName} {e.lastName}</td>
                  <td className="text-muted">{e.position || '—'}</td>
                  <td className="text-muted">{e.department || '—'}</td>
                  <td className="mono">{e.phone || '—'}</td>
                  <td className="text-right num">{money(e.salary)}</td>
                  <td className="text-muted">{formatDate(e.hireDate)}</td>
                  <td><Badge tone={e.isActive ? 'green' : 'gray'}>{e.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  {isAdmin && (
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(e)}><IconEdit /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(e)}><IconTrash /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New employee' : 'Edit employee'} wide
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save employee'}</button></>}>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field"><label>First name</label><input required minLength={2} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div className="field"><label>Last name</label><input required minLength={2} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Position</label><input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></div>
            <div className="field"><label>Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Salary</label><input required type="number" min="0.01" step="0.01" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            <div className="field"><label>Hire date</label><input required type="date" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} /></div>
          </div>
          <div className="field"><label>Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete employee" desc={`Delete ${toDelete?.firstName} ${toDelete?.lastName}? This cannot be undone.`} />
    </>
  );
}
