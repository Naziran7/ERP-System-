const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'finance_manager'));

// GET /api/finance/expenses
router.get('/expenses', async (req, res, next) => {
  try {
    const { category, month, year } = req.query;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (month)    { params.push(month);    query += ` AND EXTRACT(MONTH FROM date) = $${params.length}`; }
    if (year)     { params.push(year);     query += ` AND EXTRACT(YEAR FROM date) = $${params.length}`; }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/finance/expenses
router.post('/expenses', async (req, res, next) => {
  try {
    const { title, amount, category, date, description } = req.body;
    const result = await pool.query(
      'INSERT INTO expenses (title, amount, category, date, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, amount, category, date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/finance/revenue
router.get('/revenue', async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let query = 'SELECT * FROM revenue WHERE 1=1';
    const params = [];
    if (month) { params.push(month); query += ` AND EXTRACT(MONTH FROM date) = $${params.length}`; }
    if (year)  { params.push(year);  query += ` AND EXTRACT(YEAR FROM date) = $${params.length}`; }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/finance/revenue
router.post('/revenue', async (req, res, next) => {
  try {
    const { title, amount, source, date, description } = req.body;
    const result = await pool.query(
      'INSERT INTO revenue (title, amount, source, date, description) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, amount, source, date, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/finance/summary
router.get('/summary', async (req, res, next) => {
  try {
    const { year } = req.query;
    const y = year || new Date().getFullYear();

    const [expResult, revResult] = await Promise.all([
      pool.query(
        `SELECT EXTRACT(MONTH FROM date) AS month, SUM(amount) AS total
         FROM expenses WHERE EXTRACT(YEAR FROM date) = $1
         GROUP BY month ORDER BY month`,
        [y]
      ),
      pool.query(
        `SELECT EXTRACT(MONTH FROM date) AS month, SUM(amount) AS total
         FROM revenue WHERE EXTRACT(YEAR FROM date) = $1
         GROUP BY month ORDER BY month`,
        [y]
      ),
    ]);

    const totalExpenses = expResult.rows.reduce((s, r) => s + parseFloat(r.total), 0);
    const totalRevenue  = revResult.rows.reduce((s, r) => s + parseFloat(r.total), 0);

    res.json({
      year: y,
      total_revenue: totalRevenue,
      total_expenses: totalExpenses,
      net_profit: totalRevenue - totalExpenses,
      monthly_expenses: expResult.rows,
      monthly_revenue: revResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
