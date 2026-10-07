import { describe, expect, it } from "vitest";
import { perUmaStats, positionDistribution, winTrend } from "./stats";
import { parseState } from "./storage";
import { reducer } from "./state";
import { emptyState, type Race, type Uma } from "./types";

const uma = (id: string): Uma => ({ id, name: id.toUpperCase(), color: "#000", retired: false });
const race = (n: number, order: string[]): Race => ({ id: `r${n}`, createdAt: n, order });

const A = uma("a");
const B = uma("b");
const C = uma("c");
const D = uma("d"); // added late, runs only in later races

const races = [
  race(1, ["a", "b", "c"]),
  race(2, ["b", "a", "c"]),
  race(3, ["a", "c", "b", "d"]),
  race(4, ["d", "c", "a"]), // b sat out
];

describe("perUmaStats", () => {
  const [a, b, c, d] = perUmaStats([A, B, C, D], races);

  it("counts only races the uma ran", () => {
    expect(a.races).toBe(4);
    expect(b.races).toBe(3);
    expect(d.races).toBe(2);
  });

  it("computes wins, top3 and percentages", () => {
    expect(a.wins).toBe(2);
    expect(a.winPct).toBe(0.5);
    expect(a.top3).toBe(4);
    expect(a.top3Pct).toBe(1);
    expect(d.wins).toBe(1);
    expect(d.winPct).toBe(0.5);
    expect(d.top3).toBe(1); // 4th then 1st
  });

  it("computes avg, best and worst", () => {
    expect(a.avg).toBe((1 + 2 + 1 + 3) / 4);
    expect(c.best).toBe(2);
    expect(c.worst).toBe(3);
    expect(d.best).toBe(1);
    expect(d.worst).toBe(4);
  });

  it("returns nulls for an uma with no races", () => {
    const [e] = perUmaStats([uma("e")], races);
    expect(e).toMatchObject({ races: 0, wins: 0, winPct: null, avg: null, best: null, worst: null });
  });

  it("handles empty state", () => {
    expect(perUmaStats([], [])).toEqual([]);
  });
});

describe("positionDistribution", () => {
  it("counts finishes per position up to the largest field", () => {
    const [a, , , d] = positionDistribution([A, B, C, D], races);
    expect(a.counts).toEqual([2, 1, 1, 0]);
    expect(d.counts).toEqual([1, 0, 0, 1]);
    expect(d.races).toBe(2);
  });
});

describe("winTrend", () => {
  it("cumulative: win rate so far, null before first race", () => {
    const t = winTrend([A, D], races, "cumulative");
    expect(t.map((p) => p.race)).toEqual([1, 2, 3, 4]);
    expect(t.map((p) => p.a)).toEqual([1, 0.5, 2 / 3, 0.5]);
    expect(t.map((p) => p.d)).toEqual([null, null, 0, 0.5]);
  });

  it("rolling: win rate over the uma's last N races", () => {
    const t = winTrend([A, B], races, "rolling", 2);
    expect(t.map((p) => p.a)).toEqual([1, 0.5, 0.5, 0.5]);
    // b: L, W, L, (sat out) -> window keeps last 2 races b actually ran
    expect(t.map((p) => p.b)).toEqual([0, 0.5, 0.5, 0.5]);
  });
});

describe("reducer", () => {
  it("rejects duplicate names case-insensitively", () => {
    let s = reducer(emptyState(), { type: "addUma", name: "Oguri Cap" });
    s = reducer(s, { type: "addUma", name: "  oguri   cap " });
    expect(s.umas).toHaveLength(1);
  });

  it("does not delete an uma that has results", () => {
    let s = reducer(emptyState(), { type: "addUma", name: "X" });
    const id = s.umas[0].id;
    s = reducer(s, { type: "addRace", order: [id] });
    expect(reducer(s, { type: "deleteUma", id }).umas).toHaveLength(1);
  });
});

describe("parseState", () => {
  it("accepts a valid state", () => {
    const s = { version: 1, umas: [A, B], races: [race(1, ["a", "b"])] };
    expect(parseState(s)).toEqual(s);
  });

  it.each([
    ["null", null],
    ["wrong version", { version: 2, umas: [], races: [] }],
    ["missing arrays", { version: 1 }],
    ["bad uma", { version: 1, umas: [{ id: 1 }], races: [] }],
    ["unknown uma in race", { version: 1, umas: [A], races: [race(1, ["zzz"])] }],
    ["duplicate in order", { version: 1, umas: [A], races: [race(1, ["a", "a"])] }],
    ["duplicate uma ids", { version: 1, umas: [A, A], races: [] }],
  ])("rejects %s", (_, data) => {
    expect(parseState(data)).toBeNull();
  });
});
