"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Search, ShoppingCart } from "lucide-react";

import {
  FeedbackBanner,
  PrimaryButton,
  ProductStockSummary,
  SectionCard,
  StatusBadge,
  inputClassName,
} from "@/components/ui";
import {
  initialSaleActionState,
  recordSaleAction,
} from "@/app/sales/sales/new/actions";

export type SaleProduct = {
  id: string;
  name: string;
  stock_units: number;
  low_stock_threshold: number;
  pack_size: number;
  wholesale_price_per_pack: number;
  half_pack_price: number | null;
  retail_price_per_unit: number;
  store_price_per_unit: number;
};

type SaleMode = {
  id: string;
  label: string;
  helper: string;
  saleType: "wholesale" | "retail" | "store";
  saleUnitType: "unit" | "pack" | "half_pack";
};

const saleModes: SaleMode[] = [
  {
    id: "retail-unit",
    label: "Retail units",
    helper: "Most counter sales",
    saleType: "retail",
    saleUnitType: "unit",
  },
  {
    id: "store-unit",
    label: "Store units",
    helper: "Store price per unit",
    saleType: "store",
    saleUnitType: "unit",
  },
  {
    id: "wholesale-pack",
    label: "Wholesale packs",
    helper: "Whole packs only",
    saleType: "wholesale",
    saleUnitType: "pack",
  },
  {
    id: "wholesale-half",
    label: "Half-packs",
    helper: "Wholesale half-pack",
    saleType: "wholesale",
    saleUnitType: "half_pack",
  },
];

export function RecordSaleForm({ products }: { products: SaleProduct[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    recordSaleAction,
    initialSaleActionState,
  );
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "");
  const [modeId, setModeId] = useState(saleModes[0].id);
  const [quantity, setQuantity] = useState("1");

  const selectedProduct = products.find((product) => product.id === selectedId) ?? null;
  const selectedMode = saleModes.find((mode) => mode.id === modeId) ?? saleModes[0];

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.name.toLowerCase().includes(q));
  }, [products, query]);

  const quantityNumber = Math.max(0, Math.trunc(Number(quantity) || 0));
  const preview = selectedProduct
    ? buildPreview(selectedProduct, selectedMode, quantityNumber)
    : null;
  const canSubmit = Boolean(selectedProduct && preview && preview.valid && !pending);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={selectedId} />
      <input type="hidden" name="saleType" value={selectedMode.saleType} />
      <input type="hidden" name="saleUnitType" value={selectedMode.saleUnitType} />

      {state.status === "success" ? (
        <FeedbackBanner title={state.title ?? "Sale recorded"} body={state.message} />
      ) : null}
      {state.status === "error" ? (
        <FeedbackBanner
          title={state.title ?? "Sale not saved"}
          body={state.message}
          tone="danger"
        />
      ) : null}

      <SectionCard>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-950 text-white">
            <ShoppingCart className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-950">Choose the product</h2>
            <p className="text-sm text-zinc-600">
              Search, tap the item, then enter how many were sold.
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
            const low =
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
                    <StatusBadge tone={low}>
                      {product.stock_units === 0
                        ? "Out"
                        : product.stock_units <= product.low_stock_threshold
                          ? "Low"
                          : "In stock"}
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
        <h2 className="text-base font-semibold text-zinc-950">Sale type</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {saleModes.map((mode) => {
            const selected = mode.id === modeId;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setModeId(mode.id)}
                className={[
                  "rounded-md border p-3 text-left transition",
                  selected
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-200 bg-white hover:border-zinc-400",
                ].join(" ")}
              >
                <div className="font-semibold">{mode.label}</div>
                <div className={selected ? "mt-1 text-sm text-zinc-200" : "mt-1 text-sm text-zinc-600"}>
                  {mode.helper}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard>
        <label className="block">
          <span className="text-sm font-semibold text-zinc-900">
            Quantity {selectedMode.saleUnitType === "unit" ? "in units" : selectedMode.saleUnitType === "pack" ? "in packs" : "in half-packs"}
          </span>
          <input
            name="quantity"
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className={inputClassName("mt-2")}
            required
          />
        </label>

        {selectedProduct && preview ? (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm text-zinc-600">Customer pays</div>
                <div className="text-2xl font-semibold text-zinc-950">
                  GHS {preview.revenue.toFixed(2)}
                </div>
              </div>
              <StatusBadge tone={preview.valid ? "good" : "danger"}>
                {preview.valid ? `${preview.stockAfter} units left` : preview.message}
              </StatusBadge>
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              This sale removes {preview.unitsSold} units from stock.
            </div>
          </div>
        ) : null}

        <PrimaryButton type="submit" disabled={!canSubmit} className="mt-4 w-full sm:w-auto">
          {pending ? "Saving sale..." : "Record sale"}
        </PrimaryButton>
      </SectionCard>
    </form>
  );
}

function buildPreview(product: SaleProduct, mode: SaleMode, quantity: number) {
  const halfPackUnits = Math.floor(product.pack_size / 2);
  const unitsSold =
    mode.saleUnitType === "unit"
      ? quantity
      : mode.saleUnitType === "pack"
        ? quantity * product.pack_size
        : quantity * halfPackUnits;

  let unitPrice = product.retail_price_per_unit;
  if (mode.saleType === "store") unitPrice = product.store_price_per_unit;
  if (mode.saleType === "wholesale" && mode.saleUnitType === "pack") {
    unitPrice = product.wholesale_price_per_pack / product.pack_size;
  }
  if (mode.saleType === "wholesale" && mode.saleUnitType === "half_pack") {
    const halfPrice = product.half_pack_price ?? product.wholesale_price_per_pack / 2;
    unitPrice = halfPackUnits > 0 ? halfPrice / halfPackUnits : 0;
  }

  if (quantity <= 0) {
    return { valid: false, message: "Enter quantity", unitsSold: 0, revenue: 0, stockAfter: product.stock_units };
  }
  if (unitsSold <= 0) {
    return { valid: false, message: "Invalid pack size", unitsSold: 0, revenue: 0, stockAfter: product.stock_units };
  }
  if (unitsSold > product.stock_units) {
    return {
      valid: false,
      message: "Not enough stock",
      unitsSold,
      revenue: unitPrice * unitsSold,
      stockAfter: product.stock_units,
    };
  }
  return {
    valid: true,
    message: "Ready",
    unitsSold,
    revenue: unitPrice * unitsSold,
    stockAfter: product.stock_units - unitsSold,
  };
}
