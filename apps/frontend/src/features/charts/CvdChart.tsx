import type { CvdPoint } from "@orderflow/shared";
import {
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";
import { useMarketStore } from "../../stores/marketStore";
import { createTerminalLineChart, toUniqueLineData } from "./chartUtils";

const EMPTY_CVD_POINTS: CvdPoint[] = [];
const MAX_CVD_POINTS = 500;

export function CvdChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const latestTimeRef = useRef<Time | null>(null);
  const cvdPoints = useMarketStore(
    (state) => state.snapshot?.cvdPoints ?? EMPTY_CVD_POINTS,
  );
  const cvd = useMarketStore((state) => state.snapshot?.cvd ?? 0);
  const pressureLabel = cvd >= 0 ? "Compradora" : "Vendedora";
  const pressureColor = cvd >= 0 ? "#34D399" : "#F87171";

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const { chart, series } = createTerminalLineChart({
      container: containerRef.current,
      lineColor: "#34D399",
      priceLineColor: "rgba(52,211,153,0.65)",
      crosshairColor: "rgba(156,163,175,0.35)",
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

    if (!series || cvdPoints.length === 0) {
      return;
    }

    const data = toUniqueLineData(cvdPoints, MAX_CVD_POINTS);
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
  }, [cvdPoints]);

  return (
    <section className="border border-white/10 bg-[#111827]/90">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
            CVD Chart
          </h2>
          <p className="mt-0.5 text-[10px] text-[#6B7280]">
            Delta acumulado calculado en backend
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

      <div className="h-[140px] p-1.5">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </section>
  );
}
