import {
  SOCKET_EVENTS,
  type MarketAlert,
  type MarketSnapshot,
} from "@orderflow/shared";
import { io } from "socket.io-client";
import { useMarketStore } from "../stores/marketStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export function connectMarketSocket() {
  const socket = io(BACKEND_URL, {
    transports: ["websocket"],
  });

  const { setConnectionStatus, setSnapshot } = useMarketStore.getState();

  setConnectionStatus("connecting");

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
    setSnapshot(snapshot);
  });

  socket.on(SOCKET_EVENTS.MARKET_ALERT, (alert: MarketAlert) => {
    useMarketStore.getState().addAlert(alert);
  });

  return () => {
    socket.disconnect();
    setConnectionStatus("disconnected");
  };
}
