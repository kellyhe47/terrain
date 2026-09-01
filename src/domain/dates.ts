// Date helpers. All domain dates are local-calendar ISO days ("YYYY-MM-DD"). `asOf` is an ISO datetime.
export type ISODate = string; // YYYY-MM-DD

export function pad2(n: number): string { return String(n).padStart(2, '0'); }
export function toISODate(d: Date): ISODate { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
export function parseISODate(s: ISODate): Date { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
/** Calendar day of an `asOf` datetime string, in the *wall-clock* the string carries (we ignore the offset and read the literal date). */
export function dayOf(asOf: string): ISODate { return asOf.slice(0, 10); }
export function addDays(date: ISODate, n: number): ISODate { const d = parseISODate(date); d.setDate(d.getDate() + n); return toISODate(d); }
export function diffDays(a: ISODate, b: ISODate): number { return Math.round((parseISODate(a).getTime() - parseISODate(b).getTime()) / 86400000); }
export function dow(date: ISODate): number { return parseISODate(date).getDay(); } // 0 = Sunday
/** Sunday-start week containing `date` (the design's week strip runs S…S). */
export function weekStart(date: ISODate): ISODate { return addDays(date, -dow(date)); }
export function weekDays(start: ISODate): ISODate[] { return Array.from({ length: 7 }, (_, i) => addDays(start, i)); }
export const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DOW_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export function fmtMonthDay(date: ISODate): string { const d = parseISODate(date); return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`; }
export function fmtDowMonthDay(date: ISODate): string { const d = parseISODate(date); return `${DOW_SHORT[d.getDay()]} ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`; }
export function fmtDowNum(date: ISODate): string { const d = parseISODate(date); return `${DOW_SHORT[d.getDay()]} ${d.getDate()}`; }
/** "Aug 9 – 15" style range for a Sunday-start week. */
export function fmtWeekRange(start: ISODate): string {
  const a = parseISODate(start), b = parseISODate(addDays(start, 6));
  return a.getMonth() === b.getMonth() ? `${MONTH_SHORT[a.getMonth()]} ${a.getDate()} – ${b.getDate()}` : `${MONTH_SHORT[a.getMonth()]} ${a.getDate()} – ${MONTH_SHORT[b.getMonth()]} ${b.getDate()}`;
}
/** "7:00 PM" from "19:00". */
export function fmtTime12(hhmm: string): string { const [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; const hh = h % 12 === 0 ? 12 : h % 12; return `${hh}:${pad2(m)} ${ap}`; }
export function nowISO(d = new Date()): string {
  const off = -d.getTimezoneOffset(); const sign = off >= 0 ? '+' : '-'; const a = Math.abs(off);
  return `${toISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}${sign}${pad2(Math.floor(a / 60))}:${pad2(a % 60)}`;
}
export function fmtNum(n: number): string { return Math.round(n).toLocaleString('en-US'); }
