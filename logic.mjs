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

export function weatherAlerts({ current, dailyMax, hours }) {
  const alerts = [];
  if (weatherType(current.weatherCode) === "storm" || hours.some(hour => weatherType(hour.weatherCode) === "storm")) alerts.push("stormAlert");
  if (current.apparentTemperature >= 34 || dailyMax >= 35) alerts.push("heatAlert");
  if (hours.some(hour => hour.precipitation >= 3 || (hour.precipitation >= 1 && hour.precipitationProbability >= 80))) alerts.push("rainAlert");
  if (current.uvIndex >= 8) alerts.push("uvAlert");
  return alerts;
}
