import type {
  AnalysisWindow,
  ChartTimeframe,
  LargeTradeEvent,
  MarketAlert,
  MarketSnapshot,
  WhaleLiquidityLevel,
} from "@orderflow/shared";
import { create } from "zustand";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
const MAX_ALERTS = 100;
const MAX_LARGE_TRADES = 100;
const MAX_WHALE_ORDERS = 100;

type MarketState = {
  connectionStatus: ConnectionStatus;
  snapshot: MarketSnapshot | null;
  alerts: MarketAlert[];
  largeTrades: LargeTradeEvent[];
  whaleOrders: WhaleLiquidityLevel[];
  chartTimeframe: ChartTimeframe;
  analysisWindow: AnalysisWindow;
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  addAlert: (alert: MarketAlert) => void;
  addLargeTrade: (largeTrade: LargeTradeEvent) => void;
  setWhaleOrders: (whaleOrders: WhaleLiquidityLevel[]) => void;
  setChartTimeframe: (chartTimeframe: ChartTimeframe) => void;
  setAnalysisWindow: (analysisWindow: AnalysisWindow) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  connectionStatus: "connecting",
  snapshot: null,
  alerts: [],
  largeTrades: [],
  whaleOrders: [],
  chartTimeframe: "5s",
  analysisWindow: "1m",
  setConnectionStatus: (connectionStatus) =>
    set((state) =>
      state.connectionStatus === connectionStatus ? state : { connectionStatus },
    ),
  setSnapshot: (snapshot) => set({ snapshot }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS) })),
  addLargeTrade: (largeTrade) =>
    set((state) => {
      if (state.largeTrades.some((trade) => trade.id === largeTrade.id)) {
        return state;
      }

      return {
        largeTrades: [largeTrade, ...state.largeTrades].slice(0, MAX_LARGE_TRADES),
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
  setChartTimeframe: (chartTimeframe) =>
    set((state) =>
      state.chartTimeframe === chartTimeframe ? state : { chartTimeframe },
    ),
  setAnalysisWindow: (analysisWindow) =>
    set((state) =>
      state.analysisWindow === analysisWindow ? state : { analysisWindow },
    ),
}));

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
