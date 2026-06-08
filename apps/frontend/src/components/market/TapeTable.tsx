import type { NormalizedTrade } from "@orderflow/shared";
import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_TRADES: NormalizedTrade[] = [];
const LARGE_TRADE_THRESHOLD = 0.5;
const MAX_VISIBLE_TRADES = 150;

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 5,
  maximumFractionDigits: 5,
});

export function TapeTable() {
  const trades = useMarketStore((state) => state.snapshot?.trades ?? EMPTY_TRADES);
  const visibleTrades = trades.slice(0, MAX_VISIBLE_TRADES);
  const largeTradesCount = visibleTrades.filter(
    (trade) => trade.quantity >= LARGE_TRADE_THRESHOLD,
  ).length;

  return (
    <section className="flex h-[320px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 shadow-2xl shadow-black/20 lg:h-[calc(100vh-4.75rem)]">
      <div className="border-b border-white/10 bg-[#0B0E14]/70 px-2.5 py-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
              Tape
            </h2>
            <p className="mt-0.5 text-[10px] text-[#6B7280]">
              Time & Sales - {MAX_VISIBLE_TRADES}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 font-mono text-[9px] uppercase tracking-[0.16em]">
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[#9CA3AF]">
              {visibleTrades.length} trades
            </span>
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-amber-200">
              {largeTradesCount} large
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse font-mono text-[9.5px] tabular-nums sm:text-[10px]">
          <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#0B0E14] text-[#6B7280]">
            <tr>
              <th className="px-1.5 py-1.5 text-left font-medium">Hora</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Precio</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Cant.</th>
              <th className="px-1.5 py-1.5 text-right font-medium">Lado</th>
              <th className="hidden px-1.5 py-1.5 text-right font-medium sm:table-cell">Ex.</th>
            </tr>
          </thead>
          <tbody>
            {visibleTrades.map((trade) => {
              const isBuy = trade.side === "buy";
              const isLargeTrade = trade.quantity >= LARGE_TRADE_THRESHOLD;

              return (
                <tr
                  key={trade.tradeId}
                  className={clsx(
                    "border-t border-white/[0.04]",
                    isBuy ? "bg-emerald-400/[0.025]" : "bg-red-400/[0.025]",
                    isLargeTrade && "bg-amber-300/[0.08]",
                  )}
                >
                  <td className="whitespace-nowrap px-1.5 py-1 text-[#9CA3AF]">
                    {formatTradeTime(trade.timestamp)}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-1.5 py-1 text-right font-semibold",
                      isBuy ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {priceFormat.format(trade.price)}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-1.5 py-1 text-right text-[#E5E7EB]",
                      isLargeTrade && "font-semibold text-amber-200",
                    )}
                  >
                    {isLargeTrade && (
                      <span className="mr-1 text-amber-300">*</span>
                    )}
                    {quantityFormat.format(trade.quantity)}
                  </td>
                  <td
                    className={clsx(
                      "whitespace-nowrap px-1.5 py-1 text-right uppercase",
                      isBuy ? "text-emerald-300" : "text-red-300",
                    )}
                  >
                    {isBuy ? "BUY" : "SELL"}
                  </td>
                  <td className="hidden whitespace-nowrap px-1.5 py-1 text-right uppercase text-[#9CA3AF] sm:table-cell">
                    {trade.exchange}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {visibleTrades.length === 0 && (
          <div className="grid min-h-56 place-items-center px-4 text-sm text-[#6B7280]">
            Esperando snapshots del backend...
          </div>
        )}
      </div>
    </section>
  );
}

function formatTradeTime(timestamp: number) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  const milliseconds = date.getMilliseconds().toString().padStart(3, "0");

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}
