import test from "node:test";
import assert from "node:assert/strict";
import { comfort, isCurrentRequest, rainTiming, samePlace, toggleSavedPlace, weatherAlerts, weatherType } from "../logic.mjs";

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
    current: { weatherCode: 0, apparentTemperature: 35, uvIndex: 9 },
    dailyMax: 36,
    hours: [{ weatherCode: 95, precipitation: 4, precipitationProbability: 90 }]
  });
  assert.deepEqual(alerts, ["stormAlert", "heatAlert", "rainAlert", "uvAlert"]);
  assert.equal(alerts.length, 4);
});
