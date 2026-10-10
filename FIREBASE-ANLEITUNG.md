# 🔥 Firebase einrichten (kostenlos) — Schritt für Schritt

Die Firebase-Konsole ist bei dir auf **Englisch** — die Klick-Namen unten sind daher
in Englisch (so wie du sie siehst). Dauer: ca. 5 Minuten. **Keine Kreditkarte nötig** (Spark-Plan).

---

## 1. Projekt anlegen
1. Gehe auf **https://console.firebase.google.com** und melde dich mit einem **Google-Konto** an.
2. Klicke **„Create a project"** (oder **„Add project"**).
3. **Project name** eingeben, z.B. `keller-buzzer` → **Continue**.
4. **„Enable Google Analytics for this project"** → Schalter **AUS** (off) → **Create project**.
5. Warten, bis „Your new project is ready" → **Continue**.

---

## 2. Realtime Database erstellen
1. Linke Seitenleiste: **Build → Realtime Database**.
   (Achtung: **Realtime Database**, NICHT „Firestore Database" — das ist etwas anderes.)
2. Klicke **„Create Database"**.
3. **Realtime Database location** wählen, z.B. `Europe-west1 (Belgium)` → **Next**.
4. Security rules: **„Start in test mode"** auswählen → **Enable**.
5. Fertig — du siehst jetzt oben eine Adresse wie:
   ```
   https://keller-buzzer-default-rtdb.europe-west1.firebasedatabase.app
   ```
   Das ist die **databaseURL** (merken/kopieren).

---

## 3. Regeln dauerhaft setzen (wichtig!)
Der Testmodus („test mode") sperrt nach 30 Tagen automatisch. Die Regeln liegen
deshalb im Repo: `database.rules.json`, eingebunden über `firebase.json`.
Veröffentlicht werden sie per CLI, nicht per Hand in der Konsole:

```bash
npx firebase-tools deploy --only database --project keller-buzzer
```

Sie erlauben nur die Pfade, die die App benutzt (`buzzer`, `design`, `votes`,
`tournament`, `gmremote`), prüfen Typen und Längen und sperren das Löschen
ganzer Zweige. Wer einen neuen Pfad in Firebase einführt, trägt ihn dort ein —
sonst lehnt die Datenbank das Schreiben ab (Fehler `PERMISSION_DENIED`).

> Hinweis: Ohne Firebase Auth können die Regeln Host und Fremde nicht
> unterscheiden. Lesen kann weiterhin jeder mit der Adresse, und in die
> erlaubten Pfade kann jeder schreiben. Die Regeln verhindern Löschen im
> Ganzen, fremde Pfade und falsche Typen, nicht gezieltes Stören.

---

## 4. Web-App hinzufügen & Config holen
1. Oben links auf das **Zahnrad ⚙ → „Project settings"**.
2. Tab **„General"** → runterscrollen zu **„Your apps"**.
3. Auf das **Web-Symbol `</>`** klicken (Tooltip: „Web").
4. **App nickname** eingeben (z.B. `buzzer`) → **„Register app"**.
   (Das Häkchen „Also set up Firebase Hosting" NICHT nötig.)
5. Firebase zeigt dir unter **„Add Firebase SDK"** einen Block wie diesen:
   ```js
   const firebaseConfig = {
     apiKey: "AIzaSy……",
     authDomain: "keller-buzzer.firebaseapp.com",
     databaseURL: "https://keller-buzzer-default-rtdb.europe-west1.firebasedatabase.app",
     projectId: "keller-buzzer",
     storageBucket: "keller-buzzer.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```

---

## 5. Diesen Block an mich schicken
- Kopiere den **kompletten `firebaseConfig`-Block** und schicke ihn mir hier im Chat.
- **Wichtig:** Es muss die Zeile **`databaseURL: "https://…"`** dabei sein.
  Falls sie fehlt, hol sie dir aus **Build → Realtime Database** (die Adresse ganz oben) und schreib sie dazu.

Diese Werte sind **öffentliche Client-Daten** — bei Firebase ist das so vorgesehen, du gibst damit nichts Geheimes preis.

---

## Danach
Sobald du mir den Block gibst, baue ich den Buzzer so ein, dass:
- Handys einfach **`iryogameshows.github.io/buzzer`** öffnen (kein Server, kein WLAN-Zwang),
- die Eck-Anzeige die Reihenfolge + Zeit (2 Nachkommastellen) live zeigt,
- der lokale Node-Server nur noch als Offline-Notlösung bleibt.
