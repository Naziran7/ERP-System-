const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);
const invoiceNo = () => `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

router.get('/summary', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*)::int AS invoice_count,
      COALESCE(SUM(total_amount),0)::numeric AS total_sales,
      COALESCE(SUM(CASE WHEN status='paid' THEN total_amount ELSE 0 END),0)::numeric AS paid_amount,
      COALESCE(SUM(CASE WHEN status IN ('sent','overdue') THEN total_amount ELSE 0 END),0)::numeric AS outstanding_amount
      FROM sales_invoices
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.get('/invoices', async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const params = [];
    let sql = `SELECT si.*, c.name AS customer_name, c.company AS customer_company FROM sales_invoices si LEFT JOIN customers c ON si.customer_id=c.id WHERE 1=1`;
    if (search) { params.push(`%${search}%`); sql += ` AND (si.invoice_no ILIKE $${params.length} OR c.name ILIKE $${params.length})`; }
    if (status) { params.push(status); sql += ` AND si.status=$${params.length}`; }
    sql += ' ORDER BY si.invoice_date DESC, si.created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/invoices', authorize('admin', 'finance_manager'), async (req, res, next) => {
  try {
    const { customer_id, invoice_date, due_date, items, subtotal, tax_amount, discount_amount, status, notes } = req.body;
    const sub = Number(subtotal || (items || []).reduce((s, i) => s + Number(i.quantity || 0) * Number(i.unit_price || 0), 0));
    const tax = Number(tax_amount || Math.round(sub * 0.18));
    const discount = Number(discount_amount || 0);
    const total = sub + tax - discount;
    const result = await pool.query(
      `INSERT INTO sales_invoices (customer_id,invoice_no,invoice_date,due_date,items,subtotal,tax_amount,discount_amount,total_amount,status,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [customer_id || null, invoiceNo(), invoice_date || new Date().toISOString().slice(0,10), due_date || null, JSON.stringify(items || []), sub, tax, discount, total, status || 'draft', notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/invoices/:id/status', authorize('admin', 'finance_manager'), async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE sales_invoices SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.status, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Invoice not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});
module.exports = router;
