# Budgette

A Vite + React + TypeScript monthly spending dashboard for tracking available monthly money, expenses, rollover, and daily spending pace.

## Tech

- Vite
- React
- TypeScript
- Tailwind CSS
- Recharts
- date-fns
- localStorage persistence

## Run Locally

You need Node.js 20.19 or newer. The app is just a project folder; dependencies are installed from `package.json` and `package-lock.json`.

```bash
npm install
npm run dev
```

Then open the local URL Vite prints, usually:

```text
http://localhost:5173/
```

## Build

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Data

Budget months and expenses are stored in browser `localStorage` under `budgette:v1`.
New installs start with an empty budget. Data stays in the browser unless it is exported or restored with the backup tools in the app.

## Sharing

Send the project folder without `node_modules`, `dist`, or `backups`. Your friend can unzip or clone it, then run:

```bash
npm install
npm run dev
```
