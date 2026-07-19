import { useEffect, useState } from "react";
import api, { cacheGet, cacheSet } from "../api.js";
import SummaryCards from "../components/SummaryCards.jsx";
import EarningsChart from "../components/EarningsChart.jsx";
import AccountPieChart from "../components/AccountPieChart.jsx";
import OpeningBalanceModal from "../components/OpeningBalanceModal.jsx";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function Dashboard({ period }) {
  const [summary,     setSummary]     = useState(null);
  const [dailySeries, setDailySeries] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showOBModal, setShowOBModal] = useState(false);
  const [refresh,     setRefresh]     = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);

      const cacheKey = `dashboard-${period.year}-${period.month}-${refresh}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        setSummary(cached.summary);
        setDailySeries(cached.dailySeries);
        setLoading(false);
        return;
      }

      // Single request replaces 3 parallel calls
      const { data } = await api.get("/summary/month-full", { params: period });
      if (cancelled) return;

      cacheSet(cacheKey, data);
      setSummary(data.summary);
      setDailySeries(data.dailySeries);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [period.month, period.year, refresh]);

  const handleDownload = async () => {
    const res = await api.get("/export/month", { params: period, responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Ride_Tracker_${period.year}_${String(period.month).padStart(2, "0")}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading || !summary) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  const monthName = MONTHS[period.month - 1];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{monthName} {period.year}</h1>
          <div className="page-subtitle">Your monthly earnings overview</div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost" onClick={() => setShowOBModal(true)}>
            ⚙️ Balances
          </button>
          <button className="btn-download" onClick={handleDownload}>
            ⬇ Export Excel
          </button>
        </div>
      </div>

      <SummaryCards summary={summary} />

      <div className="section-header section-gap">
        <span className="section-title">Daily breakdown</span>
      </div>
      <div className="charts-grid">
        <EarningsChart data={dailySeries} />
        <AccountPieChart earning={summary.earning} />
      </div>

      {showOBModal && (
        <OpeningBalanceModal
          period={period}
          onClose={() => setShowOBModal(false)}
          onSaved={() => {
            setShowOBModal(false);
            setRefresh(r => r + 1);
          }}
        />
      )}
    </div>
  );
}
