import type { WhaleLiquidityLevel } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_WHALE_ORDERS: WhaleLiquidityLevel[] = [];

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

export function WhaleOrdersPanel() {
  const whaleOrders = useMarketStore(
    (state) => state.whaleOrders ?? EMPTY_WHALE_ORDERS,
  );
  const analysisWindow = useMarketStore((state) => state.analysisWindow);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-amber-300/15 bg-amber-300/[0.04] px-2.5 py-1.5 font-mono text-[9.5px] text-amber-100">
        Whale Orders por ventana: {analysisWindow}. Order book profundo de Binance.
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[620px] w-full border-collapse font-mono text-[9.5px] tabular-nums sm:text-[10px]">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0E14] text-[#6B7280]">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-medium">Lado</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Precio</th>
              <th className="px-1.5 py-1.5 text-right font-medium">BTC</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Valor</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Dur.</th>
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
                  level.status !== "active" && "opacity-60",
                )}
              >
                <td
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-1 uppercase",
                    level.side === "bid" ? "text-emerald-300" : "text-red-300",
                  )}
                >
                  {level.side}
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
                  {formatDuration(level.durationMs)}
                </td>
                <td
                  className={clsx(
                    "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                    getStatusClass(level.status),
                  )}
                >
                  {formatStatus(level.status)}
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
            Esperando muros grandes dentro de depth20...
          </div>
        )}
      </div>
    </div>
  );
}

function formatDuration(durationMs: number) {
  if (durationMs < 1_000) {
    return `${durationMs}ms`;
  }

  const seconds = Math.floor(durationMs / 1_000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}m ${remainingSeconds}s`;
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
