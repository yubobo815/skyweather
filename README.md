# Breezo

A fresh static weather app rebuild. Open `index.html` in a browser, or deploy the folder as a static site. Weather data is provided directly by Open-Meteo; no API key is needed.

To deploy with GitHub Pages, make this folder the root of a new repository, select **GitHub Actions** in the repository's Pages settings, then push to `main`. The included workflow targets Node 24 action runtime compatibility.

The app persists language, temperature unit, and saved cities locally. Language and unit switches render from the last coordinate-based weather result, avoiding language-specific geocoding failures.
