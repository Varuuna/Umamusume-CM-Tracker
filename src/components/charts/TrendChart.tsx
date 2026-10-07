import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { pct } from "../../format";
import { seriesVar } from "../../model/colors";
import { type TrendMode, type TrendPoint, winTrend } from "../../model/stats";
import type { Race, Uma } from "../../model/types";
import { Legend, TooltipBox, axisProps, gridProps, pctTick } from "./common";

export function TrendChart({ umas, races }: { umas: Uma[]; races: Race[] }) {
  const [mode, setMode] = useState<TrendMode>("cumulative");
  const [windowSize, setWindowSize] = useState(20);

  const shown = umas.filter((u) => races.some((r) => r.order.includes(u.id)));
  const data = winTrend(shown, races, mode, windowSize);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Win % over time</h2>
        <div className="trend-controls">
          <div className="segmented" role="group" aria-label="Trend mode">
            <button className={mode === "cumulative" ? "active" : ""} onClick={() => setMode("cumulative")}>
              Cumulative
            </button>
            <button className={mode === "rolling" ? "active" : ""} onClick={() => setMode("rolling")}>
              Rolling
            </button>
          </div>
          {mode === "rolling" && (
            <label>
              last{" "}
              <input
                type="number"
                min={1}
                max={500}
                value={windowSize}
                onChange={(e) => setWindowSize(Math.max(1, Number(e.target.value) || 1))}
              />{" "}
              races
            </label>
          )}
        </div>
      </div>
      {data.length === 0 || shown.length === 0 ? (
        <div className="empty">No results yet.</div>
      ) : (
        <>
          <div className="chart-box">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ left: 0, right: 16, top: 8 }}>
                <CartesianGrid {...gridProps} vertical={false} />
                <XAxis dataKey="race" type="number" domain={[1, "dataMax"]} allowDecimals={false} {...axisProps} />
                <YAxis domain={[0, 1]} tickFormatter={pctTick} width={44} {...axisProps} />
                <Tooltip
                  cursor={{ stroke: "var(--text-3)", strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    const point = payload?.[0]?.payload as TrendPoint | undefined;
                    if (!active || !point) return null;
                    const rows = shown
                      .filter((u) => point[u.id] !== null && point[u.id] !== undefined)
                      .sort((a, b) => (point[b.id] as number) - (point[a.id] as number))
                      .map((u) => ({
                        key: u.id,
                        label: u.name,
                        color: seriesVar(u.color),
                        value: pct(point[u.id] as number),
                      }));
                    return <TooltipBox title={`After race #${point.race}`} rows={rows} />;
                  }}
                />
                {shown.map((u) => (
                  <Line
                    key={u.id}
                    dataKey={u.id}
                    name={u.name}
                    stroke={seriesVar(u.color)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: "var(--surface)", strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Legend items={shown.map((u) => ({ key: u.id, label: u.name, color: seriesVar(u.color) }))} />
        </>
      )}
    </section>
  );
}
