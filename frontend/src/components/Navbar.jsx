import { NavLink } from "react-router-dom";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Navbar({ period, setPeriod }) {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 3; y <= currentYear + 1; y++) years.push(y);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="brand-mark">SL</span>
        <div>
          <div className="brand-title">Shift Ledger</div>
          <div className="brand-sub">Ride earnings, tracked</div>
        </div>
      </div>
      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
        <NavLink to="/rides" className={({ isActive }) => (isActive ? "active" : "")}>Rides</NavLink>
        <NavLink to="/expenses" className={({ isActive }) => (isActive ? "active" : "")}>Expenses</NavLink>
        <NavLink to="/year" className={({ isActive }) => (isActive ? "active" : "")}>Year</NavLink>
      </nav>
      <div className="period-picker">
        <select value={period.month} onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <select value={period.year} onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </header>
  );
}
