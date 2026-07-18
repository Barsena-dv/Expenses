import { useState } from "react";
import api from "../api.js";

const CAT_ICONS = {
  Fuel: "⛽", Food: "🍛", Maintenance: "🔧",
  Recharge: "📱", "Toll/Parking": "🛑", Other: "📦",
};
const CAT_COLORS = {
  Fuel: "#F5C518", Food: "#22C55E", Maintenance: "#60A5FA",
  Recharge: "#A78BFA", "Toll/Parking": "#F44", Other: "#9DA3C0",
};

function groupByDate(items) {
  const groups = {};
  for (const item of items) {
    const key = new Date(item.date).toLocaleDateString("en-IN", {
      weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
    (groups[key] = groups[key] || []).push(item);
  }
  return groups;
}

export default function ExpenseTable({ expenses, onChanged }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    setDeleting(id);
    await api.delete(`/expenses/${id}`);
    onChanged();
    setDeleting(null);
  };

  if (expenses.length === 0) {
    return (
      <div className="tl-empty">
        <div className="tl-empty-icon">💸</div>
        <div className="tl-empty-title">No expenses this month</div>
        <div className="tl-empty-sub">Tap + to log your first expense</div>
      </div>
    );
  }

  const groups = groupByDate(expenses);

  return (
    <div className="timeline">
      {Object.entries(groups).map(([dateLabel, dayItems]) => {
        const parts = dateLabel.split(", ");
        const weekday = parts[0];
        const restDate = parts.slice(1).join(", ");
        const dayTotal = dayItems.reduce((s, e) => s + e.amount, 0);

        return (
          <div key={dateLabel} className="timeline-day">
            <div className="timeline-day-header">
              <div className="tl-day-left">
                <span className="tl-weekday">{weekday}</span>
                <span className="tl-date">{restDate}</span>
              </div>
              <div className="tl-day-right">
                <span className="tl-badge tl-badge-expense">₹{dayTotal}</span>
                <span className="tl-badge tl-badge-muted">{dayItems.length} item{dayItems.length > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="timeline-entries">
              {dayItems.map((e, idx) => {
                const color = CAT_COLORS[e.category] || "#9DA3C0";
                return (
                  <div key={e._id} className="tl-entry">
                    <div className="tl-time-strip">
                      <span className={`tl-time-val${e.time ? "" : " tl-time-empty"}`}>
                        {e.time || "—"}
                      </span>
                      {idx < dayItems.length - 1 && <div className="tl-connector" />}
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
                            {CAT_ICONS[e.category]} {e.category}
                          </span>
                          <div className="tl-route">
                            <span className="tl-place">{e.paymentMode}</span>
                            {e.notes && (
                              <>
                                <span className="tl-arrow">·</span>
                                <span className="tl-note-inline">{e.notes}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="tl-card-right">
                          <span className="tl-amount tl-amount-exp">₹{e.amount}</span>
                          <button
                            className="tl-delete-btn"
                            onClick={() => handleDelete(e._id)}
                            disabled={deleting === e._id}
                            title="Delete"
                          >✕</button>
                        </div>
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
