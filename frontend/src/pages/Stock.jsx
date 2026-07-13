import { useEffect, useState } from 'react';
import { StockAPI, ProductAPI, SupplierAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, Pagination, Spinner, EmptyState, Badge, formatDate } from '../components/UI';
import { IconLayers, IconArrowUp, IconArrowDown, IconRefresh, IconCalendar, IconPlus } from '../components/Icons';

const TYPE_TONE = { STOCK_IN: 'green', STOCK_OUT: 'red', SALE: 'blue', RETURN: 'amber', ADJUSTMENT: 'gray', TRANSFER: 'gray' };

export default function Stock() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const [tab, setTab] = useState('movements');

  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(StockAPI.movements, { sortBy: 'createdAt', sortOrder: 'desc' });

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [expiringLoading, setExpiringLoading] = useState(true);

  const [modal, setModal] = useState(null); // 'in' | 'out' | 'adjust'
  const [saving, setSaving] = useState(false);
  const [inForm, setInForm] = useState({ productId: '', supplierId: '', quantity: '', buyingPrice: '', batchNumber: '', expiryDate: '', reason: '' });
  const [outForm, setOutForm] = useState({ productId: '', quantity: '', reason: '' });
  const [adjForm, setAdjForm] = useState({ productId: '', batchId: '', newQuantity: '', reason: '' });
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    ProductAPI.list({ limit: 200, isActive: true }).then((r) => setProducts(r.data || []));
    SupplierAPI.list({ limit: 100, isActive: true }).then((r) => setSuppliers(r.data || []));
  }, []);

  useEffect(() => {
    if (tab !== 'expiring') return;
    setExpiringLoading(true);
    StockAPI.expiring({ days: 30 }).then((r) => setExpiring(r.data || [])).finally(() => setExpiringLoading(false));
  }, [tab]);

  const loadBatches = async (productId) => {
    if (!productId) { setBatches([]); return; }
    const r = await StockAPI.batches(productId);
    setBatches(r.data || []);
  };

  const submitIn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await StockAPI.stockIn({ ...inForm, quantity: Number(inForm.quantity), buyingPrice: Number(inForm.buyingPrice), expiryDate: inForm.expiryDate || undefined, batchNumber: inForm.batchNumber || undefined, reason: inForm.reason || undefined });
      toast.success('Stock added.');
      setModal(null);
      setInForm({ productId: '', supplierId: '', quantity: '', buyingPrice: '', batchNumber: '', expiryDate: '', reason: '' });
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const submitOut = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await StockAPI.stockOut({ ...outForm, quantity: Number(outForm.quantity) });
      toast.success('Stock removed.');
      setModal(null);
      setOutForm({ productId: '', quantity: '', reason: '' });
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await StockAPI.adjustment({ ...adjForm, newQuantity: Number(adjForm.newQuantity) });
      toast.success('Stock adjusted.');
      setModal(null);
      setAdjForm({ productId: '', batchId: '', newQuantity: '', reason: '' });
      reload();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Stock &amp; batches</h2>
          <div className="desc">Movement history, batch tracking, and manual adjustments.</div>
        </div>
        {isAdmin && (
          <div className="flex-gap">
            <button className="btn btn-ghost" onClick={() => setModal('out')}><IconArrowDown /> Stock out</button>
            <button className="btn btn-ghost" onClick={() => setModal('adjust')}><IconRefresh /> Adjust</button>
            <button className="btn btn-accent" onClick={() => setModal('in')}><IconArrowUp /> Stock in</button>
          </div>
        )}
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'movements' ? 'active' : ''}`} onClick={() => setTab('movements')}>Movements</div>
        <div className={`tab ${tab === 'expiring' ? 'active' : ''}`} onClick={() => setTab('expiring')}>Expiring batches</div>
      </div>

      {tab === 'movements' && (
        <>
          <div className="table-toolbar">
            <div className="filter-row">
              <select value={params.type || ''} onChange={(e) => setParams({ type: e.target.value || undefined })}>
                <option value="">All types</option>
                {Object.keys(TYPE_TONE).map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <select value={params.productId || ''} onChange={(e) => setParams({ productId: e.target.value || undefined })}>
                <option value="">All products</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          {loading ? <Spinner /> : items.length === 0 ? (
            <EmptyState icon={IconLayers} title="No stock movements" desc="Movements appear here for every stock-in, sale, return and adjustment." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Product</th><th>Type</th><th className="text-right">Qty</th><th>Reason</th><th>By</th></tr></thead>
                <tbody>
                  {items.map((m) => (
                    <tr key={m.id}>
                      <td className="text-muted">{formatDate(m.createdAt, true)}</td>
                      <td className="cell-strong">{m.product?.name}</td>
                      <td><Badge tone={TYPE_TONE[m.type] || 'gray'}>{m.type.replace('_', ' ')}</Badge></td>
                      <td className="text-right num">{['STOCK_OUT', 'SALE'].includes(m.type) ? '-' : '+'}{Math.abs(m.quantity)}</td>
                      <td className="text-muted">{m.reason || '—'}</td>
                      <td className="text-muted">{m.employee ? `${m.employee.firstName} ${m.employee.lastName}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
        </>
      )}

      {tab === 'expiring' && (
        expiringLoading ? <Spinner /> : expiring.length === 0 ? (
          <EmptyState icon={IconCalendar} title="Nothing expiring soon" desc="Batches expiring within 30 days will show up here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th className="mono">Batch #</th><th className="text-right">Remaining</th><th>Expiry date</th></tr></thead>
              <tbody>
                {expiring.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-strong">{b.product?.name}</td>
                    <td className="mono">{b.batchNumber}</td>
                    <td className="text-right num">{b.remainingQty}</td>
                    <td><Badge tone="amber">{formatDate(b.expiryDate)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal open={modal === 'in'} onClose={() => setModal(null)} title="Stock in"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submitIn} disabled={saving}>{saving ? 'Saving…' : 'Add stock'}</button></>}>
        <form onSubmit={submitIn}>
          <div className="field"><label>Product</label>
            <select required value={inForm.productId} onChange={(e) => setInForm({ ...inForm, productId: e.target.value })}>
              <option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Supplier</label>
            <select required value={inForm.supplierId} onChange={(e) => setInForm({ ...inForm, supplierId: e.target.value })}>
              <option value="">Select supplier</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="field"><label>Quantity</label><input required type="number" min="1" value={inForm.quantity} onChange={(e) => setInForm({ ...inForm, quantity: e.target.value })} /></div>
            <div className="field"><label>Buying price</label><input required type="number" min="0.01" step="0.01" value={inForm.buyingPrice} onChange={(e) => setInForm({ ...inForm, buyingPrice: e.target.value })} /></div>
          </div>
          <div className="form-row">
            <div className="field"><label>Batch number</label><input value={inForm.batchNumber} onChange={(e) => setInForm({ ...inForm, batchNumber: e.target.value })} placeholder="Auto-generated if blank" /></div>
            <div className="field"><label>Expiry date</label><input type="date" value={inForm.expiryDate} onChange={(e) => setInForm({ ...inForm, expiryDate: e.target.value })} /></div>
          </div>
          <div className="field"><label>Reason / note</label><input value={inForm.reason} onChange={(e) => setInForm({ ...inForm, reason: e.target.value })} placeholder="Optional" /></div>
        </form>
      </Modal>

      <Modal open={modal === 'out'} onClose={() => setModal(null)} title="Stock out"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submitOut} disabled={saving}>{saving ? 'Saving…' : 'Remove stock'}</button></>}>
        <form onSubmit={submitOut}>
          <div className="field"><label>Product</label>
            <select required value={outForm.productId} onChange={(e) => setOutForm({ ...outForm, productId: e.target.value })}>
              <option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Quantity</label><input required type="number" min="1" value={outForm.quantity} onChange={(e) => setOutForm({ ...outForm, quantity: e.target.value })} /></div>
          <div className="field"><label>Reason</label><input required value={outForm.reason} onChange={(e) => setOutForm({ ...outForm, reason: e.target.value })} placeholder="Damaged, expired, internal use…" /></div>
        </form>
      </Modal>

      <Modal open={modal === 'adjust'} onClose={() => setModal(null)} title="Adjust stock"
        footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-accent" onClick={submitAdjust} disabled={saving}>{saving ? 'Saving…' : 'Apply adjustment'}</button></>}>
        <form onSubmit={submitAdjust}>
          <div className="field"><label>Product</label>
            <select required value={adjForm.productId} onChange={(e) => { setAdjForm({ ...adjForm, productId: e.target.value, batchId: '' }); loadBatches(e.target.value); }}>
              <option value="">Select product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Batch</label>
            <select required value={adjForm.batchId} onChange={(e) => setAdjForm({ ...adjForm, batchId: e.target.value })} disabled={!batches.length}>
              <option value="">{batches.length ? 'Select batch' : 'Select a product first'}</option>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.batchNumber} (remaining {b.remainingQty})</option>)}
            </select>
          </div>
          <div className="field"><label>New quantity</label><input required type="number" min="0" value={adjForm.newQuantity} onChange={(e) => setAdjForm({ ...adjForm, newQuantity: e.target.value })} /></div>
          <div className="field"><label>Reason</label><input required value={adjForm.reason} onChange={(e) => setAdjForm({ ...adjForm, reason: e.target.value })} placeholder="Stock count correction…" /></div>
        </form>
      </Modal>
    </>
  );
}
