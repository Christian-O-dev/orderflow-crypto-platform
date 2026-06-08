import { ConnectionStatus } from "./ConnectionStatus";
import { useMarketStore } from "../../stores/marketStore";
import { MarketOverview } from "./MarketOverview";

export function MarketHeader() {
  const snapshot = useMarketStore((state) => state.snapshot);

  return (
    <header className="border border-white/10 bg-[#0B0E14]/90 px-2.5 py-1.5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="flex flex-col gap-1.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-300">
            Order Flow Terminal
          </p>
          <h1 className="font-mono text-lg font-semibold tracking-tight text-white">
            {snapshot?.symbol ?? "BTCUSDT"}
          </h1>
          <span className="font-mono text-[10px] uppercase text-[#9CA3AF]">
            {snapshot?.exchange ?? "binance"} trade feed
          </span>
          <ConnectionStatus />
        </div>

        <MarketOverview />
      </div>
    </header>
  );
}
