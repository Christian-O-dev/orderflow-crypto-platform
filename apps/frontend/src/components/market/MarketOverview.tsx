import { useWindowOrderFlow } from "../../features/orderflow/useWindowOrderFlow";
import { useMarketStore } from "../../stores/marketStore";
import { MetricCard } from "./MetricCard";

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const volumeFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
});

export function MarketOverview() {
  const snapshot = useMarketStore((state) => state.snapshot);
  const windowOrderFlow = useWindowOrderFlow();

  return (
    <section className="grid gap-1 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-end">
      <MetricCard
        label="Last Price"
        value={snapshot ? `$${numberFormat.format(snapshot.lastPrice)}` : "--"}
        tone="cyan"
      />
      <MetricCard
        label="CVD"
        value={volumeFormat.format(windowOrderFlow.cvd)}
        tone={windowOrderFlow.cvd < 0 ? "sell" : "buy"}
      />
      <MetricCard
        label="Buy Volume"
        value={volumeFormat.format(windowOrderFlow.buyVolume)}
        tone="buy"
      />
      <MetricCard
        label="Sell Volume"
        value={volumeFormat.format(windowOrderFlow.sellVolume)}
        tone="sell"
      />
    </section>
  );
}
