import type {
  Exchange,
  MarketSymbol,
  OrderBookLevel,
  WhaleLiquidityLevel,
} from "../types/market.js";

const DEFAULT_WHALE_ORDER_THRESHOLD_USD = 1_000_000;
const EXCHANGE: Exchange = "binance";
const SYMBOL: MarketSymbol = "BTCUSDT";
const MAX_TRACKED_LEVELS = 100;

type WhaleOrderEngineOptions = {
  thresholdUsd?: number;
};

export class WhaleOrderEngine {
  private readonly thresholdUsd: number;
  private readonly levels = new Map<string, WhaleLiquidityLevel>();

  constructor(options: WhaleOrderEngineOptions = {}) {
    this.thresholdUsd =
      options.thresholdUsd ??
      Number(process.env.WHALE_ORDER_THRESHOLD_USD ?? DEFAULT_WHALE_ORDER_THRESHOLD_USD);
  }

  processOrderBook(orderBook: OrderBookLevel[], timestamp = Date.now()) {
    const seenKeys = new Set<string>();

    for (const level of orderBook) {
      this.processLevel({
        side: "bid",
        price: level.price,
        quantity: level.bidSize,
        timestamp,
        seenKeys,
      });
      this.processLevel({
        side: "ask",
        price: level.price,
        quantity: level.askSize,
        timestamp,
        seenKeys,
      });
    }

    for (const [key, whaleLevel] of this.levels) {
      if (seenKeys.has(key) || whaleLevel.status !== "active") {
        continue;
      }

      this.levels.set(key, {
        ...whaleLevel,
        quantity: 0,
        notionalUsd: 0,
        lastSeen: timestamp,
        durationMs: timestamp - whaleLevel.firstSeen,
        status: "cancelled",
      });
    }

    this.pruneOldLevels();

    return [...this.levels.values()].sort((left, right) => {
      if (left.status === "active" && right.status !== "active") {
        return -1;
      }

      if (left.status !== "active" && right.status === "active") {
        return 1;
      }

      return right.lastSeen - left.lastSeen;
    });
  }

  getLevels() {
    return [...this.levels.values()];
  }

  private processLevel({
    side,
    price,
    quantity,
    timestamp,
    seenKeys,
  }: {
    side: WhaleLiquidityLevel["side"];
    price: number;
    quantity: number;
    timestamp: number;
    seenKeys: Set<string>;
  }) {
    const key = this.getLevelKey(side, price);
    const currentLevel = this.levels.get(key);
    const activeLevel = currentLevel?.status === "active" ? currentLevel : undefined;
    const notionalUsd = price * quantity;

    if (notionalUsd >= this.thresholdUsd) {
      seenKeys.add(key);
      this.levels.set(key, {
        id: this.getLevelId(side, price),
        exchange: EXCHANGE,
        symbol: SYMBOL,
        side,
        price,
        quantity,
        notionalUsd,
        firstSeen: activeLevel?.firstSeen ?? timestamp,
        lastSeen: timestamp,
        durationMs: timestamp - (activeLevel?.firstSeen ?? timestamp),
        status: "active",
      });
      return;
    }

    if (!currentLevel || currentLevel.status !== "active") {
      return;
    }

    seenKeys.add(key);
    this.levels.set(key, {
      ...currentLevel,
      quantity,
      notionalUsd,
      lastSeen: timestamp,
      durationMs: timestamp - currentLevel.firstSeen,
      status: quantity > 0 ? "partially_removed" : "cancelled",
    });
  }

  private pruneOldLevels() {
    const levelsByRecency = [...this.levels.entries()].sort(
      (left, right) => right[1].lastSeen - left[1].lastSeen,
    );

    for (const [index, [key]] of levelsByRecency.entries()) {
      if (index >= MAX_TRACKED_LEVELS) {
        this.levels.delete(key);
      }
    }
  }

  private getLevelKey(side: WhaleLiquidityLevel["side"], price: number) {
    return `${side}:${price.toFixed(2)}`;
  }

  private getLevelId(side: WhaleLiquidityLevel["side"], price: number) {
    return `${EXCHANGE}-${SYMBOL}-${side}-${price.toFixed(2)}`;
  }
}
