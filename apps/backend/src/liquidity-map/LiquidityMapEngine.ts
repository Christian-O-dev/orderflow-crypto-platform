import type {
  Exchange,
  MarketSymbol,
  OrderBookLevel,
} from "../types/market.js";
import type { LiquidityMapZone } from "@orderflow/shared";

type LiquidityMapEngineOptions = {
  bucketUsd?: number;
  zoneThresholdUsd?: number;
  maxZones?: number;
};

export class LiquidityMapEngine {
  private readonly bucketUsd: number;
  private readonly zoneThresholdUsd: number;
  private readonly maxZones: number;
  private readonly zones = new Map<string, LiquidityMapZone>();

  constructor(options: LiquidityMapEngineOptions = {}) {
    this.bucketUsd = options.bucketUsd ?? 50;
    this.zoneThresholdUsd = options.zoneThresholdUsd ?? 500000;
    this.maxZones = options.maxZones ?? 80;
  }

  processOrderBook(
    deepLevels: OrderBookLevel[],
    lastPrice: number,
    exchange: Exchange,
    symbol: MarketSymbol,
    timestamp = Date.now(),
  ) {
    const seenKeys = new Set<string>();
    const bucketAccumulators = new Map<
      string,
      {
        side: "bid" | "ask";
        priceStart: number;
        quantity: number;
        notionalUsd: number;
        levelCount: number;
      }
    >();

    for (const level of deepLevels) {
      if (level.bidSize > 0) {
        this.accumulateLevel("bid", level.price, level.bidSize, bucketAccumulators);
      }
      if (level.askSize > 0) {
        this.accumulateLevel("ask", level.price, level.askSize, bucketAccumulators);
      }
    }

    for (const [key, bucket] of bucketAccumulators) {
      this.processBucket(
        key,
        bucket,
        lastPrice,
        exchange,
        symbol,
        timestamp,
        seenKeys,
      );
    }

    for (const [key, zone] of this.zones) {
      if (seenKeys.has(key) || zone.status === "removed") {
        continue;
      }

      this.zones.set(key, {
        ...zone,
        quantity: 0,
        notionalUsd: 0,
        lastSeen: timestamp,
        durationMs: timestamp - zone.firstSeen,
        status: "removed",
        intensity: 0,
      });
    }

    this.pruneOldZones();
    this.recalculateIntensities();

    return this.getZones();
  }

  getZones() {
    return [...this.zones.values()].sort((left, right) => right.priceMid - left.priceMid);
  }

  private accumulateLevel(
    side: "bid" | "ask",
    price: number,
    quantity: number,
    accumulators: Map<string, any>
  ) {
    const bucketIndex = Math.floor(price / this.bucketUsd);
    const key = `${side}:${bucketIndex}`;

    let bucket = accumulators.get(key);
    if (!bucket) {
      bucket = {
        side,
        priceStart: bucketIndex * this.bucketUsd,
        quantity: 0,
        notionalUsd: 0,
        levelCount: 0,
      };
      accumulators.set(key, bucket);
    }
    bucket.quantity += quantity;
    bucket.notionalUsd += price * quantity;
    bucket.levelCount += 1;
  }

  private processBucket(
    key: string,
    bucket: any,
    lastPrice: number,
    exchange: Exchange,
    symbol: MarketSymbol,
    timestamp: number,
    seenKeys: Set<string>
  ) {
    const currentZone = this.zones.get(key);
    const isActive = currentZone?.status === "active" || currentZone?.status === "weakened";
    
    // Hysteresis: si ya estaba activo, requiere caer al 75% del umbral para borrarse
    const effectiveThreshold = isActive ? this.zoneThresholdUsd * 0.75 : this.zoneThresholdUsd;

    if (bucket.notionalUsd < effectiveThreshold) {
      return;
    }

    seenKeys.add(key);

    const priceStart = bucket.priceStart;
    const priceEnd = priceStart + this.bucketUsd;
    const priceMid = priceStart + this.bucketUsd / 2;
    const distanceFromPrice = lastPrice > 0 ? Math.abs(priceMid - lastPrice) : 0;
    const distancePercent = lastPrice > 0 ? (distanceFromPrice / lastPrice) * 100 : 0;

    const previousZone = isActive ? currentZone : undefined;

    let status: "active" | "weakened" = "active";
    if (previousZone && bucket.notionalUsd < previousZone.notionalUsd) {
      status = "weakened";
    }

    this.zones.set(key, {
      id: key,
      exchange,
      symbol,
      side: bucket.side,
      priceStart,
      priceEnd,
      priceMid,
      quantity: bucket.quantity,
      notionalUsd: bucket.notionalUsd,
      distanceFromPrice,
      distancePercent,
      intensity: 0,
      levelCount: bucket.levelCount,
      firstSeen: previousZone?.firstSeen ?? timestamp,
      lastSeen: timestamp,
      durationMs: timestamp - (previousZone?.firstSeen ?? timestamp),
      status,
    });
  }

  private recalculateIntensities() {
    let maxIntensityUsd = 0;
    for (const zone of this.zones.values()) {
      if (
        (zone.status === "active" || zone.status === "weakened") &&
        zone.notionalUsd > maxIntensityUsd
      ) {
        maxIntensityUsd = zone.notionalUsd;
      }
    }

    for (const zone of this.zones.values()) {
      if (zone.status === "active" || zone.status === "weakened") {
        zone.intensity = maxIntensityUsd > 0 ? Math.min(1, zone.notionalUsd / maxIntensityUsd) : 0;
      } else {
        zone.intensity = 0;
      }
    }
  }

  private pruneOldZones() {
    const zonesByRecency = [...this.zones.entries()].sort(
      (left, right) => right[1].lastSeen - left[1].lastSeen
    );

    for (const [index, [key]] of zonesByRecency.entries()) {
      if (index >= this.maxZones) {
        this.zones.delete(key);
      }
    }
  }
}
