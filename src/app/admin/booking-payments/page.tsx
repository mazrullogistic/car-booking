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
import { formatDate, formatMoney, paymentsApi } from "@/lib/services";

type PaymentRow = Record<string, unknown> & {
  id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  payment_for?: string;
  reference_number?: string;
  remarks?: string;
  booking?: {
    ticket_no: string;
    customer?: { name: string };
  };
};

const emptyForm = {
  amount: "",
  payment_mode: "",
  payment_date: "",
  payment_for: "",
  reference_number: "",
  remarks: "",
};

export default function BookingPaymentsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<PaymentRow[]>([]);
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
      const rows = (await paymentsApi.list({
        ticket: query || undefined,
        customer: query || undefined,
        limit: 100,
      })) as PaymentRow[];
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

  async function openEdit(row: PaymentRow) {
    setEditingId(row.id);
    setError("");
    try {
      const payment = (await paymentsApi.get(row.id)) as Record<string, unknown>;
      setForm({
        amount: String(payment.amount ?? ""),
        payment_mode: String(payment.payment_mode ?? ""),
        payment_date: payment.payment_date
          ? String(payment.payment_date).slice(0, 10)
          : "",
        payment_for: String(payment.payment_for ?? ""),
        reference_number: String(payment.reference_number ?? ""),
        remarks: String(payment.remarks ?? ""),
      });
      setModalOpen(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load payment");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      await paymentsApi.update(editingId, {
        amount: Number(form.amount),
        payment_mode: form.payment_mode,
        payment_date: form.payment_date,
        payment_for: form.payment_for || null,
        reference_number: form.reference_number || null,
        remarks: form.remarks || null,
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
    if (!confirm("Delete this payment?")) return;
    setError("");
    try {
      await paymentsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const columns: Column<PaymentRow>[] = [
    { key: "id", header: "ID", className: "font-medium text-primary" },
    {
      key: "booking",
      header: "Ticket",
      render: (row) => row.booking?.ticket_no ?? "-",
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.booking?.customer?.name ?? "-",
    },
    {
      key: "amount",
      header: "Amount",
      className: "font-medium",
      render: (row) => formatMoney(row.amount),
    },
    { key: "payment_mode", header: "Mode" },
    {
      key: "payment_date",
      header: "Date",
      render: (row) => formatDate(row.payment_date),
    },
    { key: "payment_for", header: "Payment For" },
    {
      key: "actions" as keyof PaymentRow & string,
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
        title="Booking Payments"
        description="Track payments for bookings"
        action={{ label: "Record Payment", href: "/admin/booking-payments/new" }}
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
              placeholder="Search by ticket or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button className="w-full sm:w-auto" onClick={() => setQuery(search)}>
              Search
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
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
        title="Edit Payment"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
            required
          />
          <Select
            label="Payment Method"
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
            required
          />
          <Input
            label="Payment Date"
            type="date"
            value={form.payment_date}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, payment_date: e.target.value }))
            }
            required
          />
          <Input
            label="Payment For"
            value={form.payment_for}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, payment_for: e.target.value }))
            }
          />
          <Input
            label="Reference No."
            value={form.reference_number}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, reference_number: e.target.value }))
            }
          />
          <Input
            label="Remarks"
            value={form.remarks}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, remarks: e.target.value }))
            }
          />
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button type="submit" loading={saving} className="w-full sm:w-auto">
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
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
