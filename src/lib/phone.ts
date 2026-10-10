/**
 * Nigerian phone helpers. Guests type numbers like "0803 123 4567", "+234 803 123 4567" or "2348031234567".
 * We store them in local 11-digit form (08031234567) and convert for tel: and wa.me links.
 */

export function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

/** Returns the 11-digit local form, or null if the number is not a valid Nigerian mobile or landline length. */
export function normalizeNigerianPhone(input: string): string | null {
  let d = digitsOnly(input);
  if (d.startsWith("234")) d = "0" + d.slice(3);
  else if (d.length === 10 && !d.startsWith("0")) d = "0" + d;
  return /^0\d{10}$/.test(d) ? d : null;
}

/** International digits for wa.me, e.g. 2348031234567. Accepts any stored or typed form. */
export function toInternational(input: string): string {
  const local = normalizeNigerianPhone(input);
  if (local) return "234" + local.slice(1);
  return digitsOnly(input);
}

export function telHref(input: string): string {
  return "tel:+" + toInternational(input);
}

export function whatsappHref(input: string, text?: string): string {
  const base = "https://wa.me/" + toInternational(input);
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "0803 123 4567" */
export function displayLocal(input: string): string {
  const local = normalizeNigerianPhone(input);
  if (!local) return input;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** "+234 803 123 4567" */
export function displayInternational(input: string): string {
  const local = normalizeNigerianPhone(input);
  if (!local) return input;
  return `+234 ${local.slice(1, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}
