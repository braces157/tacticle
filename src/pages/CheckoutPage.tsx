import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/ui/AsyncState";
import { Button, buttonClassName } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";
import { checkoutService } from "../services/storefrontApi";
import type { CheckoutDraft, PromoQuote } from "../types/domain";
import { formatCurrency } from "../utils/currency";
import {
  calculateCheckoutTotals,
  getShippingMethod,
  shippingMethods,
  type ShippingMethod,
} from "../utils/checkoutPricing";

const vietQrConfig = {
  bankId: "VCB",
  accountNo: "1042361535",
  accountName: "Tactile shop",
  template: "compact",
} as const;

const paymentMethods = [
  {
    id: "vietqr",
    label: "VietQR bank transfer",
    description: "Scan the QR and transfer the order amount from your banking app.",
  },
  {
    id: "credit-card",
    label: "Credit card",
    description: "Pay immediately with a saved or new credit card.",
  },
  {
    id: "pay-on-delivery",
    label: "Pay on delivery",
    description: "Confirm the order now and settle the payment when it arrives.",
  },
] as const;

type PaymentMethodId = (typeof paymentMethods)[number]["id"];

const initialDraft: CheckoutDraft = {
  fullName: "",
  email: "",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  paymentMethod: "Credit card",
  notes: "",
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { items, subtotal, clearCart } = useCart();
  const [paymentReference] = useState(() => {
    const now = new Date();
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ].join("");
    const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `TG${timestamp}${randomSuffix}`;
  });
  const [draft, setDraft] = useState<CheckoutDraft>({
    ...initialDraft,
    fullName: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod["id"]>("standard");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("credit-card");
  const [cardholderName, setCardholderName] = useState(user?.name ?? "");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoQuote, setPromoQuote] = useState<PromoQuote | null>(null);
  const [promoError, setPromoError] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

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

  useEffect(() => {
    setPromoQuote((current) => {
      if (!current) {
        return current;
      }

      const normalizedInput = promoCode.trim().toUpperCase();
      if (!normalizedInput || current.code !== normalizedInput) {
        return null;
      }

      return current;
    });
    setPromoError("");
  }, [promoCode, items]);

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
  const appliedDiscount = promoQuote?.discount ?? 0;
  const { discountedSubtotal, shipping, tax } = calculateCheckoutTotals(
    subtotal,
    itemCount,
    shippingMethod,
    appliedDiscount,
  );
  const orderTotal = discountedSubtotal + shipping + tax;
  const activeShippingMethod = getShippingMethod(shippingMethod);
  const selectedPaymentMethod = paymentMethods.find((method) => method.id === paymentMethod) ?? paymentMethods[1];
  const vietQrUrl = new URL(
    `https://img.vietqr.io/image/${vietQrConfig.bankId}-${vietQrConfig.accountNo}-${vietQrConfig.template}.png`,
  );
  vietQrUrl.searchParams.set("amount", String(Math.round(orderTotal)));
  vietQrUrl.searchParams.set("addInfo", paymentReference);
  vietQrUrl.searchParams.set("accountName", vietQrConfig.accountName);
  const amountLabel =
    paymentMethod === "pay-on-delivery"
      ? "Amount due on delivery"
      : paymentMethod === "vietqr"
        ? "Amount to transfer"
        : "Amount charged today";

  function updateField<K extends keyof CheckoutDraft>(key: K, value: CheckoutDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleApplyPromo() {
    const normalizedCode = promoCode.trim();
    if (!normalizedCode) {
      setPromoQuote(null);
      setPromoError("");
      return;
    }

    setApplyingPromo(true);
    setPromoError("");
    try {
      const quote = await checkoutService.quotePromo(items, normalizedCode);
      setPromoQuote(quote);
    } catch (error) {
      setPromoQuote(null);
      setPromoError(
        error instanceof Error ? error.message : "Unable to apply the promo code right now.",
      );
    } finally {
      setApplyingPromo(false);
    }
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

    if (paymentMethod === "credit-card") {
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
      const paymentSummary =
        paymentMethod === "credit-card"
          ? `Credit card / ${activeShippingMethod.label} / Card ending ${normalizedCardNumber.slice(-4)}`
          : paymentMethod === "vietqr"
            ? `VietQR / ${activeShippingMethod.label} / ${vietQrConfig.bankId} ${vietQrConfig.accountNo}`
            : `Pay on delivery / ${activeShippingMethod.label}`;
      const paymentNotes =
        paymentMethod === "credit-card"
          ? [`Cardholder: ${cardholderName.trim()}`]
          : paymentMethod === "vietqr"
            ? [
                `VietQR bank: ${vietQrConfig.bankId}`,
                `VietQR account: ${vietQrConfig.accountNo}`,
                `Transfer reference: ${paymentReference}`,
                `Transfer amount shown at checkout: ${formatCurrency(orderTotal)}`,
              ]
            : ["Payment will be collected on delivery."];
      const order = await checkoutService.submitOrder(
        {
          ...draft,
          paymentMethod: paymentSummary,
          notes: [
            draft.notes.trim(),
            `Shipping method: ${activeShippingMethod.label}`,
            ...paymentNotes,
          ]
            .filter(Boolean)
            .join(" | "),
        },
        items,
        promoQuote?.code ?? null,
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
            <div className="surface-mat mt-6 grid gap-3 rounded-[1.25rem] p-3">
              {paymentMethods.map((method) => {
                const active = paymentMethod === method.id;

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={[
                      "rounded-[1.25rem] px-5 py-4 text-left transition",
                      active
                        ? "bg-[var(--color-on-surface)] text-white"
                        : "bg-white text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    <p className="font-semibold">{method.label}</p>
                    <p className={active ? "mt-1 text-white/70" : "mt-1 text-[var(--color-muted)]"}>
                      {method.description}
                    </p>
                  </button>
                );
              })}
            </div>
            {paymentMethod === "credit-card" ? (
              <>
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
              </>
            ) : null}
            {paymentMethod === "vietqr" ? (
              <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="overflow-hidden rounded-[1.25rem] bg-white p-4">
                  <img
                    src={vietQrUrl.toString()}
                    alt="VietQR payment for Tactile shop"
                    className="mx-auto aspect-square w-full max-w-sm rounded-2xl object-contain"
                  />
                </div>
                <div className="rounded-[1.25rem] bg-[var(--color-surface-alt)] p-5 text-sm leading-6 text-[var(--color-muted)]">
                  <p className="font-semibold text-[var(--color-on-surface)]">{selectedPaymentMethod.label}</p>
                  <p className="mt-1">
                    Scan this QR with your banking app and transfer the full order total shown here.
                  </p>
                  <div className="mt-4 space-y-2">
                    <p>
                      <span className="font-semibold text-[var(--color-on-surface)]">Bank:</span> {vietQrConfig.bankId}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--color-on-surface)]">Account number:</span> {vietQrConfig.accountNo}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--color-on-surface)]">Account name:</span> {vietQrConfig.accountName}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--color-on-surface)]">Transfer amount:</span> {formatCurrency(orderTotal)}
                    </p>
                    <p>
                      <span className="font-semibold text-[var(--color-on-surface)]">Transfer note:</span> {paymentReference}
                    </p>
                  </div>
                  <p className="mt-4 rounded-[1rem] bg-white px-4 py-3 text-sm leading-6 text-[var(--color-muted)] ghost-border">
                    Include the transfer note exactly as shown so the receiving account can match your payment quickly.
                  </p>
                </div>
              </div>
            ) : null}
            {paymentMethod === "pay-on-delivery" ? (
              <div className="mt-6 rounded-[1.25rem] bg-[var(--color-surface-alt)] p-5 text-sm leading-6 text-[var(--color-muted)]">
                <p className="font-semibold text-[var(--color-on-surface)]">{selectedPaymentMethod.label}</p>
                <p className="mt-1">
                  We will confirm the order now and collect the full order total when the parcel arrives.
                </p>
                <p className="mt-3">
                  Keep your delivery phone number and address accurate so the courier can complete handoff without delay.
                </p>
              </div>
            ) : null}
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

          <div className="surface-mat rounded-[1.5rem] p-6">
            <p className="eyebrow">Step 04</p>
            <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              Promo code
            </h2>
            <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <InputField
                label="Promotion"
                value={promoCode}
                onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                placeholder="WELCOME10"
                hint={promoQuote?.description ?? "Apply a code before placing the order."}
                error={promoError || undefined}
              />
              <Button
                type="button"
                onClick={handleApplyPromo}
                disabled={applyingPromo}
                className="md:self-center"
              >
                {applyingPromo ? "Applying…" : "Apply code"}
              </Button>
            </div>
            {promoQuote?.code ? (
              <div className="mt-4 rounded-[1.25rem] bg-white px-5 py-4 text-sm leading-6 text-[var(--color-muted)]">
                <p className="font-semibold text-[var(--color-on-surface)]">
                  {promoQuote.code} applied
                </p>
                <p className="mt-1">
                  Discount unlocked: {formatCurrency(promoQuote.discount)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Place order"}
            </Button>
            <Link to="/cart" className={buttonClassName("secondary")}>
              Return to cart
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
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {promoQuote?.discount ? (
              <div className="flex justify-between text-sm text-[var(--color-muted)]">
                <span>Promo ({promoQuote.code})</span>
                <span>-{formatCurrency(promoQuote.discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Shipping</span>
              <span>{shipping ? formatCurrency(shipping) : "Complimentary"}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Estimated tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Merchandise total</span>
              <span>{formatCurrency(discountedSubtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[var(--color-muted)]">
              <span>Order total</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
            <div className="flex items-center justify-between font-['Manrope'] text-xl font-bold">
              <span>{amountLabel}</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
          </div>
          <div className="mt-8 rounded-[1.25rem] bg-white px-5 py-4 text-sm leading-6 text-[var(--color-muted)]">
            <p className="font-semibold text-[var(--color-on-surface)]">{activeShippingMethod.label}</p>
            <p className="mt-1">{activeShippingMethod.description}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
            Shipping and tax are included in the checkout total shown above for the selected payment method.
          </p>
        </aside>
      </div>
    </section>
  );
}
