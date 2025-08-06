const API_KEY = 'your api key';
let currentPulses = [];
let markers = [];
let currentTheme = 'dark';
let latestNews = [];

// Theme toggle
function toggleTheme() {
  const dashboard = document.getElementById('dashboard');
  const themeIcon = document.getElementById('themeIcon');
  const themeText = document.getElementById('themeText');

  if (currentTheme === 'dark') {
    dashboard.setAttribute('data-theme', 'light');
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light Mode';
    currentTheme = 'light';
  } else {
    dashboard.removeAttribute('data-theme');
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark Mode';
    currentTheme = 'dark';
  }
  localStorage.setItem('preferred-theme', currentTheme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('preferred-theme');
  if (savedTheme && savedTheme !== currentTheme) {
    toggleTheme();
  }
}

function updateClock() {
  const now = new Date();
  const dayString = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timeString = now.toLocaleString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
  document.getElementById('clock').textContent = `${dayString} ${timeString}`;
}

// Leaflet map
const map = L.map('map').setView([20, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Threat data
async function fetchPulseData() {
  try {
    const response = await fetch('https://otx.alienvault.com/api/v1/pulses/subscribed', {
      headers: { 'X-OTX-API-KEY': API_KEY }
    });
    const data = await response.json();
    currentPulses = data.results;
    renderPulses(currentPulses);
  } catch (error) {
    console.error('Failed to fetch threat data:', error);
    document.getElementById('threatFeeds').innerHTML =
      '<div style="color: var(--critical-color); text-align: center; padding: 40px;">Failed to load threat feeds</div>';
  }
}

function renderPulses(pulses) {
  const container = document.getElementById('threatFeeds');
  container.innerHTML = '';
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  pulses.slice(0, 15).forEach(pulse => {
    const div = document.createElement('div');
    div.className = 'feed-block';

    const severity = getSeverityInfo(pulse.severity || 0);
    const category = categorizePulse(pulse);
    const timestamp = new Date(pulse.modified).toLocaleString();
    const tags = (pulse.tags || []).map(tag => `<span class="tag">${tag}</span>`).join(' ');
    const otxLink = `https://otx.alienvault.com/pulse/${pulse.id}`;

    let indicatorsHTML = '';
    pulse.indicators.slice(0, 5).forEach(indicator => {
      indicatorsHTML += `<div class="ioc">${indicator.type}: ${indicator.indicator}</div>`;
      const ipMatch = indicator.indicator.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      if (ipMatch) {
        addMapMarker(ipMatch[0]);
      }
    });

    div.innerHTML = `
      <h3>${pulse.name}</h3>
      <div class="meta">Updated: ${timestamp}</div>
      <div class="meta">Severity: <span class="severity ${severity.class}">${severity.label}</span> | Category: ${category}</div>
      <div class="meta">Indicators:</div>
      ${indicatorsHTML}
      <div class="meta">Tags: ${tags}</div>
      <div class="meta"><a href="${otxLink}" target="_blank" class="cve-link">View on OTX →</a></div>
    `;
    container.appendChild(div);
  });
}

function getSeverityInfo(severity) {
  if (severity >= 3) return { label: 'Critical', class: 'critical' };
  if (severity === 2) return { label: 'High', class: 'high' };
  if (severity === 1) return { label: 'Medium', class: 'medium' };
  return { label: 'Low', class: 'low' };
}

function categorizePulse(pulse) {
  const tags = pulse.tags || [];
  if (tags.some(t => /phish|spoof/i.test(t))) return 'Phishing';
  if (tags.some(t => /ransom/i.test(t))) return 'Ransomware';
  if (tags.some(t => /malware|trojan|worm/i.test(t))) return 'Malware';
  if (tags.some(t => /apt|group/i.test(t))) return 'APT';
  return 'Uncategorized';
}

const IPINFO_KEY = 'your api key';
async function addMapMarker(ip) {
  try {
    const loc = await fetch(`https://ipinfo.io/${ip}?token=${IPINFO_KEY}`).then(r => r.json());
    if (loc && loc.loc) {
      const [lat, lon] = loc.loc.split(',').map(Number);
      const m = L.circleMarker([lat, lon], {
        radius: 10,
        color: 'red',
        fillColor: '#ff6f00',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);
      m.bindPopup(`${ip} — ${loc.city || ''}, ${loc.region || ''}, ${loc.country || ''}`);
      markers.push(m);
    }
  } catch (e) {
    console.warn(`Failed to geolocate ${ip}`, e);
  }
}

// Alert ticker
function updateAlertTicker(newsItems) {
  const ticker = document.getElementById('alertTicker');
  if (newsItems && newsItems.length > 0) {
    const headlines = newsItems.slice(0, 5).map(item => item.title).join(' • ');
    ticker.textContent = `BREAKING: ${headlines}`;
  } else {
    ticker.textContent = 'ALERT: Loading latest cybersecurity news...';
  }
}

// CVE Fetch
async function fetchCVEData() {
  try {
    const container = document.getElementById('cveList');
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

    const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${startDate}&pubEndDate=${endDate}&resultsPerPage=100`);
    const data = await response.json();
    container.innerHTML = '';

    if (data.vulnerabilities && data.vulnerabilities.length > 0) {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const freshCVEs = data.vulnerabilities.filter(vuln => {
        const publishedDate = new Date(vuln.cve.published);
        return publishedDate >= last24h;
      });

      if (freshCVEs.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); padding: 40px; text-align: center;">No CVEs published in the last 24 hours</div>`;
        return;
      }

      const sortedCVEs = freshCVEs
        .filter(vuln => vuln.cve.metrics && (vuln.cve.metrics.cvssMetricV31 || vuln.cve.metrics.cvssMetricV2))
        .sort((a, b) => {
          const scoreA = getCVSSScore(a.cve);
          const scoreB = getCVSSScore(b.cve);
          return scoreB - scoreA;
        })
        .slice(0, 10);

      sortedCVEs.forEach(vuln => {
        const cve = vuln.cve;
        const cveId = cve.id;
        const description = cve.descriptions.find(d => d.lang === 'en')?.value || 'No description available';
        const publishedDate = new Date(cve.published).toLocaleDateString();
        const score = getCVSSScore(cve);
        const severity = getSeverity(score);
        const shortDescription = description.length > 150 ? description.substring(0, 150) + '...' : description;
        const cveUrl = `https://nvd.nist.gov/vuln/detail/${cveId}`;

        const cveDiv = document.createElement('div');
        cveDiv.className = 'cve-item';
        cveDiv.innerHTML = `
          <div class="cve-id">${cveId} <span class="cve-score ${severity}">CVSS: ${score}</span></div>
          <div class="cve-description">${shortDescription}</div>
          <div class="cve-published">Published: ${publishedDate}</div>
          <a href="${cveUrl}" target="_blank" class="cve-link">View on NIST NVD →</a>
        `;

        cveDiv.addEventListener('click', function () {
          const descDiv = this.querySelector('.cve-description');
          if (descDiv.textContent.endsWith('...')) {
            descDiv.textContent = description;
          } else if (description.length > 150) {
            descDiv.textContent = shortDescription;
          }
        });

        container.appendChild(cveDiv);
      });
    }
  } catch (error) {
    console.error('Failed to fetch CVE data:', error);
    document.getElementById('cveList').innerHTML =
      '<div style="color: var(--critical-color); text-align: center; padding: 40px;">Failed to load CVE data</div>';
  }
}

function getCVSSScore(cve) {
  if (cve.metrics?.cvssMetricV31?.length > 0) {
    return cve.metrics.cvssMetricV31[0].cvssData.baseScore;
  } else if (cve.metrics?.cvssMetricV2?.length > 0) {
    return cve.metrics.cvssMetricV2[0].cvssData.baseScore;
  }
  return 0;
}

function getSeverity(score) {
  if (score >= 9.0) return 'critical';
  else if (score >= 7.0) return 'high';
  else if (score >= 4.0) return 'medium';
  else return 'low';
}

// ✅ Unified Cybersecurity News (merged from all 3 feeds)
async function loadAllNews() {
  const feeds = [
    'https://cybersecuritynews.com/feed/',
    'https://feeds.feedburner.com/TheHackersNews',
    'https://www.bleepingcomputer.com/feed/'
  ];
  const container = document.getElementById('cyberNewsTab');
  container.innerHTML = '<div class="loading">Loading news</div>';
  let allItems = [];

  try {
    for (const url of feeds) {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.items) {
        allItems.push(...data.items);
      }
    }

    allItems = allItems
      .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
      .slice(0, 10);

    latestNews = allItems;
    updateAlertTicker(latestNews);

    container.innerHTML = '';
    allItems.forEach(item => {
      const div = document.createElement('div');
      div.className = 'feed-block';

      const publishDate = new Date(item.pubDate).toLocaleString();
      const description = item.description.replace(/<[^>]*>/g, '').slice(0, 200) + '...';

      div.innerHTML = `
        <h3>${item.title}</h3>
        <div class="meta">${publishDate}</div>
        <div class="meta" style="margin-top: 12px;">${description}</div>
        <div class="meta" style="margin-top: 12px;">
          <a href="${item.link}" target="_blank" class="cve-link">Read Full Article →</a>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    console.error('Failed to load news:', err);
    container.innerHTML = '<div style="color: var(--critical-color); text-align: center; padding: 40px;">Failed to load news</div>';
  }
}

// Export to CSV
function exportToCSV() {
  const rows = [['Title', 'Date', 'Severity', 'Category', 'Indicators', 'Tags', 'OTX URL']];
  currentPulses.slice(0, 20).forEach(pulse => {
    const indicators = pulse.indicators.slice(0, 5).map(i => i.indicator).join(' | ');
    const tags = (pulse.tags || []).join(', ');
    const date = new Date(pulse.created).toLocaleString();
    const severity = getSeverityInfo(pulse.severity || 0).label;
    const category = categorizePulse(pulse).replace(/[🎯🎣💰🦠🎭❓]/g, '').trim();
    const otxUrl = `https://otx.alienvault.com/pulse/${pulse.id}`;
    rows.push([pulse.name, date, severity, category, indicators, tags, otxUrl]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' +
    rows.map(row => row.map(field => `"${field}"`).join(',')).join('\n');

  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', `threat_intel_feed_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Event Listeners
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('exportCSV').addEventListener('click', exportToCSV);

// Initialize dashboard
function initializeDashboard() {
  loadTheme();
  updateClock();
  setInterval(updateClock, 1000);
  fetchPulseData();
  fetchCVEData();
  loadAllNews();
  setInterval(fetchPulseData, 5 * 60 * 1000);
  setInterval(fetchCVEData, 10 * 60 * 1000);
  setInterval(loadAllNews, 15 * 60 * 1000);
}

window.addEventListener('load', initializeDashboard);
window.addEventListener('resize', function () {
  if (map) {
    setTimeout(() => {
      map.invalidateSize();
      const mapContainer = document.getElementById('map');
      if (mapContainer.offsetHeight === 0) {
        mapContainer.style.height = '45vh';
        map.invalidateSize();
      }
    }, 100);
  }
});
setTimeout(() => {
  if (map) {
    map.invalidateSize();
  }
}, 500);
