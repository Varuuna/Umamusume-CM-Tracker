import { type AppState, emptyState } from "./types";

export const STORAGE_KEY = "cm-tracker:v1";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Validates unknown data (from storage or an imported file). Returns null if invalid. */
export function parseState(data: unknown): AppState | null {
  if (!isObj(data) || data.version !== 1) return null;
  const { umas, races } = data;
  if (!Array.isArray(umas) || !Array.isArray(races)) return null;

  const umasOk = umas.every(
    (u) =>
      isObj(u) &&
      typeof u.id === "string" &&
      typeof u.name === "string" &&
      typeof u.color === "string" &&
      typeof u.retired === "boolean",
  );
  if (!umasOk) return null;

  const ids = new Set(umas.map((u: { id: string }) => u.id));
  if (ids.size !== umas.length) return null;

  const racesOk = races.every(
    (r) =>
      isObj(r) &&
      typeof r.id === "string" &&
      typeof r.createdAt === "number" &&
      Array.isArray(r.order) &&
      r.order.length > 0 &&
      r.order.every((id) => typeof id === "string" && ids.has(id)) &&
      new Set(r.order).size === r.order.length,
  );
  if (!racesOk) return null;

  return data as AppState;
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return parseState(JSON.parse(raw)) ?? emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep working with in-memory state.
  }
}
