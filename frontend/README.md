# Nadi — Inventory Management System frontend

A complete React frontend for the IMS Express/Prisma backend: catalog, purchasing,
stock & batches, POS/sales, customers, expenses, employees/attendance, users,
notifications, settings, reports and audit logs.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at your backend if not localhost:3000
npm run dev
```

The app expects the backend running (see the IMS project's own README) at the URL
in `VITE_API_URL` (defaults to `http://localhost:3000`). CORS on the backend is
already configured to allow `http://localhost:5173`.

## Notes

- Auth uses the backend's JWT access/refresh token pair; tokens are kept in
  `localStorage` and refreshed automatically on 401s.
- Admin-only screens (Reports, Activity/Audit Logs, Users) are hidden and
  route-guarded for non-ADMIN accounts, matching the backend's role middleware.
- The POS/new sale screen requires selecting an **Employee** record (distinct
  from the logged-in **User**) since sales are attributed to `Employee` in the
  schema — add an employee under Employees first if the list is empty.
- Product images are uploaded via `multipart/form-data` to
  `/products/:id/images` and rendered from `${VITE_API_URL}/<url>`.
