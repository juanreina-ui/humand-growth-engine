export function coerceString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

export function coerceNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

export function coerceDateString(v: unknown): string | undefined {
  const s = coerceString(v);
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

export function pickFirstString(
  obj: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const k of keys) {
    const s = coerceString(obj[k]);
    if (s) return s;
  }
  return undefined;
}

