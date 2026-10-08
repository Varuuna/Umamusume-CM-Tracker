import { describe, expect, it } from "vitest";
import { filterByTeam, perUmaStats, positionDistribution, teamStats, winTrend } from "./stats";
import { parseState } from "./storage";
import { reducer } from "./state";
import { emptyState, type AppState, type Race, type Team, type Uma } from "./types";

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

const T1: Team = { id: "t1", name: "ABC", memberIds: ["a", "b", "c"], retired: false };
const T2: Team = { id: "t2", name: "ABD", memberIds: ["a", "b", "d"], retired: false };

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
  it("accepts a legacy state without teams, adding an empty team list", () => {
    const s = { version: 1, umas: [A, B], races: [race(1, ["a", "b"])] };
    expect(parseState(s)).toEqual({ ...s, teams: [] });
  });

  it("accepts a state with teams and tagged races", () => {
    const s = {
      version: 1,
      umas: [A, B, C],
      teams: [T1],
      races: [race(1, ["a", "b"]), { ...race(2, ["c"]), teamId: "t1" }],
    };
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
    ["team with 2 members", { version: 1, umas: [A, B], races: [], teams: [{ ...T1, memberIds: ["a", "b"] }] }],
    ["team with unknown member", { version: 1, umas: [A, B], races: [], teams: [T1] }],
    [
      "race with unknown team",
      { version: 1, umas: [A, B, C], teams: [T1], races: [{ ...race(1, ["a"]), teamId: "nope" }] },
    ],
  ])("rejects %s", (_, data) => {
    expect(parseState(data)).toBeNull();
  });
});

describe("teamStats", () => {
  const tagged: Race[] = [
    { ...race(1, ["a", "x", "b", "c"]), teamId: "t1" }, // a wins
    { ...race(2, ["x", "y", "c", "a", "b"]), teamId: "t1" }, // best 3rd
    { ...race(3, ["x", "y", "z", "b"]), teamId: "t1" }, // a and c not recorded; best 4th
    { ...race(4, ["c", "a", "b"]), teamId: "t1" }, // c wins
    { ...race(5, ["d", "a", "b"]), teamId: "t2" },
    race(6, ["a", "b", "c"]), // unassigned, ignored
  ];
  const [t1, t2] = teamStats([T1, T2], tagged);

  it("counts only races tagged with the team", () => {
    expect(t1.races).toBe(4);
    expect(t2.races).toBe(1);
  });

  it("counts a team win when any member is 1st", () => {
    expect(t1.wins).toBe(2);
    expect(t1.winPct).toBe(0.5);
    expect(t2.wins).toBe(1);
  });

  it("counts races with at least one member in the top 3", () => {
    expect(t1.top3).toBe(3);
    expect(t1.top3Pct).toBe(0.75);
  });

  it("averages best finisher and combined position over placed members", () => {
    expect(t1.bestAvg).toBe((1 + 3 + 4 + 1) / 4);
    const combined = [(1 + 3 + 4) / 3, (4 + 5 + 3) / 3, 4, (2 + 3 + 1) / 3];
    expect(t1.avgCombined).toBeCloseTo(combined.reduce((a, b) => a + b) / 4);
  });

  it("splits wins by member", () => {
    expect(t1.memberWins).toEqual([
      { umaId: "a", wins: 1 },
      { umaId: "b", wins: 0 },
      { umaId: "c", wins: 1 },
    ]);
  });

  it("returns nulls for a team with no races", () => {
    const [t] = teamStats([T1], []);
    expect(t).toMatchObject({ races: 0, wins: 0, winPct: null, bestAvg: null, avgCombined: null });
  });
});

describe("filterByTeam", () => {
  const rows = [
    { race: { ...race(1, ["a"]), teamId: "t1" }, n: 1 },
    { race: race(2, ["a"]), n: 2 },
    { race: { ...race(3, ["a"]), teamId: "t2" }, n: 3 },
  ];
  it("filters all / unassigned / one team, keeping row numbers", () => {
    expect(filterByTeam(rows, "all").map((r) => r.n)).toEqual([1, 2, 3]);
    expect(filterByTeam(rows, "none").map((r) => r.n)).toEqual([2]);
    expect(filterByTeam(rows, "t2").map((r) => r.n)).toEqual([3]);
  });
});

describe("reducer: teams", () => {
  const setup = (): AppState => {
    let s = emptyState();
    for (const name of ["Tamamo", "Palmer", "Mayano", "Rice"]) s = reducer(s, { type: "addUma", name });
    return s;
  };

  it("adds a team with a default name from its members", () => {
    const s0 = setup();
    const ids = s0.umas.slice(0, 3).map((u) => u.id);
    const s = reducer(s0, { type: "addTeam", memberIds: ids });
    expect(s.teams).toHaveLength(1);
    expect(s.teams[0].name).toBe("Tamamo + Palmer + Mayano");
  });

  it("rejects teams without exactly 3 distinct umas, and duplicate lineups", () => {
    const s0 = setup();
    const [a, b, c] = s0.umas.map((u) => u.id);
    expect(reducer(s0, { type: "addTeam", memberIds: [a, b] }).teams).toHaveLength(0);
    expect(reducer(s0, { type: "addTeam", memberIds: [a, b, b] }).teams).toHaveLength(0);
    const s1 = reducer(s0, { type: "addTeam", memberIds: [a, b, c] });
    expect(reducer(s1, { type: "addTeam", memberIds: [c, a, b] }).teams).toHaveLength(1);
  });

  it("tags races, retags and untags them, and blocks deleting used teams and members", () => {
    const s0 = setup();
    const [a, b, c, d] = s0.umas.map((u) => u.id);
    let s = reducer(s0, { type: "addTeam", memberIds: [a, b, c] });
    s = reducer(s, { type: "addTeam", memberIds: [a, b, d] });
    const [t1, t2] = s.teams.map((t) => t.id);
    s = reducer(s, { type: "addRace", order: [a, b], teamId: t1 });
    s = reducer(s, { type: "addRace", order: [b], teamId: "missing" });
    expect(s.races[0].teamId).toBe(t1);
    expect("teamId" in s.races[1]).toBe(false);

    s = reducer(s, { type: "setRaceTeam", raceId: s.races[1].id, teamId: t2 });
    expect(s.races[1].teamId).toBe(t2);
    s = reducer(s, { type: "setRaceTeam", raceId: s.races[1].id, teamId: null });
    expect("teamId" in s.races[1]).toBe(false);

    expect(reducer(s, { type: "deleteTeam", id: t1 }).teams).toHaveLength(2);
    expect(reducer(s, { type: "deleteTeam", id: t2 }).teams).toHaveLength(1);
    // d has no results but is a member of t2
    expect(reducer(s, { type: "deleteUma", id: d }).umas).toHaveLength(4);
  });
});
