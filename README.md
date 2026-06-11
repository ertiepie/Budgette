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

## Data

Budget months and expenses are stored in browser `localStorage` under `budgette:v1`.
The app ships with sample seed data for the previous, current, and next month. Use **Reset sample data** in the dashboard to restore it.
