export type PickupParts = {
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Read YYYY-MM-DD HH:mm clock digits; ignore Z/offset so listing matches entered time. */
export function parsePickupParts(
  value?: string | Date | null,
): PickupParts | null {
  if (value == null || value === "") return null;

  let raw: string;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    raw = value.toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
  } else {
    raw = String(value);
  }

  const m = raw.match(
    /(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::\d{2})?)?/,
  );
  if (!m) return null;

  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour24: m[4] != null ? Number(m[4]) : 0,
    minute: m[5] != null ? Number(m[5]) : 0,
  };
}

export function formatDate(value?: string | Date | null) {
  const p = parsePickupParts(value);
  if (!p) return value ? String(value) : "-";
  const day = String(p.day).padStart(2, "0");
  return `${day} ${MONTHS_SHORT[p.month - 1]} ${p.year}`;
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return `${formatDate(value)} · ${formatTime12h(value)}`;
}

export function formatLongDate(value?: string | Date | null) {
  const p = parsePickupParts(value);
  if (!p) return value ? String(value) : "-";
  const day = String(p.day).padStart(2, "0");
  return `${day} ${MONTHS_LONG[p.month - 1]} ${p.year}`;
}

export function formatTime12h(value?: string | Date | null) {
  const p = parsePickupParts(value);
  if (!p) return "-";
  let hour = p.hour24 % 12;
  if (hour === 0) hour = 12;
  const period = p.hour24 >= 12 ? "PM" : "AM";
  return `${String(hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")} ${period}`;
}

export function formatPickupDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return `${formatDate(value)} · ${formatTime12h(value)}`;
}

export function formatShortDate(value?: string | Date | null) {
  const p = parsePickupParts(value);
  if (!p) return value ? String(value) : "-";
  return `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")}/${p.year}`;
}

/** Build India-offset ISO so backend stores the selected clock time correctly. */
export function combinePickupDateTime(
  date: string,
  time: { hour: string; minute: string; period: "AM" | "PM" },
) {
  if (!date) return date;
  let h = Number(time.hour) || 12;
  if (time.period === "AM") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  const hh = String(h).padStart(2, "0");
  const mm = time.minute.padStart(2, "0");
  return `${date}T${hh}:${mm}:00+05:30`;
}

export function splitPickupDateTime(value?: string | null): {
  date: string;
  time: { hour: string; minute: string; period: "AM" | "PM" };
} {
  const defaultTime = { hour: "12", minute: "00", period: "AM" as const };
  if (!value) return { date: "", time: { ...defaultTime } };

  const p = parsePickupParts(value);
  if (!p) {
    return {
      date: String(value).slice(0, 10),
      time: { ...defaultTime },
    };
  }

  let hours = p.hour24 % 12;
  if (hours === 0) hours = 12;
  const snappedMinute = Math.round(p.minute / 10) * 10;
  const minuteValue = snappedMinute === 60 ? 50 : snappedMinute;
  const period: "AM" | "PM" = p.hour24 >= 12 ? "PM" : "AM";

  return {
    date: [
      p.year,
      String(p.month).padStart(2, "0"),
      String(p.day).padStart(2, "0"),
    ].join("-"),
    time: {
      hour: String(hours),
      minute: String(minuteValue).padStart(2, "0"),
      period,
    },
  };
}
