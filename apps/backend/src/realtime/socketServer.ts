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
import { MARKET_CONFIG } from "../config/marketConfig.js";

const VITE_DEV_ORIGINS = [/^http:\/\/localhost:517\d+$/, /^http:\/\/127\.0\.0\.1:517\d+$/];
const { realtime } = MARKET_CONFIG;

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
  let lastWhaleOrdersEmittedAt = 0;
  let lastWhaleOrdersSignature = "";
  let largeTradesEmittedSinceLog = 0;
  let latestWhaleOrders = whaleOrderEngine.getLevels();

  io.on("connection", (socket) => {
    socket.emit(SOCKET_EVENTS.MARKET_SNAPSHOT, getCurrentSnapshot());
    socket.emit(
      SOCKET_EVENTS.MARKET_WHALE_ORDERS,
      latestWhaleOrders.slice(0, MARKET_CONFIG.frontendLimits.maxWhaleOrders),
    );
  });

  signalEngine.onAlert((alert) => {
    io.emit(SOCKET_EVENTS.MARKET_ALERT, alert);
    void options.database?.saveMarketAlert(alert);
  });

  signalEngine.onLargeTrade((largeTrade) => {
    largeTradesEmittedSinceLog += 1;
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
      logStatusChange("Binance trades", status);
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
      logStatusChange("Binance depth20 fallback", status);
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
      logStatusChange("Binance deep depth", status);
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
    emitWhaleOrdersIfNeeded();

    if (Date.now() - lastPersistedAt >= realtime.persistenceIntervalMs) {
      lastPersistedAt = Date.now();
      void options.database?.saveMarketTick(snapshot);
    }
  }, realtime.snapshotIntervalMs);

  interval.unref();

  const statsInterval = setInterval(() => {
    const activeWhaleOrders = latestWhaleOrders.filter(
      (level) => level.status === "active",
    ).length;

    console.log(
      [
        "Market stats",
        `clients=${io.engine.clientsCount}`,
        `fallback=${useMockFallback ? "mock" : useDepthFallback ? "depth20" : "live"}`,
        `whales=${activeWhaleOrders}/${latestWhaleOrders.length}`,
        `largeTrades=${largeTradesEmittedSinceLog}`,
      ].join(" "),
    );
    largeTradesEmittedSinceLog = 0;
  }, realtime.statsLogIntervalMs);

  statsInterval.unref();

  return io;

  function startDepthFallback() {
    if (useMockFallback || useDepthFallback) {
      return;
    }

    useDepthFallback = true;
    console.warn("Starting Binance depth20 fallback after deep depth issue");
    binanceDepthConnector.connect();
  }

  function stopDepthFallback() {
    if (!useDepthFallback) {
      return;
    }

    useDepthFallback = false;
    console.log("Stopping Binance depth20 fallback; deep depth recovered");
    binanceDepthConnector.close();
  }

  function getCurrentSnapshot() {
    const hasTimedOutWaitingForRealTrades =
      !marketEngine.hasTrades() && Date.now() - lastRealTradeAt > realtime.fallbackAfterMs;

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

  function emitWhaleOrdersIfNeeded() {
    const now = Date.now();
    const signature = createWhaleOrdersSignature(latestWhaleOrders);
    const signatureChanged = signature !== lastWhaleOrdersSignature;
    const shouldRefreshDurations =
      now - lastWhaleOrdersEmittedAt >= realtime.whaleOrdersEmitIntervalMs;

    if (!signatureChanged && !shouldRefreshDurations) {
      return;
    }

    lastWhaleOrdersSignature = signature;
    lastWhaleOrdersEmittedAt = now;
    io.emit(
      SOCKET_EVENTS.MARKET_WHALE_ORDERS,
      latestWhaleOrders.slice(0, MARKET_CONFIG.frontendLimits.maxWhaleOrders),
    );
  }
}

const lastStatusByLabel = new Map<string, string>();

function logStatusChange(label: string, status: string) {
  if (lastStatusByLabel.get(label) === status) {
    return;
  }

  lastStatusByLabel.set(label, status);
  console.log(`${label} ${status}`);
}

function createWhaleOrdersSignature(
  whaleOrders: ReturnType<WhaleOrderEngine["getLevels"]>,
) {
  return whaleOrders
    .slice(0, MARKET_CONFIG.frontendLimits.maxWhaleOrders)
    .map((level) =>
      [
        level.id,
        level.status,
        level.quantity.toFixed(8),
        Math.round(level.notionalUsd),
      ].join(":"),
    )
    .join("|");
}
