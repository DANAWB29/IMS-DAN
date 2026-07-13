import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SalesAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useToast } from '../context/ToastContext';
import { Modal, Pagination, Spinner, EmptyState, StatusBadge, money, formatDate } from '../components/UI';
import { IconReceipt, IconWallet, IconRefresh } from '../components/Icons';

export default function Sales() {
  const toast = useToast();
  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(SalesAPI.list, { sortBy: 'createdAt', sortOrder: 'desc' });

  const [detail, setDetail] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'CASH' });
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnLines, setReturnLines] = useState([]);
  const [working, setWorking] = useState(false);

  const openDetail = async (s) => {
    const fresh = await SalesAPI.get(s.id);
    setDetail(fresh.data);
  };

  const submitPay = async (e) => {
    e.preventDefault();
    setWorking(true);
    try {
      await SalesAPI.recordPayment(detail.id, { amount: Number(payForm.amount), paymentMethod: payForm.paymentMethod });
      toast.success('Payment recorded.');
      setPayOpen(false);
      const fresh = await SalesAPI.get(detail.id);
      setDetail(fresh.data);
      reload();
    } catch (err) { toast.error(err.message); } finally { setWorking(false); }
  };

  const openReturn = () => {
    setReturnLines(detail.items.map((it) => ({ saleItemId: it.id, name: it.product?.name, max: it.quantity, quantity: 0, reason: '' })));
    setReturnOpen(true);
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    const toSend = returnLines.filter((l) => Number(l.quantity) > 0);
    if (!toSend.length) { toast.error('Set a return quantity for at least one item.'); return; }
    setWorking(true);
    try {
      await SalesAPI.processReturn(detail.id, {
        items: toSend.map((l) => ({ saleItemId: l.saleItemId, quantity: Number(l.quantity), reason: l.reason || 'Customer return' })),
      });
      toast.success('Return processed.');
      setReturnOpen(false);
      setDetail(null);
      reload();
    } catch (err) { toast.error(err.message); } finally { setWorking(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Sales history</h2>
          <div className="desc">All recorded transactions and receipts.</div>
        </div>
        <Link to="/sales/new" className="btn btn-accent">New sale</Link>
      </div>

      <div className="table-toolbar">
        <div className="filter-row">
          <select value={params.paymentStatus || ''} onChange={(e) => setParams({ paymentStatus: e.target.value || undefined })}>
            <option value="">Any payment status</option>
            {['PAID', 'UNPAID', 'PARTIAL'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={params.startDate || ''} onChange={(e) => setParams({ startDate: e.target.value || undefined })} />
          <input type="date" value={params.endDate || ''} onChange={(e) => setParams({ endDate: e.target.value || undefined })} />
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconReceipt} title="No sales recorded" desc="Sales you record at the POS will appear here." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th className="mono">Invoice</th><th>Customer</th><th>Cashier</th><th>Date</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => openDetail(s)}>
                  <td className="mono cell-strong">{s.invoiceNumber}{s.isReturn && <span className="badge badge-red" style={{ marginLeft: 6 }}>Return</span>}</td>
                  <td>{s.customer?.name || 'Walk-in'}</td>
                  <td className="text-muted">{s.employee?.firstName} {s.employee?.lastName}</td>
                  <td className="text-muted">{formatDate(s.createdAt, true)}</td>
                  <td><StatusBadge status={s.paymentStatus} /></td>
                  <td className="text-right num">{money(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Sale ${detail.invoiceNumber}` : ''} wide
        footer={detail && !detail.isReturn ? (
          <>
            <button className="btn btn-ghost" onClick={openReturn}><IconRefresh /> Process return</button>
            {detail.paymentStatus !== 'PAID' && (
              <button className="btn btn-accent" onClick={() => { setPayForm({ amount: (Number(detail.total) - Number(detail.paidAmount)).toFixed(2), paymentMethod: 'CASH' }); setPayOpen(true); }}>
                <IconWallet /> Record payment
              </button>
            )}
          </>
        ) : null}
      >
        {detail && (
          <>
            <div className="kv-grid" style={{ marginBottom: 16 }}>
              <div className="kv-item"><span>Customer</span><strong>{detail.customer?.name || 'Walk-in'}</strong></div>
              <div className="kv-item"><span>Cashier</span><strong>{detail.employee?.firstName} {detail.employee?.lastName}</strong></div>
              <div className="kv-item"><span>Payment</span><strong>{detail.paymentMethod?.replace('_', ' ')}</strong></div>
              <div className="kv-item"><span>Status</span><strong><StatusBadge status={detail.paymentStatus} /></strong></div>
              <div className="kv-item"><span>Paid</span><strong>{money(detail.paidAmount)}</strong></div>
              <div className="kv-item"><span>Date</span><strong>{formatDate(detail.createdAt, true)}</strong></div>
            </div>
            <div className="table-wrap" style={{ marginBottom: 16 }}>
              <table>
                <thead><tr><th>Product</th><th className="text-right">Qty</th><th className="text-right">Unit price</th><th className="text-right">Discount</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {detail.items?.map((it) => (
                    <tr key={it.id}>
                      <td>{it.product?.name}</td>
                      <td className="text-right num">{it.quantity}</td>
                      <td className="text-right num">{money(it.unitPrice)}</td>
                      <td className="text-right num text-muted">{money(it.discount)}</td>
                      <td className="text-right num cell-strong">{money(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={4} className="text-right text-muted">Subtotal</td><td className="text-right num">{money(detail.subtotal)}</td></tr>
                  <tr><td colSpan={4} className="text-right text-muted">Discount</td><td className="text-right num">-{money(detail.discount)}</td></tr>
                  <tr><td colSpan={4} className="text-right text-muted">Tax</td><td className="text-right num">{money(detail.tax)}</td></tr>
                  <tr><td colSpan={4} className="text-right cell-strong">Total</td><td className="text-right num cell-strong">{money(detail.total)}</td></tr>
                </tfoot>
              </table>
            </div>
            {detail.notes && <p className="text-muted" style={{ fontSize: 13 }}>{detail.notes}</p>}
          </>
        )}
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record payment"
        footer={<><button className="btn btn-ghost" onClick={() => setPayOpen(false)}>Cancel</button><button className="btn btn-accent" onClick={submitPay} disabled={working}>{working ? 'Recording…' : 'Record payment'}</button></>}>
        <form onSubmit={submitPay}>
          <div className="field"><label>Amount</label><input type="number" min="0.01" step="0.01" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} /></div>
          <div className="field"><label>Method</label>
            <select value={payForm.paymentMethod} onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}>
              {['CASH', 'CREDIT', 'BANK_TRANSFER', 'MOBILE_MONEY'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Process return" wide
        footer={<><button className="btn btn-ghost" onClick={() => setReturnOpen(false)}>Cancel</button><button className="btn btn-danger" onClick={submitReturn} disabled={working}>{working ? 'Processing…' : 'Process return'}</button></>}>
        <form onSubmit={submitReturn}>
          {returnLines.map((l, i) => (
            <div className="line-item-row" key={l.saleItemId} style={{ gridTemplateColumns: '2fr 100px 2fr' }}>
              <div className="cell-strong">{l.name} <span className="cell-sub">(sold {l.max})</span></div>
              <input type="number" min="0" max={l.max} value={l.quantity} onChange={(e) => setReturnLines((ls) => ls.map((x, idx) => idx === i ? { ...x, quantity: e.target.value } : x))} />
              <input placeholder="Reason" value={l.reason} onChange={(e) => setReturnLines((ls) => ls.map((x, idx) => idx === i ? { ...x, reason: e.target.value } : x))} />
            </div>
          ))}
        </form>
      </Modal>
    </>
  );
}
