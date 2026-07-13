import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ReportAPI, SalesAPI, ProductAPI } from '../api/resources';
import { Spinner, money, formatDate, StatusBadge, EmptyState } from '../components/UI';
import { IconBox, IconWallet, IconLayers, IconUsers, IconAlertTriangle, IconCalendar, IconReceipt, IconArrowUp } from '../components/Icons';

function Stat({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className={`stat-card ${tone || ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
      <div className="stat-icon"><Icon /></div>
    </div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    ReportAPI.dashboard().then((r) => setData(r.data)).catch((e) => setError(e.message));
  }, []);

  if (error) return <EmptyState icon={IconAlertTriangle} title="Couldn't load dashboard" desc={error} />;
  if (!data) return <Spinner />;

  const { counts, today, month, inventory, recentSales, recentActivities } = data;

  return (
    <>
      <div className="stat-grid">
        <Stat label="Today's revenue" value={money(today.revenue)} sub={`${today.sales} sale${today.sales === 1 ? '' : 's'} today`} icon={IconWallet} />
        <Stat label="This month" value={money(month.revenue)} sub={`${month.sales} sales`} icon={IconArrowUp} tone="good" />
        <Stat label="Inventory value" value={money(inventory.value)} sub={`${counts.products} active products`} icon={IconLayers} tone="info" />
        <Stat label="Needs attention" value={inventory.lowStockCount} sub={`${inventory.expiringCount} batches expiring soon`} icon={IconAlertTriangle} tone="warn" />
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Stat label="Categories" value={counts.categories} icon={IconBox} />
        <Stat label="Suppliers" value={counts.suppliers} icon={IconUsers} />
        <Stat label="Customers" value={counts.customers} icon={IconUsers} />
        <Stat label="Employees" value={counts.employees} icon={IconUsers} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Recent sales</h2>
              <div className="desc">Latest transactions across the store</div>
            </div>
            <Link to="/sales" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {recentSales.length === 0 ? (
            <EmptyState icon={IconReceipt} title="No sales yet" desc="Sales will show up here as they're recorded." />
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr><th>Invoice</th><th>Customer</th><th>Cashier</th><th>Items</th><th className="text-right">Total</th></tr>
                </thead>
                <tbody>
                  {recentSales.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.invoiceNumber}</td>
                      <td>{s.customer?.name || 'Walk-in'}</td>
                      <td>{s.employee?.firstName} {s.employee?.lastName}</td>
                      <td>{s.items?.length || 0}</td>
                      <td className="text-right num cell-strong">{money(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h2>Recent activity</h2>
              <div className="desc">System-wide audit trail</div>
            </div>
          </div>
          {recentActivities.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentActivities.slice(0, 8).map((a) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, fontSize: 12.5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber-500)', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ color: 'var(--ink-800)' }}>{a.description || a.action}</div>
                    <div style={{ color: 'var(--ink-400)', fontSize: 11 }}>{a.user?.fullName || 'System'} &middot; {formatDate(a.createdAt, true)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StoreDashboard() {
  const { user } = useAuth();
  const [today, setToday] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([SalesAPI.today(), ProductAPI.lowStock()])
      .then(([t, l]) => {
        setToday(t.data);
        setLowStock(Array.isArray(l.data) ? l.data.slice(0, 6) : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <>
      <div className="card" style={{ marginBottom: 18, background: 'var(--ink-900)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ color: 'var(--ink-300)', fontSize: 13 }}>Welcome back</div>
            <h2 style={{ color: 'white', fontSize: 22 }}>{user?.fullName}</h2>
          </div>
          <Link to="/sales/new" className="btn btn-accent">Start a new sale</Link>
        </div>
      </div>

      <div className="stat-grid">
        <Stat label="Sales today" value={today?._count?.id ?? 0} icon={IconReceipt} />
        <Stat label="Revenue today" value={money(today?._sum?.total)} icon={IconWallet} tone="good" />
        <Stat label="Discounts given" value={money(today?._sum?.discount)} icon={IconArrowUp} />
        <Stat label="Tax collected" value={money(today?._sum?.tax)} icon={IconCalendar} tone="info" />
      </div>

      <div className="card">
        <div className="section-head">
          <div>
            <h2>Low stock products</h2>
            <div className="desc">These items need restocking soon</div>
          </div>
          <Link to="/products?lowStock=true" className="btn btn-ghost btn-sm">View products</Link>
        </div>
        {lowStock.length === 0 ? (
          <EmptyState icon={IconBox} title="Stock levels look healthy" desc="No products are below their minimum threshold." />
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead><tr><th>Product</th><th className="mono">SKU</th><th className="text-right">Current</th><th className="text-right">Minimum</th></tr></thead>
              <tbody>
                {lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-strong">{p.name}</td>
                    <td className="mono">{p.sku}</td>
                    <td className="text-right num" style={{ color: 'var(--red-600)' }}>{p.currentStock}</td>
                    <td className="text-right num">{p.minimumStock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role?.name === 'ADMIN';
  return isAdmin ? <AdminDashboard /> : <StoreDashboard />;
}
