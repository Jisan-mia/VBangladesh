export type Activity = {
  id: string;
  title: string;
  city: string;
  location: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  timezone: "Asia/Dhaka";
  costDescription: string;
  eligibility: string;
  requirements: string[];
  organizerName: string;
  organizerUrl: string;
  signupUrl: string;
  sourceUrl: string;
  checkedAt: string;
  checkedBy: string;
  organizerConfirmedAt: string;
  status: "confirmed" | "unconfirmed" | "cancelled";
};

const MINUTE_MS = 60_000;
const CHECK_VALIDITY_MS = 24 * 60 * MINUTE_MS;
const DHAKA_OFFSET_MS = 6 * 60 * MINUTE_MS;
const TEXT_FIELDS = [
  "id", "title", "city", "location", "startsAt", "endsAt", "costDescription",
  "eligibility", "organizerName", "organizerUrl", "signupUrl", "sourceUrl",
  "checkedAt", "checkedBy", "organizerConfirmedAt",
] as const;

function hasActivityFields(value: unknown): value is Activity {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const fields = value as Record<string, unknown>;
  return TEXT_FIELDS.every((key) => typeof fields[key] === "string" && fields[key].trim().length > 0)
    && fields.timezone === "Asia/Dhaka"
    && typeof fields.durationMinutes === "number"
    && Number.isInteger(fields.durationMinutes)
    && fields.durationMinutes > 0
    && Array.isArray(fields.requirements)
    && fields.requirements.length > 0
    && fields.requirements.every((item) => typeof item === "string" && item.trim().length > 0)
    && (fields.status === "confirmed" || fields.status === "unconfirmed" || fields.status === "cancelled");
}

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && !url.username && !url.password && !url.port
      && url.hostname.includes(".")
      && !/^[\d.]+$/.test(url.hostname)
      && !url.hostname.endsWith(".")
      && !/\.(local|localhost|internal)$/.test(url.hostname);
  } catch {
    return false;
  }
}

function isDhakaTimestamp(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+06:00$/.test(value)) return false;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  return new Date(timestamp + DHAKA_OFFSET_MS).toISOString().slice(0, 19) === value.slice(0, 19);
}

export function parseActivity(value: unknown): Activity | null {
  if (!hasActivityFields(value)) return null;
  if (![value.organizerUrl, value.signupUrl, value.sourceUrl].every(isPublicHttpsUrl)) return null;
  if (![value.startsAt, value.endsAt, value.checkedAt, value.organizerConfirmedAt].every(isDhakaTimestamp)) return null;
  const duration = (Date.parse(value.endsAt) - Date.parse(value.startsAt)) / MINUTE_MS;
  if (duration !== value.durationMinutes) return null;
  if (Date.parse(value.organizerConfirmedAt) > Date.parse(value.checkedAt)) return null;
  return value;
}

export function getCurrentActivities(values: readonly unknown[], now: Date): Activity[] {
  const nowMs = now.getTime();
  return values.map(parseActivity).filter((activity): activity is Activity => {
    if (!activity || activity.status !== "confirmed") return false;
    const checkAge = nowMs - Date.parse(activity.checkedAt);
    return Date.parse(activity.endsAt) > nowMs && checkAge >= 0 && checkAge <= CHECK_VALIDITY_MS;
  }).sort((first, second) => Date.parse(first.startsAt) - Date.parse(second.startsAt));
}
