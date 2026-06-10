import type { LiquidityDepthRange } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const DEPTH_RANGES: LiquidityDepthRange[] = ["0.25%", "0.5%", "1%", "2%", "5%"];

export function DepthRangeSelector() {
  const depthRange = useMarketStore((state) => state.depthRange);
  const setDepthRange = useMarketStore((state) => state.setDepthRange);

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6B7280]">
        Depth
      </span>
      <div className="flex overflow-hidden border border-white/10 bg-white/[0.03]">
        {DEPTH_RANGES.map((range) => (
          <button
            key={range}
            className={clsx(
              "h-6 min-w-10 px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
              depthRange === range
                ? "bg-cyan-300/15 text-cyan-100"
                : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#E5E7EB]",
            )}
            type="button"
            onClick={() => setDepthRange(range)}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  );
}
