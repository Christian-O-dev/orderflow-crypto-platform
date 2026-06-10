import type { HistoricalAggTrade } from "@orderflow/shared";
import { useEffect } from "react";
import { useMarketStore } from "../stores/marketStore";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";

export function useHistoricalAggTrades() {
  const analysisWindow = useMarketStore((state) => state.analysisWindow);
  const setHistoricalAggTradesLoading = useMarketStore(
    (state) => state.setHistoricalAggTradesLoading,
  );
  const setHistoricalAggTrades = useMarketStore(
    (state) => state.setHistoricalAggTrades,
  );
  const setHistoricalAggTradesError = useMarketStore(
    (state) => state.setHistoricalAggTradesError,
  );

  useEffect(() => {
    const controller = new AbortController();
    const url = new URL(`${BACKEND_URL}/api/market/agg-trades`);
    url.searchParams.set("symbol", "BTCUSDT");
    url.searchParams.set("window", analysisWindow);

    setHistoricalAggTradesLoading();

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`AggTrades request failed with ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isHistoricalAggTradesResponse(payload)) {
          throw new Error("Invalid historical aggregate trades response");
        }

        setHistoricalAggTrades(payload.trades);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setHistoricalAggTradesError(
          error instanceof Error
            ? error.message
            : "Unable to load historical aggregate trades",
        );
      });

    return () => {
      controller.abort();
    };
  }, [
    analysisWindow,
    setHistoricalAggTrades,
    setHistoricalAggTradesError,
    setHistoricalAggTradesLoading,
  ]);
}

function isHistoricalAggTradesResponse(
  value: unknown,
): value is { trades: HistoricalAggTrade[] } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;

  return Array.isArray(response.trades);
}
