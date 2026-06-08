import type {
  MarketAlert,
  MarketSymbol,
  NormalizedTrade,
  OrderBookLevel,
} from "../types/market.js";

const SYMBOL: MarketSymbol = "BTCUSDT";
const LARGE_TRADE_THRESHOLD = Number(process.env.LARGE_TRADE_THRESHOLD ?? 1);
const CVD_SPIKE_THRESHOLD = Number(process.env.CVD_SPIKE_THRESHOLD ?? 5);
const CVD_SPIKE_WINDOW_MS = Number(process.env.CVD_SPIKE_WINDOW_MS ?? 5_000);
const LIQUIDITY_WALL_THRESHOLD = Number(
  process.env.LIQUIDITY_WALL_THRESHOLD ?? 8,
);
const LIQUIDITY_REMOVED_RATIO = 0.65;
const ALERT_COOLDOWN_MS = 5_000;

type AlertListener = (alert: MarketAlert) => void;

export class SignalEngine {
  private listeners = new Set<AlertListener>();
  private lastAlertAtByKey = new Map<string, number>();
  private cvdSamples: Array<{ timestamp: number; value: number }> = [];
  private previousLargeLevels = new Map<string, number>();

  onAlert(listener: AlertListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  processTrade(trade: NormalizedTrade, cvd: number) {
    if (trade.quantity >= LARGE_TRADE_THRESHOLD) {
      this.emitWithCooldown(`large_trade:${trade.side}`, {
        id: createAlertId("large_trade"),
        type: "large_trade",
        symbol: SYMBOL,
        message: `${trade.side === "buy" ? "Compra" : "Venta"} grande detectada: ${trade.quantity.toFixed(4)} BTC cerca de ${trade.price.toFixed(2)}.`,
        severity: trade.quantity >= LARGE_TRADE_THRESHOLD * 2 ? "high" : "medium",
        timestamp: trade.timestamp,
      });
    }

    this.cvdSamples = [
      ...this.cvdSamples.filter(
        (sample) => trade.timestamp - sample.timestamp <= CVD_SPIKE_WINDOW_MS,
      ),
      { timestamp: trade.timestamp, value: cvd },
    ];

    const baselineSample = this.cvdSamples[0];

    if (baselineSample) {
      const cvdDelta = cvd - baselineSample.value;

      if (Math.abs(cvdDelta) >= CVD_SPIKE_THRESHOLD) {
        this.emitWithCooldown(`cvd_spike:${Math.sign(cvdDelta)}`, {
          id: createAlertId("cvd_spike"),
          type: "cvd_spike",
          symbol: SYMBOL,
          message: `Desequilibrio probable en CVD: cambio de ${cvdDelta.toFixed(4)} BTC en los ultimos ${Math.round(CVD_SPIKE_WINDOW_MS / 1000)}s.`,
          severity: Math.abs(cvdDelta) >= CVD_SPIKE_THRESHOLD * 2 ? "high" : "medium",
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

      if (size >= LIQUIDITY_WALL_THRESHOLD) {
        const key = `${side}:${level.price}`;
        currentLargeLevels.set(key, size);

        this.emitWithCooldown(`liquidity_wall:${key}`, {
          id: createAlertId("liquidity_wall"),
          type: "liquidity_wall",
          symbol: SYMBOL,
          message: `Muro detectado en ${side.toUpperCase()} cerca de ${level.price.toFixed(2)} con ${size.toFixed(4)} BTC.`,
          severity: size >= LIQUIDITY_WALL_THRESHOLD * 2 ? "high" : "medium",
          timestamp: Date.now(),
        });
      }
    }

    for (const [key, previousSize] of this.previousLargeLevels) {
      const currentSize = currentLargeLevels.get(key) ?? 0;

      if (currentSize <= previousSize * (1 - LIQUIDITY_REMOVED_RATIO)) {
        const [, price] = key.split(":");

        this.emitWithCooldown(`liquidity_removed:${key}`, {
          id: createAlertId("liquidity_removed"),
          type: "liquidity_removed",
          symbol: SYMBOL,
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

    if (now - lastAlertAt < ALERT_COOLDOWN_MS) {
      return;
    }

    this.lastAlertAtByKey.set(key, now);

    for (const listener of this.listeners) {
      listener(alert);
    }
  }
}

function createAlertId(type: MarketAlert["type"]) {
  return `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
