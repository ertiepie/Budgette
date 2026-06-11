export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
