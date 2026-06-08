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
    <article className="min-w-[118px] border border-white/10 bg-[#111827]/90 px-2 py-1">
      <p className="text-[8px] uppercase tracking-[0.16em] text-[#6B7280]">
        {label}
      </p>
      <p className={`font-mono text-sm font-semibold tabular-nums xl:text-[15px] ${toneClasses[tone]}`}>
        {value}
      </p>
    </article>
  );
}
