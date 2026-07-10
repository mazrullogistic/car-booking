"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import {
  Alert,
  Button,
  FormPage,
  Input,
  Select,
} from "@/components/admin";
import { bookingsApi, incomeExpensesApi } from "@/lib/services";

export default function NewIncomeExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [type, setType] = useState("income");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [branchId, setBranchId] = useState("1");
  const [bookingOptions, setBookingOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.branch?.id) setBranchId(String(user.branch.id));
    });
    bookingsApi.list({ limit: 200 }).then((bookings) => {
      setBookingOptions(
        bookings.map((b) => {
          const row = b as Record<string, unknown> & {
            id: number;
            ticket_no: string;
          };
          return { value: String(row.id), label: row.ticket_no };
        }),
      );
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await incomeExpensesApi.create({
        branch_id: Number(branchId),
        type,
        category,
        amount: Number(amount),
        entry_date: entryDate,
        description,
        payment_mode: paymentMode || null,
        booking_id: bookingId ? Number(bookingId) : null,
      });
      router.push("/admin/income-expense");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setLoading(false);
    }
  }

  return (
    <FormPage
      title="Add Income / Expense"
      description="Record a new financial entry"
      backHref="/admin/income-expense"
    >
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Type"
            options={[
              { value: "income", label: "Income" },
              { value: "expense", label: "Expense" },
            ]}
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
          <Input
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
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
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          />
          <Select
            label="Linked Booking (optional)"
            options={bookingOptions}
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="sm:col-span-2"
            required
          />
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Save Entry
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/admin/income-expense")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPage>
  );
}
