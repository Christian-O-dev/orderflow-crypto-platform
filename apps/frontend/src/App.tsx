import { useEffect } from "react";
import { ResizableDashboard } from "./components/layout/ResizableDashboard";
import { TerminalShell } from "./components/layout/TerminalShell";
import { AlertsPanel } from "./components/market/AlertsPanel";
import { DomTable } from "./components/market/DomTable";
import { MarketHeader } from "./components/market/MarketHeader";
import { TapeTable } from "./components/market/TapeTable";
import { CvdChart } from "./features/charts/CvdChart";
import { PriceChart } from "./features/charts/PriceChart";
import { connectMarketSocket } from "./sockets/marketSocket";

function App() {
  useEffect(() => connectMarketSocket(), []);

  return (
    <TerminalShell>
      <MarketHeader />

      <ResizableDashboard
        alerts={<AlertsPanel />}
        cvd={<CvdChart />}
        dom={<DomTable />}
        price={<PriceChart />}
        tape={<TapeTable />}
      />
    </TerminalShell>
  );
}

export default App;
