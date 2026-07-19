import { Router } from "express";
import Ride from "../models/Ride.js";
import Expense from "../models/Expense.js";
import OpeningBalance from "../models/OpeningBalance.js";
import { monthRange } from "../utils/dateRange.js";

const router = Router();
const ACCOUNTS    = ["BOB", "Kotak", "Airtel", "Cash"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

/** Single aggregation: per-account totals + ride count + km for a date range */
async function fetchRideStats(start, end) {
  const [byAccount, totals] = await Promise.all([
    Ride.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: "$account", fare: { $sum: "$fare" } } },
    ]),
    Ride.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, count: { $sum: 1 }, km: { $sum: "$km" } } },
    ]),
  ]);

  const earning = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
  byAccount.forEach((r) => { if (earning[r._id] !== undefined) earning[r._id] = r.fare; });
  return { earning, totalRides: totals[0]?.count || 0, totalKm: totals[0]?.km || 0 };
}

/** Single aggregation: per-account expense totals for a date range */
async function fetchExpenseStats(start, end) {
  const rows = await Expense.aggregate([
    { $match: { date: { $gte: start, $lt: end } } },
    { $group: { _id: "$paymentMode", total: { $sum: "$amount" } } },
  ]);
  const expense = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
  rows.forEach((e) => { if (expense[e._id] !== undefined) expense[e._id] = e.total; });
  return expense;
}

/** Get opening balance for a month (checks DB first, falls back to previous closing) */
async function getOpening(year, month, allBalances) {
  const key = `${year}-${month}`;
  if (allBalances[key]) {
    const b = allBalances[key];
    return { BOB: b.BOB, Kotak: b.Kotak, Airtel: b.Airtel, Cash: b.Cash };
  }
  // Nothing stored → roll back recursively up to 36 months
  let depth = 0, y = year, m = month - 1;
  while (depth < 36) {
    if (m === 0) { m = 12; y -= 1; }
    const k = `${y}-${m}`;
    if (allBalances[k]) {
      // Walk forward to compute closing of that month
      return computeClosing(y, m, allBalances);
    }
    m--; depth++;
  }
  return { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
}

/** Compute closing balance given opening balances lookup table */
async function computeClosing(year, month, allBalances) {
  const { start, end } = monthRange(year, month);
  const [{ earning }, expense] = await Promise.all([
    fetchRideStats(start, end),
    fetchExpenseStats(start, end),
  ]);
  const opening = await getOpening(year, month, allBalances);
  const closing = {};
  ACCOUNTS.forEach((acc) => {
    closing[acc] = Number(((opening[acc] || 0) + (earning[acc] || 0) - (expense[acc] || 0)).toFixed(2));
  });
  return closing;
}

/* ─────────────────────────────────────────────────────────────
   GET /month  — summary for one month
───────────────────────────────────────────────────────────── */
router.get("/month", async (req, res) => {
  try {
    const year  = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) return res.status(400).json({ error: "year and month are required" });

    const { start, end } = monthRange(year, month);

    // Fire ride stats, expense stats, and opening balance lookup in parallel
    const [allBalances, { earning, totalRides, totalKm }, expense] = await Promise.all([
      OpeningBalance.find({}).lean().then((docs) => {
        const map = {};
        docs.forEach((d) => { map[`${d.year}-${d.month}`] = d; });
        return map;
      }),
      fetchRideStats(start, end),
      fetchExpenseStats(start, end),
    ]);

    const opening = await getOpening(year, month, allBalances);
    const closing = {};
    ACCOUNTS.forEach((acc) => {
      closing[acc] = Number(((opening[acc] || 0) + (earning[acc] || 0) - (expense[acc] || 0)).toFixed(2));
    });

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

/* ─────────────────────────────────────────────────────────────
   GET /month-full  — summary + daily chart data in ONE request
   (replaces 3 separate calls from Dashboard)
───────────────────────────────────────────────────────────── */
router.get("/month-full", async (req, res) => {
  try {
    const year  = Number(req.query.year);
    const month = Number(req.query.month);
    if (!year || !month) return res.status(400).json({ error: "year and month are required" });

    const { start, end } = monthRange(year, month);

    // Fetch everything in parallel: all rides, all expenses, opening balances
    const [allBalances, rides, expenses] = await Promise.all([
      OpeningBalance.find({}).lean().then((docs) => {
        const map = {};
        docs.forEach((d) => { map[`${d.year}-${d.month}`] = d; });
        return map;
      }),
      Ride.find({ date: { $gte: start, $lt: end } })
          .select("date account fare km app time from to paymentMode notes")
          .sort({ date: -1, createdAt: -1 })
          .lean(),
      Expense.find({ date: { $gte: start, $lt: end } })
             .select("date paymentMode amount category")
             .sort({ date: -1, createdAt: -1 })
             .lean(),
    ]);

    // Compute totals from the already-fetched data (no extra DB round-trip)
    const earning = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
    const expense = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
    let totalRides = rides.length, totalKm = 0;

    rides.forEach((r) => {
      if (earning[r.account] !== undefined) earning[r.account] += r.fare;
      totalKm += r.km || 0;
    });
    expenses.forEach((e) => {
      if (expense[e.paymentMode] !== undefined) expense[e.paymentMode] += e.amount;
    });

    const opening = await getOpening(year, month, allBalances);
    const closing = {};
    ACCOUNTS.forEach((acc) => {
      closing[acc] = Number(((opening[acc] || 0) + (earning[acc] || 0) - (expense[acc] || 0)).toFixed(2));
    });

    const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
    const totalExpense = ACCOUNTS.reduce((s, a) => s + expense[a], 0);

    // Build daily chart series
    function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }
    const dim = daysInMonth(year, month);
    const dailySeries = Array.from({ length: dim }, (_, i) => ({ day: i + 1, earning: 0, expense: 0, km: 0 }));
    rides.forEach((r) => {
      const d = new Date(r.date).getUTCDate();
      dailySeries[d - 1].earning += r.fare;
      dailySeries[d - 1].km     += r.km || 0;
    });
    expenses.forEach((e) => {
      const d = new Date(e.date).getUTCDate();
      dailySeries[d - 1].expense += e.amount;
    });

    res.json({
      summary: {
        year, month, monthName: MONTH_NAMES[month - 1],
        earning, expense, opening, closing,
        totalRides, totalKm,
        totalEarning, totalExpense,
        netSavings: Number((totalEarning - totalExpense).toFixed(2)),
      },
      dailySeries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /year  — all 12 months in 2 parallel DB calls
───────────────────────────────────────────────────────────── */
router.get("/year", async (req, res) => {
  try {
    const year = Number(req.query.year);
    if (!year) return res.status(400).json({ error: "year is required" });

    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd   = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    // Fetch ALL rides + expenses + opening balances for the whole year in parallel
    const [rideAgg, expAgg, allBalances] = await Promise.all([
      // Group rides by month: per-account fare, count, km
      Ride.aggregate([
        { $match: { date: { $gte: yearStart, $lt: yearEnd } } },
        { $group: {
            _id: { month: { $month: "$date" }, account: "$account" },
            fare: { $sum: "$fare" },
            km:   { $sum: "$km" },
            cnt:  { $sum: 1 },
        }},
      ]),
      // Group expenses by month: per-paymentMode amount
      Expense.aggregate([
        { $match: { date: { $gte: yearStart, $lt: yearEnd } } },
        { $group: {
            _id: { month: { $month: "$date" }, paymentMode: "$paymentMode" },
            total: { $sum: "$amount" },
        }},
      ]),
      // All opening balances ever stored
      OpeningBalance.find({}).lean().then((docs) => {
        const map = {};
        docs.forEach((d) => { map[`${d.year}-${d.month}`] = d; });
        return map;
      }),
    ]);

    // Organise raw aggregation output into per-month maps
    const monthEarning = {}; // month -> { BOB, Kotak, Airtel, Cash }
    const monthExpense = {}; // month -> { BOB, Kotak, Airtel, Cash }
    const monthRides   = {}; // month -> { count, km }

    for (let m = 1; m <= 12; m++) {
      monthEarning[m] = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
      monthExpense[m] = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
      monthRides[m]   = { count: 0, km: 0 };
    }

    rideAgg.forEach(({ _id, fare, km, cnt }) => {
      const m = _id.month;
      if (monthEarning[m] && monthEarning[m][_id.account] !== undefined) {
        monthEarning[m][_id.account] += fare;
        monthRides[m].count += cnt;
        monthRides[m].km    += km;
      }
    });

    expAgg.forEach(({ _id, total }) => {
      const m = _id.month;
      if (monthExpense[m] && monthExpense[m][_id.paymentMode] !== undefined) {
        monthExpense[m][_id.paymentMode] += total;
      }
    });

    // Build closing balance chain: each month's closing = opening + earned - spent
    // We walk forward; each month's opening = prior closing (or stored override)
    let prevClosing = { BOB: 0, Kotak: 0, Airtel: 0, Cash: 0 };
    const rows = [];

    for (let m = 1; m <= 12; m++) {
      // If there's an explicit opening balance record for this month, use it
      const key = `${year}-${m}`;
      const opening = allBalances[key]
        ? { BOB: allBalances[key].BOB, Kotak: allBalances[key].Kotak,
            Airtel: allBalances[key].Airtel, Cash: allBalances[key].Cash }
        : { ...prevClosing };

      const earning = monthEarning[m];
      const expense = monthExpense[m];
      const closing = {};
      ACCOUNTS.forEach((acc) => {
        closing[acc] = Number(((opening[acc] || 0) + (earning[acc] || 0) - (expense[acc] || 0)).toFixed(2));
      });

      const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
      const totalExpense = ACCOUNTS.reduce((s, a) => s + expense[a], 0);

      rows.push({
        month: m,
        monthName: MONTH_NAMES[m - 1],
        totalRides:   monthRides[m].count,
        totalKm:      Number(monthRides[m].km.toFixed(1)),
        totalEarning: Number(totalEarning.toFixed(2)),
        totalExpense: Number(totalExpense.toFixed(2)),
        netSavings:   Number((totalEarning - totalExpense).toFixed(2)),
        closing,
      });

      prevClosing = closing;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /opening-balance
───────────────────────────────────────────────────────────── */
router.get("/opening-balance", async (req, res) => {
  try {
    const year  = Number(req.query.year);
    const month = Number(req.query.month);
    const doc   = await OpeningBalance.findOne({ year, month }).lean();
    res.json(doc || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /opening-balance
───────────────────────────────────────────────────────────── */
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

export { fetchRideStats, fetchExpenseStats, ACCOUNTS, MONTH_NAMES };
export default router;
