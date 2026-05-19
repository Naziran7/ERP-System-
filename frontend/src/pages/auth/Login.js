import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@erp.com', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check backend/database and try again.');
    } finally {
      setLoading(false);
    }
  };

  const useDemo = (email, password) => setForm({ email, password });

  return (
    <div className="login-page">
      <section className="login-showcase">
        <div className="login-logo-row">
          <div className="brand-mark">E</div>
          <div>
            <p className="brand-title">Enterprise ERP</p>
            <p className="brand-subtitle">Professional Organization Management System</p>
          </div>
        </div>

        <h1 className="login-heading">Run HR, payroll, inventory and finance from one business workspace.</h1>
        <p className="login-copy">
          A final-year ERP project redesigned with a corporate SaaS look, secure login, role-based access, live dashboards, smart tables and modern module navigation.
        </p>

        <div className="login-stats">
          <div className="login-stat"><strong>4+</strong><span>Business Modules</span></div>
          <div className="login-stat"><strong>RBAC</strong><span>Role Based Access</span></div>
          <div className="login-stat"><strong>REST</strong><span>Node + PostgreSQL API</span></div>
        </div>
      </section>

      <section className="login-panel-wrap">
        <div className="login-panel">
          <div className="login-card">
            <h2 className="login-title">Welcome back</h2>
            <p className="login-subtitle">Sign in to access the enterprise ERP command center.</p>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-field full" style={{ marginBottom: 14 }}>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(current => ({ ...current, email: e.target.value }))}
                  placeholder="admin@erp.com"
                />
              </div>

              <div className="form-field full" style={{ marginBottom: 18 }}>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  required
                  value={form.password}
                  onChange={e => setForm(current => ({ ...current, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>

              <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Signing in...' : 'Sign in to ERP'}
              </button>
            </form>

            <div className="demo-box">
              <p className="demo-title">Demo credentials</p>
              <button className="demo-row" type="button" onClick={() => useDemo('admin@erp.com', 'admin123')} style={{ width: '100%', background: 'transparent', cursor: 'pointer' }}>
                <span>Admin</span><strong>admin@erp.com / admin123</strong>
              </button>
              <button className="demo-row" type="button" onClick={() => useDemo('hr@erp.com', 'hr123')} style={{ width: '100%', background: 'transparent', cursor: 'pointer' }}>
                <span>HR Manager</span><strong>hr@erp.com / hr123</strong>
              </button>
            </div>
          </div>

          <p className="login-footer">Backend required: http://localhost:5000 • Frontend: http://localhost:3000</p>
        </div>
      </section>
    </div>
  );
};

export default Login;
