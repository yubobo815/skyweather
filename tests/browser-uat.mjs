import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import test from "node:test";

const playwrightModule = await import(process.env.PLAYWRIGHT_CORE_MODULE || "playwright-core");
const { chromium } = playwrightModule.default || playwrightModule;

const root = resolve(import.meta.dirname, "..");
const chromeExecutable = process.env.BREEZO_CHROME_EXECUTABLE;
const fixturePlace = {
  id: 2158177,
  name: "Melbourne",
  country: "Australia",
  latitude: -37.8136,
  longitude: 144.9631,
  isLastLocation: true,
  labels: { en: { name: "Melbourne", country: "Australia" }, zh: { name: "墨尔本", country: "澳大利亚" } }
};
const weather = {
  current: {
    time: "2026-07-28T10:30", temperature_2m: 21, apparent_temperature: 22,
    relative_humidity_2m: 58, precipitation: 0.2, weather_code: 61, wind_speed_10m: 18, uv_index: 2
  },
  hourly: {
    time: ["2026-07-28T10:00", "2026-07-28T11:00", "2026-07-28T12:00", "2026-07-28T13:00", "2026-07-28T14:00", "2026-07-28T15:00", "2026-07-28T16:00", "2026-07-28T17:00", "2026-07-28T18:00", "2026-07-28T19:00", "2026-07-28T20:00", "2026-07-28T21:00", "2026-07-28T22:00"],
    temperature_2m: [99, 22, 23, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15],
    precipitation: [0, 0, 0.1, 0.4, 0.2, 0, 0, 0, 0, 0, 0, 0, 0],
    precipitation_probability: [0, 10, 20, 65, 40, 10, 0, 0, 0, 0, 0, 0, 0],
    weather_code: [0, 1, 2, 61, 61, 3, 3, 3, 2, 1, 0, 0, 0],
    wind_speed_10m: [4, 11, 12, 15, 18, 20, 22, 18, 14, 10, 8, 6, 4]
  },
  daily: {
    time: ["2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31", "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06"],
    weather_code: [61, 2, 3, 61, 0, 1, 2, 3, 61, 0],
    temperature_2m_max: [24, 25, 23, 22, 26, 27, 25, 23, 21, 24],
    temperature_2m_min: [14, 15, 13, 12, 14, 16, 15, 12, 11, 13],
    precipitation_probability_max: [70, 20, 10, 60, 5, 0, 15, 30, 75, 10],
    uv_index_max: [9, 8, 5, 4, 7, 8, 6, 4, 3, 5]
  }
};

const contentTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json" };

function startServer() {
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const filename = resolve(root, relativePath);
    if (!filename.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    try {
      response.writeHead(200, { "content-type": contentTypes[extname(filename)] || "application/octet-stream" });
      response.end(await readFile(filename));
    } catch {
      response.writeHead(404).end();
    }
  });
  return new Promise((resolveServer) => server.listen(0, "127.0.0.1", () => resolveServer(server)));
}

function serverUrl(server) {
  return `http://127.0.0.1:${server.address().port}`;
}

async function openApp(browser, viewport) {
  const context = await browser.newContext({ viewport });
  await context.addInitScript((place) => {
    localStorage.setItem("breezo-last-place", JSON.stringify(place));
    localStorage.setItem("breezo-saved", JSON.stringify([place]));
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition() { throw new Error("Geolocation must not be used with a saved last location"); } }
    });
  }, fixturePlace);
  const page = await context.newPage();
  await page.route("https://api.open-meteo.com/v1/forecast?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(weather) }));
  await page.route("https://geocoding-api.open-meteo.com/v1/search?**", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify({ results: [fixturePlace] }) }));
  await page.route("https://cdn.jsdelivr.net/**", (route) => route.fulfill({ contentType: "image/svg+xml", body: "<svg xmlns=\"http://www.w3.org/2000/svg\"/>" }));
  return { context, page };
}

test("browser UAT covers persisted forecast data and responsive presentation", { timeout: 30000 }, async (t) => {
  assert.ok(chromeExecutable, "Set BREEZO_CHROME_EXECUTABLE to a Chrome/Chromium executable path.");
  const server = await startServer();
  const browser = await chromium.launch({ executablePath: chromeExecutable, headless: true });
  t.after(async () => {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  });

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { context, page } = await openApp(browser, viewport);
    await page.goto(serverUrl(server), { waitUntil: "networkidle" });
    await page.locator("#weather .hero").waitFor();

    await t.test(`${viewport.width}px: saved location, forecast data, and layout`, async () => {
      await assert.doesNotReject(() => page.waitForTimeout(50));
      assert.match(await page.locator("#place").textContent(), /Last location, Australia/);
      const removeSavedCity = page.getByRole("button", { name: "Remove Last location" });
      assert.equal(await removeSavedCity.count(), 1);
      await removeSavedCity.click();
      assert.equal(await page.getByRole("button", { name: "Remove Last location" }).count(), 0);
      assert.equal(await page.locator("#summary").textContent(), "Feels like 22°C · Balanced");
      assert.equal(await page.locator(".insights").count(), 0);
      assert.equal(await page.locator("#hourly article").count(), 12);
      assert.match(await page.locator("#hourly article").first().textContent(), /Now\s+.*21/);
      assert.equal((await page.locator("#hourly article").first().textContent()).includes("99"), false);
      assert.match(await page.locator("#weather-brief").textContent(), /^Showers are around now, then should ease by .+\. Temperatures will reach 24°C today\. UV will be high, so use sun protection\. Keep an umbrella handy; keep your sport plans indoors\.$/);
      assert.equal(await page.locator("#alerts").count(), 0);
      assert.equal(await page.locator(".metrics article").nth(2).locator("span").textContent(), "Rain now");
      assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth), true);
    });

    await page.getByRole("button", { name: "中" }).click();
    await assert.doesNotReject(() => page.getByText("未来 12 小时", { exact: true }).waitFor());
    assert.equal(await page.locator("#summary").textContent(), "体感 22°C · 体感平衡");
    assert.match(await page.locator("#weather-brief").textContent(), /^当前有阵雨，预计 .+ 前后减弱。气温最高约 24°C。紫外线较强，外出注意防晒。带上雨伞，运动更适合安排在室内。$/);
    assert.equal(await page.locator(".metrics article").nth(2).locator("span").textContent(), "当前降雨");
    assert.match(await page.locator("#hourly article").first().textContent(), /现在/);

    await page.getByRole("button", { name: "EN" }).click();
    const before = await page.locator("#wind").textContent();
    await page.locator("#unit-toggle").click();
    const after = await page.locator("#wind").textContent();
    assert.match(before, /km\/h$/);
    assert.match(after, /mph$/);
    assert.match(await page.locator("#temperature-unit").textContent(), /°F/);
    assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth), true);

    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    assert.match(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor), /rgb\(25, 27, 32\)/);
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    await context.close();
  }
});
