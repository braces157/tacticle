export type ShippingMethod = {
  id: "standard" | "priority" | "white-glove";
  label: string;
  description: string;
  rate: number;
};

export const shippingMethods: ShippingMethod[] = [
  {
    id: "standard",
    label: "Standard courier",
    description: "3-5 business days",
    rate: 18,
  },
  {
    id: "priority",
    label: "Priority dispatch",
    description: "1-2 business days",
    rate: 34,
  },
  {
    id: "white-glove",
    label: "White-glove delivery",
    description: "Concierge handoff and insurance",
    rate: 56,
  },
];

const estimatedTaxRate = 0.07;

export function getShippingMethod(methodId: ShippingMethod["id"]) {
  return shippingMethods.find((method) => method.id === methodId) ?? shippingMethods[0];
}

function calculateShippingEstimate(
  subtotal: number,
  itemCount: number,
  methodId: ShippingMethod["id"],
) {
  const method = getShippingMethod(methodId);
  const itemAdjustment = Math.max(0, itemCount - 1) * 4;

  if (subtotal >= 600 && method.id === "standard") {
    return 0;
  }

  return method.rate + itemAdjustment;
}

function calculateTaxEstimate(subtotal: number) {
  return subtotal * estimatedTaxRate;
}

export function calculateCheckoutTotals(
  subtotal: number,
  itemCount: number,
  methodId: ShippingMethod["id"],
) {
  const shipping = calculateShippingEstimate(subtotal, itemCount, methodId);
  const tax = calculateTaxEstimate(subtotal);
  return {
    shipping,
    tax,
    total: subtotal + shipping + tax,
  };
}
