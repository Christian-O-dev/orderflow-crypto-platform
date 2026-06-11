import type {
  AnalysisWindow,
  HistoricalAggTrade,
  MarketSymbol,
} from "@orderflow/shared";

const BINANCE_AGG_TRADES_URL = "https://api.binance.com/api/v3/aggTrades";
const REQUEST_LIMIT = 1000;
const MAX_TOTAL_TRADES = 5000;
const SUPPORTED_WINDOWS = new Set<AnalysisWindow>([
  "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"
]);

type GetAggTradesOptions = {
  symbol: MarketSymbol;
  window?: AnalysisWindow;
  startTime?: number;
  endTime?: number;
};

type BinanceAggTrade = {
  a: number;
  p: string;
  q: string;
  f: number;
  l: number;
  T: number;
  m: boolean;
  M: boolean;
};

export class BinanceAggTradesHistoryService {
  async getAggTrades({
    symbol,
    window = "15m",
    startTime,
    endTime,
  }: GetAggTradesOptions): Promise<HistoricalAggTrade[]> {
    const range = resolveTimeRange({ window, startTime, endTime });
    const trades: HistoricalAggTrade[] = [];
    let nextStartTime = range.startTime;

    while (nextStartTime <= range.endTime && trades.length < MAX_TOTAL_TRADES) {
      const page = await this.fetchPage({
        symbol,
        startTime: nextStartTime,
        endTime: range.endTime,
      });

      if (page.length === 0) {
        break;
      }

      const normalizedPage = page.map((trade) => normalizeAggTrade(trade, symbol));
      trades.push(...normalizedPage);

      const lastTimestamp = page.at(-1)?.T;

      if (!lastTimestamp || lastTimestamp < nextStartTime) {
        break;
      }

      nextStartTime = lastTimestamp + 1;

      if (page.length < REQUEST_LIMIT) {
        break;
      }
    }

    return trades
      .filter(
        (trade) =>
          trade.timestamp >= range.startTime && trade.timestamp <= range.endTime,
      )
      .slice(0, MAX_TOTAL_TRADES);
  }

  private async fetchPage({
    symbol,
    startTime,
    endTime,
  }: {
    symbol: MarketSymbol;
    startTime: number;
    endTime: number;
  }) {
    const url = new URL(BINANCE_AGG_TRADES_URL);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("startTime", String(startTime));
    url.searchParams.set("endTime", String(endTime));
    url.searchParams.set("limit", String(REQUEST_LIMIT));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance aggTrades request failed with ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isBinanceAggTradeList(payload)) {
      throw new Error("Unexpected Binance aggTrades response");
    }

    return payload;
  }
}

export function isAnalysisWindow(value: unknown): value is AnalysisWindow {
  return typeof value === "string" && SUPPORTED_WINDOWS.has(value as AnalysisWindow);
}

function resolveTimeRange({
  window,
  startTime,
  endTime,
}: {
  window: AnalysisWindow;
  startTime?: number;
  endTime?: number;
}) {
  const safeEndTime = Number.isFinite(endTime) ? Number(endTime) : Date.now();
  const safeStartTime = Number.isFinite(startTime)
    ? Number(startTime)
    : safeEndTime - analysisWindowToMs(window);

  if (safeStartTime >= safeEndTime) {
    throw new Error("startTime must be lower than endTime");
  }

  return {
    startTime: Math.trunc(safeStartTime),
    endTime: Math.trunc(safeEndTime),
  };
}

function analysisWindowToMs(window: AnalysisWindow) {
  const amount = Number(window.slice(0, -1));
  const unit = window.at(-1);

  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  if (unit === "d") return amount * 24 * 60 * 60 * 1000;
  if (unit === "w") return amount * 7 * 24 * 60 * 60 * 1000;
  if (unit === "M") return amount * 30 * 24 * 60 * 60 * 1000; // approximation

  return amount * 60 * 60 * 1000; // fallback to hours
}

function normalizeAggTrade(
  trade: BinanceAggTrade,
  symbol: MarketSymbol,
): HistoricalAggTrade {
  const price = Number(trade.p);
  const quantity = Number(trade.q);

  return {
    id: `binance-${symbol}-agg-${trade.a}`,
    exchange: "binance",
    symbol,
    aggregateTradeId: trade.a,
    firstTradeId: trade.f,
    lastTradeId: trade.l,
    price,
    quantity,
    notionalUsd: price * quantity,
    side: trade.m ? "sell" : "buy",
    timestamp: trade.T,
  };
}

function isBinanceAggTradeList(value: unknown): value is BinanceAggTrade[] {
  return Array.isArray(value) && value.every(isBinanceAggTrade);
}

function isBinanceAggTrade(value: unknown): value is BinanceAggTrade {
  if (!value || typeof value !== "object") {
    return false;
  }

  const trade = value as Record<string, unknown>;

  return (
    typeof trade.a === "number" &&
    typeof trade.p === "string" &&
    typeof trade.q === "string" &&
    typeof trade.f === "number" &&
    typeof trade.l === "number" &&
    typeof trade.T === "number" &&
    typeof trade.m === "boolean"
  );
}
