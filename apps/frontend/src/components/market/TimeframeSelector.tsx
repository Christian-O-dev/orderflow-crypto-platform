import type { ChartTimeframe } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const TIMEFRAMES: ChartTimeframe[] = ["5s", "15s", "30s", "1m", "3m", "5m", "15m", "1h"];

export function TimeframeSelector() {
  const chartTimeframe = useMarketStore((state) => state.chartTimeframe);
  const setChartTimeframe = useMarketStore((state) => state.setChartTimeframe);

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6B7280]">
        TF
      </span>
      <div className="flex overflow-hidden border border-white/10 bg-white/[0.03]">
        {TIMEFRAMES.map((timeframe) => (
          <button
            key={timeframe}
            className={clsx(
              "h-6 min-w-8 px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
              chartTimeframe === timeframe
                ? "bg-cyan-300/15 text-cyan-100"
                : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#E5E7EB]",
            )}
            type="button"
            onClick={() => setChartTimeframe(timeframe)}
          >
            {timeframe}
          </button>
        ))}
      </div>
    </div>
  );
}
