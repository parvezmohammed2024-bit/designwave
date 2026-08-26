/** Admin-side money helpers. Storage is always integer poisha. */

/** 12345 -> "৳123.45" (Latin digits — admin is English). */
export function tk(poisha: number | null | undefined): string {
  const p = poisha ?? 0;
  const taka = p / 100;
  return `৳${
    p % 100 === 0
      ? Math.round(taka).toLocaleString("en-IN")
      : taka.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
  }`;
}

/** "600" or "600.50" (taka, as typed by staff) -> poisha integer. */
export function toPoisha(input: string | number): number {
  const n = typeof input === "number" ? input : parseFloat(input);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** poisha -> editable taka string for form inputs. */
export function toTakaInput(poisha: number): string {
  return (poisha / 100).toString();
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
