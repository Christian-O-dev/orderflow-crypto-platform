type MetricCardProps = {
  label: string;
  value: string;
  tone?: "neutral" | "buy" | "sell" | "cyan";
};

const toneClasses = {
  neutral: "text-[#E5E7EB]",
  buy: "text-emerald-300",
  sell: "text-red-300",
  cyan: "text-cyan-300",
};

export function MetricCard({ label, value, tone = "neutral" }: MetricCardProps) {
  return (
    <article className="grid w-[132px] grid-cols-[52px_1fr] items-baseline gap-1 border border-white/10 bg-[#111827]/90 px-1.5 py-0.5">
      <p className="min-w-0 truncate text-[8px] uppercase tracking-[0.08em] text-[#6B7280]">
        {label}
      </p>
      <p className={`min-w-0 overflow-hidden text-right font-mono text-[12px] font-semibold tabular-nums ${toneClasses[tone]}`}>
        {value}
      </p>
    </article>
  );
}
