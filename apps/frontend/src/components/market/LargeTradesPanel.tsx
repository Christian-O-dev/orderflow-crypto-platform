import type { LargeTradeEvent } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_LARGE_TRADES: LargeTradeEvent[] = [];

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

export function LargeTradesPanel() {
  const largeTrades = useMarketStore(
    (state) => state.largeTrades ?? EMPTY_LARGE_TRADES,
  );

  return (
    <section className="flex min-h-[220px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 shadow-2xl shadow-black/20 lg:h-full lg:min-h-0">
      <div className="border-b border-white/10 bg-[#0B0E14]/70 px-2.5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
              Large Trades
            </h2>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">
              Ejecutados por valor USD
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9CA3AF]">
            {largeTrades.length}/100
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="min-w-[560px] w-full border-collapse font-mono text-[9.5px] tabular-nums">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0E14] text-[#6B7280]">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-medium">Hora</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Lado</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Precio</th>
              <th className="px-1.5 py-1.5 text-right font-medium">BTC</th>
              <th className="px-1.5 py-1.5 text-right font-medium">USD</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Sev.</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Ex.</th>
            </tr>
          </thead>
          <tbody>
            {largeTrades.map((trade) => {
              const isBuy = trade.side === "buy";

              return (
                <tr
                  key={trade.id}
                  className={clsx(
                    "border-t border-white/[0.04]",
                    isBuy ? "bg-emerald-400/[0.025]" : "bg-red-400/[0.025]",
                    trade.severity === "whale" && "bg-amber-300/[0.08]",
                  )}
                >
                  <td className="whitespace-nowrap px-1.5 py-1 text-[#9CA3AF]">
                    {formatTradeTime(trade.timestamp)}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                      isBuy ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {trade.side}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#E5E7EB]">
                    {priceFormat.format(trade.price)}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right text-[#E5E7EB]">
                    {quantityFormat.format(trade.quantity)}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right font-semibold text-cyan-200">
                    ${usdFormat.format(trade.notionalUsd)}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                      getSeverityClass(trade.severity),
                    )}
                  >
                    {trade.severity}
                  </td>
                  <td className="whitespace-nowrap px-1.5 py-1 text-right uppercase text-[#9CA3AF]">
                    {trade.exchange}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {largeTrades.length === 0 && (
          <div className="grid min-h-36 min-w-[360px] place-items-center px-4 text-center text-sm text-[#6B7280]">
            Esperando large trades por valor USD...
          </div>
        )}
      </div>
    </section>
  );
}

function getSeverityClass(severity: LargeTradeEvent["severity"]) {
  if (severity === "whale") {
    return "font-semibold text-amber-200";
  }

  if (severity === "high") {
    return "text-red-200";
  }

  return "text-cyan-200";
}

function formatTradeTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}
