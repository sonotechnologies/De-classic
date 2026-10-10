/** Session storage key holding the last request summary, read by the confirmation screen. */
export const LAST_REQUEST_KEY = "dc_last_request";

/** The pre-written WhatsApp message a guest sends to the hotel from the confirmation screen. */
export type RequestSummary = {
  reference: string;
  name: string;
  phone: string;
  branchName: string;
  roomName: string;
  rooms: number;
  guests: number;
  stayType: "overnight" | "short_stay";
  datesText: string;
  nightsText: string;
  totalText: string;
  rateText: string;
  offerTitle: string | null;
  contactMethod: "call" | "whatsapp";
  hotelWhatsapp: string;
  whatsappMessage: string;
};

export function whatsappText(s: Omit<RequestSummary, "hotelWhatsapp" | "totalText" | "rateText" | "whatsappMessage">): string {
  const lines = [
    "Hi De Classic, I just sent a reservation request on your website.",
    `Reference: ${s.reference}`,
    `Name: ${s.name}`,
    `Phone: ${s.phone}`,
    `Branch: ${s.branchName}`,
    `Room: ${s.roomName}${s.rooms > 1 ? ` × ${s.rooms}` : ""}`,
    `${s.stayType === "short_stay" ? "Short stay" : "Dates"}: ${s.datesText}${s.nightsText ? ` (${s.nightsText})` : ""}`,
    `Guests: ${s.guests}`,
    s.offerTitle ? `Offer: ${s.offerTitle}` : null,
  ];
  return lines.filter(Boolean).join("\n");
}
