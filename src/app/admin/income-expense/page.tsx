"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  DataTable,
  type Column,
  Input,
  Modal,
  PageHeader,
  Select,
} from "@/components/admin";
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
  payment_mode?: string;
};

const emptyForm = {
  type: "income",
  category: "",
  description: "",
  amount: "",
  entry_date: "",
  payment_mode: "",
};

export default function IncomeExpensePage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<IncomeExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = (await incomeExpensesApi.list({
        search: query,
        limit: 100,
      })) as IncomeExpenseRow[];
      setData(rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  async function openEdit(row: IncomeExpenseRow) {
    setEditingId(row.id);
    setError("");
    try {
      const entry = (await incomeExpensesApi.get(row.id)) as Record<
        string,
        unknown
      >;
      setForm({
        type: String(entry.type ?? "income"),
        category: String(entry.category ?? ""),
        description: String(entry.description ?? ""),
        amount: String(entry.amount ?? ""),
        entry_date: entry.entry_date
          ? String(entry.entry_date).slice(0, 10)
          : "",
        payment_mode: String(entry.payment_mode ?? ""),
      });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load entry");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await incomeExpensesApi.update(editingId, {
        type: form.type,
        category: form.category,
        description: form.description,
        amount: Number(form.amount),
        entry_date: form.entry_date,
        payment_mode: form.payment_mode || null,
      });
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    setError("");
    try {
      await incomeExpensesApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const columns: Column<IncomeExpenseRow>[] = [
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
    {
      key: "actions" as keyof IncomeExpenseRow & string,
      header: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Income & Expense"
        description="Track financial transactions"
        action={{ label: "Add Entry", href: "/admin/income-expense/new" }}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by category or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setQuery(search)}>Search</Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setQuery("");
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>

      <Modal
        open={modalOpen}
        title="Edit Income / Expense"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            options={[
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
            required
          />
          <Input
            label="Category"
            value={form.category}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, category: e.target.value }))
            }
            required
          />
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <Input
            label="Date"
            type="date"
            value={form.entry_date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, entry_date: e.target.value }))
            }
            required
          />
          <Select
            label="Payment Mode"
            options={[
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "bank", label: "Bank Transfer" },
              { value: "card", label: "Card" },
            ]}
            value={form.payment_mode}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, payment_mode: e.target.value }))
            }
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            required
          />
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
