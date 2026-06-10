export type Exchange = "binance";
export type MarketSymbol = "BTCUSDT";

export type ChartTimeframe =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d";

export type CandleInterval = ChartTimeframe;

export type AnalysisWindow =
  | "30s"
  | "1m"
  | "5m"
  | "15m"
  | "1h"
  | "4h";

export type LiquidityDepthRange = "0.25%" | "0.5%" | "1%" | "2%" | "5%";

export type NormalizedTrade = {
  exchange: Exchange;
  symbol: MarketSymbol;
  tradeId: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: number;
};

export type HistoricalAggTrade = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  aggregateTradeId: number;
  firstTradeId: number;
  lastTradeId: number;
  price: number;
  quantity: number;
  notionalUsd: number;
  side: "buy" | "sell";
  timestamp: number;
};

export type OrderBookLevel = {
  price: number;
  bidSize: number;
  askSize: number;
  bidTotal?: number;
  askTotal?: number;
};

export type PricePoint = {
  time: number;
  value: number;
};

export type CvdPoint = {
  time: number;
  value: number;
};

export type MarketCandle = {
  exchange: Exchange;
  symbol: MarketSymbol;
  interval: CandleInterval;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  takerBuyBaseVolume: number;
};

export type MarketSnapshot = {
  symbol: MarketSymbol;
  exchange: Exchange;
  lastPrice: number;
  cvd: number;
  buyVolume: number;
  sellVolume: number;
  trades: NormalizedTrade[];
  orderBook: OrderBookLevel[];
  pricePoints: PricePoint[];
  cvdPoints: CvdPoint[];
  timestamp: number;
};

export type MarketAlert = {
  id: string;
  type: "large_trade" | "cvd_spike" | "liquidity_wall" | "liquidity_removed";
  symbol: MarketSymbol;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
};

export type LargeTradeEvent = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  notionalUsd: number;
  severity: "medium" | "high" | "whale";
  timestamp: number;
};

export type WhaleLiquidityLevel = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  notionalUsd: number;
  firstSeen: number;
  lastSeen: number;
  durationMs: number;
  status: "active" | "cancelled" | "partially_removed";
};

export type DeepLiquidityLevel = WhaleLiquidityLevel & {
  distanceFromPrice: number;
  distancePercent: number;
  ageSeconds: number;
  zone: "near" | "mid" | "far";
};

export type LiquidityMapZone = {
  id: string;
  exchange: Exchange;
  symbol: MarketSymbol;
  side: "bid" | "ask";
  priceStart: number;
  priceEnd: number;
  priceMid: number;
  quantity: number;
  notionalUsd: number;
  distanceFromPrice: number;
  distancePercent: number;
  intensity: number;
  levelCount: number;
  firstSeen: number;
  lastSeen: number;
  durationMs: number;
  status: "active" | "weakened" | "removed";
};

export type LiquidityMapResolution = "100" | "500" | "2000";
export type LiquidityMapZonesByResolution = Record<LiquidityMapResolution, LiquidityMapZone[]>;

export type ChartLiquidityBand = {
  id: string;
  side: "bid" | "ask";
  price: number;
  quantity: number;
  notionalUsd: number;
  status: WhaleLiquidityLevel["status"];
  firstSeen: number;
  lastSeen: number;
};

export type ChartTradeMarker = {
  id: string;
  side: "buy" | "sell";
  price: number;
  quantity: number;
  notionalUsd: number;
  severity: LargeTradeEvent["severity"];
  timestamp: number;
};

export const SOCKET_EVENTS = {
  MARKET_SNAPSHOT: "market:snapshot",
  MARKET_ALERT: "market:alert",
  MARKET_LARGE_TRADE: "market:large_trade",
  MARKET_WHALE_ORDERS: "market:whale_orders",
  MARKET_LIQUIDITY_MAP: "market:liquidity_map",
} as const;
