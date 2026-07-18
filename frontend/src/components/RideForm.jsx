import { useState } from "react";
import api from "../api.js";

const APPS = ["Rapido", "Uber", "Other"];
const PAYMENT_MODES = ["Cash", "Online"];
const ACCOUNTS = ["BOB", "Kotak", "Airtel", "Cash"];

function getNow() {
  return new Date().toTimeString().slice(0, 5);
}

export default function RideForm({ defaultDate, onSaved }) {
  const [form, setForm] = useState({
    date: defaultDate,
    time: getNow(),
    app: "Rapido",
    from: "",
    to: "",
    km: "",
    fare: "",
    paymentMode: "Online",
    account: "BOB",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }));
  const handle = (e) => set(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post("/rides", { ...form, km: Number(form.km), fare: Number(form.fare) });
      setForm((f) => ({ ...f, from: "", to: "", km: "", fare: "", notes: "", time: getNow() }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save ride");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      <div className="form-section">📍 When &amp; Where</div>
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
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">From</label>
          <input className="form-input" type="text" name="from" placeholder="Pickup location" value={form.from} onChange={handle} required />
        </div>
        <div className="form-field">
          <label className="form-label">To</label>
          <input className="form-input" type="text" name="to" placeholder="Drop location" value={form.to} onChange={handle} required />
        </div>
      </div>

      <div className="form-section">🚖 Ride Details</div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">App</label>
          <select className="form-select" name="app" value={form.app} onChange={handle}>
            {APPS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label className="form-label">Distance (km)</label>
          <input className="form-input" type="number" step="any" min="0" name="km" placeholder="0.0" value={form.km} onChange={handle} required />
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label className="form-label">Fare (₹)</label>
          <input className="form-input" type="number" step="any" min="0" name="fare" placeholder="0" value={form.fare} onChange={handle} required />
        </div>
        <div className="form-field">
          <label className="form-label">Payment Mode</label>
          <select className="form-select" name="paymentMode" value={form.paymentMode} onChange={handle}>
            {PAYMENT_MODES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="form-field">
        <label className="form-label">Account Credited</label>
        <select className="form-select" name="account" value={form.account} onChange={handle}>
          {ACCOUNTS.map((a) => <option key={a}>{a}</option>)}
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
        {saving ? "Saving…" : saved ? "✓ Ride Saved!" : "Save Ride"}
      </button>
    </form>
  );
}
