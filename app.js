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
const currentRange = document.querySelector("#currentRange");
const currentUv = document.querySelector("#currentUv");
const currentSport = document.querySelector("#currentSport");
const currentSun = document.querySelector("#currentSun");
const forecastGrid = document.querySelector("#forecastGrid");
const unitButtons = document.querySelectorAll(".unit-button");
const languageButtons = document.querySelectorAll(".language-button");
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
const DEFAULT_LANGUAGE = "en";
let activeUnit = "celsius";
let activeLanguage = DEFAULT_LANGUAGE;
let lastSearch = null;
let latestForecast = null;
let latestPlace = null;
let favorites = [];
let localTimeTimer = null;
let radarMapInstance = null;
let radarLayer = null;
let radarMarker = null;
let radarRequestId = 0;
let isSearchLoading = false;
let isLocationLoading = false;
let activeDetailsIndex = null;

const weatherCodes = {
  0: { labelKey: "weather.clear", type: "sun" },
  1: { labelKey: "weather.mainlyClear", type: "partly" },
  2: { labelKey: "weather.partlyCloudy", type: "partly" },
  3: { labelKey: "weather.overcast", type: "cloud" },
  45: { labelKey: "weather.fog", type: "fog" },
  48: { labelKey: "weather.rimeFog", type: "fog" },
  51: { labelKey: "weather.lightDrizzle", type: "rain" },
  53: { labelKey: "weather.moderateDrizzle", type: "rain" },
  55: { labelKey: "weather.denseDrizzle", type: "rain" },
  56: { labelKey: "weather.lightFreezingDrizzle", type: "rain" },
  57: { labelKey: "weather.denseFreezingDrizzle", type: "rain" },
  61: { labelKey: "weather.slightRain", type: "rain" },
  63: { labelKey: "weather.moderateRain", type: "rain" },
  65: { labelKey: "weather.heavyRain", type: "rain" },
  66: { labelKey: "weather.lightFreezingRain", type: "rain" },
  67: { labelKey: "weather.heavyFreezingRain", type: "rain" },
  71: { labelKey: "weather.slightSnow", type: "snow" },
  73: { labelKey: "weather.moderateSnow", type: "snow" },
  75: { labelKey: "weather.heavySnow", type: "snow" },
  77: { labelKey: "weather.snowGrains", type: "snow" },
  80: { labelKey: "weather.slightRainShowers", type: "rain" },
  81: { labelKey: "weather.moderateRainShowers", type: "rain" },
  82: { labelKey: "weather.violentRainShowers", type: "rain" },
  85: { labelKey: "weather.slightSnowShowers", type: "snow" },
  86: { labelKey: "weather.heavySnowShowers", type: "snow" },
  95: { labelKey: "weather.thunderstorm", type: "storm" },
  96: { labelKey: "weather.thunderstormSlightHail", type: "storm" },
  99: { labelKey: "weather.thunderstormHeavyHail", type: "storm" },
};

const unitLabels = {
  fahrenheit: { temp: "F", wind: "mph" },
  celsius: { temp: "C", wind: "km/h" },
};

const rainStrengths = [
  { max: 0.1, labelKey: "rain.none" },
  { max: 1, labelKey: "rain.trace" },
  { max: 5, labelKey: "rain.light" },
  { max: 15, labelKey: "rain.moderate" },
  { max: 30, labelKey: "rain.heavy" },
  { max: Infinity, labelKey: "rain.veryHeavy" },
];

const translations = {
  en: {
    appTitle: "Skyweather",
    unitToggleLabel: "Temperature unit",
    languageToggleLabel: "Language",
    searchLabel: "Postal code or city",
    searchPlaceholder: "3000 or Melbourne",
    countryLabel: "Country",
    useLocation: "Use my location",
    locating: "Locating...",
    forecast: "Forecast",
    loading: "Loading...",
    favoritesLabel: "Favorite cities",
    saveCity: "Save city",
    unsave: "Unsave",
    saved: "Saved",
    savedCity: "Saved city",
    noSavedCities: "No saved cities yet",
    removeFavoriteTitle: "Remove {name} from favorites",
    loadFavoriteLabel: "Load {name} forecast",
    closeDetails: "Close details",
    currentDetails: {
      humidity: "Humidity",
      wind: "Wind",
      rain: "Rain",
      localTime: "Local Time",
      highLow: "High / Low",
      uvIndex: "UV Index",
      sport: "Sport",
      sun: "Sun",
    },
    details: {
      feelsLike: "Feels Like",
      rain: "Rain",
      rainHours: "Rain Hours",
      uvIndex: "UV Index",
      sport: "Sport",
      wind: "Wind",
      gusts: "Gusts",
      sun: "Sun",
    },
    hourlyTitle: "Hourly Outlook",
    radarTitle: "Weather Radar",
    radarMapLabel: "Current weather radar map",
    forecastGridLabel: "Fifteen day forecast",
    nextFiveDays: "Next five days",
    remainingDays: "Remaining forecast days",
    today: "Today",
    viewForecastDetails: "View {day} forecast details",
    chance: "chance",
    hourShort: "hr",
    millimeter: "mm",
    feelsLikeValue: "Feels like {value}",
    unavailable: "Unavailable",
    currentLocation: "Current Location",
    currentLocationWithCoords: "Current location ({latitude}, {longitude})",
    dataAttribution: "Weather data by {openMeteo}. Postal lookup by {zippopotam}. Location details by {bigDataCloud} and {nominatim}. Weather radar by {rainViewer}. Weather icons by {meteocons}.",
    status: {
      addSearch: "Add a postal code or city first.",
      requestLocation: "Requesting your location...",
      findingForecast: "Finding your forecast...",
      findingLocation: "Finding your location details...",
      updatedFor: "Updated for {name}.",
      savedFavorite: "Saved {name} to favorites.",
      removedFavorite: "Removed {name} from favorites.",
      radarLoading: "Loading weather radar...",
      radarNeedsLocation: "Weather radar needs a precise location.",
      radarLoadFailed: "Weather radar could not load. Check your connection.",
      radarLatest: "Latest weather radar {time}",
    },
    errors: {
      secureLocationHint: " Location access usually requires HTTPS or localhost.",
      locationUnavailableBrowser: "Location is not available in this browser.{hint}",
      locationPermissionDenied: "Location permission was denied.{hint}",
      locationUnavailable: "Your location could not be determined.{hint}",
      locationTimeout: "Location lookup timed out.{hint}",
      locationUnavailableNow: "Location is not available right now.{hint}",
      coordinateNameUnavailable: "Your coordinates were found, but the location name could not be resolved. Try again or search by city/postcode.",
      searchNotFound: "That postal code or city was not found for the selected country.",
      postalUnreachable: "Postal lookup is unreachable. Check your connection and try again.",
      postalNotFound: "That postal code was not found for the selected country.",
      postalUnavailable: "Postal lookup is unavailable right now. Try again shortly.",
      postalNoData: "No location data came back for that postal code.",
      cityUnreachable: "City lookup is unreachable. Check your connection and try again.",
      cityUnavailable: "City lookup is unavailable right now. Try again shortly.",
      cityNotFound: "That city or postal code was not found for the selected country.",
      locationDetailsNoData: "Location details were not returned.",
      locationDetailsUnreachable: "Location details are unreachable.",
      locationDetailsUnavailable: "Location details are unavailable.",
      weatherUnreachable: "Weather service is unreachable. Check your connection and try again.",
      weatherUnavailable: "Weather data is unavailable right now. Try another location or retry shortly.",
      radarUnreachable: "Weather radar is unreachable.",
      radarUnavailable: "Weather radar is unavailable right now.",
      radarNoFrame: "Weather radar frame was not returned.",
      hourlyUnavailable: "Hourly data is unavailable for this day.",
    },
    weather: {
      clear: "Clear sky",
      mainlyClear: "Mainly clear",
      partlyCloudy: "Partly cloudy",
      overcast: "Overcast",
      fog: "Fog",
      rimeFog: "Freezing fog",
      lightDrizzle: "Light drizzle",
      moderateDrizzle: "Moderate drizzle",
      denseDrizzle: "Dense drizzle",
      lightFreezingDrizzle: "Light freezing drizzle",
      denseFreezingDrizzle: "Dense freezing drizzle",
      slightRain: "Slight rain",
      moderateRain: "Moderate rain",
      heavyRain: "Heavy rain",
      lightFreezingRain: "Light freezing rain",
      heavyFreezingRain: "Heavy freezing rain",
      slightSnow: "Slight snow",
      moderateSnow: "Moderate snow",
      heavySnow: "Heavy snow",
      snowGrains: "Snow grains",
      slightRainShowers: "Slight rain showers",
      moderateRainShowers: "Moderate rain showers",
      violentRainShowers: "Violent rain showers",
      slightSnowShowers: "Slight snow showers",
      heavySnowShowers: "Heavy snow showers",
      thunderstorm: "Thunderstorm",
      thunderstormSlightHail: "Thunderstorm with slight hail",
      thunderstormHeavyHail: "Thunderstorm with heavy hail",
      unavailable: "Weather data unavailable",
      iconSun: "Sunny",
      iconPartly: "Partly cloudy",
      iconCloud: "Cloudy",
      iconFog: "Fog",
      iconRain: "Rain",
      iconSnow: "Snow",
      iconStorm: "Thunderstorms",
    },
    rain: {
      none: "No rain",
      trace: "Trace rain",
      light: "Light rain",
      moderate: "Moderate rain",
      heavy: "Heavy rain",
      veryHeavy: "Very heavy rain",
    },
    uv: {
      low: "Low",
      moderate: "Moderate",
      high: "High",
      veryHigh: "Very high",
      extreme: "Extreme",
    },
    sport: {
      indoor: "Indoor",
      outdoor: "Outdoor",
      outdoorReason: "Outdoor sport looks suitable",
      storm: "Indoor sport recommended: storms likely",
      snow: "Indoor sport recommended: snow conditions",
      fog: "Indoor sport recommended: low visibility",
      wet: "Indoor sport recommended: wet conditions",
      wind: "Indoor sport recommended: strong wind",
      uv: "Indoor sport recommended: very high UV",
      heat: "Indoor sport recommended: heat stress risk",
      cold: "Indoor sport recommended: cold conditions",
      iconOutdoor: "Outdoor sport",
      iconIndoor: "Indoor sport",
    },
    accessory: {
      storm: "Storm kit",
      boots: "Rain boots",
      umbrella: "Umbrella day",
      scarf: "Scarf day",
      coat: "Coat day",
      windbreaker: "Windbreaker day",
      hoodie: "Hoodie day",
      jacket: "Light jacket",
      sunscreen: "High UV",
      sunglasses: "Sunglasses day",
      hat: "Hat day",
      tee: "Light layer",
    },
  },
  zh: {
    appTitle: "Skyweather",
    unitToggleLabel: "温度单位",
    languageToggleLabel: "语言",
    searchLabel: "邮编或城市",
    searchPlaceholder: "3000 或 墨尔本",
    countryLabel: "国家/地区",
    useLocation: "使用当前位置",
    locating: "定位中...",
    forecast: "查看预报",
    loading: "加载中...",
    favoritesLabel: "已保存城市",
    saveCity: "保存城市",
    unsave: "取消保存",
    saved: "已保存",
    savedCity: "已保存城市",
    noSavedCities: "还没有保存城市",
    removeFavoriteTitle: "从已保存城市中移除{name}",
    loadFavoriteLabel: "查看{name}的天气预报",
    closeDetails: "关闭详情",
    currentDetails: {
      humidity: "湿度",
      wind: "风速",
      rain: "降雨",
      localTime: "当地时间",
      highLow: "最高 / 最低",
      uvIndex: "紫外线指数",
      sport: "运动建议",
      sun: "日出/日落",
    },
    details: {
      feelsLike: "体感温度",
      rain: "降雨",
      rainHours: "降雨时长",
      uvIndex: "紫外线指数",
      sport: "运动建议",
      wind: "风速",
      gusts: "阵风",
      sun: "日出/日落",
    },
    hourlyTitle: "逐小时预报",
    radarTitle: "天气雷达",
    radarMapLabel: "当前天气雷达图",
    forecastGridLabel: "15 天天气预报",
    nextFiveDays: "未来五天",
    remainingDays: "后续预报",
    today: "今天",
    viewForecastDetails: "查看{day}天气详情",
    chance: "概率",
    hourShort: "小时",
    millimeter: "毫米",
    feelsLikeValue: "体感 {value}",
    unavailable: "暂无数据",
    currentLocation: "当前位置",
    currentLocationWithCoords: "当前位置（{latitude}, {longitude}）",
    dataAttribution: "天气数据来自 {openMeteo}。邮编查询来自 {zippopotam}。位置详情来自 {bigDataCloud} 和 {nominatim}。天气雷达来自 {rainViewer}。天气图标来自 {meteocons}。",
    status: {
      addSearch: "请先输入邮编或城市。",
      requestLocation: "正在请求当前位置...",
      findingForecast: "正在获取天气预报...",
      findingLocation: "正在解析当前位置...",
      updatedFor: "已更新{name}的天气。",
      savedFavorite: "已将{name}保存到城市列表。",
      removedFavorite: "已从城市列表移除{name}。",
      radarLoading: "正在加载天气雷达...",
      radarNeedsLocation: "天气雷达需要精确位置。",
      radarLoadFailed: "天气雷达加载失败，请检查网络连接。",
      radarLatest: "最新天气雷达 {time}",
    },
    errors: {
      secureLocationHint: " 位置访问通常需要 HTTPS 或 localhost。",
      locationUnavailableBrowser: "此浏览器无法使用定位功能。{hint}",
      locationPermissionDenied: "定位权限已被拒绝。{hint}",
      locationUnavailable: "无法确定你的位置。{hint}",
      locationTimeout: "定位请求超时。{hint}",
      locationUnavailableNow: "当前位置暂时不可用。{hint}",
      coordinateNameUnavailable: "已获取坐标，但无法解析位置名称。请重试，或按城市/邮编搜索。",
      searchNotFound: "在所选国家/地区未找到该邮编或城市。",
      postalUnreachable: "邮编查询服务无法连接，请检查网络后重试。",
      postalNotFound: "在所选国家/地区未找到该邮编。",
      postalUnavailable: "邮编查询服务暂时不可用，请稍后重试。",
      postalNoData: "该邮编没有返回位置数据。",
      cityUnreachable: "城市查询服务无法连接，请检查网络后重试。",
      cityUnavailable: "城市查询服务暂时不可用，请稍后重试。",
      cityNotFound: "在所选国家/地区未找到该城市或邮编。",
      locationDetailsNoData: "未返回位置详情。",
      locationDetailsUnreachable: "位置详情服务无法连接。",
      locationDetailsUnavailable: "位置详情暂时不可用。",
      weatherUnreachable: "天气服务无法连接，请检查网络后重试。",
      weatherUnavailable: "天气数据暂时不可用，请更换地点或稍后重试。",
      radarUnreachable: "天气雷达无法连接。",
      radarUnavailable: "天气雷达暂时不可用。",
      radarNoFrame: "未返回天气雷达图层。",
      hourlyUnavailable: "这一天暂无逐小时数据。",
    },
    weather: {
      clear: "晴朗",
      mainlyClear: "大部晴朗",
      partlyCloudy: "局部多云",
      overcast: "阴天",
      fog: "有雾",
      rimeFog: "冻雾",
      lightDrizzle: "小毛毛雨",
      moderateDrizzle: "中等毛毛雨",
      denseDrizzle: "浓毛毛雨",
      lightFreezingDrizzle: "小冻毛毛雨",
      denseFreezingDrizzle: "强冻毛毛雨",
      slightRain: "小雨",
      moderateRain: "中雨",
      heavyRain: "大雨",
      lightFreezingRain: "小冻雨",
      heavyFreezingRain: "强冻雨",
      slightSnow: "小雪",
      moderateSnow: "中雪",
      heavySnow: "大雪",
      snowGrains: "米雪",
      slightRainShowers: "小阵雨",
      moderateRainShowers: "中等阵雨",
      violentRainShowers: "强阵雨",
      slightSnowShowers: "小阵雪",
      heavySnowShowers: "强阵雪",
      thunderstorm: "雷暴",
      thunderstormSlightHail: "雷暴伴小冰雹",
      thunderstormHeavyHail: "雷暴伴强冰雹",
      unavailable: "天气数据暂无",
      iconSun: "晴天",
      iconPartly: "局部多云",
      iconCloud: "多云",
      iconFog: "雾",
      iconRain: "雨",
      iconSnow: "雪",
      iconStorm: "雷暴",
    },
    rain: {
      none: "无雨",
      trace: "微量降雨",
      light: "小雨",
      moderate: "中雨",
      heavy: "大雨",
      veryHeavy: "暴雨",
    },
    uv: {
      low: "低",
      moderate: "中等",
      high: "高",
      veryHigh: "很高",
      extreme: "极高",
    },
    sport: {
      indoor: "室内",
      outdoor: "户外",
      outdoorReason: "适合户外运动",
      storm: "建议室内运动：可能有雷暴",
      snow: "建议室内运动：有降雪",
      fog: "建议室内运动：能见度低",
      wet: "建议室内运动：天气潮湿",
      wind: "建议室内运动：风力较强",
      uv: "建议室内运动：紫外线很强",
      heat: "建议室内运动：有高温风险",
      cold: "建议室内运动：天气寒冷",
      iconOutdoor: "户外运动",
      iconIndoor: "室内运动",
    },
    accessory: {
      storm: "雷暴装备",
      boots: "雨靴",
      umbrella: "带伞",
      scarf: "围巾",
      coat: "外套",
      windbreaker: "防风外套",
      hoodie: "连帽衫",
      jacket: "薄外套",
      sunscreen: "高紫外线",
      sunglasses: "太阳镜",
      hat: "帽子",
      tee: "轻薄衣物",
    },
  },
};

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

function getTranslation(path, language = activeLanguage) {
  const value = path
    .split(".")
    .reduce((current, part) => current?.[part], translations[language]);

  if (value !== undefined) return value;

  return path.split(".").reduce((current, part) => current?.[part], translations.en) ?? path;
}

function t(path, params = {}) {
  let value = getTranslation(path);

  if (typeof value !== "string") return path;

  Object.entries(params).forEach(([key, replacement]) => {
    value = value.replaceAll(`{${key}}`, String(replacement));
  });

  return value;
}

function getLocale() {
  return activeLanguage === "zh" ? "zh-CN" : "en";
}

function getApiLanguage() {
  return activeLanguage === "zh" ? "zh" : "en";
}

function getNominatimLanguage() {
  return activeLanguage === "zh" ? "zh-CN,zh,en" : "en";
}

function applyStaticTranslations() {
  document.documentElement.lang = getLocale();
  document.title = t("appTitle");

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
  });

  document.querySelector(".unit-toggle")?.setAttribute("aria-label", t("unitToggleLabel"));
  document.querySelector(".language-toggle")?.setAttribute("aria-label", t("languageToggleLabel"));
  document.querySelector(".favorites-bar")?.setAttribute("aria-label", t("favoritesLabel"));
  forecastGrid.setAttribute("aria-label", t("forecastGridLabel"));
  detailsClose.setAttribute("aria-label", t("closeDetails"));
  radarMap.setAttribute("aria-label", t("radarMapLabel"));
  renderDataAttribution();
  updateFavoriteSaveButton();
  setSearchLoading(isSearchLoading);
  setLocationLoading(isLocationLoading);
}

function renderDataAttribution() {
  const links = {
    openMeteo: `<a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>`,
    zippopotam: `<a href="https://www.zippopotam.us/" target="_blank" rel="noopener">Zippopotam</a>`,
    bigDataCloud: `<a href="https://www.bigdatacloud.com/" target="_blank" rel="noopener">BigDataCloud</a>`,
    nominatim: `<a href="https://nominatim.org/" target="_blank" rel="noopener">OpenStreetMap Nominatim</a>`,
    rainViewer: `<a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>`,
    meteocons: `<a href="https://meteocons.com/" target="_blank" rel="noopener">Meteocons</a>`,
  };

  document.querySelector("#dataAttribution").innerHTML = t("dataAttribution", links);
}

function setActiveLanguage(language, options = {}) {
  const { persist = true, rerender = true } = options;

  if (!translations[language]) return;

  activeLanguage = language;

  languageButtons.forEach((button) => {
    const isActive = button.dataset.language === activeLanguage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  applyStaticTranslations();

  if (rerender && latestForecast && latestPlace) {
    renderWeather(latestPlace, latestForecast);
    if (activeDetailsIndex !== null && !dayDetails.classList.contains("hidden")) {
      showDayDetails(activeDetailsIndex);
    }
  }

  if (persist) savePreferences();
}

weatherForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const searchTerm = postalInput.value.trim();
  const countryCode = countryInput.value;

  if (!searchTerm) {
    setStatus(t("status.addSearch"), true);
    return;
  }

  await loadWeather(searchTerm, countryCode);
});

locationButton.addEventListener("click", async () => {
  if (!navigator.geolocation) {
    const secureHint = window.isSecureContext
      ? ""
      : t("errors.secureLocationHint");
    setStatus(t("errors.locationUnavailableBrowser", { hint: secureHint }), true);
    return;
  }

  setLocationLoading(true);
  setStatus(t("status.requestLocation"));

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

languageButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const selectedLanguage = button.dataset.language;
    if (selectedLanguage === activeLanguage) return;

    setActiveLanguage(selectedLanguage);

    if (lastSearch) {
      await rerunLastSearch();
    }
  });
});

countryInput.addEventListener("change", savePreferences);

favoriteSave.addEventListener("click", () => {
  toggleCurrentFavorite();
});

favoriteList.addEventListener("click", async (event) => {
  const removeButton = event.target.closest(".favorite-remove");

  if (removeButton) {
    const favorite = favorites[Number(removeButton.dataset.index)];

    if (!favorite) return;

    removeFavorite(favorite);
    return;
  }

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
  setStatus(t("status.findingForecast"));
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
    setStatus(t("status.updatedFor", { name: place.name }));
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
  setStatus(t("status.findingLocation"));
  showLoadingState();

  try {
    const place = await resolveCoordinatePlace(latitude, longitude, name, {
      requireLocationName,
    });
    setStatus(t("status.findingForecast"));
    const forecast = await fetchForecast(latitude, longitude);
    renderWeather(place, forecast);
    lastSearch = { type: "coords", latitude, longitude, name: place.name };
    updateFavoriteSaveButton();
    if (persist) savePreferences();
    setStatus(t("status.updatedFor", { name: place.name }));
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

  if (shouldUseProvidedCoordinateName(name)) {
    return { name, latitude, longitude };
  }

  try {
    return await reverseGeocodeCoordinates(latitude, longitude);
  } catch {
    if (name && !isCurrentLocationFallbackName(name)) {
      return { name, latitude, longitude };
    }

    if (requireLocationName) {
      throw new Error(
        t("errors.coordinateNameUnavailable"),
      );
    }

    return {
      name: name || t("currentLocationWithCoords", { latitude, longitude }),
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
        t("errors.searchNotFound"),
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
    throw new Error(t("errors.postalUnreachable"));
  }

  if (response.status === 404) {
    throw new LookupNotFoundError(t("errors.postalNotFound"));
  }

  if (!response.ok) {
    throw new Error(t("errors.postalUnavailable"));
  }

  const data = await response.json();
  const place = data.places?.[0];

  if (!place) {
    throw new LookupNotFoundError(t("errors.postalNoData"));
  }

  const locality = place["place name"];
  const region = place.state || place["state abbreviation"] || data.country;

  const postalPlace = {
    name: region ? `${locality}, ${region}` : locality,
    latitude: place.latitude,
    longitude: place.longitude,
  };

  if (activeLanguage === "zh") {
    try {
      return await reverseGeocodeCoordinates(postalPlace.latitude, postalPlace.longitude);
    } catch {
      return postalPlace;
    }
  }

  return postalPlace;
}

async function geocodeCity(searchTerm, countryCode) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");

  url.search = new URLSearchParams({
    name: searchTerm,
    count: "1",
    language: getApiLanguage(),
    format: "json",
    countryCode: countryCode.toUpperCase(),
  });

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(t("errors.cityUnreachable"));
  }

  if (!response.ok) {
    throw new Error(t("errors.cityUnavailable"));
  }

  const data = await response.json();
  const place = data.results?.[0];

  if (!place) {
    throw new LookupNotFoundError(
      t("errors.cityNotFound"),
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

  throw new Error(t("errors.locationDetailsNoData"));
}

async function reverseGeocodeWithBigDataCloud(latitude, longitude) {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");

  url.search = new URLSearchParams({
    latitude,
    longitude,
    localityLanguage: getApiLanguage(),
  });

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error(t("errors.locationDetailsUnreachable"));
  }

  if (!response.ok) {
    throw new Error(t("errors.locationDetailsUnavailable"));
  }

  const data = await response.json();
  const placeName = formatReverseGeocodeName(data);

  if (!placeName) {
    throw new Error(t("errors.locationDetailsNoData"));
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
    "accept-language": getNominatimLanguage(),
  });

  let response;

  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new Error(t("errors.locationDetailsUnreachable"));
  }

  if (!response.ok) {
    throw new Error(t("errors.locationDetailsUnavailable"));
  }

  const data = await response.json();
  const placeName = formatNominatimPlaceName(data);

  if (!placeName) {
    throw new Error(t("errors.locationDetailsNoData"));
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
    throw new Error(t("errors.weatherUnreachable"));
  }

  if (!response.ok) {
    throw new Error(t("errors.weatherUnavailable"));
  }

  return response.json();
}

function renderWeather(place, forecast) {
  const current = forecast.current;
  const daily = forecast.daily;
  const currentInfo = getWeatherInfo(current.weather_code);
  const todayInfo = getWeatherInfo(daily.weather_code[0]);
  const todayAccessories = getDailyAccessories(daily, 0, todayInfo.type);
  const todaySport = getDailySport(daily, 0, todayInfo.type);
  const units = unitLabels[activeUnit];
  const todayHigh = Math.round(daily.temperature_2m_max[0]);
  const todayLow = Math.round(daily.temperature_2m_min[0]);

  latestForecast = forecast;
  latestPlace = place;
  currentWeather.classList.remove("hidden");
  currentIcon.innerHTML = getWeatherIcon(currentInfo.type);
  currentAccessories.innerHTML = renderAccessoryBadges(todayAccessories);
  locationName.textContent = place.name;
  currentCondition.textContent = currentInfo.label;
  currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  currentFeels.textContent = t("feelsLikeValue", {
    value: `${Math.round(current.apparent_temperature)}°${units.temp}`,
  });
  currentHumidity.textContent = `${current.relative_humidity_2m}%`;
  currentWind.textContent = `${Math.round(current.wind_speed_10m)} ${units.wind}`;
  currentRain.textContent = formatRainSummary(daily, 0);
  currentRange.textContent = `${todayHigh}° / ${todayLow}°${units.temp}`;
  currentUv.textContent = formatUvIndex(daily.uv_index_max?.[0]);
  currentSport.innerHTML = renderSportChip(todaySport, { showLabel: true });
  currentSun.textContent = `${formatTime(daily.sunrise[0])} / ${formatTime(daily.sunset[0])}`;
  startLocalTimeClock(forecast.timezone);

  const forecastCards = daily.time.map((dateString, index) =>
    renderForecastCard(daily, dateString, index, {
      isFeatured: index >= 1 && index <= 5,
    }),
  );

  forecastGrid.innerHTML = `
    <div class="forecast-featured" aria-label="${t("nextFiveDays")}">
      ${forecastCards.slice(1, 6).join("")}
    </div>
    <div class="forecast-thumbnails" aria-label="${t("remainingDays")}">
      ${forecastCards.slice(6).join("")}
    </div>
  `;
}

function renderForecastCard(daily, dateString, index, options = {}) {
  const { isFeatured = index < 5 } = options;
  const info = getWeatherInfo(daily.weather_code[index]);
  const date = new Date(`${dateString}T12:00:00`);
  const day = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(date);
  const monthDay = new Intl.DateTimeFormat(getLocale(), {
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
    <button class="forecast-card ${isFeatured ? "forecast-card-featured" : "forecast-card-thumbnail"}" type="button" data-index="${index}" data-weather="${info.type}" data-feel="${feel}" data-sport="${sport.type}" data-accessories="${accessories.map((accessory) => accessory.type).join(" ")}" aria-label="${t("viewForecastDetails", { day: index === 0 ? t("today") : day })}">
      <span class="forecast-top">
        <span class="forecast-heading">
          <span class="forecast-day">${index === 0 ? t("today") : day}</span>
          <span class="forecast-date">${monthDay}</span>
        </span>
        <span class="forecast-accessories" aria-hidden="true">${renderAccessoryBadges(accessories)}</span>
      </span>
      <span class="forecast-visual" aria-hidden="true">
        <span class="forecast-icon">${getWeatherIcon(info.type)}</span>
      </span>
      <span class="forecast-temps">
        <span class="forecast-high">${high}°</span>
        <span class="forecast-low">${low}°${units.temp}</span>
      </span>
      <span class="forecast-condition">${info.label}</span>
      <span class="forecast-badges">${renderSportChip(sport, { showLabel: true })}</span>
      <span class="forecast-meta">
        <span>${rainStrength} · ${rainChance}%</span>
        <span>${wind} ${units.wind}</span>
      </span>
    </button>
  `;
}

function showDayDetails(index) {
  if (!latestForecast || !latestPlace || Number.isNaN(index)) return;
  activeDetailsIndex = index;

  const { daily } = latestForecast;
  const info = getWeatherInfo(daily.weather_code[index]);
  const date = new Date(`${daily.time[index]}T12:00:00`);
  const day = new Intl.DateTimeFormat(getLocale(), { weekday: "long" }).format(date);
  const monthDay = new Intl.DateTimeFormat(getLocale(), {
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
  detailsRain.textContent = `${getRainStrength(rainAmount)} · ${formatRainAmount(rainAmount)} · ${rainChance}% ${t("chance")}`;
  detailsRainHours.textContent = `${formatNumber(rainHours)} ${t("hourShort")}`;
  detailsUv.textContent = formatUvIndex(uvIndex);
  detailsSport.innerHTML = renderSportChip(sport, { showLabel: true });
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
  activeDetailsIndex = null;
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

  radarStatus.textContent = t("status.radarLoading");
}

async function loadTodayRadar(requestId) {
  if (!latestPlace || !radarPanel || radarPanel.classList.contains("hidden")) return;

  const latitude = Number(latestPlace.latitude);
  const longitude = Number(latestPlace.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    radarStatus.textContent = t("status.radarNeedsLocation");
    return;
  }

  if (!window.L) {
    radarStatus.textContent = t("status.radarLoadFailed");
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
    radarStatus.textContent = t("status.radarLatest", {
      time: formatRadarTime(radar.frame.time),
    });
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
    throw new Error(t("errors.radarUnreachable"));
  }

  if (!response.ok) {
    throw new Error(t("errors.radarUnavailable"));
  }

  const data = await response.json();
  const pastFrames = data.radar?.past ?? [];
  const nowcastFrames = data.radar?.nowcast ?? [];
  const frame =
    pastFrames[pastFrames.length - 1] ||
    nowcastFrames[nowcastFrames.length - 1];

  if (!data.host || !frame?.path) {
    throw new Error(t("errors.radarNoFrame"));
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
  if (!unixSeconds) return t("unavailable");

  return new Intl.DateTimeFormat(getLocale(), {
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
    return new Intl.DateTimeFormat(getLocale(), {
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      timeZone,
      timeZoneName: "short",
    }).format(new Date());
  } catch {
    return t("unavailable");
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
      lastSearch.name || t("currentLocation"),
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
    : t("errors.secureLocationHint");

  if (error?.code === 1) return t("errors.locationPermissionDenied", { hint: secureHint });
  if (error?.code === 2) return t("errors.locationUnavailable", { hint: secureHint });
  if (error?.code === 3) return t("errors.locationTimeout", { hint: secureHint });

  return t("errors.locationUnavailableNow", { hint: secureHint });
}

async function loadFavorite(favorite) {
  favoriteSave.disabled = true;
  await loadWeatherByCoordinates(favorite.latitude, favorite.longitude, favorite.name);
}

function toggleCurrentFavorite() {
  const favorite = createFavoriteFromCurrentPlace();

  if (!favorite) return;

  const alreadySaved = favorites.some((item) => item.id === favorite.id);

  if (alreadySaved) {
    removeFavorite(favorite);
    return;
  }

  saveCurrentFavorite();
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
  setStatus(t("status.savedFavorite", { name: favorite.name }));
}

function removeFavorite(favorite) {
  favorites = favorites.filter((item) => item.id !== favorite.id);

  savePreferences();
  updateFavoriteSaveButton();
  setStatus(t("status.removedFavorite", { name: favorite.name }));
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
            <span class="favorite-item" data-active="${currentFavorite?.id === favorite.id}">
              <button class="favorite-chip" type="button" data-index="${index}" data-active="${currentFavorite?.id === favorite.id}" title="${escapeHtml(favorite.name)}" aria-label="${escapeHtml(t("loadFavoriteLabel", { name: favorite.name }))}">
                ${escapeHtml(getFavoriteShortName(favorite.name))}
              </button>
              <button class="favorite-remove" type="button" data-index="${index}" title="${escapeHtml(t("removeFavoriteTitle", { name: favorite.name }))}" aria-label="${escapeHtml(t("removeFavoriteTitle", { name: favorite.name }))}">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </span>
          `,
        )
        .join("")
    : `<span class="favorite-empty">${t("noSavedCities")}</span>`;
}

function updateFavoriteSaveButton() {
  const favorite = createFavoriteFromCurrentPlace();
  const alreadySaved = favorite && favorites.some((item) => item.id === favorite.id);

  favoriteSave.disabled = !favorite;
  favoriteSave.classList.toggle("is-saved", Boolean(alreadySaved));
  favoriteSave.setAttribute("aria-pressed", alreadySaved ? "true" : "false");
  favoriteSave.title = alreadySaved ? t("unsave") : t("saveCity");
  favoriteSave.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 3.8 14.5 9l5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4L9.5 9 12 3.8z" />
    </svg>
    ${alreadySaved ? t("unsave") : t("saveCity")}
  `;
  renderFavorites();
}

function getFavoriteShortName(name) {
  return String(name).split(",")[0].trim() || t("savedCity");
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
        language: activeLanguage,
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
    setActiveLanguage(DEFAULT_LANGUAGE, { persist: false, rerender: false });
    renderFavorites();
    updateFavoriteSaveButton();
    return;
  }

  setActiveLanguage(preferences.language || DEFAULT_LANGUAGE, {
    persist: false,
    rerender: false,
  });

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
      preferences.lastSearch.name || t("currentLocation"),
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
  return /^(current location|当前位置)(?:\s*[（(].+[）)])?$/i.test(String(name).trim());
}

function shouldUseProvidedCoordinateName(name) {
  if (!name || isCurrentLocationFallbackName(name)) return false;

  return activeLanguage === "zh" ? hasChineseCharacters(name) : !hasChineseCharacters(name);
}

function hasChineseCharacters(value) {
  return /[\u3400-\u9fff]/.test(String(value));
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
    return `<p class="hourly-empty">${t("errors.hourlyUnavailable")}</p>`;
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
    return `<p class="hourly-empty">${t("errors.hourlyUnavailable")}</p>`;
  }

  return items.join("");
}

function formatRainSummary(daily, index) {
  const rainChance = daily.precipitation_probability_max[index] ?? 0;
  const rainAmount = daily.rain_sum?.[index] ?? 0;

  return `${getRainStrength(rainAmount)} · ${formatRainAmount(rainAmount)} · ${rainChance}% ${t("chance")}`;
}

function getRainStrength(amountMm) {
  const amount = Number(amountMm) || 0;
  const strength = rainStrengths.find((item) => amount < item.max);
  return t(strength?.labelKey || "rain.none");
}

function formatRainAmount(amountMm) {
  const amount = Number(amountMm) || 0;
  return `${amount.toFixed(amount < 10 ? 1 : 0)} ${t("millimeter")}`;
}

function formatUvIndex(value) {
  if (value === undefined || value === null) return t("unavailable");

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) return t("unavailable");

  const uvIndex = Math.round(numericValue);
  let label = t("uv.extreme");

  if (uvIndex <= 2) label = t("uv.low");
  else if (uvIndex <= 5) label = t("uv.moderate");
  else if (uvIndex <= 7) label = t("uv.high");
  else if (uvIndex <= 10) label = t("uv.veryHigh");

  return `${uvIndex} · ${label}`;
}

function formatTime(dateTime) {
  if (!dateTime) return t("unavailable");

  const time = dateTime.split("T")[1];

  if (!time) return t("unavailable");

  const [hourValue, minute] = time.split(":");
  const hour = Number(hourValue);

  if (activeLanguage === "zh") {
    return `${String(hour).padStart(2, "0")}:${minute}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function formatNumber(value) {
  const number = Number(value) || 0;
  return number.toFixed(number % 1 === 0 ? 0 : 1);
}

function getWeatherInfo(code) {
  const weather = weatherCodes[code] ?? { labelKey: "weather.unavailable", type: "partly" };

  return {
    ...weather,
    label: t(weather.labelKey),
  };
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
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.storm") };
  }

  if (weatherType === "snow") {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.snow") };
  }

  if (weatherType === "fog") {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.fog") };
  }

  if (rainMm >= 1 || chance >= 60) {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.wet") };
  }

  if (wind >= 38) {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.wind") };
  }

  if (uv >= 9) {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.uv") };
  }

  if (highC >= 34) {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.heat") };
  }

  if (highC < 10) {
    return { type: "indoor", label: t("sport.indoor"), reason: t("sport.cold") };
  }

  return { type: "outdoor", label: t("sport.outdoor"), reason: t("sport.outdoorReason") };
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
      ? { type: "boots", label: t("accessory.boots") }
      : { type: "umbrella", label: t("accessory.umbrella") };

    addAccessory(accessories, "storm", t("accessory.storm"));
    addAccessory(accessories, stormSecondary.type, stormSecondary.label);
    return accessories;
  }

  if (weatherType === "snow") {
    addAccessory(accessories, "coat", t("accessory.coat"));
    if (feel === "cold") addAccessory(accessories, "scarf", t("accessory.scarf"));
    else if (windKmh >= 38) addAccessory(accessories, "windbreaker", t("accessory.windbreaker"));
    return accessories;
  }

  if (heavyRain) {
    addAccessory(accessories, "boots", t("accessory.boots"));
    addAccessory(accessories, "umbrella", t("accessory.umbrella"));
    return accessories;
  }

  if (wetDay) {
    addAccessory(accessories, "umbrella", t("accessory.umbrella"));
    if (feel === "cold") addAccessory(accessories, "scarf", t("accessory.scarf"));
    else if (feel === "cool") addAccessory(accessories, "hoodie", t("accessory.hoodie"));
    else if (windKmh >= 38) addAccessory(accessories, "windbreaker", t("accessory.windbreaker"));
    return accessories;
  }

  if (feel === "cold") {
    addAccessory(accessories, "scarf", t("accessory.scarf"));
    addAccessory(accessories, "coat", t("accessory.coat"));
    return accessories;
  }

  if (uv >= 8 && sunnyDay) {
    addAccessory(accessories, "sunscreen", t("accessory.sunscreen"));
    if (feel === "hot") addAccessory(accessories, "sunglasses", t("accessory.sunglasses"));
    else addAccessory(accessories, "hat", t("accessory.hat"));
    return accessories;
  }

  if (feel === "hot" && sunnyDay) {
    addAccessory(accessories, "sunglasses", t("accessory.sunglasses"));
    addAccessory(accessories, "hat", t("accessory.hat"));
    return accessories;
  }

  if (feel === "warm" && sunnyDay) {
    addAccessory(accessories, "hat", t("accessory.hat"));
    if (windKmh >= 38) addAccessory(accessories, "windbreaker", t("accessory.windbreaker"));
    return accessories;
  }

  if (windKmh >= 38) {
    addAccessory(accessories, "windbreaker", t("accessory.windbreaker"));
    if (feel === "cool") addAccessory(accessories, "hoodie", t("accessory.hoodie"));
    return accessories;
  }

  if (feel === "cool") return [{ type: "hoodie", label: t("accessory.hoodie") }];
  if ((weatherType === "cloud" || weatherType === "fog") && feel === "mild") {
    return [{ type: "jacket", label: t("accessory.jacket") }];
  }
  return [{ type: "tee", label: t("accessory.tee") }];
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

function renderSportChip(sport, options = {}) {
  const { showLabel = false } = options;

  return `
    <span class="sport-chip" data-sport="${sport.type}" title="${sport.reason}" aria-label="${sport.reason}">
      ${getSportIcon(sport.type)}
      ${showLabel ? `<span>${sport.label}</span>` : ""}
    </span>
  `;
}

function getSportIcon(type) {
  const icons = {
    outdoor: `
      <svg viewBox="0 0 24 24" role="img" aria-label="${t("sport.iconOutdoor")}">
        <circle cx="7" cy="16" r="3" />
        <circle cx="17" cy="16" r="3" />
        <path d="m7 16 4-7 3 7" />
        <path d="M11 9h4l2 7" />
        <path d="M9.5 6.5h3" />
      </svg>
    `,
    indoor: `
      <svg viewBox="0 0 24 24" role="img" aria-label="${t("sport.iconIndoor")}">
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
    sun: { slug: "clear-day", labelKey: "weather.iconSun" },
    partly: { slug: "partly-cloudy-day", labelKey: "weather.iconPartly" },
    cloud: { slug: "overcast-day", labelKey: "weather.iconCloud" },
    fog: { slug: "fog-day", labelKey: "weather.iconFog" },
    rain: { slug: "rain", labelKey: "weather.iconRain" },
    snow: { slug: "snow", labelKey: "weather.iconSnow" },
    storm: { slug: "thunderstorms-day-rain", labelKey: "weather.iconStorm" },
  };
  const icon = icons[type] ?? icons.partly;

  return `
    <img
      class="weather-icon-img"
      src="https://cdn.jsdelivr.net/npm/@meteocons/svg/fill/${icon.slug}.svg"
      alt="${t(icon.labelKey)}"
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
  isSearchLoading = isLoading;
  const button = weatherForm.querySelector(".search-button");
  button.disabled = isLoading;
  button.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m21 21-4.7-4.7" />
      <circle cx="11" cy="11" r="7" />
    </svg>
    <span>${isLoading ? t("loading") : t("forecast")}</span>
  `;
}

function setLocationLoading(isLoading) {
  isLocationLoading = isLoading;
  locationButton.disabled = isLoading;
  locationButton.innerHTML = `
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
    <span>${isLoading ? t("locating") : t("useLocation")}</span>
  `;
}
