require('dotenv').config();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin user (password: admin123)
    const hash = await bcrypt.hash('admin123', 12);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('admin@erp.com', $1, 'Admin User', 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);

    const hrHash = await bcrypt.hash('hr123', 12);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('hr@erp.com', $1, 'HR Manager', 'hr_manager')
      ON CONFLICT (email) DO NOTHING
    `, [hrHash]);

    const financeHash = await bcrypt.hash('finance123', 12);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('finance@erp.com', $1, 'Finance Manager', 'finance_manager')
      ON CONFLICT (email) DO NOTHING
    `, [financeHash]);

    const inventoryHash = await bcrypt.hash('inventory123', 12);
    await client.query(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('inventory@erp.com', $1, 'Inventory Manager', 'inventory_manager')
      ON CONFLICT (email) DO NOTHING
    `, [inventoryHash]);

    // Departments
    const depts = ['Engineering', 'Human Resources', 'Finance', 'Sales', 'Operations'];
    const deptIds = [];
    for (const name of depts) {
      const r = await client.query(
        'INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id',
        [name]
      );
      deptIds.push(r.rows[0].id);
    }

    // Sample employees
    const employees = [
      ['Arjun', 'Kumar',   'arjun@erp.com',   deptIds[0], 'Senior Developer',  85000],
      ['Priya', 'Sharma',  'priya@erp.com',   deptIds[1], 'HR Executive',       52000],
      ['Ravi',  'Patel',   'ravi@erp.com',    deptIds[2], 'Finance Analyst',    62000],
      ['Anita', 'Singh',   'anita@erp.com',   deptIds[3], 'Sales Manager',      75000],
      ['Vikram','Nair',    'vikram@erp.com',  deptIds[0], 'Backend Developer',  72000],
      ['Meera', 'Reddy',   'meera@erp.com',   deptIds[4], 'Operations Lead',    68000],
    ];
    for (const [fn, ln, email, dept, pos, sal] of employees) {
      await client.query(`
        INSERT INTO employees (first_name, last_name, email, department_id, position, hire_date, salary)
        VALUES ($1,$2,$3,$4,$5,'2023-01-15',$6)
        ON CONFLICT (email) DO NOTHING
      `, [fn, ln, email, dept, pos, sal]);
    }

    // Supplier
    const supRes = await client.query(`
      INSERT INTO suppliers (name, email, phone)
      VALUES ('TechSupply Co', 'contact@techsupply.com', '9876543210')
      ON CONFLICT DO NOTHING RETURNING id
    `);
    const supId = supRes.rows[0]?.id;

    // Products
    if (supId) {
      const products = [
        ['Laptop HP 15', 'LAPTOP-001', 25, 55000, 5],
        ['Office Chair', 'CHAIR-001',  40, 8500,  10],
        ['Monitor 24"',  'MON-001',    15, 18000,  3],
        ['Keyboard',     'KB-001',     60, 1200,   20],
        ['Mouse',        'MS-001',      4, 800,    10],
      ];
      for (const [name, sku, qty, price, reorder] of products) {
        await client.query(`
          INSERT INTO products (name, sku, quantity, unit_price, reorder_level, supplier_id)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT (sku) DO NOTHING
        `, [name, sku, qty, price, reorder, supId]);
      }
    }

    // Sample revenue & expenses for current year so dashboard charts show data immediately
    const currentYear = new Date().getFullYear();
    for (let m = 1; m <= 12; m++) {
      await client.query(
        "INSERT INTO revenue (title, amount, source, date) VALUES ($1,$2,$3,$4)",
        [`Month ${m} Revenue`, Math.floor(Math.random()*500000)+300000, 'Sales', `${currentYear}-${String(m).padStart(2,'0')}-01`]
      );
      await client.query(
        "INSERT INTO expenses (title, amount, category, date) VALUES ($1,$2,$3,$4)",
        ['Operating Expenses', Math.floor(Math.random()*200000)+100000, 'Operations', `${currentYear}-${String(m).padStart(2,'0')}-15`]
      );
    }



    // CRM customers and leads
    const customers = [
      ['Greenline Traders','greenline@example.com','9876500011','Greenline Pvt Ltd','hot','Website','2026-05-10','Interested in ERP yearly license.'],
      ['Metro Retail Hub','metro@example.com','9876500012','Metro Retail','contacted','Referral','2026-05-12','Needs inventory and billing.'],
      ['Apex Solutions','apex@example.com','9876500013','Apex Solutions','converted','Campaign','2026-05-18','Converted after product demo.']
    ];
    const customerIds = [];
    for (const c of customers) {
      const r = await client.query(`INSERT INTO customers (name,email,phone,company,stage,source,next_follow_up,notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name RETURNING id`, c);
      customerIds.push(r.rows[0].id);
    }

    // Sales invoices
    for (let i = 0; i < customerIds.length; i++) {
      const subtotal = 45000 + i * 15000;
      const tax = Math.round(subtotal * 0.18);
      await client.query(`INSERT INTO sales_invoices (customer_id,invoice_no,invoice_date,due_date,items,subtotal,tax_amount,total_amount,status,notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (invoice_no) DO NOTHING`, [
        customerIds[i], `INV-${currentYear}-${String(i+1).padStart(3,'0')}`, `${currentYear}-${String(i+1).padStart(2,'0')}-05`, `${currentYear}-${String(i+1).padStart(2,'0')}-20`,
        JSON.stringify([{ name: 'ERP Software Service', quantity: 1, unit_price: subtotal }]), subtotal, tax, subtotal + tax, i % 2 === 0 ? 'paid' : 'sent', 'Sample sales invoice'
      ]);
    }

    // Attendance and leave samples
    const employeeRows = await client.query('SELECT id FROM employees ORDER BY id LIMIT 6');
    const today = new Date().toISOString().slice(0, 10);
    for (let i = 0; i < employeeRows.rows.length; i++) {
      await client.query(`INSERT INTO attendance_records (employee_id,attendance_date,check_in,check_out,status,remarks)
        VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (employee_id, attendance_date) DO NOTHING`, [employeeRows.rows[i].id, today, i === 1 ? '10:15' : '09:30', '18:00', i === 1 ? 'late' : 'present', i === 1 ? 'Late entry' : 'Regular attendance']);
    }
    if (employeeRows.rows[0]) {
      await client.query(`INSERT INTO leave_requests (employee_id,leave_type,start_date,end_date,reason,status)
        VALUES ($1,'casual',$2,$3,'Personal work','pending')`, [employeeRows.rows[0].id, `${currentYear}-05-14`, `${currentYear}-05-15`]);
    }

    // Purchase order sample
    const supplierRows = await client.query('SELECT id FROM suppliers ORDER BY id LIMIT 1');
    if (supplierRows.rows[0]) {
      await client.query(`INSERT INTO purchase_orders (supplier_id,items,total_amount,status,expected_delivery)
        VALUES ($1,$2,$3,'pending',$4)`, [supplierRows.rows[0].id, JSON.stringify([{ name: 'Laptop HP 15', quantity: 5, unit_price: 55000 }]), 275000, `${currentYear}-05-25`]);
    }

    await client.query('COMMIT');
    console.log('✅ Seed data inserted successfully.');
    console.log('   Admin: admin@erp.com / admin123');
    console.log('   HR:        hr@erp.com / hr123');
    console.log('   Finance:   finance@erp.com / finance123');
    console.log('   Inventory: inventory@erp.com / inventory123');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

seed();
