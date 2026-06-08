import type { MarketAlert, MarketSnapshot } from "@orderflow/shared";
import { create } from "zustand";

type ConnectionStatus = "connecting" | "connected" | "disconnected";
const MAX_ALERTS = 100;

type MarketState = {
  connectionStatus: ConnectionStatus;
  snapshot: MarketSnapshot | null;
  alerts: MarketAlert[];
  setConnectionStatus: (connectionStatus: ConnectionStatus) => void;
  setSnapshot: (snapshot: MarketSnapshot) => void;
  addAlert: (alert: MarketAlert) => void;
};

export const useMarketStore = create<MarketState>((set) => ({
  connectionStatus: "connecting",
  snapshot: null,
  alerts: [],
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setSnapshot: (snapshot) => set({ snapshot }),
  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts].slice(0, MAX_ALERTS) })),
}));
