import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { resolve } from "node:path";
import { Database } from "./database/index.js";
import {
  BinanceAggTradesHistoryService,
  isAnalysisWindow,
} from "./exchanges/binance/BinanceAggTradesHistoryService.js";
import {
  BinanceKlineHistoryService,
  isCandleInterval,
} from "./exchanges/binance/BinanceKlineHistoryService.js";
import { createRealtimeServer } from "./realtime/socketServer.js";
import { createAuthRouter } from "./routes/auth.js";

const envPath = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
].find((candidate) => existsSync(candidate));

dotenv.config(envPath ? { path: envPath } : undefined);

const app = express();
const port = Number(process.env.PORT ?? 4000);
const klineHistoryService = new BinanceKlineHistoryService();
const aggTradesHistoryService = new BinanceAggTradesHistoryService();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/market/candles", async (req, res) => {
  const symbol = String(req.query.symbol ?? "BTCUSDT").toUpperCase();
  const interval = req.query.interval;
  const limit = Number(req.query.limit ?? 500);

  if (symbol !== "BTCUSDT") {
    res.status(400).json({ error: "Unsupported symbol" });
    return;
  }

  if (!isCandleInterval(interval)) {
    res.status(400).json({ error: "Unsupported interval" });
    return;
  }

  try {
    const candles = await klineHistoryService.getCandles({
      symbol,
      interval,
      limit,
    });

    res.json({ candles });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to load market candles";

    res.status(502).json({ error: message });
  }
});

app.get("/api/market/agg-trades", async (req, res) => {
  const symbol = String(req.query.symbol ?? "BTCUSDT").toUpperCase();
  const window = req.query.window ?? "15m";
  const startTime = parseOptionalTimestamp(req.query.startTime);
  const endTime = parseOptionalTimestamp(req.query.endTime);

  if (symbol !== "BTCUSDT") {
    res.status(400).json({ error: "Unsupported symbol" });
    return;
  }

  if (!isAnalysisWindow(window)) {
    res.status(400).json({ error: "Unsupported analysis window" });
    return;
  }

  if (
    (req.query.startTime !== undefined && startTime === undefined) ||
    (req.query.endTime !== undefined && endTime === undefined)
  ) {
    res.status(400).json({ error: "Invalid startTime or endTime" });
    return;
  }

  try {
    const trades = await aggTradesHistoryService.getAggTrades({
      symbol,
      window,
      startTime,
      endTime,
    });

    res.json({ trades });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to load historical aggregate trades";

    res.status(502).json({ error: message });
  }
});

const server = createServer(app);
const database = new Database();
await database.connect();
createRealtimeServer(server, { database });

app.use("/api/auth", createAuthRouter(database));

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});

function parseOptionalTimestamp(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return undefined;
  }

  return Math.trunc(timestamp);
}
