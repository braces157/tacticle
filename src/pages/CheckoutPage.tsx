import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";
import { checkoutService } from "../services/storefrontApi";
import type { CheckoutDraft } from "../types/domain";
import { formatCurrency } from "../utils/currency";
import {
  calculateCheckoutTotals,
  getShippingMethod,
  shippingMethods,
  type ShippingMethod,
} from "../utils/checkoutPricing";

const initialDraft: CheckoutDraft = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  paymentMethod: "Card ending 2148",
  notes: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const [draft, setDraft] = useState<CheckoutDraft>({
    ...initialDraft,
    fullName: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod["id"]>("standard");
  const [cardholderName, setCardholderName] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setDraft((current) => ({
      ...current,
      fullName: current.fullName || user.name,
      email: current.email || user.email,
    }));
    setCardholderName((current) => current || user.name);
  }, [user]);

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16">
        <EmptyState
          title="Checkout needs a selection first"
          body="Your cart is currently empty, so there is nothing to submit for assembly."
          actionLabel="Return to cart"
          actionHref="/cart"
        />
      </div>
    );
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const { shipping, tax, total } = calculateCheckoutTotals(subtotal, itemCount, shippingMethod);
  const activeShippingMethod = getShippingMethod(shippingMethod);

  function updateField<K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    setSubmitError("");

    for (const field of ["fullName", "email", "address", "city", "postalCode", "country"] as const) {
      if (!draft[field].trim()) {
        nextErrors[field] = "This field is required.";
      }
    }

    if (!cardholderName.trim()) {
      nextErrors.cardholderName = "Cardholder name is required.";
    }
    if (cardNumber.replace(/\s+/g, "").length < 12) {
      nextErrors.cardNumber = "Enter a valid card number.";
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry.trim())) {
      nextErrors.expiry = "Use MM/YY format.";
    }
    if (!/^\d{3,4}$/.test(cvc.trim())) {
      nextErrors.cvc = "Enter a valid security code.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedCardNumber = cardNumber.replace(/\s+/g, "");
      const order = await checkoutService.submitOrder(
        {
          ...draft,
          paymentMethod: `${activeShippingMethod.label} / Card ending ${normalizedCardNumber.slice(-4)}`,
          notes: [
            draft.notes.trim(),
            `Shipping method: ${activeShippingMethod.label}`,
            `Cardholder: ${cardholderName.trim()}`,
          ]
            .filter(Boolean)
            .join(" | "),
        },
        items,
      );
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (submissionError) {
      setSubmitError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to place the order right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        kicker="Checkout"
        title="Finish the order"
        description="Confirm shipping method, payment details, and the final desk-side summary before placing the order."
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="surface-card rounded-[1.5rem] p-6">
            <p className="eyebrow">Step 01</p>
            <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              Shipping details
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Full name"
                value={draft.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                error={errors.fullName}
              />
              <InputField
                label="Email"
                type="email"
                value={draft.email}
                onChange={(event) => updateField("email", event.target.value)}
                error={errors.email}
              />
            </div>
            <div className="mt-5">
              <InputField
                label="Address"
                value={draft.address}
                onChange={(event) => updateField("address", event.target.value)}
                error={errors.address}
              />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <InputField
                label="City"
                value={draft.city}
                onChange={(event) => updateField("city", event.target.value)}
                error={errors.city}
              />
              <InputField
                label="Postal code"
                value={draft.postalCode}
                onChange={(event) => updateField("postalCode", event.target.value)}
                error={errors.postalCode}
              />
              <InputField
                label="Country"
                value={draft.country}
                onChange={(event) => updateField("country", event.target.value)}
                error={errors.country}
              />
            </div>
          </div>

          <div className="surface-mat rounded-[1.5rem] p-6">
            <p className="eyebrow">Step 02</p>
            <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              Shipping method
            </h2>
            <div className="mt-6 grid gap-3">
              {shippingMethods.map((method) => {
                const active = shippingMethod === method.id;
                const methodShipping = calculateCheckoutTotals(subtotal, itemCount, method.id).shipping;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setShippingMethod(method.id)}
                    className={[
                      "rounded-[1.25rem] px-5 py-4 text-left transition",
                      active
                        ? "bg-[var(--color-on-surface)] text-white"
                        : "bg-white text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{method.label}</p>
                        <p className={active ? "text-white/70" : "text-[var(--color-muted)]"}>
                          {method.description}
                        </p>
                      </div>
                      <span className="font-['Manrope'] text-lg font-bold">
                        {methodShipping ? formatCurrency(methodShipping) : "Free"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface-card rounded-[1.5rem] p-6">
            <p className="eyebrow">Step 03</p>
            <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              Payment details
            </h2>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Cardholder name"
                value={cardholderName}
                onChange={(event) => setCardholderName(event.target.value)}
                error={errors.cardholderName}
              />
              <InputField
                label="Card number"
                inputMode="numeric"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                error={errors.cardNumber}
              />
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              <InputField
                label="Expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
                error={errors.expiry}
              />
              <InputField
                label="Security code"
                inputMode="numeric"
                value={cvc}
                onChange={(event) => setCvc(event.target.value)}
                error={errors.cvc}
              />
              <InputField
                label="Payment summary"
                value={`Card ending ${cardNumber.replace(/\s+/g, "").slice(-4) || "----"}`}
                readOnly
                hint="Your saved payment details appear here."
              />
            </div>
            <div className="mt-5">
              <InputField
                as="textarea"
                label="Notes"
                value={draft.notes}
                onChange={(event) => updateField("notes", event.target.value)}
                hint="Optional delivery notes or special requests."
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Place order"}
            </Button>
            <Link to="/cart">
              <Button variant="secondary">Return to cart</Button>
            </Link>
          </div>
          {submitError ? <p className="text-sm text-[var(--color-error)]">{submitError}</p> : null}
        </form>

        <aside className="surface-mat h-fit rounded-[1.5rem] p-6 lg:sticky lg:top-24">
          <p className="eyebrow">Review</p>
          <h2 className="mt-4 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
            Shipment summary
          </h2>
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-on-surface)]">{item.productName}</p>
                  <p className="text-[var(--color-muted)]">Qty {item.quantity}</p>
                </div>
                <span className="font-['Manrope'] font-bold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="section-divider" />
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Shipping</span>
              <span>{shipping ? formatCurrency(shipping) : "Complimentary"}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Estimated tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between font-['Manrope'] text-xl font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <div className="mt-8 rounded-[1.25rem] bg-white px-5 py-4 text-sm leading-6 text-[var(--color-muted)]">
            <p className="font-semibold text-[var(--color-on-surface)]">{activeShippingMethod.label}</p>
            <p className="mt-1">{activeShippingMethod.description}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
