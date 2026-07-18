import { Router } from "express";
import Ride from "../models/Ride.js";
import Expense from "../models/Expense.js";
import OpeningBalance from "../models/OpeningBalance.js";
import { monthRange } from "../utils/dateRange.js";

const router = Router();
const ACCOUNTS = ["BOB", "Kotak", "Airtel", "Cash"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

async function getMonthTotals(year, month) {
  const { start, end } = monthRange(year, month);
  const rideAgg = await Ride.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: "$account", total: { $sum: "$fare" } } },
  ]);
  const expAgg = await Expense.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: "$paymentMode", total: { $sum: "$amount" } } },
  ]);
  const earning = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
  rideAgg.forEach((r) => { if (earning[r._id] !== undefined) earning[r._id] = r.total; });
  const expense = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
  expAgg.forEach((e) => { if (expense[e._id] !== undefined) expense[e._id] = e.total; });

  const rideStats = await Ride.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: null, count: { $sum: 1 }, km: { $sum: "$km" } } },
  ]);
  const totalRides = rideStats[0]?.count || 0;
  const totalKm = rideStats[0]?.km || 0;

  return { earning, expense, totalRides, totalKm };
}

async function getMonthOpening(year, month, depth = 0) {
  const override = await OpeningBalance.findOne({ year, month }).lean();
  if (override) {
    return { BOB: override.BOB, Kotak: override.Kotak, Airtel: override.Airtel, Cash: override.Cash };
  }
  if (depth > 36) return { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
  let py = year, pm = month - 1;
  if (pm === 0) { pm = 12; py -= 1; }
  return getMonthClosing(py, pm, depth + 1);
}

async function getMonthClosing(year, month, depth = 0) {
  const opening = await getMonthOpening(year, month, depth);
  const { earning, expense } = await getMonthTotals(year, month);
  const closing = {};
  ACCOUNTS.forEach((acc) => {
    closing[acc] = Number((opening[acc] + earning[acc] - expense[acc]).toFixed(2));
  });
  return closing;
}

router.get("/month", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) return res.status(400).json({ error: "year and month are required" });

    const { earning, expense, totalRides, totalKm } = await getMonthTotals(year, month);
    const opening = await getMonthOpening(year, month);
    const closing = await getMonthClosing(year, month);
    const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
    const totalExpense = ACCOUNTS.reduce((s, a) => s + expense[a], 0);

    res.json({
      year, month, monthName: MONTH_NAMES[month - 1],
      earning, expense, opening, closing,
      totalRides, totalKm,
      totalEarning, totalExpense,
      netSavings: Number((totalEarning - totalExpense).toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/year", async (req, res) => {
  try {
    const year = Number(req.query.year);
    if (!year) return res.status(400).json({ error: "year is required" });

    const rows = [];
    for (let month = 1; month <= 12; month++) {
      const { earning, expense, totalRides, totalKm } = await getMonthTotals(year, month);
      const closing = await getMonthClosing(year, month);
      const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
      const totalExpense = ACCOUNTS.reduce((s, a) => s + expense[a], 0);
      rows.push({
        month, monthName: MONTH_NAMES[month - 1],
        totalRides, totalKm, totalEarning, totalExpense,
        netSavings: Number((totalEarning - totalExpense).toFixed(2)),
        closing,
      });
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/opening-balance", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const doc = await OpeningBalance.findOne({ year, month });
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/opening-balance", async (req, res) => {
  try {
    const { year, month, BOB = 0, Kotak = 0, Airtel = 0, Cash = 0 } = req.body;
    const doc = await OpeningBalance.findOneAndUpdate(
      { year, month },
      { year, month, BOB, Kotak, Airtel, Cash },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export { getMonthTotals, getMonthClosing, getMonthOpening, ACCOUNTS, MONTH_NAMES };
export default router;
