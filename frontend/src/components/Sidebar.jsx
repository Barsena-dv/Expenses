import { NavLink } from "react-router-dom";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const NAV_ITEMS = [
  { to: "/",        icon: "📊", label: "Dashboard" },
  { to: "/rides",   icon: "🛺", label: "Rides"     },
  { to: "/expenses",icon: "💸", label: "Expenses"  },
  { to: "/year",    icon: "📅", label: "Year View" },
];

export default function Sidebar({ period, setPeriod }) {
  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 3; y <= currentYear + 1; y++) years.push(y);

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">SL</div>
          <div className="brand-text">
            <div className="brand-title">Shift Ledger</div>
            <div className="brand-sub">Ride earnings tracker</div>
          </div>
        </div>

        <div className="sidebar-period">
          <label>Period</label>
          <select
            value={period.month}
            onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={period.year}
            onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to} to={to} end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">Shift Ledger v1.0</div>
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="topbar">
        <div className="sidebar-brand" style={{ border: "none", padding: 0 }}>
          <div className="brand-logo">SL</div>
          <div className="brand-title">Shift Ledger</div>
        </div>
        <div className="topbar-period">
          <select
            value={period.month}
            onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m.slice(0, 3)}</option>)}
          </select>
          <select
            value={period.year}
            onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mobile-nav">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to} to={to} end={to === "/"}
            className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}
          >
            <span className="mobile-nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
