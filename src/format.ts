export const pct = (v: number | null, digits = 1) =>
  v === null ? "–" : `${(v * 100).toFixed(digits)}%`;

export const num = (v: number | null, digits = 2) => (v === null ? "–" : v.toFixed(digits));

export const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
