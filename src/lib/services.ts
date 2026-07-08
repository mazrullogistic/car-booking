import { api, buildQuery } from "./api";

export type ListParams = {
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
};

async function listResource<T>(
  path: string,
  key: string,
  params: ListParams = {},
): Promise<T[]> {
  const data = await api<Record<string, T[]>>(`${path}${buildQuery(params)}`);
  return data[key] ?? [];
}

async function getResource<T>(path: string, key: string, id: number | string) {
  const data = await api<Record<string, T>>(`${path}/${id}`);
  return data[key];
}

async function createResource<T>(
  path: string,
  key: string,
  body: Record<string, unknown>,
) {
  const data = await api<Record<string, T>>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data[key];
}

async function updateResource<T>(
  path: string,
  key: string,
  id: number | string,
  body: Record<string, unknown>,
) {
  const data = await api<Record<string, T>>(`${path}/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return data[key];
}

async function deleteResource(path: string, id: number | string) {
  await api(`${path}/${id}`, { method: "DELETE" });
}

// Status
export const statusApi = {
  list: () =>
    api<{ statuses: { key: string; name: string }[] }>("/get-status-list"),
};

// Masters
export const statesApi = {
  list: (p?: ListParams) => listResource<{ id: number; name: string }>("/states", "states", p),
  get: (id: number) => getResource<{ id: number; name: string }>("/states", "state", id),
  create: (body: { name: string }) => createResource("/states", "state", body),
  update: (id: number, body: { name: string }) =>
    updateResource("/states", "state", id, body),
  remove: (id: number) => deleteResource("/states", id),
};

export const citiesApi = {
  list: (p?: ListParams) =>
    listResource<{
      id: number;
      name: string;
      state_id: number;
      state?: { id: number; name: string };
    }>("/cities", "cities", p),
  get: (id: number) =>
    getResource<{
      id: number;
      name: string;
      state_id: number;
      state?: { id: number; name: string };
    }>("/cities", "city", id),
  create: (body: { name: string; state_id: number }) =>
    createResource("/cities", "city", body),
  update: (id: number, body: { name: string; state_id: number }) =>
    updateResource("/cities", "city", id, body),
  remove: (id: number) => deleteResource("/cities", id),
};

export const carTypesApi = {
  list: (p?: ListParams) =>
    listResource<{ id: number; name: string }>("/car-types", "carTypes", p),
  get: (id: number) =>
    getResource<{ id: number; name: string }>("/car-types", "carType", id),
  create: (body: { name: string }) =>
    createResource("/car-types", "carType", body),
  update: (id: number, body: { name: string }) =>
    updateResource("/car-types", "carType", id, body),
  remove: (id: number) => deleteResource("/car-types", id),
};

export const vendorsApi = {
  list: (p?: ListParams) =>
    listResource<{ id: number; name: string; mobile: string }>("/vendors", "vendors", p),
  get: (id: number) =>
    getResource<{ id: number; name: string; mobile: string }>("/vendors", "vendor", id),
  create: (body: { name: string; mobile: string }) =>
    createResource("/vendors", "vendor", body),
  update: (id: number, body: { name: string; mobile: string }) =>
    updateResource("/vendors", "vendor", id, body),
  remove: (id: number) => deleteResource("/vendors", id),
};

export const driversApi = {
  list: (p?: ListParams) =>
    listResource<{
      id: number;
      name: string;
      mobile: string;
      license_number?: string;
    }>("/drivers", "drivers", p),
  get: (id: number) =>
    getResource<{
      id: number;
      name: string;
      mobile: string;
      license_number?: string;
    }>("/drivers", "driver", id),
  create: (body: Record<string, unknown>) =>
    createResource("/drivers", "driver", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/drivers", "driver", id, body),
  remove: (id: number) => deleteResource("/drivers", id),
};

export const carsApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/cars", "cars", p),
  get: (id: number) => getResource<Record<string, unknown>>("/cars", "car", id),
  create: (body: Record<string, unknown>) =>
    createResource("/cars", "car", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/cars", "car", id, body),
  remove: (id: number) => deleteResource("/cars", id),
};

export const customersApi = {
  list: (p?: ListParams) =>
    listResource<{
      id: number;
      name: string;
      mobile: string;
      whatsapp?: string;
    }>("/customers", "customers", p),
  get: (id: number) =>
    getResource<{
      id: number;
      name: string;
      mobile: string;
      whatsapp?: string;
    }>("/customers", "customer", id),
  create: (body: Record<string, unknown>) =>
    createResource("/customers", "customer", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/customers", "customer", id, body),
  remove: (id: number) => deleteResource("/customers", id),
};

export const usersApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/users", "users", p),
  get: (id: number) => getResource<Record<string, unknown>>("/users", "user", id),
  create: (body: Record<string, unknown>) =>
    createResource("/users", "user", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/users", "user", id, body),
  remove: (id: number) => deleteResource("/users", id),
};

export const rolesApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/roles", "roles", p),
  get: (id: number) => getResource("/roles", "role", id),
  create: (body: Record<string, unknown>) =>
    createResource("/roles", "role", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/roles", "role", id, body),
  remove: (id: number) => deleteResource("/roles", id),
};

export const branchesApi = {
  list: (p?: ListParams) =>
    listResource<{ id: number; name: string; tenant_id?: number }>(
      "/branches",
      "branches",
      p,
    ),
  get: (id: number) =>
    getResource<{ id: number; name: string; tenant_id?: number }>(
      "/branches",
      "branch",
      id,
    ),
  create: (body: { name: string; tenant_id: number }) =>
    createResource("/branches", "branch", body),
  update: (id: number, body: { name: string }) =>
    updateResource("/branches", "branch", id, body),
  remove: (id: number) => deleteResource("/branches", id),
};

// Bookings
export type Booking = Record<string, unknown>;

export const bookingsApi = {
  list: (p?: ListParams) => listResource<Booking>("/bookings", "bookings", p),
  get: (id: number) => getResource<Booking>("/bookings", "booking", id),
  create: (body: Record<string, unknown>) =>
    createResource<Booking>("/bookings", "booking", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource<Booking>("/bookings", "booking", id, body),
  assign: (id: number, body: Record<string, unknown>) =>
    api<{ booking: Booking }>(`/bookings/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((r) => r.booking),
  cancel: (id: number) =>
    api(`/bookings/${id}/cancel`, { method: "PATCH" }),
  remove: (id: number) => deleteResource("/bookings", id),
};

// Payments
export const paymentsApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/payments", "payments", p),
  get: (id: number) =>
    getResource<Record<string, unknown>>("/payments", "payment", id),
  create: (body: Record<string, unknown>) =>
    createResource("/payments", "payment", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/payments", "payment", id, body),
  remove: (id: number) => deleteResource("/payments", id),
  remaining: (bookingId: number) =>
    api<{
      booking_id: number;
      ticket_no: string;
      booking_amount: number;
      paid_amount: number;
      remaining: number;
    }>(`/payments/remaining/${bookingId}`),
};

// Income / Expense
export const incomeExpensesApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/income-expenses", "incomeExpenses", p),
  get: (id: number) =>
    getResource<Record<string, unknown>>("/income-expenses", "incomeExpense", id),
  create: (body: Record<string, unknown>) =>
    createResource("/income-expenses", "incomeExpense", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/income-expenses", "incomeExpense", id, body),
  remove: (id: number) => deleteResource("/income-expenses", id),
};

// Dashboard
export const dashboardApi = {
  stats: () =>
    api<{
      kpis: Record<string, number>;
      upcomingPickups: Booking[];
      recentBookings: Booking[];
    }>("/dashboard/stats"),
};

// Reports
export const reportsApi = {
  summary: (p?: ListParams) =>
    api<{ summary: Record<string, number> }>(
      `/reports/summary${buildQuery(p ?? {})}`,
    ),
  bookings: (p?: ListParams) =>
    api<{ rows: Record<string, unknown>[] }>(
      `/reports/bookings${buildQuery(p ?? {})}`,
    ),
  commissionEarned: (p?: ListParams) =>
    api<{ rows: Record<string, unknown>[] }>(
      `/reports/commission-earned${buildQuery(p ?? {})}`,
    ),
  commissionPending: (p?: ListParams) =>
    api<{ rows: Record<string, unknown>[] }>(
      `/reports/commission-pending${buildQuery(p ?? {})}`,
    ),
  exportCsv: async (p?: ListParams) => {
    const { API_URL, getToken } = await import("./api");
    const token = getToken();
    const res = await fetch(
      `${API_URL}/reports/export-csv${buildQuery(p ?? {})}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    if (!res.ok) throw new Error("Export failed");
    return res.text();
  },
};

export const PERMISSION_KEYS = [
  "bookings.cancel",
  "bookings.manage",
  "branches.manage",
  "car_types.manage",
  "cars.manage",
  "customers.manage",
  "dashboard.view",
  "drivers.manage",
  "income_expenses.manage",
  "masters.manage",
  "payments.manage",
  "reports.export",
  "reports.view",
  "roles.manage",
  "users.manage",
  "vendors.manage",
];

export function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function capitalizeStatus(status?: string | null) {
  if (!status) return "-";
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning-light text-warning",
  confirmed: "bg-primary-light text-primary",
  completed: "bg-success-light text-success",
  cancelled: "bg-danger-light text-danger",
  in_progress: "bg-info-light text-info",
};

export function statusBadgeClass(status?: string | null) {
  return STATUS_COLORS[String(status ?? "").toLowerCase()] ?? "bg-border-light text-text-secondary";
}

export function formatLongDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatTime12h(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const formatted = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return formatted.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}

export function formatPaymentMode(value?: string | null) {
  if (!value) return "-";
  const labels: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank: "Bank Transfer",
    card: "Card",
  };
  return labels[value.toLowerCase()] ?? capitalizeStatus(value);
}

export function formatTripType(value?: string | null) {
  if (!value) return "-";
  if (value === "one_way") return "One Way";
  if (value === "round_trip") return "Round Trip";
  return capitalizeStatus(value);
}

export function formatShortDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

type WhatsAppBooking = {
  customer?: { name?: string; mobile?: string; whatsapp?: string } | null;
  fromCity?: { name?: string } | null;
  toCity?: { name?: string } | null;
  carType?: { name?: string } | null;
  bookingCars?: { carType?: { name?: string } | null; price?: number }[];
  pickup_date?: string | Date | null;
  trip_type?: string | null;
  booking_amount?: number | string | null;
  extra_amount?: number | string | null;
  paid_amount?: number | string | null;
  pending_amount?: number | string | null;
  payment_type?: string | null;
};

export type AssignBookingLine = {
  id?: number;
  line_no?: number;
  vehicle_type?: string | null;
  vendor_rate?: number | string | null;
  commission_amount?: number | string | null;
  carType?: { id?: number; name?: string } | null;
  car?: {
    id?: number;
    car_number?: string;
    carType?: { id?: number; name?: string } | null;
    vendor?: { id?: number; name?: string } | null;
  } | null;
  driver?: { id?: number; name?: string; mobile?: string } | null;
};

export type AssignBooking = Omit<WhatsAppBooking, "bookingCars"> & {
  id?: number;
  ticket_no?: string;
  status?: string;
  assign_note?: string | null;
  num_cars?: number;
  bookingCars?: AssignBookingLine[];
};

/** Emojis via code points so WhatsApp URL encoding stays valid UTF-8 */
const E = {
  wave: "\u{1F44B}",
  car: "\u{1F697}",
  pin: "\u{1F4CD}",
  calendar: "\u{1F4C5}",
  clock: "\u{1F552}",
  road: "\u{1F6A6}",
  card: "\u{1F4B3}",
  taxi: "\u{1F695}",
  plus: "\u{2795}",
  money: "\u{1F4B0}",
  cash: "\u{1F4B5}",
  green: "\u{1F7E2}",
  pinNote: "\u{1F4CC}",
  sparkle: "\u{2728}",
  handshake: "\u{1F91D}",
  star: "\u{2726}",
} as const;

export function buildBookingWhatsAppMessage(booking: WhatsAppBooking) {
  const name = booking.customer?.name ?? "Customer";
  const from = booking.fromCity?.name ?? "-";
  const to = booking.toCity?.name ?? "-";
  const vehicle =
    booking.bookingCars
      ?.map((line) => line.carType?.name)
      .filter(Boolean)
      .join(", ") ||
    booking.carType?.name ||
    "-";
  const vehicleFare = Number(booking.booking_amount) || 0;
  const extra = Number(booking.extra_amount) || 0;
  const total = vehicleFare + extra;
  const advance = Number(booking.paid_amount) || 0;
  const balance =
    booking.pending_amount != null
      ? Number(booking.pending_amount)
      : total - advance;

  const lines = [
    "========================",
    `     ${E.star} BOOKING CONFIRMED ${E.star}`,
    "========================",
    "",
    `Hello ${name} ${E.wave}`,
    "",
    `Great news! Your ride has been successfully reserved. ${E.car}`,
    "",
    "Here is everything you need for your upcoming journey:",
    "",
    `${E.pin} ${from}  --->  ${to}`,
    "",
    `${E.calendar} Date        | ${formatLongDate(booking.pickup_date)}`,
    `${E.clock} Pickup      | ${formatTime12h(booking.pickup_date)}`,
    `${E.road} Journey     | ${formatTripType(booking.trip_type)}`,
    `${E.car} Vehicle     | ${vehicle}`,
    "",
    "========================",
    "",
    `         ${E.card} FARE DETAILS`,
    "",
    `${E.taxi} Vehicle Fare      ${formatMoney(vehicleFare)}`,
    `${E.plus} Extra Amount      ${formatMoney(extra)}`,
    "------------------------",
    `${E.money} Total Amount      ${formatMoney(total)}`,
    "",
    `${E.cash} Advance Paid      ${formatMoney(advance)}`,
    `${E.card} Balance Due       ${formatMoney(balance)}`,
    "",
    `Payment Mode: ${formatPaymentMode(booking.payment_type)}`,
    "",
    "========================",
    "",
    `       ${E.green} BOOKING CONFIRMED`,
    "",
    "Your vehicle has been reserved for the selected date and journey.",
    "",
    `${E.car} WHAT HAPPENS NEXT?`,
    "",
    "Your driver name, contact number, vehicle number, and assigned car details will be shared with you one day before your journey.",
    "",
    "========================",
    "",
    `${E.pinNote} TRAVEL NOTE`,
    "",
    "Please review the journey details above. If you need to update your pickup time, location, or any other booking information, contact us as early as possible.",
    "",
    `Sit back, relax, and leave the journey to us. ${E.sparkle}`,
    "",
    `Thank you for travelling with us. ${E.handshake}`,
    "",
    "Safe Roads • Comfortable Rides • Reliable Service",
    "",
    "Warm Regards,",
    `BROMY TOUR'SANDTRAVELS ${E.taxi}`,
  ];

  return lines.join("\n");
}

export function buildWhatsAppShareUrl(mobile: string, message: string) {
  const digits = mobile.replace(/\D/g, "");
  const phone = digits.startsWith("91") ? digits : `91${digits}`;
  // api.whatsapp.com handles UTF-8 emoji text more reliably than wa.me alone
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

function assignedCarTypeName(line: AssignBookingLine) {
  return (
    line.car?.carType?.name ||
    line.carType?.name ||
    "-"
  );
}

function assignedCarNumber(line: AssignBookingLine) {
  return line.car?.car_number ?? "-";
}

export function buildDriverAssignMessage(booking: AssignBooking, lineIndex = 0) {
  const line = booking.bookingCars?.[lineIndex];
  if (!line) return "";

  const from = booking.fromCity?.name ?? "-";
  const to = booking.toCity?.name ?? "-";
  const name = booking.customer?.name ?? "Customer";
  const mobile = booking.customer?.mobile ?? "-";

  return [
    "New Trip Confirmed",
    "",
    `${from} to ${to}`,
    `Date: ${formatShortDate(booking.pickup_date)}`,
    `Time: ${formatTime12h(booking.pickup_date)}`,
    `Trip Type: ${formatTripType(booking.trip_type)}`,
    `Car: ${assignedCarTypeName(line)}`,
    "",
    `Customer: ${name}`,
    `Contact: ${mobile}`,
    "",
    "Please confirm after receiving this trip detail.",
    "",
    "Thank you.",
  ].join("\n");
}

export function buildAssignCustomerWhatsAppMessage(booking: AssignBooking) {
  const from = booking.fromCity?.name ?? "-";
  const to = booking.toCity?.name ?? "-";
  const ticket = booking.ticket_no ?? "";
  const lines = booking.bookingCars ?? [];

  const vehicleBlocks = lines
    .map((line, index) => {
      const driverName = line.driver?.name ?? "-";
      const driverMobile = line.driver?.mobile ?? "-";
      return [
        `Vehicle ${index + 1}:`,
        `  Car: ${assignedCarTypeName(line)} — ${assignedCarNumber(line)}`,
        `  Driver: ${driverName} — ${driverMobile}`,
      ].join("\n");
    })
    .join("\n\n");

  const parts = [
    `Booking Assigned — ${ticket}`,
    "",
    `${from} to ${to}`,
    `Date: ${formatShortDate(booking.pickup_date)} | Time: ${formatTime12h(booking.pickup_date)}`,
    `Trip Type: ${formatTripType(booking.trip_type)}`,
    "",
    vehicleBlocks,
  ];

  if (booking.assign_note?.trim()) {
    parts.push("", booking.assign_note.trim());
  }

  parts.push("", "Thank you.");
  return parts.join("\n");
}
