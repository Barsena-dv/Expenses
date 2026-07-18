import { Router } from "express";
import ExcelJS from "exceljs";
import Ride from "../models/Ride.js";
import Expense from "../models/Expense.js";
import { monthRange } from "../utils/dateRange.js";
import { getMonthTotals, getMonthClosing, getMonthOpening, ACCOUNTS, MONTH_NAMES } from "./summary.js";

const router = Router();

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Arial" };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });
}

router.get("/month", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const month = Number(req.query.month);
    const { start, end } = monthRange(year, month);
    const rides = await Ride.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 });
    const expenses = await Expense.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 });
    const { earning, expense: expenseByAcc, totalRides, totalKm } = await getMonthTotals(year, month);
    const opening = await getMonthOpening(year, month);
    const closing = await getMonthClosing(year, month);
    const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
    const totalExpense = ACCOUNTS.reduce((s, a) => s + expenseByAcc[a], 0);

    const wb = new ExcelJS.Workbook();

    const ridesSheet = wb.addWorksheet("Rides");
    ridesSheet.columns = [
      { header: "Date", key: "date", width: 13 },
      { header: "App", key: "app", width: 10 },
      { header: "From", key: "from", width: 16 },
      { header: "To", key: "to", width: 16 },
      { header: "KM", key: "km", width: 8 },
      { header: "Fare (Rs)", key: "fare", width: 10 },
      { header: "Payment Mode", key: "paymentMode", width: 14 },
      { header: "Account", key: "account", width: 12 },
      { header: "Notes", key: "notes", width: 22 },
    ];
    styleHeaderRow(ridesSheet.getRow(1));
    rides.forEach((r) => ridesSheet.addRow({
      date: new Date(r.date).toLocaleDateString("en-IN"), app: r.app, from: r.from, to: r.to,
      km: r.km, fare: r.fare, paymentMode: r.paymentMode, account: r.account, notes: r.notes,
    }));

    const expSheet = wb.addWorksheet("Expenses");
    expSheet.columns = [
      { header: "Date", key: "date", width: 13 },
      { header: "Category", key: "category", width: 16 },
      { header: "Amount (Rs)", key: "amount", width: 12 },
      { header: "Payment Mode", key: "paymentMode", width: 14 },
      { header: "Notes", key: "notes", width: 26 },
    ];
    styleHeaderRow(expSheet.getRow(1));
    expenses.forEach((e) => expSheet.addRow({
      date: new Date(e.date).toLocaleDateString("en-IN"), category: e.category, amount: e.amount,
      paymentMode: e.paymentMode, notes: e.notes,
    }));

    const dim = new Date(year, month, 0).getDate();
    const dailySheet = wb.addWorksheet("Daily Summary");
    dailySheet.columns = [
      { header: "Date", key: "date", width: 13 },
      { header: "Rides", key: "rides", width: 8 },
      { header: "Total KM", key: "km", width: 10 },
      { header: "Total Earning", key: "earning", width: 14 },
      { header: "Total Expense", key: "expense", width: 14 },
      { header: "Net Saving", key: "net", width: 12 },
    ];
    styleHeaderRow(dailySheet.getRow(1));
    for (let d = 1; d <= dim; d++) {
      const dayRides = rides.filter((r) => new Date(r.date).getUTCDate() === d);
      const dayExpenses = expenses.filter((e) => new Date(e.date).getUTCDate() === d);
      const dEarning = dayRides.reduce((s, r) => s + r.fare, 0);
      const dExpense = dayExpenses.reduce((s, e) => s + e.amount, 0);
      dailySheet.addRow({
        date: `${String(d).padStart(2, "0")}-${MONTH_NAMES[month - 1].slice(0, 3)}-${year}`,
        rides: dayRides.length, km: dayRides.reduce((s, r) => s + r.km, 0),
        earning: dEarning, expense: dExpense, net: dEarning - dExpense,
      });
    }

    const summarySheet = wb.addWorksheet("Month Summary");
    summarySheet.columns = [
      { header: "Account", key: "account", width: 16 },
      { header: "Opening (Rs)", key: "opening", width: 14 },
      { header: "Earned (Rs)", key: "earned", width: 14 },
      { header: "Spent (Rs)", key: "spent", width: 14 },
      { header: "Closing (Rs)", key: "closing", width: 14 },
    ];
    styleHeaderRow(summarySheet.getRow(1));
    ACCOUNTS.forEach((acc) => summarySheet.addRow({
      account: acc, opening: opening[acc], earned: earning[acc], spent: expenseByAcc[acc], closing: closing[acc],
    }));
    summarySheet.addRow({});
    summarySheet.addRow({ account: "Total Rides", opening: totalRides });
    summarySheet.addRow({ account: "Total KM", opening: Number(totalKm.toFixed(1)) });
    summarySheet.addRow({ account: "Total Earning", opening: totalEarning });
    summarySheet.addRow({ account: "Total Expense", opening: totalExpense });
    summarySheet.addRow({ account: "Net Savings", opening: Number((totalEarning - totalExpense).toFixed(2)) });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Ride_Tracker_${year}_${String(month).padStart(2, "0")}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/year", async (req, res) => {
  try {
    const year = Number(req.query.year);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Year Summary");
    sheet.columns = [
      { header: "Month", key: "month", width: 14 },
      { header: "Rides", key: "rides", width: 10 },
      { header: "KM", key: "km", width: 10 },
      { header: "Earning (Rs)", key: "earning", width: 14 },
      { header: "Expense (Rs)", key: "expense", width: 14 },
      { header: "Net Savings (Rs)", key: "net", width: 15 },
      { header: "Closing-BOB", key: "bob", width: 12 },
      { header: "Closing-Kotak", key: "kotak", width: 12 },
      { header: "Closing-Airtel", key: "airtel", width: 12 },
      { header: "Closing-Cash", key: "cash", width: 12 },
    ];
    styleHeaderRow(sheet.getRow(1));

    let yTotal = { rides: 0, km: 0, earning: 0, expense: 0, net: 0 };
    for (let month = 1; month <= 12; month++) {
      const { earning, expense, totalRides, totalKm } = await getMonthTotals(year, month);
      const closing = await getMonthClosing(year, month);
      const totalEarning = ACCOUNTS.reduce((s, a) => s + earning[a], 0);
      const totalExpense = ACCOUNTS.reduce((s, a) => s + expense[a], 0);
      const net = totalEarning - totalExpense;
      sheet.addRow({
        month: MONTH_NAMES[month - 1], rides: totalRides, km: Number(totalKm.toFixed(1)),
        earning: totalEarning, expense: totalExpense, net,
        bob: closing.BOB, kotak: closing.Kotak, airtel: closing.Airtel, cash: closing.Cash,
      });
      yTotal.rides += totalRides; yTotal.km += totalKm; yTotal.earning += totalEarning;
      yTotal.expense += totalExpense; yTotal.net += net;
    }
    const totalRow = sheet.addRow({
      month: "YEAR TOTAL", rides: yTotal.rides, km: Number(yTotal.km.toFixed(1)),
      earning: yTotal.earning, expense: yTotal.expense, net: yTotal.net,
    });
    totalRow.font = { bold: true };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="Year_Summary_${year}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
