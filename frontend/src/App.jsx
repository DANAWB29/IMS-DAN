import { Routes, Route } from 'react-router-dom';
import { RequireAuth, RequireAdmin, RedirectIfAuthed } from './components/Guards';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import { ForgotPassword, ResetPassword } from './pages/PasswordRecovery';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Stock from './pages/Stock';
import Customers from './pages/Customers';
import POS from './pages/POS';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />
      <Route path="/register" element={<RedirectIfAuthed><Register /></RedirectIfAuthed>} />
      <Route path="/forgot-password" element={<RedirectIfAuthed><ForgotPassword /></RedirectIfAuthed>} />
      <Route path="/reset-password" element={<RedirectIfAuthed><ResetPassword /></RedirectIfAuthed>} />

      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/purchases" element={<Purchases />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/sales/new" element={<POS />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/reports" element={<RequireAdmin><Reports /></RequireAdmin>} />
        <Route path="/logs" element={<RequireAdmin><Logs /></RequireAdmin>} />
        <Route path="/users" element={<RequireAdmin><Users /></RequireAdmin>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
