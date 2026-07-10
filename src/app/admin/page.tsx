"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import { Alert, Card, PageHeader } from "@/components/admin";
import {
  capitalizeStatus,
  dashboardApi,
  formatDate,
  formatMoney,
  statusBadgeClass,
} from "@/lib/services";

type BookingSummary = Record<string, unknown> & {
  id: number;
  ticket_no: string;
  status: string;
  pickup_date: string;
  customer?: { name: string };
  fromCity?: { name: string };
  toCity?: { name: string };
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [upcomingPickups, setUpcomingPickups] = useState<BookingSummary[]>([]);

  useEffect(() => {
    dashboardApi
      .stats()
      .then((data) => {
        setKpis(data.kpis);
        setRecentBookings(data.recentBookings as BookingSummary[]);
        setUpcomingPickups(data.upcomingPickups as BookingSummary[]);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard"),
      )
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Total Bookings", value: kpis.bookings ?? 0, color: "text-primary" },
    { label: "Today's Pickups", value: kpis.todayPickups ?? 0, color: "text-success" },
    {
      label: "Pending Receivables",
      value: formatMoney(kpis.pendingReceivables),
      color: "text-warning",
    },
    {
      label: "Month Revenue",
      value: formatMoney(kpis.monthRevenue),
      color: "text-info",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your car booking operations"
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm text-text-secondary">{stat.label}</p>
            <p className={`mt-1 text-2xl font-semibold ${stat.color}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <BookingTable title="Upcoming Pickups" rows={upcomingPickups} />
        <BookingTable title="Recent Bookings" rows={recentBookings} />
      </div>
    </>
  );
}

function BookingTable({
  title,
  rows,
}: {
  title: string;
  rows: BookingSummary[];
}) {
  return (
    <Card padding="none">
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      </div>

      <div className="md:hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-text-muted">No bookings found</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((booking) => (
              <article key={booking.id} className="space-y-2 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-secondary">Ticket</span>
                  <span className="font-medium text-primary">{booking.ticket_no}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-secondary">Customer</span>
                  <span className="text-right text-text-primary">
                    {booking.customer?.name ?? "-"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-secondary">Route</span>
                  <span className="text-right text-text-secondary">
                    {booking.fromCity?.name ?? "?"} → {booking.toCity?.name ?? "?"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-secondary">Date</span>
                  <span className="text-text-secondary">
                    {formatDate(booking.pickup_date)}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-text-secondary">Status</span>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(booking.status)}`}
                  >
                    {capitalizeStatus(booking.status)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-border-light/50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Ticket
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Customer
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Route
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Date
              </th>
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center text-text-muted"
                >
                  No bookings found
                </td>
              </tr>
            ) : (
              rows.map((booking) => (
                <tr key={booking.id} className="hover:bg-border-light/40">
                  <td className="px-5 py-3 font-medium text-primary">
                    {booking.ticket_no}
                  </td>
                  <td className="px-5 py-3 text-text-primary">
                    {booking.customer?.name ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {booking.fromCity?.name ?? "?"} →{" "}
                    {booking.toCity?.name ?? "?"}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {formatDate(booking.pickup_date)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(booking.status)}`}
                    >
                      {capitalizeStatus(booking.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
