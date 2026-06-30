---
title: Bergwetter Tirol
emoji: 🏔️
colorFrom: blue
colorTo: indigo
sdk: static
pinned: false
---

# Bergwetter Tirol – Dein alpiner Wetterbegleiter

Eine moderne, voll-responsive Web-App für Bergsteiger, Wanderer und Outdoor-Enthusiasten in Tirol. Entwickelt mit Fokus auf Performance, alpiner Sicherheit und reichhaltiger Ästhetik (Dark Glassmorphism).

## 🏔️ Features

* **GPS-Ortung & Standortsuche**: Ermittelt deine aktuelle Position über den Browser oder sucht beliebige Orte und Gipfel in Tirol über die Open-Meteo Geocoding API.
* **Schnellwahl**: Schneller Zugriff auf Wetterdaten bekannter Gipfel und Städte (Innsbruck, Zugspitze, Wildspitze, Patscherkofel, Olperer, Großglockner, Kitzbühel, St. Anton).
* **Höhen-Wetter-Simulator**: Schiebe den Regler, um den Temperaturabfall (\(-0.65^\circ\text{C}\) pro 100m) und den Windzuwachs auf Gipfelhöhe im Vergleich zum Tal live zu simulieren.
* **Live-Niederschlagsradar**: Interaktive Leaflet.js-Karte mit der RainViewer API, die Niederschläge der letzten 2 Stunden in 10-Minuten-Schritten animiert.
* **Alpiner Notruf-Assistent**: Zeigt deine aktuellen GPS-Koordinaten in WGS84 sowie im DMS-Format (Grad, Minuten, Sekunden) für Rettungskräfte an, enthält direkte Notruf-Links (Bergrettung 140, Euro-Notruf 112) und erklärt das alpine Notsignal.
* **Dynamische Packliste**: Generiert automatisch eine Liste mit unverzichtbarer alpiner Ausrüstung sowie wetterabhängiger Zusatzkleidung (Kälte-, Regen-, Wind- oder Sonnenschutz) basierend auf dem simulierten Bergwetter.
* **UV- & Strahlungsratgeber**: Berechnet die UV-Belastung (die in der Höhe um ca. 12% pro 1000m zunimmt) und gibt Verhaltensempfehlungen zum Sonnenschutz.
* **Wetter-Prognosen**: 24-Stunden-Detailverlauf und 7-Tage-Prognose mit Min/Max-Temperaturen und Niederschlagswahrscheinlichkeiten.

## 📡 APIs & Datenquellen

* **Wetterdaten**: [Open-Meteo Forecast API](https://open-meteo.com/) (kostenfrei, ohne Key, mit digitalem Höhenmodell).
* **Standortsuche**: [Open-Meteo Geocoding API](https://open-meteo.com/).
* **Radarbilder**: [RainViewer API](https://www.rainviewer.com/api.html).
* **Kartenmaterial**: [CartoDB Dark Matter](https://carto.com/) und [OpenStreetMap](https://www.openstreetmap.org/).

## 🛠️ Technische Details

* **Technologie**: Pures HTML5, CSS3 (Vanilla mit Custom Properties und CSS Grid/Flexbox) und JavaScript (ES6, modulfrei).
* **Frameworks**: Keine Frameworks – für maximale Ladezeit-Optimierung direkt im Browser.
* **Bibliotheken**: [Leaflet.js](https://leafletjs.com/) (Karten-Rendering).
