"use client";

import { useEffect, useMemo, useState } from "react";

function toNonNegativeInt(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

export function StockFields({
  packSizeInputId = "packSize",
  initialPacks = 0,
  initialPieces = 0,
  packsName = "stockPacks",
  piecesName = "stockPieces",
}: {
  packSizeInputId?: string;
  initialPacks?: number;
  initialPieces?: number;
  packsName?: string;
  piecesName?: string;
}) {
  const [packSize, setPackSize] = useState(0);
  const [packs, setPacks] = useState(initialPacks);
  const [pieces, setPieces] = useState(initialPieces);

  useEffect(() => {
    const el = document.getElementById(packSizeInputId) as
      | HTMLInputElement
      | null;
    if (!el) return;

    const sync = () => setPackSize(toNonNegativeInt(el.value));
    sync();

    el.addEventListener("input", sync);
    return () => el.removeEventListener("input", sync);
  }, [packSizeInputId]);

  const totalUnits = useMemo(
    () => packs * packSize + pieces,
    [packs, packSize, pieces],
  );

  return (
    <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-700" htmlFor="stockPacks">
          Stock (packs)
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          id="stockPacks"
          name={packsName}
          type="number"
          min={0}
          step={1}
          value={packs}
          onChange={(e) => setPacks(toNonNegativeInt(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-700" htmlFor="stockPieces">
          Stock (pieces)
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          id="stockPieces"
          name={piecesName}
          type="number"
          min={0}
          step={1}
          value={pieces}
          onChange={(e) => setPieces(toNonNegativeInt(e.target.value))}
        />
        {packSize > 0 ? (
          <div className="text-xs text-zinc-500">Must be &lt; {packSize}.</div>
        ) : null}
      </div>

      <div className="md:col-span-2 text-xs text-zinc-600">
        {packSize > 0 ? (
          <>
            Total stock:{" "}
            <span className="font-medium text-zinc-900">{totalUnits}</span>{" "}
            units ({packs} packs × {packSize} + {pieces} pieces)
          </>
        ) : (
          <>Enter a pack size to calculate total stock.</>
        )}
      </div>
    </div>
  );
}

