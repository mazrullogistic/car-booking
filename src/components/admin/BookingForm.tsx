"use client";

import { type FormEvent, useEffect, useState } from "react";
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
  branchesApi,
  carTypesApi,
  carsApi,
  citiesApi,
  customersApi,
  driversApi,
} from "@/lib/services";

type BookingFormProps = {
  bookingId?: number;
  backHref?: string;
};

const emptyForm = {
  branch_id: "",
  car_of: "own",
  customer_id: "",
  trip_type: "one_way",
  from_city_id: "",
  to_city_id: "",
  pickup_date: "",
  num_cars: "1",
  car_type_id: "",
  car_id: "",
  driver_id: "",
  price_type: "lumpsum",
  booking_amount: "",
  commission_amount: "0",
  paid_amount: "0",
  payment_type: "",
  status: "pending",
  remarks: "",
};

export function BookingForm({
  bookingId,
  backHref = "/admin/bookings",
}: BookingFormProps) {
  const isEdit = !!bookingId;
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEdit);
  const [error, setError] = useState("");
  const [branchOptions, setBranchOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [customerOptions, setCustomerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [cityOptions, setCityOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [carTypeOptions, setCarTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [carOptions, setCarOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [driverOptions, setDriverOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    Promise.all([
      branchesApi.list({ limit: 100 }),
      customersApi.list({ limit: 500 }),
      citiesApi.list({ limit: 500 }),
      carTypesApi.list({ limit: 100 }),
      carsApi.list({ limit: 500 }),
      driversApi.list({ limit: 200 }),
    ]).then(([branches, customers, cities, carTypes, cars, drivers]) => {
      setBranchOptions(
        branches.map((b) => ({ value: String(b.id), label: b.name })),
      );
      setCustomerOptions(
        customers.map((c) => ({
          value: String(c.id),
          label: `${c.name} (${c.mobile})`,
        })),
      );
      setCityOptions(cities.map((c) => ({ value: String(c.id), label: c.name })));
      setCarTypeOptions(
        carTypes.map((c) => ({ value: String(c.id), label: c.name })),
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
    });
  }, []);

  useEffect(() => {
    if (!bookingId) return;
    setPageLoading(true);
    bookingsApi
      .get(bookingId)
      .then((b) => {
        const row = b as Record<string, unknown>;
        setForm({
          branch_id: String(row.branch_id ?? ""),
          car_of: String(row.car_of ?? "own"),
          customer_id: String(row.customer_id ?? ""),
          trip_type: String(row.trip_type ?? "one_way"),
          from_city_id: String(row.from_city_id ?? ""),
          to_city_id: String(row.to_city_id ?? ""),
          pickup_date: row.pickup_date
            ? String(row.pickup_date).slice(0, 10)
            : "",
          num_cars: String(row.num_cars ?? "1"),
          car_type_id: String(row.car_type_id ?? ""),
          car_id: String(row.car_id ?? ""),
          driver_id: String(row.driver_id ?? ""),
          price_type: String(row.price_type ?? "lumpsum"),
          booking_amount: String(row.booking_amount ?? ""),
          commission_amount: String(row.commission_amount ?? "0"),
          paid_amount: String(row.paid_amount ?? "0"),
          payment_type: String(row.payment_type ?? ""),
          status: String(row.status ?? "pending"),
          remarks: String(row.remarks ?? ""),
        });
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load booking"),
      )
      .finally(() => setPageLoading(false));
  }, [bookingId]);

  function setField(name: string, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const body: Record<string, unknown> = {
      branch_id: Number(form.branch_id),
      car_of: form.car_of,
      customer_id: Number(form.customer_id),
      trip_type: form.trip_type,
      from_city_id: Number(form.from_city_id),
      to_city_id: Number(form.to_city_id),
      pickup_date: form.pickup_date,
      num_cars: Number(form.num_cars) || 1,
      car_type_id: form.car_type_id ? Number(form.car_type_id) : null,
      car_id: form.car_id ? Number(form.car_id) : null,
      driver_id: form.driver_id ? Number(form.driver_id) : null,
      price_type: form.price_type,
      booking_amount: Number(form.booking_amount),
      commission_amount: Number(form.commission_amount) || 0,
      paid_amount: Number(form.paid_amount) || 0,
      payment_type: form.payment_type || null,
      status: form.status,
      remarks: form.remarks || null,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Branch"
            options={branchOptions}
            value={form.branch_id}
            onChange={(e) => setField("branch_id", e.target.value)}
            required
          />
          <Select
            label="Car Of"
            options={[
              { value: "own", label: "Own Car" },
              { value: "vendor", label: "Vendor Car" },
            ]}
            value={form.car_of}
            onChange={(e) => setField("car_of", e.target.value)}
            required
          />
          <Select
            label="Customer"
            options={customerOptions}
            value={form.customer_id}
            onChange={(e) => setField("customer_id", e.target.value)}
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
          <Input
            label="No. of Cars"
            type="number"
            min="1"
            value={form.num_cars}
            onChange={(e) => setField("num_cars", e.target.value)}
          />
          <Select
            label="Car Type"
            options={carTypeOptions}
            value={form.car_type_id}
            onChange={(e) => setField("car_type_id", e.target.value)}
          />
          <Select
            label="Car"
            options={carOptions}
            value={form.car_id}
            onChange={(e) => setField("car_id", e.target.value)}
          />
          <Select
            label="Driver"
            options={driverOptions}
            value={form.driver_id}
            onChange={(e) => setField("driver_id", e.target.value)}
          />
          <Select
            label="Price Type"
            options={[
              { value: "lumpsum", label: "Lumpsum" },
              { value: "per_km", label: "Per KM" },
            ]}
            value={form.price_type}
            onChange={(e) => setField("price_type", e.target.value)}
          />
          <Input
            label="Booking Amount (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.booking_amount}
            onChange={(e) => setField("booking_amount", e.target.value)}
            required
          />
          <Input
            label="Commission (₹)"
            type="number"
            min="0"
            step="0.01"
            value={form.commission_amount}
            onChange={(e) => setField("commission_amount", e.target.value)}
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
            options={[
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          />
        </div>
        <Input
          label="Remarks"
          value={form.remarks}
          onChange={(e) => setField("remarks", e.target.value)}
        />
        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>
            {isEdit ? "Update Booking" : "Create Booking"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = backHref)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </FormPage>
  );
}
