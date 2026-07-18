import { useState } from "react";
import api from "../api.js";

const APP_COLORS = { Rapido: "#F5C518", Uber: "#60A5FA", Other: "#9DA3C0" };
const APP_ICONS  = { Rapido: "⚡", Uber: "🚗", Other: "🛺" };

function groupByDate(rides) {
  const groups = {};
  for (const ride of rides) {
    const key = new Date(ride.date).toLocaleDateString("en-IN", {
      weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
    (groups[key] = groups[key] || []).push(ride);
  }
  return groups;
}

export default function RideTable({ rides, onChanged }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm("Delete this ride?")) return;
    setDeleting(id);
    await api.delete(`/rides/${id}`);
    onChanged();
    setDeleting(null);
  };

  if (rides.length === 0) {
    return (
      <div className="tl-empty">
        <div className="tl-empty-icon">🛺</div>
        <div className="tl-empty-title">No rides this month</div>
        <div className="tl-empty-sub">Tap + to log your first ride</div>
      </div>
    );
  }

  const groups = groupByDate(rides);

  return (
    <div className="timeline">
      {Object.entries(groups).map(([dateLabel, dayRides]) => {
        const parts = dateLabel.split(", ");
        const weekday = parts[0];
        const restDate = parts.slice(1).join(", ");
        const dayFare = dayRides.reduce((s, r) => s + r.fare, 0);
        const dayKm   = dayRides.reduce((s, r) => s + r.km, 0);

        return (
          <div key={dateLabel} className="timeline-day">
            <div className="timeline-day-header">
              <div className="tl-day-left">
                <span className="tl-weekday">{weekday}</span>
                <span className="tl-date">{restDate}</span>
              </div>
              <div className="tl-day-right">
                <span className="tl-badge tl-badge-earn">₹{dayFare}</span>
                <span className="tl-badge tl-badge-muted">{dayKm.toFixed(1)} km</span>
                <span className="tl-badge tl-badge-muted">{dayRides.length} ride{dayRides.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="timeline-entries">
              {dayRides.map((r, idx) => {
                const color = APP_COLORS[r.app];
                return (
                  <div key={r._id} className="tl-entry">
                    <div className="tl-time-strip">
                      <span className={`tl-time-val${r.time ? "" : " tl-time-empty"}`}>
                        {r.time || "—"}
                      </span>
                      {idx < dayRides.length - 1 && <div className="tl-connector" />}
                    </div>

                    <div className="tl-card">
                      <div className="tl-card-row">
                        <div className="tl-card-left">
                          <span
                            className="tl-chip"
                            style={{
                              background: color + "20",
                              color,
                              borderColor: color + "40",
                            }}
                          >
                            {APP_ICONS[r.app]} {r.app}
                          </span>
                          <div className="tl-route">
                            <span className="tl-place">{r.from}</span>
                            <span className="tl-arrow">→</span>
                            <span className="tl-place">{r.to}</span>
                          </div>
                        </div>
                        <div className="tl-card-right">
                          <span className="tl-amount tl-amount-earn">₹{r.fare}</span>
                          <button
                            className="tl-delete-btn"
                            onClick={() => handleDelete(r._id)}
                            disabled={deleting === r._id}
                            title="Delete"
                          >✕</button>
                        </div>
                      </div>
                      <div className="tl-meta">
                        <span>{r.km} km</span>
                        <span className="tl-sep">·</span>
                        <span>{r.paymentMode}</span>
                        <span className="tl-sep">·</span>
                        <span>{r.account}</span>
                        {r.notes && (
                          <><span className="tl-sep">·</span>
                          <span className="tl-note-inline">"{r.notes}"</span></>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
