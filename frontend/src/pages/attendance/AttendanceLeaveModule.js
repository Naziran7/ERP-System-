import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
const today = () => new Date().toISOString().slice(0, 10);
const badges = {
  present: "badge-green",
  late: "badge-yellow",
  absent: "badge-red",
  half_day: "badge-blue",
  work_from_home: "badge-teal",
  pending: "badge-yellow",
  approved: "badge-green",
  rejected: "badge-red",
};
const emptyAttendance = {
  employee_id: "",
  attendance_date: today(),
  check_in: "09:30",
  check_out: "18:00",
  status: "present",
  remarks: "",
};
const emptyLeave = {
  employee_id: "",
  leave_type: "casual",
  start_date: today(),
  end_date: today(),
  reason: "",
};

const AttendanceLeaveModule = () => {
  const { hasRole } = useAuth();
  const [records, setRecords] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [date, setDate] = useState(today());
  const [tab, setTab] = useState("attendance");
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState(emptyAttendance);
  const [leave, setLeave] = useState(emptyLeave);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showLeave, setShowLeave] = useState(false);
  const canManage = hasRole("admin", "hr_manager");
  const load = async () => {
    setLoading(true);
    try {
      const [r, l, e, s] = await Promise.all([
        api.get("/attendance/records", { params: { date } }),
        api.get("/hr/leaves"),
        api.get("/hr/employees"),
        api.get("/attendance/summary"),
      ]);
      setRecords(r.data);
      setLeaves(l.data);
      setEmployees(e.data);
      setSummary(s.data);
    } catch (_) {
      setRecords([]);
      setLeaves([]);
      setEmployees([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [date]);
  const saveAttendance = async (e) => {
    e.preventDefault();
    try {
      await api.post("/attendance/records", attendance);
      setAttendance(emptyAttendance);
      setShowAttendance(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save attendance.");
    }
  };
  const saveLeave = async (e) => {
    e.preventDefault();
    try {
      await api.post("/hr/leaves", leave);
      setLeave(emptyLeave);
      setShowLeave(false);
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to submit leave.");
    }
  };
  const updateLeave = async (id, status) => {
    try {
      await api.put(`/hr/leaves/${id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update leave.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">Workforce Time Management</p>
          <h1 className="page-title">Attendance and Leave Module</h1>
          <p className="page-subtitle">
            Mark attendance, manage check-in and check-out, and approve employee
            leave requests.
          </p>
        </div>
        <div className="header-actions">
          {canManage && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowAttendance(true)}
            >
              + Mark Attendance
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowLeave(true)}
          >
            + Apply Leave
          </button>
        </div>
      </div>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div
          className="card metric-card"
          style={{ "--metric-color": "#2563eb", "--metric-soft": "#dbeafe" }}
        >
          <div className="metric-top">
            <p className="metric-label">Today Records</p>
            <span className="metric-icon">◷</span>
          </div>
          <p className="metric-value">
            {summary?.today_records ?? records.length}
          </p>
          <p className="metric-sub">Attendance entries</p>
        </div>
        <div
          className="card metric-card"
          style={{ "--metric-color": "#16a34a", "--metric-soft": "#dcfce7" }}
        >
          <div className="metric-top">
            <p className="metric-label">Present</p>
            <span className="metric-icon">✓</span>
          </div>
          <p className="metric-value">{summary?.present_today ?? 0}</p>
          <p className="metric-sub">Present today</p>
        </div>
        <div
          className="card metric-card"
          style={{ "--metric-color": "#d97706", "--metric-soft": "#fef3c7" }}
        >
          <div className="metric-top">
            <p className="metric-label">Late</p>
            <span className="metric-icon">!</span>
          </div>
          <p className="metric-value">{summary?.late_today ?? 0}</p>
          <p className="metric-sub">Late marks</p>
        </div>
        <div
          className="card metric-card"
          style={{ "--metric-color": "#7c3aed", "--metric-soft": "#ede9fe" }}
        >
          <div className="metric-top">
            <p className="metric-label">Pending Leaves</p>
            <span className="metric-icon">✉</span>
          </div>
          <p className="metric-value">{summary?.pending_leaves ?? 0}</p>
          <p className="metric-sub">Need approval</p>
        </div>
      </div>
      <div className="toolbar">
        <div className="toolbar-left">
          <button
            className={`tab-btn ${tab === "attendance" ? "active" : ""}`}
            onClick={() => setTab("attendance")}
          >
            Attendance
          </button>
          <button
            className={`tab-btn ${tab === "leaves" ? "active" : ""}`}
            onClick={() => setTab("leaves")}
          >
            Leave Requests
          </button>
          {tab === "attendance" && (
            <input
              className="input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </div>
        <span className="badge badge-teal">HR Workflow</span>
      </div>
      <div className="card table-card">
        {loading ? (
          <div className="loading-state">
            <div>
              <div className="loading-spinner" />
              <p>Loading data...</p>
            </div>
          </div>
        ) : tab === "attendance" ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="primary-cell">
                        {r.first_name} {r.last_name}
                      </div>
                      <div className="muted-cell">{r.email}</div>
                    </td>
                    <td>{r.department_name || "—"}</td>
                    <td>
                      {r.attendance_date
                        ? new Date(r.attendance_date).toLocaleDateString(
                            "en-IN",
                          )
                        : "—"}
                    </td>
                    <td>{r.check_in || "—"}</td>
                    <td>{r.check_out || "—"}</td>
                    <td>
                      <span
                        className={`badge ${badges[r.status] || "badge-blue"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="muted-cell">{r.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Period</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <div className="primary-cell">
                        {l.first_name} {l.last_name}
                      </div>
                      <div className="muted-cell">{l.email}</div>
                    </td>
                    <td>{l.leave_type}</td>
                    <td>
                      {new Date(l.start_date).toLocaleDateString("en-IN")} -{" "}
                      {new Date(l.end_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="muted-cell">{l.reason || "—"}</td>
                    <td>
                      <span
                        className={`badge ${badges[l.status] || "badge-blue"}`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {canManage ? (
                        <div className="action-row">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => updateLeave(l.id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => updateLeave(l.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showAttendance && (
        <div
          className="modal-backdrop"
          onClick={() => setShowAttendance(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Mark Attendance</h2>
                <p className="modal-subtitle">Create or update daily record.</p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowAttendance(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveAttendance}>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="label">Employee</label>
                    <select
                      className="select"
                      required
                      value={attendance.employee_id}
                      onChange={(e) =>
                        setAttendance({
                          ...attendance,
                          employee_id: e.target.value,
                        })
                      }
                    >
                      <option value="">Select</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.first_name} {e.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="label">Date</label>
                    <input
                      className="input"
                      type="date"
                      value={attendance.attendance_date}
                      onChange={(e) =>
                        setAttendance({
                          ...attendance,
                          attendance_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="label">Check In</label>
                    <input
                      className="input"
                      type="time"
                      value={attendance.check_in}
                      onChange={(e) =>
                        setAttendance({
                          ...attendance,
                          check_in: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="label">Status</label>
                    <select
                      className="select"
                      value={attendance.status}
                      onChange={(e) =>
                        setAttendance({ ...attendance, status: e.target.value })
                      }
                    >
                      <option value="present">Present</option>
                      <option value="late">Late</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                      <option value="work_from_home">Work From Home</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAttendance(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {showLeave && (
        <div className="modal-backdrop" onClick={() => setShowLeave(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Apply Leave</h2>
                <p className="modal-subtitle">Submit request for approval.</p>
              </div>
              <button className="close-btn" onClick={() => setShowLeave(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={saveLeave}>
                <div className="form-grid">
                  <div className="form-field">
                    <label className="label">Employee</label>
                    <select
                      className="select"
                      required
                      value={leave.employee_id}
                      onChange={(e) =>
                        setLeave({ ...leave, employee_id: e.target.value })
                      }
                    >
                      <option value="">Select</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.first_name} {e.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="label">Type</label>
                    <select
                      className="select"
                      value={leave.leave_type}
                      onChange={(e) =>
                        setLeave({ ...leave, leave_type: e.target.value })
                      }
                    >
                      <option value="annual">Annual</option>
                      <option value="sick">Sick</option>
                      <option value="casual">Casual</option>
                      <option value="unpaid">Unpaid</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="label">Start</label>
                    <input
                      className="input"
                      type="date"
                      value={leave.start_date}
                      onChange={(e) =>
                        setLeave({ ...leave, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-field">
                    <label className="label">End</label>
                    <input
                      className="input"
                      type="date"
                      value={leave.end_date}
                      onChange={(e) =>
                        setLeave({ ...leave, end_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-field full">
                    <label className="label">Reason</label>
                    <textarea
                      className="textarea"
                      value={leave.reason}
                      onChange={(e) =>
                        setLeave({ ...leave, reason: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowLeave(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AttendanceLeaveModule;
