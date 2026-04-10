import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { describeShippingAddress, getAdminOrderDetail, updateAdminOrderStatus } from "../services/adminApi";
import type { AdminOrderDetail, OrderStatus } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminOrderDetailPage() {
  const { orderId = "" } = useParams();
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [nextStatus, setNextStatus] = useState<OrderStatus | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    getAdminOrderDetail(orderId)
      .then((nextOrder) => {
        setOrder(nextOrder);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [orderId]);

  useEffect(() => {
    setNextStatus(order?.allowedNextStatuses[0] ?? "");
    setStatusError("");
  }, [order]);

  if (error) {
    return <ErrorState />;
  }

  if (!loaded) {
    return <LoadingState label="Loading order detail…" />;
  }

  if (!order) {
    return (
      <EmptyState
        title="Order not found"
        body="This admin order detail route does not match an available order in the database."
        actionLabel="Return to orders"
        actionHref="/admin/orders"
      />
    );
  }

  async function handleStatusUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || !nextStatus) {
      return;
    }

    setUpdatingStatus(true);
    setStatusError("");
    try {
      const updatedOrder = await updateAdminOrderStatus(order.id, nextStatus);
      setOrder(updatedOrder);
    } catch (submissionError) {
      setStatusError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to update the order status right now.",
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const allowedNextStatuses = order.allowedNextStatuses ?? [];

  return (
    <div className="page-fade space-y-8">
      <nav className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        <Link to="/admin/orders">Orders</Link>
        <span>/</span>
        <span className="text-[var(--color-primary)]">{order.id}</span>
      </nav>

      <header className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Admin order detail
          </p>
          <h1 className="mt-3 font-['Manrope'] text-5xl font-extrabold tracking-[-0.06em]">
            {order.id}
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
            Review customer details, line items, payment state, and the current
            fulfillment timeline in one workspace.
          </p>
        </div>
        <div className="grid gap-3 rounded-[1.25rem] bg-[var(--color-surface-low)] p-5 text-sm lg:min-w-[320px]">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)]">Placed</span>
            <span className="font-semibold">{order.createdAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)]">Status</span>
            <span className="font-semibold">{order.status}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)]">Payment</span>
            <span className="font-semibold">{order.paymentStatus}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-muted)]">Total</span>
            <span className="font-semibold">{formatCurrency(order.total)}</span>
          </div>
          {order.discount > 0 && order.promoCode ? (
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-muted)]">Promo</span>
              <span className="font-semibold">{order.promoCode}</span>
            </div>
          ) : null}
          <form className="mt-2 space-y-3 border-t border-[rgba(173,179,180,0.12)] pt-4" onSubmit={handleStatusUpdate}>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                Update status
              </span>
              <span className="input-shell flex">
                <select
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
                  disabled={!allowedNextStatuses.length || updatingStatus}
                  className="w-full bg-transparent px-4 py-3 outline-none disabled:text-[var(--color-muted)]"
                >
                  {allowedNextStatuses.length ? (
                    allowedNextStatuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))
                  ) : (
                    <option value="">No further changes available</option>
                  )}
                </select>
              </span>
            </label>
            <button
              type="submit"
              disabled={!nextStatus || updatingStatus || !allowedNextStatuses.length}
              className="button-base button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updatingStatus ? "Updating…" : "Save status"}
            </button>
            {statusError ? <p className="text-xs text-[var(--color-error)]">{statusError}</p> : null}
          </form>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Order items
                </p>
                <h2 className="mt-3 font-['Manrope'] text-2xl font-bold tracking-[-0.04em]">
                  Build contents
                </h2>
              </div>
              <p className="text-sm text-[var(--color-muted)]">{order.itemCount} items</p>
            </div>

            <div className="mt-6 space-y-4">
              {order.items.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[1.25rem] bg-[var(--color-surface-low)] p-4 md:grid-cols-[88px_1fr_auto]"
                >
                  <img
                    src={item.image.src}
                    alt={item.image.alt}
                    className="h-24 w-full rounded-xl object-cover md:h-20 md:w-20"
                  />
                  <div>
                    <p className="text-sm font-semibold">{item.productName}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Quantity {item.quantity}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(item.selectedOptions).map(([label, value]) => (
                        <span
                          key={`${item.id}-${label}`}
                          className="rounded-md bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]"
                        >
                          {label}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-['Manrope'] text-lg font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      {formatCurrency(item.price)} each
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Fulfillment timeline
            </p>
            <div className="mt-6 space-y-4">
              {order.timeline.map((entry, index) => (
                <div key={`${entry}-${index}`} className="flex gap-4">
                  <div className="mt-1 h-3 w-3 rounded-full bg-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-semibold">{entry}</p>
                    <p className="mt-1 text-xs text-[var(--color-muted)]">
                      Step {index + 1} of {order.timeline.length}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] bg-[var(--color-surface-low)] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Customer
            </p>
            <h2 className="mt-3 font-['Manrope'] text-2xl font-bold tracking-[-0.04em]">
              {order.customerName}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{order.customerEmail}</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Shipping address
                </p>
                <p className="mt-2 text-sm leading-7">{describeShippingAddress(order.shippingAddress)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Fulfillment state
                </p>
                <p className="mt-2 text-sm leading-7">{order.fulfillment}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Financials
            </p>
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-muted)]">
                    Promo{order.promoCode ? ` (${order.promoCode})` : ""}
                  </span>
                  <span className="font-semibold">-{formatCurrency(order.discount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)]">Net order total</span>
                <span className="font-semibold">{formatCurrency(order.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--color-muted)]">Payment state</span>
                <span className="font-semibold">{order.paymentStatus}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[rgba(173,179,180,0.12)] pt-4 font-['Manrope'] text-xl font-bold">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
