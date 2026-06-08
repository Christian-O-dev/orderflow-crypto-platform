import { Server } from "socket.io";
import { SOCKET_EVENTS } from "@orderflow/shared";
import type { Server as HttpServer } from "node:http";
import { BinanceDepthConnector } from "../exchanges/binance/BinanceDepthConnector.js";
import { BinanceTradeConnector } from "../exchanges/binance/BinanceTradeConnector.js";
import { MarketEngine } from "../market-engine/MarketEngine.js";
import { MockMarketEngine } from "../market-engine/MockMarketEngine.js";
import { SignalEngine } from "../signal-engine/SignalEngine.js";
import type { Database } from "../database/index.js";

const SNAPSHOT_INTERVAL_MS = 250;
const PERSISTENCE_INTERVAL_MS = 1_000;
const FALLBACK_AFTER_MS = 5_000;

type RealtimeServerOptions = {
  database?: Database;
};

export function createRealtimeServer(
  httpServer: HttpServer,
  options: RealtimeServerOptions = {},
) {
  const io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    },
  });

  const marketEngine = new MarketEngine();
  const mockMarketEngine = new MockMarketEngine();
  const signalEngine = new SignalEngine();
  let useMockFallback = process.env.MARKET_DATA_MODE === "mock";
  let lastRealTradeAt = Date.now();
  let lastPersistedAt = 0;

  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.MARKET_SNAPSHOT, getCurrentSnapshot());
  });

  signalEngine.onAlert((alert) => {
    io.emit(SOCKET_EVENTS.MARKET_ALERT, alert);
    void options.database?.saveMarketAlert(alert);
  });

  const binanceConnector = new BinanceTradeConnector({
    onTrade: (trade) => {
      lastRealTradeAt = Date.now();
      useMockFallback = false;
      marketEngine.processTrade(trade);
      signalEngine.processTrade(trade, marketEngine.getCvd());
    },
    onStatusChange: (status) => {
      console.log(`Binance trades ${status}`);
    },
    onError: (error) => {
      useMockFallback = true;
      console.error(`Binance trades error: ${error.message}`);
    },
  });
  const binanceDepthConnector = new BinanceDepthConnector({
    onDepth: (orderBook) => {
      marketEngine.updateOrderBook(orderBook);
      signalEngine.processOrderBook(orderBook);
    },
    onStatusChange: (status) => {
      console.log(`Binance depth ${status}`);
    },
    onError: (error) => {
      console.error(`Binance depth error: ${error.message}`);
    },
  });

  if (!useMockFallback) {
    binanceConnector.connect();
    binanceDepthConnector.connect();
  }

  const interval = setInterval(() => {
    const snapshot = getCurrentSnapshot();

    io.emit(SOCKET_EVENTS.MARKET_SNAPSHOT, snapshot);

    if (Date.now() - lastPersistedAt >= PERSISTENCE_INTERVAL_MS) {
      lastPersistedAt = Date.now();
      void options.database?.saveMarketTick(snapshot);
    }
  }, SNAPSHOT_INTERVAL_MS);

  interval.unref();

  return io;

  function getCurrentSnapshot() {
    const hasTimedOutWaitingForRealTrades =
      !marketEngine.hasTrades() && Date.now() - lastRealTradeAt > FALLBACK_AFTER_MS;

    if (useMockFallback || hasTimedOutWaitingForRealTrades) {
      if (!useMockFallback) {
        console.warn("Using mock market fallback while Binance trades connect");
      }

      useMockFallback = true;
      return mockMarketEngine.getSnapshot();
    }

    return marketEngine.getSnapshot();
  }
}
