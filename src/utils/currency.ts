export function formatCurrency(value: number) {
  const hasCents = Math.abs(value % 1) > Number.EPSILON;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(value);
}
