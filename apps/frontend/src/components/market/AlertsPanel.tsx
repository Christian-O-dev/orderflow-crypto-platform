import type { MarketAlert } from "@orderflow/shared";
import { useMarketStore } from "../../stores/marketStore";

const EMPTY_ALERTS: MarketAlert[] = [];

export function AlertsPanel() {
  const alerts = useMarketStore((state) => state.alerts ?? EMPTY_ALERTS);
  const latestAlerts = alerts.slice(0, 12);

  return (
    <section className="flex min-h-[150px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 lg:h-full lg:min-h-0">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-[#0B0E14]/70 px-2 py-1">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]">
            Alerts
          </h2>
          <p className="text-[9px] leading-3 text-[#6B7280]">
            Senales prudentes de order flow.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-[#9CA3AF]">
          {alerts.length} total
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-1.5">
        {latestAlerts.length === 0 ? (
          <div className="grid min-h-16 min-w-[260px] place-items-center text-center text-[10px] text-[#6B7280]">
            Esperando alertas de mercado...
          </div>
        ) : (
          <div className="min-w-[260px] space-y-1">
            {latestAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AlertRow({ alert }: { alert: MarketAlert }) {
  const tone = getAlertTone(alert.severity);

  return (
    <article className={`min-w-[260px] border ${tone.border} ${tone.bg} px-1.5 py-1`}>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`font-mono text-[8px] uppercase tracking-[0.12em] ${tone.text}`}
        >
          {formatAlertType(alert.type)}
        </span>
        <span className="shrink-0 font-mono text-[8px] text-[#6B7280]">
          {formatTime(alert.timestamp)}
        </span>
      </div>
      <p className="mt-0.5 text-[10px] leading-3 text-[#E5E7EB]">
        {alert.message}
      </p>
      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-[#9CA3AF]">
        {alert.symbol} - {alert.severity}
      </p>
    </article>
  );
}

function getAlertTone(severity: MarketAlert["severity"]) {
  if (severity === "high") {
    return {
      bg: "bg-red-400/10",
      border: "border-red-300/25",
      text: "text-red-200",
    };
  }

  if (severity === "medium") {
    return {
      bg: "bg-amber-300/10",
      border: "border-amber-300/25",
      text: "text-amber-200",
    };
  }

  return {
    bg: "bg-cyan-300/10",
    border: "border-cyan-300/25",
    text: "text-cyan-200",
  };
}

function formatAlertType(type: MarketAlert["type"]) {
  return type.replaceAll("_", " ");
}

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}
