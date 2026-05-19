require('dotenv').config();
const pool = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name     VARCHAR(255) NOT NULL,
        role          VARCHAR(50) NOT NULL DEFAULT 'employee'
                        CHECK (role IN ('admin','hr_manager','finance_manager','inventory_manager','employee')),
        is_active     BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id          SERIAL PRIMARY KEY,
        name        VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id            SERIAL PRIMARY KEY,
        first_name    VARCHAR(100) NOT NULL,
        last_name     VARCHAR(100) NOT NULL,
        email         VARCHAR(255) UNIQUE NOT NULL,
        phone         VARCHAR(20),
        department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
        position      VARCHAR(255),
        hire_date     DATE,
        salary        NUMERIC(12,2),
        status        VARCHAR(20) DEFAULT 'active'
                        CHECK (status IN ('active','inactive','terminated')),
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id          SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        leave_type  VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual','sick','casual','unpaid')),
        start_date  DATE NOT NULL,
        end_date    DATE NOT NULL,
        reason      TEXT,
        status      VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS payroll (
        id             SERIAL PRIMARY KEY,
        employee_id    INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        month          INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
        year           INTEGER NOT NULL,
        basic_salary   NUMERIC(12,2) NOT NULL,
        tax_deduction  NUMERIC(12,2) DEFAULT 0,
        pf_deduction   NUMERIC(12,2) DEFAULT 0,
        bonus          NUMERIC(12,2) DEFAULT 0,
        net_salary     NUMERIC(12,2) NOT NULL,
        created_at     TIMESTAMPTZ DEFAULT NOW(),
        updated_at     TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, month, year)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(255) NOT NULL,
        email      VARCHAR(255),
        phone      VARCHAR(20),
        address    TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(255) NOT NULL,
        sku           VARCHAR(100) UNIQUE NOT NULL,
        description   TEXT,
        quantity      INTEGER NOT NULL DEFAULT 0,
        unit_price    NUMERIC(12,2) NOT NULL DEFAULT 0,
        reorder_level INTEGER DEFAULT 5,
        supplier_id   INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW(),
        updated_at    TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id                SERIAL PRIMARY KEY,
        supplier_id       INTEGER NOT NULL REFERENCES suppliers(id),
        items             JSONB NOT NULL DEFAULT '[]',
        total_amount      NUMERIC(12,2),
        status            VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivered','cancelled')),
        expected_delivery DATE,
        created_at        TIMESTAMPTZ DEFAULT NOW(),
        updated_at        TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        amount      NUMERIC(12,2) NOT NULL,
        category    VARCHAR(100),
        date        DATE NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        id          SERIAL PRIMARY KEY,
        title       VARCHAR(255) NOT NULL,
        amount      NUMERIC(12,2) NOT NULL,
        source      VARCHAR(100),
        date        DATE NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);


    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(30),
        company VARCHAR(255),
        stage VARCHAR(30) DEFAULT 'new' CHECK (stage IN ('new','contacted','hot','converted','lost')),
        source VARCHAR(100),
        next_follow_up DATE,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sales_invoices (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
        invoice_no VARCHAR(80) UNIQUE NOT NULL,
        invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
        due_date DATE,
        items JSONB NOT NULL DEFAULT '[]',
        subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
        tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present','late','absent','half_day','work_from_home')),
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(employee_id, attendance_date)
      );
    `);

    await client.query('COMMIT');
    console.log('✅ All tables created successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
