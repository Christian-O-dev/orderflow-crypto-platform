import {
  ColorType,
  CrosshairMode,
  createChart,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";

type ChartPoint = {
  time: number;
  value: number;
};

type CreateTerminalLineChartOptions = {
  container: HTMLDivElement;
  lineColor: string;
  priceLineColor: string;
  crosshairColor: string;
};

export function createTerminalLineChart({
  container,
  lineColor,
  priceLineColor,
  crosshairColor,
}: CreateTerminalLineChartOptions): {
  chart: IChartApi;
  series: ISeriesApi<"Line">;
} {
  const chart = createTerminalChart({ container, crosshairColor });

  const series = chart.addSeries(LineSeries, {
    color: lineColor,
    lineWidth: 2,
    priceLineColor,
    lastValueVisible: true,
    crosshairMarkerVisible: true,
  });

  return { chart, series };
}

export function createTerminalChart({
  container,
  crosshairColor,
}: Pick<CreateTerminalLineChartOptions, "container" | "crosshairColor">): IChartApi {
  const { width, height } = container.getBoundingClientRect();

  return createChart(container, {
    width: Math.max(1, Math.floor(width)),
    height: Math.max(1, Math.floor(height)),
    layout: {
      background: { type: ColorType.Solid, color: "#111827" },
      textColor: "#9CA3AF",
      fontFamily: "JetBrains Mono, Cascadia Code, Consolas, monospace",
    },
    grid: {
      vertLines: { color: "rgba(255,255,255,0.04)" },
      horzLines: { color: "rgba(255,255,255,0.06)" },
    },
    rightPriceScale: {
      borderColor: "rgba(255,255,255,0.1)",
    },
    timeScale: {
      borderColor: "rgba(255,255,255,0.1)",
      timeVisible: true,
      secondsVisible: true,
    },
    handleScale: {
      axisDoubleClickReset: {
        price: true,
        time: true,
      },
      axisPressedMouseMove: {
        price: true,
        time: true,
      },
      mouseWheel: true,
      pinch: true,
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: { color: crosshairColor },
      horzLine: { color: crosshairColor },
    },
  });
}

export function observeTerminalChartSize(container: HTMLDivElement, chart: IChartApi) {
  let animationFrame = 0;

  const observer = new ResizeObserver(() => {
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(() => resizeTerminalChart(container, chart));
  });

  resizeTerminalChart(container, chart);
  observer.observe(container);

  return () => {
    cancelAnimationFrame(animationFrame);
    observer.disconnect();
  };
}

export function resizeTerminalChart(container: HTMLDivElement, chart: IChartApi) {
  const { width, height } = container.getBoundingClientRect();

  if (width <= 0 || height <= 0) {
    return;
  }

  chart.resize(Math.floor(width), Math.floor(height));
}

export function toUniqueLineData(points: ChartPoint[], maxPoints?: number): LineData<Time>[] {
  const pointByTime = new Map<number, number>();
  const visiblePoints = maxPoints ? points.slice(-maxPoints) : points;

  for (const point of visiblePoints) {
    pointByTime.set(point.time, point.value);
  }

  return Array.from(pointByTime.entries()).map(([time, value]) => ({
    time: time as Time,
    value,
  }));
}
