import { api } from './client';

export const AuthAPI = {
  register: (body) => api.post('/auth/register', body),
  login: (body) => api.post('/auth/login', body),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (body) => api.post('/auth/reset-password', body),
  me: () => api.get('/auth/me'),
  updateProfile: (body) => api.patch('/auth/me', body),
  changePassword: (body) => api.patch('/auth/change-password', body),
};

export const UsersAPI = {
  list: (params) => api.get('/users', params),
  roles: () => api.get('/users/roles'),
  get: (id) => api.get(`/users/${id}`),
  update: (id, body) => api.patch(`/users/${id}`, body),
  remove: (id) => api.del(`/users/${id}`),
  resetPassword: (id) => api.patch(`/users/${id}/reset-password`),
};

export const CategoryAPI = {
  list: (params) => api.get('/categories', params),
  get: (id) => api.get(`/categories/${id}`),
  create: (body) => api.post('/categories', body),
  update: (id, body) => api.patch(`/categories/${id}`, body),
  remove: (id) => api.del(`/categories/${id}`),
};

export const ProductAPI = {
  list: (params) => api.get('/products', params),
  get: (id) => api.get(`/products/${id}`),
  create: (body) => api.post('/products', body),
  update: (id, body) => api.patch(`/products/${id}`, body),
  remove: (id) => api.del(`/products/${id}`),
  lowStock: (params) => api.get('/products/low-stock', params),
  inventoryValue: () => api.get('/products/inventory-value'),
  byBarcode: (code) => api.get(`/products/barcode/${code}`),
  uploadImages: (id, formData) => api.postForm(`/products/${id}/images`, formData),
  setPrimaryImage: (id, imageId) => api.patch(`/products/${id}/images/${imageId}/primary`),
  deleteImage: (id, imageId) => api.del(`/products/${id}/images/${imageId}`),
};

export const SupplierAPI = {
  list: (params) => api.get('/suppliers', params),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (body) => api.post('/suppliers', body),
  update: (id, body) => api.patch(`/suppliers/${id}`, body),
  remove: (id) => api.del(`/suppliers/${id}`),
};

export const PurchaseAPI = {
  list: (params) => api.get('/purchases', params),
  get: (id) => api.get(`/purchases/${id}`),
  create: (body) => api.post('/purchases', body),
  receive: (id, body) => api.patch(`/purchases/${id}/receive`, body),
  cancel: (id) => api.patch(`/purchases/${id}/cancel`),
  pay: (id, body) => api.post(`/purchases/${id}/pay`, body),
};

export const StockAPI = {
  movements: (params) => api.get('/stock/movements', params),
  expiring: (params) => api.get('/stock/expiring', params),
  batches: (productId) => api.get(`/stock/batches/${productId}`),
  stockIn: (body) => api.post('/stock/in', body),
  stockOut: (body) => api.post('/stock/out', body),
  adjustment: (body) => api.post('/stock/adjustment', body),
};

export const CustomerAPI = {
  list: (params) => api.get('/customers', params),
  get: (id) => api.get(`/customers/${id}`),
  history: (id) => api.get(`/customers/${id}/history`),
  create: (body) => api.post('/customers', body),
  update: (id, body) => api.patch(`/customers/${id}`, body),
  remove: (id) => api.del(`/customers/${id}`),
};

export const SalesAPI = {
  list: (params) => api.get('/sales', params),
  get: (id) => api.get(`/sales/${id}`),
  create: (body) => api.post('/sales', body),
  today: () => api.get('/sales/today'),
  summary: (params) => api.get('/sales/summary', params),
  topProducts: (params) => api.get('/sales/top-products', params),
  processReturn: (id, body) => api.post(`/sales/${id}/return`, body),
  recordPayment: (id, body) => api.post(`/sales/${id}/payment`, body),
};

export const ExpenseAPI = {
  list: (params) => api.get('/expenses', params),
  get: (id) => api.get(`/expenses/${id}`),
  create: (body) => api.post('/expenses', body),
  update: (id, body) => api.patch(`/expenses/${id}`, body),
  remove: (id) => api.del(`/expenses/${id}`),
  categories: () => api.get('/expenses/categories'),
  createCategory: (body) => api.post('/expenses/categories', body),
  updateCategory: (id, body) => api.patch(`/expenses/categories/${id}`, body),
  removeCategory: (id) => api.del(`/expenses/categories/${id}`),
};

export const EmployeeAPI = {
  list: (params) => api.get('/employees', params),
  get: (id) => api.get(`/employees/${id}`),
  create: (body) => api.post('/employees', body),
  update: (id, body) => api.patch(`/employees/${id}`, body),
  remove: (id) => api.del(`/employees/${id}`),
  attendanceSummary: (id) => api.get(`/employees/${id}/attendance/summary`),
};

export const AttendanceAPI = {
  list: (params) => api.get('/employees/attendance/all', params),
  get: (id) => api.get(`/employees/attendance/${id}`),
  checkIn: (body) => api.post('/employees/attendance/check-in', body),
  checkOut: (body) => api.post('/employees/attendance/check-out', body),
  mark: (body) => api.post('/employees/attendance/mark', body),
  update: (id, body) => api.patch(`/employees/attendance/${id}`, body),
  remove: (id) => api.del(`/employees/attendance/${id}`),
};

export const ReportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (params) => api.get('/reports/sales', params),
  inventory: (params) => api.get('/reports/inventory', params),
  employees: (params) => api.get('/reports/employees', params),
  expenses: (params) => api.get('/reports/expenses', params),
  profitLoss: (params) => api.get('/reports/profit-loss', params),
};

export const NotificationAPI = {
  list: (params) => api.get('/notifications', params),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAll: () => api.patch('/notifications/read-all'),
  remove: (id) => api.del(`/notifications/${id}`),
};

export const LogAPI = {
  activity: (params) => api.get('/logs/activity', params),
  audit: (params) => api.get('/logs/audit', params),
};

export const SettingAPI = {
  list: () => api.get('/settings'),
  update: (key, body) => api.patch(`/settings/${key}`, body),
  bulkUpdate: (body) => api.patch('/settings/bulk', body),
};

export const SystemAPI = {
  health: () => api.get('/system/health'),
};
