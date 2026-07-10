"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import {
  Alert,
  Button,
  FormPage,
  Input,
  Select,
  SuggestInput,
  type SuggestOption,
} from "@/components/admin";
import {
  bookingsApi,
  branchesApi,
  carTypesApi,
  citiesApi,
  customersApi,
  statusApi,
} from "@/lib/services";

type BookingFormProps = {
  bookingId?: number;
  backHref?: string;
};

type CarLine = { car_type_id: string; price: string };

type CustomerRow = {
  id: number;
  name: string;
  mobile: string;
};

type PickupTime = {
  hour: string;
  minute: string;
  period: "AM" | "PM";
};

const emptyForm = {
  branch_id: "",
  customer_name: "",
  customer_mobile: "",
  trip_type: "one_way",
  from_city_id: "",
  to_city_id: "",
  pickup_date: "",
  price_type: "lumpsum",
  booking_amount: "",
  extra_amount: "0",
  paid_amount: "0",
  payment_type: "",
  status: "pending",
  remarks: "",
};

const defaultPickupTime: PickupTime = {
  hour: "12",
  minute: "00",
  period: "AM",
};

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const h = String(i + 1);
  return { value: h, label: h };
});

const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((i) => {
  const m = String(i).padStart(2, "0");
  return { value: m, label: m };
});

function to24Hour(hour: string, period: "AM" | "PM") {
  let h = Number(hour) || 12;
  if (period === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return String(h).padStart(2, "0");
}

function combinePickupDateTime(date: string, time: PickupTime) {
  if (!date) return date;
  const hh = to24Hour(time.hour, time.period);
  const mm = time.minute.padStart(2, "0");
  return `${date}T${hh}:${mm}:00`;
}

function splitPickupDateTime(value?: string | null): {
  date: string;
  time: PickupTime;
} {
  if (!value) return { date: "", time: { ...defaultPickupTime } };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return {
      date: String(value).slice(0, 10),
      time: { ...defaultPickupTime },
    };
  }
  let hours = d.getHours();
  const snappedMinute = Math.round(d.getMinutes() / 10) * 10;
  const minuteValue = snappedMinute === 60 ? 50 : snappedMinute;
  const minutes = String(minuteValue).padStart(2, "0");
  const period: "AM" | "PM" = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;
  return {
    date: [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-"),
    time: {
      hour: String(hours),
      minute: minutes,
      period,
    },
  };
}

export function BookingForm({
  bookingId,
  backHref = "/admin/bookings",
}: BookingFormProps) {
  const isEdit = !!bookingId;
  const [form, setForm] = useState(emptyForm);
  const [pickupTime, setPickupTime] = useState<PickupTime>({
    ...defaultPickupTime,
  });
  const [carLines, setCarLines] = useState<CarLine[]>([
    { car_type_id: "", price: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [branchOptions, setBranchOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [cityOptions, setCityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [carTypeOptions, setCarTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);

  const isOneWay = form.trip_type === "one_way";
  const isPerKm = form.price_type === "per_km" && !isOneWay;

  const carPricesSum = useMemo(
    () =>
      carLines.reduce((sum, line) => sum + (Number(line.price) || 0), 0),
    [carLines],
  );

  const extraAmount = Number(form.extra_amount) || 0;
  const baseAmount = isPerKm
    ? Number(form.booking_amount) || 0
    : carPricesSum;
  const totalBookingAmount = baseAmount + extraAmount;

  const nameSuggestions: SuggestOption[] = useMemo(
    () =>
      customers.map((c) => ({
        value: c.name,
        label: c.name,
        meta: { mobile: c.mobile, id: String(c.id) },
      })),
    [customers],
  );

  const mobileSuggestions: SuggestOption[] = useMemo(
    () =>
      customers.map((c) => ({
        value: c.mobile,
        label: c.mobile,
        meta: { name: c.name, id: String(c.id) },
      })),
    [customers],
  );

  useEffect(() => {
    statusApi
      .list()
      .then(({ statuses }) =>
        setStatusOptions(
          statuses.map((s) => ({
            value: s.key,
            label: s.name.charAt(0) + s.name.slice(1).toLowerCase(),
          })),
        ),
      )
      .catch(() => undefined);

    Promise.all([
      branchesApi.list({ limit: 100 }),
      citiesApi.list({ limit: 500 }),
      carTypesApi.list({ limit: 100 }),
      customersApi.list({ limit: 500 }),
    ]).then(([branches, cities, carTypes, customerRows]) => {
      setBranchOptions(
        branches.map((b) => ({ value: String(b.id), label: b.name })),
      );
      setCityOptions(cities.map((c) => ({ value: String(c.id), label: c.name })));
      setCarTypeOptions(
        carTypes.map((c) => ({ value: String(c.id), label: c.name })),
      );
      setCustomers(
        customerRows.map((c) => ({
          id: c.id,
          name: c.name,
          mobile: c.mobile,
        })),
      );
    });
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    setPageLoading(true);
    bookingsApi
      .get(bookingId)
      .then((b) => {
        const row = b as Record<string, unknown> & {
          customer?: { name?: string; mobile?: string };
          bookingCars?: { car_type_id: number; price: number }[];
        };
        const tripType = String(row.trip_type ?? "one_way");
        const priceType =
          tripType === "one_way"
            ? "lumpsum"
            : String(row.price_type ?? "lumpsum");
        const lines =
          row.bookingCars?.length
            ? row.bookingCars.map((line) => ({
                car_type_id: String(line.car_type_id),
                price: String(line.price ?? ""),
              }))
            : [
                {
                  car_type_id: String(row.car_type_id ?? ""),
                  price: "",
                },
              ];

        const { date, time } = splitPickupDateTime(
          row.pickup_date ? String(row.pickup_date) : null,
        );

        setForm({
          branch_id: String(row.branch_id ?? ""),
          customer_name: row.customer?.name ?? "",
          customer_mobile: row.customer?.mobile ?? "",
          trip_type: tripType,
          from_city_id: String(row.from_city_id ?? ""),
          to_city_id: String(row.to_city_id ?? ""),
          pickup_date: date,
          price_type: priceType,
          booking_amount: String(row.booking_amount ?? ""),
          extra_amount: String(row.extra_amount ?? "0"),
          paid_amount: String(row.paid_amount ?? "0"),
          payment_type: String(row.payment_type ?? ""),
          status: String(row.status ?? "pending"),
          remarks: String(row.remarks ?? ""),
        });
        setPickupTime(time);
        setCarLines(lines.length ? lines : [{ car_type_id: "", price: "" }]);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load booking"),
      )
      .finally(() => setPageLoading(false));
  }, [bookingId]);

  function setField(name: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "trip_type" && value === "one_way") {
        next.price_type = "lumpsum";
      }
      return next;
    });
  }

  function setCarLine(index: number, field: keyof CarLine, value: string) {
    setCarLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  }

  function addCarLine() {
    setCarLines((prev) => [...prev, { car_type_id: "", price: "" }]);
  }

  function removeCarLine(index: number) {
    setCarLines((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  function applyCustomerSuggestion(name: string, mobile: string) {
    setForm((prev) => ({
      ...prev,
      customer_name: name,
      customer_mobile: mobile,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.customer_name.trim() || !form.customer_mobile.trim()) {
      setError("Customer name and number are required");
      setLoading(false);
      return;
    }

    if (!form.pickup_date) {
      setError("Pickup date is required");
      setLoading(false);
      return;
    }

    if (carLines.some((line) => !line.car_type_id)) {
      setError("Please select car type for every car");
      setLoading(false);
      return;
    }

    if (!isPerKm && carLines.some((line) => line.price === "" || Number(line.price) < 0)) {
      setError("Please enter car price for every car");
      setLoading(false);
      return;
    }

    const priceType = isOneWay ? "lumpsum" : form.price_type;
    const bookingAmount = isPerKm
      ? Number(form.booking_amount) || 0
      : carPricesSum;

    if (isPerKm && bookingAmount <= 0) {
      setError("Per KM price is required");
      setLoading(false);
      return;
    }

    const body: Record<string, unknown> = {
      branch_id: Number(form.branch_id),
      customer_name: form.customer_name.trim(),
      customer_mobile: form.customer_mobile.trim(),
      trip_type: form.trip_type,
      from_city_id: Number(form.from_city_id),
      to_city_id: Number(form.to_city_id),
      pickup_date: combinePickupDateTime(form.pickup_date, pickupTime),
      num_cars: carLines.length,
      price_type: priceType,
      booking_amount: bookingAmount,
      extra_amount: Number(form.extra_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0,
      payment_type: form.payment_type || null,
      status: form.status,
      remarks: form.remarks || null,
      cars: carLines.map((line) => ({
        car_type_id: Number(line.car_type_id),
        price: Number(line.price) || 0,
      })),
    };

    try {
      if (isEdit && bookingId) {
        await bookingsApi.update(bookingId, body);
      } else {
        await bookingsApi.create(body);
      }
      window.location.href = backHref;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <FormPage
      title={isEdit ? "Edit Booking" : "New Booking"}
      description={isEdit ? "Update booking details" : "Create a new car booking"}
      backHref={backHref}
    >
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Branch"
            options={branchOptions}
            value={form.branch_id}
            onChange={(e) => setField("branch_id", e.target.value)}
            required
          />
          <SuggestInput
            label="Customer Name"
            placeholder="Enter customer name"
            value={form.customer_name}
            options={nameSuggestions}
            onChange={(e) => setField("customer_name", e.target.value)}
            onSelectOption={(opt) =>
              applyCustomerSuggestion(opt.label, opt.meta?.mobile ?? "")
            }
            required
          />
          <SuggestInput
            label="Customer Number"
            placeholder="Enter mobile number"
            value={form.customer_mobile}
            options={mobileSuggestions}
            onChange={(e) => setField("customer_mobile", e.target.value)}
            onSelectOption={(opt) =>
              applyCustomerSuggestion(opt.meta?.name ?? "", opt.value)
            }
            required
          />
          <Select
            label="Trip Type"
            options={[
              { value: "one_way", label: "One Way" },
              { value: "round_trip", label: "Round Trip" },
            ]}
            value={form.trip_type}
            onChange={(e) => setField("trip_type", e.target.value)}
            required
          />
          <Select
            label="From City"
            options={cityOptions}
            value={form.from_city_id}
            onChange={(e) => setField("from_city_id", e.target.value)}
            required
          />
          <Select
            label="To City"
            options={cityOptions}
            value={form.to_city_id}
            onChange={(e) => setField("to_city_id", e.target.value)}
            required
          />
          <Input
            label="Pickup Date"
            type="date"
            value={form.pickup_date}
            onChange={(e) => setField("pickup_date", e.target.value)}
            required
          />
          <div className="flex min-w-0 flex-col gap-1.5 md:col-span-2 xl:col-span-1">
            <span className="text-sm font-medium text-text-primary">
              Pickup Time
            </span>
            <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
              <Select
                options={HOUR_OPTIONS}
                value={pickupTime.hour}
                onChange={(e) =>
                  setPickupTime((prev) => ({ ...prev, hour: e.target.value }))
                }
                placeholder="Hour"
                required
              />
              <Select
                options={MINUTE_OPTIONS}
                value={pickupTime.minute}
                onChange={(e) =>
                  setPickupTime((prev) => ({ ...prev, minute: e.target.value }))
                }
                placeholder="Min"
                required
              />
              <Select
                options={[
                  { value: "AM", label: "AM" },
                  { value: "PM", label: "PM" },
                ]}
                value={pickupTime.period}
                onChange={(e) =>
                  setPickupTime((prev) => ({
                    ...prev,
                    period: e.target.value as "AM" | "PM",
                  }))
                }
                placeholder="AM/PM"
                required
              />
            </div>
          </div>
          <Select
            label="Price Type"
            options={[
              { value: "lumpsum", label: "Fix Price" },
              ...(isOneWay ? [] : [{ value: "per_km", label: "Per KM" }]),
            ]}
            value={isOneWay ? "lumpsum" : form.price_type}
            onChange={(e) => setField("price_type", e.target.value)}
            disabled={isOneWay}
            required
          />
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-page-bg/50 p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Cars</h3>
              <p className="text-xs text-text-muted">
                Add or remove car type and price rows
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={addCarLine}
            >
              + Add Car
            </Button>
          </div>
          <div className="grid gap-3">
            {carLines.map((line, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card-bg p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-end"
              >
                <Select
                  label={index === 0 ? "Car Type" : `Car Type #${index + 1}`}
                  options={carTypeOptions}
                  value={line.car_type_id}
                  onChange={(e) =>
                    setCarLine(index, "car_type_id", e.target.value)
                  }
                  required
                />
                <Input
                  label={index === 0 ? "Car Price (₹)" : `Car Price #${index + 1} (₹)`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.price}
                  onChange={(e) => setCarLine(index, "price", e.target.value)}
                  required={!isPerKm}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  className="w-full xl:mb-0.5 xl:w-auto"
                  disabled={carLines.length <= 1}
                  onClick={() => removeCarLine(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {isPerKm && (
            <Input
              label="Per KM Price (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.booking_amount}
              onChange={(e) => setField("booking_amount", e.target.value)}
              required
              hint="Per KM price"
            />
          )}
          <Input
            label="Extra Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.extra_amount}
            onChange={(e) => setField("extra_amount", e.target.value)}
          />
          <Input
            label="Booking Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={String(totalBookingAmount)}
            readOnly
            hint={
              isPerKm
                ? "Per KM price + extra amount"
                : "Car prices + extra amount"
            }
          />
          <Input
            label="Advance Paid (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.paid_amount}
            onChange={(e) => setField("paid_amount", e.target.value)}
          />
          <Select
            label="Payment Type"
            options={[
              { value: "cash", label: "Cash" },
              { value: "upi", label: "UPI" },
              { value: "bank", label: "Bank Transfer" },
              { value: "card", label: "Card" },
            ]}
            value={form.payment_type}
            onChange={(e) => setField("payment_type", e.target.value)}
          />
          <Select
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          />
        </div>

        <Input
          label="Remarks"
          value={form.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
        />

        <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
          <Button type="submit" loading={loading} className="w-full sm:w-auto">
            {isEdit ? "Update Booking" : "Create Booking"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => (window.location.href = backHref)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPage>
  );
}
