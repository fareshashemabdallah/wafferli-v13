/** Private, indicative outing costs in Jordanian dinars. Never treat these as live venue prices.
 * No expense or guest costs leave the user's device through this helper.
 */
export type AttendanceChoice = "no" | "yes" | "unsure";
export type OutingCostInputs = {
  adults: string;
  children: AttendanceChoice;
  childCount: string;
  adultRate: string;
  childRate: string;
  transport: string;
  extras: string;
  maximum: string;
};
export function parseJod(raw: string): number | null {
  const clean = raw.trim();
  if (!/^(?:\d{1,6})(?:\.\d{1,2})?$/.test(clean)) return null;
  const amount = Number(clean);
  return Number.isFinite(amount) && amount >= 0 && amount <= 100000 ? amount : null;
}
export function parseAttendees(raw: string): number | null {
  if (!/^\d{1,2}$/.test(raw.trim())) return null;
  const n = Number(raw.trim());
  return Number.isInteger(n) && n >= 1 && n <= 30 ? n : null;
}
export function optionalJod(raw: string): number | null {
  return raw.trim() === "" ? 0 : parseJod(raw);
}
export function formatJod(value: number): string {
  return new Intl.NumberFormat("en-JO", {style:"decimal", minimumFractionDigits:2, maximumFractionDigits:2}).format(value) + " JOD";
}
export type OutingCostEstimate = {
  adults: number | null;
  children: number | null;
  adultRate: number | null;
  childRate: number | null;
  adultSubtotal: number | null;
  childSubtotal: number | null;
  transport: number | null;
  extras: number | null;
  maximum: number | null;
  estimatedTotal: number | null;
  remaining: number | null;
  ready: boolean;
};
export function estimateOutingCost(input: OutingCostInputs): OutingCostEstimate {
  const adults = parseAttendees(input.adults);
  const children = input.children === "yes" ? parseAttendees(input.childCount) : input.children === "no" ? 0 : null;
  const adultRate = input.adultRate.trim() ? parseJod(input.adultRate) : null;
  const childRate = input.children === "yes" ? (input.childRate.trim() ? parseJod(input.childRate) : null) :
    input.children === "no" ? 0 : null;
  const transport = optionalJod(input.transport);
  const extras = optionalJod(input.extras);
  const maximum = input.maximum.trim() ? parseJod(input.maximum) : null;
  const adultSubtotal = adults !== null && adultRate !== null ? adults * adultRate : null;
  const childSubtotal = children !== null && childRate !== null ? children * childRate : null;
  const ready = adultSubtotal !== null && childSubtotal !== null && transport !== null && extras !== null &&
    input.children !== "unsure";
  const estimatedTotal = ready ? Math.round((adultSubtotal! + childSubtotal! + transport! + extras!) * 100) / 100 : null;
  const remaining = maximum !== null && estimatedTotal !== null ?
    Math.round((maximum - estimatedTotal) * 100) / 100 : null;
  return {adults,children,adultRate,childRate,adultSubtotal,childSubtotal,transport,extras,maximum,estimatedTotal,remaining,ready};
}
