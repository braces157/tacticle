import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { getAdminOrders } from "../services/adminApi";
import type { AdminOrderRecord, OrderStatus } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseOrderDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

const orderStatuses: Array<"All Status" | OrderStatus> = [
  "All Status",
  "Payment Review",
  "Processing",
  "Ready to Ship",
  "Shipped",
  "Delivered",
  "Canceled",
];

function statusTone(status: OrderStatus) {
  switch (status) {
    case "Delivered":
      return "bg-[var(--color-surface-high)] text-[var(--color-muted)]";
    case "Canceled":
      return "bg-[rgba(159,64,61,0.12)] text-[var(--color-error)]";
    case "Payment Review":
      return "bg-[rgba(159,64,61,0.12)] text-[var(--color-error)]";
    case "Ready to Ship":
      return "bg-[rgba(95,94,94,0.08)] text-[var(--color-primary)]";
    case "Shipped":
      return "bg-[rgba(20,23,27,0.08)] text-[var(--color-on-surface)]";
    default:
      return "bg-[rgba(95,94,94,0.08)] text-[var(--color-primary)]";
  }
}

export function AdminOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<AdminOrderRecord[] | null>(null);
  const [error, setError] = useState(false);
  const query = searchParams.get("query") ?? "";
  const statusFilter = searchParams.get("status") ?? "All Status";
  const dateWindow = searchParams.get("dateWindow") ?? "Any Time";

  useEffect(() => {
    getAdminOrders()
      .then(setOrders)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <ErrorState />;
  }

  if (!orders) {
    return <LoadingState label="Loading orders…" />;
  }

  const latestOrderTime = orders.reduce((latest, order) => {
    const timestamp = parseOrderDate(order.createdAt).getTime();
    return timestamp > latest ? timestamp : latest;
  }, 0);

  const filteredOrders = orders.filter((order) => {
    const matchesQuery = !query.trim() || [order.id, order.customerName, order.customerEmail, order.fulfillment]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());

    const matchesStatus = statusFilter === "All Status" || order.status === statusFilter;

    let matchesDate = true;
    if (dateWindow !== "Any Time") {
      const orderTime = parseOrderDate(order.createdAt).getTime();
      const rangeDays =
        dateWindow === "Last 30 Days"
          ? 30
          : dateWindow === "Last 90 Days"
            ? 90
            : 365;
      matchesDate = latestOrderTime - orderTime <= rangeDays * 24 * 60 * 60 * 1000;
    }

    return matchesQuery && matchesStatus && matchesDate;
  });

  function updateFilters(nextValues: { query?: string; status?: string; dateWindow?: string }) {
    const nextParams = new URLSearchParams(searchParams);

    const apply = (key: "query" | "status" | "dateWindow", defaultValue: string) => {
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
    apply("status", "All Status");
    apply("dateWindow", "Any Time");
    setSearchParams(nextParams, { replace: true });
  }

  function resetFilters() {
    setSearchParams({}, { replace: true });
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Orders
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Review customer order history, fulfillment stage, and revenue at a glance.
          </p>
        </div>
      </section>

      <section className="grid gap-4 rounded-[1.25rem] bg-[var(--color-surface-low)] p-5 lg:grid-cols-[1.1fr_0.45fr_0.45fr_auto]">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Search orders
          </span>
          <span className="input-shell flex">
            <input
              value={query}
              onChange={(event) => updateFilters({ query: event.target.value })}
              placeholder="Search by order, customer, email, or fulfillment"
              className="w-full bg-transparent px-4 py-3 outline-none"
            />
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Status
          </span>
          <span className="input-shell flex">
            <select
              value={statusFilter}
              onChange={(event) => updateFilters({ status: event.target.value })}
              className="w-full bg-transparent px-4 py-3 outline-none"
            >
              {orderStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </span>
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Date window
          </span>
          <span className="input-shell flex">
            <select
              value={dateWindow}
              onChange={(event) => updateFilters({ dateWindow: event.target.value })}
              className="w-full bg-transparent px-4 py-3 outline-none"
            >
              <option>Any Time</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
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

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Open Orders</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {filteredOrders.filter((order) => !["Delivered", "Canceled"].includes(order.status)).length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Delivered</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {filteredOrders.filter((order) => order.status === "Delivered").length}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Revenue Tracked</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {formatCurrency(filteredOrders.reduce((sum, order) => sum + order.total, 0))}
          </p>
        </div>
      </section>

      {filteredOrders.length ? (
        <section className="overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="bg-[var(--color-surface-low)]">
                  {["Order", "Customer", "Placed", "Items", "Total", "Status", "Fulfillment"].map((label) => (
                    <th
                      key={label}
                      className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-t border-[rgba(173,179,180,0.12)]">
                    <td className="px-6 py-4">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="text-sm font-semibold text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-[var(--color-muted)]">{order.customerEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-xs">{order.createdAt}</td>
                    <td className="px-6 py-4 text-xs">{order.itemCount}</td>
                    <td className="px-6 py-4 text-xs font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          "inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                          statusTone(order.status),
                        ].join(" ")}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-[var(--color-muted)]">
                      <Link to={`/admin/orders/${order.id}`} className="transition hover:text-[var(--color-primary)]">
                        {order.fulfillment}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No orders match this view"
          body="Try widening the status, date window, or search terms to bring more customer orders back into frame."
          actionLabel="Reset filters"
          actionHref="/admin/orders"
        />
      )}
    </div>
  );
}
