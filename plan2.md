# Erweiterungsplan: Bergwetter Tirol v2 (Extensions)

Dieser Plan dokumentiert die recherchierten und geplanten Verbesserungen für die Bergwetter Tirol App.
Alle Punkte sind **Planungs-Entwürfe** – es wurde noch nichts implementiert.

---

## 🔴 Priorität 1: Radar-Upgrade (LibreWXR statt RainViewer)

### Problem
Die kostenlose RainViewer-API liefert seit Januar 2026 keine Prognosedaten (Nowcast) mehr,
ist auf Zoomlevel 7 limitiert und unterstützt nur noch das „Universal Blue"-Farbschema.

### Lösung: Migration auf LibreWXR
**LibreWXR** (https://librewxr.net/) ist ein kostenloser, quelloffener Drop-in-Ersatz für RainViewer.
Die öffentliche Instanz unter `api.librewxr.net` liefert exakt das gleiche JSON-Format (`weather-maps.json`).

**Getestet und verifiziert:** Die API ist erreichbar und liefert:
- ✅ **12 Past-Frames** (letzte 2 Stunden, 10-Minuten-Intervalle)
- ✅ **6 Nowcast-Frames** (60-Minuten-Prognose in die Zukunft!)
- ✅ **13 Farbschemata** (inkl. NEXRAD, TWC, Titan, Viper HD, Dark Sky u.v.m.)
- ✅ **Keine Zoom-Beschränkung** (voller Zoom bis zur Straßenebene möglich)
- ✅ **Satellitenbilder** (Infrarot) als Bonus-Feature

### Geplante Änderungen
| Datei | Änderung |
|---|---|
| `app.js` | API-Endpunkt von `api.rainviewer.com` auf `api.librewxr.net` ändern |
| `app.js` | Nowcast-Frames (`data.radar.nowcast`) in den Radar-Player integrieren |
| `app.js` | Farbschema-Auswahl (Dropdown) einbauen – Nutzer kann zwischen 13 Paletten wählen |
| `app.js` | `maxZoom`-Begrenzung auf der Karte aufheben (aktuell bei 7 limitiert) |
| `styles.css` | Radar-Timeline optisch zweiteilen: Vergangenheit (weiß) | Prognose (blau/pulsierend) |
| `index.html` | Farbschema-Dropdown im Radar-Header hinzufügen |
| `index.html` | Legende aktualisieren und dynamisch an gewähltes Farbschema koppeln |

### Timeline-Visualisierung (Konzept)
```
◀── Vergangenheit (12 Frames) ──┤── Prognose (6 Frames) ──▶
     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░
                               JETZT
```

---

## 🔴 Priorität 1b: Offizielle Unwetterwarnungen (GeoSphere Austria)

### Problem
Die aktuelle App erzeugt Unwetterwarnungen nur durch eigene Schwellenwert-Berechnung
(z.B. Windböen > 70 km/h). Es fehlen **offizielle, regionale Warnungen** der österreichischen
Wetterbehörde, wie sie auch auf https://uwz.at angezeigt werden.

### Lösung: GeoSphere Austria Warn-API (ehemals ZAMG)
Die **GeoSphere Austria Warn-API** ist die offizielle, kostenlose und quellenoffene
Schnittstelle für Unwetterwarnungen in Österreich. Die UWZ (Unwetterzentrale) hat keine
öffentliche API, daher ist GeoSphere die empfohlene und zuverlässige Alternative.

### API-Details (verifiziert und getestet!)

**Endpunkt:** `https://warnungen.zamg.at/wsapp/api/getWarnstatus`
- ✅ **Live getestet** – liefert valides GeoJSON
- ✅ **Kein API-Key nötig** – frei zugänglich
- ✅ **Keine CORS-Einschränkung** – direkt aus dem Browser abrufbar
- ✅ **CC BY 4.0 Lizenz** – kostenlose Nutzung mit Quellenangabe

**Datenstruktur (aus Live-Test):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "MultiPolygon", "coordinates": [...] },
      "properties": {
        "warnid": "...",
        "wtype": 5,          // Warnungstyp (siehe Mapping unten)
        "wlevel": 2,         // Warnstufe 1-3 (gelb/orange/rot)
        "start": 1782770400, // Unix-Timestamp Beginn
        "end": 1782856740,   // Unix-Timestamp Ende
        "gemeinden": [...]   // Liste betroffener Gemeinde-IDs
      }
    }
  ]
}
```

**Warnungstypen (`wtype`):**
| ID | Typ |
|---|---|
| 1 | Sturm / Wind |
| 2 | Regen / Starkregen |
| 3 | Schneefall |
| 4 | Glatteis |
| 5 | Gewitter |
| 6 | Hitze / Kälte |
| 7 | Nebel |

**Warnstufen (`wlevel`):**
| Stufe | Bedeutung | Farbe |
|---|---|---|
| 1 | Wetterwarnung (gelb) | 🟡 `#eab308` |
| 2 | Markante Warnung (orange) | 🟠 `#f97316` |
| 3 | Unwetterwarnung (rot) | 🔴 `#ef4444` |

### Geplante Funktionalität
- **Ersetzt** die bisherige eigene Schwellenwert-Berechnung durch echte offizielle Warnungen
- Filtert die GeoJSON-Features nach **Tiroler Gemeinde-IDs** oder per **Point-in-Polygon**-Prüfung für den aktuellen Standort
- Zeigt die Warnungen im bestehenden `#alerts-section` Panel mit korrektem Typ-Icon, Warnstufen-Farbe und Gültigkeitszeitraum an
- Zusätzlicher **Gewitterwarnung-Endpunkt**: `https://warnungen.zamg.at/wsapp/api/getGewitterAuto` liefert automatisierte Gewitterwarnungen pro Gemeinde
- Quellenangabe im Footer: *„Warnungen: © GeoSphere Austria"*

### Änderungen
| Datei | Änderung |
|---|---|
| `app.js` | Neue Funktion `fetchOfficialWarnings()` – GeoJSON abrufen, nach Standort filtern, in UI rendern |
| `app.js` | Bisherige `updateAlerts()` refactoren: offizielle Warnungen + eigene Schwellenwerte kombinieren |
| `styles.css` | Warnstufen-Farben (gelb/orange/rot) für `.alert-card` über CSS-Klassen steuern |
| `index.html` | Quellenangabe im Footer ergänzen |

---

## 🟠 Priorität 2: Lawinenlagebericht für Tirol

### Datenquelle
Die offizielle **Euregio Lawinenwarnung** (avalanche.report) bietet eine frei zugängliche JSON-API
unter CC BY 4.0 Lizenz im CAAML v6 Standard:

- **Endpunkt (deutsch):** `https://static.avalanche.report/bulletins/latest/EUREGIO_de_CAAMLv6.json`
- **Endpunkt (englisch):** `https://static.avalanche.report/bulletins/latest/EUREGIO_en_CAAMLv6.json`

### Geplante Funktionalität
- Neues Panel **„Lawinenlage Tirol"** in der Sidebar unterhalb des Notruf-Assistenten
- Anzeige der aktuellen **Gefahrenstufe** (1–5 auf der europäischen Skala) mit farblicher Kodierung:
  - 1 Gering (grün), 2 Mäßig (gelb), 3 Erheblich (orange), 4 Groß (rot), 5 Sehr groß (dunkelrot)
- Anzeige der **Hauptgefahrenmuster** (z.B. Triebschnee, Nassschnee, Altschneeproblem)
- Anzeige der **Gültigkeitszeiträume** und der **Höhenstufenangabe**
- Link zum vollständigen Bulletin auf avalanche.report

### Änderungen
| Datei | Änderung |
|---|---|
| `index.html` | Neues `<section>` für Lawinenwarnung in der Sidebar |
| `styles.css` | Styling für Gefahrenstufen-Badges (farbliche 5-Stufen-Skala) |
| `app.js` | Fetch-Logik für die CAAML v6 JSON-API und Parsing der Gefahrenstufe |

---

## 🟡 Priorität 3: Progressive Web App (PWA) – Offline & Installierbar

### Ziel
Die App soll als **installierbare PWA** auf dem Smartphone-Homescreen platziert werden können und
grundlegende Funktionen auch ohne Internetverbindung bereitstellen (wichtig am Berg mit schlechtem Empfang!).

### Geplante Komponenten

#### 1. Web App Manifest (`manifest.json`)
```json
{
  "name": "Bergwetter Tirol",
  "short_name": "Bergwetter",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#1e293b",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### 2. Service Worker (`sw.js`)
- **App-Shell-Caching**: `index.html`, `styles.css`, `app.js` und Bibliotheken (Leaflet, FontAwesome) offline vorhalten
- **Stale-While-Revalidate**: Letzte Wetterdaten aus dem Cache anzeigen, während frische Daten im Hintergrund geladen werden
- **Offline-Fallback**: Anzeige eines „Kein Netz – Letzte Daten von HH:MM"-Banners bei fehlendem Empfang

#### 3. App-Icons
- Generieren von Icons in 192×192 und 512×512 Pixel mit dem Bergwetter-Logo

### Änderungen
| Datei | Änderung |
|---|---|
| `manifest.json` | [NEU] Web App Manifest |
| `sw.js` | [NEU] Service Worker mit Cache-Strategie |
| `index.html` | Manifest-Link und SW-Registration einbinden |
| `icons/` | [NEU] PWA-Icons in 192px und 512px |

---

## 🟢 Priorität 4: Animierte Wetter-Icons (Meteocons)

### Problem
Die aktuellen FontAwesome-Icons sind statisch und wenig ausdrucksstark (z.B. ein einfaches Schneeflocken-Icon
statt einer animierten Schneefall-Darstellung).

### Lösung
Integration der **Meteocons**-Bibliothek (https://bas.dev/work/meteocons) – handgezeichnete,
animierte SVG-Wetter-Icons unter MIT-Lizenz.

### Vorteile
- Animierte Darstellung (z.B. fallende Schneeflocken, ziehende Wolken, Blitze)
- Modernes, abgerundetes Design, das perfekt zum Glassmorphism passt
- Leichtgewichtig (inline SVG, keine zusätzliche Font-Bibliothek nötig)

### Änderungen
| Datei | Änderung |
|---|---|
| `icons/` oder inline | SVG-Dateien der Meteocons einbinden |
| `app.js` | `weatherCodes`-Mapping auf Meteocons-SVGs anstatt FontAwesome-Klassen umstellen |
| `styles.css` | Größenanpassungen und Animationssteuerung für die SVG-Icons |

---

## 🔵 Priorität 5: Weitere Feature-Ideen

### 5.1 Mehrsprachigkeit (DE / EN / IT)
- Tirol grenzt an Südtirol (IT) und wird von internationalen Touristen besucht
- Sprachumschaltung im Header (DE/EN/IT)
- Alle UI-Texte in ein Übersetzungsobjekt auslagern

### 5.2 Sonnenauf-/Sonnenuntergang & Tageslichtdauer
- Prominente Anzeige von Sonnenaufgang, Sonnenuntergang und verbleibender Tageslichtdauer
- Wichtig für die Tourenplanung (Open-Meteo liefert diese Daten bereits)

### 5.3 Webcam-Integration
- Einbettung der nächstgelegenen Bergwebcam(s) über freie Quellen (z.B. foto-webcam.eu)
- Live-Bild der aktuellen Wetterlage für die visuelle Verifizierung der Prognose

### 5.4 Höhenprofil-Diagramm (Chart.js)
- Kleines Diagramm, das den Temperaturverlauf über die Höhenstufen zeigt
- X-Achse: Höhe (500m → 4000m), Y-Achse: Temperatur
- Nutzt die bestehende Lapse-Rate-Berechnung als Datenbasis

### 5.5 Favoriten / Gespeicherte Standorte
- Nutzer kann häufig besuchte Orte und Gipfel als Favoriten speichern (localStorage)
- Schnellzugriff über eine Favoritenleiste im Header

### 5.6 Dark Mode / Light Mode Toggle
- Aktuell ist die App ausschließlich im Dark-Mode
- Ein Toggle für einen hellen Modus wäre für gute Lesbarkeit bei direkter Sonneneinstrahlung am Berg nützlich

---

## Empfohlene Reihenfolge der Umsetzung

| # | Feature | Aufwand | Impact |
|---|---|---|---|
| 1 | 📡 **LibreWXR Radar-Upgrade** (inkl. Nowcast & Farbwahl) | Mittel | ⭐⭐⭐⭐⭐ |
| 2 | ⚠️ **Offizielle Unwetterwarnungen** (GeoSphere Austria Warn-API) | Mittel | ⭐⭐⭐⭐⭐ |
| 3 | 🏔️ **Lawinenlagebericht** (Euregio JSON-API) | Mittel | ⭐⭐⭐⭐⭐ |
| 4 | 📱 **PWA / Offline-Modus** (Service Worker) | Mittel | ⭐⭐⭐⭐ |
| 5 | 🎨 **Animierte Wetter-Icons** (Meteocons) | Gering | ⭐⭐⭐ |
| 6 | 🌅 **Sonnenauf-/untergang + Tageslicht** | Gering | ⭐⭐⭐ |
| 7 | ⭐ **Favoriten-System** (localStorage) | Gering | ⭐⭐⭐ |
| 8 | 🌐 **Mehrsprachigkeit** (DE/EN/IT) | Hoch | ⭐⭐⭐ |
| 9 | 📊 **Höhenprofil-Diagramm** (Chart.js) | Mittel | ⭐⭐ |
| 10 | 📷 **Webcam-Integration** | Mittel | ⭐⭐ |
| 11 | ☀️ **Light Mode Toggle** | Gering | ⭐⭐ |

