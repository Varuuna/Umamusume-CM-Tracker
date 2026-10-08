import { nextColor } from "./colors";
import { type AppState, TEAM_SIZE, emptyState } from "./types";

export type Action =
  | { type: "addUma"; name: string }
  | { type: "renameUma"; id: string; name: string }
  | { type: "toggleRetire"; id: string }
  | { type: "deleteUma"; id: string }
  | { type: "addTeam"; memberIds: string[]; name?: string }
  | { type: "renameTeam"; id: string; name: string }
  | { type: "toggleRetireTeam"; id: string }
  | { type: "deleteTeam"; id: string }
  | { type: "addRace"; order: string[]; teamId?: string }
  | { type: "setRaceTeam"; raceId: string; teamId: string | null }
  | { type: "deleteRace"; id: string }
  | { type: "clearAll" }
  | { type: "importState"; state: AppState };

const newId = () => crypto.randomUUID();

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export function isNameTaken(state: AppState, name: string, exceptId?: string): boolean {
  const key = normalizeName(name).toLowerCase();
  return state.umas.some((u) => u.id !== exceptId && u.name.toLowerCase() === key);
}

const memberKey = (ids: string[]) => [...ids].sort().join();

/** True if a team with exactly these members (in any order) already exists. */
export function isLineupTaken(state: AppState, memberIds: string[]): boolean {
  const key = memberKey(memberIds);
  return state.teams.some((t) => memberKey(t.memberIds) === key);
}

/** Default team name: member names joined with " + ". */
export function defaultTeamName(state: AppState, memberIds: string[]): string {
  return memberIds.map((id) => state.umas.find((u) => u.id === id)?.name ?? "?").join(" + ");
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "addUma": {
      const name = normalizeName(action.name);
      if (!name || isNameTaken(state, name)) return state;
      const color = nextColor(state.umas.map((u) => u.color));
      return { ...state, umas: [...state.umas, { id: newId(), name, color, retired: false }] };
    }
    case "renameUma": {
      const name = normalizeName(action.name);
      if (!name || isNameTaken(state, name, action.id)) return state;
      return { ...state, umas: state.umas.map((u) => (u.id === action.id ? { ...u, name } : u)) };
    }
    case "toggleRetire":
      return {
        ...state,
        umas: state.umas.map((u) => (u.id === action.id ? { ...u, retired: !u.retired } : u)),
      };
    case "deleteUma":
      // Only umas without any results or team membership can be deleted; otherwise retire them.
      if (state.races.some((r) => r.order.includes(action.id))) return state;
      if (state.teams.some((t) => t.memberIds.includes(action.id))) return state;
      return { ...state, umas: state.umas.filter((u) => u.id !== action.id) };
    case "addTeam": {
      const memberIds = [...new Set(action.memberIds)];
      if (memberIds.length !== TEAM_SIZE) return state;
      if (!memberIds.every((id) => state.umas.some((u) => u.id === id))) return state;
      if (isLineupTaken(state, memberIds)) return state;
      const name = normalizeName(action.name ?? "") || defaultTeamName(state, memberIds);
      return { ...state, teams: [...state.teams, { id: newId(), name, memberIds, retired: false }] };
    }
    case "renameTeam": {
      const name = normalizeName(action.name);
      if (!name) return state;
      return { ...state, teams: state.teams.map((t) => (t.id === action.id ? { ...t, name } : t)) };
    }
    case "toggleRetireTeam":
      return {
        ...state,
        teams: state.teams.map((t) => (t.id === action.id ? { ...t, retired: !t.retired } : t)),
      };
    case "deleteTeam":
      if (state.races.some((r) => r.teamId === action.id)) return state;
      return { ...state, teams: state.teams.filter((t) => t.id !== action.id) };
    case "addRace": {
      const order = [...new Set(action.order)].filter((id) => state.umas.some((u) => u.id === id));
      if (order.length === 0) return state;
      const teamId = state.teams.some((t) => t.id === action.teamId) ? action.teamId : undefined;
      const race = { id: newId(), createdAt: Date.now(), order, ...(teamId && { teamId }) };
      return { ...state, races: [...state.races, race] };
    }
    case "setRaceTeam": {
      const { teamId } = action;
      if (teamId !== null && !state.teams.some((t) => t.id === teamId)) return state;
      return {
        ...state,
        races: state.races.map((r) => {
          if (r.id !== action.raceId) return r;
          const { teamId: _, ...rest } = r;
          return teamId === null ? rest : { ...rest, teamId };
        }),
      };
    }
    case "deleteRace":
      return { ...state, races: state.races.filter((r) => r.id !== action.id) };
    case "clearAll":
      return emptyState();
    case "importState":
      return action.state;
  }
}
