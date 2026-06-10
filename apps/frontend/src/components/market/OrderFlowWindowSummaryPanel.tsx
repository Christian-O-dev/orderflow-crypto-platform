import { useMarketStore } from "../../stores/marketStore";
import clsx from "clsx";

const usdFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  notation: "compact",
});

const volumeFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function OrderFlowWindowSummaryPanel() {
  const summary = useMarketStore((state) => state.windowOrderFlowSummary);

  return (
    <div className="flex flex-col gap-2 bg-[#0B0E14] border-b border-white/10 px-4 py-3">
      <div className="flex items-center gap-2">
        <div
          className={clsx(
            "h-2 w-2 rounded-full",
            summary.marketBias === "bullish" && "bg-emerald-500",
            summary.marketBias === "bearish" && "bg-red-500",
            summary.marketBias === "mixed" && "bg-amber-500",
            summary.marketBias === "neutral" && "bg-slate-500"
          )}
        />
        <span
          className={clsx(
            "text-sm font-medium",
            summary.marketBias === "bullish" && "text-emerald-400",
            summary.marketBias === "bearish" && "text-red-400",
            summary.marketBias === "mixed" && "text-amber-400",
            summary.marketBias === "neutral" && "text-slate-400"
          )}
        >
          {summary.message}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3 mt-2">
        <SummaryCard title="Window" value={summary.analysisWindow} />
        <SummaryCard 
          title="Delta" 
          value={volumeFormat.format(summary.delta)} 
          isPositive={summary.delta > 0} 
          isNegative={summary.delta < 0} 
        />
        <SummaryCard 
          title="CVD" 
          value={volumeFormat.format(summary.cvd)} 
          isPositive={summary.cvd > 0} 
          isNegative={summary.cvd < 0} 
        />
        <SummaryCard 
          title="Large Trades" 
          value={`${summary.largeTradesCount} ($${usdFormat.format(summary.largeTradesUsd)})`} 
        />
        <SummaryCard 
          title="Bid Liquidity" 
          value={`$${usdFormat.format(summary.activeBidLiquidityUsd)}`} 
          className="text-emerald-400"
        />
        <SummaryCard 
          title="Ask Liquidity" 
          value={`$${usdFormat.format(summary.activeAskLiquidityUsd)}`} 
          className="text-red-400"
        />
        <SummaryCard 
          title="Nearest Bid Wall" 
          value={summary.nearestBidWhalePrice ? priceFormat.format(summary.nearestBidWhalePrice) : "-"} 
          className="text-emerald-400"
        />
        <SummaryCard 
          title="Nearest Ask Wall" 
          value={summary.nearestAskWhalePrice ? priceFormat.format(summary.nearestAskWhalePrice) : "-"} 
          className="text-red-400"
        />
        <SummaryCard 
          title="Bias" 
          value={summary.marketBias.toUpperCase()} 
          className={clsx(
            summary.marketBias === "bullish" && "text-emerald-400",
            summary.marketBias === "bearish" && "text-red-400",
            summary.marketBias === "mixed" && "text-amber-400",
            summary.marketBias === "neutral" && "text-slate-400"
          )}
        />
      </div>
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  isPositive, 
  isNegative,
  className 
}: { 
  title: string; 
  value: string | number; 
  isPositive?: boolean; 
  isNegative?: boolean;
  className?: string;
}) {
  return (
    <div className="flex flex-col bg-white/[0.02] border border-white/[0.05] rounded p-2">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{title}</span>
      <span className={clsx(
        "font-mono text-sm mt-1",
        isPositive && "text-emerald-400",
        isNegative && "text-red-400",
        !isPositive && !isNegative && !className && "text-slate-200",
        className
      )}>
        {value}
      </span>
    </div>
  );
}
