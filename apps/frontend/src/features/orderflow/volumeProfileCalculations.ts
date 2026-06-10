import type { VolumeProfileLevel } from "@orderflow/shared";
import type { WindowTrade } from "./windowCalculations";

export function calculateVolumeProfile(
  trades: WindowTrade[],
  tickSize: number
): VolumeProfileLevel[] {
  const buckets = new Map<number, VolumeProfileLevel>();
  let maxTotalVolume = 0;
  let pocPrice: number | null = null;

  for (const trade of trades) {
    // Round to nearest tickSize
    const priceBucket = Math.round(trade.price / tickSize) * tickSize;
    let level = buckets.get(priceBucket);

    if (!level) {
      level = {
        price: priceBucket,
        buyVolume: 0,
        sellVolume: 0,
        totalVolume: 0,
        delta: 0,
        isPoc: false,
      };
      buckets.set(priceBucket, level);
    }

    if (trade.side === "buy") {
      level.buyVolume += trade.quantity;
      level.delta += trade.quantity;
    } else {
      level.sellVolume += trade.quantity;
      level.delta -= trade.quantity;
    }
    level.totalVolume += trade.quantity;

    if (level.totalVolume > maxTotalVolume) {
      maxTotalVolume = level.totalVolume;
      pocPrice = priceBucket;
    }
  }

  // Mark POC
  if (pocPrice !== null) {
    const pocLevel = buckets.get(pocPrice);
    if (pocLevel) {
      pocLevel.isPoc = true;
    }
  }

  return Array.from(buckets.values()).sort((a, b) => b.price - a.price);
}
