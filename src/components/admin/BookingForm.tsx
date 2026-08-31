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
  statesApi,
  statusApi,
} from "@/lib/services";
import {
  combinePickupDateTime,
  splitPickupDateTime,
} from "@/lib/pickupDate";

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
  from_city_name: "",
  to_city_id: "",
  to_city_name: "",
  pickup_date: "",
  price_type: "lumpsum",
  per_km_rate: "",
  approx_km: "",
  actual_km: "",
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
  const [cities, setCities] = useState<
    { id: number; name: string; state_id?: number }[]
  >([]);
  const [defaultStateId, setDefaultStateId] = useState<number | null>(null);
  const [carTypeOptions, setCarTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [statusOptions, setStatusOptions] = useState<
    { value: string; label: string }[]
  >([
    { value: "pending", label: "Unassigned" },
    { value: "car_assigned", label: "Assigned Car" },
    { value: "confirmed", label: "Assigned Car" },
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

  const perKmRate = Number(form.per_km_rate) || 0;
  const approxKm = Number(form.approx_km) || 0;
  const actualKmRaw = form.actual_km.trim();
  const actualKm =
    actualKmRaw === "" ? null : Number(form.actual_km);
  const effectiveKm =
    actualKm != null && !Number.isNaN(actualKm) ? actualKm : approxKm;

  const extraAmount = Number(form.extra_amount) || 0;
  const baseAmount = isPerKm ? effectiveKm * perKmRate : carPricesSum;
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

  const citySuggestions: SuggestOption[] = useMemo(
    () =>
      cities.map((c) => ({
        value: String(c.id),
        label: c.name,
        meta: { id: String(c.id) },
      })),
    [cities],
  );

  function applyCitySuggestion(
    field: "from" | "to",
    name: string,
    id: string,
  ) {
    if (field === "from") {
      setForm((prev) => ({
        ...prev,
        from_city_id: id,
        from_city_name: name,
      }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      to_city_id: id,
      to_city_name: name,
    }));
  }

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
      statesApi.list({ limit: 50 }),
    ]).then(([branches, cityRows, carTypes, customerRows, states]) => {
      setBranchOptions(
        branches.map((b) => ({ value: String(b.id), label: b.name })),
      );
      setCities(
        cityRows.map((c) => ({
          id: c.id,
          name: c.name,
          state_id: c.state_id,
        })),
      );
      setDefaultStateId(
        cityRows[0]?.state_id ??
          (states[0] ? Number(states[0].id) : null),
      );
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

  async function resolveCityId(
    cityId: string,
    cityName: string,
  ): Promise<number> {
    const name = cityName.trim();
    if (cityId) return Number(cityId);

    const existing = cities.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing.id;

    if (!defaultStateId) {
      throw new Error(
        "Cannot create city: add at least one state in Masters first",
      );
    }

    const created = (await citiesApi.create({
      name,
      state_id: defaultStateId,
    })) as { id?: number; name?: string; state_id?: number } | undefined;

    let resolvedId = created?.id;
    let resolvedName = created?.name ?? name;
    let resolvedStateId = created?.state_id ?? defaultStateId;

    // Fallback if API response shape is unexpected
    if (!resolvedId) {
      const refreshed = await citiesApi.list({ search: name, limit: 100 });
      const match = refreshed.find(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      );
      if (!match) {
        throw new Error("Failed to create or find city in master");
      }
      resolvedId = match.id;
      resolvedName = match.name;
      resolvedStateId = match.state_id;
    }

    setCities((prev) => {
      if (prev.some((c) => c.id === resolvedId)) return prev;
      return [
        ...prev,
        {
          id: resolvedId!,
          name: resolvedName,
          state_id: resolvedStateId,
        },
      ];
    });

    return resolvedId;
  }

  useEffect(() => {
    if (!bookingId) return;
    setPageLoading(true);
    bookingsApi
      .get(bookingId)
      .then((b) => {
        const row = b as Record<string, unknown> & {
          customer?: { name?: string; mobile?: string };
          fromCity?: { id?: number; name?: string };
          toCity?: { id?: number; name?: string };
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
          from_city_id: String(row.from_city_id ?? row.fromCity?.id ?? ""),
          from_city_name: row.fromCity?.name ?? "",
          to_city_id: String(row.to_city_id ?? row.toCity?.id ?? ""),
          to_city_name: row.toCity?.name ?? "",
          pickup_date: date,
          price_type: priceType,
          per_km_rate:
            row.per_km_rate != null && row.per_km_rate !== ""
              ? String(row.per_km_rate)
              : "",
          approx_km:
            row.approx_km != null && row.approx_km !== ""
              ? String(row.approx_km)
              : "",
          actual_km:
            row.actual_km != null && row.actual_km !== ""
              ? String(row.actual_km)
              : "",
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
        next.per_km_rate = "";
        next.approx_km = "";
        next.actual_km = "";
      }
      if (name === "price_type" && value === "lumpsum") {
        next.per_km_rate = "";
        next.approx_km = "";
        next.actual_km = "";
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

    if (!form.from_city_name.trim() || !form.to_city_name.trim()) {
      setError("From city and To city are required");
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

    if (isPerKm) {
      if (perKmRate <= 0) {
        setError("Per KM rate is required");
        setLoading(false);
        return;
      }
      if (approxKm <= 0) {
        setError("Approx KM is required");
        setLoading(false);
        return;
      }
    }

    const bookingAmount = isPerKm ? effectiveKm * perKmRate : carPricesSum;

    try {
      const fromCityId = await resolveCityId(
        form.from_city_id,
        form.from_city_name,
      );
      const toCityId = await resolveCityId(form.to_city_id, form.to_city_name);

      const body: Record<string, unknown> = {
        branch_id: Number(form.branch_id),
        customer_name: form.customer_name.trim(),
        customer_mobile: form.customer_mobile.trim(),
        trip_type: form.trip_type,
        from_city_id: fromCityId,
        to_city_id: toCityId,
        pickup_date: combinePickupDateTime(form.pickup_date, pickupTime),
        num_cars: carLines.length,
        price_type: priceType,
        per_km_rate: isPerKm ? perKmRate : null,
        approx_km: isPerKm ? approxKm : null,
        actual_km:
          isPerKm && actualKm != null && !Number.isNaN(actualKm)
            ? actualKm
            : null,
        booking_amount: bookingAmount,
        extra_amount: Number(form.extra_amount) || 0,
        paid_amount: Number(form.paid_amount) || 0,
        payment_type: form.payment_type || null,
        status: form.status,
        remarks: form.remarks || null,
        cars: carLines.map((line) => ({
          car_type_id: Number(line.car_type_id),
          price: isPerKm ? 0 : Number(line.price) || 0,
        })),
      };

      if (isEdit && bookingId) {
        await bookingsApi.update(bookingId, body);
      } else {
        await bookingsApi.create(body);
      }
      window.location.href = backHref;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Save failed",
      );
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
          <SuggestInput
            label="From City"
            placeholder="Type or select from city"
            value={form.from_city_name}
            options={citySuggestions}
            filterKeys={["label"]}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                from_city_name: e.target.value,
                from_city_id: "",
              }))
            }
            onSelectOption={(opt) =>
              applyCitySuggestion("from", opt.label, opt.value)
            }
            required
          />
          <SuggestInput
            label="To City"
            placeholder="Type or select to city"
            value={form.to_city_name}
            options={citySuggestions}
            filterKeys={["label"]}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                to_city_name: e.target.value,
                to_city_id: "",
              }))
            }
            onSelectOption={(opt) =>
              applyCitySuggestion("to", opt.label, opt.value)
            }
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
                  label={
                    index === 0 ? "Car Price (₹)" : `Car Price #${index + 1} (₹)`
                  }
                  type="number"
                  min="0"
                  step="0.01"
                  value={isPerKm ? "" : line.price}
                  onChange={(e) => setCarLine(index, "price", e.target.value)}
                  required={!isPerKm}
                  disabled={isPerKm}
                  placeholder={isPerKm ? "—" : undefined}
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
            <>
              <Input
                label="Per KM Rate (₹)"
                type="number"
                min="0"
                step="0.01"
                value={form.per_km_rate}
                onChange={(e) => setField("per_km_rate", e.target.value)}
                required
                hint="Rate charged per kilometer"
              />
              <Input
                label="Approx KM"
                type="number"
                min="0"
                step="0.01"
                value={form.approx_km}
                onChange={(e) => setField("approx_km", e.target.value)}
                required
                hint="Round-trip total km (estimate). Update Actual KM after the trip."
              />
              {isEdit && (
                <Input
                  label="Actual KM"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.actual_km}
                  onChange={(e) => setField("actual_km", e.target.value)}
                  hint="Enter exact km after the trip to finalize fare"
                />
              )}
            </>
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
                ? actualKm != null && !Number.isNaN(actualKm)
                  ? "Actual KM × Per KM rate + extra"
                  : "Approx KM × Per KM rate + extra (provisional)"
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
