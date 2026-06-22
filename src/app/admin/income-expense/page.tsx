"use client";

import { useCallback } from "react";
import { ApiListPage } from "@/components/admin";
import {
  capitalizeStatus,
  formatDate,
  formatMoney,
  incomeExpensesApi,
} from "@/lib/services";

type IncomeExpenseRow = Record<string, unknown> & {
  id: number;
  type: string;
  category: string;
  description?: string;
  amount: number;
  entry_date: string;
};

export default function IncomeExpensePage() {
  const fetchData = useCallback(
    (search: string) =>
      incomeExpensesApi.list({ search, limit: 100 }) as Promise<
        IncomeExpenseRow[]
      >,
    [],
  );

  return (
    <ApiListPage<IncomeExpenseRow>
      title="Income & Expense"
      description="Track financial transactions"
      action={{ label: "Add Entry", href: "/admin/income-expense/new" }}
      fetchData={fetchData}
      searchPlaceholder="Search by category or description..."
      columns={[
        { key: "id", header: "ID", className: "font-medium text-primary" },
        {
          key: "type",
          header: "Type",
          render: (row) => (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                row.type === "income"
                  ? "bg-success-light text-success"
                  : "bg-danger-light text-danger"
              }`}
            >
              {capitalizeStatus(row.type)}
            </span>
          ),
        },
        { key: "category", header: "Category" },
        { key: "description", header: "Description" },
        {
          key: "amount",
          header: "Amount",
          className: "font-medium",
          render: (row) => formatMoney(row.amount),
        },
        {
          key: "entry_date",
          header: "Date",
          render: (row) => formatDate(row.entry_date),
        },
      ]}
    />
  );
}
