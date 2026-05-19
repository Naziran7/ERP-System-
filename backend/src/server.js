require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes      = require('./routes/auth');
const hrRoutes        = require('./routes/hr');
const payrollRoutes   = require('./routes/payroll');
const inventoryRoutes = require('./routes/inventory');
const financeRoutes   = require('./routes/finance');
const crmRoutes       = require('./routes/crm');
const salesRoutes     = require('./routes/sales');
const attendanceRoutes = require('./routes/attendance');
const purchaseRoutes  = require('./routes/purchase');
const reportsRoutes   = require('./routes/reports');

const app = express();

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/hr',        hrRoutes);
app.use('/api/payroll',   payrollRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/finance',   financeRoutes);
app.use('/api/crm',       crmRoutes);
app.use('/api/sales',     salesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/purchase',  purchaseRoutes);
app.use('/api/reports',   reportsRoutes);

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ───────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ERP Server running on port ${PORT}`);
  console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
