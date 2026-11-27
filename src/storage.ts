import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Entry, Settings } from './logic';

// Alles bleibt auf dem Gerät. Pro Monat ein Eintrag, damit nichts zu groß wird.
const PREFIX = 'ausgaben:';

export async function loadSettings(): Promise<Settings | null> {
  try {
    const s = await AsyncStorage.getItem(PREFIX + 'settings');
    return s ? (JSON.parse(s) as Settings) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(s: Settings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PREFIX + 'settings', JSON.stringify(s));
    return true;
  } catch {
    return false;
  }
}

export async function loadMonth(key: string): Promise<Entry[]> {
  try {
    const s = await AsyncStorage.getItem(PREFIX + 'm-' + key);
    const v = s ? JSON.parse(s) : null;
    return v && Array.isArray(v.entries) ? (v.entries as Entry[]) : [];
  } catch {
    return [];
  }
}

export async function saveMonth(key: string, entries: Entry[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PREFIX + 'm-' + key, JSON.stringify({ entries }));
    return true;
  } catch {
    return false;
  }
}

/** Schlüssel aller gespeicherten Monate, z. B. „2026-11“. */
export async function listMonthKeys(): Promise<string[]> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter((k) => k.startsWith(PREFIX + 'm-')).map((k) => k.slice(PREFIX.length + 2)).sort();
  } catch {
    return [];
  }
}

export async function loadLastBackup(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PREFIX + 'lastBackup');
  } catch {
    return null;
  }
}

export async function saveLastBackup(isoDate: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + 'lastBackup', isoDate);
  } catch {}
}
