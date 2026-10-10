import type { Offer } from "@/db/schema";
import { longDate, todayInLagos } from "./format";

export type OfferState = "Live" | "Scheduled" | "Ended" | "Off";

export function offerState(o: Pick<Offer, "isActive" | "startsOn" | "endsOn">, today = todayInLagos()): OfferState {
  if (!o.isActive) return "Off";
  if (o.startsOn > today) return "Scheduled";
  if (o.endsOn && o.endsOn < today) return "Ended";
  return "Live";
}

export function offerWhen(o: Pick<Offer, "startsOn" | "endsOn" | "badge">, today = todayInLagos()): string {
  if (o.startsOn > today) return `Starts ${longDate(o.startsOn)}`;
  if (o.endsOn && o.endsOn < today) return `Ended ${longDate(o.endsOn)}`;
  if (o.endsOn) return `Ends ${longDate(o.endsOn)}`;
  return o.badge ? o.badge.charAt(0).toUpperCase() + o.badge.slice(1) : "Ongoing";
}
