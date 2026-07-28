import {
  comfort,
  isCurrentRequest,
  localizedPlaceLabels,
  rainTiming,
  toggleSavedPlace,
  weatherAlerts,
  weatherType
} from "./logic.mjs";

const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODER_URL = "https://geocoding-api.open-meteo.com/v1/search";
const SAVED_PLACES_KEY = "breezo-saved";
const LAST_PLACE_KEY = "breezo-last-place";

const state = {
  language: readStorage("breezo-language") || "en",
  unit: readStorage("breezo-unit") || "celsius",
  place: null,
  weather: null,
  requestId: 0,
  statusKey: null,
  fetchedAt: null
};

const copy = {
  en: {
    searchLabel: "Search a city", search: "Search a city", welcome: "Weather that fits your day",
    welcomeCopy: "Search a city or use your location to get started.", humidity: "Humidity", wind: "Wind",
    rain: "Rain", rainNow: "Rain now", uv: "UV index", todaysKit: "Today's kit", comfort: "Comfort", sport: "Sport",
    outlook: "Next 10 days", today: "Today", hourlyTab: "Hourly", tenDay: "10 days", rainOutlook: "Rain outlook",
    feels: "Feels like", save: "Save city", unsave: "Saved", loading: "Getting the forecast...",
    locationError: "We could not get your location.", searchError: "City not found. Try another name.",
    current: "Current location", lastLocation: "Last location", indoor: "Indoor", outdoor: "Outdoor", clear: "Clear", partly: "Partly cloudy",
    cloudy: "Cloudy", fog: "Foggy", rainCondition: "Rain", snow: "Snow", storm: "Storm",
    kitUmbrella: "Umbrella", kitSunscreen: "Sunscreen", kitSunglasses: "Sunglasses", kitJacket: "Light jacket",
    kitCoat: "Warm coat", kitTee: "T-shirt", kitCopyUmbrella: "Rain is likely today.",
    kitCopySunscreen: "Strong sun is expected.", kitCopySunglasses: "Bright skies ahead.",
    kitCopyJacket: "A layer will be useful.", kitCopyCoat: "Keep warm outside.",
    kitCopyTee: "Comfortable for light layers.", balanced: "Balanced", coldBite: "Cold bite", chilly: "Chilly",
    warm: "Warm feel", highHeat: "Heat stress", humidWarm: "Humid warm", stickyWarm: "Sticky warm",
    dampAir: "Damp air", dampChill: "Damp chill", stickyAir: "Sticky air", oppressive: "Oppressive",
    dryAir: "Dry air", dryChill: "Dry chill", comfortBalanced: "Comfortable overall.",
    comfortDamp: "Humidity makes it feel heavier.", comfortDry: "The air feels dry.",
    comfortCold: "Cool air calls for a layer.", comfortHot: "Take it easy in the heat.",
    sportIndoor: "Better for indoor plans.", sportOutdoor: "Good conditions for being outside."
  },
  zh: {
    searchLabel: "搜索城市", search: "搜索城市", welcome: "适合你今天的天气", welcomeCopy: "搜索城市或使用当前位置开始。",
    humidity: "湿度", wind: "风速", rain: "降雨", rainNow: "当前降雨", uv: "紫外线", todaysKit: "今日装备", comfort: "舒适度",
    sport: "运动", outlook: "未来 10 天", today: "今天", hourlyTab: "逐小时", tenDay: "10 天", rainOutlook: "降雨提示",
    feels: "体感", save: "收藏城市", unsave: "已收藏", loading: "正在获取天气...", locationError: "无法获取当前位置。",
    searchError: "找不到这个城市，请换个名称。", current: "当前位置", lastLocation: "上次位置", indoor: "室内", outdoor: "户外",
    clear: "晴朗", partly: "局部多云", cloudy: "多云", fog: "有雾", rainCondition: "有雨", snow: "下雪", storm: "雷暴",
    kitUmbrella: "雨伞", kitSunscreen: "防晒霜", kitSunglasses: "太阳镜", kitJacket: "薄外套", kitCoat: "保暖外套",
    kitTee: "短袖", kitCopyUmbrella: "今天可能会下雨。", kitCopySunscreen: "紫外线较强。",
    kitCopySunglasses: "阳光明亮。", kitCopyJacket: "带一件外套会更舒服。", kitCopyCoat: "外出注意保暖。",
    kitCopyTee: "轻便穿着即可。", balanced: "体感平衡", coldBite: "冷感明显", chilly: "偏凉", warm: "偏暖",
    highHeat: "高温", humidWarm: "湿热", stickyWarm: "湿热", dampAir: "潮湿", dampChill: "湿冷", stickyAir: "潮湿",
    oppressive: "闷热", dryAir: "空气偏干", dryChill: "干冷", comfortBalanced: "整体感觉舒适。",
    comfortDamp: "湿度让体感更重。", comfortDry: "空气较干。", comfortCold: "偏凉，建议加一层。",
    comfortHot: "高温时减少剧烈活动。", sportIndoor: "更适合室内活动。", sportOutdoor: "适合户外活动。"
  }
};

const forecastCopy = {
  en: {
    hourly: "Next 12 hours", hourlyForecast: "Hourly forecast", outlook: "Next 10 days", now: "Now",
    rainAt: "Rain from {time}", dryHours: "No rain expected", stormAlert: "Storm risk in the next 12 hours",
    heatAlert: "High heat today", rainAlert: "Heavy rain likely", uvAlert: "High UV today", updated: "Updated {time}",
    refresh: "Refresh forecast"
  },
  zh: {
    hourly: "未来 12 小时", hourlyForecast: "逐小时预报", outlook: "未来 10 天", now: "现在",
    rainAt: "{time} 起可能有雨", dryHours: "未来暂无降雨", stormAlert: "未来 12 小时可能有雷暴",
    heatAlert: "今天高温", rainAlert: "可能有强降雨", uvAlert: "今天紫外线强", updated: "更新于 {time}",
    refresh: "刷新天气"
  }
};

const uiCopy = {
  en: {
    language: "Language", switchUnit: "Switch temperature unit", useLocation: "Use current location",
    searchWeather: "Search weather", savedCities: "Saved cities", weatherDetails: "Weather details",
    apiError: "Weather data is unavailable. Please try again.", storageError: "Forecast loaded, but this browser could not save your last location.",
    geoUnsupported: "Your browser does not support location."
  },
  zh: {
    language: "语言", switchUnit: "切换温度单位", useLocation: "使用当前位置", searchWeather: "搜索天气",
    savedCities: "已收藏城市", weatherDetails: "天气详情", apiError: "天气数据暂时不可用，请重试。", storageError: "天气已加载，但浏览器无法保存上次位置。",
    geoUnsupported: "你的浏览器不支持定位。"
  }
};

const WEATHER_ICON_SLUGS = {
  clear: "clear-day",
  partly: "partly-cloudy-day",
  cloudy: "overcast-day",
  fog: "fog-day",
  rain: "rain",
  snow: "snow",
  storm: "thunderstorms-day-rain"
};

const DAMP_COMFORT_LEVELS = new Set(["dampAir", "dampChill", "humidWarm", "stickyWarm", "stickyAir", "oppressive"]);
const DRY_COMFORT_LEVELS = new Set(["dryAir", "dryChill"]);
const COLD_COMFORT_LEVELS = new Set(["coldBite", "chilly"]);
const ALERT_SYMBOLS = { stormAlert: "ϟ", heatAlert: "☀", rainAlert: "☂", uvAlert: "◉" };

const $ = (selector) => document.querySelector(selector);
const locale = () => state.language === "zh" ? "zh-CN" : "en-US";
const t = (key) => uiCopy[state.language][key] || forecastCopy[state.language][key] || copy[state.language][key] || key;

function syncSystemTheme() {
  const darkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.dataset.theme = darkMode ? "dark" : "light";
}

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
syncSystemTheme();
if (systemTheme.addEventListener) {
  systemTheme.addEventListener("change", syncSystemTheme);
} else {
  systemTheme.addListener(syncSystemTheme);
}

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function setStatus(key = null) {
  state.statusKey = key;
  $("#status").textContent = key ? t(key) : "";
}

function weatherIcon(type) {
  const label = t(type === "rain" ? "rainCondition" : type);
  const slug = WEATHER_ICON_SLUGS[type] || WEATHER_ICON_SLUGS.partly;
  const fallback = { clear: "☀", partly: "⛅", cloudy: "☁", fog: "≋", rain: "☂", snow: "❄", storm: "ϟ" }[type] || "⛅";
  return `<img class="weather-icon-img" src="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/${slug}.svg" alt="${label}" data-fallback="${fallback}" loading="eager" decoding="async" />`;
}

function installIconFallbacks(root) {
  root.querySelectorAll("img.weather-icon-img").forEach((image) => {
    image.addEventListener("error", () => {
      const fallback = document.createElement("span");
      fallback.className = "weather-icon-fallback";
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", image.alt);
      fallback.textContent = image.dataset.fallback;
      image.replaceWith(fallback);
    }, { once: true });
  });
}

function comfortDescription(level) {
  if (DAMP_COMFORT_LEVELS.has(level)) return t("comfortDamp");
  if (DRY_COMFORT_LEVELS.has(level)) return t("comfortDry");
  if (COLD_COMFORT_LEVELS.has(level)) return t("comfortCold");
  if (level === "highHeat") return t("comfortHot");
  return t("comfortBalanced");
}

function formatTemp(value) {
  const temperature = state.unit === "fahrenheit" ? value * 9 / 5 + 32 : value;
  return `${Math.round(temperature)}°`;
}

function formatWind(value) {
  const speed = state.unit === "fahrenheit" ? value / 1.60934 : value;
  const unit = state.unit === "fahrenheit" ? "mph" : "km/h";
  return `${Math.round(speed)} ${unit}`;
}

function formatHour(date) {
  return new Intl.DateTimeFormat(locale(), { hour: "numeric" }).format(new Date(date));
}

function formatForecastDay(date, index) {
  if (index === 0) return t("today");
  const options = state.language === "zh"
    ? { month: "numeric", day: "numeric", weekday: "short" }
    : { weekday: "short", day: "numeric" };
  return new Intl.DateTimeFormat(locale(), options).format(new Date(`${date}T12:00:00`));
}

function phrase(key, value) {
  return t(key).replace("{time}", value);
}

function applyLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  $("#city-search").placeholder = t("search");
  $("#city-search").setAttribute("aria-label", t("searchLabel"));

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", t(element.dataset.i18nAria));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", t(element.dataset.i18nTitle));
  });
  document.querySelectorAll("[data-language]").forEach((button) => {
    const isActive = button.dataset.language === state.language;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  $("#unit-toggle").textContent = state.unit === "celsius" ? "C" : "F";
  if (state.statusKey) setStatus(state.statusKey);
}

async function getWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,uv_index",
    hourly: "temperature_2m,precipitation,precipitation_probability,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max",
    timezone: "auto",
    forecast_days: "10",
    forecast_hours: "24"
  });
  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) throw new Error("api");
  return response.json();
}

async function searchCity(query, language = state.language) {
  const params = new URLSearchParams({ name: query, count: "1", language, format: "json" });
  const response = await fetch(`${GEOCODER_URL}?${params}`);
  if (!response.ok) throw new Error("api");

  const data = await response.json();
  if (!data.results?.[0]) throw new Error("search");
  return data.results[0];
}

async function loadPlace(place, requestId = ++state.requestId) {
  setStatus("loading");
  try {
    const weather = await getWeather(place.latitude, place.longitude);
    if (!isCurrentRequest(requestId, state.requestId)) return;

    state.place = place;
    state.weather = weather;
    state.fetchedAt = new Date();
    const savedLastPlace = writeStorage(LAST_PLACE_KEY, JSON.stringify(persistedPlace(place)));
    render();
    setStatus(savedLastPlace ? null : "storageError");
  } catch {
    if (isCurrentRequest(requestId, state.requestId)) setStatus("apiError");
  }
}

function savedPlaces() {
  try {
    return JSON.parse(readStorage(SAVED_PLACES_KEY) || "[]");
  } catch {
    return [];
  }
}

function lastPlace() {
  try {
    const place = JSON.parse(readStorage(LAST_PLACE_KEY) || "null");
    return place ? persistedPlace(place) : null;
  } catch {
    return null;
  }
}

function persistedPlace(place) {
  return {
    ...place,
    isCurrentLocation: false,
    isLastLocation: Boolean(place.isCurrentLocation || place.isLastLocation)
  };
}

function isSaved() {
  return savedPlaces().some((place) => place.latitude === state.place?.latitude && place.longitude === state.place?.longitude);
}

function toggleSaved() {
  const nextSavedPlaces = toggleSavedPlace(savedPlaces(), persistedPlace(state.place));
  if (!writeStorage(SAVED_PLACES_KEY, JSON.stringify(nextSavedPlaces))) {
    setStatus("storageError");
    return;
  }
  render();
}

function placeLabel(place) {
  const localized = place.labels?.[state.language];
  const name = place.isCurrentLocation ? t("current") : place.isLastLocation ? t("lastLocation") : localized?.name || place.name;
  const country = localized?.country || place.country;
  return country ? `${name}, ${country}` : name;
}

function renderSavedCities() {
  const section = $("#saved-cities");
  section.replaceChildren();
  section.hidden = !state.place;
  section.setAttribute("aria-label", t("savedCities"));
  if (!state.place) return;

  const saveButton = document.createElement("button");
  saveButton.className = "save-city";
  saveButton.type = "button";
  saveButton.textContent = isSaved() ? t("unsave") : t("save");
  saveButton.setAttribute("aria-pressed", String(isSaved()));
  saveButton.addEventListener("click", toggleSaved);
  section.append(saveButton);

  savedPlaces().forEach((place) => {
    const cityButton = document.createElement("button");
    cityButton.className = "saved-city-chip";
    cityButton.type = "button";
    cityButton.textContent = place.isCurrentLocation ? t("current") : place.isLastLocation ? t("lastLocation") : place.labels?.[state.language]?.name || place.name;
    cityButton.addEventListener("click", () => loadPlace(place));
    section.append(cityButton);
  });
}

function upcomingHours() {
  const hourly = state.weather.hourly;
  const currentTime = new Date(state.weather.current.time).getTime();
  const firstFutureIndex = Math.max(0, hourly.time.findIndex((time) => new Date(time).getTime() > currentTime));
  const currentHour = {
    time: state.weather.current.time,
    temperature: state.weather.current.temperature_2m,
    precipitation: state.weather.current.precipitation,
    precipitationProbability: 0,
    weatherCode: state.weather.current.weather_code,
    windSpeed: state.weather.current.wind_speed_10m,
    isCurrent: true
  };

  return [currentHour, ...hourly.time.slice(firstFutureIndex, firstFutureIndex + 11).map((time, offset) => {
    const index = firstFutureIndex + offset;
    return {
      time,
      temperature: hourly.temperature_2m[index],
      precipitation: hourly.precipitation[index],
      precipitationProbability: hourly.precipitation_probability[index],
      weatherCode: hourly.weather_code[index],
      windSpeed: hourly.wind_speed_10m[index]
    };
  })];
}

function renderAlerts(root, hours) {
  const alerts = weatherAlerts({
    current: {
      weatherCode: state.weather.current.weather_code,
      apparentTemperature: state.weather.current.apparent_temperature,
      uvIndex: state.weather.current.uv_index
    },
    dailyMax: state.weather.daily.temperature_2m_max[0],
    dailyUvMax: state.weather.daily.uv_index_max?.[0] ?? state.weather.current.uv_index,
    hours
  });
  const section = root.querySelector("#alerts");
  section.hidden = alerts.length === 0;

  alerts.forEach((alert) => {
    const item = document.createElement("div");
    item.className = `alert alert-${alert.replace("Alert", "")}`;
    item.innerHTML = `<strong>${ALERT_SYMBOLS[alert]}</strong><span>${t(alert)}</span>`;
    section.append(item);
  });
}

function kitRecommendation(type, current) {
  if (["rain", "storm"].includes(type) || current.precipitation >= 0.5) return ["kitUmbrella", "kitCopyUmbrella"];
  if (current.uv_index >= 8 && ["clear", "partly"].includes(type)) return ["kitSunscreen", "kitCopySunscreen"];
  if (current.apparent_temperature <= 10) return ["kitCoat", "kitCopyCoat"];
  if (current.apparent_temperature <= 17 || current.wind_speed_10m >= 28) return ["kitJacket", "kitCopyJacket"];
  if (current.apparent_temperature >= 27 && ["clear", "partly"].includes(type)) return ["kitSunglasses", "kitCopySunglasses"];
  return ["kitTee", "kitCopyTee"];
}

function renderHourlyForecast(root, hours) {
  const hourly = root.querySelector("#hourly");
  hourly.setAttribute("aria-label", t("hourlyForecast"));

  hours.forEach((hour, index) => {
    const chance = Math.round(hour.precipitationProbability);
    const rainChance = chance >= 20 ? `${chance}%` : "";
    const windSpeed = formatWind(hour.windSpeed);
    const card = document.createElement("article");
    card.innerHTML = `
      <p>${hour.isCurrent ? t("now") : formatHour(hour.time)}</p>
      <span class="hourly-icon">${weatherIcon(weatherType(hour.weatherCode))}</span>
      <strong>${formatTemp(hour.temperature)}</strong>
      <small class="hourly-rain">${rainChance}</small>
      <small class="hourly-wind" aria-label="${t("wind")} ${windSpeed}" title="${t("wind")} ${windSpeed}">${windSpeed}</small>
      <i class="rain-meter" style="--rain:${Math.max(5, chance)}%" aria-hidden="true"></i>
    `;
    hourly.append(card);
  });
}

function renderDailyForecast(root) {
  const forecast = root.querySelector("#forecast");
  const lows = state.weather.daily.temperature_2m_min;
  const highs = state.weather.daily.temperature_2m_max;
  const scaleLow = Math.min(...lows);
  const scaleRange = Math.max(1, Math.max(...highs) - scaleLow);

  state.weather.daily.time.forEach((date, index) => {
    const type = weatherType(state.weather.daily.weather_code[index]);
    const low = lows[index];
    const high = highs[index];
    const rangeStart = ((low - scaleLow) / scaleRange) * 100;
    const rangeWidth = Math.max(8, ((high - low) / scaleRange) * 100);
    const chance = Math.round(state.weather.daily.precipitation_probability_max[index]);
    const row = document.createElement("article");
    row.className = "forecast-row";
    row.innerHTML = `
      <p class="forecast-day">${formatForecastDay(date, index)}</p>
      <span class="forecast-icon">${weatherIcon(type)}</span>
      <div class="forecast-detail">
        <p class="forecast-condition">${t(type === "rain" ? "rainCondition" : type)}</p>
        <small class="forecast-rain">${chance}%</small>
      </div>
      <div class="forecast-temperature">
        <small>${formatTemp(low)}</small>
        <i aria-hidden="true"><b style="--range-start:${rangeStart}%;--range-width:${rangeWidth}%"></b></i>
        <strong>${formatTemp(high)}</strong>
      </div>
    `;
    forecast.append(row);
  });
}

function render() {
  applyLanguage();
  if (!state.weather || !state.place) return;

  const template = $("#weather-template").content.cloneNode(true);
  const current = state.weather.current;
  const type = weatherType(current.weather_code);
  const comfortLevel = comfort(current.temperature_2m, current.apparent_temperature, current.relative_humidity_2m);
  const [kitTitle, kitCopy] = kitRecommendation(type, current);
  const sport = ["storm", "snow", "fog", "rain"].includes(type) || current.uv_index >= 9 || current.apparent_temperature >= 34 || current.apparent_temperature < 10 || current.wind_speed_10m >= 38 ? "indoor" : "outdoor";

  template.querySelector("#place").textContent = placeLabel(state.place);
  template.querySelector("#condition").textContent = t(type === "rain" ? "rainCondition" : type);
  template.querySelector("#condition-icon").innerHTML = weatherIcon(type);
  template.querySelector("#summary").textContent = `${t("feels")} ${formatTemp(current.apparent_temperature)} · ${t(comfortLevel)}`;
  template.querySelector("#temperature").textContent = formatTemp(current.temperature_2m).replace("°", "");
  template.querySelector("#temperature-unit").textContent = state.unit === "fahrenheit" ? "°F" : "°C";
  template.querySelector("#feels-like").textContent = `${t("feels")} ${formatTemp(current.apparent_temperature)}`;
  template.querySelector("#humidity").textContent = `${Math.round(current.relative_humidity_2m)}%`;
  template.querySelector("#wind").textContent = formatWind(current.wind_speed_10m);
  template.querySelector("#rain").textContent = `${current.precipitation.toFixed(1)} mm`;
  template.querySelector("#uv").textContent = Math.round(current.uv_index);
  template.querySelector("#kit-title").textContent = t(kitTitle);
  template.querySelector("#kit-copy").textContent = t(kitCopy);
  template.querySelector("#comfort-title").textContent = t(comfortLevel);
  template.querySelector("#comfort-copy").textContent = comfortDescription(comfortLevel);
  template.querySelector("#sport-title").textContent = t(sport);
  template.querySelector("#sport-copy").textContent = t(sport === "indoor" ? "sportIndoor" : "sportOutdoor");

  const hours = upcomingHours();
  const rainIndex = rainTiming(hours);
  const rainMessage = rainIndex >= 0 ? phrase("rainAt", formatHour(hours[rainIndex].time)) : t("dryHours");
  template.querySelector("#rain-timing").textContent = rainMessage;
  template.querySelector("#rain-outlook").textContent = rainMessage;

  const root = $("#weather");
  root.replaceChildren(template);
  applyLanguage();
  root.querySelector("#rain").previousElementSibling.textContent = t("rainNow");
  root.querySelector(".metrics").setAttribute("aria-label", t("weatherDetails"));
  renderHourlyForecast(root, hours);
  renderDailyForecast(root);
  renderAlerts(root, hours);
  renderSavedCities();
  installIconFallbacks(root);

  root.querySelector("#updated-at").textContent = phrase(
    "updated",
    new Intl.DateTimeFormat(locale(), { hour: "numeric", minute: "2-digit" }).format(state.fetchedAt)
  );
  root.querySelector("#refresh-button").addEventListener("click", () => loadPlace(state.place));
}

async function handleSearch() {
  const query = $("#city-search").value.trim();
  if (!query) return;

  const requestId = ++state.requestId;
  const alternateLanguage = state.language === "en" ? "zh" : "en";
  try {
    const [place, alternatePlace] = await Promise.all([
      searchCity(query),
      searchCity(query, alternateLanguage).catch(() => null)
    ]);
    if (!isCurrentRequest(requestId, state.requestId)) return;

    place.labels = localizedPlaceLabels(place, state.language, alternateLanguage, alternatePlace);
    await loadPlace(place, requestId);
  } catch (error) {
    if (isCurrentRequest(requestId, state.requestId)) setStatus(error.message === "search" ? "searchError" : "apiError");
  }
}

function handleLocation() {
  if (!navigator.geolocation) {
    setStatus("geoUnsupported");
    return;
  }

  const requestId = ++state.requestId;
  navigator.geolocation.getCurrentPosition(
    (position) => {
      if (!isCurrentRequest(requestId, state.requestId)) return;
      loadPlace({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        name: t("current"),
        isCurrentLocation: true
      }, requestId);
    },
    () => {
      if (isCurrentRequest(requestId, state.requestId)) setStatus("locationError");
    },
    { enableHighAccuracy: false, timeout: 10000 }
  );
}

function toggleUnit() {
  state.unit = state.unit === "celsius" ? "fahrenheit" : "celsius";
  if (!writeStorage("breezo-unit", state.unit)) setStatus("storageError");
  render();
}

function changeLanguage(language) {
  state.language = language;
  if (!writeStorage("breezo-language", language)) setStatus("storageError");
  render();
}

$("#search-button").addEventListener("click", handleSearch);
$("#city-search").addEventListener("keydown", (event) => {
  if (event.key === "Enter") handleSearch();
});
$("#location-button").addEventListener("click", handleLocation);
$("#unit-toggle").addEventListener("click", toggleUnit);
document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => changeLanguage(button.dataset.language));
});

applyLanguage();

const previousPlace = lastPlace();
if (previousPlace?.latitude != null && previousPlace?.longitude != null) {
  loadPlace(previousPlace);
}
