import type {
  LargeTradeEvent,
  MarketAlert,
  NormalizedTrade,
  OrderBookLevel,
} from "../types/market.js";
import { MARKET_CONFIG } from "../config/marketConfig.js";

const { signal } = MARKET_CONFIG;

type AlertListener = (alert: MarketAlert) => void;
type LargeTradeListener = (largeTrade: LargeTradeEvent) => void;

export class SignalEngine {
  private listeners = new Set<AlertListener>();
  private largeTradeListeners = new Set<LargeTradeListener>();
  private lastAlertAtByKey = new Map<string, number>();
  private cvdSamples: Array<{ timestamp: number; value: number }> = [];
  private previousLargeLevels = new Map<string, number>();
  private recentLargeTradeIds: string[] = [];
  private largeTradeMediumUsd = signal.largeTradeMediumUsd;
  private largeTradeHighUsd = signal.largeTradeHighUsd;
  private largeTradeWhaleUsd = signal.largeTradeWhaleUsd;
  private cvdSpikeThreshold = signal.cvdSpikeThreshold;
  private cvdSpikeWindowMs = signal.cvdSpikeWindowMs;
  private liquidityWallThreshold = signal.liquidityWallThreshold;

  onAlert(listener: AlertListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  onLargeTrade(listener: LargeTradeListener) {
    this.largeTradeListeners.add(listener);

    return () => {
      this.largeTradeListeners.delete(listener);
    };
  }

  processTrade(trade: NormalizedTrade, cvd: number) {
    const notionalUsd = trade.price * trade.quantity;
    const largeTradeSeverity = this.getLargeTradeSeverity(notionalUsd);

    if (largeTradeSeverity) {
      const largeTradeId = createLargeTradeId(trade);

      if (this.hasSeenLargeTrade(largeTradeId)) {
        return;
      }

      const largeTrade: LargeTradeEvent = {
        id: largeTradeId,
        exchange: trade.exchange,
        symbol: trade.symbol,
        side: trade.side,
        price: trade.price,
        quantity: trade.quantity,
        notionalUsd,
        severity: largeTradeSeverity,
        timestamp: trade.timestamp,
      };

      this.emitLargeTrade(largeTrade);
      this.emitWithCooldown(`large_trade:${trade.side}:${largeTradeSeverity}`, {
        id: createAlertId("large_trade"),
        type: "large_trade",
        symbol: trade.symbol,
        message: `${trade.side === "buy" ? "Compra" : "Venta"} grande ejecutada: ${formatUsd(notionalUsd)} en ${trade.quantity.toFixed(4)} BTC cerca de ${trade.price.toFixed(2)}.`,
        severity: largeTradeSeverity === "medium" ? "medium" : "high",
        timestamp: trade.timestamp,
      });
    }

    this.cvdSamples = [
      ...this.cvdSamples.filter(
        (sample) => trade.timestamp - sample.timestamp <= this.cvdSpikeWindowMs,
      ),
      { timestamp: trade.timestamp, value: cvd },
    ];

    const baselineSample = this.cvdSamples[0];

    if (baselineSample) {
      const cvdDelta = cvd - baselineSample.value;

      if (Math.abs(cvdDelta) >= this.cvdSpikeThreshold) {
        this.emitWithCooldown(`cvd_spike:${Math.sign(cvdDelta)}`, {
          id: createAlertId("cvd_spike"),
          type: "cvd_spike",
          symbol: MARKET_CONFIG.symbol,
          message: `Desequilibrio probable en CVD: cambio de ${cvdDelta.toFixed(4)} BTC en los ultimos ${Math.round(this.cvdSpikeWindowMs / 1000)}s.`,
          severity: Math.abs(cvdDelta) >= this.cvdSpikeThreshold * 2 ? "high" : "medium",
          timestamp: trade.timestamp,
        });
      }
    }
  }

  processOrderBook(orderBook: OrderBookLevel[]) {
    const currentLargeLevels = new Map<string, number>();

    for (const level of orderBook) {
      const size = level.bidSize > 0 ? level.bidSize : level.askSize;
      const side = level.bidSize > 0 ? "bid" : "ask";

      if (size >= this.liquidityWallThreshold) {
        const key = `${side}:${level.price}`;
        currentLargeLevels.set(key, size);

        this.emitWithCooldown(`liquidity_wall:${key}`, {
          id: createAlertId("liquidity_wall"),
          type: "liquidity_wall",
          symbol: MARKET_CONFIG.symbol,
          message: `Muro detectado en ${side.toUpperCase()} cerca de ${level.price.toFixed(2)} con ${size.toFixed(4)} BTC.`,
          severity: size >= this.liquidityWallThreshold * 2 ? "high" : "medium",
          timestamp: Date.now(),
        });
      }
    }

    for (const [key, previousSize] of this.previousLargeLevels) {
      const currentSize = currentLargeLevels.get(key) ?? 0;

      if (currentSize <= previousSize * (1 - signal.liquidityRemovedRatio)) {
        const [, price] = key.split(":");

        this.emitWithCooldown(`liquidity_removed:${key}`, {
          id: createAlertId("liquidity_removed"),
          type: "liquidity_removed",
          symbol: MARKET_CONFIG.symbol,
          message: `Liquidez retirada cerca de ${Number(price).toFixed(2)}. Posible cambio rapido en el DOM.`,
          severity: "medium",
          timestamp: Date.now(),
        });
      }
    }

    this.previousLargeLevels = currentLargeLevels;
  }

  private emitWithCooldown(key: string, alert: MarketAlert) {
    const now = Date.now();
    const lastAlertAt = this.lastAlertAtByKey.get(key) ?? 0;

    if (now - lastAlertAt < signal.alertCooldownMs) {
      return;
    }

    this.lastAlertAtByKey.set(key, now);

    for (const listener of this.listeners) {
      listener(alert);
    }
  }

  private emitLargeTrade(largeTrade: LargeTradeEvent) {
    for (const listener of this.largeTradeListeners) {
      listener(largeTrade);
    }
  }

  private hasSeenLargeTrade(id: string) {
    if (this.recentLargeTradeIds.includes(id)) {
      return true;
    }

    this.recentLargeTradeIds = [id, ...this.recentLargeTradeIds].slice(
      0,
      signal.recentLargeTradeIds,
    );

    return false;
  }

  private getLargeTradeSeverity(notionalUsd: number): LargeTradeEvent["severity"] | null {
    if (notionalUsd >= this.largeTradeWhaleUsd) {
      return "whale";
    }

    if (notionalUsd >= this.largeTradeHighUsd) {
      return "high";
    }

    if (notionalUsd >= this.largeTradeMediumUsd) {
      return "medium";
    }

    return null;
  }
}

function createAlertId(type: MarketAlert["type"]) {
  return `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createLargeTradeId(trade: NormalizedTrade) {
  return `large-trade-${trade.exchange}-${trade.tradeId}`;
}

function formatUsd(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
