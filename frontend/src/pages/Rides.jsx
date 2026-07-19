import { useEffect, useState, useCallback } from "react";
import api, { cacheGet, cacheSet, cacheBust } from "../api.js";
import RideTable from "../components/RideTable.jsx";

export default function Rides({ period }) {
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);

  const cacheKey = `rides-${period.year}-${period.month}`;

  const load = useCallback(async (bustCache = false) => {
    setLoading(true);

    if (!bustCache) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        setRides(cached);
        setLoading(false);
        return;
      }
    }

    const { data } = await api.get("/rides", { params: period });
    cacheSet(cacheKey, data);
    setRides(data);
    setLoading(false);
  }, [period.month, period.year]);

  useEffect(() => { load(); }, [load]);

  const handleChanged = () => {
    cacheBust(`rides-${period.year}-${period.month}`);
    cacheBust(`dashboard-${period.year}-${period.month}`);
    load(true);
  };

  const totalFare = rides.reduce((s, r) => s + r.fare, 0);
  const totalKm   = rides.reduce((s, r) => s + r.km,   0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Rides</h1>
          <div className="stat-pills">
            <span className="stat-pill pill-earn">₹{totalFare.toLocaleString("en-IN")} earned</span>
            <span className="stat-pill pill-muted">{totalKm.toFixed(1)} km</span>
            <span className="stat-pill pill-muted">{rides.length} rides</span>
          </div>
        </div>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner" /><span>Loading rides…</span></div>
        : <RideTable rides={rides} onChanged={handleChanged} />
      }
    </div>
  );
}
