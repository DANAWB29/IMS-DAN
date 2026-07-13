import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationAPI } from '../api/resources';
import {
  IconDashboard, IconBox, IconTag, IconTruck, IconClipboard, IconLayers, IconUsers,
  IconCart, IconWallet, IconReceipt, IconChart, IconBell, IconSettings, IconLogout,
  IconActivity, IconChevronDown,
} from './Icons';
import { formatDate } from './UI';

const NAV = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: IconDashboard, end: true }] },
  {
    group: 'Catalog', items: [
      { to: '/products', label: 'Products', icon: IconBox },
      { to: '/categories', label: 'Categories', icon: IconTag },
    ]
  },
  {
    group: 'Purchasing', items: [
      { to: '/suppliers', label: 'Suppliers', icon: IconTruck },
      { to: '/purchases', label: 'Purchase Orders', icon: IconClipboard },
      { to: '/stock', label: 'Stock & Batches', icon: IconLayers },
    ]
  },
  {
    group: 'Sales', items: [
      { to: '/sales/new', label: 'New Sale (POS)', icon: IconCart },
      { to: '/sales', label: 'Sales History', icon: IconReceipt },
      { to: '/customers', label: 'Customers', icon: IconUsers },
    ]
  },
  {
    group: 'Operations', items: [
      { to: '/expenses', label: 'Expenses', icon: IconWallet },
      { to: '/employees', label: 'Employees', icon: IconUsers },
      { to: '/attendance', label: 'Attendance', icon: IconClipboard },
    ]
  },
  {
    group: 'Insights', items: [
      { to: '/reports', label: 'Reports', icon: IconChart, adminOnly: true },
      { to: '/logs', label: 'Activity Logs', icon: IconActivity, adminOnly: true },
    ]
  },
  {
    group: 'System', items: [
      { to: '/users', label: 'Users', icon: IconUsers, adminOnly: true },
      { to: '/settings', label: 'Settings', icon: IconSettings },
    ]
  },
];

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || '?';
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  const isAdmin = user?.role?.name === 'ADMIN';

  const loadNotifications = () => {
    NotificationAPI.list({ limit: 8 })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setNotifications(list);
        setUnread(list.filter((n) => !n.isRead).length);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    const t = setInterval(loadNotifications, 45000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const markRead = async (n) => {
    if (!n.isRead) {
      await NotificationAPI.markRead(n.id).catch(() => {});
      loadNotifications();
    }
    if (n.link) navigate(n.link);
    setNotifOpen(false);
  };

  const currentTitle = (() => {
    const flat = NAV.flatMap((g) => g.items);
    const match = flat.find((i) => (i.end ? location.pathname === i.to : location.pathname.startsWith(i.to)));
    return match?.label || 'Nadi';
  })();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">N</div>
          <div className="brand-text">
            <strong>Nadi</strong>
            <span>Inventory OS</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {NAV.map((group) => {
            const visible = group.items.filter((i) => !i.adminOnly || isAdmin);
            if (!visible.length) return null;
            return (
              <div className="nav-group" key={group.group}>
                <div className="nav-label">{group.group}</div>
                {visible.map((item) => (
                  <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <item.icon />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer" ref={userRef} style={{ position: 'relative' }}>
          <div className="user-chip" onClick={() => setUserMenuOpen((v) => !v)}>
            <div className="avatar">{initials(user?.fullName)}</div>
            <div className="user-chip-text">
              <strong>{user?.fullName}</strong>
              <span>{user?.role?.name}</span>
            </div>
            <IconChevronDown style={{ width: 14, height: 14, marginLeft: 'auto', color: 'var(--ink-400)' }} />
          </div>
          {userMenuOpen && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 6,
              background: 'white', borderRadius: 10, boxShadow: 'var(--shadow-md)', overflow: 'hidden', border: '1px solid var(--ink-200)',
            }}>
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--ink-800)' }}
              >
                My profile
              </button>
              <button
                onClick={() => logout()}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--red-600)', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <IconLogout style={{ width: 15, height: 15 }} /> Sign out
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="main-col">
        <header className="topbar">
          <div>
            <h1>{currentTitle}</h1>
          </div>
          <div className="topbar-actions">
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="icon-btn" onClick={() => setNotifOpen((v) => !v)} aria-label="Notifications">
                <IconBell />
                {unread > 0 && <span className="badge-dot">{unread > 9 ? '9+' : unread}</span>}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%', width: 340, background: 'white',
                  borderRadius: 12, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--ink-200)', overflow: 'hidden', zIndex: 50,
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ink-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 13.5 }}>Notifications</strong>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={async () => { await NotificationAPI.markAll().catch(() => {}); loadNotifications(); }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-500)', fontSize: 12.5 }}>You're all caught up.</div>
                    )}
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markRead(n)}
                        style={{
                          padding: '11px 16px', borderBottom: '1px solid var(--ink-100)', cursor: 'pointer',
                          background: n.isRead ? 'white' : 'var(--amber-050)',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-900)' }}>{n.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-500)', marginTop: 2 }}>{n.message}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-400)', marginTop: 4 }}>{formatDate(n.createdAt, true)}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 10, textAlign: 'center', borderTop: '1px solid var(--ink-100)' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setNotifOpen(false); navigate('/notifications'); }}>
                      View all
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
