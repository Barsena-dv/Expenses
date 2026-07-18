export default function SummaryCards({ summary }) {
  if (!summary) return null;

  const ACCOUNTS = [
    { key: "BOB",    label: "Bank of Baroda", cls: "acct-bob" },
    { key: "Kotak",  label: "Kotak",          cls: "acct-kotak" },
    { key: "Airtel", label: "Airtel",          cls: "acct-airtel" },
    { key: "Cash",   label: "Cash",            cls: "acct-cash" },
  ];

  return (
    <>
      <div className="kpi-grid">
        <div className="kpi-card kpi-earn">
          <div className="kpi-card-top">
            <div className="kpi-icon">💰</div>
          </div>
          <div className="kpi-label">Total Earning</div>
          <div className="kpi-value">₹{summary.totalEarning.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">{summary.totalRides} rides · {summary.totalKm.toFixed(1)} km</div>
        </div>

        <div className="kpi-card kpi-expense">
          <div className="kpi-card-top">
            <div className="kpi-icon">💸</div>
          </div>
          <div className="kpi-label">Total Expense</div>
          <div className="kpi-value">₹{summary.totalExpense.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">This month's spending</div>
        </div>

        <div className="kpi-card kpi-savings">
          <div className="kpi-card-top">
            <div className="kpi-icon">🏦</div>
          </div>
          <div className="kpi-label">Net Savings</div>
          <div className="kpi-value">₹{summary.netSavings.toLocaleString("en-IN")}</div>
          <div className="kpi-sub">After all expenses</div>
        </div>
      </div>

      <div className="accounts-grid">
        {ACCOUNTS.map(({ key, label, cls }) => (
          <div className="account-card" key={key}>
            <div className={`account-badge ${cls}`}>{key.slice(0, 2)}</div>
            <div className="account-info">
              <div className="account-name">{label}</div>
              <div className="account-bal">₹{(summary.closing[key] || 0).toLocaleString("en-IN")}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
