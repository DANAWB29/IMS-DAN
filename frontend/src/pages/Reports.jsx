import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { ReportAPI } from '../api/resources';
import { useToast } from '../context/ToastContext';
import { Spinner, EmptyState, money, formatDate } from '../components/UI';
import { IconChart } from '../components/Icons';

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
}

export default function Reports() {
  const toast = useToast();
  const [tab, setTab] = useState('sales');
  const [range, setRange] = useState(defaultRange());
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'sales') res = await ReportAPI.sales(range);
      else if (tab === 'inventory') res = await ReportAPI.inventory();
      else if (tab === 'employees') res = await ReportAPI.employees(range);
      else if (tab === 'expenses') res = await ReportAPI.expenses(range);
      else if (tab === 'profit-loss') res = await ReportAPI.profitLoss(range);
      setData((d) => ({ ...d, [tab]: res.data }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    if (!data[t]) setTimeout(run, 0);
  };

  const current = data[tab];

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Reports</h2>
          <div className="desc">Deep dives into sales, inventory, payroll and profitability.</div>
        </div>
      </div>

      <div className="tabs">
        {[['sales', 'Sales'], ['inventory', 'Inventory'], ['employees', 'Employee sales'], ['expenses', 'Expenses'], ['profit-loss', 'Profit & Loss']].map(([k, label]) => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => switchTab(k)}>{label}</div>
        ))}
      </div>

      {tab !== 'inventory' && (
        <div className="table-toolbar">
          <div className="filter-row">
            <input type="date" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} />
            <span className="text-muted">to</span>
            <input type="date" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} />
            <button className="btn btn-accent btn-sm" onClick={run} disabled={loading}>{loading ? 'Running…' : 'Run report'}</button>
          </div>
        </div>
      )}
      {tab === 'inventory' && (
        <div className="table-toolbar">
          <button className="btn btn-accent btn-sm" onClick={run} disabled={loading}>{loading ? 'Running…' : 'Refresh'}</button>
        </div>
      )}

      {loading ? <Spinner /> : !current ? (
        <EmptyState icon={IconChart} title="Run a report to see results" />
      ) : tab === 'sales' ? (
        <SalesReport rows={current} />
      ) : tab === 'inventory' ? (
        <InventoryReport rows={current} />
      ) : tab === 'employees' ? (
        <EmployeeReport rows={current} />
      ) : tab === 'expenses' ? (
        <ExpenseReport rows={current} />
      ) : (
        <ProfitLossReport row={current} />
      )}
    </>
  );
}

function SalesReport({ rows }) {
  if (!rows.length) return <EmptyState title="No sales in this range" />;
  const chartData = rows.map((r) => ({ date: formatDate(r.date), revenue: r.revenue, profit: r.profit }));
  return (
    <>
      <div className="card">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#e8823e" strokeWidth={2} dot={false} name="Revenue" />
            <Line type="monotone" dataKey="profit" stroke="#3f9463" strokeWidth={2} dot={false} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Date</th><th className="text-right">Sales</th><th className="text-right">Revenue</th><th className="text-right">Discounts</th><th className="text-right">Cost</th><th className="text-right">Profit</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{formatDate(r.date)}</td>
                <td className="text-right num">{r.salesCount}</td>
                <td className="text-right num">{money(r.revenue)}</td>
                <td className="text-right num text-muted">{money(r.discounts)}</td>
                <td className="text-right num text-muted">{money(r.totalCost)}</td>
                <td className="text-right num cell-strong">{money(r.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function InventoryReport({ rows }) {
  if (!rows.length) return <EmptyState title="No inventory data yet" />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Product</th><th className="mono">SKU</th><th>Category</th><th className="text-right">Stock</th><th className="text-right">Avg cost</th><th className="text-right">Value</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="cell-strong">{r.name}</td>
              <td className="mono">{r.sku}</td>
              <td className="text-muted">{r.category}</td>
              <td className="text-right num" style={{ color: r.currentStock < r.minimumStock ? 'var(--red-600)' : undefined }}>{r.currentStock}</td>
              <td className="text-right num text-muted">{money(r.avgCost)}</td>
              <td className="text-right num cell-strong">{money(r.inventoryValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeReport({ rows }) {
  if (!rows.length) return <EmptyState title="No sales attributed to employees in this range" />;
  const chartData = rows.map((r) => ({ name: `${r.firstName} ${r.lastName}`, revenue: r.revenue }));
  return (
    <>
      <div className="card">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-100)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="revenue" fill="#e8823e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th className="text-right">Sales</th><th className="text-right">Revenue</th><th className="text-right">Cost</th><th className="text-right">Profit</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="cell-strong">{r.firstName} {r.lastName}</td>
                <td className="text-right num">{r.salesCount}</td>
                <td className="text-right num">{money(r.revenue)}</td>
                <td className="text-right num text-muted">{money(r.totalCost)}</td>
                <td className="text-right num cell-strong">{money(r.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ExpenseReport({ rows }) {
  if (!rows.length) return <EmptyState title="No expenses in this range" />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Category</th><th className="text-right">Count</th><th className="text-right">Total</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}><td className="cell-strong">{r.category}</td><td className="text-right num">{r.count}</td><td className="text-right num cell-strong">{money(r.total)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfitLossReport({ row }) {
  if (!row || row.totalRevenue == null) return <EmptyState title="No data for this range" />;
  const items = [
    ['Total revenue', row.totalRevenue, false],
    ['Cost of goods sold', -row.totalCOGS, true],
    ['Gross profit', row.grossProfit, false],
    ['Operating expenses', -row.totalExpenses, true],
    ['Net profit', row.netProfit, false],
  ];
  return (
    <div className="card">
      {items.map(([label, value, negative], i) => (
        <div key={i} className="cart-total-row" style={{ fontSize: label.includes('profit') && !label.includes('Gross') ? 17 : 14, fontWeight: label.includes('Net') ? 700 : 500, borderTop: label === 'Net profit' ? '1px solid var(--ink-200)' : 'none', paddingTop: label === 'Net profit' ? 12 : 6, marginTop: label === 'Net profit' ? 8 : 0 }}>
          <span>{label}</span>
          <span className="num" style={{ color: negative ? 'var(--red-600)' : value < 0 ? 'var(--red-600)' : 'var(--ink-950)' }}>{money(value)}</span>
        </div>
      ))}
    </div>
  );
}
