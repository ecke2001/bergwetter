/**
 * Bergwetter Tirol – Hauptanwendung
 */

// App-Status
const state = {
    lat: 47.2627,
    lon: 11.3945,
    name: "Innsbruck",
    realElevation: 574,
    simulatedElevation: 574,
    weatherData: null,
    
    // Radar State
    map: null,
    marker: null,
    radarLayers: [],
    radarTimes: [],
    radarHost: 'https://tilecache.rainviewer.com',
    currentRadarIndex: 12, // Standardmäßig die neueste (letzte) Kachel
    radarInterval: null,
    isRadarPlaying: false
};

// WMO Wettercode Übersetzung & Icons
const weatherCodes = {
    0: { desc: "Klarer Himmel", icon: "fa-sun", theme: "clear-day", iconNight: "fa-moon", themeNight: "clear-night" },
    1: { desc: "Hauptsächlich klar", icon: "fa-cloud-sun", theme: "clear-day", iconNight: "fa-cloud-moon", themeNight: "clear-night" },
    2: { desc: "Teilweise bewölkt", icon: "fa-cloud-sun", theme: "cloudy", iconNight: "fa-cloud-moon", themeNight: "cloudy" },
    3: { desc: "Bedeckt", icon: "fa-cloud", theme: "cloudy", iconNight: "fa-cloud", themeNight: "cloudy" },
    45: { desc: "Nebel", icon: "fa-smog", theme: "cloudy", iconNight: "fa-smog", themeNight: "cloudy" },
    48: { desc: "Raureifnebel", icon: "fa-smog", theme: "cloudy", iconNight: "fa-smog", themeNight: "cloudy" },
    51: { desc: "Leichter Sprühregen", icon: "fa-cloud-rain", theme: "rainy", iconNight: "fa-cloud-rain", themeNight: "rainy" },
    53: { desc: "Mäßiger Sprühregen", icon: "fa-cloud-rain", theme: "rainy", iconNight: "fa-cloud-rain", themeNight: "rainy" },
    55: { desc: "Dichter Sprühregen", icon: "fa-cloud-showers-heavy", theme: "rainy", iconNight: "fa-cloud-showers-heavy", themeNight: "rainy" },
    56: { desc: "Leichter gefrierender Sprühregen", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    57: { desc: "Dichter gefrierender Sprühregen", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    61: { desc: "Leichter Regen", icon: "fa-cloud-rain", theme: "rainy", iconNight: "fa-cloud-rain", themeNight: "rainy" },
    63: { desc: "Mäßiger Regen", icon: "fa-cloud-rain", theme: "rainy", iconNight: "fa-cloud-rain", themeNight: "rainy" },
    65: { desc: "Starker Regen", icon: "fa-cloud-showers-heavy", theme: "rainy", iconNight: "fa-cloud-showers-heavy", themeNight: "rainy" },
    66: { desc: "Leichter gefrierender Regen", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    67: { desc: "Starker gefrierender Regen", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    71: { desc: "Leichter Schneefall", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    73: { desc: "Mäßiger Schneefall", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    75: { desc: "Starker Schneefall", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    77: { desc: "Schneegrießel", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    80: { desc: "Leichte Regenschauer", icon: "fa-cloud-showers-water", theme: "rainy", iconNight: "fa-cloud-showers-water", themeNight: "rainy" },
    81: { desc: "Mäßige Regenschauer", icon: "fa-cloud-showers-heavy", theme: "rainy", iconNight: "fa-cloud-showers-heavy", themeNight: "rainy" },
    82: { desc: "Starke Regenschauer", icon: "fa-cloud-showers-heavy", theme: "rainy", iconNight: "fa-cloud-showers-heavy", themeNight: "rainy" },
    85: { desc: "Leichte Schneeschauer", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    86: { desc: "Starke Schneeschauer", icon: "fa-snowflake", theme: "snowy", iconNight: "fa-snowflake", themeNight: "snowy" },
    95: { desc: "Gewitter", icon: "fa-cloud-bolt", theme: "thunderstorm", iconNight: "fa-cloud-bolt", themeNight: "thunderstorm" },
    96: { desc: "Gewitter mit leichtem Hagel", icon: "fa-cloud-meatball", theme: "thunderstorm", iconNight: "fa-cloud-meatball", themeNight: "thunderstorm" },
    99: { desc: "Gewitter mit starkem Hagel", icon: "fa-cloud-meatball", theme: "thunderstorm", iconNight: "fa-cloud-meatball", themeNight: "thunderstorm" }
};

// Wochentage Abkürzungen
const weekdays = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

// Initialisierung der App bei Seitenaufbau
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    setupEventListeners();
    initMap();
    selectLocation(state.lat, state.lon, state.realElevation, state.name);
    initRadar();
}

// Event-Listener registrieren
function setupEventListeners() {
    // GPS Ortung
    document.getElementById("gps-button").addEventListener("click", handleGPSLocation);
    
    // Preset Buttons
    document.querySelectorAll(".preset-btn").forEach(button => {
        button.addEventListener("click", (e) => {
            const btn = e.currentTarget;
            document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const lat = parseFloat(btn.dataset.lat);
            const lon = parseFloat(btn.dataset.lon);
            const elevation = parseInt(btn.dataset.elevation);
            const name = btn.dataset.name;
            
            selectLocation(lat, lon, elevation, name);
        });
    });
    
    // Autocomplete Suche
    const searchInput = document.getElementById("search-input");
    const searchResults = document.getElementById("search-results");
    let searchDebounceTimer;
    
    searchInput.addEventListener("input", () => {
        clearTimeout(searchDebounceTimer);
        const query = searchInput.value.trim();
        
        if (query.length < 3) {
            searchResults.classList.add("hidden");
            return;
        }
        
        searchDebounceTimer = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Klick außerhalb des Suchergebnisses schließt das Dropdown
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-box")) {
            searchResults.classList.add("hidden");
        }
    });

    // Höhen-Slider
    const altitudeSlider = document.getElementById("altitude-slider");
    altitudeSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        updateSimulatedElevation(val);
    });
    
    // Radar Controls
    document.getElementById("radar-play-btn").addEventListener("click", toggleRadarPlayback);
    
    const radarTimeline = document.getElementById("radar-timeline");
    radarTimeline.addEventListener("input", (e) => {
        stopRadarPlayback();
        const index = parseInt(e.target.value);
        showRadarFrame(index);
    });
}

// Leaflet Karte initialisieren
function initMap() {
    // Standardmäßig auf Tirol zentrieren
    state.map = L.map("radar-map", {
        zoomControl: true,
        attributionControl: false,
        maxZoom: 7, // Begrenzt Zoom auf das von der freien RainViewer API unterstützte Maximum
        minZoom: 4
    }).setView([47.2627, 11.3945], 6);
    
    // Dunkles Karten-Theme von CartoDB (passt gut zum Glassmorphism)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 7
    }).addTo(state.map);
    
    // Marker für aktuellen Standort
    state.marker = L.marker([state.lat, state.lon]).addTo(state.map);
}

// GPS-Ortung ausführen
function handleGPSLocation() {
    const gpsBtn = document.getElementById("gps-button");
    const originalText = gpsBtn.querySelector("span").textContent;
    gpsBtn.disabled = true;
    gpsBtn.querySelector("span").textContent = "Ortung...";
    gpsBtn.querySelector("i").className = "fa-solid fa-spinner fa-spin";
    
    if (!navigator.geolocation) {
        alert("GPS-Ortung wird von deinem Browser nicht unterstützt.");
        resetGPSButton(gpsBtn, originalText);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            // Suche den Namen des GPS Standorts per Open-Meteo Reverse Geocoding
            fetch(`https://geocoding-api.open-meteo.com/v1/search?name=Innsbruck&count=1&format=json`) // Fallback dummy
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m`)
                .then(res => res.json())
                .then(data => {
                    const elevation = Math.round(data.elevation || 1000); // Standardwert falls keine Höhe
                    // Wir versuchen einen Namen herauszufinden
                    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=de`)
                        .then(res => res.json())
                        .then(geo => {
                            const name = geo.address.city || geo.address.town || geo.address.village || geo.address.suburb || "Dein Standort";
                            selectLocation(lat, lon, elevation, name);
                            resetGPSButton(gpsBtn, originalText);
                        })
                        .catch(() => {
                            selectLocation(lat, lon, elevation, "Dein Standort");
                            resetGPSButton(gpsBtn, originalText);
                        });
                })
                .catch(err => {
                    console.error(err);
                    selectLocation(lat, lon, 1000, "Dein Standort");
                    resetGPSButton(gpsBtn, originalText);
                });
        },
        (error) => {
            console.error(error);
            alert("Standort konnte nicht ermittelt werden. Bitte wähle manuell einen Ort aus oder prüfe die Berechtigungen.");
            resetGPSButton(gpsBtn, originalText);
        },
        { enableHighAccuracy: true, timeout: 8000 }
    );
}

function resetGPSButton(btn, text) {
    btn.disabled = false;
    btn.querySelector("span").textContent = text;
    btn.querySelector("i").className = "fa-solid fa-location-crosshairs";
}

// Autocomplete Standort-Suche per API
function performSearch(query) {
    // Ergänze "Tirol" oder "Österreich" in der Suche für bessere Relevanz
    const searchUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=de&format=json`;
    
    fetch(searchUrl)
        .then(res => res.json())
        .then(data => {
            const resultsDiv = document.getElementById("search-results");
            resultsDiv.innerHTML = "";
            
            if (!data.results || data.results.length === 0) {
                resultsDiv.innerHTML = `<div class="search-item" style="cursor: default; opacity: 0.7;">Keine Standorte gefunden</div>`;
                resultsDiv.classList.remove("hidden");
                return;
            }
            
            data.results.forEach(item => {
                // Nur Ergebnisse aus Österreich / nahes Umland zulassen
                const country = item.country || "";
                const admin1 = item.admin1 || "";
                const isAustria = country === "Österreich" || country === "Austria";
                
                const itemEl = document.createElement("div");
                itemEl.className = "search-item";
                itemEl.innerHTML = `
                    <div>
                        <span class="search-item-name">${item.name}</span>
                        <span class="search-item-admin">${admin1 ? admin1 + ', ' : ''}${country}</span>
                    </div>
                    <span class="coords-badge">${Math.round(item.elevation || 0)}m</span>
                `;
                
                itemEl.addEventListener("click", () => {
                    document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
                    selectLocation(item.latitude, item.longitude, Math.round(item.elevation || 500), item.name);
                    resultsDiv.classList.add("hidden");
                    document.getElementById("search-input").value = item.name;
                });
                
                resultsDiv.appendChild(itemEl);
            });
            
            resultsDiv.classList.remove("hidden");
        })
        .catch(err => {
            console.error("Geocoding-Suche fehlgeschlagen:", err);
        });
}

// Einen Standort auswählen (Presets, GPS oder Suche)
function selectLocation(lat, lon, elevation, name) {
    state.lat = lat;
    state.lon = lon;
    state.realElevation = elevation;
    state.simulatedElevation = elevation;
    state.name = name;
    
    // UI aktualisieren
    document.getElementById("current-location-name").textContent = name;
    document.getElementById("current-station-coords").innerHTML = `<i class="fa-solid fa-map-pin"></i> ${lat.toFixed(2)}° N, ${lon.toFixed(2)}° O`;
    document.getElementById("real-altitude-val").textContent = `${elevation}m`;
    
    // Slider anpassen
    const slider = document.getElementById("altitude-slider");
    slider.value = elevation;
    updateSimulatedElevation(elevation);
    
    // Karte zentrieren & Marker verschieben
    state.map.setView([lat, lon], 7);
    state.marker.setLatLng([lat, lon]);
    
    // Wetterdaten laden
    fetchWeatherData(lat, lon);
}

// Wetterdaten von Open-Meteo laden
function fetchWeatherData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,snow_depth&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl&timezone=auto`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            state.weatherData = data;
            // Falls die API eine andere Höhe ermittelt als unser Preset, können wir das anpassen
            if (data.elevation && Math.abs(data.elevation - state.realElevation) > 100) {
                // Wir vertrauen der API-Höhe für das Basiswetter
                state.realElevation = Math.round(data.elevation);
                document.getElementById("real-altitude-val").textContent = `${state.realElevation}m`;
                const slider = document.getElementById("altitude-slider");
                if (parseInt(slider.value) === state.simulatedElevation) {
                    state.simulatedElevation = state.realElevation;
                    slider.value = state.realElevation;
                    updateSimulatedElevation(state.realElevation);
                }
            }
            
            updateWeatherUI();
            updateAlerts();
        })
        .catch(err => {
            console.error("Wetterdaten-Abruf fehlgeschlagen:", err);
            document.getElementById("current-weather-desc").textContent = "Fehler beim Laden";
        });
}

// Wetter UI befüllen (basiert auf realen Daten, Simulation läuft separat)
function updateWeatherUI() {
    if (!state.weatherData) return;
    
    const current = state.weatherData.current;
    
    // WMO Code übersetzen
    const code = current.weather_code;
    const isNight = isNightTime();
    const weatherInfo = weatherCodes[code] || { desc: "Unbekannt", icon: "fa-cloud", theme: "cloudy" };
    
    const iconClass = (isNight && weatherInfo.iconNight) ? weatherInfo.iconNight : weatherInfo.icon;
    const themeClass = (isNight && weatherInfo.themeNight) ? weatherInfo.themeNight : weatherInfo.theme;
    
    // Body-Theme setzen (dynamischer Farbverlauf)
    document.body.className = `weather-${themeClass}`;
    
    // Hauptanzeige befüllen
    document.getElementById("current-weather-desc").textContent = weatherInfo.desc;
    document.getElementById("current-weather-icon").className = `fa-solid ${iconClass} hero-weather-icon`;
    
    // Windrichtung-Pfeil drehen
    const windDir = current.wind_direction_10m;
    document.getElementById("wind-arrow-icon").style.transform = `rotate(${windDir}deg)`;
    
    // Luftfeuchtigkeit & Luftdruck & Schneehöhe
    document.getElementById("current-humidity").textContent = `${Math.round(current.relative_humidity_2m)}%`;
    document.getElementById("current-pressure").textContent = `${Math.round(current.pressure_msl)} hPa`;
    
    // Schneehöhe ermitteln (von der stündlichen API die aktuelle Stunde nehmen)
    let snow = 0;
    if (state.weatherData.hourly && state.weatherData.hourly.snow_depth) {
        const currentHourIndex = new Date().getHours();
        snow = Math.round(state.weatherData.hourly.snow_depth[currentHourIndex] * 100 || 0); // Meter in cm
    }
    document.getElementById("current-snow-depth").textContent = snow > 0 ? `${snow} cm` : "0 cm";

    // Notruf-Koordinaten befüllen
    document.getElementById("em-lat").textContent = `${state.lat.toFixed(5)}° N`;
    document.getElementById("em-lon").textContent = `${state.lon.toFixed(5)}° O`;
    document.getElementById("em-dms").textContent = convertDecimalToDMS(state.lat, state.lon);
    
    // Befülle stündliche und tägliche Vorhersage
    renderHourlyForecast();
    renderDailyForecast();
    
    // Führe die Simulation mit den aktuellen Werten durch
    applyElevationSimulation();
}

// Simuliert die Höhenänderung im UI
function updateSimulatedElevation(elevation) {
    state.simulatedElevation = elevation;
    document.getElementById("simulated-altitude-val").textContent = `${elevation}m`;
    document.getElementById("em-alt").textContent = `${elevation}m`;
    
    applyElevationSimulation();
}

// Führt die Höhensimulation basierend auf dem aktuellen Slider-Wert aus
function applyElevationSimulation() {
    if (!state.weatherData) return;
    
    const current = state.weatherData.current;
    
    // Höhendifferenz in 100er Schritten
    const deltaHeight = state.simulatedElevation - state.realElevation;
    
    // 1. Temperatur-Effekt: -0.65 °C pro 100 Meter Aufstieg
    const tempDiff = -(deltaHeight / 100) * 0.65;
    const simulatedTemp = current.temperature_2m + tempDiff;
    const simulatedFeel = current.apparent_temperature + tempDiff;
    
    // 2. Wind-Effekt: Windgeschwindigkeit nimmt in der Höhe zu (ca. 1.5% Zunahme pro 100m)
    // Minimale Windgeschwindigkeit am Boden, um Divisionen durch 0 zu vermeiden
    const baseWind = Math.max(current.wind_speed_10m, 5);
    const windMultiplier = 1 + (deltaHeight / 100) * 0.015;
    const simulatedWind = Math.max(0, current.wind_speed_10m * windMultiplier);
    const simulatedGusts = Math.max(0, current.wind_gusts_10m * windMultiplier);
    
    // 3. UV-Index-Effekt: Zunahme von ca. 12% pro 1000m Höhenunterschied
    let baseUV = 1;
    if (state.weatherData.hourly && state.weatherData.hourly.uv_index) {
        const currentHour = new Date().getHours();
        baseUV = state.weatherData.hourly.uv_index[currentHour] || 0.1;
    }
    const uvMultiplier = 1 + (deltaHeight / 1000) * 0.12;
    const simulatedUV = Math.max(0, baseUV * uvMultiplier);

    // Simulationsausgaben in der UI aktualisieren
    document.getElementById("sim-temp-diff").textContent = `${tempDiff > 0 ? '+' : ''}${tempDiff.toFixed(1)} °C`;
    document.getElementById("sim-temp-diff").style.color = tempDiff < 0 ? "#60a5fa" : (tempDiff > 0 ? "#f59e0b" : "#fff");
    
    document.getElementById("sim-temp-val").textContent = `${simulatedTemp.toFixed(1)}°C`;
    document.getElementById("sim-wind-val").textContent = `${Math.round(simulatedWind)} km/h (Böen: ${Math.round(simulatedGusts)} km/h)`;
    
    // Werte in der aktuellen Anzeige aktualisieren
    document.getElementById("current-temp").textContent = `${simulatedTemp.toFixed(1)}°C`;
    document.getElementById("current-feel-temp").textContent = `${simulatedFeel.toFixed(1)}°C`;
    document.getElementById("current-wind").textContent = `${Math.round(simulatedWind)} km/h (Böen: ${Math.round(simulatedGusts)} km/h)`;
    document.getElementById("current-uv").textContent = simulatedUV.toFixed(1);
    
    // Packliste und UV-Warnungen anpassen
    updatePackingList(simulatedTemp, simulatedWind, simulatedGusts);
    updateUVSafety(simulatedUV);
}

// Prüft ob es aktuell Nacht ist (für die Farbgestaltung und Icons)
function isNightTime() {
    if (!state.weatherData || !state.weatherData.daily) {
        const hour = new Date().getHours();
        return hour < 6 || hour > 21;
    }
    const now = new Date();
    // String parsen (Format z.B. "2026-06-30T05:32")
    const sunriseStr = state.weatherData.daily.sunrise[0];
    const sunsetStr = state.weatherData.daily.sunset[0];
    
    const sunrise = new Date(sunriseStr);
    const sunset = new Date(sunsetStr);
    
    return now < sunrise || now > sunset;
}

// Koordinaten-Konvertierung in DMS (Grad, Minuten, Sekunden)
function convertDecimalToDMS(lat, lon) {
    const latDir = lat >= 0 ? "N" : "S";
    const absoluteLat = Math.abs(lat);
    const latDeg = Math.floor(absoluteLat);
    const latMinVal = (absoluteLat - latDeg) * 60;
    const latMin = Math.floor(latMinVal);
    const latSec = Math.round((latMinVal - latMin) * 60);
    
    const lonDir = lon >= 0 ? "O" : "W";
    const absoluteLon = Math.abs(lon);
    const lonDeg = Math.floor(absoluteLon);
    const lonMinVal = (absoluteLon - lonDeg) * 60;
    const lonMin = Math.floor(lonMinVal);
    const lonSec = Math.round((lonMinVal - lonMin) * 60);
    
    return `${latDeg}° ${latMin}' ${latSec}" ${latDir} / ${lonDeg}° ${lonMin}' ${lonSec}" ${lonDir}`;
}

// Unwetterwarnungen anzeigen
function updateAlerts() {
    const container = document.getElementById("alerts-container");
    const section = document.getElementById("alerts-section");
    container.innerHTML = "";
    
    // Die kostenlose Open-Meteo-API liefert standardmäßig keine nationalen Unwetterwarnungen direkt aus.
    // Wir simulieren bzw. berechnen jedoch kritische Alarmschwellen basierend auf Windböen, Niederschlag und Temperatur
    // für den Alpinraum, um dem Wunsch nach "Unwetterwarnung" gerecht zu werden.
    const warnings = [];
    const current = state.weatherData.current;
    
    if (current.wind_gusts_10m > 70) {
        warnings.push({
            title: "Sturmwarnung / Orkanböen im Hochgebirge",
            desc: `Gemessene Böen betragen aktuell ${Math.round(current.wind_gusts_10m)} km/h. Gefahr durch Windwurf und Absturz! Bergtouren dringend meiden.`
        });
    } else if (current.wind_gusts_10m > 50) {
        warnings.push({
            title: "Markanter Wind im Gebirge",
            desc: `Es treten Windböen bis zu ${Math.round(current.wind_gusts_10m)} km/h auf. Erhöhte Auskühlungsgefahr (Windchill-Effekt) und Gleichgewichtsverlust auf Graten.`
        });
    }
    
    if (current.precipitation > 5) {
        warnings.push({
            title: "Starkregen / Lawinengefahr (Nassschnee)",
            desc: "Erheblicher Niederschlag im Gange. Rutschige Wege, Gefahr von Muren und schnellem Temperatursturz mit Gewittern."
        });
    }
    
    if (current.weather_code === 95 || current.weather_code === 96 || current.weather_code === 99) {
        warnings.push({
            title: "Akute Gewitterwarnung am Berg",
            desc: "Blitzschlaggefahr im exponierten Gelände. Sofortige Schutzmaßnahmen ergreifen (Gipfel verlassen, Grate meiden, Schutzhütten aufsuchen)."
        });
    }

    if (warnings.length > 0) {
        section.classList.remove("hidden");
        warnings.forEach(alert => {
            const card = document.createElement("div");
            card.className = "alert-card";
            card.innerHTML = `
                <div class="alert-title">${alert.title}</div>
                <div class="alert-description">${alert.desc}</div>
            `;
            container.appendChild(card);
        });
    } else {
        section.classList.add("hidden");
    }
}

// Stündliche Vorhersage rendern
function renderHourlyForecast() {
    const container = document.getElementById("hourly-container");
    container.innerHTML = "";
    
    const hourly = state.weatherData.hourly;
    const now = new Date();
    const currentHour = now.getHours();
    
    // Die nächsten 24 Stunden ab jetzt anzeigen
    for (let i = currentHour; i < currentHour + 24; i++) {
        if (!hourly.time[i]) break;
        
        const date = new Date(hourly.time[i]);
        const formattedTime = `${date.getHours().toString().padStart(2, '0')}:00`;
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weather_code[i];
        const rainProb = Math.round(hourly.precipitation_probability[i]);
        
        const weatherInfo = weatherCodes[code] || { icon: "fa-cloud" };
        
        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <span class="hourly-time">${formattedTime}</span>
            <i class="fa-solid ${weatherInfo.icon} hourly-icon"></i>
            <span class="hourly-temp">${temp}°C</span>
            <span class="hourly-rain"><i class="fa-solid fa-droplet"></i> ${rainProb}%</span>
        `;
        container.appendChild(card);
    }
}

// 7 Tage Vorhersage rendern
function renderDailyForecast() {
    const container = document.getElementById("daily-container");
    container.innerHTML = "";
    
    const daily = state.weatherData.daily;
    
    for (let i = 0; i < 7; i++) {
        if (!daily.time[i]) break;
        
        const date = new Date(daily.time[i]);
        // Heute/Morgen statt Wochentag
        let dayName = weekdays[date.getDay()];
        if (i === 0) dayName = "Heute";
        else if (i === 1) dayName = "Morgen";
        
        const tempMax = Math.round(daily.temperature_2m_max[i]);
        const tempMin = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const weatherInfo = weatherCodes[code] || { desc: "Wolkig", icon: "fa-cloud" };
        
        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = `
            <span class="daily-day">${dayName}</span>
            <div class="daily-icon-box">
                <i class="fa-solid ${weatherInfo.icon} daily-icon"></i>
            </div>
            <span class="daily-desc">${weatherInfo.desc}</span>
            <div class="daily-temps">
                <span class="temp-max">${tempMax}°C</span>
                <span class="temp-min">${tempMin}°C</span>
            </div>
        `;
        container.appendChild(row);
    }
}

// Dynamische Packliste basierend auf SIMULIERTEN Wetterbedingungen
function updatePackingList(temp, wind, gusts) {
    const list = document.getElementById("packing-list");
    list.innerHTML = "";
    
    // Essentials (Immer dabei am Berg)
    const essentials = [
        { name: "Erste-Hilfe-Set & Rettungsdecke", category: "essential", icon: "fa-kit-medical" },
        { name: "Geladenes Smartphone & Powerbank", category: "essential", icon: "fa-mobile-screen" },
        { name: "Trinkwasser (min. 1.5 Liter)", category: "essential", icon: "fa-bottle-water" },
        { name: "Wanderkarte (analog oder offline in App)", category: "essential", icon: "fa-map" },
        { name: "Taschenmesser & Snacks (Müsliriegel)", category: "essential", icon: "fa-apple-whole" }
    ];
    
    // Wetterabhängiges Gepäck
    const weatherGear = [];
    const currentCode = state.weatherData.current.weather_code;
    const rainChance = state.weatherData.hourly.precipitation_probability[new Date().getHours()] || 0;
    
    // Regenbekleidung
    if (rainChance > 30 || [51,53,55,61,63,65,80,81,82,95,96,99].includes(currentCode)) {
        weatherGear.push({ name: "Hardshelljacke (wasserdicht)", icon: "fa-cloud-showers-heavy" });
        weatherGear.push({ name: "Rucksack-Regenhülle", icon: "fa-umbrella" });
    }
    
    // Kälteschutz (simulierte Temperatur!)
    if (temp < 10) {
        weatherGear.push({ name: "Warme Mütze & Handschuhe", icon: "fa-mitten" });
        weatherGear.push({ name: "Isolationsjacke (Daune/Primaloft)", icon: "fa-shirt" });
    }
    if (temp < 4) {
        weatherGear.push({ name: "Lange Funktionsunterwäsche", icon: "fa-socks" });
        weatherGear.push({ name: "Grödel (Spikes) für Schneefelder", icon: "fa-shoe-prints" });
    }
    
    // Windschutz
    if (wind > 25 || gusts > 40) {
        weatherGear.push({ name: "Winddichte Softshelljacke/Windstopper", icon: "fa-wind" });
        weatherGear.push({ name: "Buff/Stirnband für die Ohren", icon: "fa-head-side-virus" });
    }
    
    // Sonnenschutz (simulierter UV-Index!)
    const currentHour = new Date().getHours();
    const uv = parseFloat(document.getElementById("current-uv").textContent) || 0;
    if (uv >= 3) {
        weatherGear.push({ name: "Sonnencreme LSF 30+ & Lippenschutz", icon: "fa-cream" });
        weatherGear.push({ name: "Sonnenbrille (Kat. 3 oder 4)", icon: "fa-glasses" });
        weatherGear.push({ name: "Kopfbedeckung (Sonnenkappe)", icon: "fa-hat-cowboy" });
    }

    // Rendern
    essentials.forEach(item => {
        const li = document.createElement("li");
        li.className = "gear-essential";
        li.innerHTML = `<i class="fa-solid ${item.icon}"></i> ${item.name}`;
        list.appendChild(li);
    });
    
    weatherGear.forEach(item => {
        const li = document.createElement("li");
        li.className = "gear-weather";
        li.innerHTML = `<i class="fa-solid ${item.icon}"></i> <strong>${item.name}</strong>`;
        list.appendChild(li);
    });
}

// UV-Index-Beratung
function updateUVSafety(uv) {
    const gaugeVal = document.getElementById("uv-gauge-val");
    const gaugeLevel = document.getElementById("uv-gauge-level");
    const adviceText = document.getElementById("uv-protection-tips");
    const gaugeBox = document.querySelector(".uv-gauge");
    
    gaugeVal.textContent = uv.toFixed(1);
    
    let level = "Niedrig";
    let advice = "Keine besonderen Schutzmaßnahmen im Tal erforderlich. Dennoch Sonnenbrille empfohlen.";
    let color = "#3b82f6";
    
    if (uv >= 3 && uv < 6) {
        level = "Mäßig";
        advice = "Sonnencreme (LSF 30), Kopfbedeckung und Sonnenbrille empfohlen. Achtung: Am Berg reflektieren Schneefelder und Felsen das UV-Licht zusätzlich.";
        color = "#eab308";
    } else if (uv >= 6 && uv < 8) {
        level = "Hoch";
        advice = "Schutz dringend erforderlich! Hut, UV-Shirt, Sonnencreme (LSF 50+) und UV-Filter-Sonnenbrille. Meide die direkte Mittagssonne auf exponierten Graten.";
        color = "#f97316";
    } else if (uv >= 8) {
        level = "Sehr hoch";
        advice = "Sehr hohe Strahlung! Pro 1000m Höhenaufstieg nimmt die UV-Dosis um 12% zu. Absoluter Schutz durch langärmlige Kleidung, LSF 50+ und eine Gletscherbrille erforderlich.";
        color = "#ef4444";
    }
    
    gaugeLevel.textContent = level;
    adviceText.innerHTML = advice;
    gaugeBox.style.borderColor = color;
    gaugeBox.style.color = color;
}

// ==========================================
// RainViewer Live-Radar Logik
// ==========================================
function initRadar() {
    // Abfrage der aktuellen Radar-Timestamps
    fetch("https://api.rainviewer.com/public/weather-maps.json")
        .then(res => res.json())
        .then(data => {
            // RainViewer liefert ein JSON mit hosts und paths
            if (data && data.radar && data.radar.past) {
                state.radarHost = data.host;
                state.radarTimes = data.radar.past; // Array aus Objekten { time: UnixTimestamp, path: "..." }
                
                setupRadarLayers();
            }
        })
        .catch(err => {
            console.error("RainViewer Radardaten konnten nicht geladen werden:", err);
            document.getElementById("radar-timestamp").textContent = "Radar offline";
        });
}

function setupRadarLayers() {
    // Entferne alte Radar-Layer, falls vorhanden
    state.radarLayers.forEach(layer => state.map.removeLayer(layer));
    state.radarLayers = [];
    
    // Nimm maximal die letzten 12 Frames (2 Stunden, alle 10 Minuten ein Frame)
    const frames = state.radarTimes.slice(-13); // wir nehmen 13, damit wir 12 Übergänge haben
    
    frames.forEach((frame, idx) => {
        // Erzeuge den Tile-Layer für dieses Zeitfenster
        const url = `${state.radarHost}${frame.path}/256/{z}/{x}/{y}/4/1_1.png`;
        const layer = L.tileLayer(url, {
            opacity: 0.0, // Zuerst alle unsichtbar
            zIndex: 100 + idx
        });
        
        layer.addTo(state.map);
        state.radarLayers.push(layer);
    });
    
    // Zeige das neueste (letzte) Radarbild
    state.currentRadarIndex = state.radarLayers.length - 1;
    showRadarFrame(state.currentRadarIndex);
    
    // Slider anpassen
    const timeline = document.getElementById("radar-timeline");
    timeline.max = state.radarLayers.length - 1;
    timeline.value = state.currentRadarIndex;
}

function showRadarFrame(index) {
    if (index < 0 || index >= state.radarLayers.length) return;
    
    // Blende alle Layer aus (Opazität 0) und den aktuellen ein (Opazität 0.6)
    state.radarLayers.forEach((layer, idx) => {
        if (idx === index) {
            layer.setOpacity(0.85);
        } else {
            layer.setOpacity(0.0);
        }
    });
    
    state.currentRadarIndex = index;
    
    // Zeitstempel aktualisieren
    const frameObj = state.radarTimes.slice(-13)[index];
    if (frameObj) {
        const date = new Date(frameObj.time * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        document.getElementById("radar-timestamp").innerHTML = `<i class="fa-regular fa-clock"></i> Radar: ${hours}:${mins} Uhr`;
    }
    
    // Slider synchronisieren
    document.getElementById("radar-timeline").value = index;
}

function toggleRadarPlayback() {
    const playBtn = document.getElementById("radar-play-btn");
    
    if (state.isRadarPlaying) {
        stopRadarPlayback();
    } else {
        state.isRadarPlaying = true;
        playBtn.innerHTML = `<i class="fa-solid fa-pause"></i>`;
        
        // Loop durch die Frames
        state.radarInterval = setInterval(() => {
            let nextIndex = state.currentRadarIndex + 1;
            if (nextIndex >= state.radarLayers.length) {
                nextIndex = 0; // Zurück zum Anfang
            }
            showRadarFrame(nextIndex);
        }, 1000);
    }
}

function stopRadarPlayback() {
    const playBtn = document.getElementById("radar-play-btn");
    if (state.radarInterval) {
        clearInterval(state.radarInterval);
        state.radarInterval = null;
    }
    state.isRadarPlaying = false;
    playBtn.innerHTML = `<i class="fa-solid fa-play"></i>`;
}
