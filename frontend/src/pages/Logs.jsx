import { useState } from 'react';
import { LogAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { Pagination, Spinner, EmptyState, Badge, formatDate } from '../components/UI';
import { IconActivity } from '../components/Icons';

export default function Logs() {
  const [tab, setTab] = useState('activity');
  const activity = useApiList(LogAPI.activity, { sortBy: 'createdAt', sortOrder: 'desc' }, [tab]);
  const audit = useApiList(LogAPI.audit, { sortBy: 'createdAt', sortOrder: 'desc' }, [tab]);
  const current = tab === 'activity' ? activity : audit;

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Activity &amp; audit logs</h2>
          <div className="desc">A record of every meaningful action across the system.</div>
        </div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === 'activity' ? 'active' : ''}`} onClick={() => setTab('activity')}>Activity log</div>
        <div className={`tab ${tab === 'audit' ? 'active' : ''}`} onClick={() => setTab('audit')}>Audit log</div>
      </div>

      {current.loading ? <Spinner /> : current.items.length === 0 ? (
        <EmptyState icon={IconActivity} title="No log entries" />
      ) : tab === 'activity' ? (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Table</th><th>Description</th></tr></thead>
            <tbody>
              {activity.items.map((a) => (
                <tr key={a.id}>
                  <td className="text-muted">{formatDate(a.createdAt, true)}</td>
                  <td>{a.user?.fullName || 'System'}</td>
                  <td><Badge tone="blue">{a.action}</Badge></td>
                  <td className="mono text-muted">{a.tableName}</td>
                  <td className="text-muted">{a.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th><th>IP</th></tr></thead>
            <tbody>
              {audit.items.map((a) => (
                <tr key={a.id}>
                  <td className="text-muted">{formatDate(a.createdAt, true)}</td>
                  <td>{a.user?.fullName || 'System'}</td>
                  <td><Badge tone="blue">{a.action}</Badge></td>
                  <td className="mono text-muted">{a.resource}</td>
                  <td><Badge tone={a.status === 'SUCCESS' ? 'green' : 'red'}>{a.status}</Badge></td>
                  <td className="mono text-muted">{a.ipAddress || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={current.meta.page} totalPages={current.meta.totalPages} total={current.meta.total} onChange={current.setPage} />
    </>
  );
}
