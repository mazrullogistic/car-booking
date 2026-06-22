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

// Masters
export const statesApi = {
  list: (p?: ListParams) => listResource<{ id: number; name: string }>("/states", "states", p),
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
  create: (body: { name: string; state_id: number }) =>
    createResource("/cities", "city", body),
  update: (id: number, body: { name: string; state_id: number }) =>
    updateResource("/cities", "city", id, body),
  remove: (id: number) => deleteResource("/cities", id),
};

export const carTypesApi = {
  list: (p?: ListParams) =>
    listResource<{ id: number; name: string }>("/car-types", "carTypes", p),
  create: (body: { name: string }) =>
    createResource("/car-types", "carType", body),
  update: (id: number, body: { name: string }) =>
    updateResource("/car-types", "carType", id, body),
  remove: (id: number) => deleteResource("/car-types", id),
};

export const vendorsApi = {
  list: (p?: ListParams) =>
    listResource<{ id: number; name: string; mobile: string }>("/vendors", "vendors", p),
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
  create: (body: Record<string, unknown>) =>
    createResource("/drivers", "driver", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/drivers", "driver", id, body),
  remove: (id: number) => deleteResource("/drivers", id),
};

export const carsApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/cars", "cars", p),
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
  create: (body: Record<string, unknown>) =>
    createResource("/customers", "customer", body),
  update: (id: number, body: Record<string, unknown>) =>
    updateResource("/customers", "customer", id, body),
  remove: (id: number) => deleteResource("/customers", id),
};

export const usersApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/users", "users", p),
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
    listResource<{ id: number; name: string }>("/branches", "branches", p),
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
  cancel: (id: number) =>
    api(`/bookings/${id}/cancel`, { method: "PATCH" }),
};

// Payments
export const paymentsApi = {
  list: (p?: ListParams) =>
    listResource<Record<string, unknown>>("/payments", "payments", p),
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
