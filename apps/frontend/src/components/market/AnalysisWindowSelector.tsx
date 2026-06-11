import { useRef } from "react";
import type { AnalysisWindow } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const ANALYSIS_WINDOWS: AnalysisWindow[] = [
  "1m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d"
];

export function AnalysisWindowSelector() {
  const analysisWindow = useMarketStore((state) => state.analysisWindow);
  const setAnalysisWindow = useMarketStore((state) => state.setAnalysisWindow);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleSelect = (window: AnalysisWindow) => {
    setAnalysisWindow(window);
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  return (
    <details ref={detailsRef} className="relative group">
      <summary className="list-none cursor-pointer flex items-center justify-between gap-1 h-6 min-w-12 px-2 font-mono text-[12px] uppercase tracking-[0.08em] transition-colors border border-white/10 bg-white/[0.03] text-amber-200 hover:bg-white/[0.08] rounded-sm">
        {analysisWindow}
        <span className="text-[7px] opacity-70">▼</span>
      </summary>
      <div className="absolute top-full left-0 mt-1 w-24 max-h-64 overflow-y-auto bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-1 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {ANALYSIS_WINDOWS.map((window) => (
          <button
            key={window}
            className={clsx(
              "text-left px-2 py-1.5 font-mono text-[10px] rounded",
              analysisWindow === window
                ? "bg-amber-500/20 text-amber-200"
                : "text-[#D1D4DC] hover:bg-[#2A2E39]"
            )}
            type="button"
            onClick={() => handleSelect(window)}
          >
            {window}
          </button>
        ))}
      </div>
    </details>
  );
}
