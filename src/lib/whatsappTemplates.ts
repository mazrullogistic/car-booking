import type { AssignBooking, AssignBookingLine } from "./services";

export type WhatsappTemplateCategory =
  | "booking_confirm"
  | "assign_customer"
  | "assign_driver";

export interface WhatsappTemplate {
  id: number;
  category: WhatsappTemplateCategory;
  name: string;
  body: string;
  default_body: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
}

export const WHATSAPP_CATEGORIES: {
  key: WhatsappTemplateCategory;
  label: string;
}[] = [
  { key: "booking_confirm", label: "Booking Confirm" },
  { key: "assign_customer", label: "Assign — Customer" },
  { key: "assign_driver", label: "Assign — Driver" },
];

export const PLACEHOLDERS: Record<WhatsappTemplateCategory, string[]> = {
  booking_confirm: [
    "customer_name",
    "from_city",
    "to_city",
    "pickup_date",
    "pickup_time",
    "trip_type",
    "vehicle",
    "vehicle_fare",
    "extra_amount",
    "total_amount",
    "advance_paid",
    "balance_due",
    "payment_mode",
    "company_name",
  ],
  assign_customer: [
    "ticket_no",
    "from_city",
    "to_city",
    "pickup_date",
    "pickup_time",
    "trip_type",
    "vehicle_blocks",
    "assign_note_block",
  ],
  assign_driver: [
    "from_city",
    "to_city",
    "pickup_date",
    "pickup_time",
    "trip_type",
    "car_type",
    "car_number",
    "customer_name",
    "customer_mobile",
  ],
};

let templateCache: WhatsappTemplate[] = [];
const cacheListeners = new Set<() => void>();

function notifyCacheListeners() {
  cacheListeners.forEach((listener) => listener());
}

export function subscribeWhatsappTemplateCache(listener: () => void) {
  cacheListeners.add(listener);
  return () => {
    cacheListeners.delete(listener);
  };
}

export function setWhatsappTemplateCache(templates: WhatsappTemplate[]) {
  templateCache = templates.filter((t) => t.is_active);
  notifyCacheListeners();
}

export function getWhatsappTemplateCache() {
  return templateCache;
}

export function getTemplatesByCategory(category: WhatsappTemplateCategory) {
  return templateCache
    .filter((t) => t.category === category)
    .sort((a, b) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
      return a.sort_order - b.sort_order || a.id - b.id;
    });
}

export function getDefaultTemplate(category: WhatsappTemplateCategory) {
  const list = getTemplatesByCategory(category);
  return list.find((t) => t.is_default) ?? list[0] ?? null;
}

export function getTemplateById(id: number) {
  return templateCache.find((t) => t.id === id) ?? null;
}

const PICKER_STORAGE_KEY = "whatsapp_template_picker";

export function getLastPickedTemplateId(category: WhatsappTemplateCategory) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PICKER_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, number>;
    const id = map[category];
    return id && getTemplateById(id) ? id : null;
  } catch {
    return null;
  }
}

export function setLastPickedTemplateId(
  category: WhatsappTemplateCategory,
  id: number,
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(PICKER_STORAGE_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[category] = id;
    localStorage.setItem(PICKER_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function renderTemplate(
  body: string,
  vars: Record<string, string | number | null | undefined>,
) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null || value === "" ? "" : String(value);
  });
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

function assignedCarTypeName(line: AssignBookingLine) {
  return line.car?.carType?.name || line.carType?.name || "-";
}

function assignedCarNumber(line: AssignBookingLine) {
  return line.car?.car_number ?? "-";
}

export function buildBookingVars(booking: WhatsAppBooking) {
  const vehicleFare = Number(booking.booking_amount) || 0;
  const extra = Number(booking.extra_amount) || 0;
  const total = vehicleFare + extra;
  const advance = Number(booking.paid_amount) || 0;
  const balance =
    booking.pending_amount != null
      ? Number(booking.pending_amount)
      : total - advance;

  const vehicle =
    booking.bookingCars
      ?.map((line) => line.carType?.name)
      .filter(Boolean)
      .join(", ") ||
    booking.carType?.name ||
    "-";

  return {
    customer_name: booking.customer?.name ?? "Customer",
    from_city: booking.fromCity?.name ?? "-",
    to_city: booking.toCity?.name ?? "-",
    pickup_date: formatLongDate(booking.pickup_date),
    pickup_time: formatTime12h(booking.pickup_date),
    trip_type: formatTripType(booking.trip_type),
    vehicle,
    vehicle_fare: formatMoney(vehicleFare),
    extra_amount: formatMoney(extra),
    total_amount: formatMoney(total),
    advance_paid: formatMoney(advance),
    balance_due: formatMoney(balance),
    payment_mode: formatPaymentMode(booking.payment_type),
    company_name: "BROMY TOUR'SANDTRAVELS",
  };
}

export function buildAssignCustomerVars(booking: AssignBooking) {
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

  const assignNoteBlock = booking.assign_note?.trim()
    ? `\n\n${booking.assign_note.trim()}`
    : "";

  return {
    ticket_no: booking.ticket_no ?? "",
    from_city: booking.fromCity?.name ?? "-",
    to_city: booking.toCity?.name ?? "-",
    pickup_date: formatShortDate(booking.pickup_date),
    pickup_time: formatTime12h(booking.pickup_date),
    trip_type: formatTripType(booking.trip_type),
    vehicle_blocks: vehicleBlocks,
    assign_note_block: assignNoteBlock,
  };
}

export function buildDriverVars(booking: AssignBooking, lineIndex = 0) {
  const line = booking.bookingCars?.[lineIndex];
  return {
    from_city: booking.fromCity?.name ?? "-",
    to_city: booking.toCity?.name ?? "-",
    pickup_date: formatShortDate(booking.pickup_date),
    pickup_time: formatTime12h(booking.pickup_date),
    trip_type: formatTripType(booking.trip_type),
    car_type: line ? assignedCarTypeName(line) : "-",
    car_number: line ? assignedCarNumber(line) : "-",
    customer_name: booking.customer?.name ?? "Customer",
    customer_mobile: booking.customer?.mobile ?? "-",
  };
}

export function renderBookingMessage(
  booking: WhatsAppBooking,
  template?: WhatsappTemplate | null,
) {
  const tpl =
    template ?? getDefaultTemplate("booking_confirm");
  if (!tpl) return "";
  return renderTemplate(tpl.body, buildBookingVars(booking));
}

export function renderAssignCustomerMessage(
  booking: AssignBooking,
  template?: WhatsappTemplate | null,
) {
  const tpl = template ?? getDefaultTemplate("assign_customer");
  if (!tpl) return "";
  return renderTemplate(tpl.body, buildAssignCustomerVars(booking));
}

export function renderDriverMessage(
  booking: AssignBooking,
  lineIndex = 0,
  template?: WhatsappTemplate | null,
) {
  const tpl = template ?? getDefaultTemplate("assign_driver");
  if (!tpl) return "";
  return renderTemplate(tpl.body, buildDriverVars(booking, lineIndex));
}

export const SAMPLE_BOOKING_VARS: Record<string, string> = {
  customer_name: "Nilesh Patel",
  from_city: "Ahmedabad",
  to_city: "Anand",
  pickup_date: "23 July 2026",
  pickup_time: "10:30 AM",
  trip_type: "One Way",
  vehicle: "New Ertiga",
  vehicle_fare: "₹5,000.00",
  extra_amount: "₹999.96",
  total_amount: "₹5,999.96",
  advance_paid: "₹2,000.00",
  balance_due: "₹3,999.96",
  payment_mode: "Cash",
  company_name: "BROMY TOUR'SANDTRAVELS",
  ticket_no: "B00100380",
  vehicle_blocks:
    "Vehicle 1:\n  Car: New Ertiga — GJ01AB1234\n  Driver: Ramesh Patel — 9876543210",
  assign_note_block: "\n\nPlease reach pickup point 15 minutes early.",
  car_type: "New Ertiga",
  car_number: "GJ01AB1234",
  customer_mobile: "9123456780",
};

function formatLongDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime12h(value?: string | Date | null) {
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

function formatMoney(value?: number | string | null) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPaymentMode(value?: string | null) {
  if (!value) return "-";
  const labels: Record<string, string> = {
    cash: "Cash",
    upi: "UPI",
    bank: "Bank Transfer",
    card: "Card",
  };
  return labels[value.toLowerCase()] ?? value.replace(/_/g, " ");
}

function formatTripType(value?: string | null) {
  if (!value) return "-";
  if (value === "one_way") return "One Way";
  if (value === "round_trip") return "Round Trip";
  return value.replace(/_/g, " ");
}
