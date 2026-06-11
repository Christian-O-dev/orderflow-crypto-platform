import { MARKET_CONFIG } from "../config/marketConfig.js";
import { BinanceKlineHistoryService } from "../exchanges/binance/BinanceKlineHistoryService.js";
import { telegramService } from "../services/TelegramService.js";
import type { WhaleLiquidityLevel } from "../whale-engine/WhaleOrderEngine.js";

type Timeframe = "1h" | "4h" | "1d";

export class MarketBiasTracker {
  private klineService = new BinanceKlineHistoryService();
  private intervalId?: NodeJS.Timeout;
  private lastMessages: Record<Timeframe, string> = {
    "1h": "",
    "4h": "",
    "1d": "",
  };

  constructor(
    private getWhaleOrders: () => WhaleLiquidityLevel[]
  ) {}

  start() {
    if (this.intervalId) return;
    
    // Check every 1 minute
    this.intervalId = setInterval(() => {
      this.checkTimeframes().catch(console.error);
    }, 60_000);
    
    // Run immediately
    this.checkTimeframes().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async checkTimeframes() {
    const symbol = MARKET_CONFIG.symbol;

    try {
      // Fetch 1h rolling (last 60 1m candles)
      const candles1h = await this.klineService.getCandles({ symbol, interval: "1m", limit: 60 });
      // Fetch 4h rolling (last 240 1m candles)
      const candles4h = await this.klineService.getCandles({ symbol, interval: "1m", limit: 240 });
      // Fetch 1d rolling (last 24 1h candles)
      const candles1d = await this.klineService.getCandles({ symbol, interval: "1h", limit: 24 });

      this.processTimeframe("1h", candles1h);
      this.processTimeframe("4h", candles4h);
      this.processTimeframe("1d", candles1d);
      
      console.log(`[MarketBiasTracker] Verificación completada para 1h, 4h, 1d.`);
    } catch (error) {
      console.error("MarketBiasTracker failed to fetch candles:", error);
    }
  }

  private processTimeframe(timeframe: Timeframe, candles: any[]) {
    let delta = 0;
    
    for (const candle of candles) {
      const buyVol = candle.takerBuyBaseVolume;
      const sellVol = candle.volume - candle.takerBuyBaseVolume;
      delta += (buyVol - sellVol);
    }

    const whaleOrders = this.getWhaleOrders();
    let activeBidLiquidityUsd = 0;
    let activeAskLiquidityUsd = 0;

    for (const level of whaleOrders) {
      if (level.status !== "active") continue;
      if (level.side === "bid") {
        activeBidLiquidityUsd += level.notionalUsd;
      } else {
        activeAskLiquidityUsd += level.notionalUsd;
      }
    }

    const dominantSide = delta > 0 ? "buy" : delta < 0 ? "sell" : "neutral";

    let marketBias = "neutral";
    if (dominantSide === "buy") {
      if (activeAskLiquidityUsd > activeBidLiquidityUsd * 2) {
        marketBias = "mixed";
      } else {
        marketBias = "bullish";
      }
    } else if (dominantSide === "sell") {
      if (activeBidLiquidityUsd > activeAskLiquidityUsd * 2) {
        marketBias = "mixed";
      } else {
        marketBias = "bearish";
      }
    }

    let message = "";
    if (marketBias === "bullish") {
      message = "Fuerte agresión compradora. Delta dominando al alza.";
    } else if (marketBias === "bearish") {
      message = "Fuerte agresión vendedora. Delta dominando a la baja.";
    } else if (marketBias === "mixed") {
      if (dominantSide === "buy") {
        message = "Presión compradora en la ventana, pero existe liquidez ask relevante por encima.";
      } else {
        message = "Presión vendedora en la ventana, pero existe fuerte liquidez bid por debajo.";
      }
    } else {
      message = "Contexto mixto o de consolidación. Sin sesgo direccional agresivo en esta ventana.";
    }

    const lastMessage = this.lastMessages[timeframe];
    
    // Si es diferente y no está vacío, enviar alerta (incluso la primera vez)
    if (lastMessage !== message && message !== "") {
      this.sendAlert(timeframe, message);
    }

    this.lastMessages[timeframe] = message;
  }

  private sendAlert(timeframe: string, message: string) {
    const telegramMessage = `<b>[${timeframe}] Cambio de Tendencia / Presión</b>\n<i>${message}</i>`;
    telegramService.sendMessage(telegramMessage).catch(console.error);
    console.log(`[MarketBiasTracker] Emitted alert for ${timeframe}: ${message}`);
  }
}
