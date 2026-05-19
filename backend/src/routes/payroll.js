const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/payroll
router.get('/', authorize('admin', 'hr_manager', 'finance_manager'), async (req, res, next) => {
  try {
    const { month, year } = req.query;
    let query = `
      SELECT p.*, e.first_name, e.last_name, e.email, d.name AS department_name
      FROM payroll p
      JOIN employees e ON p.employee_id = e.id
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (month) { params.push(month); query += ` AND p.month = $${params.length}`; }
    if (year)  { params.push(year);  query += ` AND p.year = $${params.length}`; }
    query += ' ORDER BY p.year DESC, p.month DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/payroll/generate
router.post('/generate', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { month, year } = req.body;

    // Get all active employees with salary
    const employees = await pool.query(
      "SELECT id, salary FROM employees WHERE status = 'active'"
    );

    const payslips = [];
    for (const emp of employees.rows) {
      const gross = parseFloat(emp.salary);
      const tax_deduction = gross * 0.1;       // 10% tax
      const pf_deduction = gross * 0.12;       // 12% provident fund
      const net_salary = gross - tax_deduction - pf_deduction;

      const result = await pool.query(
        `INSERT INTO payroll (employee_id, month, year, basic_salary, tax_deduction, pf_deduction, net_salary)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (employee_id, month, year) DO UPDATE
         SET basic_salary=$4, tax_deduction=$5, pf_deduction=$6, net_salary=$7, updated_at=NOW()
         RETURNING *`,
        [emp.id, month, year, gross, tax_deduction, pf_deduction, net_salary]
      );
      payslips.push(result.rows[0]);
    }

    res.status(201).json({ message: `Generated ${payslips.length} payslips.`, payslips });
  } catch (err) {
    next(err);
  }
});

// GET /api/payroll/employee/:id
router.get('/employee/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM payroll WHERE employee_id = $1 ORDER BY year DESC, month DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
