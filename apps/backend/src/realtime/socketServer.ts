import { Server } from "socket.io";
import { SOCKET_EVENTS } from "@orderflow/shared";
import type { Server as HttpServer } from "node:http";
import { BinanceDeepOrderBookConnector } from "../exchanges/binance/BinanceDeepOrderBookConnector.js";
import { BinanceDepthConnector } from "../exchanges/binance/BinanceDepthConnector.js";
import { BinanceTradeConnector } from "../exchanges/binance/BinanceTradeConnector.js";
import { MarketEngine } from "../market-engine/MarketEngine.js";
import { MockMarketEngine } from "../market-engine/MockMarketEngine.js";
import { SignalEngine } from "../signal-engine/SignalEngine.js";
import { WhaleOrderEngine } from "../whale-engine/WhaleOrderEngine.js";
import type { Database } from "../database/index.js";

const SNAPSHOT_INTERVAL_MS = 250;
const PERSISTENCE_INTERVAL_MS = 1_000;
const FALLBACK_AFTER_MS = 5_000;
const VITE_DEV_ORIGINS = [/^http:\/\/localhost:517\d+$/, /^http:\/\/127\.0\.0\.1:517\d+$/];

type RealtimeServerOptions = {
  database?: Database;
};

export function createRealtimeServer(
  httpServer: HttpServer,
  options: RealtimeServerOptions = {},
) {
  const io = new Server(httpServer, {
    cors: {
      origin: VITE_DEV_ORIGINS,
    },
  });

  const marketEngine = new MarketEngine();
  const mockMarketEngine = new MockMarketEngine();
  const signalEngine = new SignalEngine();
  const whaleOrderEngine = new WhaleOrderEngine();
  let useMockFallback = process.env.MARKET_DATA_MODE === "mock";
  let useDepthFallback = false;
  let lastRealTradeAt = Date.now();
  let lastPersistedAt = 0;
  let latestWhaleOrders = whaleOrderEngine.getLevels();

  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.MARKET_SNAPSHOT, getCurrentSnapshot());
    socket.emit(SOCKET_EVENTS.MARKET_WHALE_ORDERS, latestWhaleOrders);
  });

  signalEngine.onAlert((alert) => {
    io.emit(SOCKET_EVENTS.MARKET_ALERT, alert);
    void options.database?.saveMarketAlert(alert);
  });

  signalEngine.onLargeTrade((largeTrade) => {
    io.emit(SOCKET_EVENTS.MARKET_LARGE_TRADE, largeTrade);
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
      if (!useDepthFallback) {
        return;
      }

      marketEngine.updateOrderBook(orderBook);
      signalEngine.processOrderBook(orderBook);
      latestWhaleOrders = whaleOrderEngine.processOrderBook(orderBook);
    },
    onStatusChange: (status) => {
      console.log(`Binance depth20 fallback ${status}`);
    },
    onError: (error) => {
      console.error(`Binance depth20 fallback error: ${error.message}`);
    },
  });
  const binanceDeepOrderBookConnector = new BinanceDeepOrderBookConnector({
    onDepth: ({ topLevels, deepLevels, eventTime }) => {
      stopDepthFallback();
      marketEngine.updateOrderBook(topLevels);
      signalEngine.processOrderBook(topLevels);
      latestWhaleOrders = whaleOrderEngine.processOrderBook(deepLevels, eventTime);
    },
    onStatusChange: (status) => {
      console.log(`Binance deep depth ${status}`);
    },
    onError: (error) => {
      console.error(`Binance deep depth error: ${error.message}`);
      startDepthFallback();
    },
  });

  if (!useMockFallback) {
    binanceConnector.connect();
    binanceDeepOrderBookConnector.connect();
  }

  const interval = setInterval(() => {
    const snapshot = getCurrentSnapshot();

    io.emit(SOCKET_EVENTS.MARKET_SNAPSHOT, snapshot);
    io.emit(SOCKET_EVENTS.MARKET_WHALE_ORDERS, latestWhaleOrders);

    if (Date.now() - lastPersistedAt >= PERSISTENCE_INTERVAL_MS) {
      lastPersistedAt = Date.now();
      void options.database?.saveMarketTick(snapshot);
    }
  }, SNAPSHOT_INTERVAL_MS);

  interval.unref();

  return io;

  function startDepthFallback() {
    if (useMockFallback || useDepthFallback) {
      return;
    }

    useDepthFallback = true;
    binanceDepthConnector.connect();
  }

  function stopDepthFallback() {
    if (!useDepthFallback) {
      return;
    }

    useDepthFallback = false;
    binanceDepthConnector.close();
  }

  function getCurrentSnapshot() {
    const hasTimedOutWaitingForRealTrades =
      !marketEngine.hasTrades() && Date.now() - lastRealTradeAt > FALLBACK_AFTER_MS;

    if (useMockFallback || hasTimedOutWaitingForRealTrades) {
      if (!useMockFallback) {
        console.warn("Using mock market fallback while Binance trades connect");
      }

      useMockFallback = true;
      const snapshot = mockMarketEngine.getSnapshot();
      latestWhaleOrders = whaleOrderEngine.processOrderBook(
        snapshot.orderBook,
        snapshot.timestamp,
      );
      return snapshot;
    }

    return marketEngine.getSnapshot();
  }
}
