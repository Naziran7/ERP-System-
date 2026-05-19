# Enterprise ERP System — Professional Final Year Project

A full-stack ERP application redesigned with a modern corporate dashboard UI for organization-level business management.

## Project Modules

- **Authentication** — JWT login with role-based access control
- **Dashboard** — executive KPI cards and organization command center
- **Human Resource** — employee listing, department filter and add employee form
- **Payroll** — monthly payroll generation with tax, PF and net salary
- **Inventory** — products, suppliers, SKU tracking and low-stock alerts
- **Finance** — revenue vs expenses chart, net profit and profit margin

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, React Router, Chart.js, Axios, CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL / Neon |
| Authentication | JWT, bcrypt, role-based access |

## Folder Structure

```text
erp-system/
├── backend/
│   ├── src/config/       # Database connection, migration, seed
│   ├── src/middleware/   # Auth and error handlers
│   ├── src/routes/       # REST API routes
│   └── package.json
│
└── frontend/
    ├── public/
    ├── src/components/   # Layout and protected route
    ├── src/context/      # Auth context
    ├── src/pages/        # Login, dashboard, HR, payroll, inventory, finance
    ├── src/utils/        # API client
    └── package.json
```

## Run the Project Locally

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file inside the backend folder by copying `.env.example`:

```env
DATABASE_URL=postgresql://user:password@host/erp_db?sslmode=require
JWT_SECRET=your_secret_key
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

Run database migration and insert demo data:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 2. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

Frontend runs on:

```text
http://localhost:3000
```

## Demo Login Details

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | admin123 |
| HR Manager | hr@erp.com | hr123 |
| Finance Manager | finance@erp.com | finance123 |
| Inventory Manager | inventory@erp.com | inventory123 |

## What Was Improved in UI

- Converted the interface into a **business SaaS / corporate ERP style**.
- Added a professional **login landing screen** with demo credentials.
- Added a premium **sidebar + topbar layout** with responsive design.
- Added **executive KPI cards**, module cards, status badges and table styling.
- Improved HR, Payroll, Inventory and Finance pages with advanced dashboards.
- Reorganized the project into one clean frontend folder instead of mixed CRA/Vite structure.
- Added responsive behavior for laptop, tablet and mobile screen sizes.

## Important Notes

- Start the backend before opening the frontend.
- Use `npm run db:migrate` before `npm run db:seed`.
- If the frontend cannot connect, check that backend is running on port `5000`.
- If you deploy backend separately, set `REACT_APP_API_URL` in the frontend environment.


## Advanced ERP Modules Added

This version includes CRM, Sales and Invoice, Attendance and Leave, Supplier and Purchase, and Reports and Analytics modules. Run `npm run db:migrate` and `npm run db:seed` again because new database tables were added.
