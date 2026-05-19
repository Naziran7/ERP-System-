import React, { useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js';
import api from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const formatCurrency = (value) => Number(value || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

const FinanceDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/finance/summary', { params: { year } });
        setSummary(res.data);
      } catch (_) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [year]);

  const chartData = useMemo(() => {
    const revenueByMonth = Array(12).fill(0);
    const expenseByMonth = Array(12).fill(0);

    summary?.monthly_revenue?.forEach(row => {
      revenueByMonth[Number(row.month) - 1] = Number(row.total || 0);
    });
    summary?.monthly_expenses?.forEach(row => {
      expenseByMonth[Number(row.month) - 1] = Number(row.total || 0);
    });

    return {
      labels: MONTHS,
      datasets: [
        {
          label: 'Revenue',
          data: revenueByMonth,
          backgroundColor: 'rgba(22, 163, 74, 0.82)',
          borderRadius: 12,
          barThickness: 24,
        },
        {
          label: 'Expenses',
          data: expenseByMonth,
          backgroundColor: 'rgba(220, 38, 38, 0.78)',
          borderRadius: 12,
          barThickness: 24,
        },
      ],
    };
  }, [summary]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, boxHeight: 12, useBorderRadius: true, borderRadius: 4 },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: value => `₹${Number(value / 1000).toFixed(0)}k` },
        grid: { color: '#edf2f7' },
      },
      x: { grid: { display: false } },
    },
  };

  const profitMargin = Number(summary?.total_revenue || 0) > 0
    ? ((Number(summary?.net_profit || 0) / Number(summary?.total_revenue || 0)) * 100).toFixed(1)
    : '0.0';

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Financial Intelligence</p>
          <h1 className="page-title">Finance Dashboard</h1>
          <p className="page-subtitle">Analyze revenue, expenses, net profit and yearly business performance through management-ready visual reporting.</p>
        </div>
        <select className="select" value={year} onChange={e => setYear(Number(e.target.value))} style={{ width: 180 }}>
          {[2024, 2025, 2026, 2027].map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="loading-state card"><div><div className="loading-spinner" /><p>Loading financial summary...</p></div></div>
      ) : (
        <>
          <div className="grid grid-4" style={{ marginBottom: 20 }}>
            <div className="card metric-card" style={{ '--metric-color': '#16a34a', '--metric-soft': '#dcfce7' }}>
              <div className="metric-top"><p className="metric-label">Total Revenue</p><span className="metric-icon">↗</span></div>
              <p className="metric-value">{formatCurrency(summary?.total_revenue)}</p><p className="metric-sub">Income received in {year}</p>
            </div>
            <div className="card metric-card" style={{ '--metric-color': '#dc2626', '--metric-soft': '#fee2e2' }}>
              <div className="metric-top"><p className="metric-label">Total Expenses</p><span className="metric-icon">↘</span></div>
              <p className="metric-value">{formatCurrency(summary?.total_expenses)}</p><p className="metric-sub">Operating cost in {year}</p>
            </div>
            <div className="card metric-card" style={{ '--metric-color': Number(summary?.net_profit || 0) >= 0 ? '#2563eb' : '#dc2626', '--metric-soft': Number(summary?.net_profit || 0) >= 0 ? '#dbeafe' : '#fee2e2' }}>
              <div className="metric-top"><p className="metric-label">Net Profit</p><span className="metric-icon">◎</span></div>
              <p className="metric-value">{formatCurrency(summary?.net_profit)}</p><p className="metric-sub">Revenue minus expenses</p>
            </div>
            <div className="card metric-card" style={{ '--metric-color': '#7c3aed', '--metric-soft': '#ede9fe' }}>
              <div className="metric-top"><p className="metric-label">Profit Margin</p><span className="metric-icon">%</span></div>
              <p className="metric-value">{profitMargin}%</p><p className="metric-sub">Net profit against revenue</p>
            </div>
          </div>

          <div className="grid grid-3">
            <section className="card chart-card finance-wide">
              <div className="chart-header">
                <div>
                  <h3 className="card-title">Revenue vs Expenses — {year}</h3>
                  <p className="card-subtitle">Monthly comparison for business performance tracking.</p>
                </div>
                <span className="badge badge-blue">Yearly Report</span>
              </div>
              <div className="chart-wrap">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </section>

            <section className="card card-pad">
              <div className="chart-header" style={{ marginBottom: 16 }}>
                <div>
                  <h3 className="card-title">Management Notes</h3>
                  <p className="card-subtitle">Useful points for viva and project explanation.</p>
                </div>
              </div>
              <div className="activity-list">
                <div className="activity-item"><span className="activity-icon">1</span><div><p className="activity-title">P&L View</p><p className="activity-text">Shows profitability from total revenue and expense data.</p></div></div>
                <div className="activity-item"><span className="activity-icon">2</span><div><p className="activity-title">Decision Support</p><p className="activity-text">Helps managers compare monthly financial trends.</p></div></div>
                <div className="activity-item"><span className="activity-icon">3</span><div><p className="activity-title">Data Driven</p><p className="activity-text">Uses PostgreSQL finance records through REST APIs.</p></div></div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceDashboard;
