import { NotificationAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useToast } from '../context/ToastContext';
import { Pagination, Spinner, EmptyState, Badge, formatDate } from '../components/UI';
import { IconBell, IconTrash } from '../components/Icons';

const TYPE_TONE = { LOW_STOCK: 'red', EXPIRY: 'amber', SYSTEM: 'gray', SALE: 'green', PURCHASE: 'blue', INFO: 'blue', WARNING: 'amber' };

export default function Notifications() {
  const toast = useToast();
  const { items, meta, setPage, loading, reload } = useApiList(NotificationAPI.list, { limit: 20 });

  const markRead = async (n) => {
    if (n.isRead) return;
    await NotificationAPI.markRead(n.id).catch((e) => toast.error(e.message));
    reload();
  };

  const remove = async (id) => {
    await NotificationAPI.remove(id).catch((e) => toast.error(e.message));
    reload();
  };

  const markAll = async () => {
    await NotificationAPI.markAll().catch((e) => toast.error(e.message));
    reload();
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Notifications</h2>
          <div className="desc">Low stock alerts, expiries, and system messages.</div>
        </div>
        <button className="btn btn-ghost" onClick={markAll}>Mark all read</button>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconBell} title="You're all caught up" desc="New notifications will show up here." />
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {items.map((n) => (
            <div key={n.id} onClick={() => markRead(n)} style={{
              display: 'flex', justifyContent: 'space-between', gap: 14, padding: '14px 20px',
              borderBottom: '1px solid var(--ink-100)', background: n.isRead ? 'white' : 'var(--amber-050)', cursor: 'pointer',
            }}>
              <div>
                <div className="flex-gap" style={{ marginBottom: 4 }}>
                  <Badge tone={TYPE_TONE[n.type] || 'gray'}>{n.type.replace('_', ' ')}</Badge>
                  <strong style={{ fontSize: 13.5 }}>{n.title}</strong>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-600)' }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginTop: 4 }}>{formatDate(n.createdAt, true)}</div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); remove(n.id); }}><IconTrash /></button>
            </div>
          ))}
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />
    </>
  );
}
