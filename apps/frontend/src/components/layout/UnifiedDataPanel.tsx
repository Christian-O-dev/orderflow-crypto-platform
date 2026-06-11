import { useState, useRef } from "react";
import { DomTable } from "../market/DomTable";
import { WhaleOrdersPanel } from "../market/WhaleOrdersPanel";
import { LiquidityMapPanel } from "../market/LiquidityMapPanel";
import { LargeTradesPanel } from "../market/LargeTradesPanel";
import { TapeTable } from "../market/TapeTable";
import { DepthRangeSelector } from "../market/DepthRangeSelector";

type UnifiedView = "whaleOrders" | "dom" | "heatmap" | "largeTrades" | "tape";

export function UnifiedDataPanel() {
  const [activeTab, setActiveTab] = useState<UnifiedView>("whaleOrders");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const getTitle = () => {
    switch (activeTab) {
      case "whaleOrders": return "Whale Orders";
      case "dom": return "DOM";
      case "heatmap": return "Heatmap";
      case "largeTrades": return "Large Trades";
      case "tape": return "Tape (Time & Sales)";
    }
  };

  const handleSelect = (view: UnifiedView) => {
    setActiveTab(view);
    if (detailsRef.current) {
      detailsRef.current.removeAttribute("open");
    }
  };

  return (
    <section className="flex flex-col overflow-hidden bg-[#111827]/90 h-full w-full">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 bg-[#131722]">
        <div className="flex items-center gap-4">
          <details ref={detailsRef} className="relative group w-max">
            <summary className="list-none cursor-pointer text-[#D1D4DC] hover:bg-[#2A2E39] rounded px-3 py-1 text-[13px] font-medium flex items-center gap-1 w-max">
              {getTitle()}
              <span className="text-[10px] text-[#787B86] ml-1">▼</span>
            </summary>
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#1E222D] border border-white/10 rounded shadow-xl z-50 p-1 flex flex-col gap-0.5">
              <button 
                type="button"
                onClick={() => handleSelect("whaleOrders")} 
                className={`text-left px-3 py-1.5 text-[12px] rounded ${activeTab === "whaleOrders" ? "bg-[#2962FF] text-white" : "text-[#D1D4DC] hover:bg-[#2A2E39]"}`}
              >
                Whale Orders
              </button>
              <button 
                type="button"
                onClick={() => handleSelect("dom")} 
                className={`text-left px-3 py-1.5 text-[12px] rounded ${activeTab === "dom" ? "bg-[#2962FF] text-white" : "text-[#D1D4DC] hover:bg-[#2A2E39]"}`}
              >
                DOM
              </button>
              <button 
                type="button"
                onClick={() => handleSelect("heatmap")} 
                className={`text-left px-3 py-1.5 text-[12px] rounded ${activeTab === "heatmap" ? "bg-[#2962FF] text-white" : "text-[#D1D4DC] hover:bg-[#2A2E39]"}`}
              >
                Heatmap
              </button>
              <button 
                type="button"
                onClick={() => handleSelect("largeTrades")} 
                className={`text-left px-3 py-1.5 text-[12px] rounded ${activeTab === "largeTrades" ? "bg-[#2962FF] text-white" : "text-[#D1D4DC] hover:bg-[#2A2E39]"}`}
              >
                Large Trades
              </button>
              <button 
                type="button"
                onClick={() => handleSelect("tape")} 
                className={`text-left px-3 py-1.5 text-[12px] rounded ${activeTab === "tape" ? "bg-[#2962FF] text-white" : "text-[#D1D4DC] hover:bg-[#2A2E39]"}`}
              >
                Tape (Time & Sales)
              </button>
            </div>
          </details>
          
          {activeTab === "whaleOrders" && (
            <DepthRangeSelector />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
         {activeTab === "whaleOrders" && <WhaleOrdersPanel />}
         {activeTab === "dom" && <DomTable framed={false} />}
         {activeTab === "heatmap" && <LiquidityMapPanel />}
         {activeTab === "largeTrades" && <LargeTradesPanel />}
         {activeTab === "tape" && <TapeTable />}
      </div>
    </section>
  );
}
