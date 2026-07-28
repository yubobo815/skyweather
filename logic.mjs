export function weatherType(code) {
  if (code === 0) return "clear";
  if ([1, 2].includes(code)) return "partly";
  if (code === 3) return "cloudy";
  if ([45, 48].includes(code)) return "fog";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm";
  return "rain";
}

export function dewPoint(temp, humidity) {
  const a = 17.27;
  const b = 237.7;
  const gamma = (a * temp) / (b + temp) + Math.log(humidity / 100);
  return (b * gamma) / (a - gamma);
}

export function comfort(temp, feels, humidity) {
  const dew = dewPoint(temp, humidity);
  if (feels <= 3) return humidity >= 65 ? "dampChill" : humidity <= 35 ? "dryChill" : "coldBite";
  if (feels < 12) return humidity >= 75 ? "dampChill" : "chilly";
  if (feels < 20) return humidity <= 32 ? "dryAir" : humidity >= 78 ? "dampAir" : "balanced";
  if (feels < 25) return humidity <= 30 ? "dryAir" : dew >= 18 ? "dampAir" : "balanced";
  if (feels < 28) return dew >= 20 || humidity >= 70 ? "humidWarm" : "warm";
  if (feels < 32) return dew >= 22 || humidity >= 68 ? "stickyWarm" : "warm";
  if (feels < 35) return dew >= 23 || humidity >= 65 ? "oppressive" : "highHeat";
  return "highHeat";
}

export function isCurrentRequest(requestId, activeRequestId) { return requestId === activeRequestId; }

export function samePlace(a, b) { return a.latitude === b.latitude && a.longitude === b.longitude; }

export function toggleSavedPlace(saved, place) {
  const index = saved.findIndex(candidate => samePlace(candidate, place));
  return index >= 0 ? saved.filter((_, candidateIndex) => candidateIndex !== index) : [...saved, place];
}

export function rainTiming(hours) {
  return hours.findIndex(hour => hour.precipitation >= 0.2 || hour.precipitationProbability >= 50);
}

const commonCityLabels = {
  2158177: { en: { name: "Melbourne", country: "Australia" }, zh: { name: "墨尔本", country: "澳大利亚" } },
  2147714: { en: { name: "Sydney", country: "Australia" }, zh: { name: "悉尼", country: "澳大利亚" } },
  2174003: { en: { name: "Brisbane", country: "Australia" }, zh: { name: "布里斯班", country: "澳大利亚" } },
  2063523: { en: { name: "Perth", country: "Australia" }, zh: { name: "珀斯", country: "澳大利亚" } },
  2078025: { en: { name: "Adelaide", country: "Australia" }, zh: { name: "阿德莱德", country: "澳大利亚" } },
  2172517: { en: { name: "Canberra", country: "Australia" }, zh: { name: "堪培拉", country: "澳大利亚" } },
  2643743: { en: { name: "London", country: "United Kingdom" }, zh: { name: "伦敦", country: "英国" } },
  5128581: { en: { name: "New York", country: "United States" }, zh: { name: "纽约", country: "美国" } },
  1850147: { en: { name: "Tokyo", country: "Japan" }, zh: { name: "东京", country: "日本" } },
  1816670: { en: { name: "Beijing", country: "China" }, zh: { name: "北京", country: "中国" } },
  1796236: { en: { name: "Shanghai", country: "China" }, zh: { name: "上海", country: "中国" } },
  1819729: { en: { name: "Hong Kong", country: "Hong Kong" }, zh: { name: "香港", country: "香港" } },
  1880252: { en: { name: "Singapore", country: "Singapore" }, zh: { name: "新加坡", country: "新加坡" } },
  5368361: { en: { name: "Los Angeles", country: "United States" }, zh: { name: "洛杉矶", country: "美国" } },
  5391959: { en: { name: "San Francisco", country: "United States" }, zh: { name: "旧金山", country: "美国" } },
  2988507: { en: { name: "Paris", country: "France" }, zh: { name: "巴黎", country: "法国" } },
  2950159: { en: { name: "Berlin", country: "Germany" }, zh: { name: "柏林", country: "德国" } },
  6167865: { en: { name: "Toronto", country: "Canada" }, zh: { name: "多伦多", country: "加拿大" } },
  6173331: { en: { name: "Vancouver", country: "Canada" }, zh: { name: "温哥华", country: "加拿大" } }
};

export function matchingPlace(place, alternatePlace) {
  if (!alternatePlace) return false;
  if (place.id != null && alternatePlace.id != null) return place.id === alternatePlace.id;

  return Math.abs(place.latitude - alternatePlace.latitude) < 0.01
    && Math.abs(place.longitude - alternatePlace.longitude) < 0.01;
}

export function localizedPlaceLabels(place, language, alternateLanguage, alternatePlace) {
  const labels = { [language]: { name: place.name, country: place.country } };
  if (matchingPlace(place, alternatePlace)) {
    labels[alternateLanguage] = { name: alternatePlace.name, country: alternatePlace.country };
  }
  return { ...labels, ...(commonCityLabels[place.id] || {}) };
}
