/* Globale Objekte, die nicht aus js/ stammen, sondern per <script>-Tag vom CDN
   geladen werden (siehe index.html): Firebase und die QR-Code-Bibliothek.
   Ohne diese Deklarationen meldet die Typpruefung 34-mal "Cannot find name".

   Bewusst als any typisiert. Die compat-Fassung des Firebase-SDK hat eine sehr
   grosse Oberflaeche, und hier wird nur ein schmaler Ausschnitt benutzt:
   initializeApp, database, ref, child, on, off, set, update, remove. Sie
   vollstaendig nachzubilden waere viel Arbeit fuer wenig Gewinn - und eine
   halb richtige Typisierung waere schlechter als gar keine, weil sie
   Sicherheit vortaeuscht, wo keine ist. */
declare const firebase: any;
declare const QRCode: any;

/* Safari nennt die Web-Audio-Schnittstelle bis heute anders. core.js faellt
   darauf zurueck, wenn es AudioContext nicht gibt - das ist kein Fehler,
   sondern der Grund, warum der Ton auch auf aelteren Apple-Geraeten laeuft. */
interface Window {
  webkitAudioContext?: typeof AudioContext;
  /* buzzer.js prueft vor dem Verbinden, ob das CDN-Skript ueberhaupt geladen
     wurde - ohne Netz fehlt es, und die App soll dann trotzdem starten. */
  firebase?: any;
}
