export function splitStockUnits(stockUnits: number, packSize: number) {
  const safeStockUnits = Number.isFinite(stockUnits) ? Math.max(0, stockUnits) : 0;
  const safePackSize = Number.isFinite(packSize) ? Math.max(0, packSize) : 0;

  if (safePackSize <= 0) {
    return { packs: 0, units: safeStockUnits, totalUnits: safeStockUnits, packSize: 0 };
  }

  const packs = Math.floor(safeStockUnits / safePackSize);
  const units = safeStockUnits % safePackSize;
  return { packs, units, totalUnits: safeStockUnits, packSize: safePackSize };
}

