import { AnalysisWindowSelector } from "./AnalysisWindowSelector";
import { ConnectionStatus } from "./ConnectionStatus";
import { useMarketStore } from "../../stores/marketStore";
import { MarketOverview } from "./MarketOverview";

export function MarketHeader() {
  const snapshot = useMarketStore((state) => state.snapshot);

  return (
    <header className="border border-white/10 bg-[#0B0E14]/90 px-2 py-1 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300">
            Order Flow Terminal
          </p>
          <h1 className="font-mono text-base font-semibold tracking-tight text-white">
            {snapshot?.symbol ?? "BTCUSDT"}
          </h1>
          <span className="font-mono text-[9px] uppercase text-[#9CA3AF]">
            {snapshot?.exchange ?? "binance"} trade feed
          </span>
          <ConnectionStatus />
        </div>

        <div className="flex flex-col gap-1 lg:items-end">
          <div className="flex flex-wrap items-center justify-start gap-1.5 lg:justify-end">
            <AnalysisWindowSelector />
          </div>
          <MarketOverview />
        </div>
      </div>
    </header>
  );
}
