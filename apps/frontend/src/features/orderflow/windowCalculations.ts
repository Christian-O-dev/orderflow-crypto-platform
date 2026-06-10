import type {
  AnalysisWindow,
  CvdPoint,
  HistoricalAggTrade,
  LargeTradeEvent,
  NormalizedTrade,
} from "@orderflow/shared";

const LARGE_TRADE_MEDIUM_USD = readViteNumberEnv(
  "VITE_LARGE_TRADE_MEDIUM_USD",
  100_000,
);
const LARGE_TRADE_HIGH_USD = readViteNumberEnv("VITE_LARGE_TRADE_HIGH_USD", 500_000);
const LARGE_TRADE_WHALE_USD = readViteNumberEnv(
  "VITE_LARGE_TRADE_WHALE_USD",
  1_000_000,
);

type HistoricalDelta = {
  buyVolume: number;
  sellVolume: number;
  delta: number;
};

export type WindowOrderFlowSummary = HistoricalDelta & {
  cvd: number;
  cvdPoints: CvdPoint[];
  largeTrades: LargeTradeEvent[];
  historicalTradesCount: number;
  liveTradesCount: number;
  totalTradesCount: number;
};

export const EMPTY_WINDOW_ORDER_FLOW_SUMMARY: WindowOrderFlowSummary = {
  buyVolume: 0,
  sellVolume: 0,
  delta: 0,
  cvd: 0,
  cvdPoints: [],
  largeTrades: [],
  historicalTradesCount: 0,
  liveTradesCount: 0,
  totalTradesCount: 0,
};

type WindowTrade = {
  id: string;
  exchange: HistoricalAggTrade["exchange"];
  symbol: HistoricalAggTrade["symbol"];
  price: number;
  quantity: number;
  notionalUsd: number;
  side: HistoricalAggTrade["side"];
  timestamp: number;
  source: "history" | "live";
};

type TradeIdRange = {
  exchange: HistoricalAggTrade["exchange"];
  symbol: HistoricalAggTrade["symbol"];
  firstTradeId: number;
  lastTradeId: number;
};

export function calculateHistoricalDelta(
  trades: HistoricalAggTrade[],
): HistoricalDelta {
  return calculateDelta(trades);
}

export function calculateHistoricalCvd(trades: HistoricalAggTrade[]): CvdPoint[] {
  return calculateCvdPoints(trades);
}

export function detectHistoricalLargeTrades(
  trades: HistoricalAggTrade[],
): LargeTradeEvent[] {
  return trades
    .map((trade) => toLargeTradeEvent(trade, `historical-large-${trade.id}`))
    .filter((trade): trade is LargeTradeEvent => trade !== null)
    .sort((left, right) => right.timestamp - left.timestamp);
}

export function calculateWindowOrderFlow({
  historicalTrades,
  liveTrades,
  liveLargeTrades,
  analysisWindow,
  now,
}: {
  historicalTrades: HistoricalAggTrade[];
  liveTrades: NormalizedTrade[];
  liveLargeTrades: LargeTradeEvent[];
  analysisWindow: AnalysisWindow;
  now: number;
}): WindowOrderFlowSummary {
  const windowStart = now - analysisWindowToMs(analysisWindow);
  const windowHistoricalTrades = historicalTrades.filter(
    (trade) => trade.timestamp >= windowStart && trade.timestamp <= now,
  );
  const historicalTradeIdRanges = createHistoricalTradeIdRanges(
    windowHistoricalTrades,
  );
  const windowLiveTrades = liveTrades.filter(
    (trade) =>
      trade.timestamp >= windowStart &&
      trade.timestamp <= now &&
      !isCoveredByHistoricalAggTrade(trade, historicalTradeIdRanges),
  );
  const combinedTrades = [
    ...windowHistoricalTrades.map(toWindowHistoricalTrade),
    ...windowLiveTrades.map(toWindowLiveTrade),
  ].sort((left, right) => left.timestamp - right.timestamp);
  const delta = calculateDelta(combinedTrades);
  const cvdPoints = calculateCvdPoints(combinedTrades, windowStart);
  const historicalLargeTrades = detectHistoricalLargeTrades(windowHistoricalTrades);
  const combinedLargeTrades = mergeLargeTrades(
    historicalLargeTrades,
    liveLargeTrades.filter(
      (trade) =>
        trade.timestamp >= windowStart &&
        trade.timestamp <= now &&
        !isLiveLargeTradeCoveredByHistoricalAggTrade(
          trade,
          historicalTradeIdRanges,
        ),
    ),
  );

  return {
    ...delta,
    cvd: delta.delta,
    cvdPoints,
    largeTrades: combinedLargeTrades,
    historicalTradesCount: windowHistoricalTrades.length,
    liveTradesCount: windowLiveTrades.length,
    totalTradesCount: combinedTrades.length,
  };
}

export function analysisWindowToMs(window: AnalysisWindow) {
  const amount = Number(window.slice(0, -1));
  const unit = window.at(-1);

  if (unit === "s") {
    return amount * 1000;
  }

  if (unit === "m") {
    return amount * 60 * 1000;
  }

  return amount * 60 * 60 * 1000;
}

function calculateDelta(
  trades: Array<Pick<HistoricalAggTrade, "quantity" | "side">>,
): HistoricalDelta {
  let buyVolume = 0;
  let sellVolume = 0;

  for (const trade of trades) {
    if (trade.side === "buy") {
      buyVolume += trade.quantity;
    } else {
      sellVolume += trade.quantity;
    }
  }

  buyVolume = toFixedVolume(buyVolume);
  sellVolume = toFixedVolume(sellVolume);

  return {
    buyVolume,
    sellVolume,
    delta: toFixedVolume(buyVolume - sellVolume),
  };
}

function calculateCvdPoints(
  trades: Array<Pick<HistoricalAggTrade, "quantity" | "side" | "timestamp">>,
  baselineTimestamp?: number,
): CvdPoint[] {
  let cvd = 0;
  const cvdBySecond = new Map<number, number>();

  if (baselineTimestamp !== undefined) {
    cvdBySecond.set(Math.floor(baselineTimestamp / 1000), 0);
  }

  for (const trade of [...trades].sort((left, right) => left.timestamp - right.timestamp)) {
    cvd += trade.side === "buy" ? trade.quantity : -trade.quantity;
    cvdBySecond.set(Math.floor(trade.timestamp / 1000), toFixedVolume(cvd));
  }

  return Array.from(cvdBySecond.entries()).map(([time, value]) => ({
    time,
    value,
  }));
}

function toWindowHistoricalTrade(trade: HistoricalAggTrade): WindowTrade {
  return {
    id: trade.id,
    exchange: trade.exchange,
    symbol: trade.symbol,
    price: trade.price,
    quantity: trade.quantity,
    notionalUsd: trade.notionalUsd,
    side: trade.side,
    timestamp: trade.timestamp,
    source: "history",
  };
}

function toWindowLiveTrade(trade: NormalizedTrade): WindowTrade {
  return {
    id: `${trade.exchange}-${trade.symbol}-live-${trade.tradeId}`,
    exchange: trade.exchange,
    symbol: trade.symbol,
    price: trade.price,
    quantity: trade.quantity,
    notionalUsd: trade.price * trade.quantity,
    side: trade.side,
    timestamp: trade.timestamp,
    source: "live",
  };
}

function toLargeTradeEvent(
  trade: Pick<
    WindowTrade | HistoricalAggTrade,
    "exchange" | "symbol" | "side" | "price" | "quantity" | "notionalUsd" | "timestamp"
  >,
  id: string,
): LargeTradeEvent | null {
  const severity = getLargeTradeSeverity(trade.notionalUsd);

  if (!severity) {
    return null;
  }

  return {
    id,
    exchange: trade.exchange,
    symbol: trade.symbol,
    side: trade.side,
    price: trade.price,
    quantity: trade.quantity,
    notionalUsd: trade.notionalUsd,
    severity,
    timestamp: trade.timestamp,
  };
}

function mergeLargeTrades(
  historicalLargeTrades: LargeTradeEvent[],
  liveLargeTrades: LargeTradeEvent[],
) {
  const tradesById = new Map<string, LargeTradeEvent>();

  for (const trade of historicalLargeTrades) {
    tradesById.set(trade.id, trade);
  }

  for (const trade of liveLargeTrades) {
    tradesById.set(trade.id, trade);
  }

  return Array.from(tradesById.values())
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 100);
}

function isCoveredByHistoricalAggTrade(
  trade: NormalizedTrade,
  historicalTradeIdRanges: TradeIdRange[],
) {
  const tradeId = Number(trade.tradeId);

  return (
    Number.isFinite(tradeId) &&
    isTradeIdInHistoricalRanges(
      trade.exchange,
      trade.symbol,
      tradeId,
      historicalTradeIdRanges,
    )
  );
}

function isLiveLargeTradeCoveredByHistoricalAggTrade(
  trade: LargeTradeEvent,
  historicalTradeIdRanges: TradeIdRange[],
) {
  const tradeId = getLiveTradeIdFromLargeTradeEvent(trade);

  return (
    tradeId !== null &&
    isTradeIdInHistoricalRanges(
      trade.exchange,
      trade.symbol,
      tradeId,
      historicalTradeIdRanges,
    )
  );
}

function createHistoricalTradeIdRanges(trades: HistoricalAggTrade[]): TradeIdRange[] {
  return trades
    .map((trade) => ({
      exchange: trade.exchange,
      symbol: trade.symbol,
      firstTradeId: trade.firstTradeId,
      lastTradeId: trade.lastTradeId,
    }))
    .sort((left, right) => left.firstTradeId - right.firstTradeId);
}

function isTradeIdInHistoricalRanges(
  exchange: HistoricalAggTrade["exchange"],
  symbol: HistoricalAggTrade["symbol"],
  tradeId: number,
  historicalTradeIdRanges: TradeIdRange[],
) {
  let low = 0;
  let high = historicalTradeIdRanges.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const range = historicalTradeIdRanges[middle];

    if (!range) {
      return false;
    }

    if (tradeId < range.firstTradeId) {
      high = middle - 1;
      continue;
    }

    if (tradeId > range.lastTradeId) {
      low = middle + 1;
      continue;
    }

    return range.exchange === exchange && range.symbol === symbol;
  }

  return false;
}

function getLiveTradeIdFromLargeTradeEvent(trade: LargeTradeEvent) {
  const rawTradeId = trade.id.match(/(\d+)$/)?.[1];

  if (!rawTradeId) {
    return null;
  }

  const tradeId = Number(rawTradeId);

  return Number.isFinite(tradeId) ? tradeId : null;
}

function getLargeTradeSeverity(notionalUsd: number): LargeTradeEvent["severity"] | null {
  if (notionalUsd >= LARGE_TRADE_WHALE_USD) {
    return "whale";
  }

  if (notionalUsd >= LARGE_TRADE_HIGH_USD) {
    return "high";
  }

  if (notionalUsd >= LARGE_TRADE_MEDIUM_USD) {
    return "medium";
  }

  return null;
}

function readViteNumberEnv(name: string, fallback: number) {
  const rawValue = import.meta.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function toFixedVolume(value: number) {
  return Number(value.toFixed(8));
}
