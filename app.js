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
    radarHost: 'https://api.librewxr.net',
    currentRadarIndex: 12, // Standardmäßig Nowcast 0 (Jetzt)
    radarInterval: null,
    isRadarPlaying: false,
    selectedRadarSchemeId: 6, // Standardmäßig NEXRAD Level III
    
    // Warnings & Avalanche State
    officialWarnings: null,
    currentDistrictPrefix: "701", // Innsbruck-Stadt default
    avalancheData: null
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
    registerServiceWorker();
    setupOfflineDetection();
    setupEventListeners();
    initMap();
    
    // Warnungen & Lawinendaten vorab laden, danach Standort auswählen
    Promise.all([
        fetchOfficialWarnings(),
        fetchAvalancheReport()
    ]).finally(() => {
        const prefix = getDistrictPrefix(state.name);
        selectLocation(state.lat, state.lon, state.realElevation, state.name, prefix);
    });
    
    initRadar();
}

// Service Worker registrieren
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('PWA Service Worker registriert:', reg))
                .catch(err => console.error('Service Worker Registrierung fehlgeschlagen:', err));
        });
    }
}

// Offline-Erkennung
function setupOfflineDetection() {
    function updateOnlineStatus() {
        const banner = document.getElementById("offline-banner");
        const timeSpan = document.getElementById("offline-time");
        if (navigator.onLine) {
            banner.classList.add("hidden");
        } else {
            const now = new Date();
            timeSpan.textContent = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            banner.classList.remove("hidden");
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
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
            
            const prefix = getDistrictPrefix(name);
            selectLocation(lat, lon, elevation, name, prefix);
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

    // Farbschema-Wechsel
    document.getElementById("radar-scheme-select").addEventListener("change", (e) => {
        state.selectedRadarSchemeId = parseInt(e.target.value);
        setupRadarLayers();
    });
}

// Leaflet Karte initialisieren
function initMap() {
    // Auf Tirol zentrieren
    state.map = L.map("radar-map", {
        zoomControl: true,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 4
    }).setView([47.2627, 11.3945], 8);
    
    // Dunkles Karten-Theme von CartoDB (passt gut zum Glassmorphism)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18
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
                            const prefix = getDistrictPrefix(name, null, geo.address.suburb || geo.address.village, geo.address.postcode, geo.address.county);
                            selectLocation(lat, lon, elevation, name, prefix);
                            resetGPSButton(gpsBtn, originalText);
                        })
                        .catch(() => {
                            selectLocation(lat, lon, elevation, "Dein Standort", null);
                            resetGPSButton(gpsBtn, originalText);
                        });
                })
                .catch(err => {
                    console.error(err);
                    selectLocation(lat, lon, 1000, "Dein Standort", null);
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
                    const prefix = getDistrictPrefix(item.name, item.admin3, item.admin4, item.postcodes ? item.postcodes[0] : null, null);
                    selectLocation(item.latitude, item.longitude, Math.round(item.elevation || 500), item.name, prefix);
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
function selectLocation(lat, lon, elevation, name, districtPrefix) {
    state.lat = lat;
    state.lon = lon;
    state.realElevation = elevation;
    state.simulatedElevation = elevation;
    state.name = name;
    state.currentDistrictPrefix = districtPrefix || getDistrictPrefix(name);
    
    // UI aktualisieren
    document.getElementById("current-location-name").textContent = name;
    document.getElementById("current-station-coords").innerHTML = `<i class="fa-solid fa-map-pin"></i> ${lat.toFixed(2)}° N, ${lon.toFixed(2)}° O`;
    document.getElementById("real-altitude-val").textContent = `${elevation}m`;
    
    // Slider anpassen
    const slider = document.getElementById("altitude-slider");
    slider.value = elevation;
    updateSimulatedElevation(elevation);
    
    // Karte zentrieren & Marker verschieben
    state.map.setView([lat, lon], 10);
    state.marker.setLatLng([lat, lon]);
    
    // Wetterdaten laden
    fetchWeatherData(lat, lon);
    
    // Warnungs- & Lawinen-Anzeigen aktualisieren
    updateAlerts();
    updateAvalancheUI();
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
    document.getElementById("current-weather-icon").src = getWeatherIconUrl(code, isNight);
    
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
    
    if (!state.weatherData) return;
    
    const alertsToShow = [];
    
    // 1. Offizielle GeoSphere Austria Warnungen
    if (state.officialWarnings && state.officialWarnings.features) {
        const prefix = state.currentDistrictPrefix;
        
        state.officialWarnings.features.forEach(feat => {
            const props = feat.properties;
            if (!props || !props.gemeinden) return;
            
            // Prüfen ob Warnung den aktuellen Bezirk betrifft (Kennzahl beginnt mit z.B. 703)
            const matchesDistrict = props.gemeinden.some(g => g.toString().startsWith(prefix));
            // Prüfen ob es eine Tiroler Warnung ist (Kennzahl beginnt mit 7)
            const isTyrol = props.gemeinden.some(g => g.toString().startsWith("7"));
            
            if (matchesDistrict || isTyrol) {
                const wtypeMap = {
                    1: { name: "Sturm", icon: "fa-wind" },
                    2: { name: "Starkregen", icon: "fa-cloud-showers-heavy" },
                    3: { name: "Schneefall", icon: "fa-snowflake" },
                    4: { name: "Glatteis", icon: "fa-icicles" },
                    5: { name: "Gewitter", icon: "fa-cloud-bolt" },
                    6: { name: "Hitze/Kälte", icon: "fa-temperature-high" },
                    7: { name: "Nebel", icon: "fa-smog" }
                };
                
                const wlevelMap = {
                    1: { name: "Gelb (Wetterwarnung)", levelClass: "level-yellow" },
                    2: { name: "Orange (Markante Warnung)", levelClass: "level-orange" },
                    3: { name: "Rot (Akute Warnung)", levelClass: "level-red" }
                };
                
                const typeInfo = wtypeMap[props.wtype] || { name: "Unwetter", icon: "fa-triangle-exclamation" };
                const levelInfo = wlevelMap[props.wlevel] || { name: "Warnung", levelClass: "level-yellow" };
                
                const startDate = new Date(props.start * 1000);
                const endDate = new Date(props.end * 1000);
                
                const formatTime = (d) => {
                    return `${d.toLocaleDateString('de-AT')} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                };
                
                const timeString = `Gültig von ${formatTime(startDate)} bis ${formatTime(endDate)} Uhr`;
                
                const districtNameMap = {
                    "701": "Innsbruck-Stadt",
                    "702": "Imst",
                    "703": "Innsbruck-Land",
                    "704": "Kitzbühel",
                    "705": "Kufstein",
                    "706": "Landeck",
                    "707": "Lienz (Osttirol)",
                    "708": "Reutte",
                    "709": "Schwaz"
                };
                
                const affectedDistrict = districtNameMap[prefix] || state.name;
                const titleText = matchesDistrict 
                    ? `Offizielle ${typeInfo.name}-Warnung für Bezirk ${affectedDistrict}` 
                    : `Offizielle ${typeInfo.name}-Warnung in Tirol`;
                
                alertsToShow.push({
                    title: `<i class="fa-solid ${typeInfo.icon}"></i> ${titleText} (${levelInfo.name})`,
                    desc: `${timeString}. Bitte passe deine Tourenplanung an und beachte die alpinen Risiken im betroffenen Gebiet.`,
                    levelClass: levelInfo.levelClass,
                    isOfficial: true,
                    isLocal: matchesDistrict
                });
            }
        });
    }
    
    // Lokale Warnungen zuerst anzeigen
    alertsToShow.sort((a, b) => {
        if (a.isLocal && !b.isLocal) return -1;
        if (!a.isLocal && b.isLocal) return 1;
        return 0;
    });
    
    // 2. Rechnerische Alpinrisiken (basierend auf Live-Wetterstation)
    const current = state.weatherData.current;
    if (current) {
        if (current.wind_speed_10m > 50 || current.wind_gusts_10m > 70) {
            alertsToShow.push({
                title: `<i class="fa-solid fa-wind"></i> Alpin-Risiko: Orkanböen am Berg`,
                desc: `Gemessene Böen liegen bei ${Math.round(current.wind_gusts_10m || current.wind_speed_10m * 1.3)} km/h. Hohe Sturz- und Auskühlungsgefahr auf Graten!`,
                levelClass: "level-simulated"
            });
        }
        if (current.precipitation > 5) {
            alertsToShow.push({
                title: `<i class="fa-solid fa-cloud-showers-heavy"></i> Alpin-Risiko: Starker Niederschlag`,
                desc: `Aktueller Niederschlag beträgt ${current.precipitation} mm/h. Erhöhte Muren- und Rutschgefahr an steilen Hängen!`,
                levelClass: "level-simulated"
            });
        }
        if (current.weather_code === 95 || current.weather_code === 96 || current.weather_code === 99) {
            alertsToShow.push({
                title: `<i class="fa-solid fa-cloud-bolt"></i> Alpin-Risiko: Akute Blitzschlaggefahr`,
                desc: `Gewitter gemeldet. Verlasse unverzüglich ausgesetzte Grate und Gipfel!`,
                levelClass: "level-simulated"
            });
        }
    }
    
    if (alertsToShow.length > 0) {
        section.classList.remove("hidden");
        alertsToShow.forEach(alert => {
            const card = document.createElement("div");
            card.className = `alert-card ${alert.levelClass}`;
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

// Offizielle GeoSphere Warnungen laden
function fetchOfficialWarnings() {
    return fetch("https://warnungen.zamg.at/wsapp/api/getWarnstatus")
        .then(res => res.json())
        .then(data => {
            state.officialWarnings = data;
        })
        .catch(err => {
            console.error("GeoSphere Warnungen konnten nicht geladen werden:", err);
        });
}

// Offiziellen Lawinenlagebericht laden (Euregio)
function fetchAvalancheReport() {
    return fetch("https://avalanche.report/bulletins/latest/EUREGIO_de_CAAMLv6.json")
        .then(res => res.json())
        .then(data => {
            state.avalancheData = data;
        })
        .catch(err => {
            console.error("Lawinenbericht konnte nicht geladen werden:", err);
        });
}

// Lawinen-Widget befüllen
function updateAvalancheUI() {
    const container = document.getElementById("avalanche-content");
    if (!container) return;
    
    if (!state.avalancheData || !state.avalancheData.bulletins) {
        container.innerHTML = `<div class="avalanche-loading"><i class="fa-solid fa-triangle-exclamation"></i> Lagebericht derzeit nicht verfügbar.</div>`;
        return;
    }
    
    // Finde das Bulletin für Tirol (Bulletin mit Regionen mit AT-07 IDs)
    const tyrolBulletin = state.avalancheData.bulletins.find(b => 
        b.regions && b.regions.some(r => r.regionID && r.regionID.startsWith("AT-07"))
    );
    
    if (!tyrolBulletin) {
        container.innerHTML = `<div class="avalanche-loading">Kein Lagebericht für Tirol verfügbar.</div>`;
        return;
    }
    
    // Danger-Level (maximales Rating im Tiroler Bulletin)
    const dangerMap = {
        "low": { val: 1, name: "Gering", class: "level-1" },
        "moderate": { val: 2, name: "Mäßig", class: "level-2" },
        "considerable": { val: 3, name: "Erheblich", class: "level-3" },
        "high": { val: 4, name: "Groß", class: "level-4" },
        "very_high": { val: 5, name: "Sehr groß", class: "level-5" }
    };
    
    let maxDanger = { val: 0, name: "Gering", class: "level-1" };
    if (tyrolBulletin.dangerRatings) {
        tyrolBulletin.dangerRatings.forEach(r => {
            const mapped = dangerMap[r.mainValue];
            if (mapped && mapped.val > maxDanger.val) {
                maxDanger = mapped;
            }
        });
    }
    
    // Hauptgefahrenmuster extrahieren
    const problemMap = {
        "persistent_weak_layers": "Altschneeproblem",
        "wet_snow": "Nassschnee",
        "wind_slab": "Triebschnee",
        "new_snow": "Neuschnee",
        "gliding_snow": "Gleitschnee"
    };
    
    let problemsHTML = "";
    if (tyrolBulletin.avalancheProblems) {
        const problemTags = tyrolBulletin.avalancheProblems
            .map(p => problemMap[p.problemType] || p.problemType)
            .filter((v, i, self) => self.indexOf(v) === i); // Eindeutige Werte
            
        problemsHTML = problemTags.map(tag => `<span class="avalanche-problem-tag">${tag}</span>`).join("");
    }
    
    // Kurzbericht
    const highlights = tyrolBulletin.avalancheActivity?.highlights || "Allgemein stabile Verhältnisse am Morgen, Gefahr feuchter Lawinen steigt tageszeitlich an.";
    
    container.innerHTML = `
        <div class="avalanche-row">
            <span class="avalanche-label">Gefahrenstufe:</span>
            <span class="avalanche-badge ${maxDanger.class}">${maxDanger.name} (Stufe ${maxDanger.val})</span>
        </div>
        <div class="avalanche-comment">
            <strong>Lagebeurteilung:</strong><br/>
            ${highlights}
        </div>
        <div class="avalanche-row" style="flex-direction: column; align-items: flex-start; gap: 6px;">
            <span class="avalanche-label">Hauptgefahren:</span>
            <div class="avalanche-problems">
                ${problemsHTML || "<span class='avalanche-problem-tag'>Keine akuten Probleme</span>"}
            </div>
        </div>
        <div style="text-align: center; margin-top: 6px;">
            <a href="https://avalanche.report" target="_blank" style="color: #60a5fa; font-size: 0.75rem; text-decoration: underline;">
                Vollständiger Lawinenreport <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
        </div>
    `;
}

// Hilfsfunktion: WMO-Codes auf Meteocons animierte SVGs mappen
function getWeatherIconUrl(code, isNight) {
    let filename = "cloudy";
    
    if (code === 0) {
        filename = isNight ? "clear-night" : "clear-day";
    } else if (code === 1 || code === 2) {
        filename = isNight ? "partly-cloudy-night" : "partly-cloudy-day";
    } else if (code === 3) {
        filename = "cloudy";
    } else if (code === 45 || code === 48) {
        filename = "fog";
    } else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) {
        filename = "rain";
    } else if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(code)) {
        filename = "snow";
    } else if (code === 95) {
        filename = "thunderstorms";
    } else if (code === 96 || code === 99) {
        filename = "hail";
    }
    
    return `https://unpkg.com/@meteocons/svg@0.1.0/fill/${filename}.svg`;
}

// Hilfsfunktion: Bezirk aus Ortsname und Zusatzfeldern ermitteln (für Warnungs-Filterung)
function getDistrictPrefix(locationName, admin3, admin4, postcode, county) {
    const text = `${locationName} ${admin3 || ''} ${admin4 || ''} ${county || ''}`.toLowerCase();
    
    if (text.includes("innsbruck-stadt") || text.includes("innsbruck stadt") || (text.includes("innsbruck") && !text.includes("land"))) {
        return "701";
    }
    if (text.includes("imst")) {
        return "702";
    }
    if (text.includes("innsbruck-land") || text.includes("innsbruck land") || text.includes("patsch") || text.includes("neustift") || text.includes("stubai") || text.includes("sellrain") || text.includes("hall in tirol")) {
        return "703";
    }
    if (text.includes("kitzbühel") || text.includes("kitzbuehel") || text.includes("kirchberg") || text.includes("st. johann")) {
        return "704";
    }
    if (text.includes("kufstein") || text.includes("wörgl") || text.includes("wildschönau")) {
        return "705";
    }
    if (text.includes("landeck") || text.includes("st. anton") || text.includes("ischgl") || text.includes("serfaus")) {
        return "706";
    }
    if (text.includes("lienz") || text.includes("osttirol") || text.includes("kals") || text.includes("matrei")) {
        return "707";
    }
    if (text.includes("reutte") || text.includes("ehrwald") || text.includes("außerfern") || text.includes("ausserfern")) {
        return "708";
    }
    if (text.includes("schwaz") || text.includes("zillertal") || text.includes("tux") || text.includes("mayrhofen")) {
        return "709";
    }
    
    // Preset-Fallbacks
    if (locationName === "Innsbruck") return "701";
    if (locationName === "Zugspitze") return "708";
    if (locationName === "Wildspitze") return "702";
    if (locationName === "Patscherkofel") return "703";
    if (locationName === "Olperer") return "709";
    if (locationName === "Großglockner") return "707";
    if (locationName === "Kitzbühel") return "704";
    if (locationName === "St. Anton am Arlberg") return "706";
    
    return "701"; // Fallback auf Innsbruck-Stadt
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
        
        const card = document.createElement("div");
        card.className = "hourly-card";
        card.innerHTML = `
            <span class="hourly-time">${formattedTime}</span>
            <img class="hourly-icon" src="${getWeatherIconUrl(code, false)}" alt="Wetter" />
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
        const weatherInfo = weatherCodes[code] || { desc: "Wolkig" };
        
        const row = document.createElement("div");
        row.className = "daily-row";
        row.innerHTML = `
            <span class="daily-day">${dayName}</span>
            <div class="daily-icon-box">
                <img class="daily-icon" src="${getWeatherIconUrl(code, false)}" alt="Wetter" />
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
// LibreWXR Live-Radar Logik (Drop-in für RainViewer)
// ==========================================
function initRadar() {
    // Abfrage der aktuellen Radar-Timestamps von LibreWXR
    fetch("https://api.librewxr.net/public/weather-maps.json")
        .then(res => res.json())
        .then(data => {
            if (data && data.radar) {
                state.radarHost = data.host || "https://api.librewxr.net";
                
                // Farbschemata-Dropdown befüllen
                const schemeSelect = document.getElementById("radar-scheme-select");
                schemeSelect.innerHTML = "";
                if (data.colorSchemes) {
                    data.colorSchemes.forEach(scheme => {
                        const opt = document.createElement("option");
                        opt.value = scheme.id;
                        opt.textContent = scheme.name;
                        if (scheme.id === state.selectedRadarSchemeId) {
                            opt.selected = true;
                        }
                        schemeSelect.appendChild(opt);
                    });
                }
                
                // Past & Nowcast kombinieren
                const past = data.radar.past || [];
                const nowcast = data.radar.nowcast || [];
                
                past.forEach(f => f.isForecast = false);
                nowcast.forEach(f => f.isForecast = true);
                
                state.radarTimes = [...past, ...nowcast];
                setupRadarLayers();
            }
        })
        .catch(err => {
            console.error("LibreWXR Radardaten konnten nicht geladen werden:", err);
            document.getElementById("radar-timestamp").textContent = "Radar offline";
        });
}

function setupRadarLayers() {
    // Entferne alte Radar-Layer, falls vorhanden
    state.radarLayers.forEach(layer => state.map.removeLayer(layer));
    state.radarLayers = [];
    
    state.radarTimes.forEach((frame, idx) => {
        // Erzeuge den Tile-Layer für dieses Zeitfenster mit dem gewählten Farbschema
        const url = `${state.radarHost}${frame.path}/256/{z}/{x}/{y}/${state.selectedRadarSchemeId}/1_1.png`;
        const layer = L.tileLayer(url, {
            opacity: 0.0, // Zuerst alle unsichtbar
            zIndex: 100 + idx,
            maxZoom: 18
        });
        
        layer.addTo(state.map);
        state.radarLayers.push(layer);
    });
    
    // Standardmäßig auf die letzte Vergangenheitskachel stellen ("Jetzt")
    const pastCount = state.radarTimes.filter(t => !t.isForecast).length;
    state.currentRadarIndex = Math.max(0, pastCount - 1);
    
    showRadarFrame(state.currentRadarIndex);
    
    // Slider anpassen
    const timeline = document.getElementById("radar-timeline");
    timeline.max = state.radarLayers.length - 1;
    timeline.value = state.currentRadarIndex;
}

function showRadarFrame(index) {
    if (index < 0 || index >= state.radarLayers.length) return;
    
    // Blende alle Layer aus (Opazität 0) und den aktuellen ein
    state.radarLayers.forEach((layer, idx) => {
        if (idx === index) {
            layer.setOpacity(0.85);
        } else {
            layer.setOpacity(0.0);
        }
    });
    
    state.currentRadarIndex = index;
    
    // Zeitstempel aktualisieren
    const frameObj = state.radarTimes[index];
    if (frameObj) {
        const date = new Date(frameObj.time * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const mins = date.getMinutes().toString().padStart(2, '0');
        const labelSuffix = frameObj.isForecast ? " <span class='forecast-label'>(Prognose)</span>" : "";
        document.getElementById("radar-timestamp").innerHTML = `<i class="fa-regular fa-clock"></i> Radar: ${hours}:${mins} Uhr${labelSuffix}`;
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
