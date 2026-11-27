import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  backupFileName, countEntries, emptySettings, fmtDate, makeBackup, mergeEntries, mkey, parseBackup,
  type Entry, type Settings,
} from './src/logic';
import {
  listMonthKeys, loadLastBackup, loadMonth, loadSettings, saveLastBackup, saveMonth, saveSettings,
} from './src/storage';
import { confirm, exportFile, pickFile } from './src/backup';
import { useTheme } from './src/theme';
import { Backdrop } from './src/ui';
import { EntryScreen, ListScreen, Notice, Overview, SavedScreen, SetupScreen } from './src/screens';

type ViewName = 'overview' | 'list' | 'entry' | 'saved' | 'setup';

export default function App() {
  return (
    <SafeAreaProvider>
      <Main />
    </SafeAreaProvider>
  );
}

function Main() {
  const t = useTheme();
  const now = new Date();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [months, setMonths] = useState<Record<string, Entry[]>>({});
  const monthsRef = useRef(months);
  monthsRef.current = months;
  const [view, setView] = useState<ViewName>('overview');
  const [vy, setVy] = useState(now.getFullYear());
  const [vm, setVm] = useState(now.getMonth());
  const [firstRun, setFirstRun] = useState(false);
  const [undo, setUndo] = useState<{ k: string; e: Entry } | null>(null);
  const [last, setLast] = useState<Entry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const loading = useRef(new Set<string>());
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [allKeys, setAllKeys] = useState<string[] | null>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const ensureMonth = useCallback((k: string) => {
    if (monthsRef.current[k] || loading.current.has(k)) return;
    loading.current.add(k);
    loadMonth(k).then((list) => {
      loading.current.delete(k);
      setMonths((m) => (m[k] ? m : { ...m, [k]: list }));
    });
  }, []);

  // Start: Einstellungen und aktuellen Monat laden.
  useEffect(() => {
    (async () => {
      const s = await loadSettings();
      if (s) setSettings(s);
      else { setSettings(emptySettings()); setFirstRun(true); setView('setup'); }
      ensureMonth(mkey(now.getFullYear(), now.getMonth()));
      setLastBackup(await loadLastBackup());
    })();
  }, []);

  // Einstellungen kurz nach jeder Änderung speichern.
  useEffect(() => {
    if (!settings || firstRun) return;
    const id = setTimeout(() => { saveSettings(settings).then((ok) => !ok && setNotice('Speichern hat nicht geklappt.')); }, 400);
    return () => clearTimeout(id);
  }, [settings, firstRun]);

  // Beim Zurückkehren in die App neu zeichnen, damit „heute“ stimmt.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => st === 'active' && setTick((x) => x + 1));
    return () => sub.remove();
  }, []);

  const go = (v: ViewName) => { setUndo(null); setBackupMsg(null); setView(v); };

  // Für die Sicherung alle gespeicherten Monate laden, sobald „Budget einrichten“ offen ist.
  useEffect(() => {
    if (view !== 'setup') return;
    listMonthKeys().then((keys) => { setAllKeys(keys); keys.forEach(ensureMonth); });
  }, [view]);
  const backupReady = !!allKeys && allKeys.every((key) => months[key]);

  // Ohne Warten aufrufen: Safari öffnet das Teilen-Menü nur direkt nach dem Tippen.
  const doExport = () => {
    if (!settings || !backupReady) return;
    const json = JSON.stringify(makeBackup(settings, months));
    exportFile(json, backupFileName())
      .then((ok) => {
        if (!ok) return;
        const d = new Date().toISOString();
        setLastBackup(d);
        saveLastBackup(d);
        setBackupMsg({ text: 'Sicherung gespeichert.' });
      })
      .catch(() => setBackupMsg({ text: 'Die Sicherung hat nicht geklappt.', error: true }));
  };

  const doImport = async () => {
    try {
      const text = await pickFile();
      if (text == null) return;
      const b = parseBackup(text);
      const n = countEntries(b.months);
      const ok = await confirm(
        'Sicherung einlesen?',
        `Die Sicherung vom ${fmtDate(b.exported)} enthält ${n} ${n === 1 ? 'Ausgabe' : 'Ausgaben'}. ` +
          'Dein Budget wird durch das aus der Sicherung ersetzt. Die Ausgaben kommen zu deinen dazu, doppelte gibt es danach nicht.',
        'Einlesen',
      );
      if (!ok) return;
      for (const key of Object.keys(b.months)) {
        const merged = mergeEntries(await loadMonth(key), b.months[key]);
        if (!(await saveMonth(key, merged))) throw new Error('Speichern hat nicht geklappt. Ist der Speicher voll?');
      }
      if (!(await saveSettings(b.settings))) throw new Error('Speichern hat nicht geklappt. Ist der Speicher voll?');
      const keys = await listMonthKeys();
      const all: Record<string, Entry[]> = {};
      for (const key of keys) all[key] = await loadMonth(key);
      loading.current.clear();
      setMonths(all);
      setAllKeys(keys);
      setSettings(b.settings);
      setFirstRun(false);
      setBackupMsg({ text: `Sicherung eingelesen: ${n} ${n === 1 ? 'Ausgabe' : 'Ausgaben'}.` });
    } catch (e) {
      setBackupMsg({ text: e instanceof Error ? e.message : 'Die Sicherung ließ sich nicht einlesen.', error: true });
    }
  };

  // Android-Zurück-Taste führt zur Übersicht.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'overview' || (view === 'setup' && firstRun)) return false;
      go('overview');
      return true;
    });
    return () => sub.remove();
  }, [view, firstRun]);

  const writeMonth = (k: string, list: Entry[]) => {
    setMonths((m) => ({ ...m, [k]: list }));
    saveMonth(k, list).then((ok) => !ok && setNotice('Speichern hat nicht geklappt. Ist der Speicher voll?'));
  };

  const openMonth = (dy: number) => {
    let m = vm + dy, y = vy;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setVy(y); setVm(m); ensureMonth(mkey(y, m));
  };

  if (!settings) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.accent} />
      </View>
    );
  }

  const k = mkey(vy, vm);
  const list = months[k] ?? [];
  const isLatest = vy === now.getFullYear() && vm === now.getMonth();
  const noticeEl = notice ? <Notice text={notice} onClose={() => setNotice(null)} /> : null;

  let screen: React.ReactNode;
  if (view === 'setup') {
    screen = (
      <SetupScreen
        settings={settings}
        firstRun={firstRun}
        onChange={setSettings}
        onDone={() => { setFirstRun(false); saveSettings(settings); go('overview'); }}
        backup={{ last: lastBackup, ready: backupReady, msg: backupMsg, onExport: doExport, onImport: doImport }}
      />
    );
  } else if (view === 'list') {
    screen = (
      <ListScreen
        settings={settings}
        list={list}
        vm={vm}
        ghost={undo && undo.k === k ? undo.e : null}
        onBack={() => go('overview')}
        onDelete={(e) => { writeMonth(k, list.filter((x) => x.id !== e.id)); setUndo({ k, e }); }}
        onUndo={() => { if (undo) { writeMonth(undo.k, [...(months[undo.k] ?? []), undo.e]); setUndo(null); } }}
      />
    );
  } else if (view === 'entry') {
    screen = (
      <EntryScreen
        settings={settings}
        getList={(key) => months[key]}
        ensureMonth={ensureMonth}
        lastEnv={last?.env ?? null}
        onCancel={() => go('overview')}
        onSave={(e) => {
          const ek = e.date.slice(0, 7);
          writeMonth(ek, [...(months[ek] ?? []), e]);
          setLast(e);
          const [y, m] = ek.split('-').map(Number);
          setVy(y); setVm(m - 1);
          go('saved');
        }}
      />
    );
  } else if (view === 'saved' && last) {
    screen = (
      <SavedScreen
        settings={settings}
        entry={last}
        list={months[last.date.slice(0, 7)] ?? []}
        onHome={() => go('overview')}
        onAgain={() => go('entry')}
      />
    );
  } else {
    screen = (
      <Overview
        settings={settings}
        list={list}
        vy={vy}
        vm={vm}
        onPrev={() => openMonth(-1)}
        onNext={() => openMonth(1)}
        canNext={!isLatest}
        onSetup={() => go('setup')}
        onList={() => go('list')}
        onNew={() => go('entry')}
        notice={noticeEl}
        lastBackup={lastBackup}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <Backdrop />
      {screen}
    </View>
  );
}
