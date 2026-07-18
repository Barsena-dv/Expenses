import mongoose from "mongoose";

const openingBalanceSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  BOB: { type: Number, default: 0 },
  Kotak: { type: Number, default: 0 },
  Airtel: { type: Number, default: 0 },
  Cash: { type: Number, default: 0 },
});

openingBalanceSchema.index({ year: 1, month: 1 }, { unique: true });

export default mongoose.model("OpeningBalance", openingBalanceSchema);
