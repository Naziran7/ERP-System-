import React, { useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', desc: 'Executive overview', icon: '⌘', roles: null },
  { path: '/hr/employees', label: 'Human Resource', desc: 'Employees and teams', icon: '👥', roles: null },
  { path: '/payroll', label: 'Payroll', desc: 'Salary operations', icon: '₹', roles: ['admin', 'hr_manager', 'finance_manager'] },
  { path: '/inventory', label: 'Inventory', desc: 'Stock and suppliers', icon: '▦', roles: null },
  { path: '/finance', label: 'Finance', desc: 'Revenue and expense', icon: '◈', roles: ['admin', 'finance_manager'] },
  { path: '/crm', label: 'CRM', desc: 'Customers and leads', icon: '◎', roles: null },
  { path: '/sales', label: 'Sales & Invoice', desc: 'Invoices and billing', icon: '▤', roles: ['admin', 'finance_manager'] },
  { path: '/attendance', label: 'Attendance & Leave', desc: 'Time and leave workflow', icon: '◷', roles: ['admin', 'hr_manager', 'employee'] },
  { path: '/purchase', label: 'Supplier & Purchase', desc: 'Vendors and procurement', icon: '◫', roles: ['admin', 'inventory_manager'] },
  { path: '/reports', label: 'Reports & Analytics', desc: 'Business intelligence', icon: '📊', roles: null },
];

const titles = {
  '/dashboard': 'Organization Command Center',
  '/hr/employees': 'People Operations',
  '/payroll': 'Payroll Management',
  '/inventory': 'Inventory Control',
  '/finance': 'Financial Intelligence',
  '/crm': 'Customer Relationship Management',
  '/sales': 'Sales and Invoice Management',
  '/attendance': 'Attendance and Leave Management',
  '/purchase': 'Supplier and Purchase Management',
  '/reports': 'Reports and Analytics',
};

const initials = (name = 'ERP User') => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
const roleLabel = role => role ? role.replace(/_/g, ' ') : 'team member';

const Layout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = useMemo(() => navItems.filter(item => !item.roles || hasRole(...item.roles)), [hasRole]);
  const pageTitle = titles[location.pathname] || 'Enterprise ERP Workspace';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (window.innerWidth <= 860) {
      setMobileOpen(open => !open);
    } else {
      setSidebarOpen(open => !open);
    }
  };

  return (
    <div className="app-shell">
      {mobileOpen && <div className="modal-backdrop" style={{ zIndex: 25 }} onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">E</div>
          <div className="brand-copy">
            <p className="brand-title">Enterprise ERP</p>
            <p className="brand-subtitle">Organization Suite</p>
          </div>
        </div>

        <p className="sidebar-section-title">Main Modules</p>
        <nav className="nav-list">
          {visible.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-desc">{item.desc}</span>
              </span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-card">
          <p className="sidebar-card-title">System Readiness</p>
          <p className="sidebar-card-text">Core modules are connected through secure role-based access.</p>
          <div className="progress-track"><span className="progress-fill" /></div>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{initials(user?.full_name)}</div>
          <div className="user-copy">
            <p className="user-name">{user?.full_name || 'ERP User'}</p>
            <p className="user-role">{roleLabel(user?.role)}</p>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">↗</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">☰</button>
            <div>
              <p className="topbar-eyebrow">ERP Workspace</p>
              <h2 className="topbar-title">{pageTitle}</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search-box">
              <span>⌕</span>
              <input placeholder="Search reports, employees, products..." aria-label="Search" />
            </div>
            <span className="status-pill"><span className="status-dot" /> Live System</span>
            <button className="icon-btn" title="Notifications" aria-label="Notifications">🔔</button>
          </div>
        </header>

        <main className="page-content">
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
