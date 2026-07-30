import {
  comfort,
  isCurrentRequest,
  localizedPlaceLabels,
  rainTiming,
  temperatureHue,
  toggleSavedPlace,
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
let lastForegroundRefreshAt = 0;
let suggestionTimer = null;
let suggestionRequestId = 0;
let suggestions = [];
let activeSuggestionIndex = -1;

const copy = {
  en: {
    searchLabel: "Search a city", search: "Search a city", welcome: "Weather that fits your day",
    welcomeCopy: "Search a city or use your location to get started.", humidity: "Humidity", wind: "Wind",
    rain: "Rain", rainNow: "Rain now", uv: "UV index",
    outlook: "Next 10 days", today: "Today", hourlyTab: "Hourly", tenDay: "10 days", briefTitle: "Today at a glance",
    feels: "Feels like", save: "Save city", unsave: "Saved", loading: "Getting the forecast...",
    locationError: "We could not get your location.", searchError: "City not found. Try another name.",
    current: "Current location", lastLocation: "Last location", clear: "Clear", partly: "Partly cloudy",
    cloudy: "Cloudy", fog: "Foggy", rainCondition: "Rain", snow: "Snow", storm: "Storm",
    balanced: "Balanced", coldBite: "Cold bite", chilly: "Chilly",
    warm: "Warm feel", highHeat: "Heat stress", humidWarm: "Humid warm", stickyWarm: "Sticky warm",
    dampAir: "Damp air", dampChill: "Damp chill", stickyAir: "Sticky air", oppressive: "Oppressive",
    dryAir: "Dry air", dryChill: "Dry chill",
    briefRainEasing: "Showers are around now, then should ease by {time}.",
    briefRainThroughDay: "Showers are likely through much of the day.", briefRainLater: "Showers are most likely around {time}.",
    briefStorm: "Thunderstorms are possible later today.", briefBright: "A dry day overall, with some sunshine.",
    briefCloudy: "Mostly cloudy but dry through the day.", briefFog: "Fog may linger early, then conditions should improve.",
    briefSnow: "Snow is possible, so allow extra time to travel.", briefTemperature: "Temperatures will reach {high} today.",
    briefHighUv: "UV will be high, so use sun protection.", briefHeat: "It will be hot, so take it easy outdoors.",
    briefBreezy: "It will be breezy at times.", briefKitUmbrella: "Keep an umbrella handy", briefKitSunscreen: "Use sunscreen",
    briefKitSunglasses: "Sunglasses will help", briefKitJacket: "Take a light jacket", briefKitCoat: "Take a warm coat",
    briefKitTee: "A T-shirt will be comfortable", briefPlan: "{kit}; {sport}",
    briefSportIndoor: "keep your sport plans indoors.", briefSportOutdoor: "outdoor sport looks good."
  },
  zh: {
    searchLabel: "搜索城市", search: "搜索城市", welcome: "适合你今天的天气", welcomeCopy: "搜索城市或使用当前位置开始。",
    humidity: "湿度", wind: "风速", rain: "降雨", rainNow: "当前降雨", uv: "紫外线",
    outlook: "未来 10 天", today: "今天", hourlyTab: "逐小时", tenDay: "10 天", briefTitle: "今日天气",
    feels: "体感", save: "收藏城市", unsave: "已收藏", loading: "正在获取天气...", locationError: "无法获取当前位置。",
    searchError: "找不到这个城市，请换个名称。", current: "当前位置", lastLocation: "上次位置",
    clear: "晴朗", partly: "局部多云", cloudy: "多云", fog: "有雾", rainCondition: "有雨", snow: "下雪", storm: "雷暴",
    balanced: "体感平衡", coldBite: "冷感明显", chilly: "偏凉", warm: "偏暖",
    highHeat: "高温", humidWarm: "湿热", stickyWarm: "湿热", dampAir: "潮湿", dampChill: "湿冷", stickyAir: "潮湿",
    oppressive: "闷热", dryAir: "空气偏干", dryChill: "干冷",
    briefRainEasing: "当前有阵雨，预计 {time} 前后减弱。", briefRainThroughDay: "今天大部分时间可能有阵雨。", briefRainLater: "预计 {time} 前后有阵雨。",
    briefStorm: "今天晚些时候可能出现雷暴。", briefBright: "今天整体干爽，间有阳光。", briefCloudy: "今天以多云为主，天气干燥。",
    briefFog: "清晨可能有雾，之后天气会逐渐好转。", briefSnow: "可能有降雪，出行预留更多时间。", briefTemperature: "气温最高约 {high}。",
    briefHighUv: "紫外线较强，外出注意防晒。", briefHeat: "天气较热，户外活动注意休息。",
    briefBreezy: "部分时段风会比较大。", briefKitUmbrella: "带上雨伞", briefKitSunscreen: "做好防晒",
    briefKitSunglasses: "带上太阳镜", briefKitJacket: "带一件薄外套", briefKitCoat: "穿保暖外套",
    briefKitTee: "短袖会很舒适", briefPlan: "{kit}，{sport}",
    briefSportIndoor: "运动更适合安排在室内。", briefSportOutdoor: "适合安排户外运动。"
  }
};

const forecastCopy = {
  en: {
    hourly: "Next 24 hours", hourlyForecast: "Hourly forecast", outlook: "Next 10 days", now: "Now",
    rainAt: "Rain from {time}", dryHours: "No rain expected", updated: "Updated {time}",
    refresh: "Refresh forecast"
  },
  zh: {
    hourly: "未来 24 小时", hourlyForecast: "逐小时预报", outlook: "未来 10 天", now: "现在",
    rainAt: "{time} 起可能有雨", dryHours: "未来暂无降雨", updated: "更新于 {time}",
    refresh: "刷新天气"
  }
};

const uiCopy = {
  en: {
    language: "Language", switchUnit: "Switch temperature unit", useLocation: "Use current location",
    searchWeather: "Search weather", savedCities: "Saved cities", weatherDetails: "Weather details",
    removeCity: "Remove {city}",
    apiError: "Weather data is unavailable. Please try again.", storageError: "Forecast loaded, but this browser could not save your last location.",
    geoUnsupported: "Your browser does not support location."
  },
  zh: {
    language: "语言", switchUnit: "切换温度单位", useLocation: "使用当前位置", searchWeather: "搜索天气",
    savedCities: "已收藏城市", weatherDetails: "天气详情", apiError: "天气数据暂时不可用，请重试。", storageError: "天气已加载，但浏览器无法保存上次位置。",
    removeCity: "移除{city}",
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

const BRIEF_KIT_KEYS = {
  kitUmbrella: "briefKitUmbrella",
  kitSunscreen: "briefKitSunscreen",
  kitSunglasses: "briefKitSunglasses",
  kitJacket: "briefKitJacket",
  kitCoat: "briefKitCoat",
  kitTee: "briefKitTee"
};

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

function formatTemp(value) {
  const temperature = state.unit === "fahrenheit" ? value * 9 / 5 + 32 : value;
  return `${Math.round(temperature)}°`;
}

function formatTempWithUnit(value) {
  return `${formatTemp(value)}${state.unit === "fahrenheit" ? "F" : "C"}`;
}

function formatWind(value) {
  const speed = state.unit === "fahrenheit" ? value / 1.60934 : value;
  const unit = state.unit === "fahrenheit" ? "mph" : "km/h";
  return `${Math.round(speed)} ${unit}`;
}

function temperatureColor(value, lightness = 52) {
  return `hsl(${temperatureHue(value)} 78% ${lightness}%)`;
}

function formatHour(date) {
  const hour = Number(date.slice(11, 13));
  return state.language === "zh" ? `${hour}时` : `${hour % 12 || 12} ${hour < 12 ? "AM" : "PM"}`;
}

function formatForecastDay(date, index) {
  if (index === 0) return t("today");
  const options = state.language === "zh"
    ? { month: "numeric", day: "numeric", weekday: "short" }
    : { weekday: "short", day: "numeric" };
  return new Intl.DateTimeFormat(locale(), options).format(new Date(`${date}T12:00:00`));
}

function phrase(key, values) {
  const replacements = typeof values === "object" ? values : { time: values };
  return Object.entries(replacements).reduce((text, [name, value]) => text.replace(`{${name}}`, value), t(key));
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
  const response = await fetch(`${API_URL}?${params}`, { cache: "no-store" });
  if (!response.ok) throw new Error("api");
  return response.json();
}

async function searchCities(query, language = state.language, count = 1) {
  const params = new URLSearchParams({ name: query, count: String(count), language, format: "json" });
  const response = await fetch(`${GEOCODER_URL}?${params}`);
  if (!response.ok) throw new Error("api");

  const data = await response.json();
  if (!data.results?.length) throw new Error("search");
  return data.results;
}

async function searchCity(query, language = state.language) {
  return (await searchCities(query, language))[0];
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

function removeSavedPlace(place) {
  const nextSavedPlaces = toggleSavedPlace(savedPlaces(), persistedPlace(place));
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
    const cityName = place.isCurrentLocation ? t("current") : place.isLastLocation ? t("lastLocation") : place.labels?.[state.language]?.name || place.name;
    const chip = document.createElement("span");
    chip.className = "saved-city-chip";
    const cityButton = document.createElement("button");
    cityButton.className = "saved-city-label";
    cityButton.type = "button";
    cityButton.textContent = cityName;
    cityButton.addEventListener("click", () => loadPlace(place));

    const removeButton = document.createElement("button");
    removeButton.className = "saved-city-remove";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", phrase("removeCity", { city: cityName }));
    removeButton.setAttribute("title", phrase("removeCity", { city: cityName }));
    removeButton.addEventListener("click", () => removeSavedPlace(place));

    chip.append(cityButton, removeButton);
    section.append(chip);
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

  return [currentHour, ...hourly.time.slice(firstFutureIndex, firstFutureIndex + 23).map((time, offset) => {
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

function weatherBrief(type, current, hours, kit, sport) {
  const high = state.weather.daily.temperature_2m_max[0];
  const dailyUv = state.weather.daily.uv_index_max?.[0] ?? current.uv_index;
  const wetHours = hours.map((hour, index) => ({ hour, index })).filter(({ hour }) => hour.precipitation >= 0.2 || hour.precipitationProbability >= 50);
  const hasStorm = hours.some(hour => weatherType(hour.weatherCode) === "storm");
  const sentences = [];

  if (hasStorm) sentences.push(t("briefStorm"));
  else if (wetHours.length) {
    const firstWet = wetHours[0].index;
    const lastWet = wetHours.at(-1).index;
    if (firstWet === 0 && lastWet <= 5) sentences.push(phrase("briefRainEasing", { time: formatHour(hours[lastWet].time) }));
    else if (firstWet === 0) sentences.push(t("briefRainThroughDay"));
    else sentences.push(phrase("briefRainLater", { time: formatHour(hours[firstWet].time) }));
  } else if (["clear", "partly"].includes(type)) sentences.push(t("briefBright"));
  else if (type === "cloudy") sentences.push(t("briefCloudy"));
  else if (type === "fog") sentences.push(t("briefFog"));
  else if (type === "snow") sentences.push(t("briefSnow"));

  sentences.push(phrase("briefTemperature", { high: formatTempWithUnit(high) }));
  if (dailyUv >= 8) sentences.push(t("briefHighUv"));
  else if (high >= 34 || current.apparent_temperature >= 34) sentences.push(t("briefHeat"));
  else if (Math.max(...hours.map(hour => hour.windSpeed)) >= 28) sentences.push(t("briefBreezy"));
  sentences.push(phrase("briefPlan", {
    kit: t(BRIEF_KIT_KEYS[kit]),
    sport: t(sport === "indoor" ? "briefSportIndoor" : "briefSportOutdoor")
  }));
  return sentences.join(state.language === "zh" ? "" : " ");
}

function kitRecommendation(type, current) {
  if (["rain", "storm"].includes(type) || current.precipitation >= 0.5) return "kitUmbrella";
  if (current.uv_index >= 8 && ["clear", "partly"].includes(type)) return "kitSunscreen";
  if (current.apparent_temperature <= 10) return "kitCoat";
  if (current.apparent_temperature <= 17 || current.wind_speed_10m >= 28) return "kitJacket";
  if (current.apparent_temperature >= 27 && ["clear", "partly"].includes(type)) return "kitSunglasses";
  return "kitTee";
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
      <div class="forecast-weather" aria-label="${t(type === "rain" ? "rainCondition" : type)}, ${chance}%">
        <span class="forecast-icon" aria-hidden="true">${weatherIcon(type)}</span>
        <small class="forecast-rain${chance <= 20 ? " is-low" : ""}">${chance}%</small>
      </div>
      <div class="forecast-temperature">
        <small>${formatTemp(low)}</small>
        <i aria-hidden="true"><b style="--range-start:${rangeStart}%;--range-width:${rangeWidth}%;--range-low-color-light:${temperatureColor(low)};--range-high-color-light:${temperatureColor(high)};--range-low-color-dark:${temperatureColor(low, 66)};--range-high-color-dark:${temperatureColor(high, 66)}"></b></i>
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
  const kitTitle = kitRecommendation(type, current);
  const sport = ["storm", "snow", "fog", "rain"].includes(type) || current.uv_index >= 9 || current.apparent_temperature >= 34 || current.apparent_temperature < 10 || current.wind_speed_10m >= 38 ? "indoor" : "outdoor";

  template.querySelector("#place").textContent = placeLabel(state.place);
  template.querySelector("#condition").textContent = t(type === "rain" ? "rainCondition" : type);
  template.querySelector("#condition-icon").innerHTML = weatherIcon(type);
  template.querySelector("#summary").textContent = `${t("feels")} ${formatTempWithUnit(current.apparent_temperature)} · ${t(comfortLevel)}`;
  const temperature = template.querySelector(".temperature");
  temperature.style.setProperty("--current-temperature-color-light", temperatureColor(current.temperature_2m));
  temperature.style.setProperty("--current-temperature-color-dark", temperatureColor(current.temperature_2m, 66));
  template.querySelector("#temperature").textContent = formatTemp(current.temperature_2m).replace("°", "");
  template.querySelector("#temperature-unit").textContent = state.unit === "fahrenheit" ? "°F" : "°C";
  template.querySelector("#feels-like").textContent = `${t("feels")} ${formatTemp(current.apparent_temperature)}`;
  template.querySelector("#humidity").textContent = `${Math.round(current.relative_humidity_2m)}%`;
  template.querySelector("#wind").textContent = formatWind(current.wind_speed_10m);
  template.querySelector("#rain").textContent = `${current.precipitation.toFixed(1)} mm`;
  template.querySelector("#uv").textContent = Math.round(current.uv_index);
  const hours = upcomingHours();
  const rainIndex = rainTiming(hours);
  const rainMessage = rainIndex >= 0 ? phrase("rainAt", formatHour(hours[rainIndex].time)) : t("dryHours");
  template.querySelector("#rain-timing").textContent = rainMessage;
  template.querySelector("#weather-brief").textContent = weatherBrief(type, current, hours, kitTitle, sport);

  const root = $("#weather");
  root.replaceChildren(template);
  applyLanguage();
  root.querySelector("#rain").previousElementSibling.textContent = t("rainNow");
  root.querySelector(".metrics").setAttribute("aria-label", t("weatherDetails"));
  renderHourlyForecast(root, hours);
  renderDailyForecast(root);
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
  hideSuggestions();

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

function hideSuggestions() {
  suggestionRequestId += 1;
  clearTimeout(suggestionTimer);
  suggestionTimer = null;
  suggestions = [];
  activeSuggestionIndex = -1;
  const list = $("#city-suggestions");
  list.replaceChildren();
  list.hidden = true;
  $("#city-search").setAttribute("aria-expanded", "false");
  $("#city-search").removeAttribute("aria-activedescendant");
}

function suggestionDetail(place) {
  return [place.admin1, place.country].filter((value, index, values) => value && values.indexOf(value) === index).join(", ");
}

function setActiveSuggestion(index) {
  if (!suggestions.length) return;
  activeSuggestionIndex = (index + suggestions.length) % suggestions.length;
  document.querySelectorAll(".city-suggestion").forEach((button, buttonIndex) => {
    const active = buttonIndex === activeSuggestionIndex;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  $("#city-search").setAttribute("aria-activedescendant", `city-suggestion-${activeSuggestionIndex}`);
}

async function selectSuggestion(place) {
  $("#city-search").value = place.name;
  hideSuggestions();
  const requestId = ++state.requestId;
  const alternateLanguage = state.language === "en" ? "zh" : "en";
  try {
    const alternatePlace = await searchCity(place.name, alternateLanguage).catch(() => null);
    if (!isCurrentRequest(requestId, state.requestId)) return;
    place.labels = localizedPlaceLabels(place, state.language, alternateLanguage, alternatePlace);
    await loadPlace(place, requestId);
  } catch {
    if (isCurrentRequest(requestId, state.requestId)) setStatus("apiError");
  }
}

function renderSuggestions(nextSuggestions) {
  suggestions = nextSuggestions;
  activeSuggestionIndex = -1;
  const list = $("#city-suggestions");
  list.replaceChildren();
  nextSuggestions.forEach((place, index) => {
    const button = document.createElement("button");
    button.id = `city-suggestion-${index}`;
    button.className = "city-suggestion";
    button.type = "button";
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", "false");
    const name = document.createElement("strong");
    name.textContent = place.name;
    const detail = document.createElement("span");
    detail.textContent = suggestionDetail(place);
    button.append(name, detail);
    button.addEventListener("click", () => selectSuggestion(place));
    list.append(button);
  });
  list.hidden = nextSuggestions.length === 0;
  $("#city-search").setAttribute("aria-expanded", String(nextSuggestions.length > 0));
}

function requestSuggestions() {
  const query = $("#city-search").value.trim();
  clearTimeout(suggestionTimer);
  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  const requestId = ++suggestionRequestId;
  suggestionTimer = setTimeout(async () => {
    try {
      const places = await searchCities(query, state.language, 5);
      if (requestId === suggestionRequestId) renderSuggestions(places);
    } catch {
      if (requestId === suggestionRequestId) hideSuggestions();
    }
  }, 220);
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

function refreshWhenVisible() {
  if (document.visibilityState === "hidden" || !state.place) return;
  const now = Date.now();
  if (now - lastForegroundRefreshAt < 1000) return;
  lastForegroundRefreshAt = now;
  loadPlace(state.place);
}

$("#search-button").addEventListener("click", handleSearch);
$("#city-search").addEventListener("input", requestSuggestions);
$("#city-search").addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") {
    if (suggestions.length) {
      event.preventDefault();
      setActiveSuggestion(activeSuggestionIndex + 1);
    }
  } else if (event.key === "ArrowUp") {
    if (suggestions.length) {
      event.preventDefault();
      setActiveSuggestion(activeSuggestionIndex - 1);
    }
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (activeSuggestionIndex >= 0) selectSuggestion(suggestions[activeSuggestionIndex]);
    else handleSearch();
  } else if (event.key === "Escape") {
    hideSuggestions();
  }
});
document.addEventListener("click", (event) => {
  if (!$("#search-autocomplete").contains(event.target)) hideSuggestions();
});
$("#location-button").addEventListener("click", handleLocation);
$("#unit-toggle").addEventListener("click", toggleUnit);
document.querySelectorAll("[data-language]").forEach((button) => {
  button.addEventListener("click", () => changeLanguage(button.dataset.language));
});
window.addEventListener("pageshow", refreshWhenVisible);
document.addEventListener("visibilitychange", refreshWhenVisible);

applyLanguage();

const previousPlace = lastPlace();
if (previousPlace?.latitude != null && previousPlace?.longitude != null) {
  loadPlace(previousPlace);
}
