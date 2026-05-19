const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/inventory/products
router.get('/products', async (req, res, next) => {
  try {
    const { low_stock, search } = req.query;
    let query = `
      SELECT p.*, s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (low_stock === 'true') {
      query += ' AND p.quantity <= p.reorder_level';
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
    }
    query += ' ORDER BY p.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/products
router.post('/products', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { name, sku, description, quantity, unit_price, reorder_level, supplier_id } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, sku, description, quantity, unit_price, reorder_level, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, sku, description, quantity, unit_price, reorder_level, supplier_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/inventory/products/:id/stock
router.put('/products/:id/stock', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' | 'subtract' | 'set'
    let query;
    if (operation === 'add') {
      query = 'UPDATE products SET quantity = quantity + $1, updated_at=NOW() WHERE id=$2 RETURNING *';
    } else if (operation === 'subtract') {
      query = 'UPDATE products SET quantity = GREATEST(0, quantity - $1), updated_at=NOW() WHERE id=$2 RETURNING *';
    } else {
      query = 'UPDATE products SET quantity = $1, updated_at=NOW() WHERE id=$2 RETURNING *';
    }
    const result = await pool.query(query, [quantity, req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/suppliers
router.get('/suppliers', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/suppliers
router.post('/suppliers', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, phone, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/purchase-orders
router.get('/purchase-orders', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT po.*, s.name AS supplier_name
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory/purchase-orders
router.post('/purchase-orders', authorize('admin', 'inventory_manager'), async (req, res, next) => {
  try {
    const { supplier_id, items, expected_delivery } = req.body;
    const total = items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
    const result = await pool.query(
      `INSERT INTO purchase_orders (supplier_id, items, total_amount, expected_delivery)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [supplier_id, JSON.stringify(items), total, expected_delivery]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
