import { Link } from "react-router-dom";
import { EmptyState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";
import { calculateCheckoutTotals } from "../utils/checkoutPricing";

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { shipping, tax, total } = calculateCheckoutTotals(subtotal, itemCount, "standard");

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        kicker="Cart"
        title="Your selected archive"
        description="A soft-surfaced review of the objects you are about to bring into the workspace."
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {items.length ? (
            items.map((item) => (
              <article key={item.id} className="surface-card ambient-shadow flex flex-col gap-5 p-5 md:flex-row">
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  className="h-36 w-full bg-[var(--color-surface-low)] object-cover md:w-40"
                />
                <div className="flex flex-1 flex-col justify-between gap-5">
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
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${item.productName}`}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="surface-mat rounded-full p-2"
                      >
                        <Icon name="minus" className="h-4 w-4" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${item.productName}`}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="surface-mat rounded-full p-2"
                      >
                        <Icon name="plus" className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-['Manrope'] text-xl font-bold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      <Button variant="tertiary" onClick={() => removeItem(item.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="Your cart is empty"
              body="Start with a keyboard or a switch pack, then return here when the set feels right."
              actionLabel="Browse keyboards"
              actionHref="/category/keyboards"
            />
          )}
        </div>

        <aside className="surface-mat h-fit rounded-[1.5rem] p-6 lg:sticky lg:top-24">
          <p className="eyebrow">Summary</p>
          <h2 className="mt-4 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
            Order review
          </h2>
          <div className="mt-8 space-y-4 text-sm text-[var(--color-muted)]">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{itemCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated shipping</span>
              <span>{shipping ? formatCurrency(shipping) : "Complimentary"}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="section-divider" />
            <div className="flex justify-between font-['Manrope'] text-xl font-bold text-[var(--color-on-surface)]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-['Manrope'] text-xl font-bold text-[var(--color-on-surface)]">
              <span>Estimated total</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <p className="rounded-xl bg-white px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
              Secure payment, shipping method selection, and final tax confirmation happen on the next step.
            </p>
          </div>
          <div className="mt-8 grid gap-3">
            <Link to="/checkout">
              <Button className="w-full" disabled={!items.length}>
                Continue to checkout
              </Button>
            </Link>
            <Link to="/category/keyboards">
              <Button variant="secondary" className="w-full">
                Continue browsing
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
