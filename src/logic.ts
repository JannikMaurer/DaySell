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
