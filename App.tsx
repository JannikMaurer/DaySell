import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { emptySettings, mkey, type Entry, type Settings } from './src/logic';
import { loadMonth, loadSettings, saveMonth, saveSettings } from './src/storage';
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

  const go = (v: ViewName) => { setUndo(null); setView(v); };

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
