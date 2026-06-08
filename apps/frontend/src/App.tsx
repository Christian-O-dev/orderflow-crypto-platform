import { useEffect } from "react";
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

      <div className="mt-1.5 grid flex-1 gap-1.5 lg:grid-cols-[minmax(220px,0.72fr)_minmax(420px,1.8fr)] 2xl:grid-cols-[minmax(220px,0.68fr)_minmax(520px,1.85fr)_minmax(320px,0.92fr)]">
        <DomTable />

        <div className="grid min-h-0 content-start gap-1">
          <PriceChart />
          <CvdChart />
          <AlertsPanel />
        </div>

        <TapeTable />
      </div>
    </TerminalShell>
  );
}

export default App;
