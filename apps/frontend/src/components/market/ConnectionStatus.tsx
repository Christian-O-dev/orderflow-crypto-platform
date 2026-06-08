import clsx from "clsx";
import { useMarketStore } from "../../stores/marketStore";

const labels = {
  connecting: "Conectando",
  connected: "WS online",
  disconnected: "WS offline",
};

export function ConnectionStatus() {
  const connectionStatus = useMarketStore((state) => state.connectionStatus);

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#9CA3AF]">
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          connectionStatus === "connected" && "bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]",
          connectionStatus === "connecting" && "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.9)]",
          connectionStatus === "disconnected" && "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.9)]",
        )}
      />
      {labels[connectionStatus]}
    </div>
  );
}
