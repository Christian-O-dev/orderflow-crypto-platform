import type { CvdPoint } from "@orderflow/shared";
import {
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useWindowOrderFlow } from "../orderflow/useWindowOrderFlow";
import { useMarketStore } from "../../stores/marketStore";
import {
  createTerminalLineChart,
  observeTerminalChartSize,
  resizeTerminalChart,
  toUniqueLineData,
} from "./chartUtils";

const MAX_CVD_POINTS = 500;

export function CvdChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const latestTimeRef = useRef<Time | null>(null);
  const analysisWindow = useMarketStore((state) => state.analysisWindow);
  const windowOrderFlow = useWindowOrderFlow();
  const cvdPoints: CvdPoint[] = windowOrderFlow.cvdPoints;
  const cvd = windowOrderFlow.cvd;
  const pressureLabel = cvd >= 0 ? "Compradora" : "Vendedora";
  const pressureColor = cvd >= 0 ? "#34D399" : "#F87171";

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
    const { chart, series } = createTerminalLineChart({
      container,
      lineColor: "#34D399",
      priceLineColor: "rgba(52,211,153,0.65)",
      crosshairColor: "rgba(156,163,175,0.35)",
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

    if (!series) {
      return;
    }

    series.applyOptions({
      color: pressureColor,
      priceLineColor:
        cvd >= 0 ? "rgba(52,211,153,0.65)" : "rgba(248,113,113,0.65)",
    });
  }, [cvd, pressureColor]);

  useEffect(() => {
    const series = seriesRef.current;

    if (!series) {
      return;
    }

    const data = toUniqueLineData(cvdPoints, MAX_CVD_POINTS);
    const latestPoint = data.at(-1);

    if (!latestPoint) {
      series.setData([]);
      latestTimeRef.current = null;
      return;
    }

    if (latestTimeRef.current === null) {
      series.setData(data);
      chartRef.current?.timeScale().fitContent();
    } else {
      series.setData(data);
    }

    latestTimeRef.current = latestPoint.time;
  }, [cvdPoints]);

  return (
    <section className="flex min-h-[180px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 lg:h-full lg:min-h-0">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
            CVD Chart
          </h2>
          <p className="mt-0.5 text-[10px] text-[#6B7280]">
            Ventana {analysisWindow}: exchange history + live session
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] ${
            cvd >= 0
              ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
              : "border-red-300/20 bg-red-300/10 text-red-200"
          }`}
        >
          Presion {pressureLabel}
        </span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden p-1.5">
        <button
          aria-label="Reestablecer grafico CVD"
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
