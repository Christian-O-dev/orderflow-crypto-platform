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
      <summary className="list-none cursor-pointer flex items-center justify-between gap-1 h-5 min-w-[40px] px-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors border border-white/10 bg-white/[0.03] text-amber-200 hover:bg-white/[0.08] rounded-sm">
        {analysisWindow}
        <span className="text-[6px] opacity-70">▼</span>
      </summary>
      <div className="absolute top-full right-0 mt-1 min-w-[40px] max-h-28 overflow-y-auto bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-0.5 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {ANALYSIS_WINDOWS.map((window) => (
          <button
            key={window}
            style={{ fontSize: "9px", lineHeight: "12px" }}
            className={clsx(
              "text-center px-1 py-0.5 font-mono rounded",
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
