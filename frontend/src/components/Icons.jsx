// Minimal hand-rolled icon set (stroke-based, 24x24 viewbox) — avoids an external icon dependency.
const base = (children, props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {children}
  </svg>
);

export const IconDashboard = (p) => base(<><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></>, p);
export const IconBox = (p) => base(<><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>, p);
export const IconTag = (p) => base(<><path d="M20.6 12.5 12.9 4.8a2 2 0 0 0-1.4-.6H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .6 1.4l7.7 7.7a2 2 0 0 0 2.8 0l6.5-6.5a2 2 0 0 0 0-2.8Z" /><circle cx="8" cy="9" r="1.4" /></>, p);
export const IconTruck = (p) => base(<><rect x="1" y="6" width="14" height="11" rx="1.5" /><path d="M15 10h4l3 3v4h-7z" /><circle cx="6" cy="19.5" r="1.6" /><circle cx="17.5" cy="19.5" r="1.6" /></>, p);
export const IconClipboard = (p) => base(<><rect x="6" y="3.5" width="12" height="17" rx="2" /><path d="M9 3.5V3a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 3v.5" /><path d="M9 10h6M9 14h6M9 18h3" /></>, p);
export const IconLayers = (p) => base(<><path d="M12 2 2 8l10 6 10-6-10-6Z" /><path d="M2 14l10 6 10-6" /><path d="M2 11l10 6 10-6" /></>, p);
export const IconUsers = (p) => base(<><circle cx="9" cy="8" r="3.3" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.3 3.3 0 0 1 0 6.5" /><path d="M15.5 13.2a6.5 6.5 0 0 1 6 6.8" /></>, p);
export const IconCart = (p) => base(<><circle cx="9" cy="20" r="1.4" /><circle cx="17.5" cy="20" r="1.4" /><path d="M1.5 2h2.4l2.3 12.3a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 6.5H5" /></>, p);
export const IconWallet = (p) => base(<><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h11A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19h-11A2.5 2.5 0 0 1 3 16.5Z" /><path d="M15.5 12h3.5v3.5h-3.5a1.75 1.75 0 0 1 0-3.5Z" /></>, p);
export const IconReceipt = (p) => base(<><path d="M6 2h12v19l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5Z" /><path d="M8.5 7h7M8.5 11h7M8.5 15h4" /></>, p);
export const IconChart = (p) => base(<><path d="M4 19V10M11 19V5M18 19v-7" /><path d="M2.5 19.5h19" /></>, p);
export const IconBell = (p) => base(<><path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8Z" /><path d="M10.3 20.5a1.9 1.9 0 0 0 3.4 0" /></>, p);
export const IconSettings = (p) => base(<><circle cx="12" cy="12" r="3.1" /><path d="M19.3 13.9a1.6 1.6 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.9-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.9 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.9.3H10a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.9V10a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1Z" /></>, p);
export const IconFile = (p) => base(<><path d="M13 2H6.5A1.5 1.5 0 0 0 5 3.5v17A1.5 1.5 0 0 0 6.5 22h11a1.5 1.5 0 0 0 1.5-1.5V8Z" /><path d="M13 2v6h6" /></>, p);
export const IconSearch = (p) => base(<><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.5-4.5" /></>, p);
export const IconPlus = (p) => base(<><path d="M12 5v14M5 12h14" /></>, p);
export const IconEdit = (p) => base(<><path d="M12.5 4.5 19.5 11.5 8 23H1v-7Z" /><path d="M16.5 1.5 22.5 7.5" /></>, p);
export const IconTrash = (p) => base(<><path d="M3.5 6.5h17" /><path d="M8.5 6V4a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 4v2" /><path d="M6 6.5 7 21h10l1-14.5" /></>, p);
export const IconX = (p) => base(<><path d="M18 6 6 18M6 6l12 12" /></>, p);
export const IconChevronLeft = (p) => base(<path d="M15 18l-6-6 6-6" />, p);
export const IconChevronRight = (p) => base(<path d="M9 18l6-6-6-6" />, p);
export const IconChevronDown = (p) => base(<path d="M6 9l6 6 6-6" />, p);
export const IconLogout = (p) => base(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>, p);
export const IconAlertTriangle = (p) => base(<><path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></>, p);
export const IconCheck = (p) => base(<path d="M20 6 9 17l-5-5" />, p);
export const IconDollar = (p) => base(<><path d="M12 2v20" /><path d="M17 6.5c0-1.9-2.2-3.5-5-3.5s-5 1.5-5 3.5S9.3 10 12 10s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.5-5-3.5" /></>, p);
export const IconBarcode = (p) => base(<><path d="M3 4v16M7 4v16M10 4v16M14 4v16M17 4v16M21 4v16" /></>, p);
export const IconCalendar = (p) => base(<><rect x="3" y="4.5" width="18" height="17" rx="2" /><path d="M8 2.5v4M16 2.5v4M3 9.5h18" /></>, p);
export const IconClock = (p) => base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>, p);
export const IconImage = (p) => base(<><rect x="3" y="3.5" width="18" height="17" rx="2" /><circle cx="8.5" cy="9" r="1.6" /><path d="M21 16l-5.5-5.5L4 21" /></>, p);
export const IconArrowUp = (p) => base(<><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></>, p);
export const IconArrowDown = (p) => base(<><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></>, p);
export const IconRefresh = (p) => base(<><path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" /><path d="M3 21v-5h5" /></>, p);
export const IconMinus = (p) => base(<path d="M5 12h14" />, p);
export const IconShield = (p) => base(<><path d="M12 2 4 5.5v6c0 5.2 3.4 9.5 8 10.5 4.6-1 8-5.3 8-10.5v-6Z" /><path d="M9 12l2 2 4-4" /></>, p);
export const IconActivity = (p) => base(<path d="M22 12h-4l-3 8-6-16-3 8H2" />, p);
export const IconHome = (p) => base(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>, p);
