import { useState } from 'react';
import { SupplierAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconTruck } from '../components/Icons';

const emptyForm = { name: '', phone: '', email: '', address: '', contactPerson: '', isActive: true };

export default function Suppliers() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { items, meta, setParams, setPage, loading, reload } = useApiList(SupplierAPI.list, { sortBy: 'name', sortOrder: 'asc' });

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };
  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (s) => { setForm({ name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', contactPerson: s.contactPerson || '', isActive: s.isActive }); setModal({ mode: 'edit', data: s }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await SupplierAPI.create(form);
        toast.success('Supplier added.');
      } else {
        await SupplierAPI.update(modal.data.id, form);
        toast.success('Supplier updated.');
      }
      setModal(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await SupplierAPI.remove(toDelete.id);
      toast.success('Supplier deleted.');
      setToDelete(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Suppliers</h2>
          <div className="desc">Vendors you purchase inventory from.</div>
        </div>
        {isAdmin && <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New supplier</button>}
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search suppliers…" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconTruck} title="No suppliers yet" desc="Add a supplier before recording purchases." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Contact person</th><th>Phone</th><th>Email</th><th>Status</th>{isAdmin && <th />}</tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td className="cell-strong">{s.name}</td>
                  <td className="text-muted">{s.contactPerson || '—'}</td>
                  <td className="mono">{s.phone || '—'}</td>
                  <td className="text-muted">{s.email || '—'}</td>
                  <td><Badge tone={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  {isAdmin && (
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(s)}><IconEdit /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(s)}><IconTrash /></button>
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

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'create' ? 'New supplier' : 'Edit supplier'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save supplier'}</button>
        </>}
      >
        <form onSubmit={submit}>
          <div className="field"><label>Company name</label><input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="field"><label>Contact person</label><input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="field"><label>Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          {modal?.mode === 'edit' && (
            <label className="checkbox-row"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /><span>Active</span></label>
          )}
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete supplier" desc={`Delete "${toDelete?.name}"? This cannot be undone.`} />
    </>
  );
}
