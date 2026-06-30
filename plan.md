# Projektplan: Bergwetter Tirol Web App

Dieses Dokument beschreibt den Plan für die Entwicklung und Veröffentlichung der Bergwetter Tirol Web App.

## 1. Ziele & Anforderungen
Die App soll eine modern gestaltete, responsive Webanwendung für Bergsteiger, Wanderer und Outdoor-Enthusiasten in Tirol sein.

- **Ortung & GPS**: Abfrage der aktuellen GPS-Position und manuelle Suche nach Orten und Gipfeln in Tirol.
- **Präzise Wetterdaten**: Integration der Open-Meteo API für Live-Wetter, stündliche und 7-Tage-Vorhersagen sowie Unwetterwarnungen.
- **Höhenanpassung**: Simulation der Temperatur- und Windänderung auf verschiedenen Höhenstufen mittels Slider.
- **Wetterradar**: Interaktives Live-Radar auf Leaflet.js-Basis mit RainViewer-Kacheln.
- **Zusatzfeatures**:
  - **Alpiner Notruf-Assistent**: Anzeige der aktuellen GPS-Koordinaten in rettungsdiensttauglichem Format sowie Alpin-Notrufnummern.
  - **Dynamische Packliste**: Generierung einer Packliste basierend auf Wetterkonditionen.
  - **UV-Schutz-Ratgeber**: Tipps zum UV-Schutz in Höhenlagen.
- **Hosting**: Veröffentlichung der App über GitHub Pages und optional über Hugging Face Spaces.

## 2. Technische Architektur
Da die App schnell, wartungsarm und einfach auf GitHub Pages und Hugging Face Spaces hostbar sein soll, setzen wir auf eine reine **Client-Side-Anwendung (HTML/CSS/JS)** ohne Backend-Server:
- **HTML5**: Semantische Struktur.
- **Vanilla CSS (CSS3)**: Custom Properties (CSS-Variablen), Flexbox, Grid und Glassmorphism-Effekte.
- **Vanilla JavaScript (ES6)**: Modulfreie Anwendungslogik, Fetch-API für Datenabfragen, Leaflet.js für Kartendarstellung.
- **GitHub Actions**: Automatisches Deployment auf GitHub Pages.
- **Hugging Face Static Space**: Direktes Hosting über Git-Anbindung und eine konfigurierte README.md.

## 3. Datei-Struktur
```text
bergwetter/
├── .github/
│   └── workflows/
│       └── static.yml       # GitHub Actions Deployment-Skript
├── index.html               # Hauptseite & HTML-Layout
├── styles.css               # Modernes Glassmorphism-Styling
├── app.js                   # Wetterdaten, Kartenlogik, Zusatzfeatures
├── README.md                # Dokumentation & Hugging Face Metadaten
├── plan.md                  # Dieser Entwicklungsplan
└── LICENSE                  # Lizenzdatei (bereits vorhanden)
```

## 4. Ablauf & Freigaben
1. **Entwicklung**: Lokale Erstellung und Verifikation der Web-App-Dateien (`index.html`, `styles.css`, `app.js`).
2. **Freigabe-Rückfrage**: Bevor Änderungen per Git in das GitHub-Repository oder Hugging Face Spaces übertragen und veröffentlicht werden, fragen wir den Benutzer explizit um Erlaubnis.
3. **Push & Deployment**: Nach Zustimmung erfolgt der Push auf GitHub (`main`) und Hugging Face Spaces.
