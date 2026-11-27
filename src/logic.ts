// Rechenlogik der Ausgaben-App. Keine Abhängigkeiten zu React Native,
// damit sie sich einzeln testen lässt.

export type Row = { id: string; name: string; amount: string };
export type Settings = { income: Row[]; fixed: Row[]; env: Row[] };
export type Entry = {
  id: string;
  amount: number; // Cent
  what: string;
  env: string; // id des Umschlags
  date: string; // JJJJ-MM-TT
  t: string; // Zeitpunkt der Erfassung, zum Sortieren
};

export const MAX_CENTS = 1_000_000_000; // 10.000.000,00 €

export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const pad = (n: number) => String(n).padStart(2, '0');
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const mkey = (y: number, m: number) => `${y}-${pad(m + 1)}`;
export const parseIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
};

/** Liest Beträge wie „2.450“, „2500.50“, „1.250,75“ oder „12,5“ als Euro. */
export function num(s: string | undefined | null): number {
  let t = String(s ?? '').replace(/[\s€]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
}
export const cents = (s: string | undefined | null) => Math.round(num(s) * 100);

/** Formatiert Cent als „1.234,56“ mit echtem Minuszeichen. */
export function eur(c: number): string {
  const neg = c < 0;
  const v = Math.round(Math.abs(c));
  const int = String(Math.floor(v / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (neg ? '−' : '') + int + ',' + pad(v % 100);
}
/** Betrag mit Euro-Zeichen, das nicht allein umbricht. */
export const euro = (c: number) => eur(c) + ' €';

export function dayLabel(date: string, today = new Date()): string {
  const y = new Date(today);
  y.setDate(y.getDate() - 1);
  if (date === iso(today)) return 'heute';
  if (date === iso(y)) return 'gestern';
  const d = parseIso(date);
  return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}
export function longDay(date: string): string {
  const d = parseIso(date);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
}

export function emptySettings(): Settings {
  return {
    income: [{ id: uid(), name: 'Nettogehalt', amount: '' }],
    fixed: [{ id: uid(), name: 'Miete', amount: '' }],
    env: ['Lebensmittel', 'Freizeit', 'Mobilität', 'Sonstiges'].map((name) => ({ id: uid(), name, amount: '' })),
  };
}

export function totals(s: Settings) {
  const sum = (l: Row[]) => l.reduce((a, r) => a + cents(r.amount), 0);
  const inc = sum(s.income), fix = sum(s.fixed), env = sum(s.env);
  return { inc, fix, env, free: inc - fix - env };
}

export const envName = (s: Settings, id: string) => {
  const e = s.env.find((x) => x.id === id);
  return e ? e.name.trim() || 'Ohne Namen' : 'Ohne Umschlag';
};

export type EnvState = { id: string; name: string; spent: number; budget: number; left: number; orphan?: boolean };
export type MonthCalc = {
  key: string; n: number; cur: boolean; d: number;
  perDay: number[]; budget: number; spent: number; rest: number;
  allow: number; todaySpent: number; todayLeft: number; future: number;
  envs: EnvState[];
};

/** Alles, was die Übersicht für einen Monat braucht. */
export function calc(s: Settings, list: Entry[], y: number, m: number, now = new Date()): MonthCalc {
  const n = new Date(y, m + 1, 0).getDate();
  const cur = now.getFullYear() === y && now.getMonth() === m;
  const d = now.getDate();
  const perDay = Array(n).fill(0) as number[];
  for (const e of list) {
    const day = +e.date.slice(8, 10);
    if (day >= 1 && day <= n) perDay[day - 1] += e.amount;
  }
  const budget = s.env.reduce((a, e) => a + cents(e.amount), 0);
  const spent = perDay.reduce((a, b) => a + b, 0);
  const rest = budget - spent;
  let allow = 0, todaySpent = 0, todayLeft = 0, future = 0;
  if (cur) {
    const before = perDay.slice(0, d - 1).reduce((a, b) => a + b, 0);
    const left = n - d + 1;
    allow = (budget - before) / left;
    todaySpent = perDay[d - 1];
    todayLeft = allow - todaySpent;
    future = left > 1 ? Math.max(rest - Math.max(todayLeft, 0), 0) / (left - 1) : 0;
  }
  const envs: EnvState[] = s.env.map((e) => {
    const sp = list.filter((x) => x.env === e.id).reduce((a, x) => a + x.amount, 0);
    const b = cents(e.amount);
    return { id: e.id, name: e.name.trim() || 'Ohne Namen', spent: sp, budget: b, left: b - sp };
  });
  const orphan = list.filter((x) => !s.env.some((e) => e.id === x.env)).reduce((a, x) => a + x.amount, 0);
  if (orphan) envs.push({ id: '', name: 'Ohne Umschlag', spent: orphan, budget: 0, left: -orphan, orphan: true });
  return { key: mkey(y, m), n, cur, d, perDay, budget, spent, rest, allow, todaySpent, todayLeft, future, envs };
}

export const sorted = (list: Entry[]) =>
  list.slice().sort((a, b) => (b.date + b.t).localeCompare(a.date + a.t));

/** Hängt eine Ziffer an die Eingabe (in Cent) an, höchstens bis MAX_CENTS. */
export function pushDigits(current: string, d: string): { cents: string; tooBig: boolean } {
  const c = (current + d).replace(/^0+/, '');
  if (parseInt(c || '0', 10) <= MAX_CENTS) return { cents: c, tooBig: false };
  return { cents: current, tooBig: true };
}

/* ---------------- Sicherung ---------------- */

export type Backup = { app: 'ausgaben'; version: 1; exported: string; settings: Settings; months: Record<string, Entry[]> };

export function makeBackup(settings: Settings, months: Record<string, Entry[]>, now = new Date()): Backup {
  const m: Record<string, Entry[]> = {};
  for (const k of Object.keys(months).sort()) if (months[k].length) m[k] = months[k];
  return { app: 'ausgaben', version: 1, exported: now.toISOString(), settings, months: m };
}

export const backupFileName = (now = new Date()) => `ausgaben-sicherung-${iso(now)}.json`;

const isStr = (v: unknown): v is string => typeof v === 'string';

/** Liest eine Sicherungsdatei. Wirft einen Fehler mit verständlichem Text, wenn sie nicht passt. */
export function parseBackup(text: string): Backup {
  let v: any;
  try { v = JSON.parse(text); } catch { throw new Error('Die Datei ist keine Sicherung dieser App.'); }
  if (!v || v.app !== 'ausgaben' || !v.settings || typeof v.months !== 'object' || !v.months) {
    throw new Error('Die Datei ist keine Sicherung dieser App.');
  }
  if (v.version !== 1) throw new Error('Diese Sicherung stammt aus einer neueren Version der App.');
  const rows = (l: unknown): Row[] => {
    if (!Array.isArray(l)) throw new Error('Die Sicherung ist beschädigt.');
    return l.filter((r) => r && isStr(r.id) && isStr(r.name) && isStr(r.amount)).map((r) => ({ id: r.id, name: r.name, amount: r.amount }));
  };
  const settings: Settings = { income: rows(v.settings.income), fixed: rows(v.settings.fixed), env: rows(v.settings.env) };
  const months: Record<string, Entry[]> = {};
  for (const k of Object.keys(v.months)) {
    if (!/^\d{4}-\d{2}$/.test(k) || !Array.isArray(v.months[k])) continue;
    const list = (v.months[k] as any[]).filter((e) =>
      e && isStr(e.id) && Number.isInteger(e.amount) && e.amount > 0 && e.amount <= MAX_CENTS &&
      isStr(e.what) && isStr(e.env) && isStr(e.t) && isStr(e.date) && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && e.date.slice(0, 7) === k,
    ).map((e) => ({ id: e.id, amount: e.amount, what: e.what, env: e.env, date: e.date, t: e.t }));
    if (list.length) months[k] = list;
  }
  return { app: 'ausgaben', version: 1, exported: isStr(v.exported) ? v.exported : '', settings, months };
}

/** Führt Ausgaben zusammen. Gleiche Einträge (gleiche id) gibt es danach nur einmal. */
export function mergeEntries(current: Entry[], incoming: Entry[]): Entry[] {
  const byId = new Map(current.map((e) => [e.id, e]));
  for (const e of incoming) byId.set(e.id, e);
  return [...byId.values()];
}

export const countEntries = (months: Record<string, Entry[]>) =>
  Object.values(months).reduce((a, l) => a + l.length, 0);

/** „27. November 2026“ aus einem ISO-Zeitpunkt. */
export function fmtDate(isoTime: string): string {
  const d = new Date(isoTime);
  return isNaN(d.getTime()) ? 'unbekannt' : `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Ob an eine Sicherung erinnert werden soll: noch nie gesichert oder länger als 30 Tage her. */
export function backupDue(last: string | null, now = new Date()): boolean {
  if (!last) return true;
  const t = new Date(last).getTime();
  return isNaN(t) || now.getTime() - t > 30 * 864e5;
}

/** Begrüßung nach Tageszeit. */
export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'Guten Morgen';
  if (h >= 11 && h < 18) return 'Guten Tag';
  if (h >= 18 && h < 23) return 'Guten Abend';
  return 'Gute Nacht';
}
