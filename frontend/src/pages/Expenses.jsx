import { useEffect, useState, useCallback } from "react";
import api from "../api.js";
import ExpenseTable from "../components/ExpenseTable.jsx";

export default function Expenses({ period }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get("/expenses", { params: period });
    setExpenses(data);
    setLoading(false);
  }, [period.month, period.year]);

  useEffect(() => { load(); }, [load]);

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
        : <ExpenseTable expenses={expenses} onChanged={load} />
      }
    </div>
  );
}
