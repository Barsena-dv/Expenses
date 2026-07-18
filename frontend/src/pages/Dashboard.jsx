import { useEffect, useState } from "react";
import api from "../api.js";
import SummaryCards from "../components/SummaryCards.jsx";
import EarningsChart from "../components/EarningsChart.jsx";
import AccountPieChart from "../components/AccountPieChart.jsx";
import OpeningBalanceModal from "../components/OpeningBalanceModal.jsx";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

export default function Dashboard({ period }) {
  const [summary, setSummary] = useState(null);
  const [dailySeries, setDailySeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOBModal, setShowOBModal] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [{ data: summaryData }, { data: rides }, { data: expenses }] = await Promise.all([
        api.get("/summary/month", { params: period }),
        api.get("/rides", { params: period }),
        api.get("/expenses", { params: period }),
      ]);
      if (cancelled) return;
      setSummary(summaryData);
      const dim = daysInMonth(period.year, period.month);
      const days = Array.from({ length: dim }, (_, i) => ({ day: i + 1, earning: 0, expense: 0, km: 0 }));
      rides.forEach((r) => { 
        const d = new Date(r.date).getUTCDate(); 
        days[d - 1].earning += r.fare; 
        days[d - 1].km += (r.km || 0);
      });
      expenses.forEach((e) => { const d = new Date(e.date).getUTCDate(); days[d - 1].expense += e.amount; });
      setDailySeries(days);
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
        <div className="page-header-actions" style={{ display: "flex", gap: "8px" }}>
          <button className="btn-ghost" onClick={() => setShowOBModal(true)} style={{ padding: "8px 12px", fontSize: 13, border: "1px solid var(--border)", borderRadius: "var(--r-md)", background: "transparent", color: "var(--text)", cursor: "pointer" }}>
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
