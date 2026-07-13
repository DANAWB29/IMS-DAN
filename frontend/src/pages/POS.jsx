import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductAPI, CustomerAPI, EmployeeAPI, SalesAPI } from '../api/resources';
import { useToast } from '../context/ToastContext';
import { SearchInput, money, EmptyState } from '../components/UI';
import { IconCart, IconTrash, IconPlus, IconMinus, IconUsers } from '../components/Icons';

const PAYMENT_METHODS = ['CASH', 'CREDIT', 'BANK_TRANSFER', 'MOBILE_MONEY'];

export default function POS() {
  const toast = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // { productId, name, unitPrice, quantity, discount, unit, stock }
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [employeeId, setEmployeeId] = useState(() => localStorage.getItem('ims_last_employee') || '');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(15);
  const [paidAmount, setPaidAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  useEffect(() => {
    CustomerAPI.list({ limit: 200, isActive: true }).then((r) => setCustomers(r.data || []));
    EmployeeAPI.list({ limit: 200, isActive: true }).then((r) => setEmployees(r.data || []));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      ProductAPI.list({ search: query, limit: 25, isActive: true }).then((r) => setProducts(r.data || []));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (employeeId) localStorage.setItem('ims_last_employee', employeeId);
  }, [employeeId]);

  const addToCart = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        return c.map((i) => (i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { productId: p.id, name: p.name, unit: p.unit, unitPrice: Number(p.sellingPrice), quantity: 1, discount: 0 }];
    });
  };

  const updateLine = (productId, patch) => setCart((c) => c.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  const removeLine = (productId) => setCart((c) => c.filter((i) => i.productId !== productId));

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unitPrice * i.quantity - (Number(i.discount) || 0), 0), [cart]);
  const taxable = Math.max(0, subtotal - (Number(discount) || 0));
  const taxAmount = (taxable * (Number(taxRate) || 0)) / 100;
  const total = taxable + taxAmount;

  const resetCart = () => {
    setCart([]); setCustomerId(''); setDiscount(0); setPaidAmount(''); setNotes(''); setPaymentMethod('CASH');
  };

  const submit = async () => {
    if (!cart.length) { toast.error('Add at least one item to the cart.'); return; }
    if (!employeeId) { toast.error('Select which employee is processing this sale.'); return; }
    setSubmitting(true);
    try {
      const payload = {
        customerId: customerId || null,
        employeeId,
        paymentMethod,
        discount: Number(discount) || 0,
        taxRate: Number(taxRate) || 0,
        paidAmount: Number(paidAmount) || 0,
        notes: notes || undefined,
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: Number(i.discount) || 0 })),
      };
      const res = await SalesAPI.create(payload);
      toast.success(`Sale ${res.data.invoiceNumber} recorded.`);
      setLastReceipt(res.data);
      resetCart();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>New sale</h2>
          <div className="desc">Search products, build the cart, and check out.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/sales')}>Sales history</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div className="card">
          <SearchInput value={query} onChange={setQuery} placeholder="Search products by name, SKU or barcode…" />
          <div className="product-picker" style={{ marginTop: 12 }}>
            {products.length === 0 ? (
              <EmptyState title="No products found" desc="Try a different search term." />
            ) : products.map((p) => (
              <div key={p.id} className="product-pick-row" onClick={() => addToCart(p)}>
                <div>
                  <div className="cell-strong">{p.name}</div>
                  <div className="cell-sub mono">{p.sku} · {p.unit}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num cell-strong">{money(p.sellingPrice)}</div>
                  <div className="cell-sub">{p.category?.name}</div>
                </div>
              </div>
            ))}
          </div>

          <hr className="divider" />
          <label>Cart</label>
          {cart.length === 0 ? (
            <EmptyState icon={IconCart} title="Cart is empty" desc="Search and tap a product above to add it." />
          ) : (
            <div style={{ marginTop: 10 }}>
              {cart.map((i) => (
                <div key={i.productId} className="line-item-row" style={{ gridTemplateColumns: '2fr auto 90px 90px 32px', alignItems: 'center' }}>
                  <div>
                    <div className="cell-strong" style={{ fontSize: 13 }}>{i.name}</div>
                    <div className="cell-sub">{money(i.unitPrice)} / {i.unit}</div>
                  </div>
                  <div className="flex-gap">
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => updateLine(i.productId, { quantity: Math.max(1, i.quantity - 1) })}><IconMinus /></button>
                    <input type="number" min="1" value={i.quantity} onChange={(e) => updateLine(i.productId, { quantity: Number(e.target.value) || 1 })} style={{ width: 52, textAlign: 'center' }} />
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => updateLine(i.productId, { quantity: i.quantity + 1 })}><IconPlus /></button>
                  </div>
                  <input type="number" min="0" step="0.01" value={i.discount} onChange={(e) => updateLine(i.productId, { discount: e.target.value })} placeholder="Disc." title="Line discount" />
                  <div className="num text-right cell-strong">{money(i.unitPrice * i.quantity - (Number(i.discount) || 0))}</div>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLine(i.productId)}><IconTrash /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-panel">
          <div className="field">
            <label>Customer</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Served by</label>
            <select required value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select employee…</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            {employees.length === 0 && <div className="hint">No employees found — add one under Employees first.</div>}
          </div>
          <div className="form-row">
            <div className="field"><label>Order discount</label><input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} /></div>
            <div className="field"><label>Tax rate %</label><input type="number" min="0" max="100" step="0.5" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
          </div>
          <div className="field">
            <label>Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Amount paid now</label>
            <input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder={`Leave blank for full ${money(total)}`} />
            <div className="hint">Leave blank to auto-fill with the full total when submitting.</div>
          </div>

          <div className="cart-total-row"><span>Subtotal</span><span className="num">{money(subtotal)}</span></div>
          <div className="cart-total-row"><span>Discount</span><span className="num">-{money(discount)}</span></div>
          <div className="cart-total-row"><span>Tax</span><span className="num">{money(taxAmount)}</span></div>
          <div className="cart-total-row grand"><span>Total</span><span className="num">{money(total)}</span></div>

          <button
            className="btn btn-accent"
            style={{ width: '100%', marginTop: 14 }}
            disabled={submitting || cart.length === 0}
            onClick={() => { if (paidAmount === '') setPaidAmount(total.toFixed(2)); submit(); }}
          >
            {submitting ? 'Processing…' : `Complete sale · ${money(total)}`}
          </button>
        </div>
      </div>

      {lastReceipt && (
        <div className="card" style={{ marginTop: 20 }}>
          <div className="section-head">
            <div>
              <h2>Last receipt · {lastReceipt.invoiceNumber}</h2>
              <div className="desc">Sale completed successfully.</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/sales`)}>View all sales</button>
          </div>
          <div className="kv-grid">
            <div className="kv-item"><span>Customer</span><strong>{lastReceipt.customer?.name || 'Walk-in'}</strong></div>
            <div className="kv-item"><span>Total</span><strong>{money(lastReceipt.total)}</strong></div>
            <div className="kv-item"><span>Paid</span><strong>{money(lastReceipt.paidAmount)}</strong></div>
            <div className="kv-item"><span>Status</span><strong>{lastReceipt.paymentStatus}</strong></div>
          </div>
        </div>
      )}
    </>
  );
}
