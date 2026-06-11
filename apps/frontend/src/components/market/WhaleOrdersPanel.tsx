import type {
  DeepLiquidityLevel,
  LiquidityDepthRange,
  WhaleLiquidityLevel,
} from "@orderflow/shared";
import clsx from "clsx";
import { useMemo } from "react";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_WHALE_ORDERS: WhaleLiquidityLevel[] = [];
const ACTIVE_LIMIT_ORDERS_LIMIT = 500;

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

const usdFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  notation: "compact",
});

const percentFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export function WhaleOrdersPanel() {
  const trackedWhaleOrders = useMarketStore(
    (state) => state.whaleOrders ?? EMPTY_WHALE_ORDERS,
  );
  const snapshot = useMarketStore((state) => state.snapshot);
  const depthRange = useMarketStore((state) => state.depthRange);
  const whaleOrders = useMemo(
    () =>
      getDeepLiquidityLevels({
        trackedWhaleOrders,
        lastPrice: snapshot?.lastPrice ?? 0,
        now: snapshot?.timestamp ?? Date.now(),
        depthRange,
      }),
    [depthRange, snapshot?.lastPrice, snapshot?.timestamp, trackedWhaleOrders],
  );
  const limitBuyCount = whaleOrders.filter((level) => level.side === "bid").length;
  const limitSellCount = whaleOrders.filter((level) => level.side === "ask").length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-amber-300/15 bg-amber-300/[0.04] px-2.5 py-1.5 font-mono text-[9.5px] text-amber-100">
        <span>
          Active whale limits dentro de {depthRange} del precio
        </span>
        <span className="shrink-0 text-[#9CA3AF]">
          {limitBuyCount} buys / {limitSellCount} sells
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[620px] w-full border-collapse font-mono text-[9.5px] tabular-nums sm:text-[10px]">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0E14] text-[#6B7280]">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-medium">Orden</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Precio</th>
              <th className="px-1.5 py-1.5 text-right font-medium">BTC</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Valor</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Dist.</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Obs.</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Zona</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Estado</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Ex.</th>
            </tr>
          </thead>
          <tbody>
            {whaleOrders.map((level) => (
              <tr
                key={level.id}
                className={clsx(
                  "border-t border-white/[0.04]",
                  level.side === "bid"
                    ? "bg-emerald-400/[0.025]"
                    : "bg-red-400/[0.025]",
                )}
              >
                <td
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-1 uppercase",
                    level.side === "bid" ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {formatLimitOrderSide(level.side)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#E5E7EB]">
                  {priceFormat.format(level.price)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#E5E7EB]">
                  {quantityFormat.format(level.quantity)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right font-semibold text-amber-100">
                  ${usdFormat.format(level.notionalUsd)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#9CA3AF]">
                  {formatDistance(level)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#9CA3AF]">
                  {formatObservedAge(level.ageSeconds)}
                </td>
                <td
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                    getZoneClass(level.zone),
                  )}
                >
                  {level.zone}
                </td>
                <td
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                    getStatusClass(level.status),
                  )}
                >
                  {formatOrderSource(level)}
                </td>
                <td className="whitespace-nowrap px-1.5 py-1 text-right uppercase text-[#9CA3AF]">
                  {level.exchange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {whaleOrders.length === 0 && (
          <div className="grid min-h-48 min-w-[360px] place-items-center px-4 text-center text-sm text-[#6B7280]">
            Esperando whale limit orders activas dentro de {depthRange}...
          </div>
        )}
      </div>
    </div>
  );
}

function getDeepLiquidityLevels({
  trackedWhaleOrders,
  lastPrice,
  now,
  depthRange,
}: {
  trackedWhaleOrders: WhaleLiquidityLevel[];
  lastPrice: number;
  now: number;
  depthRange: LiquidityDepthRange;
}): DeepLiquidityLevel[] {
  const maxDistancePercent = depthRangeToPercent(depthRange);

  return trackedWhaleOrders
    .filter((level) => level.status === "active")
    .map((level) => toDeepLiquidityLevel(level, lastPrice, now))
    .filter((level) => level.distancePercent <= maxDistancePercent)
    .sort((left, right) => right.notionalUsd - left.notionalUsd)
    .slice(0, ACTIVE_LIMIT_ORDERS_LIMIT)
    .sort((left, right) => right.price - left.price);
}

function toDeepLiquidityLevel(
  level: WhaleLiquidityLevel,
  lastPrice: number,
  now: number,
): DeepLiquidityLevel {
  const distanceFromPrice = Math.abs(level.price - lastPrice);
  const distancePercent =
    lastPrice > 0 ? (distanceFromPrice / lastPrice) * 100 : Number.POSITIVE_INFINITY;
  const ageSeconds = Math.max(0, Math.floor((now - level.firstSeen) / 1_000));

  return {
    ...level,
    distanceFromPrice,
    distancePercent,
    ageSeconds,
    zone: getLiquidityZone(distancePercent),
  };
}

function depthRangeToPercent(range: LiquidityDepthRange) {
  return Number(range.replace("%", ""));
}

function getLiquidityZone(distancePercent: number): DeepLiquidityLevel["zone"] {
  if (distancePercent <= 0.5) {
    return "near";
  }

  if (distancePercent <= 2) {
    return "mid";
  }

  return "far";
}

function formatLimitOrderSide(side: WhaleLiquidityLevel["side"]) {
  return side === "bid" ? "limit buy" : "limit sell";
}

function formatOrderSource(level: WhaleLiquidityLevel) {
  return formatStatus(level.status);
}

function formatDistance(level: DeepLiquidityLevel) {
  return `${priceFormat.format(level.distanceFromPrice)} / ${percentFormat.format(
    level.distancePercent,
  )}%`;
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

function getZoneClass(zone: DeepLiquidityLevel["zone"]) {
  if (zone === "near") {
    return "text-cyan-200";
  }

  if (zone === "mid") {
    return "text-amber-200";
  }

  return "text-fuchsia-200";
}

function formatStatus(status: WhaleLiquidityLevel["status"]) {
  if (status === "partially_removed") {
    return "partial";
  }

  return status;
}

function getStatusClass(status: WhaleLiquidityLevel["status"]) {
  if (status === "active") {
    return "text-emerald-200";
  }

  if (status === "partially_removed") {
    return "text-amber-200";
  }

  return "text-red-200";
}
