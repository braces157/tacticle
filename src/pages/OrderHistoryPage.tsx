import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Icon } from "../components/ui/Icon";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useSession } from "../context/SessionContext";
import { profileService } from "../services/storefrontApi";
import type { OrderSummary } from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function OrderHistoryPage() {
  const { user } = useSession();
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    profileService
      .getOrders(user.id)
      .then(setOrders)
      .catch(() => setError(true));
  }, [user]);

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        kicker="Orders"
        title="Order history"
        description="Review recent purchases, delivery status, and order totals in one place."
      />
      <div className="mt-12">
        {error ? (
          <ErrorState />
        ) : orders === null ? (
          <LoadingState label="Collecting your order history…" />
        ) : orders.length ? (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="surface-card ambient-shadow flex flex-col gap-4 rounded-[1.5rem] p-6 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="eyebrow">{order.id}</p>
                  <h2 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.03em]">
                    {order.status}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Placed on {order.createdAt} • {order.itemCount} items
                  </p>
                  {order.discount > 0 && order.promoCode ? (
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]">
                      Promo applied: {order.promoCode}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-['Manrope'] text-xl font-bold">
                    {formatCurrency(order.total)}
                  </span>
                  <Icon name="chevron-right" className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No orders yet"
            body="When you place an order, it will appear here with its status and delivery details."
            actionLabel="Browse the gallery"
            actionHref="/"
          />
        )}
      </div>
    </section>
  );
}
