import { addMonths, format, setDate, startOfMonth } from "date-fns";
import type { BudgetData } from "../types/budget";
import { getMonthKey, inputDateFormat } from "./budget";

const now = new Date();
const currentMonth = startOfMonth(now);
const previousMonth = addMonths(currentMonth, -1);
const nextMonth = addMonths(currentMonth, 1);

function dateInMonth(month: Date, day: number) {
  return format(setDate(month, day), inputDateFormat);
}

export const seedData: BudgetData = {
  months: [
    { id: getMonthKey(previousMonth), baseAmount: 3200 },
    { id: getMonthKey(currentMonth), baseAmount: 3400 },
    { id: getMonthKey(nextMonth), baseAmount: 3500 },
  ],
  expenses: [
    {
      id: "seed-1",
      date: dateInMonth(previousMonth, 2),
      category: "Rent",
      description: "Apartment rent",
      cost: 1650,
    },
    {
      id: "seed-2",
      date: dateInMonth(previousMonth, 10),
      category: "Groceries",
      description: "Market run",
      cost: 142.85,
    },
    {
      id: "seed-3",
      date: dateInMonth(previousMonth, 21),
      category: "Dining",
      description: "Dinner out",
      cost: 78.2,
    },
    {
      id: "seed-4",
      date: dateInMonth(currentMonth, 1),
      category: "Rent",
      description: "Apartment rent",
      cost: 1650,
      isMonthly: true,
    },
    {
      id: "seed-5",
      date: dateInMonth(currentMonth, 4),
      category: "Utilities",
      description: "Electric bill",
      cost: 96.43,
    },
    {
      id: "seed-6",
      date: dateInMonth(currentMonth, 6),
      category: "Groceries",
      description: "Weekly groceries",
      cost: 118.74,
    },
    {
      id: "seed-7",
      date: dateInMonth(currentMonth, 8),
      category: "Shopping",
      description: "Returned jacket",
      cost: -49.99,
    },
    {
      id: "seed-8",
      date: dateInMonth(currentMonth, 12),
      category: "Transit",
      description: "Monthly transit pass",
      cost: 90,
      isMonthly: true,
    },
    {
      id: "seed-9",
      date: dateInMonth(currentMonth, 15),
      category: "Subscriptions",
      description: "OpenAI",
      cost: 20,
      isMonthly: true,
    },
  ],
};
