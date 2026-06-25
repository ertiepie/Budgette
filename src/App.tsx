import { useMemo, useRef, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { AnnualCategoryPlanning } from "./components/AnnualCategoryPlanning";
import { AccountBreakdown } from "./components/AccountBreakdown";
import { BackupRestore } from "./components/BackupRestore";
import { CalendarView } from "./components/CalendarView";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { ExpenseForm } from "./components/ExpenseForm";
import { Ledger } from "./components/Ledger";
import { MonthSetup } from "./components/MonthSetup";
import { MonthlyTotals } from "./components/MonthlyTotals";
import { SummaryCards } from "./components/SummaryCards";
import { WeeklyTotals } from "./components/WeeklyTotals";
import { useBudgetData } from "./hooks/useBudgetData";
import {
  calculateMonthSummary,
  getAccountTotals,
  getAnnualCategoryTotals,
  getCategoryTotals,
  getExpensesForMonth,
  getMonthKey,
  getMonthlyTotalsToDate,
  inputDateFormat,
  getWeeklyTotals,
} from "./lib/budget";
import { formatCurrency } from "./lib/format";
import type { AnnualCategoryMode, Expense, MonthKey } from "./types/budget";

type VisualTheme = "classic" | "haunted";

const visualThemeStorageKey = "budgette:visual-theme";

function App() {
  const {
    data,
    addExpense,
    deleteExpense,
    saveMonth,
    stopMonthlySeries,
    updateExpense,
    updateMonthlyFutureSeries,
    updateSingleMonthlyInstance,
    restoreBudgetData,
  } = useBudgetData();
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>(() =>
    getMonthKey(new Date()),
  );
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(() => {
    try {
      return localStorage.getItem(visualThemeStorageKey) === "haunted"
        ? "haunted"
        : "classic";
    } catch {
      return "classic";
    }
  });
  const [annualCategoryMode, setAnnualCategoryMode] =
    useState<AnnualCategoryMode>("completed");
  const expenseFormRef = useRef<HTMLElement | null>(null);

  const selectedMonthRecord = data.months.find(
    (month) => month.id === selectedMonth,
  );
  const summary = useMemo(
    () => calculateMonthSummary(data, selectedMonth),
    [data, selectedMonth],
  );
  const monthlyExpenses = useMemo(
    () => getExpensesForMonth(data.expenses, selectedMonth),
    [data.expenses, selectedMonth],
  );
  const weeklyTotals = useMemo(
    () => getWeeklyTotals(monthlyExpenses, selectedMonth),
    [monthlyExpenses, selectedMonth],
  );
  const monthlyTotalsToDate = useMemo(
    () => getMonthlyTotalsToDate(data, selectedMonth),
    [data, selectedMonth],
  );
  const categoryTotals = useMemo(
    () => getCategoryTotals(monthlyExpenses),
    [monthlyExpenses],
  );
  const accountTotals = useMemo(
    () => getAccountTotals(monthlyExpenses),
    [monthlyExpenses],
  );
  const annualCategoryTotals = useMemo(
    () => getAnnualCategoryTotals(data, selectedMonth, annualCategoryMode),
    [annualCategoryMode, data, selectedMonth],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data.expenses
            .map((expense) => expense.category.trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [data.expenses],
  );

  function handleMonthChange(monthKey: MonthKey) {
    setSelectedMonth(monthKey);
    setEditingExpense(null);
    if (!data.months.some((month) => month.id === monthKey)) {
      saveMonth({ id: monthKey, baseAmount: 0 });
    }
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    requestAnimationFrame(() => {
      expenseFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function handleThemeChange(nextTheme: VisualTheme) {
    setVisualTheme(nextTheme);
    try {
      localStorage.setItem(visualThemeStorageKey, nextTheme);
    } catch {
      // The theme still changes for this session if storage is unavailable.
    }
  }

  return (
    <main
      className={`budgette-background min-h-screen text-slate-950 ${
        visualTheme === "haunted" ? "budgette-background--haunted haunted-theme" : ""
      }`}
    >
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
              Monthly Spending Tracking & Forecasting
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Budgette
            </h1>
            <p className="mt-1 text-sm text-slate-600 lg:whitespace-nowrap">
              Track expenses, rollover, and the amount you can spend each day
              through the end of the selected month.
            </p>
          </div>
          <div
            aria-label="Visual theme"
            className="flex w-fit rounded-md border border-white/70 bg-white/75 p-1 text-xs font-semibold shadow-soft backdrop-blur"
          >
            {(["classic", "haunted"] as VisualTheme[]).map((theme) => (
              <button
                key={theme}
                type="button"
                className={`rounded px-3 py-1.5 capitalize transition ${
                  visualTheme === theme
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => handleThemeChange(theme)}
              >
                {theme}
              </button>
            ))}
          </div>
        </header>

        <MonthSetup
          baseAmount={selectedMonthRecord?.baseAmount ?? 0}
          months={data.months}
          selectedMonth={selectedMonth}
          onBaseAmountChange={(baseAmount) =>
            saveMonth({ id: selectedMonth, baseAmount })
          }
          onMonthChange={handleMonthChange}
        />

        <SummaryCards summary={summary} />

        <section className="grid gap-3 rounded-lg border border-white/70 bg-white/85 p-4 text-sm text-slate-700 shadow-soft backdrop-blur sm:grid-cols-3">
          <p>
            Previous rollover:{" "}
            <span
              className={`font-semibold ${
                summary.rolloverFromPreviousMonth < 0
                  ? "text-rose-600"
                  : "text-emerald-700"
              }`}
            >
              {formatCurrency(summary.rolloverFromPreviousMonth)}
            </span>
          </p>
          <p className="sm:text-center">
            Days remaining:{" "}
            <span className="font-semibold">
              {summary.isPastMonth ? "Month closed" : summary.daysRemaining}
            </span>
          </p>
          <p className="sm:text-right">
            Next rollover:{" "}
            <span
              className={`font-semibold ${
                summary.nextMonthRollover < 0 ? "text-rose-600" : "text-emerald-700"
              }`}
            >
              {formatCurrency(summary.nextMonthRollover)}
            </span>
          </p>
        </section>

        <ExpenseForm
          ref={expenseFormRef}
          categoryOptions={categoryOptions}
          editingExpense={editingExpense}
          selectedMonth={selectedMonth}
          onCancelEdit={() => setEditingExpense(null)}
          onSubmit={(expense, options) => {
            if (options?.scope === "single" && "id" in expense && editingExpense) {
              const {
                id: _id,
                isProjected: _isProjected,
                recurringExpenseId: _recurringExpenseId,
                ...nextMonthlyExpense
              } = editingExpense;

              updateSingleMonthlyInstance(expense, {
                ...nextMonthlyExpense,
                date: format(addMonths(parseISO(editingExpense.date), 1), inputDateFormat),
                isMonthly: true,
                isProjected: false,
                recurringExpenseId: undefined,
              });
              setEditingExpense(null);
            } else if (options?.scope === "stop") {
              stopMonthlySeries(
                options.recurringExpenseId,
                options.monthKey ?? selectedMonth,
              );
              setEditingExpense(null);
            } else if (options?.scope === "future") {
              updateMonthlyFutureSeries(options.recurringExpenseId, expense);
              setEditingExpense(null);
            } else if ("id" in expense) {
              updateExpense(expense);
              setEditingExpense(null);
            } else {
              addExpense(expense);
            }
          }}
        />

        <Ledger
          categoryOptions={categoryOptions}
          expenses={monthlyExpenses}
          onDelete={(expenseId) => {
            deleteExpense(expenseId);
            if (editingExpense?.id === expenseId) {
              setEditingExpense(null);
            }
          }}
          onEdit={handleEditExpense}
          onUpdate={updateExpense}
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <div className="min-w-0 flex flex-col gap-5">
            <AccountBreakdown accountTotals={accountTotals} />
            <CategoryBreakdown categoryTotals={categoryTotals} />
            <CalendarView expenses={monthlyExpenses} selectedMonth={selectedMonth} />
          </div>
          <div className="min-w-0 flex flex-col gap-5">
            <AnnualCategoryPlanning
              categoryTotals={annualCategoryTotals}
              mode={annualCategoryMode}
              selectedMonth={selectedMonth}
              onModeChange={setAnnualCategoryMode}
            />
            <MonthlyTotals
              monthlyTotals={monthlyTotalsToDate}
              selectedMonth={selectedMonth}
            />
            <WeeklyTotals weeklyTotals={weeklyTotals} />
          </div>
        </div>

        <BackupRestore
          data={data}
          onRestore={(restoredData) => {
            restoreBudgetData(restoredData);
            setEditingExpense(null);
          }}
        />

        <footer className="pb-2 text-center text-xs text-slate-500">
          Data is stored locally in this browser. Current date:{" "}
          {format(new Date(), "MMMM d, yyyy")}.
        </footer>
      </div>
    </main>
  );
}

export default App;
