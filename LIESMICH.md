# Ausgaben – App für iPhone und Android

Eine echte App (React Native mit Expo): Tagesbudget, Umschläge, Ausgaben erfassen,
frühere Monate ansehen. Alle Daten bleiben auf deinem Handy.

## 1. Einmalig vorbereiten (Windows-PC)

1. **Node.js** installieren: https://nodejs.org → Version „LTS“ herunterladen und installieren.
2. Auf dem Handy die kostenlose App **Expo Go** installieren (App Store bzw. Google Play).
3. PC und Handy müssen im **selben WLAN** sein.

## 2. App starten

1. Diesen Ordner entpacken, zum Beispiel nach `Dokumente\ausgaben-code`.
2. Doppelklick auf **`einrichten.bat`**.
   Beim ersten Mal dauert das ein paar Minuten. Das Skript legt daneben den Ordner
   `ausgaben-app` an, kopiert den Code hinein und installiert alles Nötige.
3. Am Ende erscheint ein **QR-Code**:
   - **iPhone:** mit der normalen Kamera scannen und „In Expo Go öffnen“ tippen.
   - **Android:** in Expo Go auf „Scan QR code“ tippen.

Später reicht es, im Ordner `ausgaben-app` eine Eingabeaufforderung zu öffnen und
`npx expo start` einzugeben.

Wenn Windows fragt, ob Node.js ins Netzwerk darf: **Privates Netzwerk erlauben**,
sonst findet das Handy den PC nicht. Klappt es trotzdem nicht, starte mit
`npx expo start --tunnel`.

## 3. Ohne PC nutzen (eigene App aufs Handy)

Mit Expo Go läuft die App nur, solange der PC sie bereitstellt. Für eine
eigenständige App mit eigenem Symbol:

- **Android (kostenlos):**
  1. Kostenloses Konto auf https://expo.dev anlegen.
  2. Im Ordner `ausgaben-app`: `npx eas-cli login`, dann
     `npx eas-cli build -p android --profile preview`.
  3. Nach etwa 15 Minuten gibt es einen Link zu einer `.apk`-Datei. Auf dem Handy öffnen
     und installieren.
- **iPhone:** Apple verlangt dafür ein **Apple-Entwicklerkonto (99 € pro Jahr)**.
  Dann: `npx eas-cli build -p ios` und die App über TestFlight installieren.
  Einen Mac brauchst du dafür nicht, Expo baut in der Cloud.

## Was im Code steckt

| Datei | Inhalt |
|---|---|
| `App.tsx` | Steuerung: welcher Screen, Laden und Speichern |
| `src/logic.ts` | Rechenlogik: Tagesbudget, Umschläge, Beträge lesen und formatieren |
| `src/screens.tsx` | Übersicht, Liste, Ausgabe erfassen, Bestätigung, Budget einrichten |
| `src/ui.tsx` | Glasflächen, Buttons, Umschlag-Auswahl |
| `src/theme.ts` | Farben für hell und dunkel |
| `src/storage.ts` | Speichern auf dem Gerät |

Hell und dunkel folgen automatisch der Einstellung des Handys.
Auf dem iPhone sind die Flächen weichgezeichnetes Glas, auf Android etwas dichter
und ohne Weichzeichner, weil Android das nicht überall gleich gut kann.

## Hinweis

Die Daten aus der Web-Version auf claude.ai werden nicht übernommen. Die App startet
mit „Budget einrichten“.
