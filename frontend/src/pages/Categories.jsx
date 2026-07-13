import { useState } from 'react';
import { CategoryAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState, formatDate } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconTag } from '../components/Icons';

export default function Categories() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(CategoryAPI.list, { sortBy: 'name', sortOrder: 'asc' });

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'create'|'edit', data }
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };

  const openCreate = () => { setForm({ name: '', description: '', isActive: true }); setModal({ mode: 'create' }); };
  const openEdit = (c) => { setForm({ name: c.name, description: c.description || '', isActive: c.isActive }); setModal({ mode: 'edit', data: c }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await CategoryAPI.create({ name: form.name, description: form.description || undefined });
        toast.success('Category created.');
      } else {
        await CategoryAPI.update(modal.data.id, form);
        toast.success('Category updated.');
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
      await CategoryAPI.remove(toDelete.id);
      toast.success('Category deleted.');
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
          <h2>Categories</h2>
          <div className="desc">Group products for easier browsing and reporting.</div>
        </div>
        {isAdmin && (
          <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New category</button>
        )}
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search categories…" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconTag} title="No categories yet" desc="Create your first category to start organizing products." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Description</th><th>Status</th><th>Created</th>{isAdmin && <th />}</tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="cell-strong">{c.name}</td>
                  <td className="text-muted">{c.description || '—'}</td>
                  <td><Badge tone={c.isActive ? 'green' : 'gray'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="text-muted">{formatDate(c.createdAt)}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}><IconEdit /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(c)}><IconTrash /></button>
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
        title={modal?.mode === 'create' ? 'New category' : 'Edit category'}
        footer={<>
          <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button>
        </>}
      >
        <form onSubmit={submit}>
          <div className="field">
            <label>Name</label>
            <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Beverages" />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes about this category" />
          </div>
          {modal?.mode === 'edit' && (
            <label className="checkbox-row">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              <span>Active</span>
            </label>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete category"
        desc={`Delete "${toDelete?.name}"? Products in this category won't be removed, but the category will no longer be selectable.`}
      />
    </>
  );
}
