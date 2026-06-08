import type { PricePoint } from "@orderflow/shared";
import {
  CandlestickSeries,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useMarketStore } from "../../stores/marketStore";
import { createTerminalChart } from "./chartUtils";

const EMPTY_PRICE_POINTS: PricePoint[] = [];
const CANDLE_INTERVAL_SECONDS = 5;

export function PriceChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const latestTimeRef = useRef<Time | null>(null);
  const pricePoints = useMarketStore(
    (state) => state.snapshot?.pricePoints ?? EMPTY_PRICE_POINTS,
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const chart = createTerminalChart({
      container: containerRef.current,
      crosshairColor: "rgba(34,211,238,0.35)",
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34D399",
      downColor: "#F87171",
      borderUpColor: "#34D399",
      borderDownColor: "#F87171",
      wickUpColor: "#6EE7B7",
      wickDownColor: "#FCA5A5",
      priceLineColor: "rgba(34,211,238,0.65)",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      latestTimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;

    if (!series || pricePoints.length === 0) {
      return;
    }

    const data = toCandlestickData(pricePoints);
    const latestPoint = data.at(-1);

    if (!latestPoint) {
      return;
    }

    if (latestTimeRef.current === null) {
      series.setData(data);
      chartRef.current?.timeScale().fitContent();
    } else {
      series.update(latestPoint);
    }

    latestTimeRef.current = latestPoint.time;
  }, [pricePoints]);

  return (
    <section className="border border-white/10 bg-[#111827]/90">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
            BTC Price
          </h2>
          <p className="mt-0.5 text-[10px] text-[#6B7280]">
            Velas japonesas sinteticas desde price feed
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-cyan-200">
          {CANDLE_INTERVAL_SECONDS}s candles
        </span>
      </div>

      <div className="h-[250px] p-1.5 lg:h-[43vh]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </section>
  );
}

function toCandlestickData(points: PricePoint[]): CandlestickData<Time>[] {
  const candles = new Map<number, CandlestickData<Time>>();

  for (const point of points) {
    const bucketTime =
      Math.floor(point.time / CANDLE_INTERVAL_SECONDS) * CANDLE_INTERVAL_SECONDS;
    const existingCandle = candles.get(bucketTime);

    if (!existingCandle) {
      candles.set(bucketTime, {
        time: bucketTime as Time,
        open: point.value,
        high: point.value,
        low: point.value,
        close: point.value,
      });
      continue;
    }

    existingCandle.high = Math.max(existingCandle.high, point.value);
    existingCandle.low = Math.min(existingCandle.low, point.value);
    existingCandle.close = point.value;
  }

  return Array.from(candles.values());
}
