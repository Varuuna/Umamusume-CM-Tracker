import { useCallback, useEffect, useState } from "react";
import { seriesVar } from "../model/colors";
import type { Uma } from "../model/types";
import { ordinal } from "../format";

type Props = {
  umas: Uma[];
  raceNumber: number;
  onSave: (order: string[]) => void;
};

const KEYS = "123456789";

export function RaceEntry({ umas, raceNumber, onSave }: Props) {
  const active = umas.filter((u) => !u.retired);
  const [picked, setPicked] = useState<string[]>([]);

  // Drop picks for umas that were retired or deleted meanwhile.
  const activeIds = active.map((u) => u.id).join();
  useEffect(() => {
    setPicked((p) => p.filter((id) => activeIds.split(",").includes(id)));
  }, [activeIds]);

  const toggle = useCallback(
    (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])),
    [],
  );
  const undo = useCallback(() => setPicked((p) => p.slice(0, -1)), []);
  const clear = useCallback(() => setPicked([]), []);
  const save = useCallback(() => {
    if (picked.length === 0) return;
    onSave(picked);
    setPicked([]);
  }, [picked, onSave]);

  // Keyboard: 1-9 pick, Backspace undo, Escape clear, Enter save (ignored while typing in inputs).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select") || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = KEYS.indexOf(e.key);
      if (k !== -1 && k < active.length) {
        e.preventDefault();
        toggle(active[k].id);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape") {
        clear();
      } else if (e.key === "Enter" && !t.closest("button")) {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, toggle, undo, clear, save]);

  const nameOf = (id: string) => umas.find((u) => u.id === id);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Race #{raceNumber}</h2>
        <span className="hint">
          Click umas in finishing order. Unclicked = didn't run. Keys: 1–9 pick · Backspace undo ·
          Enter save · Esc clear
        </span>
      </div>

      {active.length === 0 ? (
        <div className="empty">Add umas to the roster to start entering races.</div>
      ) : (
        <div className="uma-buttons">
          {active.map((u, i) => {
            const place = picked.indexOf(u.id);
            return (
              <button
                key={u.id}
                className={`uma-btn${place !== -1 ? " picked" : ""}`}
                onClick={() => toggle(u.id)}
                aria-pressed={place !== -1}
              >
                <span className="swatch" style={{ background: seriesVar(u.color) }} />
                {place !== -1 && <span className="place">{ordinal(place + 1)}</span>}
                <span>{u.name}</span>
                {i < KEYS.length && <span className="key">{KEYS[i]}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="order-preview" aria-live="polite">
        {picked.length === 0 ? (
          <span className="muted">No finishers picked yet.</span>
        ) : (
          picked.map((id, i) => {
            const u = nameOf(id);
            return (
              <span className="chip" key={id}>
                <strong>{i + 1}.</strong>
                {u && <span className="swatch" style={{ background: seriesVar(u.color) }} />}
                {u?.name}
              </span>
            );
          })
        )}
      </div>

      <div className="entry-actions">
        <button className="primary" onClick={save} disabled={picked.length === 0}>
          Save race ({picked.length} {picked.length === 1 ? "runner" : "runners"})
        </button>
        <button onClick={undo} disabled={picked.length === 0}>
          Undo
        </button>
        <button onClick={clear} disabled={picked.length === 0}>
          Clear
        </button>
      </div>
    </section>
  );
}
