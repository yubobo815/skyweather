const weatherForm = document.querySelector("#weatherForm");
const postalInput = document.querySelector("#postalCode");
const countryInput = document.querySelector("#countryCode");
const locationButton = document.querySelector("#locationButton");
const favoriteSave = document.querySelector("#favoriteSave");
const favoriteList = document.querySelector("#favoriteList");
const statusMessage = document.querySelector("#statusMessage");
const currentWeather = document.querySelector("#currentWeather");
const currentIcon = document.querySelector("#currentIcon");
const currentAccessories = document.querySelector("#currentAccessories");
const locationName = document.querySelector("#locationName");
const currentCondition = document.querySelector("#currentCondition");
const currentTemp = document.querySelector("#currentTemp");
const currentFeels = document.querySelector("#currentFeels");
const currentHumidity = document.querySelector("#currentHumidity");
const currentWind = document.querySelector("#currentWind");
const currentRain = document.querySelector("#currentRain");
const currentLocalTime = document.querySelector("#currentLocalTime");
const forecastGrid = document.querySelector("#forecastGrid");
const unitButtons = document.querySelectorAll(".unit-button");
const dayDetails = document.querySelector("#dayDetails");
const detailsClose = document.querySelector("#detailsClose");
const detailsIcon = document.querySelector("#detailsIcon");
const detailsDate = document.querySelector("#detailsDate");
const detailsTitle = document.querySelector("#detailsTitle");
const detailsCondition = document.querySelector("#detailsCondition");
const detailsTemp = document.querySelector("#detailsTemp");
const detailsFeels = document.querySelector("#detailsFeels");
const detailsRain = document.querySelector("#detailsRain");
const detailsRainHours = document.querySelector("#detailsRainHours");
const detailsUv = document.querySelector("#detailsUv");
const detailsSport = document.querySelector("#detailsSport");
const detailsWind = document.querySelector("#detailsWind");
const detailsGusts = document.querySelector("#detailsGusts");
const detailsSun = document.querySelector("#detailsSun");
const hourlyStrip = document.querySelector("#hourlyStrip");
const radarPanel = document.querySelector("#radarPanel");
const radarMap = document.querySelector("#radarMap");
const radarStatus = document.querySelector("#radarStatus");

const STORAGE_KEY = "skycast-weather-preferences";
const MAX_FAVORITES = 5;
let activeUnit = "celsius";
let lastSearch = null;
let latestForecast = null;
let latestPlace = null;
let favorites = [];
let localTimeTimer = null;
let radarMapInstance = null;
let radarLayer = null;
let radarMarker = null;
let radarRequestId = 0;

const weatherCodes = {
  0: { label: "Clear sky", type: "sun" },
  1: { label: "Mainly clear", type: "partly" },
  2: { label: "Partly cloudy", type: "partly" },
  3: { label: "Overcast", type: "cloud" },
  45: { label: "Fog", type: "fog" },
  48: { label: "Depositing rime fog", type: "fog" },
  51: { label: "Light drizzle", type: "rain" },
  53: { label: "Moderate drizzle", type: "rain" },
  55: { label: "Dense drizzle", type: "rain" },
  56: { label: "Light freezing drizzle", type: "rain" },
  57: { label: "Dense freezing drizzle", type: "rain" },
  61: { label: "Slight rain", type: "rain" },
  63: { label: "Moderate rain", type: "rain" },
  65: { label: "Heavy rain", type: "rain" },
  66: { label: "Light freezing rain", type: "rain" },
  67: { label: "Heavy freezing rain", type: "rain" },
  71: { label: "Slight snow fall", type: "snow" },
  73: { label: "Moderate snow fall", type: "snow" },
  75: { label: "Heavy snow fall", type: "snow" },
  77: { label: "Snow grains", type: "snow" },
  80: { label: "Slight rain showers", type: "rain" },
  81: { label: "Moderate rain showers", type: "rain" },
  82: { label: "Violent rain showers", type: "rain" },
  85: { label: "Slight snow showers", type: "snow" },
  86: { label: "Heavy snow showers", type: "snow" },
  95: { label: "Thunderstorm", type: "storm" },
  96: { label: "Thunderstorm with slight hail", type: "storm" },
  99: { label: "Thunderstorm with heavy hail", type: "storm" },
};

const unitLabels = {
  fahrenheit: { temp: "F", wind: "mph" },
  celsius: { temp: "C", wind: "km/h" },
};

const rainStrengths = [
  { max: 0.1, label: "No rain" },
  { max: 1, label: "Trace rain" },
  { max: 5, label: "Light rain" },
  { max: 15, label: "Moderate rain" },
  { max: 30, label: "Heavy rain" },
  { max: Infinity, label: "Very heavy rain" },
];

const POSTAL_LOOKUP_COUNTRIES = new Set([
  "us",
  "ca",
  "gb",
  "au",
  "nz",
  "de",
  "fr",
  "es",
  "it",
  "nl",
]);

class LookupNotFoundError extends Error {}

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchTerm = postalInput.value.trim();
  const countryCode = countryInput.value;

  if (!searchTerm) {
    setStatus("Add a postal code or city first.", true);
    return;
  }

  await loadWeather(searchTerm, countryCode);
});

locationButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    const secureHint = window.isSecureContext
      ? ""
      : " Location access usually requires HTTPS or localhost.";
    setStatus(`Location is not available in this browser.${secureHint}`, true);
    return;
  }

  setLocationLoading(true);
  setStatus("Requesting your location...");

  try {
    const position = await getCurrentPosition();
    const latitude = position.coords.latitude.toFixed(4);
    const longitude = position.coords.longitude.toFixed(4);

    await loadWeatherByCoordinates(latitude, longitude, null, {
      requireLocationName: true,
    });
  } catch (error) {
    setStatus(getLocationErrorMessage(error), true);
  } finally {
    setLocationLoading(false);
  }
});

forecastGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".forecast-card");

  if (!card) return;

  showDayDetails(Number(card.dataset.index));
});

detailsClose.addEventListener("click", hideDayDetails);

dayDetails.addEventListener("click", (event) => {
  if (event.target === dayDetails) {
    hideDayDetails();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dayDetails.classList.contains("hidden")) {
    hideDayDetails();
  }
});

unitButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selectedUnit = button.dataset.unit;
    if (selectedUnit === activeUnit) return;

    setActiveUnit(selectedUnit);

    if (lastSearch) {
      await rerunLastSearch();
    } else {
      savePreferences();
    }
  });
});

countryInput.addEventListener("change", savePreferences);

favoriteSave.addEventListener("click", () => {
  saveCurrentFavorite();
});

favoriteList.addEventListener("click", async (event) => {
  const favoriteButton = event.target.closest(".favorite-chip");

  if (!favoriteButton) return;

  const favorite = favorites[Number(favoriteButton.dataset.index)];

  if (!favorite) return;

  await loadFavorite(favorite);
});

restorePreferences();

async function loadWeather(searchTerm, countryCode, options = {}) {
  const { persist = true } = options;

  setSearchLoading(true);
  setStatus("Finding your forecast...");
  showLoadingState();

  try {
    const place = await geocodeSearchTerm(searchTerm, countryCode);
    const forecast = await fetchForecast(place.latitude, place.longitude);
    renderWeather(place, forecast);
    lastSearch = { type: "search", searchTerm, countryCode };
    postalInput.value = searchTerm;
    countryInput.value = countryCode;
    updateFavoriteSaveButton();
    if (persist) savePreferences();
    setStatus(`Updated for ${place.name}.`);
  } catch (error) {
    hideDayDetails();
    currentWeather.classList.add("hidden");
    forecastGrid.innerHTML = "";
    setStatus(error.message, true);
  } finally {
    setSearchLoading(false);
  }
}

async function loadWeatherByCoordinates(latitude, longitude, name, options = {}) {
  const { persist = true, requireLocationName = false } = options;

  setSearchLoading(true);
  setStatus("Finding your location details...");
  showLoadingState();

  try {
    const place = await resolveCoordinatePlace(latitude, longitude, name, {
      requireLocationName,
    });
    setStatus("Finding your forecast...");
    const forecast = await fetchForecast(latitude, longitude);
    renderWeather(place, forecast);
    lastSearch = { type: "coords", latitude, longitude, name: place.name };
    updateFavoriteSaveButton();
    if (persist) savePreferences();
    setStatus(`Updated for ${place.name}.`);
  } catch (error) {
    hideDayDetails();
    currentWeather.classList.add("hidden");
    forecastGrid.innerHTML = "";
    setStatus(error.message, true);
  } finally {
    setSearchLoading(false);
  }
}

async function resolveCoordinatePlace(latitude, longitude, name, options = {}) {
  const { requireLocationName = false } = options;

  if (name && !isCurrentLocationFallbackName(name)) {
    return { name, latitude, longitude };
  }

  try {
    return await reverseGeocodeCoordinates(latitude, longitude);
  } catch {
    if (requireLocationName) {
      throw new Error(
        "Your coordinates were found, but the location name could not be resolved. Try again or search by city/postcode.",
      );
    }

    return {
      name: name || `Current location (${latitude}, ${longitude})`,
      latitude,
      longitude,
    };
  }
}

async function geocodeSearchTerm(searchTerm, countryCode) {
  const normalizedCountryCode = countryCode.toLowerCase();

  if (shouldTryPostalLookup(searchTerm, normalizedCountryCode)) {
    try {
      return await geocodePostalCode(searchTerm, normalizedCountryCode);
    } catch (postalError) {
      if (!(postalError instanceof LookupNotFoundError)) {
        throw postalError;
      }
    }
  }

  try {
    return await geocodeCity(searchTerm, normalizedCountryCode);
  } catch (cityError) {
    if (cityError instanceof LookupNotFoundError) {
      throw new LookupNotFoundError(
        "That postal code or city was not found for the selected country.",
      );
    }

    throw cityError;
  }
}

function shouldTryPostalLookup(searchTerm, countryCode) {
  return POSTAL_LOOKUP_COUNTRIES.has(countryCode) && /\d/.test(searchTerm);
}

async function geocodePostalCode(postalCode, countryCode) {
  let response;

  try {
    response = await fetch(
      `https://api.zippopotam.us/${countryCode}/${encodeURIComponent(postalCode)}`,
    );
  } catch {
    throw new Error("Postal lookup is unreachable. Check your connection and try again.");
  }

  if (response.status === 404) {
    throw new LookupNotFoundError("That postal code was not found for the selected country.");
  }

  if (!response.ok) {
    throw new Error("Postal lookup is unavailable right now. Try again shortly.");
  }

  const data = await response.json();
  const place = data.places?.[0];

  if (!place) {
    throw new LookupNotFoundError("No location data came back for that postal code.");
  }

  const locality = place["place name"];
  const region = place.state || place["state abbreviation"] || data.country;

  return {
    name: region ? `${locality}, ${region}` : locality,
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function geocodeCity(searchTerm, countryCode) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

  url.search = new URLSearchParams({
    name: searchTerm,
    count: "1",
    language: "en",
    format: "json",
    countryCode: countryCode.toUpperCase(),
  });

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("City lookup is unreachable. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error("City lookup is unavailable right now. Try again shortly.");
  }

  const data = await response.json();
  const place = data.results?.[0];

  if (!place) {
    throw new LookupNotFoundError(
      "That city or postal code was not found for the selected country.",
    );
  }

  return {
    name: formatGeocodingName(place),
    latitude: place.latitude,
    longitude: place.longitude,
  };
}

async function reverseGeocodeCoordinates(latitude, longitude) {
  const providers = [reverseGeocodeWithBigDataCloud, reverseGeocodeWithNominatim];

  for (const provider of providers) {
    try {
      return await provider(latitude, longitude);
    } catch {
      // Try the next reverse-geocoding provider before giving up.
    }
  }

  throw new Error("Location details were not returned.");
}

async function reverseGeocodeWithBigDataCloud(latitude, longitude) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");

  url.search = new URLSearchParams({
    latitude,
    longitude,
    localityLanguage: "en",
  });

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Location details are unreachable.");
  }

  if (!response.ok) {
    throw new Error("Location details are unavailable.");
  }

  const data = await response.json();
  const placeName = formatReverseGeocodeName(data);

  if (!placeName) {
    throw new Error("Location details were not returned.");
  }

  return {
    name: placeName,
    latitude,
    longitude,
  };
}

async function reverseGeocodeWithNominatim(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");

  url.search = new URLSearchParams({
    format: "jsonv2",
    lat: latitude,
    lon: longitude,
    addressdetails: "1",
    zoom: "10",
    "accept-language": "en",
  });

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error("Location details are unreachable.");
  }

  if (!response.ok) {
    throw new Error("Location details are unavailable.");
  }

  const data = await response.json();
  const placeName = formatNominatimPlaceName(data);

  if (!placeName) {
    throw new Error("Location details were not returned.");
  }

  return {
    name: placeName,
    latitude,
    longitude,
  };
}

async function fetchForecast(latitude, longitude) {
  const temperatureUnit = activeUnit === "fahrenheit" ? "fahrenheit" : "celsius";
  const windSpeedUnit = activeUnit === "fahrenheit" ? "mph" : "kmh";
  const url = new URL("https://api.open-meteo.com/v1/forecast");

  url.search = new URLSearchParams({
    latitude,
    longitude,
    current:
      "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,rain,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_probability_max,rain_sum,precipitation_hours,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max,sunrise,sunset",
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    precipitation_unit: "mm",
    timezone: "auto",
    forecast_days: "15",
  });

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Weather service is unreachable. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error("Weather data is unavailable right now. Try another location or retry shortly.");
  }

  return response.json();
}

function renderWeather(place, forecast) {
  const current = forecast.current;
  const daily = forecast.daily;
  const currentInfo = getWeatherInfo(current.weather_code);
  const todayInfo = getWeatherInfo(daily.weather_code[0]);
  const todayAccessories = getDailyAccessories(daily, 0, todayInfo.type);
  const units = unitLabels[activeUnit];

  latestForecast = forecast;
  latestPlace = place;
  currentWeather.classList.remove("hidden");
  currentIcon.innerHTML = getWeatherIcon(currentInfo.type);
  currentAccessories.innerHTML = renderAccessoryBadges(todayAccessories);
  locationName.textContent = place.name;
  currentCondition.textContent = currentInfo.label;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  currentFeels.textContent = `Feels like ${Math.round(current.apparent_temperature)}°${units.temp}`;
  currentHumidity.textContent = `${current.relative_humidity_2m}%`;
  currentWind.textContent = `${Math.round(current.wind_speed_10m)} ${units.wind}`;
  currentRain.textContent = formatRainSummary(daily, 0);
  startLocalTimeClock(forecast.timezone);

  const forecastCards = daily.time.map((dateString, index) =>
    renderForecastCard(daily, dateString, index),
  );

  forecastGrid.innerHTML = `
    <div class="forecast-featured" aria-label="Next five days">
      ${forecastCards.slice(0, 5).join("")}
    </div>
    <div class="forecast-thumbnails" aria-label="Remaining forecast days">
      ${forecastCards.slice(5).join("")}
    </div>
  `;
}

function renderForecastCard(daily, dateString, index) {
  const info = getWeatherInfo(daily.weather_code[index]);
  const date = new Date(`${dateString}T12:00:00`);
  const day = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
  const units = unitLabels[activeUnit];
  const high = Math.round(daily.temperature_2m_max[index]);
  const low = Math.round(daily.temperature_2m_min[index]);
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;
  const rainStrength = getRainStrength(rainAmount);
  const wind = Math.round(daily.wind_speed_10m_max[index]);
  const feel = getTemperatureFeel(high, low);
  const accessories = getDailyAccessories(daily, index, info.type);
  const sport = getDailySport(daily, index, info.type);

  return `
    <button class="forecast-card ${index < 5 ? "forecast-card-featured" : "forecast-card-thumbnail"}" type="button" data-index="${index}" data-weather="${info.type}" data-feel="${feel}" data-sport="${sport.type}" data-accessories="${accessories.map((accessory) => accessory.type).join(" ")}" aria-label="View ${index === 0 ? "today" : day} forecast details">
      <span class="forecast-top">
        <span class="forecast-heading">
          <span class="forecast-day">${index === 0 ? "Today" : day}</span>
          <span class="forecast-date">${monthDay}</span>
        </span>
        <span class="forecast-accessories" aria-hidden="true">${renderAccessoryBadges(accessories)}</span>
      </span>
      <span class="forecast-visual" aria-hidden="true">
        <span class="forecast-icon">${getWeatherIcon(info.type)}</span>
        ${renderSportChip(sport)}
      </span>
      <span class="forecast-temps">
        <span class="forecast-high">${high}°</span>
        <span class="forecast-low">${low}°${units.temp}</span>
      </span>
      <span class="forecast-condition">${info.label}</span>
      <span class="forecast-meta">
        <span>${rainStrength} · ${rainChance}%</span>
        <span>${wind} ${units.wind}</span>
      </span>
    </button>
  `;
}

function showDayDetails(index) {
  if (!latestForecast || !latestPlace || Number.isNaN(index)) return;

  const { daily } = latestForecast;
  const info = getWeatherInfo(daily.weather_code[index]);
  const date = new Date(`${daily.time[index]}T12:00:00`);
  const day = new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(date);
  const monthDay = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
  }).format(date);
  const units = unitLabels[activeUnit];
  const high = Math.round(daily.temperature_2m_max[index]);
  const low = Math.round(daily.temperature_2m_min[index]);
  const feelsHigh = Math.round(daily.apparent_temperature_max[index]);
  const feelsLow = Math.round(daily.apparent_temperature_min[index]);
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;
  const rainHours = daily.precipitation_hours?.[index] ?? 0;
  const uvIndex = daily.uv_index_max?.[index];
  const wind = Math.round(daily.wind_speed_10m_max[index]);
  const gusts = Math.round(daily.wind_gusts_10m_max[index]);
  const feel = getTemperatureFeel(high, low);
  const sport = getDailySport(daily, index, info.type);

  dayDetails.dataset.weather = info.type;
  dayDetails.dataset.feel = feel;
  detailsIcon.innerHTML = getWeatherIcon(info.type);
  detailsDate.textContent = `${day}, ${monthDay}`;
  detailsTitle.textContent = latestPlace.name;
  detailsCondition.textContent = info.label;
  detailsTemp.textContent = `${high}° / ${low}°${units.temp}`;
  detailsFeels.textContent = `${feelsHigh}° / ${feelsLow}°${units.temp}`;
  detailsRain.textContent = `${getRainStrength(rainAmount)} · ${formatRainAmount(rainAmount)} · ${rainChance}% chance`;
  detailsRainHours.textContent = `${formatNumber(rainHours)} hr`;
  detailsUv.textContent = formatUvIndex(uvIndex);
  detailsSport.innerHTML = renderSportChip(sport);
  detailsWind.textContent = `${wind} ${units.wind}`;
  detailsGusts.textContent = `${gusts} ${units.wind}`;
  detailsSun.textContent = `${formatTime(daily.sunrise[index])} / ${formatTime(daily.sunset[index])}`;
  hourlyStrip.innerHTML = renderHourlyStrip(daily.time[index]);
  prepareRadarPanel(index);

  dayDetails.classList.remove("hidden");
  detailsClose.focus();

  if (index === 0) {
    const requestId = ++radarRequestId;
    requestAnimationFrame(() => loadTodayRadar(requestId));
  }
}

function hideDayDetails() {
  radarRequestId += 1;
  dayDetails.classList.add("hidden");
}

function prepareRadarPanel(index) {
  const isToday = index === 0;

  radarPanel.classList.toggle("hidden", !isToday);

  if (!isToday) {
    radarRequestId += 1;
    radarStatus.textContent = "";
    return;
  }

  radarStatus.textContent = "Loading weather radar...";
}

async function loadTodayRadar(requestId) {
  if (!latestPlace || !radarPanel || radarPanel.classList.contains("hidden")) return;

  const latitude = Number(latestPlace.latitude);
  const longitude = Number(latestPlace.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    radarStatus.textContent = "Weather radar needs a precise location.";
    return;
  }

  if (!window.L) {
    radarStatus.textContent = "Weather radar could not load. Check your connection.";
    return;
  }

  try {
    const radar = await fetchLatestRadarFrame();

    if (
      requestId !== radarRequestId ||
      dayDetails.classList.contains("hidden") ||
      radarPanel.classList.contains("hidden")
    ) {
      return;
    }

    renderRadarMap(latitude, longitude, radar);
    radarStatus.textContent = `Latest weather radar ${formatRadarTime(radar.frame.time)}`;
  } catch (error) {
    if (requestId !== radarRequestId) return;

    radarStatus.textContent = error.message;
  }
}

async function fetchLatestRadarFrame() {
  let response;

  try {
    response = await fetch("https://api.rainviewer.com/public/weather-maps.json");
  } catch {
    throw new Error("Weather radar is unreachable.");
  }

  if (!response.ok) {
    throw new Error("Weather radar is unavailable right now.");
  }

  const data = await response.json();
  const pastFrames = data.radar?.past ?? [];
  const nowcastFrames = data.radar?.nowcast ?? [];
  const frame =
    pastFrames[pastFrames.length - 1] ||
    nowcastFrames[nowcastFrames.length - 1];

  if (!data.host || !frame?.path) {
    throw new Error("Weather radar frame was not returned.");
  }

  return {
    host: data.host,
    frame,
  };
}

function renderRadarMap(latitude, longitude, radar) {
  const center = [latitude, longitude];

  if (!radarMapInstance) {
    radarMapInstance = L.map(radarMap, {
      scrollWheelZoom: false,
    }).setView(center, 7);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(radarMapInstance);
  } else {
    radarMapInstance.setView(center, radarMapInstance.getZoom() || 7);
  }

  if (radarLayer) {
    radarLayer.remove();
  }

  radarLayer = L.tileLayer(`${radar.host}${radar.frame.path}/256/{z}/{x}/{y}/2/1_1.png`, {
    maxNativeZoom: 7,
    maxZoom: 10,
    opacity: 0.74,
    attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
  }).addTo(radarMapInstance);

  if (radarMarker) {
    radarMarker.setLatLng(center);
  } else {
    radarMarker = L.circleMarker(center, {
      radius: 6,
      color: "#0f172a",
      weight: 2,
      fillColor: "#ffffff",
      fillOpacity: 0.95,
    }).addTo(radarMapInstance);
  }

  radarMarker.bindTooltip(latestPlace.name, {
    direction: "top",
    offset: [0, -8],
  });

  requestAnimationFrame(() => radarMapInstance.invalidateSize());
}

function formatRadarTime(unixSeconds) {
  if (!unixSeconds) return "time unavailable";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unixSeconds * 1000));
}

function startLocalTimeClock(timeZone) {
  stopLocalTimeClock();
  updateLocalTime(timeZone);
  localTimeTimer = window.setInterval(() => updateLocalTime(timeZone), 60000);
}

function stopLocalTimeClock() {
  if (!localTimeTimer) return;

  window.clearInterval(localTimeTimer);
  localTimeTimer = null;
}

function updateLocalTime(timeZone) {
  currentLocalTime.textContent = formatLocalTime(timeZone);
}

function formatLocalTime(timeZone) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(new Date());
  } catch {
    return "Unavailable";
  }
}

function showLoadingState() {
  hideDayDetails();
  stopLocalTimeClock();
  currentWeather.classList.add("hidden");
  forecastGrid.innerHTML = `
    <div class="forecast-featured" aria-hidden="true">
      ${Array.from({ length: 5 }, () => renderSkeletonForecastCard("featured")).join("")}
    </div>
    <div class="forecast-thumbnails" aria-hidden="true">
      ${Array.from({ length: 10 }, () => renderSkeletonForecastCard("thumbnail")).join("")}
    </div>
  `;
}

function renderSkeletonForecastCard(size) {
  return `
    <div class="forecast-card forecast-card-${size} skeleton-card" aria-hidden="true">
      <span>
        <span class="skeleton-line skeleton-short"></span>
        <span class="skeleton-line skeleton-date"></span>
      </span>
      <span class="skeleton-icon"></span>
      <span class="skeleton-line skeleton-temp"></span>
      <span class="skeleton-line"></span>
      <span class="skeleton-line skeleton-meta"></span>
    </div>
  `;
}

async function rerunLastSearch(options = {}) {
  if (!lastSearch) return;

  if (lastSearch.type === "coords") {
    await loadWeatherByCoordinates(
      lastSearch.latitude,
      lastSearch.longitude,
      lastSearch.name || "Current Location",
      options,
    );
    return;
  }

  const searchTerm = lastSearch.searchTerm || lastSearch.postalCode;

  if (!searchTerm || !lastSearch.countryCode) return;

  await loadWeather(searchTerm, lastSearch.countryCode, options);
}

function setActiveUnit(unit) {
  if (!unitLabels[unit]) return;

  activeUnit = unit;
  unitButtons.forEach((unitButton) => {
    const isActive = unitButton.dataset.unit === activeUnit;
    unitButton.classList.toggle("active", isActive);
    unitButton.setAttribute("aria-pressed", String(isActive));
  });
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 600000,
      timeout: 10000,
    });
  });
}

function getLocationErrorMessage(error) {
  const secureHint = window.isSecureContext
    ? ""
    : " Location access usually requires HTTPS or localhost.";

  if (error?.code === 1) return `Location permission was denied.${secureHint}`;
  if (error?.code === 2) return `Your location could not be determined.${secureHint}`;
  if (error?.code === 3) return `Location lookup timed out.${secureHint}`;

  return `Location is not available right now.${secureHint}`;
}

async function loadFavorite(favorite) {
  favoriteSave.disabled = true;
  await loadWeatherByCoordinates(favorite.latitude, favorite.longitude, favorite.name);
}

function saveCurrentFavorite() {
  const favorite = createFavoriteFromCurrentPlace();

  if (!favorite) return;

  const existingIndex = favorites.findIndex((item) => item.id === favorite.id);

  favorites =
    existingIndex >= 0
      ? [favorite, ...favorites.filter((_, index) => index !== existingIndex)]
      : [favorite, ...favorites];
  favorites = favorites.slice(0, MAX_FAVORITES);

  savePreferences();
  renderFavorites();
  updateFavoriteSaveButton();
  setStatus(`Saved ${favorite.name} to favorites.`);
}

function createFavoriteFromCurrentPlace() {
  if (!latestPlace) return null;

  const latitude = Number(latestPlace.latitude);
  const longitude = Number(latestPlace.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return {
    id: getFavoriteId(latitude, longitude),
    name: latestPlace.name,
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
  };
}

function getFavoriteId(latitude, longitude) {
  return `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
}

function renderFavorites() {
  const currentFavorite = createFavoriteFromCurrentPlace();

  favoriteList.innerHTML = favorites.length
    ? favorites
        .map(
          (favorite, index) => `
            <button class="favorite-chip" type="button" data-index="${index}" data-active="${currentFavorite?.id === favorite.id}" title="${escapeHtml(favorite.name)}" aria-label="Load ${escapeHtml(favorite.name)} forecast">
              ${escapeHtml(getFavoriteShortName(favorite.name))}
            </button>
          `,
        )
        .join("")
    : `<span class="favorite-empty">No saved cities yet</span>`;
}

function updateFavoriteSaveButton() {
  const favorite = createFavoriteFromCurrentPlace();
  const alreadySaved = favorite && favorites.some((item) => item.id === favorite.id);

  favoriteSave.disabled = !favorite || alreadySaved;
  favoriteSave.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3.8 14.5 9l5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4L9.5 9 12 3.8z" />
    </svg>
    ${alreadySaved ? "Saved" : "Save city"}
  `;
  renderFavorites();
}

function getFavoriteShortName(name) {
  return String(name).split(",")[0].trim() || "Saved city";
}

function normalizeFavorites(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((favorite) => ({
      name: String(favorite.name || "").trim(),
      latitude: String(favorite.latitude || "").trim(),
      longitude: String(favorite.longitude || "").trim(),
    }))
    .filter((favorite) => favorite.name && favorite.latitude && favorite.longitude)
    .map((favorite) => ({
      ...favorite,
      id: getFavoriteId(favorite.latitude, favorite.longitude),
    }))
    .filter(
      (favorite, index, list) =>
        list.findIndex((item) => item.id === favorite.id) === index,
    )
    .slice(0, MAX_FAVORITES);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function savePreferences() {
  const searchTerm = postalInput.value.trim();

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        unit: activeUnit,
        countryCode: countryInput.value,
        searchTerm,
        postalCode: searchTerm,
        lastSearch,
        favorites,
      }),
    );
  } catch {
    // Some browsers disable storage in private modes; the app still works without it.
  }
}

function readPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

function restorePreferences() {
  const preferences = readPreferences();

  if (!preferences) {
    renderFavorites();
    updateFavoriteSaveButton();
    return;
  }

  if (preferences.unit) {
    setActiveUnit(preferences.unit);
  }

  if (preferences.countryCode && hasCountryOption(preferences.countryCode)) {
    countryInput.value = preferences.countryCode;
  }

  favorites = normalizeFavorites(preferences.favorites);
  renderFavorites();
  updateFavoriteSaveButton();

  const savedSearchTerm = preferences.searchTerm || preferences.postalCode;

  if (savedSearchTerm) {
    postalInput.value = savedSearchTerm;
  }

  if (
    (preferences.lastSearch?.type === "search" || preferences.lastSearch?.type === "postal") &&
    (preferences.lastSearch.searchTerm || preferences.lastSearch.postalCode) &&
    preferences.lastSearch.countryCode
  ) {
    loadWeather(
      preferences.lastSearch.searchTerm || preferences.lastSearch.postalCode,
      preferences.lastSearch.countryCode,
      {
        persist: false,
      },
    );
    return;
  }

  if (
    preferences.lastSearch?.type === "coords" &&
    preferences.lastSearch.latitude &&
    preferences.lastSearch.longitude
  ) {
    loadWeatherByCoordinates(
      preferences.lastSearch.latitude,
      preferences.lastSearch.longitude,
      preferences.lastSearch.name || "Current Location",
      { persist: false },
    );
  }
}

function hasCountryOption(countryCode) {
  return Array.from(countryInput.options).some((option) => option.value === countryCode);
}

function formatGeocodingName(place) {
  return [place.name, place.admin1, place.country_code || place.country]
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
}

function isCurrentLocationFallbackName(name) {
  return /^current location(?:\s*\(.+\))?$/i.test(String(name).trim());
}

function formatReverseGeocodeName(data) {
  const locality = data.locality || data.city;
  const city = data.city && data.city !== locality ? data.city : null;
  const region = [data.principalSubdivision, data.postcode].filter(Boolean).join(" ");

  return [locality, city, region, data.countryName || data.countryCode]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
}

function formatNominatimPlaceName(data) {
  const address = data.address || {};
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.suburb ||
    address.hamlet ||
    address.county ||
    data.name;
  const region = [address.state || address.region, address.postcode].filter(Boolean).join(" ");

  return [locality, region, address.country || address.country_code?.toUpperCase()]
    .filter(Boolean)
    .map((part) => String(part).trim())
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
}

function renderHourlyStrip(dateString) {
  const hourly = latestForecast?.hourly;

  if (!hourly?.time?.length) {
    return `<p class="hourly-empty">Hourly data is unavailable for this day.</p>`;
  }

  const units = unitLabels[activeUnit];
  const items = hourly.time
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.startsWith(dateString))
    .map(({ time, index }) => {
      const code = hourly.weather_code?.[index];
      const info = getWeatherInfo(code);
      const temp = Math.round(hourly.temperature_2m[index]);
      const rainChance = hourly.precipitation_probability?.[index] ?? 0;
      const rainAmount = hourly.rain?.[index] ?? 0;

      return `
        <div class="hourly-item" data-weather="${info.type}">
          <span class="hourly-time">${formatTime(time)}</span>
          <span class="hourly-temp">${temp}°${units.temp}</span>
          <span class="hourly-rain">${rainChance}% · ${formatRainAmount(rainAmount)}</span>
        </div>
      `;
    });

  if (!items.length) {
    return `<p class="hourly-empty">Hourly data is unavailable for this day.</p>`;
  }

  return items.join("");
}

function formatRainSummary(daily, index) {
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;

  return `${getRainStrength(rainAmount)} · ${formatRainAmount(rainAmount)} · ${rainChance}% chance`;
}

function getRainStrength(amountMm) {
  const amount = Number(amountMm) || 0;
  return rainStrengths.find((strength) => amount < strength.max).label;
}

function formatRainAmount(amountMm) {
  const amount = Number(amountMm) || 0;
  return `${amount.toFixed(amount < 10 ? 1 : 0)} mm`;
}

function formatUvIndex(value) {
  if (value === undefined || value === null) return "Unavailable";

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return "Unavailable";

  const uvIndex = Math.round(numericValue);
  let label = "Extreme";

  if (uvIndex <= 2) label = "Low";
  else if (uvIndex <= 5) label = "Moderate";
  else if (uvIndex <= 7) label = "High";
  else if (uvIndex <= 10) label = "Very high";

  return `${uvIndex} · ${label}`;
}

function formatTime(dateTime) {
  if (!dateTime) return "Unavailable";

  const time = dateTime.split("T")[1];

  if (!time) return "Unavailable";

  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return number.toFixed(number % 1 === 0 ? 0 : 1);
}

function getWeatherInfo(code) {
  return weatherCodes[code] ?? { label: "Weather data unavailable", type: "partly" };
}

function getTemperatureFeel(high, low) {
  const highC = toCelsius(high);
  const lowC = toCelsius(low);

  if (highC < 13 || lowC < 7) return "cold";
  if (highC < 21) return "cool";
  if (highC < 27) return "mild";
  if (highC < 32) return "warm";
  return "hot";
}

function getDailySport(daily, index, weatherType) {
  const highC = toCelsius(daily.temperature_2m_max[index]);
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;
  const windKmh = toKmh(daily.wind_speed_10m_max[index]);
  const uvIndex = daily.uv_index_max?.[index] ?? 0;

  return getSportSuitability(weatherType, highC, rainAmount, rainChance, windKmh, uvIndex);
}

function getSportSuitability(weatherType, highC, rainAmount, rainChance, windKmh, uvIndex) {
  const rainMm = Number(rainAmount) || 0;
  const chance = Number(rainChance) || 0;
  const wind = Number(windKmh) || 0;
  const uv = Number(uvIndex) || 0;

  if (weatherType === "storm") {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: storms likely" };
  }

  if (weatherType === "snow") {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: snow conditions" };
  }

  if (weatherType === "fog") {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: low visibility" };
  }

  if (rainMm >= 1 || chance >= 60) {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: wet conditions" };
  }

  if (wind >= 38) {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: strong wind" };
  }

  if (uv >= 9) {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: very high UV" };
  }

  if (highC >= 34) {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: heat stress risk" };
  }

  if (highC < 10) {
    return { type: "indoor", label: "Indoor", reason: "Indoor sport recommended: cold conditions" };
  }

  return { type: "outdoor", label: "Outdoor", reason: "Outdoor sport looks suitable" };
}

function toCelsius(value) {
  const temperature = Number(value) || 0;

  return activeUnit === "fahrenheit" ? ((temperature - 32) * 5) / 9 : temperature;
}

function toKmh(value) {
  const speed = Number(value) || 0;

  return activeUnit === "fahrenheit" ? speed * 1.60934 : speed;
}

function getDailyAccessories(daily, index, weatherType) {
  const high = Math.round(daily.temperature_2m_max[index]);
  const low = Math.round(daily.temperature_2m_min[index]);
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;
  const wind = Math.round(daily.wind_speed_10m_max[index]);
  const uvIndex = daily.uv_index_max?.[index] ?? 0;
  const feel = getTemperatureFeel(high, low);

  return getDayAccessories(weatherType, feel, rainAmount, rainChance, wind, uvIndex);
}

function getDayAccessories(weatherType, feel, rainAmount, rainChance, windSpeed, uvIndex) {
  const accessories = [];
  const rainMm = Number(rainAmount) || 0;
  const chance = Number(rainChance) || 0;
  const wind = Number(windSpeed) || 0;
  const windKmh = activeUnit === "fahrenheit" ? wind * 1.60934 : wind;
  const uv = Number(uvIndex) || 0;
  const wetDay =
    weatherType === "rain" || weatherType === "storm" || rainMm >= 0.5 || chance >= 60;
  const heavyRain = rainMm >= 8 || (rainMm >= 3 && chance >= 75);
  const sunnyDay = weatherType === "sun" || weatherType === "partly";

  if (weatherType === "storm") {
    const stormSecondary = heavyRain
      ? { type: "boots", label: "Rain boots" }
      : { type: "umbrella", label: "Umbrella day" };

    addAccessory(accessories, "storm", "Storm kit");
    addAccessory(accessories, stormSecondary.type, stormSecondary.label);
    return accessories;
  }

  if (weatherType === "snow") {
    addAccessory(accessories, "coat", "Coat day");
    if (feel === "cold") addAccessory(accessories, "scarf", "Scarf day");
    else if (windKmh >= 38) addAccessory(accessories, "windbreaker", "Windbreaker day");
    return accessories;
  }

  if (heavyRain) {
    addAccessory(accessories, "boots", "Rain boots");
    addAccessory(accessories, "umbrella", "Umbrella day");
    return accessories;
  }

  if (wetDay) {
    addAccessory(accessories, "umbrella", "Umbrella day");
    if (feel === "cold") addAccessory(accessories, "scarf", "Scarf day");
    else if (feel === "cool") addAccessory(accessories, "hoodie", "Hoodie day");
    else if (windKmh >= 38) addAccessory(accessories, "windbreaker", "Windbreaker day");
    return accessories;
  }

  if (feel === "cold") {
    addAccessory(accessories, "scarf", "Scarf day");
    addAccessory(accessories, "coat", "Coat day");
    return accessories;
  }

  if (uv >= 8 && sunnyDay) {
    addAccessory(accessories, "sunscreen", "High UV");
    if (feel === "hot") addAccessory(accessories, "sunglasses", "Sunglasses day");
    else addAccessory(accessories, "hat", "Hat day");
    return accessories;
  }

  if (feel === "hot" && sunnyDay) {
    addAccessory(accessories, "sunglasses", "Sunglasses day");
    addAccessory(accessories, "hat", "Hat day");
    return accessories;
  }

  if (feel === "warm" && sunnyDay) {
    addAccessory(accessories, "hat", "Hat day");
    if (windKmh >= 38) addAccessory(accessories, "windbreaker", "Windbreaker day");
    return accessories;
  }

  if (windKmh >= 38) {
    addAccessory(accessories, "windbreaker", "Windbreaker day");
    if (feel === "cool") addAccessory(accessories, "hoodie", "Hoodie day");
    return accessories;
  }

  if (feel === "cool") return [{ type: "hoodie", label: "Hoodie day" }];
  if ((weatherType === "cloud" || weatherType === "fog") && feel === "mild") {
    return [{ type: "jacket", label: "Light jacket" }];
  }
  return [{ type: "tee", label: "Light layer" }];
}

function addAccessory(accessories, type, label) {
  if (accessories.length >= 2 || accessories.some((accessory) => accessory.type === type)) return;

  accessories.push({ type, label });
}

function renderAccessoryBadges(accessories) {
  return accessories
    .slice(0, 2)
    .map(
      (accessory) => `
        <span class="weather-accessory" data-accessory="${accessory.type}" title="${accessory.label}">
          ${getAccessoryIcon(accessory.type)}
        </span>
      `,
    )
    .join("");
}

function renderSportChip(sport) {
  return `
    <span class="sport-chip" data-sport="${sport.type}" title="${sport.reason}" aria-label="${sport.reason}">
      ${getSportIcon(sport.type)}
    </span>
  `;
}

function getSportIcon(type) {
  const icons = {
    outdoor: `
      <svg viewBox="0 0 24 24" role="img" aria-label="Outdoor sport">
        <circle cx="7" cy="16" r="3" />
        <circle cx="17" cy="16" r="3" />
        <path d="m7 16 4-7 3 7" />
        <path d="M11 9h4l2 7" />
        <path d="M9.5 6.5h3" />
      </svg>
    `,
    indoor: `
      <svg viewBox="0 0 24 24" role="img" aria-label="Indoor sport">
        <path d="M5 12h14" />
        <path d="M7 9v6M17 9v6" />
        <path d="M3.5 10.5v3M20.5 10.5v3" />
        <path d="M9.5 7.5h5l1.5 3h-8z" />
        <path d="M10 18h4" />
      </svg>
    `,
  };

  return icons[type] ?? icons.outdoor;
}

function getAccessoryIcon(type) {
  const icons = {
    storm: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Storm kit">
        <path d="M7 14c.5-4.2 4.1-7.5 8.5-7.5 3.2 0 6 1.8 7.4 4.5 3.4.2 6.1 3 6.1 6.5 0 3.6-2.9 6.5-6.5 6.5H8.8A5.8 5.8 0 0 1 7 14z" fill="currentColor" opacity="0.18" />
        <path d="M7 14c.5-4.2 4.1-7.5 8.5-7.5 3.2 0 6 1.8 7.4 4.5 3.4.2 6.1 3 6.1 6.5 0 3.6-2.9 6.5-6.5 6.5H8.8A5.8 5.8 0 0 1 7 14z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2.1" />
        <path d="m17 17-4 8h4l-2 5 7-9h-4l3-4z" fill="currentColor" />
      </svg>
    `,
    boots: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Rain boots">
        <path d="M8 6h7v16c0 2-1.6 4-4 4H5.5c-.8 0-1.5-.7-1.5-1.5 0-1.9 1.6-3.5 3.5-3.5H8V6zM19 6h7v16c0 2-1.6 4-4 4h-5.5c-.8 0-1.5-.7-1.5-1.5 0-1.9 1.6-3.5 3.5-3.5h.5V6z" fill="currentColor" opacity="0.18" />
        <path d="M8 6h7v16c0 2-1.6 4-4 4H5.5c-.8 0-1.5-.7-1.5-1.5 0-1.9 1.6-3.5 3.5-3.5H8V6zM19 6h7v16c0 2-1.6 4-4 4h-5.5c-.8 0-1.5-.7-1.5-1.5 0-1.9 1.6-3.5 3.5-3.5h.5V6z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" />
        <path d="M8 12h7M19 12h7" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      </svg>
    `,
    umbrella: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Umbrella">
        <path d="M5 15a11 11 0 0 1 22 0H5z" fill="currentColor" opacity="0.22" />
        <path d="M5 15a11 11 0 0 1 22 0H5z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2.3" />
        <path d="M16 15v8.4a3.5 3.5 0 0 0 7 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.3" />
        <path d="M10 20.5 8.5 23M25 19.8 23.5 22.3" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      </svg>
    `,
    scarf: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Scarf">
        <path d="M11 6h10v12c0 2.8-2.2 5-5 5s-5-2.2-5-5V6z" fill="currentColor" opacity="0.18" />
        <path d="M11 6h10v12c0 2.8-2.2 5-5 5s-5-2.2-5-5V6zM11 12h10M12 24l-3 4M20 24l3 4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
        <path d="M15 6v16M18 6v16" stroke="currentColor" stroke-linecap="round" stroke-width="1.7" />
      </svg>
    `,
    coat: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Coat">
        <path d="M11 6h10l5 6-3 4-2-2v13H11V14l-2 2-3-4 5-6z" fill="currentColor" opacity="0.18" />
        <path d="M11 6h10l5 6-3 4-2-2v13H11V14l-2 2-3-4 5-6z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2" />
        <path d="m13 7 3 5 3-5M16 12v15" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      </svg>
    `,
    windbreaker: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Windbreaker">
        <path d="M10 7h12l4 8-4 2-1-3v13H11V14l-1 3-4-2 4-8z" fill="currentColor" opacity="0.18" />
        <path d="M10 7h12l4 8-4 2-1-3v13H11V14l-1 3-4-2 4-8zM13 8l3 5 3-5M16 13v14" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" />
        <path d="M4 8h4M3 12h5M24 22h5M23 26h4" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
      </svg>
    `,
    hoodie: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Hoodie">
        <path d="M9 15c0-5 3-9 7-9s7 4 7 9v12H9V15z" fill="currentColor" opacity="0.18" />
        <path d="M9 15c0-5 3-9 7-9s7 4 7 9v12H9V15z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2" />
        <path d="M12 15c0-3 2-5 4-5s4 2 4 5M13 20h6M14 15v4M18 15v4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      </svg>
    `,
    jacket: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Light jacket">
        <path d="M11 7h10l4 6-3 3-1-2v13H11V14l-1 2-3-3 4-6z" fill="currentColor" opacity="0.18" />
        <path d="M11 7h10l4 6-3 3-1-2v13H11V14l-1 2-3-3 4-6zM13 8l3 5 3-5M16 13v14M12 20h3M17 20h3" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
      </svg>
    `,
    sunscreen: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Sunscreen">
        <path d="M13 6h8l1 4-2 2v14a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V12l2-2V6z" fill="currentColor" opacity="0.18" />
        <path d="M13 6h8l1 4-2 2v14a3 3 0 0 1-3 3h-3a3 3 0 0 1-3-3V12l2-2V6zM13 6h8M12 16h9" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2" />
        <path d="M6 10h3M7.5 6.5 9.5 8.5M7.5 13.5l2-2" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
      </svg>
    `,
    sunglasses: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Sunglasses">
        <path d="M5 15h9l1.5 3h1L18 15h9l-1.5 8h-6.2L17 19h-2l-2.3 4H6.5L5 15z" fill="currentColor" opacity="0.18" />
        <path d="M5 15h9l1.5 3h1L18 15h9l-1.5 8h-6.2L17 19h-2l-2.3 4H6.5L5 15zM8 10l-3 5M24 10l3 5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />
      </svg>
    `,
    hat: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Hat">
        <path d="M10 17c1-5 3.7-8 6-8s5 3 6 8" fill="currentColor" opacity="0.2" />
        <path d="M10 17c1-5 3.7-8 6-8s5 3 6 8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" />
        <path d="M5 18c3 2 19 2 22 0M9 21h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.3" />
        <path d="M21.5 7.5 24 5M25 10h3M10.5 7.5 8 5" stroke="currentColor" stroke-linecap="round" stroke-width="1.8" />
      </svg>
    `,
    tee: `
      <svg viewBox="0 0 32 32" role="img" aria-label="Light layer">
        <path d="M11 7h10l5 5-3 4-2-2v13H11V14l-2 2-3-4 5-5z" fill="currentColor" opacity="0.18" />
        <path d="M11 7h10l5 5-3 4-2-2v13H11V14l-2 2-3-4 5-5zM13 8c.8 1.8 1.8 2.7 3 2.7s2.2-.9 3-2.7" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2.2" />
      </svg>
    `,
  };

  return icons[type] ?? icons.hoodie;
}

function getWeatherIcon(type) {
  const icons = {
    sun: { slug: "clear-day", label: "Sunny" },
    partly: { slug: "partly-cloudy-day", label: "Partly cloudy" },
    cloud: { slug: "overcast-day", label: "Cloudy" },
    fog: { slug: "fog-day", label: "Fog" },
    rain: { slug: "rain", label: "Rain" },
    snow: { slug: "snow", label: "Snow" },
    storm: { slug: "thunderstorms-day-rain", label: "Thunderstorms" },
  };
  const icon = icons[type] ?? icons.partly;

  return `
    <img
      class="weather-icon-img"
      src="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/${icon.slug}.svg"
      alt="${icon.label}"
      loading="eager"
      decoding="async"
    />
  `;
}

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("error", isError);
}

function setSearchLoading(isLoading) {
  const button = weatherForm.querySelector(".search-button");
  button.disabled = isLoading;
  button.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m21 21-4.7-4.7" />
      <circle cx="11" cy="11" r="7" />
    </svg>
    ${isLoading ? "Loading..." : "Forecast"}
  `;
}

function setLocationLoading(isLoading) {
  locationButton.disabled = isLoading;
  locationButton.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
    ${isLoading ? "Locating..." : "Use my location"}
  `;
}
