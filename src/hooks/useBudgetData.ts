import { useEffect, useMemo, useState } from "react";
import type { BudgetData, BudgetMonth, Expense } from "../types/budget";
import { seedData } from "../lib/seed";
import { getPreviousMonthKey, upsertMonth } from "../lib/budget";

const storageKey = "budgette:v1";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isBudgetData(value: unknown): value is BudgetData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BudgetData>;

  return (
    Array.isArray(candidate.months) &&
    candidate.months.every(
      (month) =>
        month &&
        typeof month.id === "string" &&
        typeof month.baseAmount === "number",
    ) &&
    Array.isArray(candidate.expenses) &&
    candidate.expenses.every(
      (expense) =>
        expense &&
        typeof expense.id === "string" &&
        typeof expense.date === "string" &&
        typeof expense.category === "string" &&
        typeof expense.description === "string" &&
        typeof expense.cost === "number",
    )
  );
}

function loadBudgetData(): BudgetData {
  const storedData = localStorage.getItem(storageKey);
  if (!storedData) {
    return seedData;
  }

  try {
    const parsed = JSON.parse(storedData) as BudgetData;
    return {
      months: Array.isArray(parsed.months) ? parsed.months : seedData.months,
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : seedData.expenses,
    };
  } catch {
    return seedData;
  }
}

export function useBudgetData() {
  const [data, setData] = useState<BudgetData>(() => loadBudgetData());

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  const actions = useMemo(
    () => ({
      saveMonth(month: BudgetMonth) {
        setData((current) => ({
          ...current,
          months: upsertMonth(current.months, month),
        }));
      },
      addExpense(expense: Omit<Expense, "id">) {
        setData((current) => ({
          ...current,
          expenses: [...current.expenses, { ...expense, id: createId() }],
        }));
      },
      updateExpense(expense: Expense) {
        setData((current) => ({
          ...current,
          expenses: current.expenses.map((item) =>
            item.id === expense.id ? expense : item,
          ),
        }));
      },
      updateSingleMonthlyInstance(
        expense: Expense,
        nextMonthlyExpense: Omit<Expense, "id">,
      ) {
        setData((current) => ({
          ...current,
          expenses: [
            ...current.expenses.map((item) =>
              item.id === expense.id ? expense : item,
            ),
            { ...nextMonthlyExpense, id: createId() },
          ],
        }));
      },
      updateMonthlyFutureSeries(
        recurringExpenseId: string,
        expense: Omit<Expense, "id">,
      ) {
        setData((current) => {
          const monthKey = expense.date.slice(0, 7);

          return {
            ...current,
            expenses: [
              ...current.expenses.map((item) =>
                item.id === recurringExpenseId
                  ? { ...item, recurrenceEndMonth: getPreviousMonthKey(monthKey) }
                  : item,
              ),
              {
                ...expense,
                id: createId(),
                isMonthly: true,
                isProjected: false,
                recurrenceEndMonth: undefined,
                recurringExpenseId: undefined,
              },
            ],
          };
        });
      },
      stopMonthlySeries(recurringExpenseId: string, monthKey: string) {
        setData((current) => ({
          ...current,
          expenses: current.expenses.map((item) =>
            item.id === recurringExpenseId
              ? { ...item, recurrenceEndMonth: getPreviousMonthKey(monthKey) }
              : item,
          ),
        }));
      },
      deleteExpense(expenseId: string) {
        setData((current) => ({
          ...current,
          expenses: current.expenses.filter((expense) => expense.id !== expenseId),
        }));
      },
      resetToSeedData() {
        setData(seedData);
      },
      restoreBudgetData(restoredData: unknown) {
        if (!isBudgetData(restoredData)) {
          throw new Error("That file does not look like a Budgette backup.");
        }

        setData({
          months: [...restoredData.months].sort((a, b) => a.id.localeCompare(b.id)),
          expenses: restoredData.expenses,
        });
      },
    }),
    [],
  );

  return { data, ...actions };
}
