"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  FormPage,
  Input,
  Select,
} from "@/components/admin";
import {
  bookingsApi,
  formatMoney,
  paymentsApi,
} from "@/lib/services";

export default function NewBookingPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [bookingOptions, setBookingOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    bookingsApi.list({ limit: 200 }).then((bookings) => {
      setBookingOptions(
        bookings.map((b) => {
          const row = b as Record<string, unknown> & {
            id: number;
            ticket_no: string;
            customer?: { name: string };
          };
          return {
            value: String(row.id),
            label: `${row.ticket_no} — ${row.customer?.name ?? "Customer"}`,
          };
        }),
      );
    });
  }, []);

  useEffect(() => {
    if (!bookingId) {
      setRemaining(null);
      return;
    }
    paymentsApi
      .remaining(Number(bookingId))
      .then((data) => setRemaining(data.remaining))
      .catch(() => setRemaining(null));
  }, [bookingId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await paymentsApi.create({
        booking_id: Number(bookingId),
        amount: Number(amount),
        payment_date: paymentDate,
        payment_mode: paymentMode,
        reference_number: reference || null,
        remarks: remarks || null,
        payment_for: "Booking Payment",
      });
      router.push("/admin/booking-payments");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setLoading(false);
    }
  }

  return (
    <FormPage
      title="Record Payment"
      description="Add a payment for a booking"
      backHref="/admin/booking-payments"
    >
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Booking"
            options={bookingOptions}
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            required
          />
          {remaining !== null && (
            <div className="flex items-end">
              <p className="rounded-lg bg-warning-light px-4 py-2 text-sm font-medium text-warning">
                Remaining balance: {formatMoney(remaining)}
              </p>
            </div>
          )}
          <Input
            label="Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            max={remaining ?? undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
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
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            required
          />
          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
          <Input
            label="Reference No."
            placeholder="Transaction reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
        <Input
          label="Remarks"
          placeholder="Payment notes (optional)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />
        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            Save Payment
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => router.push("/admin/booking-payments")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPage>
  );
}
