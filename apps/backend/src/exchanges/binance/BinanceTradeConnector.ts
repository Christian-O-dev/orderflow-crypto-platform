import WebSocket from "ws";
import type { NormalizedTrade } from "../../types/market.js";
import { MARKET_CONFIG } from "../../config/marketConfig.js";
import {
  isBinanceTradeMessage,
  normalizeBinanceTrade,
} from "../../normalizers/binanceNormalizer.js";

type BinanceTradeConnectorOptions = {
  onTrade: (trade: NormalizedTrade) => void;
  onStatusChange?: (status: BinanceTradeConnectorStatus) => void;
  onError?: (error: Error) => void;
};

export type BinanceTradeConnectorStatus =
  | "connecting"
  | "connected"
  | "disconnected";

const BINANCE_BTCUSDT_TRADE_URL =
  "wss://stream.binance.com:9443/ws/btcusdt@trade";

export class BinanceTradeConnector {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private shouldReconnect = true;

  constructor(private readonly options: BinanceTradeConnectorOptions) {}

  connect() {
    this.shouldReconnect = true;
    this.options.onStatusChange?.("connecting");
    this.ws = new WebSocket(BINANCE_BTCUSDT_TRADE_URL);

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

      if (!isBinanceTradeMessage(parsedMessage)) {
        return;
      }

      this.options.onTrade(normalizeBinanceTrade(parsedMessage));
    } catch (error) {
      this.options.onError?.(
        error instanceof Error ? error : new Error("Invalid Binance message"),
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

