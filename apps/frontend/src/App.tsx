import { useEffect } from "react";
import { ResizableDashboard } from "./components/layout/ResizableDashboard";
import { TerminalShell } from "./components/layout/TerminalShell";
import { AlertsPanel } from "./components/market/AlertsPanel";
import { LargeTradesPanel } from "./components/market/LargeTradesPanel";
import { LiquidityPanel } from "./components/market/LiquidityPanel";
import { MarketHeader } from "./components/market/MarketHeader";
import { TapeTable } from "./components/market/TapeTable";
import { PriceChart } from "./features/charts/PriceChart";
import { useHistoricalAggTrades } from "./hooks/useHistoricalAggTrades";
import { connectMarketSocket } from "./sockets/marketSocket";

function App() {
  useHistoricalAggTrades();

  useEffect(() => connectMarketSocket(), []);

  return (
    <TerminalShell>
      <MarketHeader />

      <ResizableDashboard
        alerts={<AlertsPanel />}
        dom={<LiquidityPanel />}
        largeTrades={<LargeTradesPanel />}
        price={<PriceChart />}
        tape={<TapeTable />}
      />
    </TerminalShell>
  );
}

export default App;
