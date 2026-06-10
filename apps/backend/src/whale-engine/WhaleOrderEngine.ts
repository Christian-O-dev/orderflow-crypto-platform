import type {
  OrderBookLevel,
  WhaleLiquidityLevel,
} from "../types/market.js";
import { MARKET_CONFIG } from "../config/marketConfig.js";

type WhaleOrderEngineOptions = {
  thresholdUsd?: number;
  maxTrackedLevels?: number;
};

export class WhaleOrderEngine {
  private readonly thresholdUsd: number;
  private readonly maxTrackedLevels: number;
  private readonly levels = new Map<string, WhaleLiquidityLevel>();

  constructor(options: WhaleOrderEngineOptions = {}) {
    this.thresholdUsd = options.thresholdUsd ?? MARKET_CONFIG.whaleOrders.thresholdUsd;
    this.maxTrackedLevels =
      options.maxTrackedLevels ?? MARKET_CONFIG.whaleOrders.maxTrackedLevels;
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
    const isActive = currentLevel?.status === "active";
    const activeLevel = isActive ? currentLevel : undefined;
    const notionalUsd = price * quantity;
    
    // Histéresis: si ya era "active", requiere que caiga por debajo del 75% del umbral para dejar de serlo
    const effectiveThreshold = isActive ? this.thresholdUsd * 0.75 : this.thresholdUsd;

    if (notionalUsd >= effectiveThreshold) {
      seenKeys.add(key);
      this.levels.set(key, {
        id: this.getLevelId(side, price),
        exchange: MARKET_CONFIG.exchange,
        symbol: MARKET_CONFIG.symbol,
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

    if (!currentLevel || (!isActive && currentLevel.status !== "partially_removed")) {
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
      if (index >= this.maxTrackedLevels) {
        this.levels.delete(key);
      }
    }
  }

  private getLevelKey(side: WhaleLiquidityLevel["side"], price: number) {
    return `${side}:${price.toFixed(2)}`;
  }

  private getLevelId(side: WhaleLiquidityLevel["side"], price: number) {
    return `${MARKET_CONFIG.exchange}-${MARKET_CONFIG.symbol}-${side}-${price.toFixed(2)}`;
  }
}
