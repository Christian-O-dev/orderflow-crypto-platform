import clsx from "clsx";
import { useState } from "react";
import { DomTable } from "./DomTable";
import { WhaleOrdersPanel } from "./WhaleOrdersPanel";
import { useMarketStore } from "../../stores/marketStore";

type LiquidityView = "dom" | "whale_orders";

const views: Array<{ id: LiquidityView; label: string }> = [
  { id: "dom", label: "DOM" },
  { id: "whale_orders", label: "Whale Orders" },
];

export function LiquidityPanel() {
  const [activeView, setActiveView] = useState<LiquidityView>("dom");
  const analysisWindow = useMarketStore((state) => state.analysisWindow);

  return (
    <section className="flex min-h-[320px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 shadow-2xl shadow-black/20 lg:h-full lg:min-h-0">
      <div className="border-b border-white/10 bg-[#0B0E14]/70 px-2.5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
              Liquidez
            </h2>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">
              {activeView === "dom"
                ? "DOM actual - Binance BTCUSDT depth20"
                : `Whale Orders por ventana - ${analysisWindow}`}
            </p>
          </div>

          <div className="flex shrink-0 overflow-hidden border border-white/10 bg-white/[0.03]">
            {views.map((view) => (
              <button
                key={view.id}
                className={clsx(
                  "h-6 px-2 font-mono text-[9px] uppercase tracking-[0.12em] transition-colors",
                  activeView === view.id
                    ? "bg-cyan-300/15 text-cyan-100"
                    : "text-[#9CA3AF] hover:bg-white/[0.04] hover:text-[#E5E7EB]",
                )}
                type="button"
                onClick={() => setActiveView(view.id)}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeView === "dom" ? <DomTable framed={false} /> : <WhaleOrdersPanel />}
    </section>
  );
}
