import type {
  CandleInterval,
  MarketCandle,
  MarketSymbol,
} from "@orderflow/shared";

const BINANCE_KLINES_URL = "https://api.binance.com/api/v3/klines";
const SUPPORTED_INTERVALS = new Set<CandleInterval>([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
]);
const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 1000;

type GetCandlesOptions = {
  symbol: MarketSymbol;
  interval: CandleInterval;
  limit?: number;
};

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

export class BinanceKlineHistoryService {
  async getCandles({
    symbol,
    interval,
    limit = DEFAULT_LIMIT,
  }: GetCandlesOptions): Promise<MarketCandle[]> {
    if (!SUPPORTED_INTERVALS.has(interval)) {
      throw new Error(`Unsupported candle interval: ${interval}`);
    }

    const safeLimit = clampLimit(limit);
    const url = new URL(BINANCE_KLINES_URL);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(safeLimit));

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance klines request failed with ${response.status}`);
    }

    const payload: unknown = await response.json();

    if (!isBinanceKlineList(payload)) {
      throw new Error("Unexpected Binance klines response");
    }

    return payload.map((kline) => normalizeBinanceKline(kline, symbol, interval));
  }
}

export function isCandleInterval(value: unknown): value is CandleInterval {
  return typeof value === "string" && SUPPORTED_INTERVALS.has(value as CandleInterval);
}

function normalizeBinanceKline(
  kline: BinanceKline,
  symbol: MarketSymbol,
  interval: CandleInterval,
): MarketCandle {
  return {
    exchange: "binance",
    symbol,
    interval,
    openTime: kline[0],
    open: Number(kline[1]),
    high: Number(kline[2]),
    low: Number(kline[3]),
    close: Number(kline[4]),
    volume: Number(kline[5]),
    closeTime: kline[6],
    takerBuyBaseVolume: Number(kline[9]),
  };
}

function clampLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(MAX_LIMIT, Math.max(1, Math.trunc(limit)));
}

function isBinanceKlineList(value: unknown): value is BinanceKline[] {
  return Array.isArray(value) && value.every(isBinanceKline);
}

function isBinanceKline(value: unknown): value is BinanceKline {
  if (!Array.isArray(value) || value.length < 12) {
    return false;
  }

  return (
    typeof value[0] === "number" &&
    typeof value[1] === "string" &&
    typeof value[2] === "string" &&
    typeof value[3] === "string" &&
    typeof value[4] === "string" &&
    typeof value[5] === "string" &&
    typeof value[6] === "number"
  );
}
