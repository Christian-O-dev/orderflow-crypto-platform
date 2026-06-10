import type {
  AnalysisWindow,
  ChartTimeframe,
  HistoricalAggTrade,
  LargeTradeEvent,
  LiquidityDepthRange,
  MarketAlert,
  MarketSnapshot,
  NormalizedTrade,
  WhaleLiquidityLevel,
  LiquidityMapZone,
  LiquidityMapResolution,
  LiquidityMapZonesByResolution,
} from "@orderflow/shared";
import { create } from "zustand";
import {
  calculateWindowOrderFlow,
  EMPTY_WINDOW_ORDER_FLOW_SUMMARY,
  type WindowOrderFlowSummary,
} from "../features/orderflow/windowCalculations";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
type HistoricalAggTradesStatus = "idle" | "loading" | "ready" | "error";
const MAX_ALERTS = 100;
const MAX_LARGE_TRADES = 100;
const MAX_WHALE_ORDERS = 500;
const MAX_HISTORICAL_AGG_TRADES = 5000;
const MAX_LIVE_SESSION_TRADES = 5000;

type MarketState = {
  connectionStatus: ConnectionStatus;
  snapshot: MarketSnapshot | null;
  liveSessionTrades: NormalizedTrade[];
  windowOrderFlowSummary: WindowOrderFlowSummary;
  alerts: MarketAlert[];
  largeTrades: LargeTradeEvent[];
  whaleOrders: WhaleLiquidityLevel[];
  liquidityMapZones: LiquidityMapZonesByResolution;
  liquidityMapResolution: LiquidityMapResolution;
  historicalAggTrades: HistoricalAggTrade[];
  historicalAggTradesStatus: HistoricalAggTradesStatus;
  historicalAggTradesError: string | null;
  chartTimeframe: ChartTimeframe;
  analysisWindow: AnalysisWindow;
  depthRange: LiquidityDepthRange;
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  addAlert: (alert: MarketAlert) => void;
  addLargeTrade: (largeTrade: LargeTradeEvent) => void;
  setWhaleOrders: (whaleOrders: WhaleLiquidityLevel[]) => void;
  setLiquidityMapZones: (zonesByRes: LiquidityMapZonesByResolution) => void;
  setLiquidityMapResolution: (res: LiquidityMapResolution) => void;
  setHistoricalAggTradesLoading: () => void;
  setHistoricalAggTrades: (trades: HistoricalAggTrade[]) => void;
  setHistoricalAggTradesError: (error: string) => void;
  setChartTimeframe: (chartTimeframe: ChartTimeframe) => void;
  setAnalysisWindow: (analysisWindow: AnalysisWindow) => void;
  setDepthRange: (depthRange: LiquidityDepthRange) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  connectionStatus: "connecting",
  snapshot: null,
  liveSessionTrades: [],
  windowOrderFlowSummary: EMPTY_WINDOW_ORDER_FLOW_SUMMARY,
  alerts: [],
  largeTrades: [],
  whaleOrders: [],
  liquidityMapZones: { "100": [], "500": [], "2000": [] },
  liquidityMapResolution: "100",
  historicalAggTrades: [],
  historicalAggTradesStatus: "idle",
  historicalAggTradesError: null,
  chartTimeframe: "1m",
  analysisWindow: "15m",
  depthRange: "1%",
  setConnectionStatus: (connectionStatus) =>
    set((state) =>
      state.connectionStatus === connectionStatus ? state : { connectionStatus },
    ),
  setSnapshot: (snapshot) =>
    set((state) => {
      const liveSessionTrades = mergeLiveSessionTrades(
        state.liveSessionTrades,
        snapshot.trades,
        snapshot.timestamp,
      );

      return {
        snapshot,
        liveSessionTrades,
        windowOrderFlowSummary: getWindowOrderFlowSummary(state, {
          snapshot,
          liveSessionTrades,
        }),
      };
    }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS) })),
  addLargeTrade: (largeTrade) =>
    set((state) => {
      if (state.largeTrades.some((trade) => trade.id === largeTrade.id)) {
        return state;
      }
      const largeTrades = [largeTrade, ...state.largeTrades].slice(
        0,
        MAX_LARGE_TRADES,
      );

      return {
        largeTrades,
        windowOrderFlowSummary: getWindowOrderFlowSummary(state, {
          largeTrades,
        }),
      };
    }),
  setWhaleOrders: (whaleOrders) =>
    set((state) => {
      const nextWhaleOrders = whaleOrders.slice(0, MAX_WHALE_ORDERS);

      if (
        getWhaleOrdersSignature(state.whaleOrders) ===
        getWhaleOrdersSignature(nextWhaleOrders)
      ) {
        return state;
      }

      return { whaleOrders: nextWhaleOrders };
    }),
  setLiquidityMapZones: (zonesByRes) =>
    set((state) => {
      const currentSignature =
        getLiquidityMapSignature(state.liquidityMapZones["100"]) +
        getLiquidityMapSignature(state.liquidityMapZones["500"]) +
        getLiquidityMapSignature(state.liquidityMapZones["2000"]);
      const nextSignature =
        getLiquidityMapSignature(zonesByRes["100"]) +
        getLiquidityMapSignature(zonesByRes["500"]) +
        getLiquidityMapSignature(zonesByRes["2000"]);

      if (currentSignature === nextSignature) {
        return state;
      }

      return { liquidityMapZones: zonesByRes };
    }),
  setLiquidityMapResolution: (res) => set({ liquidityMapResolution: res }),
  setHistoricalAggTradesLoading: () =>
    set({
      historicalAggTradesStatus: "loading",
      historicalAggTradesError: null,
    }),
  setHistoricalAggTrades: (trades) =>
    set((state) => {
      const historicalAggTrades = trades.slice(0, MAX_HISTORICAL_AGG_TRADES);

      return {
        historicalAggTrades,
        historicalAggTradesStatus: "ready",
        historicalAggTradesError: null,
        windowOrderFlowSummary: getWindowOrderFlowSummary(state, {
          historicalAggTrades,
        }),
      };
    }),
  setHistoricalAggTradesError: (error) =>
    set((state) => ({
      historicalAggTrades: [],
      historicalAggTradesStatus: "error",
      historicalAggTradesError: error,
      windowOrderFlowSummary: getWindowOrderFlowSummary(state, {
        historicalAggTrades: [],
      }),
    })),
  setChartTimeframe: (chartTimeframe) =>
    set((state) =>
      state.chartTimeframe === chartTimeframe ? state : { chartTimeframe },
    ),
  setAnalysisWindow: (analysisWindow) =>
    set((state) =>
      state.analysisWindow === analysisWindow
        ? state
        : {
            analysisWindow,
            windowOrderFlowSummary: getWindowOrderFlowSummary(state, {
              analysisWindow,
            }),
          },
    ),
  setDepthRange: (depthRange) =>
    set((state) => (state.depthRange === depthRange ? state : { depthRange })),
}));

function getWindowOrderFlowSummary(
  state: MarketState,
  overrides: {
    snapshot?: MarketSnapshot | null;
    historicalAggTrades?: HistoricalAggTrade[];
    liveSessionTrades?: NormalizedTrade[];
    largeTrades?: LargeTradeEvent[];
    analysisWindow?: AnalysisWindow;
  } = {},
) {
  const snapshot = overrides.snapshot ?? state.snapshot;
  const historicalTrades = overrides.historicalAggTrades ?? state.historicalAggTrades;
  const liveTrades = overrides.liveSessionTrades ?? state.liveSessionTrades;
  const liveLargeTrades = overrides.largeTrades ?? state.largeTrades;
  const analysisWindow = overrides.analysisWindow ?? state.analysisWindow;

  if (!snapshot && historicalTrades.length === 0 && liveTrades.length === 0) {
    return EMPTY_WINDOW_ORDER_FLOW_SUMMARY;
  }

  return calculateWindowOrderFlow({
    historicalTrades,
    liveTrades,
    liveLargeTrades,
    analysisWindow,
    now: snapshot?.timestamp ?? Date.now(),
  });
}

function mergeLiveSessionTrades(
  currentTrades: NormalizedTrade[],
  snapshotTrades: NormalizedTrade[],
  now: number,
) {
  const oldestAllowedTimestamp = now - 4 * 60 * 60 * 1000;
  const tradesById = new Map<string, NormalizedTrade>();

  for (const trade of currentTrades) {
    if (trade.timestamp >= oldestAllowedTimestamp) {
      tradesById.set(getLiveTradeKey(trade), trade);
    }
  }

  for (const trade of snapshotTrades) {
    if (trade.timestamp >= oldestAllowedTimestamp) {
      tradesById.set(getLiveTradeKey(trade), trade);
    }
  }

  return Array.from(tradesById.values())
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, MAX_LIVE_SESSION_TRADES);
}

function getLiveTradeKey(trade: NormalizedTrade) {
  return `${trade.exchange}:${trade.symbol}:${trade.tradeId}`;
}

function getWhaleOrdersSignature(whaleOrders: WhaleLiquidityLevel[]) {
  return whaleOrders
    .map((level) =>
      [
        level.id,
        level.status,
        level.quantity.toFixed(8),
        level.durationMs,
        Math.round(level.notionalUsd),
      ].join(":"),
    )
    .join("|");
}

function getLiquidityMapSignature(zones: LiquidityMapZone[]) {
  return zones
    .map((zone) =>
      [
        zone.id,
        zone.status,
        zone.quantity.toFixed(8),
        zone.durationMs,
        Math.round(zone.notionalUsd),
      ].join(":"),
    )
    .join("|");
}
