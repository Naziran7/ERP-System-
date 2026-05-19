import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const PayrollList = () => {
  const { hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const canGenerate = hasRole('admin', 'hr_manager');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payroll', { params: { month, year } });
      setRecords(res.data);
    } catch (_) {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month, year]);

  const stats = useMemo(() => {
    const gross = records.reduce((sum, row) => sum + Number(row.basic_salary || 0), 0);
    const deductions = records.reduce((sum, row) => sum + Number(row.tax_deduction || 0) + Number(row.pf_deduction || 0), 0);
    const net = records.reduce((sum, row) => sum + Number(row.net_salary || 0), 0);
    return { gross, deductions, net };
  }, [records]);

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post('/payroll/generate', { month, year });
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate payroll.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Salary Operations</p>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Generate monthly payslips, calculate tax and PF deductions, and monitor total payable salary for active employees.</p>
        </div>
        {canGenerate && <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? 'Generating...' : '⚡ Generate Payroll'}</button>}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card metric-card" style={{ '--metric-color': '#2563eb', '--metric-soft': '#dbeafe' }}>
          <div className="metric-top"><p className="metric-label">Payslips</p><span className="metric-icon">▤</span></div>
          <p className="metric-value">{records.length}</p><p className="metric-sub">Generated for selected month</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#16a34a', '--metric-soft': '#dcfce7' }}>
          <div className="metric-top"><p className="metric-label">Gross Salary</p><span className="metric-icon">₹</span></div>
          <p className="metric-value">{formatCurrency(stats.gross)}</p><p className="metric-sub">Total basic salary</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#dc2626', '--metric-soft': '#fee2e2' }}>
          <div className="metric-top"><p className="metric-label">Deductions</p><span className="metric-icon">−</span></div>
          <p className="metric-value">{formatCurrency(stats.deductions)}</p><p className="metric-sub">Tax and PF combined</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#7c3aed', '--metric-soft': '#ede9fe' }}>
          <div className="metric-top"><p className="metric-label">Net Payable</p><span className="metric-icon">✓</span></div>
          <p className="metric-value">{formatCurrency(stats.net)}</p><p className="metric-sub">Total employee payout</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <select className="select" value={month} onChange={e => setMonth(Number(e.target.value))} style={{ minWidth: 170 }}>
            {months.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
          </select>
          <select className="select" value={year} onChange={e => setYear(Number(e.target.value))} style={{ minWidth: 170 }}>
            {[2024, 2025, 2026, 2027].map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <span className="badge badge-blue">{months[month - 1]} {year}</span>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div><div className="loading-spinner" /><p>Loading payroll records...</p></div></div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div><div className="empty-icon">₹</div><p>No payroll records found. Generate payroll for this month to create payslips.</p></div></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Basic Salary</th>
                  <th>Tax</th>
                  <th>PF</th>
                  <th>Net Salary</th>
                  <th>Month</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="primary-cell">{record.first_name} {record.last_name}</div>
                      <div className="muted-cell">{record.email}</div>
                    </td>
                    <td>{record.department_name || '—'}</td>
                    <td>{formatCurrency(record.basic_salary)}</td>
                    <td style={{ color: 'var(--danger)' }}>-{formatCurrency(record.tax_deduction)}</td>
                    <td style={{ color: 'var(--danger)' }}>-{formatCurrency(record.pf_deduction)}</td>
                    <td className="primary-cell" style={{ color: 'var(--success)' }}>{formatCurrency(record.net_salary)}</td>
                    <td><span className="badge badge-blue">{months[Number(record.month) - 1]} {record.year}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollList;
