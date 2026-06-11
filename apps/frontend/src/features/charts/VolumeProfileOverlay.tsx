import { useEffect, useMemo, useRef, useState } from "react";
import { useMarketStore } from "../../stores/marketStore";
import { getCombinedWindowTrades } from "../orderflow/windowCalculations";
import { calculateVolumeProfile } from "../orderflow/volumeProfileCalculations";
import { getChartAnalysisWindow } from "../orderflow/windowCalculations";
import type { ISeriesApi } from "lightweight-charts";
import clsx from "clsx";

export function VolumeProfileOverlay({
  series,
  tickSize,
}: {
  series: ISeriesApi<"Candlestick">;
  tickSize: number;
}) {
  const historicalTrades = useMarketStore((state) => state.historicalAggTrades);
  const liveTrades = useMarketStore((state) => state.liveSessionTrades);
  const chartTimeframe = useMarketStore((state) => state.chartTimeframe);
  const now = useMarketStore((state) => state.snapshot?.timestamp ?? Date.now());

  const profile = useMemo(() => {
    const windowToUse = getChartAnalysisWindow(chartTimeframe);
    const { combinedTrades } = getCombinedWindowTrades({
      historicalTrades,
      liveTrades,
      analysisWindow: windowToUse,
      now,
    });
    return calculateVolumeProfile(combinedTrades, tickSize);
  }, [historicalTrades, liveTrades, chartTimeframe, now, tickSize]);

  const maxTotalVolume = useMemo(() => {
    return profile.reduce((max, level) => Math.max(max, level.totalVolume), 0);
  }, [profile]);

  const [, forceRender] = useState({});
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Continuously sync DOM overlay with the Canvas price scale
    const syncPositions = () => {
      forceRender({});
      rafRef.current = requestAnimationFrame(syncPositions);
    };
    
    rafRef.current = requestAnimationFrame(syncPositions);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (profile.length === 0 || maxTotalVolume === 0) return null;

  return (
    <div className="absolute top-0 bottom-0 left-0 w-32 pointer-events-none z-10 overflow-hidden">
      {profile.map((level) => {
        const y = series.priceToCoordinate(level.price);
        if (y === null) return null;
        
        // optimization: skip rendering if totally off screen vertically
        if (y < -100 || y > 2000) return null;

        const yTop = series.priceToCoordinate(level.price + tickSize / 2);
        const yBottom = series.priceToCoordinate(level.price - tickSize / 2);
        let height = yBottom !== null && yTop !== null ? Math.abs(yBottom - yTop) : 4;
        height = Math.max(height, 2);

        const totalPercent = (level.totalVolume / maxTotalVolume) * 100;
        const sellRatio = level.sellVolume / level.totalVolume;
        const buyRatio = level.buyVolume / level.totalVolume;

        return (
          <div
            key={level.price}
            className={clsx(
              "absolute left-0 flex items-center shadow-[0_0_2px_rgba(0,0,0,0.5)]",
              level.isPoc && "border-r-2 border-r-cyan-400 z-20 bg-white/10"
            )}
            style={{
              top: y - height / 2,
              height: height,
              width: `${Math.max(totalPercent, 1)}%`,
            }}
          >
            <div 
              className="h-full bg-red-500/50" 
              style={{ width: `${sellRatio * 100}%` }}
            />
            <div 
              className="h-full bg-emerald-500/50" 
              style={{ width: `${buyRatio * 100}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}
