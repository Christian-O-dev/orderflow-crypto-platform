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

  return (
    <section className="grid gap-1 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-end">
      <MetricCard
        label="Last Price"
        value={snapshot ? `$${numberFormat.format(snapshot.lastPrice)}` : "--"}
        tone="cyan"
      />
      <MetricCard
        label="CVD"
        value={snapshot ? volumeFormat.format(snapshot.cvd) : "--"}
        tone={snapshot && snapshot.cvd < 0 ? "sell" : "buy"}
      />
      <MetricCard
        label="Buy Volume"
        value={snapshot ? volumeFormat.format(snapshot.buyVolume) : "--"}
        tone="buy"
      />
      <MetricCard
        label="Sell Volume"
        value={snapshot ? volumeFormat.format(snapshot.sellVolume) : "--"}
        tone="sell"
      />
    </section>
  );
}
