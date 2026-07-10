"use client";

import { useEffect, useState } from "react";
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
  branchesApi,
  capitalizeStatus,
  carsApi,
  driversApi,
  formatDate,
  formatMoney,
  reportsApi,
  usersApi,
  vendorsApi,
} from "@/lib/services";

function monthBounds() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
  return { from, to };
}

const KPI_LABELS: { key: string; label: string }[] = [
  { key: "bookingCount", label: "Booking Count" },
  { key: "bookingAmount", label: "Booking Amount" },
  { key: "advanceAmount", label: "Advance Amount" },
  { key: "pendingAmount", label: "Pending Amount" },
  { key: "cancelledBookings", label: "Cancelled Bookings" },
  { key: "completedBookings", label: "Completed Bookings" },
  { key: "income", label: "Income" },
  { key: "expense", label: "Expense" },
  { key: "profitLoss", label: "Profit / Loss" },
  { key: "commissionTarget", label: "Commission Target" },
  { key: "commissionEarned", label: "Commission Earned" },
  { key: "commissionPending", label: "Commission Pending" },
  { key: "commissionReceivedBookings", label: "Commission Received Bookings" },
  { key: "commissionPendingBookings", label: "Commission Pending Bookings" },
];

export default function ReportsPage() {
  const bounds = monthBounds();
  const [from, setFrom] = useState(bounds.from);
  const [to, setTo] = useState(bounds.to);
  const [branchId, setBranchId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [carId, setCarId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("");
  const [tripType, setTripType] = useState("");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [bookingRows, setBookingRows] = useState<Record<string, unknown>[]>([]);
  const [earnedRows, setEarnedRows] = useState<Record<string, unknown>[]>([]);
  const [pendingRows, setPendingRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ran, setRan] = useState(false);

  const [branchOptions, setBranchOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [vendorOptions, setVendorOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [carOptions, setCarOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [driverOptions, setDriverOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [userOptions, setUserOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      branchesApi.list({ limit: 100 }),
      vendorsApi.list({ limit: 200 }),
      carsApi.list({ limit: 500 }),
      driversApi.list({ limit: 200 }),
      usersApi.list({ limit: 200 }),
    ]).then(([branches, vendors, cars, drivers, users]) => {
      setBranchOptions(
        branches.map((b) => ({ value: String(b.id), label: b.name })),
      );
      setVendorOptions(
        vendors.map((v) => ({ value: String(v.id), label: v.name })),
      );
      setCarOptions(
        cars.map((c) => ({
          value: String(c.id),
          label: String(c.car_number),
        })),
      );
      setDriverOptions(
        drivers.map((d) => ({ value: String(d.id), label: d.name })),
      );
      setUserOptions(
        users.map((u) => ({
          value: String(u.id),
          label: String(u.display_name ?? u.username),
        })),
      );
    });
  }, []);

  function filters() {
    return {
      from,
      to,
      branch_id: branchId || undefined,
      vendor_id: vendorId || undefined,
      car_id: carId || undefined,
      driver_id: driverId || undefined,
      user_id: userId || undefined,
      status: status || undefined,
      trip_type: tripType || undefined,
    };
  }

  async function runReports() {
    setLoading(true);
    setError("");
    try {
      const f = filters();
      const [summaryRes, bookingsRes, earnedRes, pendingRes] =
        await Promise.all([
          reportsApi.summary(f),
          reportsApi.bookings(f),
          reportsApi.commissionEarned(f),
          reportsApi.commissionPending(f),
        ]);
      setSummary(summaryRes.summary);
      setBookingRows(bookingsRes.rows);
      setEarnedRows(earnedRes.rows);
      setPendingRows(pendingRes.rows);
      setRan(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const csv = await reportsApi.exportCsv(filters());
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookings-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed");
    }
  }

  const bookingColumns: Column<Record<string, unknown>>[] = [
    { key: "ticket", header: "Ticket" },
    { key: "customer", header: "Customer" },
    { key: "contact", header: "Contact" },
    { key: "route", header: "Route" },
    { key: "trip", header: "Trip" },
    { key: "cars", header: "Cars" },
    { key: "vendor", header: "Vendor" },
    { key: "car", header: "Car" },
    { key: "driver", header: "Driver" },
    { key: "user", header: "User" },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => formatDate(row.pickup as string),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => capitalizeStatus(row.status as string),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatMoney(row.amount as number),
    },
    {
      key: "commission",
      header: "Commission",
      render: (row) => formatMoney(row.commission as number),
    },
  ];

  const earnedColumns: Column<Record<string, unknown>>[] = [
    {
      key: "paymentDate",
      header: "Payment Date",
      render: (row) => formatDate(row.paymentDate as string),
    },
    { key: "ticket", header: "Ticket" },
    { key: "customer", header: "Customer" },
    { key: "vendor", header: "Vendor" },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatMoney(row.amount as number),
    },
    { key: "mode", header: "Mode" },
    { key: "reference", header: "Reference" },
  ];

  const pendingColumns: Column<Record<string, unknown>>[] = [
    { key: "ticket", header: "Ticket" },
    { key: "customer", header: "Customer" },
    { key: "vendor", header: "Vendor" },
    {
      key: "pickup",
      header: "Pickup",
      render: (row) => formatDate(row.pickup as string),
    },
    {
      key: "commissionAmount",
      header: "Commission",
      render: (row) => formatMoney(row.commissionAmount as number),
    },
    {
      key: "received",
      header: "Received",
      render: (row) => formatMoney(row.received as number),
    },
    {
      key: "pending",
      header: "Pending",
      render: (row) => formatMoney(row.pending as number),
    },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate and view business reports"
      />

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select label="Branch" options={branchOptions} value={branchId} onChange={(e) => setBranchId(e.target.value)} />
          <Select label="Vendor" options={vendorOptions} value={vendorId} onChange={(e) => setVendorId(e.target.value)} />
          <Select label="Car" options={carOptions} value={carId} onChange={(e) => setCarId(e.target.value)} />
          <Select label="Driver" options={driverOptions} value={driverId} onChange={(e) => setDriverId(e.target.value)} />
          <Select label="User" options={userOptions} value={userId} onChange={(e) => setUserId(e.target.value)} />
          <Select
            label="Status"
            options={[
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          />
          <Select
            label="Trip Type"
            options={[
              { value: "one_way", label: "One Way" },
              { value: "round_trip", label: "Round Trip" },
            ]}
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button onClick={runReports} loading={loading} className="w-full sm:w-auto">
            Run Reports
          </Button>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            Export CSV
          </Button>
        </div>
      </Card>

      {ran && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
            {KPI_LABELS.map(({ key, label }) => (
              <Card key={key}>
                <p className="text-xs text-text-secondary">{label}</p>
                <p className="mt-1 text-lg font-semibold text-text-primary">
                  {key.toLowerCase().includes("amount") ||
                  key === "income" ||
                  key === "expense" ||
                  key === "profitLoss" ||
                  key.startsWith("commission")
                    ? formatMoney(summary[key])
                    : (summary[key] ?? 0)}
                </p>
              </Card>
            ))}
          </div>

          <ReportSection
            title="Date Range Booking Report"
            columns={bookingColumns}
            rows={bookingRows}
          />
          <ReportSection
            title="Commission Earned Report"
            columns={earnedColumns}
            rows={earnedRows}
          />
          <ReportSection
            title="Pending Commission Report"
            columns={pendingColumns}
            rows={pendingRows}
          />
        </>
      )}
    </>
  );
}

function ReportSection({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: Column<Record<string, unknown>>[];
  rows: Record<string, unknown>[];
}) {
  return (
    <Card padding="none" className="mb-6">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      </div>
      <DataTable columns={columns} data={rows} />
    </Card>
  );
}
