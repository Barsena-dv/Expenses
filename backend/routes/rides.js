import { Router } from "express";
import Ride from "../models/Ride.js";
import { monthRange } from "../utils/dateRange.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {};
    if (month && year) {
      const { start, end } = monthRange(Number(year), Number(month));
      filter.date = { $gte: start, $lt: end };
    }
    const rides = await Ride.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(rides);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const ride = await Ride.create(req.body);
    res.status(201).json(ride);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const ride = await Ride.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json(ride);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const ride = await Ride.findByIdAndDelete(req.params.id);
    if (!ride) return res.status(404).json({ error: "Ride not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
