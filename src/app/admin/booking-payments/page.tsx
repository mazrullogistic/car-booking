"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiListPage } from "@/components/admin";
import { formatDate, formatMoney, paymentsApi } from "@/lib/services";

type PaymentRow = Record<string, unknown> & {
  id: number;
  amount: number;
  payment_date: string;
  payment_mode: string;
  payment_for?: string;
  booking?: {
    ticket_no: string;
    customer?: { name: string };
  };
};

export default function BookingPaymentsPage() {
  const fetchData = useCallback(
    (search: string) =>
      paymentsApi.list({
        ticket: search || undefined,
        customer: search || undefined,
        limit: 100,
      }) as Promise<PaymentRow[]>,
    [],
  );

  return (
    <ApiListPage<PaymentRow>
      title="Booking Payments"
      description="Track payments for bookings"
      action={{ label: "Record Payment", href: "/admin/booking-payments/new" }}
      fetchData={fetchData}
      searchPlaceholder="Search by ticket or customer..."
      columns={[
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
      ]}
    />
  );
}
