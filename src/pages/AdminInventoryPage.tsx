import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import {
  archiveAdminProduct,
  getAdminInventoryItems,
} from "../services/adminApi";
import type { AdminInventoryItem } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminInventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [items, setItems] = useState<AdminInventoryItem[] | null>(null);
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const query = searchParams.get("query") ?? "";
  const category = searchParams.get("category") ?? "All Categories";
  const stockStatus = searchParams.get("stockStatus") ?? "All Status";

  useEffect(() => {
    Promise.all([
      getAdminInventoryItems({ query, category, stockStatus }),
      getAdminInventoryItems(),
    ])
      .then(([nextItems, allItems]) => {
        setItems(nextItems);
        setAlertCount(allItems.filter((item) => item.status !== "In Stock").length);
        setError(false);
      })
      .catch(() => setError(true));
  }, [category, query, refreshKey, stockStatus]);

  function updateFilters(nextValues: { query?: string; category?: string; stockStatus?: string }) {
    const nextParams = new URLSearchParams(searchParams);

    const apply = (key: "query" | "category" | "stockStatus", defaultValue: string) => {
      const value = nextValues[key];
      if (typeof value !== "string") {
        return;
      }

      const normalized = value.trim();
      if (!normalized || normalized === defaultValue) {
        nextParams.delete(key);
        return;
      }

      nextParams.set(key, normalized);
    };

    apply("query", "");
    apply("category", "All Categories");
    apply("stockStatus", "All Status");
    setSearchParams(nextParams, { replace: true });
  }

  function resetFilters() {
    setSearchParams({}, { replace: true });
  }

  function handleArchive(slug: string) {
    setArchiveTarget(slug);
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setArchiving(true);
    try {
      await archiveAdminProduct(archiveTarget);
      setRefreshKey((current) => current + 1);
    } finally {
      setArchiving(false);
      setArchiveTarget(null);
    }
  }

  if (error) {
    return <ErrorState />;
  }

  if (!items || alertCount === null) {
    return <LoadingState label="Loading inventory…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <div className="rounded-xl border border-[rgba(159,64,61,0.12)] bg-[rgba(159,64,61,0.05)] px-4 py-4 text-sm text-[var(--color-error)]">
        Critical alert: {alertCount} items are low or out of stock.
      </div>

      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Inventory
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Manage products, stock levels, and edit flows for the admin console.
          </p>
        </div>
        <Link to="/admin/products/new">
          <Button>
            <Icon name="plus" className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </section>

      <section className="grid gap-4 rounded-[1.25rem] bg-[var(--color-surface-low)] p-5 lg:grid-cols-[1.1fr_0.45fr_0.45fr_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Search inventory
          </span>
          <span className="input-shell flex">
            <input
              value={query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search by name, subtitle, category, or SKU"
              className="w-full bg-transparent px-4 py-3 outline-none"
            />
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Category
          </span>
          <span className="input-shell flex">
            <select
              value={category}
              onChange={(event) => updateFilters({ category: event.target.value })}
              className="w-full bg-transparent px-4 py-3 outline-none"
            >
              <option>All Categories</option>
              <option>Keyboards</option>
              <option>Accessories</option>
              <option>Custom Parts</option>
            </select>
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Stock status
          </span>
          <span className="input-shell flex">
            <select
              value={stockStatus}
              onChange={(event) => updateFilters({ stockStatus: event.target.value })}
              className="w-full bg-transparent px-4 py-3 outline-none"
            >
              <option>All Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
              <option>Out of Stock</option>
            </select>
          </span>
        </label>
        <button
          type="button"
          onClick={resetFilters}
          className="self-end px-2 pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]"
        >
          Reset Filters
        </button>
      </section>

      {items.length ? (
        <section className="overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[var(--color-surface-low)]">
                  {["Product", "Category", "SKU", "Price", "Stock", "Status", "Actions"].map((label) => (
                    <th
                      key={label}
                      className={[
                        "px-4 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]",
                        label === "Product" ? "w-[40%]" : "",
                        label === "Category" ? "w-[15%]" : "",
                        label === "SKU" ? "w-[10%]" : "",
                        label === "Price" ? "w-[8%] whitespace-nowrap" : "",
                        label === "Stock" ? "w-[7%] whitespace-nowrap" : "",
                        label === "Status" ? "w-[10%] whitespace-nowrap" : "",
                        label === "Actions" ? "w-[10%] whitespace-nowrap text-right" : "",
                      ].join(" ")}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className="border-t border-[rgba(173,179,180,0.12)]">
                    <td className="min-w-0 px-4 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image.src}
                          alt={item.image.alt}
                          className="h-12 w-12 rounded bg-[var(--color-surface-low)] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5">{item.name}</p>
                          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium">{item.category}</td>
                    <td className="min-w-0 px-4 py-4 text-xs text-[var(--color-muted)]">
                      <span className="block truncate" title={item.sku}>
                        {item.sku}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs font-semibold">
                      {formatCurrency(item.price)}
                    </td>
                    <td
                      className={[
                        "whitespace-nowrap px-4 py-4 text-xs font-semibold",
                        item.status !== "In Stock" ? "text-[var(--color-error)]" : "",
                      ].join(" ")}
                    >
                      {item.stock}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={[
                          "inline-flex whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
                          item.status === "In Stock"
                            ? "bg-[var(--color-surface-high)] text-[var(--color-muted)]"
                            : item.status === "Low Stock"
                              ? "bg-[rgba(159,64,61,0.1)] text-[var(--color-error)]"
                              : "bg-[rgba(159,64,61,0.18)] text-[var(--color-error)]",
                        ].join(" ")}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-3 text-[var(--color-muted)]">
                        <Link to={`/admin/products/${item.productSlug}/edit`} aria-label={`Edit ${item.name}`}>
                          <Icon name="edit" className="h-5 w-5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleArchive(item.productSlug)}
                          aria-label={`Archive ${item.name}`}
                        >
                          <Icon name="trash" className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No inventory matches this view"
          body="Try widening the search or resetting the current category and stock filters."
          actionLabel="Return to inventory"
          actionHref="/admin/inventory"
        />
      )}

      <Modal
        open={archiveTarget !== null}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        loading={archiving}
        variant="destructive"
        title="Archive product"
        description={`Are you sure you want to archive ${items.find(i => i.productSlug === archiveTarget)?.name ?? "this product"}? This product will be hidden from the storefront immediately.`}
        confirmLabel="Archive"
      />
    </div>
  );
}
