import { useState } from 'react';
import { CustomerAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, SearchInput, Badge, Pagination, Spinner, EmptyState, money, formatDate, StatusBadge } from '../components/UI';
import { IconPlus, IconEdit, IconTrash, IconUsers } from '../components/Icons';

const emptyForm = { name: '', phone: '', email: '', address: '' };

export default function Customers() {
  const toast = useToast();
  const { items, meta, setParams, setPage, loading, reload } = useApiList(CustomerAPI.list, { sortBy: 'name', sortOrder: 'asc' });

  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const onSearch = (v) => { setSearch(v); setParams({ search: v }); };
  const openCreate = () => { setForm(emptyForm); setModal({ mode: 'create' }); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '' }); setModal({ mode: 'edit', data: c }); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await CustomerAPI.create(form);
        toast.success('Customer added.');
      } else {
        await CustomerAPI.update(modal.data.id, form);
        toast.success('Customer updated.');
      }
      setModal(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await CustomerAPI.remove(toDelete.id);
      toast.success('Customer deleted.');
      setToDelete(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setDeleting(false); }
  };

  const openHistory = async (c) => {
    setHistory({ customer: c, sales: [] });
    setHistoryLoading(true);
    try {
      const r = await CustomerAPI.history(c.id);
      setHistory(r.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Customers</h2>
          <div className="desc">People and businesses you sell to.</div>
        </div>
        <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New customer</button>
      </div>

      <div className="table-toolbar">
        <SearchInput value={search} onChange={onSearch} placeholder="Search customers…" />
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconUsers} title="No customers yet" desc="Add a customer to track their purchases and balances." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th className="text-right">Credit balance</th><th>Status</th><th /></tr></thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td className="cell-strong" style={{ cursor: 'pointer' }} onClick={() => openHistory(c)}>{c.name}</td>
                  <td className="mono">{c.phone || '—'}</td>
                  <td className="text-muted">{c.email || '—'}</td>
                  <td className="text-right num" style={{ color: Number(c.creditBalance) > 0 ? 'var(--red-600)' : undefined }}>{money(c.creditBalance)}</td>
                  <td><Badge tone={c.isActive ? 'green' : 'gray'}>{c.isActive ? 'Active' : 'Inactive'}</Badge></td>
                  <td>
                    <div className="flex-gap">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(c)}><IconEdit /></button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setToDelete(c)}><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === 'create' ? 'New customer' : 'Edit customer'}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save customer'}</button></>}>
        <form onSubmit={submit}>
          <div className="field"><label>Name</label><input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-row">
            <div className="field"><label>Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          </div>
          <div className="field"><label>Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </form>
      </Modal>

      <Modal open={!!history} onClose={() => setHistory(null)} title={history ? `Purchase history · ${history.customer?.name}` : ''} wide>
        {historyLoading ? <Spinner /> : (
          !history?.sales?.length ? <EmptyState title="No purchases yet" /> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th className="mono">Invoice</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {history.sales.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.invoiceNumber}</td>
                      <td className="text-muted">{formatDate(s.createdAt, true)}</td>
                      <td><StatusBadge status={s.paymentStatus} /></td>
                      <td className="text-right num cell-strong">{money(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} loading={deleting} title="Delete customer" desc={`Delete "${toDelete?.name}"? This cannot be undone.`} />
    </>
  );
}
