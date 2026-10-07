import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ordinal, pct } from "../../format";
import { maxFieldSize, positionDistribution } from "../../model/stats";
import type { Race, Uma } from "../../model/types";
import { Legend, TooltipBox, axisProps, gridProps, pctTick, positionColor } from "./common";

type Row = { name: string; races: number; counts: number[] } & Record<string, number | string | number[]>;

export function PositionDistChart({ umas, races }: { umas: Uma[]; races: Race[] }) {
  const field = maxFieldSize(races);
  const positions = Array.from({ length: field }, (_, i) => i + 1);

  const data: Row[] = positionDistribution(umas, races)
    .filter((d) => d.races > 0)
    .map((d) => {
      const row: Row = { name: d.name, races: d.races, counts: d.counts };
      d.counts.forEach((c, i) => (row[`p${i + 1}`] = c / d.races));
      return row;
    })
    // Best average finish on top.
    .sort((a, b) => avgOf(a.counts) - avgOf(b.counts));

  return (
    <section className="card">
      <h2>Finish position distribution</h2>
      {data.length === 0 ? (
        <div className="empty">No results yet.</div>
      ) : (
        <>
          <div className="chart-box" style={{ height: Math.max(160, data.length * 36 + 40) }}>
            <ResponsiveContainer>
              <BarChart data={data} layout="vertical" stackOffset="expand" margin={{ left: 8, right: 16 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" domain={[0, 1]} tickFormatter={pctTick} {...axisProps} />
                <YAxis type="category" dataKey="name" width={130} {...axisProps} />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  content={({ active, payload }) => {
                    const row = payload?.[0]?.payload as Row | undefined;
                    if (!active || !row) return null;
                    return (
                      <TooltipBox
                        title={`${row.name} · ${row.races} races`}
                        rows={positions
                          .filter((p) => row.counts[p - 1] > 0)
                          .map((p) => ({
                            key: String(p),
                            label: ordinal(p),
                            color: positionColor(p, field),
                            value: `${row.counts[p - 1]} · ${pct(row.counts[p - 1] / row.races, 0)}`,
                          }))}
                      />
                    );
                  }}
                />
                {positions.map((p) => (
                  <Bar
                    key={p}
                    dataKey={`p${p}`}
                    stackId="a"
                    fill={positionColor(p, field)}
                    stroke="var(--surface)"
                    strokeWidth={2}
                    barSize={22}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <Legend
            items={positions.map((p) => ({
              key: String(p),
              label: ordinal(p),
              color: positionColor(p, field),
            }))}
          />
        </>
      )}
    </section>
  );
}

function avgOf(counts: number[]) {
  const n = counts.reduce((a, b) => a + b, 0);
  return n ? counts.reduce((a, c, i) => a + c * (i + 1), 0) / n : Infinity;
}
