"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, PackagePlus, Search } from "lucide-react";

import {
  FeedbackBanner,
  PrimaryButton,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
import { goodsInAction, initialGoodsInActionState } from "@/app/sales/goods-in/actions";

export type GoodsInProduct = {
  id: string;
  name: string;
  stock_units: number;
  low_stock_threshold: number;
  pack_size: number;
};

export function GoodsInForm({ products }: { products: GoodsInProduct[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    goodsInAction,
    initialGoodsInActionState,
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [unitsAdded, setUnitsAdded] = useState("1");

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.name.toLowerCase().includes(q));
  }, [products, query]);

  const added = Math.max(0, Math.trunc(Number(unitsAdded) || 0));
  const newStock = selectedProduct ? selectedProduct.stock_units + added : 0;
  const canSubmit = Boolean(selectedProduct && added > 0 && !pending);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={selectedId} />

      {state.status === "success" ? (
        <FeedbackBanner title={state.title ?? "Stock updated"} body={state.message} />
      ) : null}
      {state.status === "error" ? (
        <FeedbackBanner
          title={state.title ?? "Stock not saved"}
          body={state.message}
          tone="danger"
        />
      ) : null}

      <SectionCard>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
            <PackagePlus className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-950">Choose the product</h2>
            <p className="text-sm text-zinc-600">
              Tap the item that arrived, then enter the number of units received.
            </p>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="sr-only">Search products</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products"
              className={inputClassName("pl-10")}
            />
          </div>
        </label>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {filteredProducts.map((product) => {
            const selected = product.id === selectedId;
            const tone =
              product.stock_units === 0
                ? "danger"
                : product.stock_units <= product.low_stock_threshold
                  ? "warn"
                  : "good";
            return (
              <button
                type="button"
                key={product.id}
                onClick={() => setSelectedId(product.id)}
                className={[
                  "rounded-md border p-3 text-left transition",
                  selected
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{product.name}</div>
                  {selected ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : null}
                </div>
                <div className={selected ? "mt-1 text-sm text-zinc-200" : "mt-1 text-sm text-zinc-600"}>
                  <ProductStockSummary
                    stockUnits={product.stock_units}
                    packSize={product.pack_size}
                  />
                </div>
                {!selected ? (
                  <div className="mt-2">
                    <StatusBadge tone={tone}>
                      {product.stock_units === 0
                        ? "Zero"
                        : product.stock_units <= product.low_stock_threshold
                          ? "Low"
                          : "OK"}
                    </StatusBadge>
                  </div>
                ) : null}
              </button>
            );
          })}
          {filteredProducts.length ? null : (
            <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 sm:col-span-2">
              No products match that search.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-900">Units received</span>
          <input
            name="unitsAdded"
            type="number"
            min={1}
            step={1}
            value={unitsAdded}
            onChange={(event) => setUnitsAdded(event.target.value)}
            className={inputClassName("mt-2")}
            required
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-semibold text-zinc-900">Notes</span>
          <input
            name="notes"
            type="text"
            placeholder="Optional"
            className={inputClassName("mt-2")}
          />
        </label>

        {selectedProduct ? (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="text-sm text-zinc-600">Stock after this update</div>
            <div className="mt-1 text-2xl font-semibold text-zinc-950">{newStock} units</div>
            <div className="mt-2 text-sm text-zinc-600">
              Current stock is {selectedProduct.stock_units} units.
            </div>
          </div>
        ) : null}

        <PrimaryButton type="submit" disabled={!canSubmit} className="mt-4 w-full sm:w-auto">
          {pending ? "Saving stock..." : "Add to stock"}
        </PrimaryButton>
      </SectionCard>
    </form>
  );
}
