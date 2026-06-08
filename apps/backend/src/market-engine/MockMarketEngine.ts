import type {
  CvdPoint,
  MarketSnapshot,
  NormalizedTrade,
  OrderBookLevel,
  PricePoint,
} from "../types/market.js";

const MAX_TRADES = 30;
const MAX_POINTS = 120;
const SYMBOL = "BTCUSDT";
const EXCHANGE = "binance";

export class MockMarketEngine {
  private lastPrice = 98_500;
  private cvd = 0;
  private buyVolume = 0;
  private sellVolume = 0;
  private tradeSequence = 1;
  private trades: NormalizedTrade[] = [];
  private pricePoints: PricePoint[] = [];
  private cvdPoints: CvdPoint[] = [];

  getSnapshot(): MarketSnapshot {
    const timestamp = Date.now();
    const trade = this.createTrade(timestamp);

    this.trades = [trade, ...this.trades].slice(0, MAX_TRADES);
    this.pricePoints = [
      ...this.pricePoints,
      { time: Math.floor(timestamp / 1000), value: this.lastPrice },
    ].slice(-MAX_POINTS);
    this.cvdPoints = [
      ...this.cvdPoints,
      { time: Math.floor(timestamp / 1000), value: this.cvd },
    ].slice(-MAX_POINTS);

    return {
      symbol: SYMBOL,
      exchange: EXCHANGE,
      lastPrice: this.lastPrice,
      cvd: this.cvd,
      buyVolume: this.buyVolume,
      sellVolume: this.sellVolume,
      trades: this.trades,
      orderBook: this.createOrderBook(),
      pricePoints: this.pricePoints,
      cvdPoints: this.cvdPoints,
      timestamp,
    };
  }

  private createTrade(timestamp: number): NormalizedTrade {
    const side = Math.random() > 0.48 ? "buy" : "sell";
    const quantity = Number((0.01 + Math.random() * 0.75).toFixed(5));
    const priceMove = (Math.random() - 0.48) * 35;

    this.lastPrice = Number((this.lastPrice + priceMove).toFixed(2));

    if (side === "buy") {
      this.buyVolume = Number((this.buyVolume + quantity).toFixed(5));
      this.cvd = Number((this.cvd + quantity).toFixed(5));
    } else {
      this.sellVolume = Number((this.sellVolume + quantity).toFixed(5));
      this.cvd = Number((this.cvd - quantity).toFixed(5));
    }

    return {
      exchange: EXCHANGE,
      symbol: SYMBOL,
      tradeId: `mock-${this.tradeSequence++}`,
      price: this.lastPrice,
      quantity,
      side,
      timestamp,
    };
  }

  private createOrderBook(): OrderBookLevel[] {
    const levels: OrderBookLevel[] = [];

    for (let index = 1; index <= 10; index += 1) {
      const priceOffset = index * 10;
      const bidSize = Number((0.25 + Math.random() * 4).toFixed(4));
      const askSize = Number((0.25 + Math.random() * 4).toFixed(4));

      levels.push({
        price: Number((this.lastPrice - priceOffset).toFixed(2)),
        bidSize,
        askSize: 0,
      });
      levels.push({
        price: Number((this.lastPrice + priceOffset).toFixed(2)),
        bidSize: 0,
        askSize,
      });
    }

    return levels.sort((left, right) => right.price - left.price);
  }
}

