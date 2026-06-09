import WebSocket from "ws";
import type { OrderBookLevel } from "../../types/market.js";
import { MARKET_CONFIG } from "../../config/marketConfig.js";

type BinanceDeepOrderBookConnectorOptions = {
  onDepth: (update: BinanceDeepOrderBookUpdate) => void;
  onStatusChange?: (status: BinanceDeepOrderBookConnectorStatus) => void;
  onError?: (error: Error) => void;
};

export type BinanceDeepOrderBookConnectorStatus =
  | "connecting"
  | "connected"
  | "syncing"
  | "disconnected";

export type BinanceDeepOrderBookUpdate = {
  topLevels: OrderBookLevel[];
  deepLevels: OrderBookLevel[];
  updateId: number;
  eventTime: number;
};

type BinanceDepthDiffMessage = {
  e: "depthUpdate";
  E: number;
  s: string;
  U: number;
  u: number;
  b: [string, string][];
  a: [string, string][];
};

type BinanceDepthSnapshot = {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
};

const BINANCE_BTCUSDT_DEEP_DEPTH_URL =
  "wss://stream.binance.com:9443/ws/btcusdt@depth@100ms";
const BINANCE_BTCUSDT_DEPTH_SNAPSHOT_URL =
  "https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=5000";
const { binance } = MARKET_CONFIG;

export class BinanceDeepOrderBookConnector {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private resyncTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;
  private isSyncing = false;
  private readonly orderBook = new BinanceLocalOrderBook();
  private bufferedEvents: BinanceDepthDiffMessage[] = [];

  constructor(private readonly options: BinanceDeepOrderBookConnectorOptions) {}

  connect() {
    this.shouldReconnect = true;
    this.options.onStatusChange?.("connecting");
    this.ws = new WebSocket(BINANCE_BTCUSDT_DEEP_DEPTH_URL);

    this.ws.on("open", () => {
      this.options.onStatusChange?.("connected");
      void this.syncFromSnapshot();
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
      this.resetLocalState();
      this.scheduleReconnect();
    });
  }

  close() {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.resyncTimer) {
      clearTimeout(this.resyncTimer);
      this.resyncTimer = null;
    }

    this.ws?.close();
    this.ws = null;
    this.resetLocalState();
  }

  private handleMessage(rawMessage: string) {
    try {
      const parsedMessage: unknown = JSON.parse(rawMessage);

      if (!isBinanceDepthDiffMessage(parsedMessage)) {
        return;
      }

      if (this.isSyncing || this.orderBook.updateId === 0) {
        this.bufferEvent(parsedMessage);
        return;
      }

      this.applyEvent(parsedMessage);
    } catch (error) {
      this.options.onError?.(
        error instanceof Error
          ? error
          : new Error("Invalid Binance deep depth message"),
      );
    }
  }

  private async syncFromSnapshot() {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.bufferedEvents = [];
    this.orderBook.clear();
    this.options.onStatusChange?.("syncing");

    try {
      let snapshot = await this.fetchSnapshot();
      let firstBufferedUpdateId = this.bufferedEvents[0]?.U;

      while (
        firstBufferedUpdateId !== undefined &&
        snapshot.lastUpdateId < firstBufferedUpdateId
      ) {
        snapshot = await this.fetchSnapshot();
        firstBufferedUpdateId = this.bufferedEvents[0]?.U;
      }

      const replayEvents = this.bufferedEvents.filter(
        (event) => event.u > snapshot.lastUpdateId,
      );
      const firstReplayEvent = replayEvents[0];

      if (
        firstReplayEvent &&
        (firstReplayEvent.U > snapshot.lastUpdateId + 1 ||
          firstReplayEvent.u < snapshot.lastUpdateId)
      ) {
        throw new Error("Binance deep order book snapshot is out of sequence");
      }

      this.orderBook.replace(
        snapshot.lastUpdateId,
        snapshot.bids,
        snapshot.asks,
      );
      this.bufferedEvents = [];
      this.isSyncing = false;

      for (const event of replayEvents) {
        this.applyEvent(event);
      }

      this.emitDepth(Date.now());
      this.options.onStatusChange?.("connected");
    } catch (error) {
      this.isSyncing = false;
      this.options.onError?.(
        error instanceof Error
          ? error
          : new Error("Failed to sync Binance deep order book"),
      );
      this.scheduleResync();
    }
  }

  private async fetchSnapshot() {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, binance.snapshotTimeoutMs);

    try {
      const response = await fetch(BINANCE_BTCUSDT_DEPTH_SNAPSHOT_URL, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Binance depth snapshot failed with ${response.status}`);
      }

      const payload: unknown = await response.json();

      if (!isBinanceDepthSnapshot(payload)) {
        throw new Error("Invalid Binance depth snapshot payload");
      }

      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }

  private applyEvent(event: BinanceDepthDiffMessage) {
    if (event.u <= this.orderBook.updateId) {
      return;
    }

    if (event.U > this.orderBook.updateId + 1) {
      this.options.onError?.(
        new Error(
          `Binance deep order book sequence gap: expected ${
            this.orderBook.updateId + 1
          }, received ${event.U}`,
        ),
      );
      this.resetLocalState();
      this.scheduleResync();
      return;
    }

    this.orderBook.apply(event.u, event.b, event.a);
    this.emitDepth(event.E);
  }

  private emitDepth(eventTime: number) {
    this.options.onDepth({
      topLevels: this.orderBook.getTopLevels(binance.topLevels),
      deepLevels: this.orderBook.getLevels(binance.maxDeepLevels),
      updateId: this.orderBook.updateId,
      eventTime,
    });
  }

  private bufferEvent(event: BinanceDepthDiffMessage) {
    this.bufferedEvents.push(event);

    if (this.bufferedEvents.length <= binance.maxBufferedDepthEvents) {
      return;
    }

    this.options.onError?.(
      new Error("Binance deep order book buffer overflow during sync"),
    );
    this.bufferedEvents = [];
    this.scheduleResync();
  }

  private scheduleReconnect() {
    if (!this.shouldReconnect || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, binance.reconnectDelayMs);

    this.reconnectTimer.unref();
  }

  private scheduleResync() {
    if (!this.shouldReconnect || this.resyncTimer || !this.ws) {
      return;
    }

    this.resyncTimer = setTimeout(() => {
      this.resyncTimer = null;
      void this.syncFromSnapshot();
    }, binance.deepResyncDelayMs);

    this.resyncTimer.unref();
  }

  private resetLocalState() {
    this.isSyncing = false;
    this.bufferedEvents = [];
    this.orderBook.clear();
  }
}

class BinanceLocalOrderBook {
  private bids = new Map<number, number>();
  private asks = new Map<number, number>();
  private lastUpdateId = 0;

  get updateId() {
    return this.lastUpdateId;
  }

  clear() {
    this.bids.clear();
    this.asks.clear();
    this.lastUpdateId = 0;
  }

  replace(
    updateId: number,
    rawBids: [string, string][],
    rawAsks: [string, string][],
  ) {
    this.bids = parseSide(rawBids);
    this.asks = parseSide(rawAsks);
    this.lastUpdateId = updateId;
  }

  apply(updateId: number, rawBids: [string, string][], rawAsks: [string, string][]) {
    applySideUpdates(this.bids, rawBids);
    applySideUpdates(this.asks, rawAsks);
    this.lastUpdateId = updateId;
  }

  getTopLevels(maxLevels: number) {
    return mergeSides(
      getSortedLevels(this.bids, "bid").slice(0, maxLevels),
      getSortedLevels(this.asks, "ask").slice(0, maxLevels),
    );
  }

  getLevels(maxLevelsPerSide: number) {
    return mergeSides(
      getSortedLevels(this.bids, "bid").slice(0, maxLevelsPerSide),
      getSortedLevels(this.asks, "ask").slice(0, maxLevelsPerSide),
    );
  }
}

type SideLevel = {
  price: number;
  size: number;
};

function getSortedLevels(side: Map<number, number>, sideName: "bid" | "ask") {
  return Array.from(side.entries())
    .map(([price, size]) => ({ price, size }))
    .sort((left, right) =>
      sideName === "bid" ? right.price - left.price : left.price - right.price,
    );
}

function mergeSides(bidLevels: SideLevel[], askLevels: SideLevel[]) {
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

  return levels;
}

function parseSide(rawLevels: [string, string][]) {
  const parsedLevels = new Map<number, number>();

  applySideUpdates(parsedLevels, rawLevels);

  return parsedLevels;
}

function applySideUpdates(side: Map<number, number>, rawLevels: [string, string][]) {
  for (const [rawPrice, rawSize] of rawLevels) {
    const price = Number(rawPrice);
    const size = Number(rawSize);

    if (!Number.isFinite(price) || !Number.isFinite(size) || price <= 0 || size < 0) {
      continue;
    }

    if (size === 0) {
      side.delete(price);
      continue;
    }

    side.set(price, size);
  }
}

function isBinanceDepthDiffMessage(value: unknown): value is BinanceDepthDiffMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    message.e === "depthUpdate" &&
    typeof message.E === "number" &&
    typeof message.U === "number" &&
    typeof message.u === "number" &&
    Array.isArray(message.b) &&
    Array.isArray(message.a)
  );
}

function isBinanceDepthSnapshot(value: unknown): value is BinanceDepthSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as Record<string, unknown>;

  return (
    typeof snapshot.lastUpdateId === "number" &&
    Array.isArray(snapshot.bids) &&
    Array.isArray(snapshot.asks)
  );
}
