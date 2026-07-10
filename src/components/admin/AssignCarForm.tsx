"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  Card,
  Input,
  PageHeader,
  Select,
  SuggestInput,
  WhatsAppTemplatePicker,
  type SuggestOption,
} from "@/components/admin";
import {
  bookingsApi,
  capitalizeStatus,
  carTypesApi,
  carsApi,
  driversApi,
  formatDate,
  formatMoney,
  formatTime12h,
  formatTripType,
  type AssignBooking,
  vendorsApi,
} from "@/lib/services";

type AssignmentForm = {
  booking_car_id: number;
  requested_type: string;
  vehicle_type: "own" | "vendor";
  car_type_id: string;
  car_type_name: string;
  car_id: string;
  car_number: string;
  driver_id: string;
  driver_name: string;
  driver_mobile: string;
  vendor_id: string;
  vendor_name: string;
  vendor_rate: string;
  commission_amount: string;
};

function emptyAssignment(
  bookingCarId: number,
  requestedType = "",
): AssignmentForm {
  return {
    booking_car_id: bookingCarId,
    requested_type: requestedType,
    vehicle_type: "own",
    car_type_id: "",
    car_type_name: "",
    car_id: "",
    car_number: "",
    driver_id: "",
    driver_name: "",
    driver_mobile: "",
    vendor_id: "",
    vendor_name: "",
    vendor_rate: "",
    commission_amount: "",
  };
}

function assignmentFromLine(
  line: NonNullable<AssignBooking["bookingCars"]>[number],
): AssignmentForm {
  const vehicleType = line.vehicle_type === "vendor" ? "vendor" : "own";
  return {
    booking_car_id: line.id ?? 0,
    requested_type: line.carType?.name ?? "",
    vehicle_type: vehicleType,
    car_type_id: String(line.car?.carType?.id ?? line.carType?.id ?? ""),
    car_type_name:
      line.car?.carType?.name ?? line.carType?.name ?? "",
    car_id: String(line.car?.id ?? ""),
    car_number: line.car?.car_number ?? "",
    driver_id: String(line.driver?.id ?? ""),
    driver_name: line.driver?.name ?? "",
    driver_mobile: line.driver?.mobile ?? "",
    vendor_id: String(line.car?.vendor?.id ?? ""),
    vendor_name: line.car?.vendor?.name ?? "",
    vendor_rate: line.vendor_rate != null ? String(line.vendor_rate) : "",
    commission_amount:
      line.commission_amount != null ? String(line.commission_amount) : "",
  };
}

interface AssignCarFormProps {
  bookingId: number;
}

export function AssignCarForm({ bookingId }: AssignCarFormProps) {
  const [booking, setBooking] = useState<AssignBooking | null>(null);
  const [assignNote, setAssignNote] = useState("");
  const [assignments, setAssignments] = useState<AssignmentForm[]>([]);
  const [carTypes, setCarTypes] = useState<{ id: number; name: string }[]>([]);
  const [cars, setCars] = useState<Record<string, unknown>[]>([]);
  const [drivers, setDrivers] = useState<
    { id: number; name: string; mobile: string }[]
  >([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingRow, typeRows, carRows, driverRows, vendorRows] =
        await Promise.all([
          bookingsApi.get(bookingId),
          carTypesApi.list({ limit: 500 }),
          carsApi.list({ limit: 500 }),
          driversApi.list({ limit: 500 }),
          vendorsApi.list({ limit: 500 }),
        ]);

      const b = bookingRow as AssignBooking;
      const lines = [...(b.bookingCars ?? [])].sort(
        (a, c) => (a.line_no ?? 0) - (c.line_no ?? 0),
      );

      setBooking(b);
      setAssignNote(String(b.assign_note ?? ""));
      setAssignments(
        lines.length
          ? lines.map((line) => assignmentFromLine(line))
          : [emptyAssignment(0)],
      );
      setCarTypes(typeRows);
      setCars(carRows);
      setDrivers(driverRows);
      setVendors(vendorRows);
      setSaved(lines.some((line) => line.car?.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load booking");
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    load();
  }, [load]);

  const carTypeOptions: SuggestOption[] = useMemo(
    () =>
      carTypes.map((t) => ({
        value: String(t.id),
        label: t.name,
      })),
    [carTypes],
  );

  const vendorOptions: SuggestOption[] = useMemo(
    () =>
      vendors.map((v) => ({
        value: String(v.id),
        label: v.name,
      })),
    [vendors],
  );

  const driverOptions: SuggestOption[] = useMemo(
    () =>
      drivers.map((d) => ({
        value: d.mobile,
        label: d.name,
        meta: { id: String(d.id), mobile: d.mobile },
      })),
    [drivers],
  );

  function carOptionsFor(vehicleType: "own" | "vendor"): SuggestOption[] {
    return cars
      .filter((row) => {
        const ownership = String(row.ownership_type ?? "own");
        return vehicleType === "vendor"
          ? ownership === "vendor"
          : ownership === "own";
      })
      .map((row) => {
        const carType = row.carType as { name?: string } | undefined;
        const driver = row.driver as { name?: string; mobile?: string } | undefined;
        return {
          value: String(row.car_number ?? ""),
          label: String(row.car_number ?? ""),
          meta: {
            id: String(row.id ?? ""),
            car_type_id: String(row.car_type_id ?? ""),
            car_type_name: carType?.name ?? "",
            driver_id: String(row.driver_id ?? ""),
            driver_name: driver?.name ?? "",
            driver_mobile: driver?.mobile ?? "",
            vendor_id: String(row.vendor_id ?? ""),
            vendor_name:
              (row.vendor as { name?: string } | undefined)?.name ?? "",
          },
        };
      });
  }

  function patchAssignment(index: number, patch: Partial<AssignmentForm>) {
    setAssignments((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function handleCarSelect(index: number, opt: SuggestOption) {
    const meta = opt.meta ?? {};
    patchAssignment(index, {
      car_id: meta.id ?? "",
      car_number: opt.label,
      car_type_id: meta.car_type_id ?? "",
      car_type_name: meta.car_type_name ?? "",
      driver_id: meta.driver_id ?? "",
      driver_name: meta.driver_name ?? "",
      driver_mobile: meta.driver_mobile ?? "",
      vendor_id: meta.vendor_id ?? "",
      vendor_name: meta.vendor_name ?? "",
    });
  }

  function handleDriverSelect(index: number, opt: SuggestOption) {
    patchAssignment(index, {
      driver_id: opt.meta?.id ?? "",
      driver_name: opt.label,
      driver_mobile: opt.value,
    });
  }

  function handleVendorSelect(index: number, opt: SuggestOption) {
    patchAssignment(index, {
      vendor_id: opt.value,
      vendor_name: opt.label,
    });
  }

  function handleCarTypeSelect(index: number, opt: SuggestOption) {
    patchAssignment(index, {
      car_type_id: opt.value,
      car_type_name: opt.label,
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        assign_note: assignNote.trim() || null,
        assignments: assignments.map((row) => ({
          booking_car_id: row.booking_car_id,
          vehicle_type: row.vehicle_type,
          car_type_id: row.car_type_id ? Number(row.car_type_id) : undefined,
          car_type_name: row.car_type_name.trim() || undefined,
          car_id: row.car_id ? Number(row.car_id) : undefined,
          car_number: row.car_number.trim(),
          driver_id: row.driver_id ? Number(row.driver_id) : undefined,
          driver_name: row.driver_name.trim(),
          driver_mobile: row.driver_mobile.trim(),
          vendor_id: row.vendor_id ? Number(row.vendor_id) : undefined,
          vendor_name: row.vendor_name.trim() || undefined,
          vendor_rate:
            row.vehicle_type === "vendor"
              ? Number(row.vendor_rate) || 0
              : 0,
          commission_amount:
            row.vehicle_type === "vendor"
              ? Number(row.commission_amount) || 0
              : 0,
        })),
      };

      const updated = await bookingsApi.assign(bookingId, payload);
      setBooking(updated as AssignBooking);
      const lines = [...((updated as AssignBooking).bookingCars ?? [])].sort(
        (a, c) => (a.line_no ?? 0) - (c.line_no ?? 0),
      );
      setAssignments(lines.map((line) => assignmentFromLine(line)));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-text-muted">Loading assignment...</p>;
  }

  if (!booking) {
    return (
      <Alert variant="danger">{error || "Booking not found"}</Alert>
    );
  }

  const customerMobile =
    booking.customer?.whatsapp || booking.customer?.mobile || "";
  const vehicleSummary =
    booking.bookingCars
      ?.map((line) => line.carType?.name)
      .filter(Boolean)
      .join(", ") || "-";
  const totalAmount =
    Number(booking.booking_amount ?? 0) + Number(booking.extra_amount ?? 0);

  return (
    <>
      <PageHeader title="Assign Car" description={`Ticket ${booking.ticket_no}`}>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link href={`/admin/bookings/${bookingId}/edit`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Edit Booking
            </Button>
          </Link>
          <Link href="/admin/bookings" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              Back
            </Button>
          </Link>
        </div>
      </PageHeader>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">
          Booking Details
        </h2>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <dt className="text-xs text-text-muted">Ticket</dt>
            <dd className="font-medium">{booking.ticket_no}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Customer</dt>
            <dd className="font-medium">
              {booking.customer?.name ?? "-"}
              {booking.customer?.mobile ? ` (${booking.customer.mobile})` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">From</dt>
            <dd className="font-medium">{booking.fromCity?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">To</dt>
            <dd className="font-medium">{booking.toCity?.name ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Pickup</dt>
            <dd className="font-medium">
              {formatDate(booking.pickup_date)} ·{" "}
              {formatTime12h(booking.pickup_date)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Trip Type</dt>
            <dd className="font-medium">{formatTripType(booking.trip_type)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Requested Vehicles</dt>
            <dd className="font-medium">{vehicleSummary}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Amount</dt>
            <dd className="font-medium">{formatMoney(totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Status</dt>
            <dd className="font-medium">{capitalizeStatus(booking.status)}</dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-col gap-1.5">
          <label
            htmlFor="assign-note"
            className="text-sm font-medium text-text-primary"
          >
            Note
          </label>
          <textarea
            id="assign-note"
            rows={3}
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
            placeholder="Any note for this assignment..."
            className="w-full rounded-lg border border-border bg-card-bg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </Card>

      <form onSubmit={handleSave} className="space-y-4">
        {assignments.map((row, index) => (
          <Card key={row.booking_car_id || index}>
            <h3 className="mb-4 text-base font-semibold text-text-primary">
              Vehicle {index + 1} of {assignments.length}
              {row.requested_type ? ` — ${row.requested_type}` : ""}
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Vehicle Type"
                value={row.vehicle_type}
                onChange={(e) =>
                  patchAssignment(index, {
                    vehicle_type: e.target.value as "own" | "vendor",
                  })
                }
                options={[
                  { value: "own", label: "Own Vehicle" },
                  { value: "vendor", label: "Vendor Vehicle" },
                ]}
              />

              <SuggestInput
                label="Vehicle Name"
                value={row.car_type_name}
                onChange={(e) =>
                  patchAssignment(index, {
                    car_type_name: e.target.value,
                    car_type_id: "",
                  })
                }
                options={carTypeOptions}
                onSelectOption={(opt) => handleCarTypeSelect(index, opt)}
              />

              <SuggestInput
                label="Car Number"
                value={row.car_number}
                onChange={(e) =>
                  patchAssignment(index, {
                    car_number: e.target.value,
                    car_id: "",
                  })
                }
                options={carOptionsFor(row.vehicle_type)}
                onSelectOption={(opt) => handleCarSelect(index, opt)}
              />

              <SuggestInput
                label="Driver Name"
                value={row.driver_name}
                onChange={(e) =>
                  patchAssignment(index, {
                    driver_name: e.target.value,
                    driver_id: "",
                  })
                }
                options={driverOptions}
                filterKeys={["label", "value"]}
                onSelectOption={(opt) => handleDriverSelect(index, opt)}
              />

              <SuggestInput
                label="Driver Number"
                value={row.driver_mobile}
                onChange={(e) =>
                  patchAssignment(index, {
                    driver_mobile: e.target.value,
                    driver_id: "",
                  })
                }
                options={driverOptions}
                onSelectOption={(opt) => handleDriverSelect(index, opt)}
              />

              {row.vehicle_type === "vendor" && (
                <>
                  <SuggestInput
                    label="Vendor Name"
                    value={row.vendor_name}
                    onChange={(e) =>
                      patchAssignment(index, {
                        vendor_name: e.target.value,
                        vendor_id: "",
                      })
                    }
                    options={vendorOptions}
                    onSelectOption={(opt) => handleVendorSelect(index, opt)}
                  />
                  <Input
                    label="Vendor Rate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.vendor_rate}
                    onChange={(e) =>
                      patchAssignment(index, { vendor_rate: e.target.value })
                    }
                  />
                  <Input
                    label="Commission"
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.commission_amount}
                    onChange={(e) =>
                      patchAssignment(index, {
                        commission_amount: e.target.value,
                      })
                    }
                  />
                </>
              )}
            </div>
          </Card>
        ))}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save Booking"}
          </Button>
        </div>
      </form>

      {saved && booking && (
        <Card className="mt-4">
          <h3 className="mb-3 text-base font-semibold text-text-primary">
            Share Assignment
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {customerMobile && (
              <WhatsAppTemplatePicker
                category="assign_customer"
                booking={booking}
                mobile={customerMobile}
                buttonLabel="Share to Customer"
                buttonVariant="primary"
              />
            )}
            {assignments.map((_, index) => (
              <WhatsAppTemplatePicker
                key={index}
                category="assign_driver"
                booking={booking}
                lineIndex={index}
                mode="copy"
                buttonLabel={
                  copyFeedback === index
                    ? "Copied!"
                    : `Copy Driver ${index + 1} Message`
                }
                buttonVariant="outline"
                onCopied={() => {
                  setCopyFeedback(index);
                  setTimeout(() => setCopyFeedback(null), 2000);
                }}
              />
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
