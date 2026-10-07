import { nextColor } from "./colors";
import { type AppState, emptyState } from "./types";

export type Action =
  | { type: "addUma"; name: string }
  | { type: "renameUma"; id: string; name: string }
  | { type: "toggleRetire"; id: string }
  | { type: "deleteUma"; id: string }
  | { type: "addRace"; order: string[] }
  | { type: "deleteRace"; id: string }
  | { type: "clearAll" }
  | { type: "importState"; state: AppState };

const newId = () => crypto.randomUUID();

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export function isNameTaken(state: AppState, name: string, exceptId?: string): boolean {
  const key = normalizeName(name).toLowerCase();
  return state.umas.some((u) => u.id !== exceptId && u.name.toLowerCase() === key);
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
      // Only umas without any results can be deleted; otherwise retire them.
      if (state.races.some((r) => r.order.includes(action.id))) return state;
      return { ...state, umas: state.umas.filter((u) => u.id !== action.id) };
    case "addRace": {
      const order = [...new Set(action.order)].filter((id) => state.umas.some((u) => u.id === id));
      if (order.length === 0) return state;
      return { ...state, races: [...state.races, { id: newId(), createdAt: Date.now(), order }] };
    }
    case "deleteRace":
      return { ...state, races: state.races.filter((r) => r.id !== action.id) };
    case "clearAll":
      return emptyState();
    case "importState":
      return action.state;
  }
}
