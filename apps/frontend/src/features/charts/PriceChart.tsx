import type {
  CandleInterval,
  ChartLiquidityBand,
  ChartTradeMarker,
  ChartTimeframe,
  CvdPoint,
  LargeTradeEvent,
  LiquidityDepthRange,
  MarketCandle,
  PricePoint,
  WhaleLiquidityLevel,
  LiquidityMapZone,
} from "@orderflow/shared";
import {
  CandlestickSeries,
  createSeriesMarkers,
  LineStyle,
  LineSeries,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type LineData,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";

import { useMarketStore } from "../../stores/marketStore";
import { useWindowOrderFlow } from "../orderflow/useWindowOrderFlow";
import {
  createTerminalChart,
  observeTerminalChartSize,
  resizeTerminalChart,
} from "./chartUtils";
import { VolumeProfileOverlay } from "./VolumeProfileOverlay";

const EMPTY_PRICE_POINTS: PricePoint[] = [];
const EMPTY_WHALE_ORDERS: WhaleLiquidityLevel[] = [];
const MAX_CVD_POINTS = 500;
const MAX_LIQUIDITY_BANDS = 40;
const MAX_TRADE_MARKERS = 80;
const EXCHANGE_HISTORY_INTERVALS = new Set<ChartTimeframe>([
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
]);
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
const compactUsdFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  notation: "compact",
});

export function PriceChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const cvdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const tradeMarkersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const liquidityLinesRef = useRef<IPriceLine[]>([]);
  const heatmapLinesRef = useRef<IPriceLine[]>([]);
  const latestTimeRef = useRef<Time | null>(null);
  const latestCvdTimeRef = useRef<Time | null>(null);
  const priceDataKeyRef = useRef<string | null>(null);
  const [showWhaleOrders, setShowWhaleOrders] = useState(true);
  const [showCancelledOrders, setShowCancelledOrders] = useState(false);
  const [showLargeTrades, setShowLargeTrades] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);
  const [showCVD, setShowCVD] = useState(false);
  const [profileTickSize, setProfileTickSize] = useState<number>(50);
  const [historicalCandles, setHistoricalCandles] = useState<MarketCandle[]>([]);
  const [historyStatus, setHistoryStatus] = useState<
    "synthetic" | "loading" | "exchange" | "error"
  >("synthetic");
  const pricePoints = useMarketStore(
    (state) => state.snapshot?.pricePoints ?? EMPTY_PRICE_POINTS,
  );
  const windowOrderFlow = useWindowOrderFlow();
const largeTrades = windowOrderFlow.largeTrades;
  const cvdPoints = windowOrderFlow.cvdPoints;
  const cvd = windowOrderFlow.cvd;
  const absoluteCvd = useMarketStore((state) => state.snapshot?.cvd ?? 0);
  const absoluteCvdRef = useRef(absoluteCvd);
  absoluteCvdRef.current = absoluteCvd;
  const initialCvdRef = useRef(absoluteCvd);
  const snapshotTimestamp = useMarketStore((state) => state.snapshot?.timestamp ?? 0);
  const whaleOrders = useMarketStore((state) => state.whaleOrders ?? EMPTY_WHALE_ORDERS);
  const liquidityMapZonesByRes = useMarketStore((state) => state.liquidityMapZones);
  const liquidityMapResolution = useMarketStore((state) => state.liquidityMapResolution);
  const activeHeatmapZones = useMemo(() => {
    return liquidityMapZonesByRes?.[liquidityMapResolution] ?? [];
  }, [liquidityMapZonesByRes, liquidityMapResolution]);
  const lastPrice = useMarketStore((state) => state.snapshot?.lastPrice ?? 0);
  const depthRange = useMarketStore((state) => state.depthRange);
  const chartTimeframe = useMarketStore((state) => state.chartTimeframe);
  const setChartTimeframe = useMarketStore((state) => state.setChartTimeframe);
  const focusedTimestamp = useMarketStore((state) => state.focusedTimestamp);
  const candleIntervalSeconds = timeframeToSeconds(chartTimeframe);
  const usesExchangeHistory = isExchangeHistoryTimeframe(chartTimeframe);
  const hasExchangeHistoryForTimeframe =
    usesExchangeHistory &&
    historyStatus === "exchange" &&
    historicalCandles.length > 0 &&
    historicalCandles.every((candle) => candle.interval === chartTimeframe);
  const usesSyntheticCandles = !usesExchangeHistory || historyStatus === "error";
  const liquidityBands = useMemo(
    () => toChartLiquidityBands(whaleOrders, showCancelledOrders, lastPrice, depthRange),
    [depthRange, lastPrice, showCancelledOrders, whaleOrders],
  );
  const tradeMarkers = useMemo(() => toChartTradeMarkers(largeTrades), [largeTrades]);
  const cvdTone = cvd >= 0 ? "text-emerald-200" : "text-red-200";

  function resetChartView() {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const cvdSeries = cvdSeriesRef.current;
    const container = containerRef.current;

    if (!chart || !series || !container) {
      return;
    }

    resizeTerminalChart(container, chart);
    series.priceScale().setAutoScale(true);
    cvdSeries?.priceScale().setAutoScale(true);
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
    const tradeMarkersPlugin = createSeriesMarkers(series, []);
    series.getPane().setStretchFactor(3);

    chartRef.current = chart;
    seriesRef.current = series;
    tradeMarkersRef.current = tradeMarkersPlugin;
    const stopResizing = observeTerminalChartSize(container, chart);

    return () => {
      stopResizing();
      clearLiquidityLines();
      clearHeatmapLines();
      tradeMarkersRef.current?.setMarkers([]);
      tradeMarkersRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      cvdSeriesRef.current = null;
      latestTimeRef.current = null;
      latestCvdTimeRef.current = null;
      priceDataKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!usesExchangeHistory) {
      setHistoricalCandles([]);
      setHistoryStatus("synthetic");
      return;
    }

    const controller = new AbortController();
    const interval = chartTimeframe as CandleInterval;

    setHistoricalCandles([]);
    setHistoryStatus("loading");

    fetch(
      `${BACKEND_URL}/api/market/candles?symbol=BTCUSDT&interval=${interval}&limit=500`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Candles request failed with ${response.status}`);
        }

        const payload: unknown = await response.json();

        if (!isMarketCandlesResponse(payload)) {
          throw new Error("Invalid candles response");
        }

        setHistoricalCandles(payload.candles);
        setHistoryStatus("exchange");
        initialCvdRef.current = absoluteCvdRef.current;
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Unable to load Binance candles", error);
        setHistoricalCandles([]);
        setHistoryStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [chartTimeframe, usesExchangeHistory]);

  useEffect(() => {
    const series = seriesRef.current;

    if (!usesSyntheticCandles || !series || pricePoints.length === 0) {
      return;
    }

    const data = toCandlestickData(pricePoints, candleIntervalSeconds);
    const latestPoint = data.at(-1);
    const priceDataKey = `synthetic:${chartTimeframe}`;

    if (!latestPoint) {
      return;
    }

    if (priceDataKeyRef.current !== priceDataKey || latestTimeRef.current === null) {
      series.setData(data);
      chartRef.current?.timeScale().fitContent();
      priceDataKeyRef.current = priceDataKey;
    } else {
      series.update(latestPoint);
    }

    latestTimeRef.current = latestPoint.time;
  }, [candleIntervalSeconds, chartTimeframe, pricePoints, usesSyntheticCandles]);

  useEffect(() => {
    const series = seriesRef.current;

    if (!hasExchangeHistoryForTimeframe || !series) {
      return;
    }

    const data = toExchangeCandlestickData(
      historicalCandles,
      pricePoints,
      candleIntervalSeconds,
      chartTimeframe,
    );
    const latestPoint = data.at(-1);
    const priceDataKey = `exchange:${chartTimeframe}:${getHistoricalCandlesKey(
      historicalCandles,
    )}`;

    if (!latestPoint) {
      return;
    }

    if (priceDataKeyRef.current !== priceDataKey || latestTimeRef.current === null) {
      series.setData(data);
      chartRef.current?.timeScale().fitContent();
      priceDataKeyRef.current = priceDataKey;
    } else {
      series.update(latestPoint);
    }

    latestTimeRef.current = latestPoint.time;
  }, [
    candleIntervalSeconds,
    chartTimeframe,
    historicalCandles,
    pricePoints,
    hasExchangeHistoryForTimeframe,
    usesExchangeHistory,
    usesSyntheticCandles,
  ]);

  useEffect(() => {
    latestTimeRef.current = null;
    latestCvdTimeRef.current = null;
    priceDataKeyRef.current = null;
  }, [candleIntervalSeconds, usesExchangeHistory]);

  useEffect(() => {
    const series = cvdSeriesRef.current;

    if (!series) {
      return;
    }

    let data: LineData<Time>[] = [];

    if (hasExchangeHistoryForTimeframe && historicalCandles.length > 0) {
      data = toExchangeCvdLineData(
        historicalCandles,
        chartTimeframe as CandleInterval,
        initialCvdRef.current,
        absoluteCvd,
        snapshotTimestamp
      );
    } else {
      data = toCvdLineData(cvdPoints, MAX_CVD_POINTS, candleIntervalSeconds);
    }

    const latestPoint = data.at(-1);

    if (!latestPoint) {
      series.setData([]);
      latestCvdTimeRef.current = null;
      return;
    }

    series.setData(data);
    latestCvdTimeRef.current = latestPoint.time;
  }, [
    candleIntervalSeconds,
    cvdPoints,
    hasExchangeHistoryForTimeframe,
    historicalCandles,
    chartTimeframe,
    absoluteCvd,
    snapshotTimestamp,
    showCVD
  ]);

  useEffect(() => {
    const series = seriesRef.current;

    clearLiquidityLines();

    if (!series || !showWhaleOrders || liquidityBands.length === 0) {
      return;
    }

    liquidityLinesRef.current = liquidityBands.flatMap((band) =>
      createLiquidityPriceLines(series, band),
    );
  }, [liquidityBands, showWhaleOrders]);

  useEffect(() => {
    const series = seriesRef.current;

    clearHeatmapLines();

    if (!series || !showHeatmap || activeHeatmapZones.length === 0) {
      return;
    }

    heatmapLinesRef.current = activeHeatmapZones
      .filter((zone) => zone.status === "active" || zone.status === "weakened")
      .flatMap((zone) => createHeatmapPriceLines(series, zone));
  }, [activeHeatmapZones, showHeatmap]);

  useEffect(() => {
    const markersPlugin = tradeMarkersRef.current;

    if (!markersPlugin) {
      return;
    }

    markersPlugin.setMarkers(
      showLargeTrades ? toSeriesMarkers(tradeMarkers, candleIntervalSeconds) : [],
    );
  }, [candleIntervalSeconds, showLargeTrades, tradeMarkers]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !focusedTimestamp) return;

    // Centramos el gráfico +- 30 velas del momento de la alerta
    const targetTime = Math.floor(focusedTimestamp / 1000);
    const halfWindowSeconds = candleIntervalSeconds * 30;
    
    chart.timeScale().setVisibleRange({
      from: (targetTime - halfWindowSeconds) as Time,
      to: (targetTime + halfWindowSeconds) as Time,
    });
  }, [focusedTimestamp, candleIntervalSeconds]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    if (showCVD) {
      if (!cvdSeriesRef.current) {
        const cvdSeries = chart.addSeries(
          LineSeries,
          {
            color: "#22D3EE",
            lineWidth: 2,
            priceLineColor: "rgba(34,211,238,0.35)",
            title: "CVD",
            crosshairMarkerVisible: false,
          },
          1,
        );
        cvdSeries.getPane().setStretchFactor(1);
        cvdSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.14,
            bottom: 0.14,
          },
        });
        cvdSeriesRef.current = cvdSeries;
      }
    } else {
      if (cvdSeriesRef.current) {
        chart.removeSeries(cvdSeriesRef.current);
        cvdSeriesRef.current = null;
      }
    }
  }, [showCVD]);

  return (
    <section className="flex min-h-[280px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 lg:h-full lg:min-h-0">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 bg-[#131722]">
        {/* Asset Selector */}
        <div className="flex items-center">
          <select className="appearance-none bg-[#2A2E39] hover:bg-[#363A45] text-[#D1D4DC] rounded px-3 py-1 text-[13px] font-medium outline-none cursor-pointer">
            <option value="BTC">BTC</option>
          </select>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

        {/* Timeframe Selector */}
        <div className="flex items-center">
          <select
            value={chartTimeframe}
            onChange={(e) => setChartTimeframe(e.target.value as ChartTimeframe)}
            className="appearance-none bg-transparent hover:bg-[#2A2E39] text-[#D1D4DC] rounded px-3 py-1 text-[13px] font-medium outline-none cursor-pointer"
          >
            <option value="1m">1 minuto</option>
            <option value="5m">5 minuto</option>
            <option value="15m">15 minuto</option>
            <option value="30m">30 minuto</option>
            <option value="1h">1 hora</option>
            <option value="2h">2 hora</option>
            <option value="4h">4 hora</option>
            <option value="6h">6 hora</option>
            <option value="8h">8 hora</option>
            <option value="12h">12 hora</option>
            <option value="1d">1 día</option>
          </select>
        </div>

        <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

        {/* Indicators Dropdown */}
        <details className="relative group">
          <summary className="list-none cursor-pointer text-[#D1D4DC] hover:bg-[#2A2E39] rounded px-3 py-1 text-[13px] font-medium flex items-center gap-1">
            Indicadores <span className="text-[10px] text-[#787B86]">▼</span>
          </summary>
          <div className="absolute top-full left-0 mt-1 w-56 bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-3 flex flex-col gap-2">
            <OverlayToggle checked={showWhaleOrders} label="Whale Orders" onChange={setShowWhaleOrders} />
            <OverlayToggle checked={showCancelledOrders} label="Cancelled Orders" onChange={setShowCancelledOrders} />
            <OverlayToggle checked={showLargeTrades} label="Large Trades" onChange={setShowLargeTrades} />
            <OverlayToggle checked={showHeatmap} label="Heatmap" onChange={setShowHeatmap} />
            
            <div className="flex flex-col gap-1 border-t border-white/5 pt-2 mt-1">
              <OverlayToggle checked={showVolumeProfile} label="Vol Profile" onChange={setShowVolumeProfile} />
              {showVolumeProfile && (
                <div className="flex items-center gap-2 pl-6">
                  <span className="text-[10px] text-[#787B86]">Ticks:</span>
                  <select
                    value={profileTickSize}
                    onChange={(e) => setProfileTickSize(Number(e.target.value))}
                    className="bg-black/20 border border-white/10 text-[#D1D4DC] px-1 py-0.5 text-[10px] outline-none rounded"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 border-t border-white/5 pt-2 mt-1">
              <OverlayToggle checked={showCVD} label="CVD Indicator" onChange={setShowCVD} />
            </div>
          </div>
        </details>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden p-1.5">
        {showVolumeProfile && seriesRef.current && (
          <VolumeProfileOverlay series={seriesRef.current} tickSize={profileTickSize} />
        )}
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

  function clearLiquidityLines() {
    const series = seriesRef.current;

    if (series) {
      for (const line of liquidityLinesRef.current) {
        series.removePriceLine(line);
      }
    }

    liquidityLinesRef.current = [];
  }

  function clearHeatmapLines() {
    const series = seriesRef.current;

    if (series) {
      for (const line of heatmapLinesRef.current) {
        series.removePriceLine(line);
      }
    }

    heatmapLinesRef.current = [];
  }
}

type OverlayToggleProps = {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
};

function OverlayToggle({ checked, label, onChange }: OverlayToggleProps) {
  return (
    <label className="flex h-6 items-center gap-1.5 border border-white/10 bg-white/[0.03] px-2 font-mono text-[9px] uppercase tracking-[0.1em] text-[#9CA3AF]">
      <input
        checked={checked}
        className="h-3 w-3 accent-cyan-300"
        type="checkbox"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span className={checked ? "text-cyan-100" : "text-[#9CA3AF]"}>
        {label}
      </span>
    </label>
  );
}

function toCandlestickData(
  points: PricePoint[],
  candleIntervalSeconds: number,
): CandlestickData<Time>[] {
  const candles = new Map<number, CandlestickData<Time>>();

  for (const point of points) {
    const bucketTime =
      Math.floor(point.time / candleIntervalSeconds) * candleIntervalSeconds;
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

function toExchangeCandlestickData(
  candles: MarketCandle[],
  livePoints: PricePoint[],
  candleIntervalSeconds: number,
  interval: CandleInterval,
): CandlestickData<Time>[] {
  const chartCandles = candles
    .filter((candle) => candle.interval === interval)
    .map((candle) => ({
      time: Math.floor(candle.openTime / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    }));
  const candlesByTime = new Map<number, CandlestickData<Time>>(
    chartCandles.map((candle) => [Number(candle.time), candle]),
  );

  for (const point of livePoints) {
    const bucketTime =
      Math.floor(point.time / candleIntervalSeconds) * candleIntervalSeconds;
    const existingCandle = candlesByTime.get(bucketTime);

    if (!existingCandle) {
      const liveCandle = {
        time: bucketTime as Time,
        open: point.value,
        high: point.value,
        low: point.value,
        close: point.value,
      };

      chartCandles.push(liveCandle);
      candlesByTime.set(bucketTime, liveCandle);
      continue;
    }

    existingCandle.high = Math.max(existingCandle.high, point.value);
    existingCandle.low = Math.min(existingCandle.low, point.value);
    existingCandle.close = point.value;
  }

  return chartCandles.sort((left, right) => Number(left.time) - Number(right.time));
}

function toCvdLineData(
  points: CvdPoint[],
  maxPoints: number,
  candleIntervalSeconds: number,
) {
  const cvdByBucket = new Map<number, number>();

  for (const point of points) {
    const bucketTime =
      Math.floor(point.time / candleIntervalSeconds) * candleIntervalSeconds;
    cvdByBucket.set(bucketTime, point.value);
  }

  return Array.from(cvdByBucket.entries())
    .slice(-maxPoints)
    .map(([time, value]) => ({
      time: time as Time,
      value,
    }));
}

function toExchangeCvdLineData(
  candles: MarketCandle[],
  interval: CandleInterval,
  initialCvd: number,
  currentCvd: number,
  lastPriceTime: number
): LineData<Time>[] {
  const chartCandles = candles
    .filter((candle) => candle.interval === interval)
    .sort((a, b) => a.openTime - b.openTime);

  let cumulativeCvd = 0;
  const data: LineData<Time>[] = [];

  for (const candle of chartCandles) {
    const buyVolume = candle.takerBuyBaseVolume;
    const sellVolume = candle.volume - buyVolume;
    const delta = buyVolume - sellVolume;
    cumulativeCvd += delta;
    
    data.push({
      time: Math.floor(candle.openTime / 1000) as Time,
      value: cumulativeCvd,
    });
  }

  if (data.length > 0 && lastPriceTime > 0) {
    const lastTime = data[data.length - 1].time as number;
    const newTime = Math.floor(lastPriceTime / 1000);
    const liveDelta = currentCvd - initialCvd;
    
    if (newTime > lastTime) {
      data.push({
        time: newTime as Time,
        value: cumulativeCvd + liveDelta,
      });
    } else {
      data[data.length - 1].value += liveDelta;
    }
  }

  return data;
}

function toChartLiquidityBands(
  whaleOrders: WhaleLiquidityLevel[],
  includeCancelled: boolean,
  lastPrice: number,
  depthRange: LiquidityDepthRange,
): ChartLiquidityBand[] {
  const maxDistancePercent = depthRangeToPercent(depthRange);

  return whaleOrders
    .filter(
      (level) =>
        (level.status === "active" || includeCancelled) &&
        isWithinDepthRange(level.price, lastPrice, maxDistancePercent),
    )
    .slice(0, MAX_LIQUIDITY_BANDS)
    .map((level) => ({
      id: level.id,
      side: level.side,
      price: level.price,
      quantity: level.quantity,
      notionalUsd: level.notionalUsd,
      status: level.status,
      firstSeen: level.firstSeen,
      lastSeen: level.lastSeen,
    }));
}

function isWithinDepthRange(
  price: number,
  lastPrice: number,
  maxDistancePercent: number,
) {
  if (lastPrice <= 0) {
    return false;
  }

  return (Math.abs(price - lastPrice) / lastPrice) * 100 <= maxDistancePercent;
}

function depthRangeToPercent(range: LiquidityDepthRange) {
  return Number(range.replace("%", ""));
}

function toChartTradeMarkers(largeTrades: LargeTradeEvent[]): ChartTradeMarker[] {
  return largeTrades.slice(0, MAX_TRADE_MARKERS).map((trade) => ({
    id: trade.id,
    side: trade.side,
    price: trade.price,
    quantity: trade.quantity,
    notionalUsd: trade.notionalUsd,
    severity: trade.severity,
    timestamp: trade.timestamp,
  }));
}

function createLiquidityPriceLines(
  series: ISeriesApi<"Candlestick">,
  band: ChartLiquidityBand,
) {
  const color = getLiquidityColor(band);
  const lineStyle =
    band.status === "active" ? LineStyle.Solid : LineStyle.SparseDotted;
  const lineWidth = band.status === "active" ? 2 : 1;
  const title = `${band.side.toUpperCase()} ${formatCompactUsd(band.notionalUsd)}`;
  const mainLine = series.createPriceLine({
    price: band.price,
    color,
    lineWidth,
    lineStyle,
    axisLabelVisible: true,
    title,
  });

  if (band.status !== "active") {
    return [mainLine];
  }

  const bandWidth = getLiquidityBandWidth(band.price, band.notionalUsd);
  const edgeLine = series.createPriceLine({
    price: band.side === "bid" ? band.price - bandWidth : band.price + bandWidth,
    color: getLiquidityEdgeColor(band),
    lineWidth: 1,
    lineStyle: LineStyle.Dotted,
    axisLabelVisible: false,
    title: "",
  });

  return [mainLine, edgeLine];
}

function createHeatmapPriceLines(
  series: ISeriesApi<"Candlestick">,
  zone: LiquidityMapZone,
) {
  const isAsk = zone.side === "ask";
  const alpha = Math.max(0.1, Math.min(0.8, zone.intensity * 0.8));
  
  const color = isAsk
    ? `rgba(248, 113, 113, ${alpha})`
    : `rgba(52, 211, 153, ${alpha})`;
    
  const edgeColor = isAsk
    ? `rgba(248, 113, 113, 0.4)`
    : `rgba(52, 211, 153, 0.4)`;

  const title = `${zone.side.toUpperCase()} ${formatCompactUsd(zone.notionalUsd)}`;

  const mainLine = series.createPriceLine({
    price: zone.priceMid,
    color,
    lineWidth: 4,
    lineStyle: LineStyle.Solid,
    axisLabelVisible: true,
    title,
  });

  const topEdge = series.createPriceLine({
    price: Math.max(zone.priceStart, zone.priceEnd),
    color: edgeColor,
    lineWidth: 1,
    lineStyle: LineStyle.Dotted,
    axisLabelVisible: false,
    title: "",
  });

  const bottomEdge = series.createPriceLine({
    price: Math.min(zone.priceStart, zone.priceEnd),
    color: edgeColor,
    lineWidth: 1,
    lineStyle: LineStyle.Dotted,
    axisLabelVisible: false,
    title: "",
  });

  return [topEdge, mainLine, bottomEdge];
}

function toSeriesMarkers(
  markers: ChartTradeMarker[],
  candleIntervalSeconds: number,
): SeriesMarker<Time>[] {
  return markers
    .map((marker) => {
      const time =
        Math.floor(marker.timestamp / 1000 / candleIntervalSeconds) *
        candleIntervalSeconds;
      const isBuy = marker.side === "buy";

      return {
        id: marker.id,
        time: time as Time,
        position: "atPriceMiddle" as const,
        price: marker.price,
        shape: isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
        color: getTradeMarkerColor(marker),
        size: getTradeMarkerSize(marker),
        text: formatCompactUsd(marker.notionalUsd),
      };
    })
    .sort((left, right) => Number(left.time) - Number(right.time));
}

function getLiquidityColor(band: ChartLiquidityBand) {
  if (band.status === "cancelled") {
    return "rgba(156, 163, 175, 0.42)";
  }

  if (band.status === "partially_removed") {
    return "rgba(251, 191, 36, 0.7)";
  }

  return band.side === "bid"
    ? "rgba(52, 211, 153, 0.85)"
    : "rgba(248, 113, 113, 0.85)";
}

function getLiquidityEdgeColor(band: ChartLiquidityBand) {
  return band.side === "bid"
    ? "rgba(52, 211, 153, 0.32)"
    : "rgba(248, 113, 113, 0.32)";
}

function getLiquidityBandWidth(price: number, notionalUsd: number) {
  const strength = Math.min(6, Math.max(1, Math.log10(notionalUsd / 1_000_000 + 1)));

  return Math.max(price * 0.00008 * strength, 1);
}

function getTradeMarkerColor(marker: ChartTradeMarker) {
  if (marker.severity === "whale") {
    return marker.side === "buy" ? "#FBBF24" : "#F97316";
  }

  if (marker.severity === "high") {
    return marker.side === "buy" ? "#22C55E" : "#EF4444";
  }

  return marker.side === "buy" ? "#67E8F9" : "#FDA4AF";
}

function getTradeMarkerSize(marker: ChartTradeMarker) {
  if (marker.severity === "whale") {
    return 1.45;
  }

  if (marker.severity === "high") {
    return 1.2;
  }

  return 1;
}

function formatCompactUsd(value: number) {
  return compactUsdFormat.format(value);
}

function timeframeToSeconds(timeframe: ChartTimeframe) {
  const amount = Number(timeframe.slice(0, -1));
  const unit = timeframe.at(-1);

  if (unit === "m") {
    return amount * 60;
  }

  if (unit === "h") {
    return amount * 60 * 60;
  }

  if (unit === "d") {
    return amount * 24 * 60 * 60;
  }

  return amount;
}

function isExchangeHistoryTimeframe(
  timeframe: ChartTimeframe,
): timeframe is CandleInterval {
  return EXCHANGE_HISTORY_INTERVALS.has(timeframe);
}

function isMarketCandlesResponse(
  value: unknown,
): value is { candles: MarketCandle[] } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const response = value as Record<string, unknown>;

  return Array.isArray(response.candles);
}

function getHistoricalCandlesKey(candles: MarketCandle[]) {
  const first = candles[0];
  const last = candles.at(-1);

  return `${candles.length}:${first?.openTime ?? 0}:${last?.openTime ?? 0}`;
}

function getHistoryLabel(status: "synthetic" | "loading" | "exchange" | "error") {
  if (status === "exchange") {
    return "Velas historicas reales desde Binance";
  }

  if (status === "loading") {
    return "Cargando historial real de Binance";
  }

  if (status === "error") {
    return "Historial no disponible, flujo en vivo activo";
  }

  return "Velas sinteticas desde price feed";
}
