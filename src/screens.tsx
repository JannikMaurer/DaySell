import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MONTHS, calc, dayLabel, envName, euro, iso, longDay, parseIso, pushDigits, sorted, totals, uid,
  type Entry, type Row, type Settings,
} from './logic';
import { useTheme, type as T, type Theme } from './theme';
import { Bar, Chip, DeleteButton, Glass, GlassButton, PrimaryButton, TintButton, TopBar } from './ui';

const useStyles = () => {
  const t = useTheme();
  return { t, ink: { color: t.ink }, muted: { color: t.muted }, red: { color: t.red } };
};

function Screen({ children, bottomSpace = 24 }: { children: React.ReactNode; bottomSpace?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + bottomSpace, paddingHorizontal: 14, maxWidth: 560, width: '100%', alignSelf: 'center' }}
    >
      {children}
    </ScrollView>
  );
}

export function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  const { t } = useStyles();
  return (
    <View accessibilityRole="alert" style={[s.notice, { backgroundColor: t.tint, borderColor: t.red }]}>
      <Text style={[T.small, { color: t.red, fontWeight: '600', flex: 1 }]}>{text}</Text>
      <DeleteButton label="Hinweis schließen" onPress={onClose} />
    </View>
  );
}

/* ---------------- Übersicht ---------------- */
export function Overview(p: {
  settings: Settings; list: Entry[]; vy: number; vm: number;
  onPrev: () => void; onNext: () => void; canNext: boolean;
  onSetup: () => void; onList: () => void; onNew: () => void; notice?: React.ReactNode;
}) {
  const { t, ink, muted, red } = useStyles();
  const insets = useSafeAreaInsets();
  const c = calc(p.settings, p.list, p.vy, p.vm);
  let head: string, sub: string, over = false;
  if (!c.budget) {
    head = 'Richte zuerst dein Budget ein.';
    sub = 'Leg fest, wie viel du pro Monat in jedem Umschlag ausgeben willst.';
  } else if (c.cur) {
    if (c.todayLeft >= 0) head = `Heute kannst du noch ${euro(c.todayLeft)} ausgeben.`;
    else { head = `Heute bist du ${euro(-c.todayLeft)} über deinem Tagesbudget.`; over = true; }
    sub = c.rest >= 0
      ? `Bis zum ${c.n}. bleiben insgesamt ${euro(c.rest)} frei` + (c.n > c.d ? `, danach etwa ${euro(c.future)} pro Tag.` : '.')
      : `Der Monat liegt ${euro(-c.rest)} über dem Budget.`;
  } else {
    head = `Im ${MONTHS[p.vm]} hast du ${euro(c.spent)} ausgegeben.`;
    sub = c.rest >= 0 ? `Das sind ${euro(c.rest)} weniger als geplant.` : `Das sind ${euro(-c.rest)} mehr als geplant.`;
  }
  const max = Math.max(...c.perDay, c.cur ? c.future : 0, c.budget / c.n, 100) * 1.1;
  const daysLeft = c.cur ? c.n - c.d + 1 : 0;
  const recent = sorted(p.list).slice(0, 3);
  const yearSuffix = p.vy !== new Date().getFullYear() ? ` ${p.vy}` : '';

  return (
    <View style={{ flex: 1 }}>
      <Screen bottomSpace={100}>
        <View style={s.row}>
          <Glass radius={22} style={[s.row, { height: 44, paddingHorizontal: 0 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Vorheriger Monat" onPress={p.onPrev} style={s.icon}>
              <Text style={[s.arrow, ink]}>‹</Text>
            </Pressable>
            <Text style={[T.h2, ink, { fontSize: 15 }]}>{MONTHS[p.vm] + yearSuffix}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Nächster Monat" disabled={!p.canNext} onPress={p.onNext} style={[s.icon, !p.canNext && { opacity: 0.3 }]}>
              <Text style={[s.arrow, ink]}>›</Text>
            </Pressable>
          </Glass>
          <View style={[s.row, { gap: 8 }]}>
            {c.cur ? (
              <Glass radius={22} style={{ height: 44, paddingHorizontal: 14, justifyContent: 'center' }}>
                <Text style={[T.small, ink, { fontWeight: '500' }]}>Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'}</Text>
              </Glass>
            ) : null}
            <GlassButton label="⚙︎" accessibilityLabel="Budget einrichten" onPress={p.onSetup} textStyle={{ fontSize: 20 }} />
          </View>
        </View>
        {p.notice}

        <View style={{ paddingHorizontal: 6, paddingTop: 18 }}>
          <Text accessibilityRole="header" style={[T.h1, over ? red : ink]}>{head}</Text>
          <Text style={[T.body, muted, { marginTop: 8 }]}>{sub}</Text>
          {!c.budget ? <TintButton label="Budget einrichten" onPress={p.onSetup} style={{ marginTop: 12, alignSelf: 'flex-start' }} /> : null}
        </View>

        <Glass style={{ marginTop: 16, padding: 16, paddingBottom: 10 }}>
          <View accessible accessibilityLabel="Ausgaben pro Tag. Gestrichelte Linie zeigt das Tagesbudget." style={{ height: 96, flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
            {c.budget ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: `${Math.min(100, (c.budget / c.n / max) * 100)}%`, flexDirection: 'row', justifyContent: 'space-between' }}>
                {Array.from({ length: 40 }, (_, i) => <View key={i} style={{ width: 4, height: 1.5, backgroundColor: t.faint }} />)}
              </View>
            ) : null}
            {c.perDay.map((v, i) => {
              const fut = c.cur && i + 1 > c.d;
              const now = c.cur && i + 1 === c.d;
              const val = fut ? c.future : v;
              const h = `${Math.min(100, (val / max) * 100)}%` as const;
              return (
                <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end', borderRadius: 4, backgroundColor: now ? t.today : 'transparent' }}>
                  <View style={[{ height: h, borderRadius: 3 }, fut ? { borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.faint } : { backgroundColor: now ? t.ink : t.accent }]} />
                </View>
              );
            })}
          </View>
          <View style={[s.row, { marginTop: 6 }]}>
            <Text style={[T.small, muted, { fontSize: 12 }]}>1.</Text>
            {c.cur ? <Text style={[T.small, ink, { fontSize: 12, fontWeight: '700' }]}>Heute ist der {c.d}.</Text> : null}
            <Text style={[T.small, muted, { fontSize: 12 }]}>{c.n}.</Text>
          </View>
        </Glass>

        <Glass style={{ marginTop: 12, padding: 18, paddingBottom: 8 }}>
          <View style={s.wrapRow}>
            <Text style={[T.h2, ink]}>Umschläge</Text>
            <Text style={[T.small, muted, T.num]}>{euro(c.spent)} von {euro(c.budget)}</Text>
          </View>
          {c.envs.length === 0 ? <Text style={[T.small, muted, { marginTop: 8 }]}>Noch keine Umschläge angelegt.</Text> : null}
          {c.envs.map((e) => {
            const isOver = e.left < 0;
            const note = e.orphan ? euro(e.spent) : isOver ? `${euro(-e.left)} drüber` : `noch ${euro(e.left)}`;
            const pct = e.budget > 0 ? (e.spent / e.budget) * 100 : e.spent ? 100 : 0;
            return (
              <View key={e.id || 'orphan'} style={{ marginTop: 12 }}>
                <View style={s.wrapRow}>
                  <Text style={[T.body, ink, { fontWeight: '600', flexShrink: 1 }]}>{e.name}</Text>
                  <Text style={[T.body, T.num, isOver ? [red, { fontWeight: '600' }] : muted]}>{note}</Text>
                </View>
                <Bar pct={pct} over={isOver} />
              </View>
            );
          })}

          <View style={[s.wrapRow, { marginTop: 18, marginBottom: 10, alignItems: 'center' }]}>
            <Text style={[T.h2, ink]}>Zuletzt</Text>
            {p.list.length ? <TintButton label={`Alle ${p.list.length} anzeigen`} onPress={p.onList} /> : null}
          </View>
          {recent.length === 0 ? (
            <Text style={[T.small, muted, { paddingBottom: 10 }]}>Noch keine Ausgaben in diesem Monat. Tippe unten auf „Ausgabe erfassen“.</Text>
          ) : (
            recent.map((e) => <ItemRow key={e.id} e={e} settings={p.settings} />)
          )}
        </Glass>
        <Text style={[T.small, muted, { margin: 12 }]}>Auf diesem Gerät gespeichert.</Text>
      </Screen>
      <View style={{ position: 'absolute', left: 14, right: 14, bottom: insets.bottom + 14, alignItems: 'center' }}>
        <PrimaryButton label="Ausgabe erfassen" icon="+" onPress={p.onNew} style={{ width: '100%', maxWidth: 532 }} />
      </View>
    </View>
  );
}

function ItemRow({ e, settings, onDelete }: { e: Entry; settings: Settings; onDelete?: () => void }) {
  const { t, ink, muted } = useStyles();
  const what = e.what || envName(settings, e.env);
  return (
    <View style={[s.item, { borderTopColor: t.edge }]}>
      <View style={{ flex: 1 }}>
        <Text style={[T.body, ink, { fontWeight: '600' }]}>{what}</Text>
        <Text style={[T.small, muted]}>{envName(settings, e.env)}{onDelete ? '' : ', ' + dayLabel(e.date)}</Text>
      </View>
      <Text style={[T.body, ink, T.num, { fontWeight: '600' }]}>{euro(e.amount)}</Text>
      {onDelete ? <DeleteButton label={`${what} löschen`} onPress={onDelete} /> : null}
    </View>
  );
}

/* ---------------- Liste ---------------- */
export function ListScreen(p: {
  settings: Settings; list: Entry[]; vm: number; ghost: Entry | null;
  onBack: () => void; onDelete: (e: Entry) => void; onUndo: () => void;
}) {
  const { t, muted } = useStyles();
  const all = p.ghost ? p.list.concat([{ ...p.ghost, t: p.ghost.t }]) : p.list;
  const groups: Record<string, Entry[]> = {};
  for (const e of sorted(all)) (groups[e.date] = groups[e.date] || []).push(e);
  return (
    <Screen>
      <TopBar left={<GlassButton label="Zurück" onPress={p.onBack} />} title={MONTHS[p.vm]} />
      <Glass style={{ marginTop: 12, paddingHorizontal: 18, paddingVertical: 8 }}>
        {Object.keys(groups).length === 0 ? <Text style={[T.body, muted, { paddingVertical: 12 }]}>Keine Ausgaben in diesem Monat.</Text> : null}
        {Object.keys(groups).map((d) => {
          const sum = groups[d].filter((e) => e !== p.ghost && e.id !== p.ghost?.id).reduce((a, e) => a + e.amount, 0);
          return (
            <View key={d}>
              <View style={[s.wrapRow, { marginTop: 14, marginBottom: 2 }]}>
                <Text style={[T.small, muted, { fontWeight: '700' }]}>{longDay(d)}</Text>
                <Text style={[T.small, muted, T.num, { fontWeight: '700' }]}>{euro(sum)}</Text>
              </View>
              {groups[d].map((e) =>
                p.ghost && e.id === p.ghost.id ? (
                  <View key={e.id + '-gone'} accessibilityLiveRegion="polite" style={[s.item, { borderTopColor: t.edge }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[T.body, muted]}>Gelöscht: {e.what || envName(p.settings, e.env)}</Text>
                      <Text style={[T.small, muted, T.num]}>{euro(e.amount)}</Text>
                    </View>
                    <TintButton label="Rückgängig" onPress={p.onUndo} />
                  </View>
                ) : (
                  <ItemRow key={e.id} e={e} settings={p.settings} onDelete={() => p.onDelete(e)} />
                ),
              )}
            </View>
          );
        })}
      </Glass>
    </Screen>
  );
}

/* ---------------- Ausgabe erfassen ---------------- */
export function EntryScreen(p: {
  settings: Settings; getList: (key: string) => Entry[] | undefined; ensureMonth: (key: string) => void;
  lastEnv: string | null; onCancel: () => void; onSave: (e: Entry) => void;
}) {
  const { t, ink, muted, red } = useStyles();
  const [cents, setCents] = useState('');
  const [what, setWhat] = useState('');
  const [date, setDate] = useState(iso(new Date()));
  const [warn, setWarn] = useState(false);
  const envs = p.settings.env;
  const [env, setEnv] = useState<string | null>(p.lastEnv && envs.some((e) => e.id === p.lastEnv) ? p.lastEnv : envs[0]?.id ?? null);
  const amt = parseInt(cents || '0', 10);
  const k = date.slice(0, 7);
  useEffect(() => { p.ensureMonth(k); }, [k]);

  const press = (d: string) => {
    const r = pushDigits(cents, d);
    setCents(r.cents);
    setWarn(r.tooBig);
  };
  const shiftDay = (n: number) => {
    const d = parseIso(date);
    d.setDate(d.getDate() + n);
    if (iso(d) <= iso(new Date())) setDate(iso(d));
  };

  let hint: string, hintRed = false;
  const list = p.getList(k);
  if (warn) { hint = 'Höchstens 10.000.000,00 € pro Ausgabe.'; hintRed = true; }
  else if (!env) { hint = 'Lege zuerst unter „Budget einrichten“ einen Umschlag an.'; hintRed = true; }
  else if (!list) hint = 'Lade …';
  else {
    const [y, m] = k.split('-').map(Number);
    const e = calc(p.settings, list, y, m - 1).envs.find((x) => x.id === env)!;
    const after = e.left - amt;
    if (!amt) { hint = e.left < 0 ? `${e.name} ist schon ${euro(-e.left)} über dem Budget.` : `In ${e.name} sind noch ${euro(e.left)} frei.`; hintRed = e.left < 0; }
    else if (after >= 0) hint = `Danach bleiben in ${e.name} noch ${euro(after)}.`;
    else { hint = `Damit liegt ${e.name} ${euro(-after)} über dem Budget.`; hintRed = true; }
  }
  const isToday = date === iso(new Date());
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '⌫'];

  return (
    <Screen>
      <TopBar left={<GlassButton label="Abbrechen" onPress={p.onCancel} />} title="Neue Ausgabe" />
      <View style={{ height: 76, justifyContent: 'center', marginTop: 8, paddingHorizontal: 6 }}>
        <Text
          accessibilityLiveRegion="polite"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
          style={[T.num, { fontSize: 62, fontWeight: '800', letterSpacing: -2, color: amt ? t.accent : t.faint }]}
        >
          {euro(amt)}
        </Text>
      </View>

      <Glass style={{ padding: 14 }}>
        <Text style={[s.label, muted]}>Wofür</Text>
        <TextInput
          value={what}
          onChangeText={setWhat}
          placeholder="z. B. Bäckerei"
          placeholderTextColor={t.faint}
          returnKeyType="done"
          style={[s.field, { backgroundColor: t.field, borderColor: t.edge, color: t.ink }]}
        />
        <Text style={[s.label, muted, { marginTop: 14 }]}>Datum</Text>
        <View style={[s.row, { gap: 8 }]}>
          <GlassButton label="‹" accessibilityLabel="Einen Tag früher" onPress={() => shiftDay(-1)} textStyle={{ fontSize: 22 }} />
          <Text style={[T.body, ink, { flex: 1, textAlign: 'center', fontWeight: '600' }]}>
            {isToday ? 'Heute' : dayLabel(date) === 'gestern' ? 'Gestern' : longDay(date)}
          </Text>
          <View style={{ opacity: isToday ? 0.3 : 1 }}>
            <GlassButton label="›" accessibilityLabel="Einen Tag später" onPress={() => shiftDay(1)} textStyle={{ fontSize: 22 }} />
          </View>
        </View>
        <Text style={[s.label, muted, { marginTop: 14 }]}>Aus welchem Umschlag</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {envs.map((e) => (
            <Chip key={e.id} label={e.name.trim() || 'Ohne Namen'} selected={e.id === env} onPress={() => setEnv(e.id)} />
          ))}
        </View>
        <Text style={[T.small, { minHeight: 40, marginTop: 12, marginHorizontal: 4, fontSize: 14 }, hintRed ? [red, { fontWeight: '600' }] : muted]}>{hint}</Text>
      </Glass>

      <View style={{ gap: 8, marginTop: 14 }}>
        {[0, 3, 6, 9].map((start) => (
          <View key={start} style={{ flexDirection: 'row', gap: 8 }}>
            {keys.slice(start, start + 3).map((key) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={key === '⌫' ? 'Letzte Ziffer löschen' : key}
                onPress={() => (key === '⌫' ? (setCents(cents.slice(0, -1)), setWarn(false)) : press(key))}
                style={({ pressed }) => [{ flex: 1 }, pressed && { transform: [{ scale: 0.95 }] }]}
              >
                <Glass radius={26} style={{ height: 52, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={[ink, { fontSize: 22, fontWeight: '600' }]}>{key}</Text>
                </Glass>
              </Pressable>
            ))}
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Ausgabe speichern"
        disabled={!amt || !env}
        style={{ marginTop: 14 }}
        onPress={() => env && amt && p.onSave({ id: uid(), amount: amt, what: what.trim(), env, date, t: new Date().toISOString() })}
      />
    </Screen>
  );
}

/* ---------------- Gespeichert ---------------- */
export function SavedScreen(p: { settings: Settings; entry: Entry; list: Entry[]; onHome: () => void; onAgain: () => void }) {
  const { t, ink, muted } = useStyles();
  const [y, m] = p.entry.date.split('-').map(Number);
  const e = calc(p.settings, p.list, y, m - 1).envs.find((x) => x.id === p.entry.env);
  const txt = !e ? '' : e.left >= 0
    ? `In ${e.name} bleiben noch ${euro(e.left)} für ${MONTHS[m - 1]}.`
    : `${e.name} liegt jetzt ${euro(-e.left)} über dem Budget. Du kannst unter „Budget einrichten“ Geld aus einem anderen Umschlag umverteilen.`;
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 14, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <Glass radius={32} style={{ padding: 22, paddingTop: 28, maxWidth: 532, width: '100%', alignSelf: 'center' }}>
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: t.today, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[ink, { fontSize: 26, fontWeight: '700' }]}>✓</Text>
        </View>
        <Text accessibilityRole="header" style={[T.h1, ink, { marginTop: 14 }]}>{euro(p.entry.amount)} gespeichert.</Text>
        <Text style={[T.body, muted, { marginTop: 8 }]}>{txt}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
          <PrimaryButton label="Zur Übersicht" onPress={p.onHome} style={{ flexGrow: 1, flexBasis: 140 }} />
          <GlassButton label="Noch eine" small={false} onPress={p.onAgain} style={{ flexGrow: 1, flexBasis: 140 }} />
        </View>
      </Glass>
    </View>
  );
}

/* ---------------- Budget einrichten ---------------- */
export function SetupScreen(p: { settings: Settings; firstRun: boolean; onChange: (s: Settings) => void; onDone: () => void }) {
  const { t, ink, muted, red } = useStyles();
  const tt = totals(p.settings);
  const narrow = useWindowDimensions().width < 380;
  const set = (list: keyof Settings, rows: Row[]) => p.onChange({ ...p.settings, [list]: rows });
  const update = (list: keyof Settings, id: string, field: 'name' | 'amount', value: string) =>
    set(list, p.settings[list].map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const section = (title: string, list: keyof Settings, ph: string, add: string, hint: string, total: number) => (
    <Glass style={{ marginTop: 12, padding: 12, paddingTop: 16 }}>
      <View style={[s.wrapRow, { paddingHorizontal: 4 }]}>
        <Text style={[T.h2, ink]}>{title}</Text>
        <Text style={[T.small, ink, T.num, { fontWeight: '600', fontSize: 14 }]}>{euro(total)}</Text>
      </View>
      {hint ? <Text style={[T.small, muted, { marginHorizontal: 4, marginTop: 2 }]}>{hint}</Text> : null}
      {p.settings[list].map((r) => (
        <View key={r.id} style={[s.row, { gap: 6, marginTop: narrow ? 14 : 10, flexWrap: narrow ? 'wrap' : 'nowrap' }]}>
          <TextInput
            value={r.name}
            onChangeText={(v) => update(list, r.id, 'name', v)}
            placeholder={ph}
            placeholderTextColor={t.faint}
            accessibilityLabel="Bezeichnung"
            style={[s.field, narrow ? { width: '100%' } : { flex: 1, minWidth: 0 }, { backgroundColor: t.field, borderColor: t.edge, color: t.ink }]}
          />
          <TextInput
            value={r.amount}
            onChangeText={(v) => update(list, r.id, 'amount', v)}
            placeholder="0 €"
            placeholderTextColor={t.faint}
            keyboardType="decimal-pad"
            accessibilityLabel={`Betrag für ${r.name || ph}`}
            style={[s.field, T.num, narrow ? { flex: 1, minWidth: 0 } : { width: 118, textAlign: 'right' }, { backgroundColor: t.field, borderColor: t.edge, color: t.ink }]}
          />
          <DeleteButton label={`${r.name || 'Zeile'} entfernen`} onPress={() => set(list, p.settings[list].filter((x) => x.id !== r.id))} />
        </View>
      ))}
      <TintButton label={add} icon="+" onPress={() => set(list, [...p.settings[list], { id: uid(), name: '', amount: '' }])} style={{ marginTop: 12, marginBottom: 4 }} />
    </Glass>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <TopBar title="Budget einrichten" right={<PrimaryButton small label="Fertig" onPress={p.onDone} />} />
        {p.firstRun ? (
          <Text style={[T.body, muted, { marginTop: 14, marginHorizontal: 6 }]}>
            Trag dein Einkommen, deine festen Kosten und deine Umschläge ein. Du kannst alles später ändern.
          </Text>
        ) : null}
        <Glass style={{ marginTop: 12, padding: 18 }}>
          <Text style={[T.body, muted]}>Pro Monat ohne Umschlag</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit style={[T.num, { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 4 }, tt.free < 0 ? red : ink]}>
            {euro(tt.free)}
          </Text>
          <Text style={[T.small, muted, { marginTop: 4, fontSize: 14 }]}>
            {tt.free < 0
              ? 'Du hast mehr verteilt, als nach den Fixkosten übrig ist. Kürze einen Umschlag oder eine Fixkosten-Position.'
              : 'Einkommen minus Fixkosten minus Umschläge. Der Rest bleibt frei, zum Beispiel zum Sparen.'}
          </Text>
        </Glass>
        {section('Einkommen', 'income', 'z. B. Gehalt', 'Einnahme hinzufügen', '', tt.inc)}
        {section('Fixkosten', 'fixed', 'z. B. Miete', 'Fixkosten hinzufügen', 'Gehen jeden Monat automatisch ab.', tt.fix)}
        {section('Umschläge', 'env', 'z. B. Kleidung', 'Umschlag hinzufügen', 'So viel willst du pro Monat in jedem Bereich ausgeben.', tt.env)}
        <Text style={[T.small, muted, { margin: 12 }]}>Deine Angaben bleiben auf diesem Gerät.</Text>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: 10, rowGap: 2 },
  icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 26, fontWeight: '500', marginTop: -3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth * 2 },
  label: { fontSize: 14, fontWeight: '600', marginHorizontal: 4, marginBottom: 6 },
  field: { height: 46, borderRadius: 23, borderWidth: 1, paddingHorizontal: 14, fontSize: 16 },
  notice: { marginTop: 12, paddingLeft: 16, paddingRight: 4, borderRadius: 22, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
});

export type { Theme };
