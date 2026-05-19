const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/overview', async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const [employees, products, customers, invoices, purchases, revenue, expenses, attendance, leaves] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM employees WHERE status='active'"),
      pool.query('SELECT COUNT(*)::int AS count, COALESCE(SUM(quantity * unit_price),0)::numeric AS stock_value FROM products'),
      pool.query("SELECT COUNT(*)::int AS count FROM customers WHERE status <> 'archived'"),
      pool.query('SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount),0)::numeric AS value FROM sales_invoices'),
      pool.query('SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount),0)::numeric AS value FROM purchase_orders'),
      pool.query('SELECT COALESCE(SUM(amount),0)::numeric AS value FROM revenue WHERE EXTRACT(YEAR FROM date)=$1', [year]),
      pool.query('SELECT COALESCE(SUM(amount),0)::numeric AS value FROM expenses WHERE EXTRACT(YEAR FROM date)=$1', [year]),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='present')::int AS present, COUNT(*) FILTER (WHERE status='late')::int AS late, COUNT(*) FILTER (WHERE status='absent')::int AS absent FROM attendance_records"),
      pool.query("SELECT COUNT(*) FILTER (WHERE status='pending')::int AS pending, COUNT(*) FILTER (WHERE status='approved')::int AS approved FROM leave_requests"),
    ]);
    const monthlyFinance = await pool.query(`
      SELECT month, SUM(revenue) AS revenue, SUM(expenses) AS expenses FROM (
        SELECT EXTRACT(MONTH FROM date)::int AS month, amount AS revenue, 0::numeric AS expenses FROM revenue WHERE EXTRACT(YEAR FROM date)=$1
        UNION ALL
        SELECT EXTRACT(MONTH FROM date)::int AS month, 0::numeric AS revenue, amount AS expenses FROM expenses WHERE EXTRACT(YEAR FROM date)=$1
      ) x GROUP BY month ORDER BY month`, [year]);
    res.json({
      year, employees: employees.rows[0].count, products: products.rows[0].count, stock_value: products.rows[0].stock_value,
      customers: customers.rows[0].count, invoices: invoices.rows[0].count, sales_value: invoices.rows[0].value,
      purchase_orders: purchases.rows[0].count, purchase_value: purchases.rows[0].value,
      revenue: revenue.rows[0].value, expenses: expenses.rows[0].value,
      net_profit: Number(revenue.rows[0].value || 0) - Number(expenses.rows[0].value || 0),
      attendance: attendance.rows[0], leaves: leaves.rows[0], monthly_finance: monthlyFinance.rows
    });
  } catch (err) { next(err); }
});
module.exports = router;
