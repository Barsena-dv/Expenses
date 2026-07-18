import { useState } from "react";
import RideForm from "./RideForm.jsx";
import ExpenseForm from "./ExpenseForm.jsx";

export default function FAB({ defaultDate, onSaved }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(null); // "ride" | "expense" | null

  const openModal = (type) => {
    setModal(type);
    setOpen(false);
  };

  const closeModal = () => setModal(null);

  const handleSaved = () => {
    onSaved();
    closeModal();
  };

  return (
    <>
      {/* Backdrop for FAB menu */}
      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 298 }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* FAB Menu */}
      <div className={`fab-menu${open ? " fab-menu-open" : ""}`}>
        <div className="fab-menu-item" onClick={() => openModal("expense")}>
          <span className="fab-menu-label">Log Expense</span>
          <button className="fab-menu-btn fab-btn-expense">💸</button>
        </div>
        <div className="fab-menu-item" onClick={() => openModal("ride")}>
          <span className="fab-menu-label">Log Ride</span>
          <button className="fab-menu-btn fab-btn-ride">🛺</button>
        </div>
      </div>

      {/* Main FAB */}
      <button
        className={`fab${open ? " fab-open" : ""}`}
        onClick={() => setOpen(!open)}
        title="Quick add"
      >
        +
      </button>

      {/* Modal: Ride */}
      {modal === "ride" && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">🛺 Log Ride</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <RideForm defaultDate={defaultDate} onSaved={handleSaved} />
          </div>
        </div>
      )}

      {/* Modal: Expense */}
      {modal === "expense" && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">💸 Log Expense</span>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <ExpenseForm defaultDate={defaultDate} onSaved={handleSaved} />
          </div>
        </div>
      )}
    </>
  );
}
