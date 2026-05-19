const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const s = await pool.query('SELECT COUNT(*)::int AS supplier_count FROM suppliers');
    const o = await pool.query("SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total_amount),0)::numeric AS purchase_value, COUNT(*) FILTER (WHERE status='pending')::int AS pending_orders FROM purchase_orders");
    res.json({ ...s.rows[0], ...o.rows[0] });
  } catch (err) { next(err); }
});

router.get('/suppliers', async (req, res, next) => {
  try { const result = await pool.query('SELECT * FROM suppliers ORDER BY created_at DESC, name'); res.json(result.rows); }
  catch (err) { next(err); }
});

router.post('/suppliers', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query('INSERT INTO suppliers (name,email,phone,address) VALUES ($1,$2,$3,$4) RETURNING *', [name, email, phone, address]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT po.*, s.name AS supplier_name, s.email AS supplier_email FROM purchase_orders po JOIN suppliers s ON po.supplier_id=s.id ORDER BY po.created_at DESC`);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/orders', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { supplier_id, items, expected_delivery, status } = req.body;
    const total = (items || []).reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0);
    const result = await pool.query('INSERT INTO purchase_orders (supplier_id,items,total_amount,status,expected_delivery) VALUES ($1,$2,$3,$4,$5) RETURNING *', [supplier_id, JSON.stringify(items || []), total, status || 'pending', expected_delivery || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/orders/:id/status', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE purchase_orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Purchase order not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
module.exports = router;
