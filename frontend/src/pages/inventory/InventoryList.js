import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  name: '',
  sku: '',
  description: '',
  quantity: '',
  unit_price: '',
  reorder_level: '5',
  supplier_id: '',
};

const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const InventoryList = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canManage = hasRole('admin', 'inventory_manager');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (lowStock) params.low_stock = 'true';
      const [productRes, supplierRes] = await Promise.all([
        api.get('/inventory/products', { params }),
        api.get('/inventory/suppliers'),
      ]);
      setProducts(productRes.data);
      setSuppliers(supplierRes.data);
    } catch (_) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [search, lowStock]);

  const stats = useMemo(() => {
    const low = products.filter(product => Number(product.quantity) <= Number(product.reorder_level)).length;
    const value = products.reduce((sum, product) => sum + Number(product.quantity || 0) * Number(product.unit_price || 0), 0);
    return { low, value, suppliers: suppliers.length };
  }, [products, suppliers]);

  const updateField = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      await api.post('/inventory/products', form);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add product. Please check product details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Supply Chain</p>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track product SKUs, supplier mapping, quantity, reorder level, stock value and low-stock warning from a business-ready dashboard.</p>
        </div>
        {canManage && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Product</button>}
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card metric-card" style={{ '--metric-color': '#0891b2', '--metric-soft': '#cffafe' }}>
          <div className="metric-top"><p className="metric-label">Total Products</p><span className="metric-icon">▦</span></div>
          <p className="metric-value">{products.length}</p><p className="metric-sub">Items available in inventory</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#dc2626', '--metric-soft': '#fee2e2' }}>
          <div className="metric-top"><p className="metric-label">Low Stock</p><span className="metric-icon">!</span></div>
          <p className="metric-value">{stats.low}</p><p className="metric-sub">Items requiring reorder</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#16a34a', '--metric-soft': '#dcfce7' }}>
          <div className="metric-top"><p className="metric-label">Stock Value</p><span className="metric-icon">₹</span></div>
          <p className="metric-value">{formatCurrency(stats.value)}</p><p className="metric-sub">Total quantity × unit price</p>
        </div>
        <div className="card metric-card" style={{ '--metric-color': '#7c3aed', '--metric-soft': '#ede9fe' }}>
          <div className="metric-top"><p className="metric-label">Suppliers</p><span className="metric-icon">↔</span></div>
          <p className="metric-value">{stats.suppliers}</p><p className="metric-sub">Vendor records connected</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input className="input search-input" placeholder="Search by product name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
          <label className="check-pill">
            <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} />
            Low stock only
          </label>
        </div>
        <div className="toolbar-right">
          <span className="badge badge-red">{stats.low} Alert</span>
          <span className="badge badge-teal">{products.length - stats.low} In Stock</span>
        </div>
      </div>

      <div className="card table-card">
        {loading ? (
          <div className="loading-state"><div><div className="loading-spinner" /><p>Loading inventory records...</p></div></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div><div className="empty-icon">▦</div><p>No products found for the selected filters.</p></div></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Supplier</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Total Value</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const isLow = Number(product.quantity) <= Number(product.reorder_level);
                  const totalValue = Number(product.quantity || 0) * Number(product.unit_price || 0);
                  return (
                    <tr key={product.id}>
                      <td className="mono muted-cell">{product.sku}</td>
                      <td>
                        <div className="primary-cell">{product.name}</div>
                        <div className="muted-cell">Reorder level: {product.reorder_level}</div>
                      </td>
                      <td>{product.supplier_name || '—'}</td>
                      <td className="primary-cell" style={{ color: isLow ? 'var(--danger)' : 'var(--text)' }}>{product.quantity}</td>
                      <td>{formatCurrency(product.unit_price)}</td>
                      <td>{formatCurrency(totalValue)}</td>
                      <td><span className={`badge ${isLow ? 'badge-red' : 'badge-green'}`}>{isLow ? 'Low Stock' : 'In Stock'}</span></td>
                    </tr>
                  );
                })}
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
                <h2 className="modal-title">Add Inventory Product</h2>
                <p className="modal-subtitle">Add stock item with SKU, supplier and reorder details.</p>
              </div>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleAdd}>
                <div className="form-grid">
                  <div className="form-field"><label className="label">Product Name</label><input className="input" required value={form.name} onChange={e => updateField('name', e.target.value)} /></div>
                  <div className="form-field"><label className="label">SKU</label><input className="input" required value={form.sku} onChange={e => updateField('sku', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Quantity</label><input className="input" type="number" required value={form.quantity} onChange={e => updateField('quantity', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Unit Price</label><input className="input" type="number" required value={form.unit_price} onChange={e => updateField('unit_price', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Reorder Level</label><input className="input" type="number" required value={form.reorder_level} onChange={e => updateField('reorder_level', e.target.value)} /></div>
                  <div className="form-field"><label className="label">Supplier</label><select className="select" required value={form.supplier_id} onChange={e => updateField('supplier_id', e.target.value)}><option value="">Select supplier</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select></div>
                  <div className="form-field full"><label className="label">Description</label><textarea className="textarea" value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Short product description" /></div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
