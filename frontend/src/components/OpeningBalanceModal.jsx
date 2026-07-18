import { useState, useEffect } from "react";
import api from "../api.js";

export default function OpeningBalanceModal({ period, onClose, onSaved }) {
  const [balances, setBalances] = useState({ BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get("/summary/opening-balance", { params: period }).then((res) => {
      if (cancelled) return;
      if (res.data) {
        setBalances({
          BOB: res.data.BOB || 0,
          Kotak: res.data.Kotak || 0,
          Airtel: res.data.Airtel || 0,
          Cash: res.data.Cash || 0,
        });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [period.month, period.year]);

  const handleChange = (e) => {
    setBalances((prev) => ({ ...prev, [e.target.name]: Number(e.target.value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/summary/opening-balance", {
        year: period.year,
        month: period.month,
        ...balances
      });
      onSaved();
    } catch (err) {
      alert("Failed to save opening balance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">🏦 Set Opening Balances</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--fg-muted)" }}>Loading...</div>
        ) : (
          <form className="entry-form" onSubmit={handleSubmit}>
            <div className="form-section" style={{ marginBottom: 12 }}>
              Set initial balances for {period.month}/{period.year}
            </div>
            {Object.keys(balances).map((acc) => (
              <div className="form-field" key={acc} style={{ marginBottom: 12 }}>
                <label className="form-label">{acc === 'BOB' ? 'Bank of Baroda' : acc}</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  name={acc}
                  value={balances[acc]}
                  onChange={handleChange}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ marginTop: 12, width: "100%" }}
            >
              {saving ? "Saving..." : "Save Balances"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
