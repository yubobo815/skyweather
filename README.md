# Breezo

A static weather app that looks up a postal code or city, resolves it to coordinates, and shows current conditions, today's hourly forecast, saved cities, and an extended forecast.

## Run

Open `index.html` in a browser.

The app uses:

- Zippopotam.us for postal-code lookup: https://docs.zippopotam.us/docs/v1/
- Open-Meteo Geocoding API for city search: https://open-meteo.com/en/docs/geocoding-api
- Open-Meteo Forecast API for forecast data: https://open-meteo.com/en/docs
- Open-Meteo Air Quality API for AQI and particulate data: https://open-meteo.com/en/docs/air-quality-api
- BigDataCloud Reverse Geocoding API for current-location labels: https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api
- OpenStreetMap Nominatim reverse geocoding as a fallback for current-location labels: https://nominatim.org/release-docs/latest/api/Reverse/
- Meteocons for animated SVG weather icons: https://meteocons.com/
