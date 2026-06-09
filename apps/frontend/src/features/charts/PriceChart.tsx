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
import {
  createTerminalChart,
  observeTerminalChartSize,
  resizeTerminalChart,
} from "./chartUtils";

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

  function resetChartView() {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;

    if (!chart || !series || !container) {
      return;
    }

    resizeTerminalChart(container, chart);
    series.priceScale().setAutoScale(true);
    chart.timeScale().fitContent();
  }

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const container = containerRef.current;
    const chart = createTerminalChart({
      container,
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
    const stopResizing = observeTerminalChartSize(container, chart);

    return () => {
      stopResizing();
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
    <section className="flex min-h-[280px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 lg:h-full lg:min-h-0">
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

      <div className="relative min-h-0 flex-1 overflow-hidden p-1.5">
        <button
          aria-label="Reestablecer grafico de precio"
          className="absolute bottom-3 right-3 z-10 grid h-7 w-7 place-items-center border border-white/10 bg-[#0B0E14]/85 text-[#D1D5DB] shadow-2xl shadow-black/30 transition hover:border-cyan-300/30 hover:bg-[#111827] hover:text-cyan-200"
          title="Reestablecer grafico"
          type="button"
          onClick={resetChartView}
        >
          <span className="text-[20px] leading-none" aria-hidden="true">
            ↻
          </span>
        </button>
        <div ref={containerRef} className="h-full w-full overflow-hidden" />
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
