import { useEffect, useState } from "react";
import api, { cacheGet, cacheSet } from "../api.js";

export default function Year({ year }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      const cacheKey = `year-${year}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        setRows(cached);
        setLoading(false);
        return;
      }

      const { data } = await api.get("/summary/year", { params: { year } });
      if (!cancelled) {
        cacheSet(cacheKey, data);
        setRows(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year]);

  const handleDownload = async () => {
    const res = await api.get("/export/year", { params: { year }, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Year_Summary_${year}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const yearTotal = rows.reduce((acc, r) => ({
    totalRides:   acc.totalRides   + r.totalRides,
    totalKm:      acc.totalKm      + r.totalKm,
    totalEarning: acc.totalEarning + r.totalEarning,
    totalExpense: acc.totalExpense + r.totalExpense,
    netSavings:   acc.netSavings   + r.netSavings,
  }), { totalRides: 0, totalKm: 0, totalEarning: 0, totalExpense: 0, netSavings: 0 });

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Year {year}</h1>
          <div className="page-subtitle">Full year overview</div>
        </div>
        <div className="page-header-actions">
          <button className="btn-download" onClick={handleDownload}>⬇ Export Year Excel</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /><span>Loading year data…</span></div>
      ) : (
        <>
          {/* Year totals bar */}
          <div className="year-summary-bar">
            <div className="year-stat">
              <span className="year-stat-label">Total Rides</span>
              <span className="year-stat-val">{yearTotal.totalRides}</span>
            </div>
            <div className="year-stat">
              <span className="year-stat-label">Total KM</span>
              <span className="year-stat-val">{yearTotal.totalKm.toFixed(0)}</span>
            </div>
            <div className="year-stat">
              <span className="year-stat-label">Earned</span>
              <span className="year-stat-val ys-earn">₹{yearTotal.totalEarning.toLocaleString("en-IN")}</span>
            </div>
            <div className="year-stat">
              <span className="year-stat-label">Spent</span>
              <span className="year-stat-val ys-exp">₹{yearTotal.totalExpense.toLocaleString("en-IN")}</span>
            </div>
            <div className="year-stat">
              <span className="year-stat-label">Net Savings</span>
              <span className={`year-stat-val ${yearTotal.netSavings >= 0 ? "ys-save" : "ys-exp"}`}>
                ₹{yearTotal.netSavings.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Month cards grid */}
          <div className="months-grid">
            {rows.map((r) => {
              const cls = r.netSavings > 0 ? "positive" : r.netSavings < 0 ? "negative" : "zero";
              return (
                <div key={r.month} className={`month-card ${cls}`}>
                  <div className="month-card-top">
                    <span className="month-name">{r.monthName}</span>
                    {r.totalRides > 0 && (
                      <span className="month-rides-badge">{r.totalRides} rides</span>
                    )}
                  </div>
                  <div className="month-card-stats">
                    <div className="month-stat-row">
                      <span className="month-stat-key">Earned</span>
                      <span className="month-stat-val" style={{ color: "#F5C518" }}>₹{r.totalEarning.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="month-stat-row">
                      <span className="month-stat-key">Spent</span>
                      <span className="month-stat-val" style={{ color: "#F44" }}>₹{r.totalExpense.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="month-stat-row">
                      <span className="month-stat-key">KM</span>
                      <span className="month-stat-val">{r.totalKm.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="month-savings">
                    {r.netSavings >= 0 ? "+" : ""}₹{r.netSavings.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
