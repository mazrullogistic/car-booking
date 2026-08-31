"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { Alert, Card, PageHeader, Select } from "@/components/admin";
import {
  bookingsApi,
  capitalizeStatus,
  dashboardApi,
  formatDate,
  formatDateTime,
  formatMoney,
  pickupTimestamp,
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

type DateRangeFilter = "all" | "today" | "week" | "month";

const UPCOMING_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
];

const RECENT_OPTIONS = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function toDateInput(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Today = local day; This Week = Mon–Sun; This Month = 1st–last of month */
function getDateBounds(range: Exclude<DateRangeFilter, "all">) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "week") {
    const day = today.getDay(); // 0 Sun … 6 Sat
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysFromMonday);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return { from: weekStart, to: weekEnd };
  }

  if (range === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: monthStart, to: monthEnd };
  }

  return { from: today, to: today };
}

function sortByLatestPickup(rows: BookingSummary[]) {
  return [...rows].sort(
    (a, b) => pickupTimestamp(b.pickup_date) - pickupTimestamp(a.pickup_date),
  );
}

async function fetchBookingsByRange(range: DateRangeFilter) {
  const params =
    range === "all"
      ? { limit: 100 }
      : (() => {
          const { from, to } = getDateBounds(range);
          return {
            from_date: toDateInput(from),
            to_date: toDateInput(to),
            limit: 100,
          };
        })();

  const rows = (await bookingsApi.list(params)) as BookingSummary[];

  return sortByLatestPickup(
    rows.filter((row) => String(row.status).toLowerCase() !== "cancelled"),
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState<Record<string, number>>({});
  const [recentBookings, setRecentBookings] = useState<BookingSummary[]>([]);
  const [upcomingPickups, setUpcomingPickups] = useState<BookingSummary[]>([]);
  const [upcomingRange, setUpcomingRange] = useState<"today" | "week">("today");
  const [recentRange, setRecentRange] = useState<DateRangeFilter>("all");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dashboardApi.stats({ upcoming: "today" }),
      fetchBookingsByRange("today"),
      fetchBookingsByRange("all"),
    ])
      .then(([data, upcoming, recent]) => {
        if (cancelled) return;
        setKpis(data.kpis);
        setUpcomingPickups(upcoming);
        setRecentBookings(recent);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUpcomingRangeChange(value: string) {
    if (value !== "today" && value !== "week") return;
    setUpcomingRange(value);
    setError("");
    try {
      setUpcomingPickups(await fetchBookingsByRange(value));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pickups");
    }
  }

  async function handleRecentRangeChange(value: string) {
    if (
      value !== "all" &&
      value !== "today" &&
      value !== "week" &&
      value !== "month"
    ) {
      return;
    }
    setRecentRange(value);
    setError("");
    try {
      setRecentBookings(await fetchBookingsByRange(value));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load bookings");
    }
  }

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
        <BookingTable
          title="Upcoming Pickups"
          rows={upcomingPickups}
          showDateTime
          headerAction={
            <div className="w-40 shrink-0">
              <Select
                options={UPCOMING_OPTIONS}
                value={upcomingRange}
                placeholder=""
                aria-label="Upcoming pickups filter"
                className="h-9"
                onChange={(e) => handleUpcomingRangeChange(e.target.value)}
              />
            </div>
          }
        />
        <BookingTable title="Recent Bookings" rows={recentBookings} showDateTime headerAction={
            <div className="w-40 shrink-0">
              <Select
                options={RECENT_OPTIONS}
                value={recentRange}
                placeholder=""
                aria-label="Recent bookings filter"
                className="h-9"
                onChange={(e) => handleRecentRangeChange(e.target.value)}
              />
            </div>
          } />
      </div>
    </>
  );
}

function BookingTable({
  title,
  rows,
  showDateTime = false,
  headerAction,
}: {
  title: string;
  rows: BookingSummary[];
  showDateTime?: boolean;
  headerAction?: React.ReactNode;
}) {
  const router = useRouter();
  const formatPickup = showDateTime ? formatDateTime : formatDate;

  function openBooking(id: number) {
    router.push(`/admin/bookings/${id}/edit`);
  }

  return (
    <Card padding="none">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        {headerAction}
      </div>

      <div className="md:hidden">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-text-muted">No bookings found</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((booking) => (
              <Link
                key={booking.id}
                href={`/admin/bookings/${booking.id}/edit`}
                className="block space-y-2 p-4 text-sm transition-colors hover:bg-border-light/40"
              >
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
                  <span className="text-text-secondary">
                    {showDateTime ? "Date & Time" : "Date"}
                  </span>
                  <span className="text-right text-text-secondary">
                    {formatPickup(booking.pickup_date)}
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
              </Link>
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
                {showDateTime ? "Date & Time" : "Date"}
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
                <tr
                  key={booking.id}
                  role="link"
                  tabIndex={0}
                  className="cursor-pointer hover:bg-border-light/40"
                  onClick={() => openBooking(booking.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openBooking(booking.id);
                    }
                  }}
                >
                  <td className="px-5 py-3 font-medium text-primary">
                    <Link
                      href={`/admin/bookings/${booking.id}/edit`}
                      className="hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {booking.ticket_no}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-primary">
                    {booking.customer?.name ?? "-"}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {booking.fromCity?.name ?? "?"} →{" "}
                    {booking.toCity?.name ?? "?"}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-text-secondary">
                    {formatPickup(booking.pickup_date)}
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
