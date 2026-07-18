import { useState } from "react";
import api from "../api.js";

const CATEGORIES = ["Fuel", "Food", "Maintenance", "Recharge", "Toll/Parking", "Other"];
const PAYMENT_MODES = ["Cash", "BOB", "Kotak", "Airtel"];
const CATEGORY_ICONS = {
  Fuel: "⛽", Food: "🍛", Maintenance: "🔧",
  Recharge: "📱", "Toll/Parking": "🛑", Other: "📦",
};

function getNow() {
  return new Date().toTimeString().slice(0, 5);
}

export default function ExpenseForm({ defaultDate, onSaved }) {
  const [form, setForm] = useState({
    date: defaultDate,
    time: getNow(),
    category: "Fuel",
    amount: "",
    paymentMode: "Cash",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      setForm((f) => ({ ...f, amount: "", notes: "", time: getNow() }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-section">🗓 When</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" name="date" value={form.date} onChange={handle} required />
        </div>
        <div className="form-field">
          <label className="form-label">Time</label>
          <input className="form-input" type="time" name="time" value={form.time} onChange={handle} />
        </div>
      </div>

      <div className="form-section">💸 Expense Details</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Category</label>
          <select className="form-select" name="category" value={form.category} onChange={handle}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Amount (₹)</label>
          <input className="form-input" type="number" step="1" min="0" name="amount" placeholder="0" value={form.amount} onChange={handle} required />
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Payment Mode</label>
        <select className="form-select" name="paymentMode" value={form.paymentMode} onChange={handle}>
          {PAYMENT_MODES.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Notes (optional)</label>
        <input className="form-input" type="text" name="notes" placeholder="Any notes…" value={form.notes} onChange={handle} />
      </div>

      {error && <p className="form-error">⚠ {error}</p>}
      <button
        type="submit"
        className={`btn btn-primary${saved ? " btn-saved" : ""}`}
        disabled={saving}
        style={{ marginTop: 4 }}
      >
        {saving ? "Saving…" : saved ? "✓ Expense Saved!" : "Save Expense"}
      </button>
    </form>
  );
}
