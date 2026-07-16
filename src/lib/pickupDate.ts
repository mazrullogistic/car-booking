import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const TZ = "Asia/Kolkata";
const MYSQL_FMT = "YYYY-MM-DD HH:mm:ss";

export type PickupParts = {
  year: number;
  month: number;
  day: number;
  hour24: number;
  minute: number;
};

/** Keep date+time digits only so Z/offset cannot shift the wall clock. */
function toNaiveMysql(value?: string | Date | null): string | null {
  if (value == null || value === "") return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return dayjs(value).tz(TZ).format(MYSQL_FMT);
  }

  const raw = String(value).trim().replace("T", " ");
  const m = raw.match(
    /^(\d{4}-\d{2}-\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (m) {
    return `${m[1]} ${m[2]}:${m[3]}:${m[4] || "00"}`;
  }

  const dateOnly = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (dateOnly) return `${dateOnly[1]} 00:00:00`;

  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.tz(TZ).format(MYSQL_FMT);
}

function asKolkata(value?: string | Date | null) {
  const naive = toNaiveMysql(value);
  if (!naive) return null;
  const d = dayjs.tz(naive, MYSQL_FMT, TZ);
  return d.isValid() ? d : null;
}

export function parsePickupParts(
  value?: string | Date | null,
): PickupParts | null {
  const d = asKolkata(value);
  if (!d) return null;
  return {
    year: d.year(),
    month: d.month() + 1,
    day: d.date(),
    hour24: d.hour(),
    minute: d.minute(),
  };
}

export function formatDate(value?: string | Date | null) {
  const d = asKolkata(value);
  if (!d) return value ? String(value) : "-";
  return d.format("DD MMM YYYY");
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return `${formatDate(value)} · ${formatTime12h(value)}`;
}

export function formatLongDate(value?: string | Date | null) {
  const d = asKolkata(value);
  if (!d) return value ? String(value) : "-";
  return d.format("DD MMMM YYYY");
}

export function formatTime12h(value?: string | Date | null) {
  const d = asKolkata(value);
  if (!d) return "-";
  return d.format("hh:mm A");
}

export function formatPickupDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return `${formatDate(value)} · ${formatTime12h(value)}`;
}

export function formatShortDate(value?: string | Date | null) {
  const d = asKolkata(value);
  if (!d) return value ? String(value) : "-";
  return d.format("DD/MM/YYYY");
}

/** Naive MySQL datetime in Asia/Kolkata wall clock (no UTC shift). */
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
  return dayjs
    .tz(`${date} ${hh}:${mm}:00`, MYSQL_FMT, TZ)
    .format(MYSQL_FMT);
}

export function splitPickupDateTime(value?: string | null): {
  date: string;
  time: { hour: string; minute: string; period: "AM" | "PM" };
} {
  const defaultTime = { hour: "12", minute: "00", period: "AM" as const };
  if (!value) return { date: "", time: { ...defaultTime } };

  const d = asKolkata(value);
  if (!d) {
    return {
      date: String(value).slice(0, 10),
      time: { ...defaultTime },
    };
  }

  let hour12 = d.hour() % 12;
  if (hour12 === 0) hour12 = 12;
  const snappedMinute = Math.round(d.minute() / 10) * 10;
  const minuteValue = snappedMinute === 60 ? 50 : snappedMinute;
  const period: "AM" | "PM" = d.hour() >= 12 ? "PM" : "AM";

  return {
    date: d.format("YYYY-MM-DD"),
    time: {
      hour: String(hour12),
      minute: String(minuteValue).padStart(2, "0"),
      period,
    },
  };
}
