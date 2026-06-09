import type { OrderBookLevel } from "@orderflow/shared";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_ORDER_BOOK: OrderBookLevel[] = [];
const MAX_DOM_LEVELS = 20;

const priceFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sizeFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 5,
});

export function DomTable() {
  const orderBook = useMarketStore(
    (state) => state.snapshot?.orderBook ?? EMPTY_ORDER_BOOK,
  );
  const asks = orderBook
    .filter((level) => level.askSize > 0)
    .sort((left, right) => left.price - right.price)
    .slice(0, MAX_DOM_LEVELS)
    .reverse();
  const bids = orderBook
    .filter((level) => level.bidSize > 0)
    .sort((left, right) => right.price - left.price)
    .slice(0, MAX_DOM_LEVELS);
  const maxSize = Math.max(
    1,
    ...asks.map((level) => level.askSize),
    ...bids.map((level) => level.bidSize),
  );

  return (
    <section className="flex min-h-[320px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 shadow-2xl shadow-black/20 lg:h-full lg:min-h-0">
      <div className="border-b border-white/10 bg-[#0B0E14]/70 px-2.5 py-2">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#E5E7EB]">
          DOM
        </h2>
        <p className="mt-0.5 text-[10px] text-[#6B7280]">
          Binance BTCUSDT depth20
        </p>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-white/10 bg-[#0B0E14] px-2 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6B7280]">
        <span>Precio</span>
        <span className="text-right">Tam.</span>
        <span className="text-right">Acum.</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto font-mono text-[9.5px] tabular-nums sm:text-[10px]">
        {asks.map((level) => (
          <DomRow
            key={`ask-${level.price}`}
            level={level}
            maxSize={maxSize}
            side="ask"
          />
        ))}

        <div className="border-y border-cyan-300/20 bg-cyan-300/10 px-2 py-1 text-center text-[9px] uppercase tracking-[0.2em] text-cyan-200">
          Spread
        </div>

        {bids.map((level) => (
          <DomRow
            key={`bid-${level.price}`}
            level={level}
            maxSize={maxSize}
            side="bid"
          />
        ))}

        {orderBook.length === 0 && (
          <div className="grid min-h-56 place-items-center px-4 text-center text-sm text-[#6B7280]">
            Esperando profundidad de Binance...
          </div>
        )}
      </div>
    </section>
  );
}

type DomRowProps = {
  level: OrderBookLevel;
  maxSize: number;
  side: "bid" | "ask";
};

function DomRow({ level, maxSize, side }: DomRowProps) {
  const size = side === "bid" ? level.bidSize : level.askSize;
  const total = side === "bid" ? level.bidTotal : level.askTotal;
  const width = `${Math.min(100, (size / maxSize) * 100)}%`;
  const isBid = side === "bid";

  return (
    <div className="relative grid grid-cols-[1fr_1fr_1fr] border-b border-white/[0.035] px-2 py-1">
      <div
        className={`absolute inset-y-0 right-0 ${
          isBid ? "bg-emerald-400/10" : "bg-red-400/10"
        }`}
        style={{ width }}
      />
      <span className={isBid ? "relative text-emerald-300" : "relative text-red-300"}>
        {priceFormat.format(level.price)}
      </span>
      <span className="relative text-right text-[#E5E7EB]">
        {sizeFormat.format(size)}
      </span>
      <span className="relative text-right text-[#9CA3AF]">
        {sizeFormat.format(total ?? size)}
      </span>
    </div>
  );
}
