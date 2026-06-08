export type Exchange = "binance";
export type MarketSymbol = "BTCUSDT";

export type NormalizedTrade = {
  exchange: Exchange;
  symbol: MarketSymbol;
  tradeId: string;
  price: number;
  quantity: number;
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
