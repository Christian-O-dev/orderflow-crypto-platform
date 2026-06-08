import type { NormalizedTrade } from "../types/market.js";

type BinanceTradeMessage = {
  e: "trade";
  E: number;
  s: string;
  t: number;
  p: string;
  q: string;
  T: number;
  m: boolean;
};

export function normalizeBinanceTrade(
  message: BinanceTradeMessage,
): NormalizedTrade {
  return {
    exchange: "binance",
    symbol: "BTCUSDT",
    tradeId: String(message.t),
    price: Number(message.p),
    quantity: Number(message.q),
    side: message.m ? "sell" : "buy",
    timestamp: message.T,
  };
}

export function isBinanceTradeMessage(
  value: unknown,
): value is BinanceTradeMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const message = value as Record<string, unknown>;

  return (
    message.e === "trade" &&
    message.s === "BTCUSDT" &&
    typeof message.t === "number" &&
    typeof message.p === "string" &&
    typeof message.q === "string" &&
    typeof message.T === "number" &&
    typeof message.m === "boolean"
  );
}

