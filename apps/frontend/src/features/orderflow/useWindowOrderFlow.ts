import { useMarketStore } from "../../stores/marketStore";

export function useWindowOrderFlow() {
  return useMarketStore((state) => state.windowOrderFlowSummary);
}

export function useChartOrderFlow() {
  return useMarketStore((state) => state.chartOrderFlowSummary);
}
