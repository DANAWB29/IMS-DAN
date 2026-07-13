import { useEffect, useState } from 'react';
import { ExpenseAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, Pagination, Spinner, EmptyState, StatusBadge, money, formatDate } from '../components/UI';
import { IconPlus, IconWallet, IconEdit, IconTrash, IconTag } from '../components/Icons';

const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'PAID'];

export default function Expenses() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const [tab, setTab] = useState('expenses');

  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(ExpenseAPI.list, { sortBy: 'expenseDate', sortOrder: 'desc' });
  const [categories, setCategories] = useState([]);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ title: '', amount: '', description: '', categoryId: '', expenseDate: '', status: 'PENDING' });
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [catModal, setCatModal] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '' });

  const loadCategories = () => ExpenseAPI.categories().then((r) => setCategories(r.data || []));
  useEffect(() => { loadCategories(); }, []);

  const openCreate = () => { setForm({ title: '', amount: '', description: '', categoryId: categories[0]?.id || '', expenseDate: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setModal({ mode: 'create' }); };
  const openEdit = (e) => { setForm({ title: e.title, amount: e.amount, description: e.description || '', categoryId: e.categoryId, expenseDate: e.expenseDate?.slice(0, 10), status: e.status }); setModal({ mode: 'edit', data: e }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (modal.mode === 'create') { await ExpenseAPI.create(payload); toast.success('Expense recorded.'); }
      else { await ExpenseAPI.update(modal.data.id, payload); toast.success('Expense updated.'); }
      setModal(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try { await ExpenseAPI.remove(toDelete.id); toast.success('Expense deleted.'); setToDelete(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ExpenseAPI.createCategory(catForm);
      toast.success('Expense category added.');
      setCatModal(false);
      setCatForm({ name: '', description: '' });
      loadCategories();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Expenses</h2>
          <div className="desc">Track and approve operating costs.</div>
        </div>
        {isAdmin && tab === 'expenses' && <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New expense</button>}
        {isAdmin && tab === 'categories' && <button className="btn btn-accent" onClick={() => setCatModal(true)}><IconPlus /> New category</button>}
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>Expenses</div>
        <div className={`tab ${tab === 'categories' ? 'active' : ''}`} onClick={() => setTab('categories')}>Categories</div>
      </div>

      {tab === 'expenses' && (
        <>
          <div className="table-toolbar">
            <div className="filter-row">
              <select value={params.categoryId || ''} onChange={(e) => setParams({ categoryId: e.target.value || undefined })}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={params.status || ''} onChange={(e) => setParams({ status: e.target.value || undefined })}>
                <option value="">Any status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {loading ? <Spinner /> : items.length === 0 ? (
            <EmptyState icon={IconWallet} title="No expenses recorded" desc="Log an expense to keep your books accurate." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th className="text-right">Amount</th>{isAdmin && <th />}</tr></thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id}>
                      <td className="cell-strong">{e.title}</td>
                      <td className="text-muted">{e.category?.name || '—'}</td>
                      <td className="text-muted">{formatDate(e.expenseDate)}</td>
                      <td><StatusBadge status={e.status} /></td>
                      <td className="text-right num">{money(e.amount)}</td>
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
        </>
      )}

      {tab === 'categories' && (
        categories.length === 0 ? <EmptyState icon={IconTag} title="No expense categories" desc="Add a category to start logging expenses." /> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Description</th></tr></thead>
              <tbody>
                {categories.map((c) => <tr key={c.id}><td className="cell-strong">{c.name}</td><td className="text-muted">{c.description || '—'}</td></tr>)}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New expense' : 'Edit expense'}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save expense'}</button></>}>
        <form onSubmit={submit}>
          <div className="field"><label>Title</label><input required minLength={2} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="form-row">
            <div className="field"><label>Amount</label><input required type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div className="field"><label>Date</label><input required type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></div>
          </div>
          <div className="field"><label>Category</label>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </form>
      </Modal>

      <Modal open={catModal} onClose={() => setCatModal(false)} title="New expense category"
        footer={<><button className="btn btn-ghost" onClick={() => setCatModal(false)}>Cancel</button><button className="btn btn-accent" onClick={submitCategory} disabled={saving}>{saving ? 'Saving…' : 'Save category'}</button></>}>
        <form onSubmit={submitCategory}>
          <div className="field"><label>Name</label><input required minLength={2} value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} /></div>
          <div className="field"><label>Description</label><textarea value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete expense" desc={`Delete "${toDelete?.title}"? This cannot be undone.`} />
    </>
  );
}
