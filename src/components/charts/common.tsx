import type { ReactNode } from "react";

export const axisProps = {
  stroke: "var(--grid)",
  tick: { fill: "var(--text-2)", fontSize: 12 },
  tickLine: false,
} as const;

export const gridProps = {
  stroke: "var(--grid)",
  strokeDasharray: "0",
} as const;

export const pctTick = (v: number) => `${Math.round(v * 100)}%`;

export type TooltipRow = { key: string; label: string; color: string; value: string };

export function TooltipBox({ title, rows }: { title: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="chart-tooltip">
      <div className="title">{title}</div>
      {rows.map((r) => (
        <div className="row" key={r.key}>
          <span className="swatch" style={{ background: r.color }} />
          <span>{r.label}</span>
          <span className="v">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ items }: { items: { key: string; label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.key}>
          <span className="swatch" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  );
}

/** Ordinal color for finishing position p (1-based) out of a field of n. 1st = strongest. */
export function positionColor(p: number, n: number): string {
  const steps = 8;
  const idx = n <= 1 ? 0 : Math.round(((p - 1) * (steps - 1)) / (n - 1));
  return `var(--pos-${idx + 1})`;
}
