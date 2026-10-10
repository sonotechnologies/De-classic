import { describe, expect, it } from "vitest";
import { addDays, todayInLagos } from "@/lib/format";
import { fieldErrors, MSG, reservationSchema } from "@/lib/reservation-schema";

const today = todayInLagos();
const valid = {
  branch: "ikorodu",
  stayType: "overnight" as const,
  checkIn: addDays(today, 1),
  checkOut: addDays(today, 3),
  room: "deluxe",
  rooms: 1,
  guests: 2,
  name: "Tolu Adebayo",
  phone: "0803 123 4567",
  contactMethod: "whatsapp" as const,
};

describe("reservation request validation", () => {
  it("accepts a normal request and normalises the phone", () => {
    const r = reservationSchema.parse(valid);
    expect(r.phone).toBe("08031234567");
  });
  it("rejects check out before check in", () => {
    const r = reservationSchema.safeParse({ ...valid, checkOut: valid.checkIn });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).checkOut).toBe(MSG.checkOutOrder);
  });
  it("rejects dates in the past", () => {
    const r = reservationSchema.safeParse({ ...valid, checkIn: addDays(today, -1) });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).checkIn).toBe(MSG.checkInPast);
  });
  it("needs an arrival time for a short stay", () => {
    const r = reservationSchema.safeParse({ ...valid, stayType: "short_stay", checkOut: "" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).arrivalTime).toBe(MSG.arrival);
    expect(reservationSchema.safeParse({ ...valid, stayType: "short_stay", checkOut: "", arrivalTime: "15:30" }).success).toBe(true);
  });
  it("words name and phone errors plainly", () => {
    const r = reservationSchema.safeParse({ ...valid, name: "", phone: "0803 12" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const e = fieldErrors(r.error);
      expect(e.name).toBe(MSG.name);
      expect(e.phone).toBe(MSG.phone);
    }
  });
});
