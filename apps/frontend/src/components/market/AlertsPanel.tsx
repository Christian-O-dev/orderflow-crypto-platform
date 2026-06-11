import type { MarketAlert } from "@orderflow/shared";
import { useMarketStore } from "../../stores/marketStore";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EMPTY_ALERTS: MarketAlert[] = [];

type FilterType = "all" | MarketAlert["severity"];

export function AlertsPanel() {
  const alerts = useMarketStore((state) => state.alerts ?? EMPTY_ALERTS);
  const soundEnabled = useMarketStore((state) => state.soundEnabled);
  const setSoundEnabled = useMarketStore((state) => state.setSoundEnabled);
  const markAllAlertsAsRead = useMarketStore((state) => state.markAllAlertsAsRead);
  const [filter, setFilter] = useState<FilterType>("all");
  
  const prevAlertsLength = useRef(alerts.length);

  // Play sound when new high-severity alert arrives
  useEffect(() => {
    if (alerts.length > prevAlertsLength.current && soundEnabled) {
      const newAlert = alerts[0];
      if (newAlert && newAlert.severity === "high") {
        playAlertSound();
      }
    }
    prevAlertsLength.current = alerts.length;
  }, [alerts, soundEnabled]);

  const filteredAlerts = filter === "all" 
    ? alerts 
    : alerts.filter(a => a.severity === filter);
    
  const latestAlerts = filteredAlerts.slice(0, 50); // Increased slice for scrolling

  return (
    <section 
      className="flex min-h-[150px] flex-col overflow-hidden border border-white/10 bg-[#111827]/90 lg:h-full lg:min-h-0"
      onMouseEnter={markAllAlertsAsRead} // Mark read when interacting
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#0B0E14]/70 px-2 py-1">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB] flex items-center gap-2">
            Alerts
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`text-[12px] hover:scale-110 transition-transform ${soundEnabled ? 'text-cyan-400' : 'text-gray-500 opacity-50'}`}
              title={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </button>
          </h2>
          <div className="flex gap-1 mt-1">
            <FilterButton current={filter} value="all" label="All" onClick={() => setFilter("all")} />
            <FilterButton current={filter} value="high" label="High" onClick={() => setFilter("high")} />
            <FilterButton current={filter} value="medium" label="Med" onClick={() => setFilter("medium")} />
            <FilterButton current={filter} value="low" label="Low" onClick={() => setFilter("low")} />
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-1.5 py-0.5 font-mono text-[8px] uppercase text-[#9CA3AF]">
          {filteredAlerts.length} total
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-1.5">
        {latestAlerts.length === 0 ? (
          <div className="grid min-h-16 min-w-[260px] place-items-center text-center text-[10px] text-[#6B7280]">
            Esperando alertas de mercado...
          </div>
        ) : (
          <div className="min-w-[260px] space-y-1">
            <AnimatePresence initial={false}>
              {latestAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}

function FilterButton({ current, value, label, onClick }: { current: FilterType, value: FilterType, label: string, onClick: () => void }) {
  const isActive = current === value;
  let colorClass = "text-gray-400 hover:text-white border-transparent";
  if (isActive) {
    if (value === "high") colorClass = "text-red-400 bg-red-400/10 border-red-400/30";
    else if (value === "medium") colorClass = "text-amber-400 bg-amber-400/10 border-amber-400/30";
    else if (value === "low") colorClass = "text-cyan-400 bg-cyan-400/10 border-cyan-400/30";
    else colorClass = "text-white bg-white/10 border-white/30";
  }

  return (
    <button 
      onClick={onClick}
      className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${colorClass} transition-colors`}
    >
      {label}
    </button>
  );
}

function AlertRow({ alert }: { alert: MarketAlert }) {
  const tone = getAlertTone(alert.severity);
  const lastReadTime = useMarketStore((state) => state.lastReadAlertTime);
  const setFocusedTimestamp = useMarketStore((state) => state.setFocusedTimestamp);
  const isUnread = alert.timestamp > lastReadTime;

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative min-w-[260px] border ${tone.border} ${tone.bg} px-1.5 py-1 ${isUnread ? 'shadow-[0_0_8px_rgba(255,255,255,0.1)]' : ''}`}
    >
      {isUnread && (
        <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-white shadow-[0_0_5px_white] animate-pulse" />
      )}
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
      <div className="mt-1 flex items-center justify-between">
        <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#9CA3AF]">
          {alert.symbol} - {alert.severity}
        </p>
        <button 
          onClick={() => setFocusedTimestamp(alert.timestamp)}
          className={`font-mono text-[8px] border ${tone.border} px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors ${tone.text}`}
        >
          Ver en gráfico
        </button>
      </div>
    </motion.article>
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

function playAlertSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Ignore audio context errors if blocked by browser policy
  }
}



