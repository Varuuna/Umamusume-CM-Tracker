export type Uma = {
  id: string;
  name: string;
  color: string;
  retired: boolean;
};

export type Race = {
  id: string;
  createdAt: number;
  /** Uma ids in finishing order; index 0 is 1st place. Umas not listed did not run. */
  order: string[];
};

export type AppState = {
  version: 1;
  umas: Uma[];
  races: Race[];
};

export const emptyState = (): AppState => ({ version: 1, umas: [], races: [] });
