# 🛡️ Threat Intelligence Dashboard

A web-based SOC dashboard that visualizes the latest threat intelligence using open APIs from AlienVault OTX, NIST NVD, RSS feeds, and IP geolocation services. Built with HTML, CSS, and JavaScript.

---

## 🚀 Features

- 🌐 Live Threat Feeds (from OTX)
- 🗺️ IP-based Threat Map (Leaflet.js)
- 🛡️ Daily CVE List (NVD API)
- 📰 Cybersecurity News Feed (RSS)
- 📤 Export Threat Feed to CSV
- 🌓 Light/Dark Mode
- 🕒 Real-Time Clock

---

## 📂 Project Structure

```
.
├── index.html
├── style.css
└── script.js
```

---

## ⚙️ JavaScript Function Documentation

### `initializeDashboard()`
Initializes the dashboard on page load: applies theme, fetches data, starts intervals.

### `toggleTheme()`
Toggles between light and dark mode. Saves preference to `localStorage`.

### `updateClock()`
Displays current day/time in the header. Updates every second.

### `fetchPulseData()`
Fetches subscribed threat pulses from AlienVault OTX API.

### `renderPulses(pulses)`
Processes and displays each threat pulse in the dashboard. Renders up to 15 items.

### `addMapMarker(ip)`
Uses ipinfo.io to geolocate an IP address and place it on the Leaflet map.

### `fetchCVEData()`
Fetches newly published CVEs from NVD API (last 24 hours). Shows top 10.

### `getCVSSScore(cve)` & `getSeverity(score)`
Calculates and classifies CVSS score into Critical, High, Medium, Low.

### `loadAllNews()`
Fetches and merges articles from 3 RSS feeds: THN, BleepingComputer, and Cybersecurity News.

### `updateAlertTicker(newsItems)`
Updates the top alert bar with latest news headlines.

### `exportToCSV()`
Exports the top 20 threat pulses as a downloadable CSV file.

---

## 📦 Dependencies

| Tool/API         | Purpose                              |
|------------------|---------------------------------------|
| Leaflet.js       | Map rendering                         |
| ipinfo.io        | IP Geolocation                        |
| OTX API          | Threat pulse data                     |
| NVD API          | Latest CVEs                           |
| rss2json API     | Convert RSS feed to JSON              |

---

## 🛡️ API Keys Required

- `X-OTX-API-KEY`: [Get from OTX](https://otx.alienvault.com)
- `ipinfo.io` token: [Get here](https://ipinfo.io)

---

## 📤 Export Behavior

Clicking “Export Feed to CSV” downloads `threat_intel_feed_YYYY-MM-DD.csv`.

---

## 🕒 Auto-Refresh Intervals

| Feature     | Interval        |
|-------------|-----------------|
| Clock       | 1 second        |
| Threat Feed | Every 5 minutes |
| CVEs        | Every 10 mins   |
| News        | Every 15 mins   |

---

## 📄 License

MIT License
