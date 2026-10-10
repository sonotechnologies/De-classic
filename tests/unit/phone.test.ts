import { describe, expect, it } from "vitest";
import { displayInternational, displayLocal, normalizeNigerianPhone, telHref, whatsappHref } from "@/lib/phone";

describe("Nigerian phone numbers", () => {
  it.each([
    ["0803 123 4567", "08031234567"],
    ["+234 803 123 4567", "08031234567"],
    ["2348031234567", "08031234567"],
    ["8031234567", "08031234567"],
  ])("normalises %s", (input, out) => expect(normalizeNigerianPhone(input)).toBe(out));

  it("rejects short numbers", () => expect(normalizeNigerianPhone("0803 12")).toBeNull());

  it("builds one-tap links", () => {
    expect(telHref("08031234567")).toBe("tel:+2348031234567");
    expect(whatsappHref("08031234567", "Hi there")).toBe("https://wa.me/2348031234567?text=Hi%20there");
    expect(displayLocal("2348031234567")).toBe("0803 123 4567");
    expect(displayInternational("08031234567")).toBe("+234 803 123 4567");
  });
});
