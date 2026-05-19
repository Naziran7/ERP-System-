const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const total = await pool.query("SELECT COUNT(*)::int AS total FROM customers WHERE status <> 'archived'");
    const hot = await pool.query("SELECT COUNT(*)::int AS hot FROM customers WHERE stage='hot' AND status <> 'archived'");
    const converted = await pool.query("SELECT COUNT(*)::int AS converted FROM customers WHERE stage='converted' AND status <> 'archived'");
    res.json({ total_customers: total.rows[0].total, hot_leads: hot.rows[0].hot, converted_customers: converted.rows[0].converted });
  } catch (err) { next(err); }
});

router.get('/customers', async (req, res, next) => {
  try {
    const { search, stage } = req.query;
    const params = [];
    let sql = "SELECT * FROM customers WHERE status <> 'archived'";
    if (search) { params.push(`%${search}%`); sql += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length} OR company ILIKE $${params.length})`; }
    if (stage) { params.push(stage); sql += ` AND stage=$${params.length}`; }
    sql += ' ORDER BY updated_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/customers', authorize('admin', 'hr_manager', 'finance_manager'), async (req, res, next) => {
  try {
    const { name, email, phone, company, stage, source, next_follow_up, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO customers (name,email,phone,company,stage,source,next_follow_up,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, email || null, phone || null, company || null, stage || 'new', source || 'Website', next_follow_up || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.put('/customers/:id/stage', authorize('admin', 'hr_manager', 'finance_manager'), async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE customers SET stage=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [req.body.stage, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Customer not found.' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/customers/:id', authorize('admin'), async (req, res, next) => {
  try {
    await pool.query("UPDATE customers SET status='archived', updated_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ message: 'Customer archived.' });
  } catch (err) { next(err); }
});
module.exports = router;
