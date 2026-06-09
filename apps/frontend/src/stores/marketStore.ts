import type {
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
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  addAlert: (alert: MarketAlert) => void;
  addLargeTrade: (largeTrade: LargeTradeEvent) => void;
  setWhaleOrders: (whaleOrders: WhaleLiquidityLevel[]) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  connectionStatus: "connecting",
  snapshot: null,
  alerts: [],
  largeTrades: [],
  whaleOrders: [],
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSnapshot: (snapshot) => set({ snapshot }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS) })),
  addLargeTrade: (largeTrade) =>
    set((state) => ({
      largeTrades: [largeTrade, ...state.largeTrades].slice(0, MAX_LARGE_TRADES),
    })),
  setWhaleOrders: (whaleOrders) =>
    set({ whaleOrders: whaleOrders.slice(0, MAX_WHALE_ORDERS) }),
}));
