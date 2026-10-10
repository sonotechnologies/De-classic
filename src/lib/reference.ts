import { randomInt } from "node:crypto";

/** Short reference such as DC-4821. After repeated clashes we widen to five digits. */
export function makeReference(attempt = 0): string {
  const digits = attempt < 4 ? randomInt(1000, 10000) : randomInt(10000, 100000);
  return `DC-${digits}`;
}
