// Sicherung als Datei: iPhone- und Android-App.
// Die Browser-Version steht in backup.web.ts.
import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

/** Öffnet das Teilen-Menü mit der Datei (z. B. „In Dateien sichern“). true, wenn es geklappt hat. */
export async function exportFile(json: string, name: string): Promise<boolean> {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  await file.write(json);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Sicherung speichern' });
  return true;
}

/** Lässt eine Datei auswählen und gibt ihren Inhalt zurück, oder null bei Abbruch. */
export async function pickFile(): Promise<string | null> {
  const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (r.canceled || !r.assets?.length) return null;
  return new File(r.assets[0].uri).text();
}

export function confirm(title: string, message: string, ok: string): Promise<boolean> {
  return new Promise((resolve) =>
    Alert.alert(title, message, [
      { text: 'Abbrechen', style: 'cancel', onPress: () => resolve(false) },
      { text: ok, onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) }),
  );
}
