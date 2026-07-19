import { useEffect, useState, useCallback } from "react";
import api, { cacheGet, cacheSet, cacheBust } from "../api.js";
import ExpenseTable from "../components/ExpenseTable.jsx";

export default function Expenses({ period }) {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const cacheKey = `expenses-${period.year}-${period.month}`;

  const load = useCallback(async (bustCache = false) => {
    setLoading(true);

    if (!bustCache) {
      const cached = cacheGet(cacheKey);
      if (cached) {
        setExpenses(cached);
        setLoading(false);
        return;
      }
    }

    const { data } = await api.get("/expenses", { params: period });
    cacheSet(cacheKey, data);
    setExpenses(data);
    setLoading(false);
  }, [period.month, period.year]);

  useEffect(() => { load(); }, [load]);

  const handleChanged = () => {
    cacheBust(`expenses-${period.year}-${period.month}`);
    cacheBust(`dashboard-${period.year}-${period.month}`);
    load(true);
  };

  const totalAmount = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Expenses</h1>
          <div className="stat-pills">
            <span className="stat-pill pill-expense">₹{totalAmount.toLocaleString("en-IN")} spent</span>
            <span className="stat-pill pill-muted">{expenses.length} items</span>
          </div>
        </div>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner" /><span>Loading expenses…</span></div>
        : <ExpenseTable expenses={expenses} onChanged={handleChanged} />
      }
    </div>
  );
}
