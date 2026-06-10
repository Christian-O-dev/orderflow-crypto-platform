import type { ChartTimeframe } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const TIMEFRAMES: ChartTimeframe[] = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
];

export function TimeframeSelector() {
  const chartTimeframe = useMarketStore((state) => state.chartTimeframe);
  const setChartTimeframe = useMarketStore((state) => state.setChartTimeframe);

  return (
    <div className="flex h-7 items-center gap-0.5 border border-white/10 bg-[#0B0E14]/85 px-1 shadow-lg shadow-black/20">
      {TIMEFRAMES.map((timeframe) => (
        <button
          key={timeframe}
          className={clsx(
            "h-5 min-w-8 px-2 text-center font-mono text-[10px] font-medium uppercase leading-5 transition-colors",
            chartTimeframe === timeframe
              ? "bg-[#2962FF] text-white"
              : "text-[#B2B5BE] hover:bg-white/[0.07] hover:text-white",
          )}
          type="button"
          onClick={() => setChartTimeframe(timeframe)}
        >
          {timeframe}
        </button>
      ))}
    </div>
  );
}
