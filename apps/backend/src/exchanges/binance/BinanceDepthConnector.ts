import WebSocket from "ws";
import type { OrderBookLevel } from "../../types/market.js";
import { MARKET_CONFIG } from "../../config/marketConfig.js";

type BinanceDepthConnectorOptions = {
  onDepth: (levels: OrderBookLevel[]) => void;
  onStatusChange?: (status: BinanceDepthConnectorStatus) => void;
  onError?: (error: Error) => void;
};

export type BinanceDepthConnectorStatus =
  | "connecting"
  | "connected"
  | "disconnected";

type BinanceDepthMessage = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};

const BINANCE_BTCUSDT_DEPTH_URL =
  "wss://stream.binance.com:9443/ws/btcusdt@depth20@100ms";

export class BinanceDepthConnector {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private readonly orderBook = new BinanceTopOrderBook(
    MARKET_CONFIG.binance.depthFallbackLevels,
  );

  constructor(private readonly options: BinanceDepthConnectorOptions) {}

  connect() {
    this.shouldReconnect = true;
    this.options.onStatusChange?.("connecting");
    this.ws = new WebSocket(BINANCE_BTCUSDT_DEPTH_URL);

    this.ws.on("open", () => {
      this.options.onStatusChange?.("connected");
    });

    this.ws.on("message", (data) => {
      this.handleMessage(data.toString());
    });

    this.ws.on("error", (error) => {
      this.options.onError?.(error);
    });

    this.ws.on("close", () => {
      this.options.onStatusChange?.("disconnected");
      this.ws = null;
      this.scheduleReconnect();
    });
  }

  close() {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.ws?.close();
    this.ws = null;
  }

  private handleMessage(rawMessage: string) {
    try {
      const parsedMessage: unknown = JSON.parse(rawMessage);

      if (!isBinanceDepthMessage(parsedMessage)) {
        return;
      }

      this.orderBook.replace(parsedMessage.bids, parsedMessage.asks);
      this.options.onDepth(this.orderBook.getLevels());
    } catch (error) {
      this.options.onError?.(
        error instanceof Error ? error : new Error("Invalid Binance depth message"),
      );
    }
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, MARKET_CONFIG.binance.reconnectDelayMs);

    this.reconnectTimer.unref();
  }
}

class BinanceTopOrderBook {
  private bids = new Map<number, number>();
  private asks = new Map<number, number>();

  constructor(private readonly maxLevels: number) {}

  replace(rawBids: [string, string][], rawAsks: [string, string][]) {
    this.bids = parseSide(rawBids, this.maxLevels);
    this.asks = parseSide(rawAsks, this.maxLevels);
  }

  getLevels(): OrderBookLevel[] {
    const bidLevels = Array.from(this.bids.entries())
      .map(([price, size]) => ({ price, size }))
      .sort((left, right) => right.price - left.price)
      .slice(0, this.maxLevels);
    const askLevels = Array.from(this.asks.entries())
      .map(([price, size]) => ({ price, size }))
      .sort((left, right) => left.price - right.price)
      .slice(0, this.maxLevels);

    let bidTotal = 0;
    let askTotal = 0;
    const levels: OrderBookLevel[] = [];
    const maxLength = Math.max(bidLevels.length, askLevels.length);

    for (let index = 0; index < maxLength; index += 1) {
      const bid = bidLevels[index];
      const ask = askLevels[index];

      if (bid) {
        bidTotal = Number((bidTotal + bid.size).toFixed(8));
        levels.push({
          price: bid.price,
          bidSize: bid.size,
          askSize: 0,
          bidTotal,
        });
      }

      if (ask) {
        askTotal = Number((askTotal + ask.size).toFixed(8));
        levels.push({
          price: ask.price,
          bidSize: 0,
          askSize: ask.size,
          askTotal,
        });
      }
    }

    return levels.sort((left, right) => right.price - left.price);
  }
}

function isBinanceDepthMessage(value: unknown): value is BinanceDepthMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return Array.isArray(message.bids) && Array.isArray(message.asks);
}

function parseSide(rawLevels: [string, string][], maxLevels: number) {
  const parsedLevels = new Map<number, number>();

  for (const [rawPrice, rawSize] of rawLevels.slice(0, maxLevels)) {
    const price = Number(rawPrice);
    const size = Number(rawSize);

    if (!Number.isFinite(price) || !Number.isFinite(size) || price <= 0 || size < 0) {
      continue;
    }

    if (size === 0) {
      parsedLevels.delete(price);
      continue;
    }

    parsedLevels.set(price, size);
  }

  return parsedLevels;
}
