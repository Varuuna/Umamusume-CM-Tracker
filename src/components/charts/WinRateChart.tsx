import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pct } from "../../format";
import { Legend, TooltipBox, axisProps, gridProps, pctTick } from "./common";

const WIN = "var(--pos-2)";
const TOP3 = "var(--pos-6)";

/** Any row with win/top-3 counts: per-uma stats or per-team stats. */
export type WinRateRow = {
  id: string;
  name: string;
  races: number;
  wins: number;
  winPct: number | null;
  top3: number;
  top3Pct: number | null;
};

type Props = {
  stats: WinRateRow[];
  title?: string;
  /** Width reserved for the category labels. */
  labelWidth?: number;
  emptyText?: string;
};

export function WinRateChart({
  stats,
  title = "Win % and top-3 %",
  labelWidth = 130,
  emptyText = "No results yet.",
}: Props) {
  const data = stats
    .filter((s) => s.races > 0)
    .sort((a, b) => (b.winPct ?? 0) - (a.winPct ?? 0) || (b.top3Pct ?? 0) - (a.top3Pct ?? 0));

  return (
    <section className="card">
      <h2>{title}</h2>
      {data.length === 0 ? (
        <div className="empty">{emptyText}</div>
      ) : (
        <>
          <div className="chart-box" style={{ height: Math.max(160, data.length * 44 + 40) }}>
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }} barGap={2}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={pctTick} {...axisProps} />
                <YAxis type="category" dataKey="name" width={labelWidth} {...axisProps} />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={({ active, payload }) => {
                    const s = payload?.[0]?.payload as WinRateRow | undefined;
                    if (!active || !s) return null;
                    return (
                      <TooltipBox
                        title={`${s.name} · ${s.races} races`}
                        rows={[
                          { key: "w", label: `Wins (${s.wins})`, color: WIN, value: pct(s.winPct) },
                          { key: "t", label: `Top 3 (${s.top3})`, color: TOP3, value: pct(s.top3Pct) },
                        ]}
                      />
                    );
                  }}
                />
                <Bar dataKey="winPct" name="Win %" fill={WIN} radius={[0, 4, 4, 0]} barSize={14} />
                <Bar dataKey="top3Pct" name="Top 3 %" fill={TOP3} radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend
            items={[
              { key: "w", label: "Win %", color: WIN },
              { key: "t", label: "Top 3 %", color: TOP3 },
            ]}
          />
        </>
      )}
    </section>
  );
}
