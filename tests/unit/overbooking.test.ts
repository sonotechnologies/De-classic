import { describe, expect, it } from "vitest";
import { findOverbooked, type Stay } from "@/lib/overbooking";

const stay = (id: string, checkIn: string, checkOut: string | null, rooms = 1, roomTypeId = "deluxe"): Stay => ({ id, roomTypeId, checkIn, checkOut, rooms });

describe("over-booking warning", () => {
  it("flags requests whose overlapping nights exceed the room's units", () => {
    const all = [stay("a", "2026-10-16", "2026-10-18", 2), stay("b", "2026-10-17", "2026-10-19", 2), stay("c", "2026-10-20", "2026-10-21", 1)];
    const out = findOverbooked(all, all, new Map([["deluxe", 3]]));
    expect(out.get("a")).toEqual({ night: "2026-10-17", requested: 4, units: 3 });
    expect(out.has("b")).toBe(true);
    expect(out.has("c")).toBe(false);
  });
  it("treats check-out day as free and short stays as their date", () => {
    const all = [stay("a", "2026-10-16", "2026-10-17"), stay("b", "2026-10-17", null)];
    expect(findOverbooked(all, all, new Map([["deluxe", 1]])).size).toBe(0);
  });
  it("ignores other room types", () => {
    const all = [stay("a", "2026-10-16", "2026-10-17", 1, "deluxe"), stay("b", "2026-10-16", "2026-10-17", 1, "suite")];
    expect(findOverbooked(all, all, new Map([["deluxe", 1], ["suite", 1]])).size).toBe(0);
  });
});
