import type { Exchange, MarketSymbol } from "../types/market.js";

function readNumberEnv(name: string, fallback: number) {
  const rawValue = process.env[name];

  if (rawValue === undefined) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    console.warn(`Invalid ${name}=${rawValue}; using ${fallback}`);
    return fallback;
  }

  return parsedValue;
}

export const MARKET_CONFIG = {
  exchange: "binance" as Exchange,
  symbol: "BTCUSDT" as MarketSymbol,
  realtime: {
    snapshotIntervalMs: readNumberEnv("SNAPSHOT_INTERVAL_MS", 250),
    persistenceIntervalMs: readNumberEnv("PERSISTENCE_INTERVAL_MS", 1_000),
    fallbackAfterMs: readNumberEnv("FALLBACK_AFTER_MS", 5_000),
    whaleOrdersEmitIntervalMs: readNumberEnv("WHALE_ORDERS_EMIT_INTERVAL_MS", 1_000),
    statsLogIntervalMs: readNumberEnv("MARKET_STATS_LOG_INTERVAL_MS", 30_000),
  },
  signal: {
    alertCooldownMs: readNumberEnv("ALERT_COOLDOWN_MS", 5_000),
    liquidityRemovedRatio: readNumberEnv("LIQUIDITY_REMOVED_RATIO", 0.65),
    largeTradeMediumUsd: readNumberEnv("LARGE_TRADE_MEDIUM_USD", 100_000),
    largeTradeHighUsd: readNumberEnv("LARGE_TRADE_HIGH_USD", 500_000),
    largeTradeWhaleUsd: readNumberEnv("LARGE_TRADE_WHALE_USD", 1_000_000),
    recentLargeTradeIds: readNumberEnv("RECENT_LARGE_TRADE_IDS", 500),
    cvdSpikeThreshold: readNumberEnv("CVD_SPIKE_THRESHOLD", 5),
    cvdSpikeWindowMs: readNumberEnv("CVD_SPIKE_WINDOW_MS", 5_000),
    liquidityWallThreshold: readNumberEnv("LIQUIDITY_WALL_THRESHOLD", 8),
  },
  whaleOrders: {
    thresholdUsd: readNumberEnv("WHALE_ORDER_THRESHOLD_USD", 1_000_000),
    maxTrackedLevels: readNumberEnv("MAX_TRACKED_WHALE_LEVELS", 100),
  },
  binance: {
    reconnectDelayMs: readNumberEnv("BINANCE_RECONNECT_DELAY_MS", 2_500),
    deepResyncDelayMs: readNumberEnv("BINANCE_DEEP_RESYNC_DELAY_MS", 1_000),
    snapshotTimeoutMs: readNumberEnv("BINANCE_SNAPSHOT_TIMEOUT_MS", 5_000),
    maxBufferedDepthEvents: readNumberEnv("BINANCE_MAX_BUFFERED_DEPTH_EVENTS", 1_000),
    topLevels: readNumberEnv("BINANCE_TOP_LEVELS", 20),
    maxDeepLevels: readNumberEnv("BINANCE_MAX_DEEP_LEVELS", 1_000),
    depthFallbackLevels: readNumberEnv("BINANCE_DEPTH_FALLBACK_LEVELS", 20),
  },
  frontendLimits: {
    maxWhaleOrders: readNumberEnv("MAX_WHALE_ORDERS_TO_CLIENT", 100),
  },
} as const;
