import type { ReservationStatus, Role } from "@/db/schema";

export const STATUSES: ReservationStatus[] = ["new", "confirmed", "declined", "checked_in", "completed", "cancelled", "no_show"];

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  declined: "Declined",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

/** Tag colours from the design system: [background, text]. */
export const STATUS_TAG: Record<ReservationStatus, { bg: string; fg: string }> = {
  new: { bg: "#B1ECEC", fg: "#111111" },
  confirmed: { bg: "#DDF3E1", fg: "#1B6B34" },
  checked_in: { bg: "#0B5C5C", fg: "#FFFFFF" },
  completed: { bg: "#ECEEEE", fg: "#4A5757" },
  declined: { bg: "#F8E1E1", fg: "#8A2A2A" },
  cancelled: { bg: "#F8E1E1", fg: "#8A2A2A" },
  no_show: { bg: "#F8E1E1", fg: "#8A2A2A" },
};

/** Requests that still hold a room, used for the over-booking warning. */
export const HOLDING_STATUSES: ReservationStatus[] = ["new", "confirmed", "checked_in"];

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Branch manager",
  front_desk: "Front desk",
};
