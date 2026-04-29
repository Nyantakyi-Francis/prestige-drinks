"use client";

import { useEffect, useMemo, useState } from "react";

function toNonNegativeInt(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

export function StartingStockFields({
  packSizeInputId = "packSize",
}: {
  packSizeInputId?: string;
}) {
  const [packSize, setPackSize] = useState(0);
  const [packs, setPacks] = useState(0);
  const [units, setUnits] = useState(0);

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
    () => packs * packSize + units,
    [packs, packSize, units],
  );

  return (
    <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <label
          className="text-xs font-medium text-zinc-700"
          htmlFor="startingStockPacks"
        >
          Starting Stock (packs)
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          id="startingStockPacks"
          name="startingStockPacks"
          type="number"
          min={0}
          step={1}
          value={packs}
          onChange={(e) => setPacks(toNonNegativeInt(e.target.value))}
        />
      </div>

      <div className="space-y-1">
        <label
          className="text-xs font-medium text-zinc-700"
          htmlFor="startingStockUnits"
        >
          Starting Stock (units)
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
          id="startingStockUnits"
          name="startingStockUnits"
          type="number"
          min={0}
          step={1}
          value={units}
          onChange={(e) => setUnits(toNonNegativeInt(e.target.value))}
        />
      </div>

      <div className="md:col-span-2 text-xs text-zinc-600">
        {packSize > 0 ? (
          <>
            Total starting stock:{" "}
            <span className="font-medium text-zinc-900">{totalUnits}</span>{" "}
            units ({packs} packs × {packSize} + {units} units)
          </>
        ) : (
          <>Enter a pack size to calculate total starting stock.</>
        )}
      </div>
    </div>
  );
}

