import { Link } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/AsyncState";
import { Icon } from "../ui/Icon";
import { formatCurrency } from "../../utils/currency";

export function CartDrawer() {
  const { items, isDrawerOpen, subtotal, closeDrawer, removeItem } = useCart();

  return (
    <div
      className={[
        "fixed inset-0 z-50 transition",
        isDrawerOpen ? "pointer-events-auto bg-black/15 opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
      onClick={closeDrawer}
    >
      <aside
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[var(--color-surface)] p-6 transition duration-300",
          isDrawerOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Cart</p>
            <h2 className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.03em]">
              Your archive
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close cart"
            onClick={closeDrawer}
            className="rounded-full p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-low)]"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
          {items.length === 0 ? (
            <EmptyState
              title="Your cart is quiet."
              body="Add a board, a switch pack, or a finishing piece to continue the exhibition."
              actionLabel="Browse keyboards"
              actionHref="/category/keyboards"
            />
          ) : (
            items.map((item) => (
              <div key={item.id} className="surface-card ambient-shadow flex gap-4 p-4">
                <img
                  src={item.image.src}
                  alt={item.image.alt}
                  className="h-24 w-24 bg-[var(--color-surface-low)] object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-['Manrope'] text-lg font-bold tracking-[-0.03em]">
                      {item.productName}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Qty {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <span className="font-['Manrope'] text-lg font-bold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <Button
                      variant="tertiary"
                      onClick={() => removeItem(item.id)}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 ? (
          <div className="mt-6 space-y-4 border-t border-[var(--color-outline)] pt-6">
            <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
              <span>Subtotal</span>
              <span className="font-['Manrope'] text-xl font-bold text-[var(--color-on-surface)]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/cart" onClick={closeDrawer}>
                <Button variant="secondary" className="w-full">
                  View cart
                </Button>
              </Link>
              <Link to="/checkout" onClick={closeDrawer}>
                <Button className="w-full">Checkout</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
