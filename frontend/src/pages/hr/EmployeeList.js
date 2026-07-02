import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = {
  active: 'badge-green',
  inactive: 'badge-gray',
  terminated: 'badge-red',
};

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department_id: '',
  position: '',
  hire_date: '',
  salary: '',
};

const initials = (first = '', last = '') => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'NA';

const EmployeeList = () => {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState('');

  const canManage = hasRole('admin', 'hr_manager');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (deptFilter) params.department_id = deptFilter;
      const [empRes, deptRes] = await Promise.all([
        api.get('/hr/employees', { params }),
        api.get('/hr/departments'),
      ]);
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (_) {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, deptFilter]);

  const stats = useMemo(() => {
    const active = employees.filter(emp => emp.status === 'active').length;
    const inactive = employees.filter(emp => emp.status !== 'active').length;
    return { active, inactive, departments: departments.length };
  }, [employees, departments]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/hr/employees', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee. Please check all required fields.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (employee) => {
    const name = `${employee.first_name} ${employee.last_name}`.trim();
    const confirmed = window.confirm(`Remove ${name || 'this employee'} from active HR records?`);
    if (!confirmed) return;

    setRemovingId(employee.id);
    try {
      await api.delete(`/hr/employees/${employee.id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove employee.');
    } finally {
      setRemovingId(null);
    }
  };

  const updateField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">People Operations</p>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">Manage staff details, department allocation, designation, salary and employment status from one HR module.</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Employee</button>}
      </div>

      <div className="grid grid-3" style={{ marginBottom: 20 }}>
        <div className="card metric-card" style={{ '--metric-color': '#2563eb', '--metric-soft': '#dbeafe' }}>
          <div className="metric-top"><p className="metric-label">Total Employees</p><span className="metric-icon">👥</span></div>
          <p className="metric-value">{employees.length}</p><p className="metric-sub">Currently listed in HR database</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#16a34a', '--metric-soft': '#dcfce7' }}>
          <div className="metric-top"><p className="metric-label">Active Staff</p><span className="metric-icon">●</span></div>
          <p className="metric-value">{stats.active}</p><p className="metric-sub">Available for payroll and operations</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#7c3aed', '--metric-soft': '#ede9fe' }}>
          <div className="metric-top"><p className="metric-label">Departments</p><span className="metric-icon">▤</span></div>
          <p className="metric-value">{stats.departments}</p><p className="metric-sub">Business units configured</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input search-input" placeholder="Search employee by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ minWidth: 210 }}>
            <option value="">All Departments</option>
            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span className="badge badge-blue">{stats.active} Active</span>
          <span className="badge badge-gray">{stats.inactive} Other</span>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div><div className="loading-spinner" /><p>Loading employee records...</p></div></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><div><div className="empty-icon">👥</div><p>No employees found for the selected filters.</p></div></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Hire Date</th>
                  <th>Status</th>
                  {canManage && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="person-cell">
                        <span className="person-avatar">{initials(emp.first_name, emp.last_name)}</span>
                        <div>
                          <div className="primary-cell">{emp.first_name} {emp.last_name}</div>
                          <div className="muted-cell">{emp.phone || 'No phone added'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="muted-cell">{emp.email}</td>
                    <td>{emp.department_name || '—'}</td>
                    <td>{emp.position || '—'}</td>
                    <td className="muted-cell">{emp.hire_date ? new Date(emp.hire_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={`badge ${STATUS_BADGE[emp.status] || 'badge-gray'}`}>{emp.status || 'unknown'}</span></td>
                    {canManage && (
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={removingId === emp.id || emp.status === 'terminated'}
                          onClick={() => handleRemove(emp)}
                        >
                          {removingId === emp.id ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Add New Employee</h2>
                <p className="modal-subtitle">Create a professional employee record for HR and payroll modules.</p>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleAdd}>
                <div className="form-grid">
                  <div className="form-field"><label className="label">First Name</label><input className="input" required value={form.first_name} onChange={e => updateField('first_name', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Last Name</label><input className="input" required value={form.last_name} onChange={e => updateField('last_name', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Email</label><input className="input" type="email" required value={form.email} onChange={e => updateField('email', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Phone</label><input className="input" required value={form.phone} onChange={e => updateField('phone', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Position</label><input className="input" required value={form.position} onChange={e => updateField('position', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Department</label><select className="select" required value={form.department_id} onChange={e => updateField('department_id', e.target.value)}><option value="">Select department</option>{departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}</select></div>
                  <div className="form-field"><label className="label">Hire Date</label><input className="input" type="date" required value={form.hire_date} onChange={e => updateField('hire_date', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Salary</label><input className="input" type="number" required value={form.salary} onChange={e => updateField('salary', e.target.value)} /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Employee'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeList;
