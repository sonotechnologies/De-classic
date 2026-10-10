import type { Role } from "@/db/schema";

export type Section = { label: string; href: string; roles: Role[] };

/** Every admin section and who may open it. Front desk works reservations only. */
export const SECTIONS: Section[] = [
  {
    label: "Overview",
    href: "/admin",
    roles: ["owner", "manager", "front_desk"],
  },
  {
    label: "Reservations",
    href: "/admin/reservations",
    roles: ["owner", "manager", "front_desk"],
  },
  { label: "Rooms", href: "/admin/rooms", roles: ["owner", "manager"] },
  { label: "Bar menu", href: "/admin/menu", roles: ["owner", "manager"] },
  { label: "Gallery", href: "/admin/gallery", roles: ["owner", "manager"] },
  { label: "Offers", href: "/admin/offers", roles: ["owner", "manager"] },
  { label: "Branches", href: "/admin/branches", roles: ["owner"] },
  { label: "Staff", href: "/admin/staff", roles: ["owner"] },
  { label: "Settings", href: "/admin/settings", roles: ["owner"] },
];

export function sectionsFor(role: Role) {
  return SECTIONS.filter((s) => s.roles.includes(role));
}
