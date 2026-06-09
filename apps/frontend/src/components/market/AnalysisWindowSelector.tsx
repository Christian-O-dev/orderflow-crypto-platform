import type { AnalysisWindow } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const ANALYSIS_WINDOWS: AnalysisWindow[] = ["30s", "1m", "5m", "15m", "1h", "4h"];

export function AnalysisWindowSelector() {
  const analysisWindow = useMarketStore((state) => state.analysisWindow);
  const setAnalysisWindow = useMarketStore((state) => state.setAnalysisWindow);

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6B7280]">
        Window
      </span>
      <div className="flex overflow-hidden border border-white/10 bg-white/[0.03]">
        {ANALYSIS_WINDOWS.map((window) => (
          <button
            key={window}
            className={clsx(
              "h-6 min-w-8 px-1.5 font-mono text-[9px] uppercase tracking-[0.08em] transition-colors",
              analysisWindow === window
                ? "bg-amber-300/15 text-amber-100"
                : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#E5E7EB]",
            )}
            type="button"
            onClick={() => setAnalysisWindow(window)}
          >
            {window}
          </button>
        ))}
      </div>
    </div>
  );
}
