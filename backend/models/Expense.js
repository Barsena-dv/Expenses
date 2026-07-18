import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, default: "" },   // HH:MM format
    category: {
      type: String,
      enum: ["Fuel", "Food", "Maintenance", "Recharge", "Toll/Parking", "Other"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ["Cash", "BOB", "Kotak", "Airtel"], required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1, createdAt: -1 });

export default mongoose.model("Expense", expenseSchema);
