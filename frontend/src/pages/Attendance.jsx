import { useEffect, useState } from 'react';
import { AttendanceAPI, EmployeeAPI } from '../api/resources';
import { useApiList } from '../hooks/useApiList';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Modal, Pagination, Spinner, EmptyState, StatusBadge, formatDate } from '../components/UI';
import { IconClipboard, IconClock, IconPlus } from '../components/Icons';

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'LEAVE'];

export default function Attendance() {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user?.role?.name === 'ADMIN';
  const { items, meta, params, setParams, setPage, loading, reload } = useApiList(AttendanceAPI.list, { sortBy: 'date', sortOrder: 'desc' });

  const [employees, setEmployees] = useState([]);
  const [quickEmployee, setQuickEmployee] = useState('');
  const [working, setWorking] = useState(false);
  const [markModal, setMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({ employeeId: '', date: new Date().toISOString().slice(0, 10), status: 'PRESENT', notes: '' });

  useEffect(() => { EmployeeAPI.list({ limit: 200, isActive: true }).then((r) => setEmployees(r.data || [])); }, []);

  const checkIn = async () => {
    if (!quickEmployee) { toast.error('Select an employee.'); return; }
    setWorking(true);
    try { await AttendanceAPI.checkIn({ employeeId: quickEmployee }); toast.success('Checked in.'); reload(); }
    catch (err) { toast.error(err.message); } finally { setWorking(false); }
  };

  const checkOut = async () => {
    if (!quickEmployee) { toast.error('Select an employee.'); return; }
    setWorking(true);
    try { await AttendanceAPI.checkOut({ employeeId: quickEmployee }); toast.success('Checked out.'); reload(); }
    catch (err) { toast.error(err.message); } finally { setWorking(false); }
  };

  const submitMark = async (e) => {
    e.preventDefault();
    setWorking(true);
    try {
      await AttendanceAPI.mark(markForm);
      toast.success('Attendance marked.');
      setMarkModal(false);
      reload();
    } catch (err) { toast.error(err.message); } finally { setWorking(false); }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <h2>Attendance</h2>
          <div className="desc">Daily check-ins and attendance records.</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-head" style={{ marginBottom: 12 }}>
          <div><h2 style={{ fontSize: 14 }}>Quick check-in / check-out</h2></div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
            <label>Employee</label>
            <select value={quickEmployee} onChange={(e) => setQuickEmployee(e.target.value)}>
              <option value="">Select employee</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <button className="btn btn-accent" onClick={checkIn} disabled={working}><IconClock /> Check in</button>
          <button className="btn btn-ghost" onClick={checkOut} disabled={working}>Check out</button>
          {isAdmin && (
            <button className="btn btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => { setMarkForm({ employeeId: quickEmployee, date: new Date().toISOString().slice(0, 10), status: 'PRESENT', notes: '' }); setMarkModal(true); }}>
              <IconPlus /> Mark attendance manually
            </button>
          )}
        </div>
      </div>

      <div className="table-toolbar">
        <div className="filter-row">
          <select value={params.employeeId || ''} onChange={(e) => setParams({ employeeId: e.target.value || undefined })}>
            <option value="">All employees</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
          <select value={params.status || ''} onChange={(e) => setParams({ status: e.target.value || undefined })}>
            <option value="">Any status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={params.startDate || ''} onChange={(e) => setParams({ startDate: e.target.value || undefined })} />
          <input type="date" value={params.endDate || ''} onChange={(e) => setParams({ endDate: e.target.value || undefined })} />
        </div>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <EmptyState icon={IconClipboard} title="No attendance records" desc="Check in an employee, or mark attendance manually." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Check in</th><th>Check out</th><th className="text-right">Hours</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td className="cell-strong">{a.employee?.firstName} {a.employee?.lastName}</td>
                  <td className="text-muted">{formatDate(a.date)}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="text-muted">{a.checkIn ? formatDate(a.checkIn, true) : '—'}</td>
                  <td className="text-muted">{a.checkOut ? formatDate(a.checkOut, true) : '—'}</td>
                  <td className="text-right num">{a.hoursWorked ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onChange={setPage} />

      <Modal open={markModal} onClose={() => setMarkModal(false)} title="Mark attendance"
        footer={<><button className="btn btn-ghost" onClick={() => setMarkModal(false)}>Cancel</button><button className="btn btn-accent" onClick={submitMark} disabled={working}>{working ? 'Saving…' : 'Save'}</button></>}>
        <form onSubmit={submitMark}>
          <div className="field"><label>Employee</label>
            <select required value={markForm.employeeId} onChange={(e) => setMarkForm({ ...markForm, employeeId: e.target.value })}>
              <option value="">Select employee</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="field"><label>Date</label><input required type="date" value={markForm.date} onChange={(e) => setMarkForm({ ...markForm, date: e.target.value })} /></div>
            <div className="field"><label>Status</label>
              <select value={markForm.status} onChange={(e) => setMarkForm({ ...markForm, status: e.target.value })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>Notes</label><textarea value={markForm.notes} onChange={(e) => setMarkForm({ ...markForm, notes: e.target.value })} /></div>
        </form>
      </Modal>
    </>
  );
}
