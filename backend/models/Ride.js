import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    time: { type: String, default: "" },   // HH:MM format
    app: { type: String, enum: ["Rapido", "Uber", "Other"], required: true },
    from: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    km: { type: Number, required: true, min: 0 },
    fare: { type: Number, required: true, min: 0 },
    paymentMode: { type: String, enum: ["Cash", "Online"], required: true },
    account: { type: String, enum: ["BOB", "Kotak", "Airtel", "Cash"], required: true },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

rideSchema.index({ date: -1, createdAt: -1 });

export default mongoose.model("Ride", rideSchema);
