import { Routes, Route, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import FAB from "./components/FAB.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rides from "./pages/Rides.jsx";
import Expenses from "./pages/Expenses.jsx";
import Year from "./pages/Year.jsx";

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

// Callback ref so FAB can trigger page reloads
let _reload = null;
export function setReload(fn) { _reload = fn; }

export default function App() {
  const [period, setPeriod] = useState(getCurrentMonthYear());
  const [refreshKey, setRefreshKey] = useState(0);
  const location = useLocation();

  const defaultDate = `${period.year}-${String(period.month).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  const handleFABSaved = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app-shell">
      <Sidebar period={period} setPeriod={setPeriod} />
      <div className="app-main">
        <Routes>
          <Route path="/"        element={<Dashboard  key={refreshKey} period={period} />} />
          <Route path="/rides"   element={<Rides      key={refreshKey} period={period} />} />
          <Route path="/expenses"element={<Expenses   key={refreshKey} period={period} />} />
          <Route path="/year"    element={<Year year={period.year} />} />
        </Routes>
      </div>
      <FAB defaultDate={defaultDate} onSaved={handleFABSaved} />
    </div>
  );
}
