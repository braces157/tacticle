import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { SpecList } from "../components/ui/SpecList";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useSession } from "../context/SessionContext";
import { describeShippingAddress } from "../services/adminApi";
import { profileService } from "../services/storefrontApi";
import type { OrderDetail } from "../types/domain";
import { formatCurrency } from "../utils/currency";

export function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const { user } = useSession();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    profileService
      .getOrderDetail(user.id, orderId)
      .then((nextOrder) => {
        setOrder(nextOrder);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [orderId, user]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!loaded && !order) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Framing order detail…" /></div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20">
        <EmptyState
          title="Order not found"
          body="This order is either unavailable or does not belong to the signed-in account."
          actionLabel="Back to orders"
          actionHref="/orders"
        />
      </div>
    );
  }

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        kicker={order.id}
        title={`Order ${order.status.toLowerCase()}`}
        description={`Placed on ${order.createdAt} and shipping to ${describeShippingAddress(order.shippingAddress)}.`}
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {order.items.map((item) => (
            <article key={item.id} className="surface-card ambient-shadow flex gap-4 rounded-[1.5rem] p-5">
              <img
                src={item.image.src}
                alt={item.image.alt}
                className="h-28 w-28 bg-[var(--color-surface-low)] object-cover"
              />
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h2 className="font-['Manrope'] text-2xl font-bold tracking-[-0.03em]">
                    {item.productName}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {Object.entries(item.selectedOptions)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" / ")}
                  </p>
                </div>
                <div className="flex justify-between text-sm text-[var(--color-muted)]">
                  <span>Qty {item.quantity}</span>
                  <span className="font-['Manrope'] text-lg font-bold text-[var(--color-on-surface)]">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-6">
          <div className="surface-mat rounded-[1.5rem] p-6">
            <h2 className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.03em]">
              Timeline
            </h2>
            <div className="mt-5 space-y-3">
              {order.timeline.map((step) => (
                <div key={step} className="surface-card rounded-xl px-4 py-3 text-sm text-[var(--color-muted)]">
                  {step}
                </div>
              ))}
            </div>
          </div>
          <div className="surface-card ambient-shadow rounded-[1.5rem] p-6">
            <SpecList
              items={[
                { label: "Status", value: order.status },
                { label: "Item count", value: String(order.itemCount) },
                { label: "Shipping", value: describeShippingAddress(order.shippingAddress) },
                { label: "Payment", value: order.paymentStatus },
                { label: "Subtotal", value: formatCurrency(order.subtotal) },
                ...(order.discount > 0
                  ? [{ label: `Promo${order.promoCode ? ` (${order.promoCode})` : ""}`, value: `-${formatCurrency(order.discount)}` }]
                  : []),
                { label: "Total", value: formatCurrency(order.total) },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
