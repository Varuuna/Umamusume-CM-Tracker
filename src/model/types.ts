export type Uma = {
  id: string;
  name: string;
  color: string;
  retired: boolean;
};

/** A named 3-uma lineup. Races reference it by id; members are never copied into races. */
export type Team = {
  id: string;
  name: string;
  /** Exactly TEAM_SIZE distinct uma ids. */
  memberIds: string[];
  retired: boolean;
};

export const TEAM_SIZE = 3;

export type Race = {
  id: string;
  createdAt: number;
  /** Uma ids in finishing order; index 0 is 1st place. Umas not listed did not run. */
  order: string[];
  /** Team composition used for this race. Absent for races recorded without a team. */
  teamId?: string;
};

export type AppState = {
  version: 1;
  umas: Uma[];
  races: Race[];
  teams: Team[];
};

export const emptyState = (): AppState => ({ version: 1, umas: [], races: [], teams: [] });
