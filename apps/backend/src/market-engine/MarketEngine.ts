import type {
  CvdPoint,
  MarketSnapshot,
  NormalizedTrade,
  OrderBookLevel,
  PricePoint,
} from "../types/market.js";

const MAX_TRADES = 150;
const MAX_POINTS = 500;
const SYMBOL = "BTCUSDT";
const EXCHANGE = "binance";

export class MarketEngine {
  private lastPrice = 0;
  private cvd = 0;
  private buyVolume = 0;
  private sellVolume = 0;
  private trades: NormalizedTrade[] = [];
  private orderBook: OrderBookLevel[] = [];
  private pricePoints: PricePoint[] = [];
  private cvdPoints: CvdPoint[] = [];

  processTrade(trade: NormalizedTrade) {
    this.lastPrice = trade.price;
    this.trades = [trade, ...this.trades].slice(0, MAX_TRADES);

    if (trade.side === "buy") {
      this.buyVolume = Number((this.buyVolume + trade.quantity).toFixed(8));
      this.cvd = Number((this.cvd + trade.quantity).toFixed(8));
    } else {
      this.sellVolume = Number((this.sellVolume + trade.quantity).toFixed(8));
      this.cvd = Number((this.cvd - trade.quantity).toFixed(8));
    }
  }

  getCvd() {
    return this.cvd;
  }

  hasTrades() {
    return this.trades.length > 0;
  }

  updateOrderBook(orderBook: OrderBookLevel[]) {
    this.orderBook = orderBook;
  }

  getSnapshot(timestamp = Date.now()): MarketSnapshot {
    if (this.lastPrice > 0) {
      const time = Math.floor(timestamp / 1000);

      this.pricePoints = [
        ...this.pricePoints,
        { time, value: this.lastPrice },
      ].slice(-MAX_POINTS);
      this.cvdPoints = [...this.cvdPoints, { time, value: this.cvd }].slice(
        -MAX_POINTS,
      );
    }

    return {
      symbol: SYMBOL,
      exchange: EXCHANGE,
      lastPrice: this.lastPrice,
      cvd: this.cvd,
      buyVolume: this.buyVolume,
      sellVolume: this.sellVolume,
      trades: this.trades,
      orderBook: this.orderBook,
      pricePoints: this.pricePoints,
      cvdPoints: this.cvdPoints,
      timestamp,
    };
  }
}
