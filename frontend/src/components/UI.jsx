import { useEffect } from 'react';
import { IconX, IconSearch, IconChevronLeft, IconChevronRight, IconBox, IconAlertTriangle } from './Icons';

export function Spinner() {
  return (
    <div className="spinner-wrap">
      <div className="spinner" />
    </div>
  );
}

export function EmptyState({ icon, title = 'Nothing here yet', desc = '', action = null }) {
  const Icon = icon || IconBox;
  return (
    <div className="empty-state">
      <Icon />
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <IconX />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', desc = '', confirmLabel = 'Delete', danger = true, loading = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-accent'}`} onClick={onConfirm} disabled={loading}>
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--red-600)', flexShrink: 0 }}>
          <IconAlertTriangle />
        </div>
        <p style={{ margin: 0, color: 'var(--ink-700)', fontSize: 13.5, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </Modal>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="search">
      <IconSearch />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function Badge({ tone = 'gray', children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Pagination({ page, totalPages, onChange, total, limit }) {
  if (!totalPages || totalPages <= 1) {
    return total ? (
      <div className="pagination">
        <span>{total} result{total === 1 ? '' : 's'}</span>
        <span />
      </div>
    ) : null;
  }
  const pages = [];
  const span = 2;
  for (let i = Math.max(1, page - span); i <= Math.min(totalPages, page + span); i++) pages.push(i);

  return (
    <div className="pagination">
      <span>
        Page {page} of {totalPages} &middot; {total} result{total === 1 ? '' : 's'}
      </span>
      <div className="pages">
        <button className="page-btn" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <IconChevronLeft />
        </button>
        {pages[0] > 1 && <span style={{ padding: '0 4px' }}>…</span>}
        {pages.map((p) => (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onChange(p)}>
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && <span style={{ padding: '0 4px' }}>…</span>}
        <button className="page-btn" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
}

export function money(value, currency = 'ETB') {
  const n = Number(value || 0);
  return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(d, withTime = false) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function StatusBadge({ status }) {
  const map = {
    PAID: 'green', UNPAID: 'red', PARTIAL: 'amber',
    PENDING: 'amber', RECEIVED: 'green', CANCELLED: 'red', APPROVED: 'green', REJECTED: 'red',
    PRESENT: 'green', ABSENT: 'red', LATE: 'amber', LEAVE: 'blue',
    ADMIN: 'blue', STORE: 'gray',
    active: 'green', inactive: 'gray',
  };
  const tone = map[status] || 'gray';
  return <Badge tone={tone}>{String(status).replace(/_/g, ' ')}</Badge>;
}
