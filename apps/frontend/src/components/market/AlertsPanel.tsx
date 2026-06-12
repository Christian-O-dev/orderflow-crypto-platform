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
      className="flex h-full flex-col overflow-hidden border border-white/10 bg-[#111827]/90"
      onMouseEnter={markAllAlertsAsRead} // Mark read when interacting
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0B0E14]/70 px-2 py-1">
        <div className="flex items-center gap-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E5E7EB]">
            Alerts
          </h2>
          <FilterDropdown filter={filter} setFilter={setFilter} />
        </div>
        <button 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`text-[12px] hover:scale-110 transition-transform ${soundEnabled ? 'text-cyan-400' : 'text-gray-500 opacity-50'}`}
          title={soundEnabled ? "Desactivar sonido" : "Activar sonido"}
        >
          {soundEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-1.5">
        {latestAlerts.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-[10px] text-[#6B7280]">
            Esperando alertas de mercado...
          </div>
        ) : (
          <div className="space-y-1">
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

function FilterDropdown({ filter, setFilter }: { filter: FilterType, setFilter: (f: FilterType) => void }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const options: { value: FilterType; label: string }[] = [
    { value: "all", label: "ALL" },
    { value: "high", label: "HIGH" },
    { value: "medium", label: "MED" },
    { value: "low", label: "LOW" },
  ];

  const handleSelect = (val: FilterType) => {
    setFilter(val);
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  const currentLabel = options.find((o) => o.value === filter)?.label || "ALL";

  return (
    <details ref={detailsRef} className="relative group">
      <summary className="list-none cursor-pointer flex items-center justify-between gap-1 h-5 min-w-[40px] px-1.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors border border-white/10 bg-white/[0.03] text-amber-200 hover:bg-white/[0.08] rounded-sm">
        {currentLabel}
        <span className="text-[6px] opacity-70">▼</span>
      </summary>
      <div className="absolute top-full left-0 mt-1 min-w-[40px] max-h-28 overflow-y-auto bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-0.5 flex flex-col gap-0.5 scrollbar-thin scrollbar-thumb-white/10">
        {options.map((opt) => (
          <button
            key={opt.value}
            style={{ fontSize: "9px", lineHeight: "12px" }}
            className={`text-center px-1 py-0.5 font-mono rounded ${
              filter === opt.value
                ? "bg-amber-500/20 text-amber-200"
                : "text-[#D1D4DC] hover:bg-[#2A2E39]"
            }`}
            type="button"
            onClick={() => handleSelect(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </details>
  );
}

function AlertRow({ alert }: { alert: MarketAlert }) {
  const tone = getAlertTone(alert.severity);
  const lastReadTime = useMarketStore((state) => state.lastReadAlertTime);
  const isUnread = alert.timestamp > lastReadTime;

  return (
    <motion.article 
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`relative border ${tone.border} ${tone.bg} px-1.5 py-1 ${isUnread ? 'shadow-[0_0_8px_rgba(255,255,255,0.1)]' : ''}`}
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
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[8px] uppercase tracking-[0.1em] ${tone.text}`}>
            {alert.severity}
          </span>
          <span className="shrink-0 font-mono text-[8px] text-[#6B7280]">
            {formatTime(alert.timestamp)}
          </span>
        </div>
      </div>
      <p className="mt-0.5 text-[10px] leading-3 text-[#E5E7EB]">
        {alert.message}
      </p>
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



