import { describe, expect, it } from "vitest";
import { addDays, dateRange, formatNaira, friendlyTime, isIsoDate, nightsBetween, parseNairaToKobo, shortNaira, slugify } from "@/lib/format";

describe("money", () => {
  it("stores kobo and shows naira", () => {
    expect(formatNaira(3_500_000)).toBe("₦35,000");
    expect(shortNaira(3_500_000)).toBe("₦35k");
    expect(shortNaira(750_000)).toBe("₦7.5k");
    expect(shortNaira(75_000)).toBe("₦750");
  });
  it("parses admin price input", () => {
    expect(parseNairaToKobo("35,000")).toBe(3_500_000);
    expect(parseNairaToKobo("₦ 35000")).toBe(3_500_000);
    expect(parseNairaToKobo("35,0OO")).toBeNull();
    expect(parseNairaToKobo("")).toBeNull();
  });
});

describe("dates", () => {
  it("counts nights and validates ISO dates", () => {
    expect(nightsBetween("2026-10-16", "2026-10-18")).toBe(2);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-02-28")).toBe(true);
  });
  it("formats ranges like the design", () => {
    expect(dateRange("2026-10-16", "2026-10-18")).toBe("16 – 18 Oct");
    expect(dateRange("2026-10-30", "2026-11-02")).toBe("30 Oct – 2 Nov");
  });
  it("speaks times plainly", () => {
    expect(friendlyTime("14:00")).toBe("2pm");
    expect(friendlyTime("12:00")).toBe("12 noon");
    expect(friendlyTime("18:30")).toBe("6:30pm");
  });
  it("makes web addresses", () => {
    expect(slugify("Deluxe Room!")).toBe("deluxe-room");
  });
});
