import { forwardRef, useEffect, useState } from "react";
import { format } from "date-fns";
import { accountOptions, type Account } from "../lib/accounts";
import { getMonthKey, inputDateFormat } from "../lib/budget";
import type { Expense, MonthKey } from "../types/budget";

type ExpenseDraft = Omit<Expense, "id">;

type ExpenseFormProps = {
  categoryOptions: string[];
  editingExpense?: Expense | null;
  selectedMonth: MonthKey;
  onCancelEdit: () => void;
  onSubmit: (
    expense: ExpenseDraft | Expense,
    options?: {
      monthKey?: MonthKey;
      recurringExpenseId: string;
      scope: "future" | "single" | "stop";
    },
  ) => void;
};

const defaultCategories = [
  "Groceries",
  "Dining",
  "Rent",
  "Utilities",
  "Transit",
  "Shopping",
  "Health",
  "Entertainment",
  "Income/Return",
];

function createDefaultDate(selectedMonth: MonthKey) {
  const today = new Date();

  return getMonthKey(today) === selectedMonth
    ? format(today, inputDateFormat)
    : `${selectedMonth}-01`;
}

function createEmptyDraft(selectedMonth: MonthKey): ExpenseDraft {
  return {
    date: createDefaultDate(selectedMonth),
    category: "",
    description: "",
    cost: 0,
    isMonthly: false,
    isVariableMonthly: false,
  };
}

export const ExpenseForm = forwardRef<HTMLElement, ExpenseFormProps>(function ExpenseForm(
  {
    categoryOptions,
    editingExpense,
    selectedMonth,
    onCancelEdit,
    onSubmit,
  },
  ref,
) {
  const [draft, setDraft] = useState<ExpenseDraft>(createEmptyDraft(selectedMonth));
  const [recurrenceEditScope, setRecurrenceEditScope] = useState<
    "single" | "future" | "stop"
  >("single");
  const mergedCategories = Array.from(
    new Set([...defaultCategories, ...categoryOptions].map((category) => category.trim())),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (editingExpense?.isProjected) {
      setRecurrenceEditScope(editingExpense.isVariableMonthly ? "single" : "future");
      setDraft({
        ...editingExpense,
        isMonthly: true,
        isProjected: false,
      });
      return;
    }

    setRecurrenceEditScope(editingExpense?.isMonthly ? "future" : "single");
    setDraft(editingExpense ?? createEmptyDraft(selectedMonth));
  }, [editingExpense, selectedMonth]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const {
      id: _id,
      isProjected: _isProjected,
      ...cleanedDraft
    } = {
      ...draft,
      category: draft.category.trim() || "Uncategorized",
      description: draft.description.trim() || "No description",
      cost: Number(draft.cost),
      isMonthly: Boolean(draft.isMonthly),
      isVariableMonthly: Boolean(draft.isVariableMonthly),
    } as ExpenseDraft & Partial<Expense>;

    if (editingExpense?.isProjected) {
      if (recurrenceEditScope === "stop" && editingExpense.recurringExpenseId) {
        onSubmit(cleanedDraft, {
          monthKey: cleanedDraft.date.slice(0, 7),
          recurringExpenseId: editingExpense.recurringExpenseId,
          scope: "stop",
        });
      } else if (
        recurrenceEditScope === "future" &&
        editingExpense.recurringExpenseId
      ) {
        onSubmit(
          {
            ...cleanedDraft,
            isMonthly: true,
            isProjected: false,
            recurrenceEndMonth: undefined,
            recurringExpenseId: undefined,
          },
          {
            recurringExpenseId: editingExpense.recurringExpenseId,
            scope: "future",
          },
        );
      } else {
        onSubmit({
          ...cleanedDraft,
          isMonthly: false,
          isVariableMonthly: false,
          isProjected: false,
          recurrenceEndMonth: undefined,
          recurringExpenseId: editingExpense.recurringExpenseId,
        });
      }
    } else if (editingExpense) {
      if (recurrenceEditScope === "single" && editingExpense.isMonthly) {
        onSubmit(
          {
            ...cleanedDraft,
            id: editingExpense.id,
            isMonthly: false,
            isVariableMonthly: false,
            recurrenceEndMonth: undefined,
            recurringExpenseId: undefined,
          },
          {
            recurringExpenseId: editingExpense.id,
            scope: "single",
          },
        );
      } else if (recurrenceEditScope === "stop" && editingExpense.isMonthly) {
        onSubmit({
          ...cleanedDraft,
          id: editingExpense.id,
          recurrenceEndMonth: cleanedDraft.date.slice(0, 7),
        });
      } else {
        onSubmit({ ...cleanedDraft, id: editingExpense.id });
      }
    } else {
      onSubmit(cleanedDraft);
    }

    setDraft(createEmptyDraft(selectedMonth));
  }

  return (
    <section
      ref={ref}
      className={`rounded-lg border bg-white/85 p-4 shadow-soft backdrop-blur transition ${
        editingExpense ? "border-rose-300 ring-2 ring-rose-100" : "border-white/70"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-950">
          {editingExpense
            ? `${editingExpense.isProjected ? "Editing planned monthly" : "Editing"}: ${
                editingExpense.description || editingExpense.category
              }`
            : "Expenses"}
        </h2>
        {editingExpense ? (
          <button
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
            type="button"
            onClick={onCancelEdit}
          >
            Cancel
          </button>
        ) : null}
      </div>
      <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[140px_minmax(130px,1fr)_minmax(130px,1fr)_minmax(220px,2fr)_110px_70px_70px_140px] xl:items-end" onSubmit={handleSubmit}>
        <label>
          <span className="text-sm font-medium text-slate-700">Date</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            required
            type="date"
            value={draft.date}
            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
          />
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">Account</span>
          <select
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            value={draft.account ?? ""}
            onChange={(event) =>
              setDraft({
                ...draft,
                account: (event.target.value || undefined) as Account | undefined,
              })
            }
          >
            <option value="">Select...</option>
            {accountOptions.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">Category</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            list="expense-categories"
            required
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          />
          <datalist id="expense-categories">
            {mergedCategories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">Description</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            value={draft.description}
            onChange={(event) =>
              setDraft({ ...draft, description: event.target.value })
            }
          />
        </label>
        <label>
          <span className="text-sm font-medium text-slate-700">Cost</span>
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 transition focus:ring-2"
            required
            step="0.01"
            type="number"
            value={draft.cost}
            onChange={(event) => setDraft({ ...draft, cost: Number(event.target.value) })}
          />
        </label>
        <label className="sm:col-span-2 xl:col-span-1">
          <span className="text-sm font-medium text-slate-700">Monthly</span>
          <span className="mt-1 flex h-[42px] items-center justify-center rounded-md border border-slate-200 px-3 py-2">
            <input
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              type="checkbox"
              checked={Boolean(draft.isMonthly)}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  isMonthly: event.target.checked,
                  isVariableMonthly: event.target.checked
                    ? draft.isVariableMonthly
                    : false,
                })
              }
            />
          </span>
        </label>
        <label className="sm:col-span-2 xl:col-span-1">
          <span className="text-sm font-medium text-slate-700">Variable</span>
          <span className="mt-1 flex h-[42px] items-center justify-center rounded-md border border-slate-200 px-3 py-2">
            <input
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!draft.isMonthly}
              type="checkbox"
              checked={Boolean(draft.isVariableMonthly)}
              onChange={(event) =>
                setDraft({ ...draft, isVariableMonthly: event.target.checked })
              }
            />
          </span>
        </label>
        <button
          className="h-[42px] rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 sm:col-span-2 xl:col-span-1"
          type="submit"
        >
          {editingExpense ? "Save changes" : "Add expense"}
        </button>
        {editingExpense?.isProjected || editingExpense?.isMonthly ? (
          <fieldset className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 sm:col-span-2 xl:col-span-8">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Apply changes to
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input
                  className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                  name="recurrence-edit-scope"
                  type="radio"
                  value="single"
                  checked={recurrenceEditScope === "single"}
                  onChange={() => setRecurrenceEditScope("single")}
                />
                This month only
              </label>
              <label className="flex items-center gap-2">
                <input
                  className="h-4 w-4 border-slate-300 text-sky-600 focus:ring-sky-500"
                  name="recurrence-edit-scope"
                  type="radio"
                  value="future"
                  checked={recurrenceEditScope === "future"}
                  onChange={() => setRecurrenceEditScope("future")}
                />
                {editingExpense?.isProjected
                  ? "All future instances"
                  : "This saved monthly series"}
              </label>
              <label className="flex items-center gap-2">
                <input
                  className="h-4 w-4 border-slate-300 text-rose-600 focus:ring-rose-500"
                  name="recurrence-edit-scope"
                  type="radio"
                  value="stop"
                  checked={recurrenceEditScope === "stop"}
                  onChange={() => setRecurrenceEditScope("stop")}
                />
                {editingExpense?.isProjected
                  ? "Stop from this month forward"
                  : "Stop after this month"}
              </label>
            </div>
          </fieldset>
        ) : null}
      </form>
      <p className="mt-2 text-xs text-slate-500">
        {editingExpense?.isProjected
          ? "Choose whether this update corrects one month, starts a new future pattern, or stops the series."
          : editingExpense?.isMonthly
          ? "Choose whether this update applies once, updates the saved monthly series, or stops it after this month."
          : editingExpense
          ? "Update the fields above, then save changes or cancel editing."
          : "Enter returns or credits as negative costs."}
      </p>
    </section>
  );
});
