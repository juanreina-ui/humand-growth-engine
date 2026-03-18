export function formatCompactNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

