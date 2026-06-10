import {
  SOCKET_EVENTS,
  type LargeTradeEvent,
  type MarketAlert,
  type MarketSnapshot,
  type WhaleLiquidityLevel,
  type LiquidityMapZonesByResolution,
} from "@orderflow/shared";
import { io } from "socket.io-client";
import { useMarketStore } from "../stores/marketStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
const STRICT_MODE_DISCONNECT_DELAY_MS = 500;

type MarketSocket = ReturnType<typeof io>;

let socket: MarketSocket | null = null;
let activeConsumers = 0;
let disconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function connectMarketSocket() {
  activeConsumers += 1;

  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    disconnectTimer = null;
  }

  const currentSocket = getMarketSocket();

  if (!currentSocket.connected) {
    useMarketStore.getState().setConnectionStatus("connecting");
    currentSocket.connect();
  }

  return () => {
    activeConsumers = Math.max(0, activeConsumers - 1);

    if (activeConsumers > 0) {
      return;
    }

    disconnectTimer = setTimeout(() => {
      if (activeConsumers > 0) {
        return;
      }

      socket?.disconnect();
      socket?.removeAllListeners();
      socket = null;
      useMarketStore.getState().setConnectionStatus("disconnected");
    }, STRICT_MODE_DISCONNECT_DELAY_MS);
  };
}

function getMarketSocket() {
  if (socket) {
    return socket;
  }

  socket = io(BACKEND_URL, {
    autoConnect: false,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    useMarketStore.getState().setConnectionStatus("connected");
  });

  socket.on("disconnect", () => {
    useMarketStore.getState().setConnectionStatus("disconnected");
  });

  socket.on("connect_error", () => {
    useMarketStore.getState().setConnectionStatus("disconnected");
  });

  socket.on(SOCKET_EVENTS.MARKET_SNAPSHOT, (snapshot: MarketSnapshot) => {
    useMarketStore.getState().setSnapshot(snapshot);
  });

  socket.on(SOCKET_EVENTS.MARKET_ALERT, (alert: MarketAlert) => {
    useMarketStore.getState().addAlert(alert);
  });

  socket.on(SOCKET_EVENTS.MARKET_LARGE_TRADE, (largeTrade: LargeTradeEvent) => {
    useMarketStore.getState().addLargeTrade(largeTrade);
  });

  socket.on(SOCKET_EVENTS.MARKET_WHALE_ORDERS, (whaleOrders: WhaleLiquidityLevel[]) => {
    useMarketStore.getState().setWhaleOrders(whaleOrders);
  });

  socket.on(SOCKET_EVENTS.MARKET_LIQUIDITY_MAP, (zones: LiquidityMapZonesByResolution) => {
    useMarketStore.getState().setLiquidityMapZones(zones);
  });

  return socket;
}
