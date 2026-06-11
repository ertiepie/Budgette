import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import type { Expense } from "../types/budget";
import { sortExpensesByDate } from "../lib/budget";
import { formatCurrency } from "../lib/format";

type LedgerProps = {
  categoryOptions: string[];
  expenses: Expense[];
  onDelete: (expenseId: string) => void;
  onEdit: (expense: Expense) => void;
  onUpdate: (expense: Expense) => void;
};

type LedgerDraft = Pick<Expense, "category" | "cost" | "date" | "description">;

function canEditInline(expense: Expense) {
  return (
    !expense.isProjected &&
    !expense.isMonthly &&
    !expense.isVariableMonthly &&
    !expense.recurringExpenseId
  );
}

function createLedgerDraft(expense: Expense): LedgerDraft {
  return {
    category: expense.category,
    cost: expense.cost,
    date: expense.date,
    description: expense.description,
  };
}

export function Ledger({
  categoryOptions,
  expenses,
  onDelete,
  onEdit,
  onUpdate,
}: LedgerProps) {
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LedgerDraft | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const sortedExpenses = sortExpensesByDate(expenses);
  const mergedCategories = Array.from(
    new Set(categoryOptions.map((category) => category.trim())),
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (
      editingExpenseId &&
      !expenses.some((expense) => expense.id === editingExpenseId)
    ) {
      setEditingExpenseId(null);
      setDraft(null);
    }
  }, [editingExpenseId, expenses]);

  function startInlineEdit(expense: Expense) {
    setEditingExpenseId(expense.id);
    setDraft(createLedgerDraft(expense));
  }

  function cancelInlineEdit() {
    setEditingExpenseId(null);
    setDraft(null);
  }

  function saveInlineEdit(expense: Expense) {
    if (!draft) {
      return;
    }

    onUpdate({
      ...expense,
      category: draft.category.trim() || "Uncategorized",
      cost: Number(draft.cost),
      date: draft.date,
      description: draft.description.trim() || "No description",
    });
    cancelInlineEdit();
  }

  function toggleLedger() {
    setIsCollapsed((current) => {
      if (!current) {
        cancelInlineEdit();
      }

      return !current;
    });
  }

  return (
    <section className="rounded-lg border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Ledger</h2>
          <span className="text-sm text-slate-500">
            {sortedExpenses.length} entries
          </span>
        </div>
        <button
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          type="button"
          onClick={toggleLedger}
        >
          {isCollapsed ? "Show ledger" : "Hide ledger"}
        </button>
      </div>
      {isCollapsed ? null : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <th className="w-32 py-2 pr-3">Date</th>
              <th className="w-40 py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Description</th>
              <th className="w-28 py-2 pr-3 text-right">Cost</th>
              <th className="w-24 py-2 pr-3 text-center">Monthly</th>
              <th className="sticky right-0 z-10 w-44 bg-white/95 py-2 pl-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((expense) => {
              const isInlineEditing = editingExpenseId === expense.id && draft;

              return (
                <tr key={expense.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 text-slate-700">
                    {isInlineEditing ? (
                      <input
                        className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none ring-sky-500 transition focus:ring-2"
                        required
                        type="date"
                        value={draft.date}
                        onChange={(event) =>
                          setDraft({ ...draft, date: event.target.value })
                        }
                      />
                    ) : (
                      format(parseISO(expense.date), "MMM d")
                    )}
                  </td>
                  <td className="py-2 pr-3 font-medium text-slate-900">
                    {isInlineEditing ? (
                      <>
                        <input
                          className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none ring-sky-500 transition focus:ring-2"
                          list="ledger-categories"
                          required
                          value={draft.category}
                          onChange={(event) =>
                            setDraft({ ...draft, category: event.target.value })
                          }
                        />
                        <datalist id="ledger-categories">
                          {mergedCategories.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      expense.category
                    )}
                  </td>
                  <td className="py-2 pr-3 text-slate-600">
                    {isInlineEditing ? (
                      <input
                        className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none ring-sky-500 transition focus:ring-2"
                        value={draft.description}
                        onChange={(event) =>
                          setDraft({ ...draft, description: event.target.value })
                        }
                      />
                    ) : (
                      expense.description
                    )}
                  </td>
                  <td
                    className={`py-2 pr-3 text-right font-semibold ${
                      expense.cost < 0 ? "text-emerald-700" : "text-slate-900"
                    }`}
                  >
                    {isInlineEditing ? (
                      <input
                        className="w-full min-w-0 rounded-md border border-slate-300 px-2 py-1 text-right text-sm outline-none ring-sky-500 transition focus:ring-2"
                        required
                        step="0.01"
                        type="number"
                        value={draft.cost}
                        onChange={(event) =>
                          setDraft({ ...draft, cost: Number(event.target.value) })
                        }
                      />
                    ) : (
                      formatCurrency(expense.cost)
                    )}
                  </td>
                  <td className="py-2 pr-3 text-center">
                    {expense.isProjected ? (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
                        Planned
                      </span>
                    ) : expense.recurringExpenseId ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        Adjusted
                      </span>
                    ) : expense.isVariableMonthly ? (
                      <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
                        Variable
                      </span>
                    ) : expense.isMonthly ? (
                      <span className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="sticky right-0 z-10 bg-white/95 py-2 pl-3 text-right shadow-[-12px_0_16px_-16px_rgba(15,23,42,0.35)]">
                    <div className="flex flex-nowrap justify-end gap-2">
                      {isInlineEditing ? (
                        <>
                          <button
                            className="rounded-md border border-sky-200 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-50"
                            type="button"
                            onClick={() => saveInlineEdit(expense)}
                          >
                            Save
                          </button>
                          <button
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                            type="button"
                            onClick={cancelInlineEdit}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          type="button"
                          onClick={() =>
                            canEditInline(expense)
                              ? startInlineEdit(expense)
                              : onEdit(expense)
                          }
                        >
                          {canEditInline(expense) ? "Quick edit" : "Edit series"}
                        </button>
                      )}
                      {expense.isProjected || isInlineEditing ? null : (
                        <button
                          className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          type="button"
                          onClick={() => onDelete(expense.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
      {sortedExpenses.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">
          No expenses yet for this month.
        </p>
      ) : null}
    </section>
  );
}
