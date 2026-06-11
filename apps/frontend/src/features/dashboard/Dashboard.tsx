import { useEffect } from "react";
import { ResizableDashboard } from "../../components/layout/ResizableDashboard";
import { TerminalShell } from "../../components/layout/TerminalShell";
import { AlertsPanel } from "../../components/market/AlertsPanel";
import { UnifiedDataPanel } from "../../components/layout/UnifiedDataPanel";
import { MarketHeader } from "../../components/market/MarketHeader";
import { OrderFlowWindowSummaryPanel } from "../../components/market/OrderFlowWindowSummaryPanel";
import { PriceChart } from "../../features/charts/PriceChart";
import { useHistoricalAggTrades } from "../../hooks/useHistoricalAggTrades";
import { connectMarketSocket } from "../../sockets/marketSocket";
import { useAuthStore } from "../../stores/authStore";
import { useNavigate } from "react-router-dom";

export function Dashboard() {
  const { isAuthenticated, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useHistoricalAggTrades();

  useEffect(() => {
    if (isAuthenticated) {
      return connectMarketSocket();
    }
  }, [isAuthenticated]);

  if (isLoading || !isAuthenticated) {
    return (
      <TerminalShell>
        <div className="flex h-full min-h-dvh items-center justify-center">
          <div className="text-cyan-500">Cargando...</div>
        </div>
      </TerminalShell>
    );
  }

  return (
    <TerminalShell>
      <div className="flex justify-between items-center pr-4">
        <MarketHeader />
        <button 
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="rounded border border-red-500/20 bg-red-500/10 px-3 py-1 text-sm text-red-500 hover:bg-red-500/20 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
      <ResizableDashboard
        leftTop={<PriceChart />}
        leftBottom={
          <div className="flex h-full w-full flex-col lg:flex-row gap-2 overflow-hidden bg-[#111827]/90 p-1">
            <div className="flex-1 min-w-0 h-full overflow-hidden border border-white/10">
              <OrderFlowWindowSummaryPanel />
            </div>
            <div className="flex-1 min-w-0 h-full overflow-hidden">
              <AlertsPanel />
            </div>
          </div>
        }
        rightPanel={<UnifiedDataPanel />}
      />
    </TerminalShell>
  );
}
