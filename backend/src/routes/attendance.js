const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const a = await pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='present')::int AS present, COUNT(*) FILTER (WHERE status='late')::int AS late, COUNT(*) FILTER (WHERE status='absent')::int AS absent FROM attendance_records WHERE attendance_date=$1`, [today]);
    const l = await pool.query("SELECT COUNT(*)::int AS pending_leaves FROM leave_requests WHERE status='pending'");
    res.json({ today_records: a.rows[0].total, present_today: a.rows[0].present, late_today: a.rows[0].late, absent_today: a.rows[0].absent, pending_leaves: l.rows[0].pending_leaves });
  } catch (err) { next(err); }
});

router.get('/records', async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0,10);
    const result = await pool.query(`
      SELECT ar.*, e.first_name, e.last_name, e.email, d.name AS department_name
      FROM attendance_records ar JOIN employees e ON ar.employee_id=e.id
      LEFT JOIN departments d ON e.department_id=d.id
      WHERE ar.attendance_date=$1 ORDER BY e.first_name`, [date]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/records', authorize('admin', 'hr_manager'), async (req, res, next) => {
  try {
    const { employee_id, attendance_date, check_in, check_out, status, remarks } = req.body;
    const result = await pool.query(`
      INSERT INTO attendance_records (employee_id,attendance_date,check_in,check_out,status,remarks)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET check_in=EXCLUDED.check_in, check_out=EXCLUDED.check_out, status=EXCLUDED.status, remarks=EXCLUDED.remarks, updated_at=NOW()
      RETURNING *`, [employee_id, attendance_date, check_in || null, check_out || null, status || 'present', remarks || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});
module.exports = router;
