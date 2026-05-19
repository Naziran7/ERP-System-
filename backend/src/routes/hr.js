const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// All HR routes require authentication
router.use(authenticate);

// GET /api/hr/employees
router.get('/employees', async (req, res, next) => {
  try {
    const { department_id, status, search } = req.query;
    let query = `
      SELECT e.*, d.name AS department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      params.push(department_id);
      query += ` AND e.department_id = $${params.length}`;
    }
    if (status) {
      params.push(status);
      query += ` AND e.status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (e.first_name ILIKE $${params.length} OR e.last_name ILIKE $${params.length} OR e.email ILIKE $${params.length})`;
    }

    query += ' ORDER BY e.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/hr/employees/:id
router.get('/employees/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/hr/employees
router.post('/employees', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, department_id, position, hire_date, salary } = req.body;
    const result = await pool.query(
      `INSERT INTO employees (first_name, last_name, email, phone, department_id, position, hire_date, salary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [first_name, last_name, email, phone, department_id, position, hire_date, salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/hr/employees/:id
router.put('/employees/:id', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone, department_id, position, status, salary } = req.body;
    const result = await pool.query(
      `UPDATE employees SET first_name=$1, last_name=$2, email=$3, phone=$4,
       department_id=$5, position=$6, status=$7, salary=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [first_name, last_name, email, phone, department_id, position, status, salary, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Employee not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/hr/employees/:id
router.delete('/employees/:id', authorize('admin'), async (req, res, next) => {
  try {
    await pool.query('UPDATE employees SET status=$1, updated_at=NOW() WHERE id=$2', ['terminated', req.params.id]);
    res.json({ message: 'Employee terminated successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/hr/departments
router.get('/departments', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT d.*, COUNT(e.id) AS employee_count
      FROM departments d
      LEFT JOIN employees e ON d.id = e.department_id AND e.status = 'active'
      GROUP BY d.id ORDER BY d.name
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/hr/departments
router.post('/departments', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/hr/leaves
router.get('/leaves', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT l.*, e.first_name, e.last_name, e.email
      FROM leave_requests l
      JOIN employees e ON l.employee_id = e.id
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/hr/leaves
router.post('/leaves', async (req, res, next) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;
    const result = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [employee_id, leave_type, start_date, end_date, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/hr/leaves/:id/status
router.put('/leaves/:id/status', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE leave_requests SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
