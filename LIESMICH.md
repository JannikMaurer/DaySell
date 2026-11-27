# Ausgaben – App für iPhone und Android

Eine echte App (React Native mit Expo): Tagesbudget, Umschläge, Ausgaben erfassen,
frühere Monate ansehen. Alle Daten bleiben auf deinem Handy.

## Als App auf dem iPhone-Home-Bildschirm (kostenlos, empfohlen)

Die App läuft als Web-App in Safari: eigenes Symbol, Vollbild, funktioniert auch
ohne Internet. Kein PC und kein Apple-Entwicklerkonto nötig.

**Einmalig veröffentlichen (am PC oder Handy, ca. 5 Minuten):**
1. Auf https://app.netlify.com kostenlos registrieren, am einfachsten mit „Sign up with GitHub“.
2. **Add new project → Import an existing project → GitHub** wählen und Netlify den
   Zugriff auf das Repository `DaySell` erlauben.
3. `DaySell` auswählen. Die Einstellungen kommen automatisch aus `netlify.toml`,
   einfach auf **Deploy** tippen.
4. Nach 1–2 Minuten steht oben eine Adresse wie `https://irgendwas.netlify.app`.
   Unter **Project configuration → Change project name** kannst du einen schöneren
   Namen wählen, z. B. `meine-ausgaben`.

**Auf dem iPhone:**
1. Die Adresse in **Safari** öffnen (nicht in Chrome).
2. Unten auf **Teilen** (Quadrat mit Pfeil) → **Zum Home-Bildschirm** → **Hinzufügen**.
3. Ab jetzt die App immer über das Symbol öffnen.

Jede Änderung am Code auf GitHub veröffentlicht Netlify automatisch neu. Die App
holt sich die neue Version beim nächsten Öffnen mit Internet.

**Wichtig zu deinen Daten:** Sie liegen nur in der Home-Bildschirm-App auf dem
iPhone. Wenn du das Symbol löschst, sind sie weg. In Safari selbst (ohne Symbol)
siehst du andere Daten als in der App. Deshalb:

**Sicherung:** Unter ⚙︎ „Budget einrichten“ ganz unten auf **Sicherung speichern**
tippen und **In Dateien sichern** wählen, am besten in iCloud Drive. Zum
Wiederherstellen (z. B. auf einem neuen iPhone) dort **Sicherung einlesen** und die
Datei auswählen. Eingelesene Ausgaben kommen zu den vorhandenen dazu, nichts wird
doppelt. Das Budget wird durch das aus der Sicherung ersetzt. Ist die letzte
Sicherung länger als 30 Tage her, erinnert dich die Übersicht daran.

## Mit Expo Go testen (braucht den PC)

### 1. Einmalig vorbereiten

1. Auf dem **iPhone** die kostenlose App **Expo Go** aus dem App Store installieren.
2. Auf dem **Windows-PC** **Node.js** installieren: https://nodejs.org → Version „LTS“.
3. Den Code auf den PC holen: auf GitHub im Repository `DaySell` den richtigen Branch
   wählen, dann **Code → Download ZIP**, und die ZIP entpacken
   (zum Beispiel nach `Dokumente\DaySell`).
4. PC und iPhone müssen im **selben WLAN** sein.

### 2. App auf dem iPhone starten

1. Im entpackten Ordner doppelt auf **`einrichten.bat`** klicken.
   Beim ersten Mal installiert das Skript ein paar Minuten lang die nötigen Pakete.
2. Am Ende erscheint ein **QR-Code**. Mit der normalen **iPhone-Kamera** scannen und
   „In Expo Go öffnen“ tippen. Die App lädt und startet in Expo Go.
3. Beim nächsten Mal reicht wieder ein Doppelklick auf `einrichten.bat`.
   In Expo Go steht die App dann auch unter „Recently opened“.

Die App läuft in Expo Go, solange das Fenster mit dem QR-Code auf dem PC offen ist.
Deine Ausgaben speichert sie auf dem iPhone, die gehen beim Beenden nicht verloren.

**Wenn das iPhone den PC nicht findet:**
- Wenn Windows fragt, ob Node.js ins Netzwerk darf: **Privates Netzwerk erlauben**.
- Sonst im Ordner eine Eingabeaufforderung öffnen und `npx expo start --tunnel` eingeben.
  Das geht auch, wenn PC und iPhone in verschiedenen Netzen sind.

## Als eigenständige native App (App Store / TestFlight)

Mit Expo Go läuft die App nur, solange der PC sie bereitstellt. Für eine
eigenständige App mit eigenem Symbol:

- **Android (kostenlos):**
  1. Kostenloses Konto auf https://expo.dev anlegen.
  2. Im Projektordner: `npx eas-cli login`, dann
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
| `src/backup.ts`, `src/backup.web.ts` | Sicherung als Datei speichern und einlesen (App bzw. Browser) |
| `public/` | Web-App: Symbol, Manifest, Offline-Speicher (`sw.js`) |
| `netlify.toml` | Einstellungen für die Veröffentlichung auf Netlify |

Hell und dunkel folgen automatisch der Einstellung des Handys.
Auf dem iPhone sind die Flächen weichgezeichnetes Glas, auf Android etwas dichter
und ohne Weichzeichner, weil Android das nicht überall gleich gut kann.

## Hinweis

Die Daten aus der Web-Version auf claude.ai werden nicht übernommen. Die App startet
mit „Budget einrichten“.
