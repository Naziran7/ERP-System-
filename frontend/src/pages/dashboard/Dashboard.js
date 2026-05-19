import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) return '—';
  return numeric.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
};

const MetricCard = ({ icon, label, value, sub, color, soft }) => (
  <div className="card metric-card" style={{ '--metric-color': color, '--metric-soft': soft }}>
    <div className="metric-top">
      <p className="metric-label">{label}</p>
      <span className="metric-icon">{icon}</span>
    </div>
    <p className="metric-value">{value}</p>
    <p className="metric-sub">{sub}</p>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [empRes, prodRes, finRes, crmRes, salesRes] = await Promise.allSettled([
        api.get('/hr/employees'),
        api.get('/inventory/products'),
        api.get('/finance/summary'),
        api.get('/crm/summary'),
        api.get('/sales/summary'),
      ]);

      setStats({
        employees: empRes.status === 'fulfilled' ? empRes.value.data.length : '—',
        products: prodRes.status === 'fulfilled' ? prodRes.value.data.length : '—',
        revenue: finRes.status === 'fulfilled' ? finRes.value.data.total_revenue : 0,
        profit: finRes.status === 'fulfilled' ? finRes.value.data.net_profit : 0,
        customers: crmRes.status === 'fulfilled' ? crmRes.value.data.total_customers : '—',
        invoices: salesRes.status === 'fulfilled' ? salesRes.value.data.invoice_count : '—',
      });
      setLoading(false);
    };

    load();
  }, []);

  const modules = useMemo(() => ([
    {
      title: 'Human Resource',
      desc: 'Manage employee records, departments, roles, status and organizational workforce details.',
      path: '/hr/employees',
      icon: '👥',
      color: '#2563eb',
      soft: '#dbeafe',
    },
    {
      title: 'Payroll Operations',
      desc: 'Generate salary records, track PF, tax deductions and net payable salary by month.',
      path: '/payroll',
      icon: '₹',
      color: '#7c3aed',
      soft: '#ede9fe',
    },
    {
      title: 'Inventory Control',
      desc: 'Monitor products, suppliers, SKUs, stock value and low-stock alerts in real time.',
      path: '/inventory',
      icon: '▦',
      color: '#0891b2',
      soft: '#cffafe',
    },
    {
      title: 'Finance Intelligence',
      desc: 'View revenue, expenses, profit/loss and monthly performance through business charts.',
      path: '/finance',
      icon: '◈',
      color: '#16a34a',
      soft: '#dcfce7',
    },
    { title: 'CRM Pipeline', desc: 'Track customers, leads, enquiry sources and follow-up stages.', path: '/crm', icon: '◎', color: '#d97706', soft: '#fef3c7' },
    { title: 'Sales and Invoice', desc: 'Create invoices, tax calculation and payment status.', path: '/sales', icon: '▤', color: '#0f766e', soft: '#ccfbf1' },
    { title: 'Attendance and Leave', desc: 'Mark attendance and approve employee leave requests.', path: '/attendance', icon: '◷', color: '#be123c', soft: '#ffe4e6' },
    { title: 'Supplier and Purchase', desc: 'Manage vendors, purchase orders and delivery status.', path: '/purchase', icon: '◫', color: '#9333ea', soft: '#f3e8ff' },
    { title: 'Reports and Analytics', desc: 'Central BI for all ERP modules.', path: '/reports', icon: '📊', color: '#334155', soft: '#e2e8f0' },
  ]), []);

  return (
    <div>
      <section className="hero-panel">
        <div className="hero-content">
          <div>
            <span className="hero-kicker">● Enterprise ERP Dashboard</span>
            <h1 className="hero-title">A professional command center for modern organization management.</h1>
            <p className="hero-text">
              Welcome {user?.full_name || 'User'}. Track people, payroll, inventory and finance from a clean, responsive and business-ready ERP interface.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => navigate('/hr/employees')}>Manage Employees</button>
              <button className="btn btn-secondary" onClick={() => navigate('/finance')}>View Finance</button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-mini-card">
              <div className="hero-mini-top">
                <p className="hero-mini-label">Business Health</p>
                <span className="badge badge-teal">Operational</span>
              </div>
              <p className="hero-mini-value">Integrated ERP</p>
              <p className="hero-mini-note">Connected modules with role based access</p>
            </div>
            <div className="hero-mini-card">
              <div className="hero-mini-top">
                <p className="hero-mini-label">Workflow Completion</p>
                <p className="hero-mini-label">74%</p>
              </div>
              <div className="hero-bars">
                <div className="hero-bar"><span style={{ width: '82%' }} /></div>
                <div className="hero-bar"><span style={{ width: '68%' }} /></div>
                <div className="hero-bar"><span style={{ width: '91%' }} /></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading-state card">
          <div>
            <div className="loading-spinner" />
            <p>Loading executive metrics...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          <MetricCard icon="👥" label="Total Employees" value={stats?.employees ?? '—'} sub="Active staff records" color="#2563eb" soft="#dbeafe" />
          <MetricCard icon="▦" label="Inventory Items" value={stats?.products ?? '—'} sub="Products in stock" color="#0891b2" soft="#cffafe" />
          <MetricCard icon="↗" label="Revenue YTD" value={formatCurrency(stats?.revenue)} sub="This financial year" color="#16a34a" soft="#dcfce7" />
          <MetricCard icon="◎" label="Net Profit" value={formatCurrency(stats?.profit)} sub="Revenue minus expenses" color="#d97706" soft="#fef3c7" />
        </div>
      )}

      <div className="grid grid-4" style={{ marginBottom: 24 }}>
        {modules.map(module => (
          <article
            key={module.path}
            className="card module-card"
            style={{ '--module-color': module.color, '--module-soft': module.soft }}
            onClick={() => navigate(module.path)}
          >
            <span className="module-icon">{module.icon}</span>
            <div>
              <h3 className="module-title">{module.title}</h3>
              <p className="module-desc">{module.desc}</p>
            </div>
            <span className="module-link">Open module →</span>
          </article>
        ))}
      </div>

      <div className="grid grid-2">
        <section className="card card-pad">
          <div className="chart-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">ERP Project Highlights</h3>
              <p className="card-subtitle">Features that make the application look like a real business platform.</p>
            </div>
          </div>
          <div className="activity-list">
            <div className="activity-item"><span className="activity-icon">🔐</span><div><p className="activity-title">Secure Authentication</p><p className="activity-text">JWT login with role-based dashboard access.</p></div><span className="badge badge-green">Ready</span></div>
            <div className="activity-item"><span className="activity-icon">📊</span><div><p className="activity-title">Executive Reporting</p><p className="activity-text">Finance overview and module KPIs for management.</p></div><span className="badge badge-blue">Live</span></div>
            <div className="activity-item"><span className="activity-icon">🧭</span><div><p className="activity-title">Corporate Navigation</p><p className="activity-text">Sidebar, topbar, responsive layout and module routing.</p></div><span className="badge badge-teal">Modern</span></div>
          </div>
        </section>

        <section className="card card-pad">
          <div className="chart-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title">Operational Focus</h3>
              <p className="card-subtitle">Suggested modules for final presentation explanation.</p>
            </div>
          </div>
          <div className="activity-list">
            <div className="activity-item"><span className="activity-icon">1</span><div><p className="activity-title">Centralized Data</p><p className="activity-text">All departments can work from one unified system.</p></div><span className="muted-cell">Core</span></div>
            <div className="activity-item"><span className="activity-icon">2</span><div><p className="activity-title">Automation</p><p className="activity-text">Payroll and finance calculations reduce manual work.</p></div><span className="muted-cell">Value</span></div>
            <div className="activity-item"><span className="activity-icon">3</span><div><p className="activity-title">Decision Support</p><p className="activity-text">Dashboards help management understand business performance.</p></div><span className="muted-cell">Output</span></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
