import { Routes, Route } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import FAB from "./components/FAB.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Rides from "./pages/Rides.jsx";
import Expenses from "./pages/Expenses.jsx";
import Year from "./pages/Year.jsx";
import { cacheBust } from "./api.js";

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export default function App() {
  const [period,     setPeriod]     = useState(getCurrentMonthYear());
  const [refreshKey, setRefreshKey] = useState(0);

  const defaultDate = `${period.year}-${String(period.month).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  // When period changes, bust caches for the new period so fresh data loads
  const handleSetPeriod = (p) => {
    setPeriod(p);
    setRefreshKey((k) => k + 1);
  };

  // FAB saved: bump refreshKey so active page re-fetches (cache already busted by FAB)
  const handleFABSaved = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app-shell">
      <Sidebar period={period} setPeriod={handleSetPeriod} />
      <div className="app-main">
        <Routes>
          <Route path="/"         element={<Dashboard  key={`dash-${refreshKey}`}    period={period} />} />
          <Route path="/rides"    element={<Rides      key={`rides-${refreshKey}`}   period={period} />} />
          <Route path="/expenses" element={<Expenses   key={`exp-${refreshKey}`}     period={period} />} />
          <Route path="/year"     element={<Year       key={`year-${period.year}`}   year={period.year} />} />
        </Routes>
      </div>
      <FAB defaultDate={defaultDate} onSaved={handleFABSaved} period={period} />
    </div>
  );
}
