import test from "node:test";
import assert from "node:assert/strict";
import { comfort, isCurrentRequest, localizedPlaceLabels, matchingPlace, rainTiming, samePlace, toggleSavedPlace, weatherAlerts, weatherType } from "../logic.mjs";

test("weather codes map to user-facing conditions", () => {
  assert.equal(weatherType(0), "clear");
  assert.equal(weatherType(3), "cloudy");
  assert.equal(weatherType(61), "rain");
  assert.equal(weatherType(95), "storm");
});

test("comfort distinguishes dry, damp, and heat conditions", () => {
  assert.equal(comfort(5, 3, 85), "dampChill");
  assert.equal(comfort(5, 3, 25), "dryChill");
  assert.equal(comfort(22, 22, 55), "balanced");
  assert.equal(comfort(29, 31, 69), "stickyWarm");
  assert.equal(comfort(31, 34, 75), "oppressive");
});

test("only the newest forecast request may update the UI", () => {
  assert.equal(isCurrentRequest(4, 4), true);
  assert.equal(isCurrentRequest(3, 4), false);
  const firstSearch = 1;
  const secondSearch = 2;
  assert.equal(isCurrentRequest(firstSearch, secondSearch), false);
});

test("saved-city toggling is reversible and coordinate based", () => {
  const melbourne = { name: "Melbourne", latitude: -37.8136, longitude: 144.9631 };
  assert.deepEqual(toggleSavedPlace([], melbourne), [melbourne]);
  assert.deepEqual(toggleSavedPlace([melbourne], melbourne), []);
  assert.equal(samePlace(melbourne, { ...melbourne, name: "Melbourne CBD" }), true);
});

test("rain timing identifies the first meaningful wet hour", () => {
  const hours = [
    { precipitation: 0, precipitationProbability: 15 },
    { precipitation: 0.1, precipitationProbability: 30 },
    { precipitation: 0.4, precipitationProbability: 55 }
  ];
  assert.equal(rainTiming(hours), 2);
  assert.equal(rainTiming(hours.slice(0, 2)), -1);
});

test("alerts cover storms, heat, heavy rain, and high UV", () => {
  const alerts = weatherAlerts({
    current: { weatherCode: 0, apparentTemperature: 35, uvIndex: 0 },
    dailyMax: 36,
    dailyUvMax: 9,
    hours: [{ weatherCode: 95, precipitation: 4, precipitationProbability: 90 }]
  });
  assert.deepEqual(alerts, ["stormAlert", "heatAlert", "rainAlert", "uvAlert"]);
  assert.equal(alerts.length, 4);
});

test("high UV alert uses the daily maximum, not the UV at the current hour", () => {
  assert.deepEqual(weatherAlerts({
    current: { weatherCode: 0, apparentTemperature: 20, uvIndex: 0 },
    dailyMax: 22,
    dailyUvMax: 8,
    hours: []
  }), ["uvAlert"]);
});

test("common city labels remain bilingual when searched in Chinese", () => {
  const melbourne = { id: 2158177, name: "墨尔本", country: "澳大利亚" };
  const labels = localizedPlaceLabels(melbourne, "zh", "en", { name: "墨尔本", country: "澳大利亚" });
  assert.deepEqual(labels.en, { name: "Melbourne", country: "Australia" });
  assert.deepEqual(labels.zh, { name: "墨尔本", country: "澳大利亚" });
});

test("alternate place labels are used only for the same city", () => {
  const place = { id: 1, name: "Springfield", country: "United States", latitude: 39.8, longitude: -89.6 };
  assert.equal(matchingPlace(place, { ...place, name: "斯普林菲尔德" }), true);
  assert.equal(matchingPlace(place, { id: 2, name: "Springfield", country: "United States", latitude: 44.0, longitude: -123.0 }), false);
  assert.deepEqual(
    localizedPlaceLabels(place, "en", "zh", { id: 2, name: "斯普林菲尔德", country: "美国", latitude: 44.0, longitude: -123.0 }),
    { en: { name: "Springfield", country: "United States" } }
  );
});
