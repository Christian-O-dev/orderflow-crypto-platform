import clsx from "clsx";
import { useMemo } from "react";
import { useMarketStore } from "../../stores/marketStore";
import type { LiquidityMapZone } from "@orderflow/shared";

const EMPTY_ZONES: LiquidityMapZone[] = [];

const priceFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const usdFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

const percentFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function LiquidityMapPanel() {
  const liquidityMapZonesByRes = useMarketStore((state) => state.liquidityMapZones);
  const resolution = useMarketStore((state) => state.liquidityMapResolution);
  const setResolution = useMarketStore((state) => state.setLiquidityMapResolution);
  const liquidityMapZones = liquidityMapZonesByRes?.[resolution] ?? EMPTY_ZONES;
  const snapshot = useMarketStore((state) => state.snapshot);
  const lastPrice = snapshot?.lastPrice ?? 0;

  const { asks, bids } = useMemo(() => {
    const activeZones = liquidityMapZones.filter(
      (z) => z.status === "active" || z.status === "weakened",
    );
    const asks = activeZones
      .filter((z) => z.side === "ask")
      .sort((a, b) => b.priceMid - a.priceMid); // Mayor precio arriba
    const bids = activeZones
      .filter((z) => z.side === "bid")
      .sort((a, b) => b.priceMid - a.priceMid); // Mayor precio arriba (cercanos al centro)
    return { asks, bids };
  }, [liquidityMapZones]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0B0E14]">
      <div className="flex items-center justify-between gap-2 border-b border-cyan-300/15 bg-cyan-300/[0.04] px-2.5 py-1.5 font-mono text-[9.5px] text-cyan-100">
        <div className="flex items-center gap-2">
          {/* Title removed, managed by UnifiedDataPanel */}
          <div className="flex gap-1 ml-2">
            {(["100", "500", "2000"] as const).map((res) => (
              <button
                key={res}
                type="button"
                className={clsx(
                  "px-1.5 py-0.5 rounded transition-colors",
                  resolution === res
                    ? "bg-cyan-500/20 text-cyan-200 font-bold"
                    : "text-cyan-400/50 hover:bg-cyan-500/10 hover:text-cyan-300"
                )}
                onClick={() => setResolution(res)}
              >
                ${res}
              </button>
            ))}
          </div>
        </div>
        <span className="shrink-0 text-[#9CA3AF]">
          {asks.length} asks / {bids.length} bids
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden font-mono text-[10px] tabular-nums">
        {/* ASKS (mitad superior) - Los elementos mas bajos (cercanos al precio) estan pegados al fondo */}
        <div className="flex flex-1 flex-col justify-end overflow-y-auto overflow-x-hidden p-2">
          <div className="flex flex-col justify-end gap-1 min-h-full">
            {asks.map((zone) => (
              <ZoneRow key={zone.id} zone={zone} />
            ))}
          </div>
        </div>

        {/* PRECIO CENTRAL FIJO */}
        {lastPrice > 0 ? (
          <div className="flex items-center justify-center border-y border-white/10 bg-white/[0.05] py-1.5 text-[11px] font-bold text-white shadow-md z-10">
            ------------- BTC {priceFormat.format(lastPrice)} -------------
          </div>
        ) : (
          <div className="h-6 border-y border-white/10 bg-white/[0.05] z-10" />
        )}

        {/* BIDS (mitad inferior) - Los elementos mas altos (cercanos al precio) estan pegados arriba */}
        <div className="flex flex-1 flex-col justify-start overflow-y-auto overflow-x-hidden p-2">
          <div className="flex flex-col justify-start gap-1 min-h-full">
            {bids.map((zone) => (
              <ZoneRow key={zone.id} zone={zone} />
            ))}
          </div>
        </div>

        {asks.length === 0 && bids.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center text-sm text-[#6B7280] pointer-events-none">
            Esperando zonas de liquidez...
          </div>
        )}
      </div>
    </div>
  );
}

function ZoneRow({ zone }: { zone: LiquidityMapZone }) {
  const isAsk = zone.side === "ask";
  const colorClass = isAsk ? "text-red-400" : "text-emerald-400";
  const label = isAsk ? "ASK" : "BID";

  const ageSeconds = Math.max(0, Math.floor(zone.durationMs / 1000));
  const ageDisplay = formatObservedAge(ageSeconds);

  // Intensity is 0 to 1
  const maxBlocks = 30;
  const barWidth = Math.max(1, Math.round(zone.intensity * maxBlocks));
  const barBlocks = "█".repeat(barWidth);
  const sign = isAsk ? "+" : "-";

  return (
    <div className="flex items-center gap-3 rounded px-1 whitespace-nowrap hover:bg-white/[0.02]">
      <span className={clsx("w-8 font-bold", colorClass)}>{label}</span>
      <span className="w-[110px] text-right text-[#E5E7EB]">
        {priceFormat.format(zone.priceStart)} - {priceFormat.format(zone.priceEnd)}
      </span>
      <span
        className={clsx(
          "w-[60px] text-right",
          isAsk ? "text-red-300/80" : "text-emerald-300/80",
        )}
      >
        {sign}
        {percentFormat.format(zone.distancePercent)}%
      </span>
      <span className="w-[50px] text-right font-bold text-amber-100">
        ${usdFormat.format(zone.notionalUsd)}
      </span>
      <span className="w-[45px] text-right text-[#6B7280]">{ageDisplay}</span>
      <span className={clsx("text-[9px] leading-none opacity-80", colorClass)}>
        {barBlocks}
      </span>
    </div>
  );
}

function formatObservedAge(ageSeconds: number) {
  if (ageSeconds < 1) {
    return "<1s";
  }

  if (ageSeconds < 60) {
    return `${ageSeconds}s`;
  }

  const minutes = Math.floor(ageSeconds / 60);
  const remainingSeconds = ageSeconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
}
