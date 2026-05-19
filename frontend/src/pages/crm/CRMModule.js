import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', email: '', phone: '', company: '', stage: 'new', source: 'Website', next_follow_up: '', notes: '' };
const badges = { new: 'badge-blue', contacted: 'badge-teal', hot: 'badge-yellow', converted: 'badge-green', lost: 'badge-red' };

const CRMModule = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const canManage = hasRole('admin', 'hr_manager', 'finance_manager');

  const load = async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([api.get('/crm/customers', { params: { search, stage } }), api.get('/crm/summary')]);
      setCustomers(list.data); setSummary(sum.data);
    } catch (_) { setCustomers([]); setSummary(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [search, stage]);
  const pipeline = useMemo(() => customers.filter(c => c.stage !== 'lost').length * 75000, [customers]);
  const currency = v => Number(v || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/crm/customers', form); setForm(emptyForm); setShowForm(false); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to save customer.'); }
  };

  const updateStage = async (customer, value) => {
    try { await api.put(`/crm/customers/${customer.id}/stage`, { stage: value }); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to update stage.'); }
  };

  return <div>
    <div className="page-header"><div><p className="eyebrow">Customer Relationship Management</p><h1 className="page-title">CRM Module</h1><p className="page-subtitle">Manage leads, customers, follow-ups, source tracking and pipeline stages.</p></div>{canManage && <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Customer</button>}</div>
    <div className="grid grid-4" style={{ marginBottom: 20 }}>
      <div className="card metric-card" style={{ '--metric-color': '#2563eb', '--metric-soft': '#dbeafe' }}><div className="metric-top"><p className="metric-label">Customers</p><span className="metric-icon">◎</span></div><p className="metric-value">{summary?.total_customers ?? customers.length}</p><p className="metric-sub">Active CRM records</p></div>
      <div className="card metric-card" style={{ '--metric-color': '#d97706', '--metric-soft': '#fef3c7' }}><div className="metric-top"><p className="metric-label">Hot Leads</p><span className="metric-icon">!</span></div><p className="metric-value">{summary?.hot_leads ?? 0}</p><p className="metric-sub">High priority follow-ups</p></div>
      <div className="card metric-card" style={{ '--metric-color': '#16a34a', '--metric-soft': '#dcfce7' }}><div className="metric-top"><p className="metric-label">Converted</p><span className="metric-icon">✓</span></div><p className="metric-value">{summary?.converted_customers ?? 0}</p><p className="metric-sub">Won customers</p></div>
      <div className="card metric-card" style={{ '--metric-color': '#7c3aed', '--metric-soft': '#ede9fe' }}><div className="metric-top"><p className="metric-label">Pipeline Value</p><span className="metric-icon">₹</span></div><p className="metric-value">{currency(pipeline)}</p><p className="metric-sub">Estimated opportunity</p></div>
    </div>
    <div className="toolbar"><div className="toolbar-left"><input className="input search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." /><select className="select" value={stage} onChange={e => setStage(e.target.value)}><option value="">All stages</option><option value="new">New</option><option value="contacted">Contacted</option><option value="hot">Hot</option><option value="converted">Converted</option><option value="lost">Lost</option></select></div><span className="badge badge-blue">CRM Pipeline</span></div>
    <div className="card table-card">{loading ? <div className="loading-state"><div><div className="loading-spinner" /><p>Loading CRM records...</p></div></div> : <div className="table-scroll"><table className="data-table"><thead><tr><th>Customer</th><th>Company</th><th>Stage</th><th>Source</th><th>Follow-up</th><th>Notes</th><th>Action</th></tr></thead><tbody>{customers.map(c => <tr key={c.id}><td><div className="primary-cell">{c.name}</div><div className="muted-cell">{c.email || c.phone || 'No contact'}</div></td><td>{c.company || '—'}</td><td><span className={`badge ${badges[c.stage] || 'badge-blue'}`}>{c.stage}</span></td><td>{c.source || '—'}</td><td>{c.next_follow_up ? new Date(c.next_follow_up).toLocaleDateString('en-IN') : '—'}</td><td className="muted-cell">{c.notes || '—'}</td><td><select className="select table-select" disabled={!canManage} value={c.stage} onChange={e => updateStage(c, e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="hot">Hot</option><option value="converted">Converted</option><option value="lost">Lost</option></select></td></tr>)}</tbody></table></div>}</div>
    {showForm && <div className="modal-backdrop" onClick={() => setShowForm(false)}><div className="modal-card" onClick={e => e.stopPropagation()}><div className="modal-header"><div><h2 className="modal-title">Add Customer</h2><p className="modal-subtitle">Create CRM record.</p></div><button className="close-btn" onClick={() => setShowForm(false)}>×</button></div><div className="modal-body"><form onSubmit={save}><div className="form-grid"><div className="form-field"><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div><div className="form-field"><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div><div className="form-field"><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div><div className="form-field"><label className="label">Company</label><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div><div className="form-field"><label className="label">Stage</label><select className="select" value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })}><option value="new">New</option><option value="contacted">Contacted</option><option value="hot">Hot</option><option value="converted">Converted</option></select></div><div className="form-field"><label className="label">Follow-up</label><input className="input" type="date" value={form.next_follow_up} onChange={e => setForm({ ...form, next_follow_up: e.target.value })} /></div><div className="form-field full"><label className="label">Notes</label><textarea className="textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div></div><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary">Save</button></div></form></div></div></div>}
  </div>;
};
export default CRMModule;
