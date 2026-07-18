import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import ridesRouter from "./routes/rides.js";
import expensesRouter from "./routes/expenses.js";
import summaryRouter from "./routes/summary.js";
import exportRouter from "./routes/export.js";

dotenv.config();

// Connect DB once (cached for serverless reuse)
let isConnected = false;
async function ensureDB() {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
}
await ensureDB();

const app = express();

// CORS — allow any origin in dev, restrict to frontend URL in prod
const allowedOrigin = process.env.FRONTEND_URL || "*";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());

app.use("/api/rides", ridesRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/summary", summaryRouter);
app.use("/api/export", exportRouter);

app.get("/", (req, res) => res.json({ status: "Ride Tracker API running" }));

export default app;
