// Validated categorical palette (light-mode steps), assigned in this fixed order.
// Dark-mode steps live in index.css as --series-N; render via seriesVar() so both themes work.
export const PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
];

export function nextColor(used: string[]): string {
  const free = PALETTE.find((c) => !used.includes(c));
  // More than 8 umas: colors repeat; names in legends/tooltips keep identity unambiguous.
  return free ?? PALETTE[used.length % PALETTE.length];
}

/** CSS variable for a stored uma color, so charts follow the light/dark theme. */
export function seriesVar(color: string): string {
  const i = PALETTE.indexOf(color);
  return i === -1 ? color : `var(--series-${i + 1})`;
}
