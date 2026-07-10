"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  DataTable,
  type Column,
  Input,
  PageHeader,
  Select,
} from "@/components/admin";
import {
  bookingsApi,
  buildBookingWhatsAppMessage,
  buildWhatsAppShareUrl,
  capitalizeStatus,
  formatDate,
  formatMoney,
  statusApi,
  statusBadgeClass,
} from "@/lib/services";

type BookingRow = Record<string, unknown> & {
  id: number;
  ticket_no: string;
  status: string;
  booking_amount: number;
  extra_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  payment_type?: string;
  trip_type?: string;
  customer?: { name: string; mobile?: string; whatsapp?: string };
  car?: { car_number: string };
  carType?: { name: string };
  bookingCars?: {
    carType?: { name: string };
    price?: number;
    car?: { car_number: string };
  }[];
  fromCity?: { name: string };
  toCity?: { name: string };
  pickup_date: string;
};

export default function BookingsPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]);

  useEffect(() => {
    statusApi
      .list()
      .then(({ statuses }) =>
        setStatusOptions(
          statuses.map((s) => ({
            value: s.key,
            label: capitalizeStatus(s.key),
          })),
        ),
      )
      .catch(() => undefined);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await bookingsApi.list({
        search: query,
        status: status || undefined,
        limit: 100,
      });
      setData(rows as BookingRow[]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load bookings");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [query, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCancel(id: number) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await bookingsApi.cancel(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel failed");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Permanently delete this booking?")) return;
    try {
      await bookingsApi.remove(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  const columns: Column<BookingRow>[] = [
    {
      key: "ticket_no",
      header: "Ticket",
      className: "font-medium text-primary",
    },
    {
      key: "customer",
      header: "Customer",
      render: (row) => row.customer?.name ?? "-",
    },
    {
      key: "car",
      header: "Car",
      render: (row) => {
        const assigned =
          row.bookingCars
            ?.map((line) => line.car?.car_number)
            .filter(Boolean) ?? [];
        if (assigned.length > 0) {
          const first = assigned[0];
          return assigned.length > 1 ? `${first} +${assigned.length - 1}` : first;
        }
        return row.car?.car_number ?? "-";
      },
    },
    {
      key: "fromCity",
      header: "From",
      render: (row) => row.fromCity?.name ?? "-",
    },
    {
      key: "toCity",
      header: "To",
      render: (row) => row.toCity?.name ?? "-",
    },
    {
      key: "pickup_date",
      header: "Pickup",
      render: (row) => formatDate(row.pickup_date),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}
        >
          {capitalizeStatus(row.status)}
        </span>
      ),
    },
    {
      key: "booking_amount",
      header: "Amount",
      className: "font-medium",
      render: (row) => formatMoney(row.booking_amount),
    },
    {
      key: "actions" as keyof BookingRow & string,
      header: "Actions",
      render: (row) => {
        const mobile = row.customer?.whatsapp || row.customer?.mobile;
        return (
          <div className="flex flex-wrap gap-1">
            {row.status !== "cancelled" && (
              <Link href={`/admin/bookings/${row.id}/assign`}>
                <Button size="sm" variant="outline">
                  Assign Car
                </Button>
              </Link>
            )}
            <Link href={`/admin/bookings/${row.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            {row.status !== "cancelled" && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleCancel(row.id)}
              >
                Cancel
              </Button>
            )}
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(row.id)}
            >
              Delete
            </Button>
            {mobile && (
              <a
                href={buildWhatsAppShareUrl(
                  mobile,
                  buildBookingWhatsAppMessage(row),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="ghost">
                  WhatsApp
                </Button>
              </a>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.print()}
            >
              Print
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Manage all car bookings"
        action={{ label: "New Booking", href: "/admin/bookings/new" }}
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              label="Search"
              placeholder="Search by ticket, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-48">
            <Select
              label="Status"
              options={statusOptions}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
                setStatus("");
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
    </>
  );
}
