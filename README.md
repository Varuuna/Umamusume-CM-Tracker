# Umamusume CM Practice Tracker

Small static web app for tracking Champions Meeting practice room races: click umas in finishing order, get win %, top-3 %, average/best/worst finish and charts automatically.

Data is kept in the browser's `localStorage` (no backend). Use **Export JSON** for a backup and **Import JSON** to restore it.

## Usage

- **Roster:** add umas by name (names must be unique). Double-click to rename. **Retire** hides an uma from entry but keeps its results.
- **Race entry:** click umas in finishing order; anyone not clicked didn't run that race. Keyboard: `1`–`9` pick, `Backspace` undo, `Enter` save, `Esc` clear.
- **Mistakes:** delete the race from the race table and enter it again.
- Stats only count the races each uma actually ran.

## Development

```sh
npm install
npm run dev     # dev server
npm test        # unit tests (Vitest)
npm run build   # type-check + production build
```

## Deploy

`.github/workflows/deploy.yml` builds, tests and publishes to GitHub Pages on every push to `develop` (or manually via "Run workflow"). In the repo settings, set **Pages → Source** to **GitHub Actions**.
