import { useRef } from "react";
import type { LiquidityDepthRange } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const DEPTH_RANGES: LiquidityDepthRange[] = ["0.25%", "0.5%", "1%", "2%", "5%"];

export function DepthRangeSelector() {
  const depthRange = useMarketStore((state) => state.depthRange);
  const setDepthRange = useMarketStore((state) => state.setDepthRange);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleSelect = (range: LiquidityDepthRange) => {
    setDepthRange(range);
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6B7280]">
        Depth
      </span>
      <details ref={detailsRef} className="relative group">
        <summary className="list-none cursor-pointer flex items-center justify-between gap-1 h-6 min-w-12 px-2 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors border border-white/10 bg-white/[0.03] text-cyan-200 hover:bg-white/[0.08] rounded-sm">
          {depthRange}
          <span className="text-[7px] opacity-70">▼</span>
        </summary>
        <div className="absolute top-full right-0 mt-1 w-24 bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-1 flex flex-col gap-0.5">
          {DEPTH_RANGES.map((range) => (
            <button
              key={range}
              className={clsx(
                "text-left px-2 py-1.5 font-mono text-[10px] rounded",
                depthRange === range
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-[#D1D4DC] hover:bg-[#2A2E39]"
              )}
              type="button"
              onClick={() => handleSelect(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
