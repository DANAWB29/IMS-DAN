import { useEffect, useState } from 'react';
import { PurchaseAPI, SupplierAPI, ProductAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, ConfirmDialog, Pagination, Spinner, EmptyState, StatusBadge, money, formatDate } from '../components/UI';
import { IconPlus, IconClipboard, IconTrash, IconCheck, IconWallet } from '../components/Icons';

const emptyItem = () => ({ productId: '', quantity: 1, unitCost: '', expiryDate: '', batchNumber: '' });

export default function Purchases() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(PurchaseAPI.list, { sortBy: 'createdAt', sortOrder: 'desc' });

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'CASH', reference: '', notes: '' });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const [form, setForm] = useState({ supplierId: '', notes: '', items: [emptyItem()] });

  useEffect(() => {
    SupplierAPI.list({ limit: 100, isActive: true }).then((r) => setSuppliers(r.data || []));
    ProductAPI.list({ limit: 200, isActive: true }).then((r) => setProducts(r.data || []));
  }, []);

  const openCreate = () => { setForm({ supplierId: '', notes: '', items: [emptyItem()] }); setCreateOpen(true); };
  const updateItem = (i, patch) => setForm((f) => ({ ...f, items: f.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }));
  const removeItem = (i) => setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  const total = form.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitCost) || 0), 0);

  const submitCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        supplierId: form.supplierId,
        notes: form.notes || undefined,
        items: form.items.map((it) => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
          expiryDate: it.expiryDate || undefined,
          batchNumber: it.batchNumber || undefined,
        })),
      };
      await PurchaseAPI.create(payload);
      toast.success('Purchase order created.');
      setCreateOpen(false);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (p) => {
    const fresh = await PurchaseAPI.get(p.id);
    setDetail(fresh.data);
  };

  const receive = async () => {
    setWorking(true);
    try {
      await PurchaseAPI.receive(detail.id, {});
      toast.success('Purchase received. Stock updated.');
      const fresh = await PurchaseAPI.get(detail.id);
      setDetail(fresh.data);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  const cancel = async () => {
    setWorking(true);
    try {
      await PurchaseAPI.cancel(cancelTarget.id);
      toast.success('Purchase cancelled.');
      setCancelTarget(null);
      setDetail(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  const submitPay = async (e) => {
    e.preventDefault();
    setWorking(true);
    try {
      await PurchaseAPI.pay(detail.id, { ...payForm, amount: Number(payForm.amount) });
      toast.success('Payment recorded.');
      setPayOpen(false);
      const fresh = await PurchaseAPI.get(detail.id);
      setDetail(fresh.data);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Purchase orders</h2>
          <div className="desc">Order stock from suppliers and receive it into inventory.</div>
        </div>
        {isAdmin && <button className="btn btn-accent" onClick={openCreate}><IconPlus /> New purchase order</button>}
      </div>

      <div className="table-toolbar">
        <div className="filter-row">
          <select value={params.status || ''} onChange={(e) => setParams({ status: e.target.value || undefined })}>
            <option value="">Any status</option>
            {['PENDING', 'RECEIVED', 'PARTIAL', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconClipboard} title="No purchase orders yet" desc="Create a purchase order to start receiving stock." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th className="mono">PO #</th><th>Supplier</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Paid</th><th>Created</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(p)}>
                  <td className="mono cell-strong">{p.purchaseNumber}</td>
                  <td>{p.supplier?.name}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="text-right num">{money(p.totalAmount)}</td>
                  <td className="text-right num text-muted">{money(p.paidAmount)}</td>
                  <td className="text-muted">{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New purchase order" wide
        footer={<>
          <button className="btn btn-ghost" onClick={() => setCreateOpen(false)}>Cancel</button>
          <button className="btn btn-accent" onClick={submitCreate} disabled={saving}>{saving ? 'Creating…' : `Create order · ${money(total)}`}</button>
        </>}
      >
        <form onSubmit={submitCreate}>
          <div className="field">
            <label>Supplier</label>
            <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <label>Line items</label>
          <div style={{ marginTop: 8 }}>
            {form.items.map((it, i) => (
              <div className="line-item-row" key={i}>
                <select required value={it.productId} onChange={(e) => updateItem(i, { productId: e.target.value })}>
                  <option value="">Product…</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input type="number" min="1" required placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(i, { quantity: e.target.value })} />
                <input type="number" min="0.01" step="0.01" required placeholder="Unit cost" value={it.unitCost} onChange={(e) => updateItem(i, { unitCost: e.target.value })} />
                <input type="date" value={it.expiryDate} onChange={(e) => updateItem(i, { expiryDate: e.target.value })} title="Expiry date (optional)" />
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(i)} disabled={form.items.length === 1}><IconTrash /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><IconPlus /> Add line item</button>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Purchase ${detail.purchaseNumber}` : ''} wide
        footer={detail && isAdmin ? (
          <>
            {detail.status === 'PENDING' && <button className="btn btn-danger" onClick={() => setCancelTarget(detail)}>Cancel order</button>}
            {(detail.status === 'PENDING' || detail.status === 'PARTIAL') && (
              <button className="btn btn-ghost" onClick={() => { setPayForm({ amount: (Number(detail.totalAmount) - Number(detail.paidAmount)).toFixed(2), paymentMethod: 'CASH', reference: '', notes: '' }); setPayOpen(true); }}>
                <IconWallet /> Record payment
              </button>
            )}
            {detail.status === 'PENDING' && <button className="btn btn-accent" onClick={receive} disabled={working}><IconCheck /> {working ? 'Receiving…' : 'Mark received'}</button>}
          </>
        ) : null}
      >
        {detail && (
          <>
            <div className="kv-grid" style={{ marginBottom: 16 }}>
              <div className="kv-item"><span>Supplier</span><strong>{detail.supplier?.name}</strong></div>
              <div className="kv-item"><span>Status</span><strong><StatusBadge status={detail.status} /></strong></div>
              <div className="kv-item"><span>Total</span><strong>{money(detail.totalAmount)}</strong></div>
              <div className="kv-item"><span>Paid</span><strong>{money(detail.paidAmount)}</strong></div>
              <div className="kv-item"><span>Created</span><strong>{formatDate(detail.createdAt, true)}</strong></div>
              <div className="kv-item"><span>Received</span><strong>{detail.receivedAt ? formatDate(detail.receivedAt, true) : '—'}</strong></div>
            </div>
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table>
                <thead><tr><th>Product</th><th>Batch</th><th className="text-right">Qty</th><th className="text-right">Unit cost</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {detail.items?.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product?.name}</td>
                      <td className="mono text-muted">{it.batch?.batchNumber || '—'}</td>
                      <td className="text-right num">{it.quantity}</td>
                      <td className="text-right num">{money(it.unitCost)}</td>
                      <td className="text-right num cell-strong">{money(it.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detail.payments?.length > 0 && (
              <>
                <label>Payments</label>
                <div className="table-wrap" style={{ marginTop: 8 }}>
                  <table>
                    <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th className="text-right">Amount</th></tr></thead>
                    <tbody>
                      {detail.payments.map((pay) => (
                        <tr key={pay.id}><td>{formatDate(pay.createdAt, true)}</td><td>{pay.paymentMethod}</td><td className="text-muted">{pay.reference || '—'}</td><td className="text-right num">{money(pay.amount)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {detail.notes && <p className="text-muted" style={{ marginTop: 14, fontSize: 13 }}>{detail.notes}</p>}
          </>
        )}
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record supplier payment"
        footer={<>
          <button className="btn btn-ghost" onClick={() => setPayOpen(false)}>Cancel</button>
          <button className="btn btn-accent" onClick={submitPay} disabled={working}>{working ? 'Recording…' : 'Record payment'}</button>
        </>}
      >
        <form onSubmit={submitPay}>
          <div className="field"><label>Amount</label><input type="number" min="0.01" step="0.01" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
          <div className="field"><label>Method</label>
            <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
              {['CASH', 'CREDIT', 'BANK_TRANSFER', 'MOBILE_MONEY'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="field"><label>Reference</label><input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Optional" /></div>
        </form>
      </Modal>

      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={cancel} loading={working} title="Cancel purchase order" desc={`Cancel purchase order ${cancelTarget?.purchaseNumber}? This cannot be undone.`} />
    </>
  );
}
