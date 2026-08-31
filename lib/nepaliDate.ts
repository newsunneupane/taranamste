import {
  adToBs,
  bsToAdParts,
  formatBs,
  todayBs as bsToday,
  type BsDate,
} from "@itzsa/bs-date";

const pad = (n: number) => String(n).padStart(2, "0");

/** Convert an AD date (Date | ISO string | null) to a BS date object, or null. */
export function toBs(adDate: Date | string | null | undefined): BsDate | null {
  if (!adDate) return null;
  const d = adDate instanceof Date ? adDate : new Date(adDate);
  if (isNaN(d.getTime())) return null;
  try {
    return adToBs({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  } catch {
    return null;
  }
}

/** Convert a BS date object to an AD ISO string (YYYY-MM-DD), or "". */
export function bsToAdIso(bs: BsDate | null | undefined): string {
  if (!bs) return "";
  try {
    const ad = bsToAdParts(bs);
    return `${ad.year}-${pad(ad.month)}-${pad(ad.day)}`;
  } catch {
    return "";
  }
}

/** Convert an AD Date/ISO string to AD ISO string (YYYY-MM-DD), or "". */
export function toAdIso(adDate: Date | string | null | undefined): string {
  if (!adDate) return "";
  const d = adDate instanceof Date ? adDate : new Date(adDate);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Get today as a BS date object. */
export function todayBs(): BsDate {
  return bsToday();
}

/** Today as AD ISO string (YYYY-MM-DD). */
export function todayAdIso(): string {
  return toAdIso(bsToAdIso(bsToday()));
}

/**
 * Format an AD date as a BS-primary display with the AD date alongside.
 * Example output: "2081-05-17 (BS) · 2024-09-01 (AD)"  — returns "—" for null/invalid.
 */
export function formatNepaliDate(
  adDate: Date | string | null | undefined,
  lang: "en" | "ne" = "en",
): string {
  const bs = toBs(adDate);
  if (!bs) return "—";
  const bsStr = formatBs(bs, "YYYY-MM-DD", { locale: lang });
  const adStr = bsToAdIso(bs);
  return lang === "ne"
    ? `${bsStr} (वि.सं.) · ${adStr} (इ.सं.)`
    : `${bsStr} (BS) · ${adStr} (AD)`;
}

/**
 * Format an AD date as a shortened BS display with AD alongside, using a more
 * compact layout for tables. Example: "2081-05-17 · 2024-09-01".
 */
export function formatNepaliDateShort(adDate: Date | string | null | undefined): string {
  const bs = toBs(adDate);
  if (!bs) return "—";
  const bsStr = formatBs(bs, "YYYY-MM-DD", { locale: "en" });
  const adStr = bsToAdIso(bs);
  return `${bsStr} · ${adStr}`;
}
