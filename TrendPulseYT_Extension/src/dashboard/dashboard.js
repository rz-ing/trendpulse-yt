/**
 * TrendPulse YT - Main Dashboard Controller
 * Handles table interactions, niche discovery, Chart.js visualizations, pattern analysis, and settings.
 */

import { getSettings, getTrackedVideos, saveSettings, removeTrackedVideo, saveTrackedVideo, getQuotaStats } from '../storage.js';
import { fetchVideoDetails } from '../api.js';
import { analyzeVideoPatterns } from '../patternAnalysis.js';
import { getLicenseStatus, activateLicenseKey } from '../license.js';
import { generateKeywordSuggestions } from '../seo.js';

// Application State
let currentTab = 'tab-dashboard';
let trackedVideosList = [];
let currentFilterType = 'all'; // 'all', 'own', 'competitor'
let currentSearchQuery = '';
let currentSortKey = 'velocity_desc';
let chartDurationInstance = null;
let chartTimingInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupEventListeners();
  await refreshDashboardData();
});

/**
 * Tab Navigation Setup
 */
function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      if (targetTab === currentTab) return;

      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-page').forEach(page => page.classList.remove('active'));
      const activePage = document.getElementById(targetTab);
      if (activePage) activePage.classList.add('active');

      currentTab = targetTab;
      updateHeaderTitles(targetTab);

      if (targetTab === 'tab-patterns') {
        renderPatternAnalysis();
      } else if (targetTab === 'tab-settings') {
        loadSettingsForm();
      }
    });
  });
}

function updateHeaderTitles(tabId) {
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');

  switch (tabId) {
    case 'tab-dashboard':
      titleEl.textContent = 'Dashboard Comparativo';
      subEl.textContent = 'Monitoreo de velocidad de crecimiento y rendimiento en tiempo real';
      break;
    case 'tab-niche':
      titleEl.textContent = 'Buscador de Nicho';
      subEl.textContent = 'Descubre y agrega videos recientes de tu temática para comparar su desempeño';
      break;
    case 'tab-patterns':
      titleEl.textContent = 'Análisis de Patrones ("¿Por qué funciona?")';
      subEl.textContent = 'Identifica duraciones, horarios y formatos estructurales de los videos top del nicho';
      break;
    case 'tab-settings':
      titleEl.textContent = 'Configuración';
      subEl.textContent = 'Ajusta tu API Key de YouTube, umbrales de tendencia y sincronización de canal';
      break;
  }
}

/**
 * Loads data from storage and refreshes all UI components.
 */
async function refreshDashboardData() {
  trackedVideosList = await getTrackedVideos();
  const quota = await getQuotaStats();
  const license = await getLicenseStatus();

  updateSidebarQuota(quota);
  updateLicenseBadge(license);
  renderSummaryStats();
  renderTrackedTable();
  populatePatternNicheSelect();
}

function updateLicenseBadge(license) {
  const chip = document.getElementById('license-status-chip');
  if (!chip) return;

  if (license.isActivated && license.planType === 'PRO') {
    chip.textContent = '⭐ PRO ACTIVADO';
    chip.className = 'license-chip chip-pro';
  } else {
    chip.textContent = '🔑 ACTIVAR PRO';
    chip.className = 'license-chip chip-free';
  }
}

function updateSidebarQuota(quota) {
  document.getElementById('sidebar-quota-pct').textContent = `${quota.percentage}%`;
  document.getElementById('sidebar-quota-sub').textContent = `${quota.usedToday.toLocaleString()} / 10,000 u`;
  
  const bar = document.getElementById('sidebar-quota-bar');
  bar.style.width = `${quota.percentage}%`;
  if (quota.percentage > 80) bar.style.background = 'linear-gradient(135deg, #f97316, #ef4444)';
}

/**
 * Renders upper Summary Cards
 */
function renderSummaryStats() {
  const total = trackedVideosList.length;
  const trendingCount = trackedVideosList.filter(v => v.isTrending).length;
  
  const avgVel = total > 0 ? Math.round(trackedVideosList.reduce((acc, v) => acc + (v.currentVelocity || 0), 0) / total) : 0;
  const avgEng = total > 0 ? (trackedVideosList.reduce((acc, v) => acc + (v.engagementRate || 0), 0) / total).toFixed(2) : '0';

  document.getElementById('dash-total-vids').textContent = total;
  document.getElementById('dash-trending-vids').textContent = trendingCount;
  document.getElementById('dash-avg-velocity').textContent = `${avgVel.toLocaleString()} /h`;
  document.getElementById('dash-avg-engagement').textContent = `${avgEng}%`;
}

/**
 * Renders Main Tracked Videos Table with filtering & sorting
 */
function renderTrackedTable() {
  const tbody = document.getElementById('tracked-table-body');
  const emptyState = document.getElementById('table-empty-state');
  tbody.innerHTML = '';

  let filtered = [...trackedVideosList];

  // 1. Filter by ownership
  if (currentFilterType === 'own') {
    filtered = filtered.filter(v => v.isOwn);
  } else if (currentFilterType === 'competitor') {
    filtered = filtered.filter(v => !v.isOwn);
  }

  // 2. Filter by search query
  if (currentSearchQuery) {
    const q = currentSearchQuery.toLowerCase();
    filtered = filtered.filter(v => (v.title || '').toLowerCase().includes(q) || (v.channelTitle || '').toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  // 3. Sort
  filtered.sort((a, b) => {
    if (currentSortKey === 'velocity_desc') return (b.currentVelocity || 0) - (a.currentVelocity || 0);
    if (currentSortKey === 'seo_desc') return (b.seoScore || 0) - (a.seoScore || 0);
    if (currentSortKey === 'views_desc') return (b.views || 0) - (a.views || 0);
    if (currentSortKey === 'engagement_desc') return (b.engagementRate || 0) - (a.engagementRate || 0);
    if (currentSortKey === 'date_desc') return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return 0;
  });

  // Render Rows
  filtered.forEach(video => {
    const tr = document.createElement('tr');

    const ytWatchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
    const pubDateFormatted = video.publishedAt ? new Date(video.publishedAt).toLocaleDateString('es-ES') : 'N/A';
    const seoScore = video.seoScore || 75;
    let seoColor = '#ef4444';
    if (seoScore >= 80) seoColor = '#10b981';
    else if (seoScore >= 60) seoColor = '#f59e0b';

    tr.innerHTML = `
      <td>
        <div class="video-cell">
          <img src="${video.thumbnailUrl}" class="video-thumb" alt="Thumbnail" />
          <div class="video-details">
            <a href="${ytWatchUrl}" target="_blank" class="video-title-link" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</a>
            <span class="video-channel">📺 ${escapeHtml(video.channelTitle)} (${video.durationFormatted})</span>
          </div>
        </div>
      </td>
      <td><strong>${(video.views || 0).toLocaleString()}</strong></td>
      <td><strong style="color: #38bdf8;">🚀 ${(video.currentVelocity || 0).toLocaleString()} /h</strong></td>
      <td>+${(video.views24h || 0).toLocaleString()}</td>
      <td><strong style="color: ${seoColor};">🎯 ${seoScore}/100</strong></td>
      <td>${video.engagementRate || 0}%</td>
      <td>${pubDateFormatted}</td>
      <td>
        ${video.isTrending ? '<span class="badge-trending">🔥 En Tendencia</span>' : '<span class="badge-normal">📊 Normal</span>'}
      </td>
      <td>
        <span class="${video.isOwn ? 'badge-own' : 'badge-competitor'}">
          ${video.isOwn ? '👤 Propio' : '⚔️ Competencia'}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 4px;">
          <button class="action-btn-sm btn-toggle-own" data-id="${video.videoId}" title="${video.isOwn ? 'Cambiar a Competencia' : 'Marcar como Propio'}">
            ${video.isOwn ? '👤' : '⚔️'}
          </button>
          <button class="action-btn-sm btn-delete-vid" data-id="${video.videoId}" title="Eliminar del seguimiento">
            🗑️
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  // Bind inline action handlers
  tbody.querySelectorAll('.btn-delete-vid').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('¿Eliminar este video del seguimiento?')) {
        await removeTrackedVideo(id);
        await refreshDashboardData();
      }
    });
  });

  tbody.querySelectorAll('.btn-toggle-own').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const vid = trackedVideosList.find(v => v.videoId === id);
      if (vid) {
        await saveTrackedVideo(vid, !vid.isOwn, vid.nicheGroup);
        await refreshDashboardData();
      }
    });
  });
}

/**
 * Setup Event Listeners across all tabs & modals
 */
function setupEventListeners() {
  // Fetch Trending Button (Topbar)
  document.getElementById('btn-fetch-trending')?.addEventListener('click', async () => {
    // Switch to niche tab
    const nicheNavBtn = document.querySelector('.nav-btn[data-tab="tab-niche"]');
    if (nicheNavBtn) nicheNavBtn.click();

    // Trigger trending search automatically
    const loadBtn = document.getElementById('btn-load-trending-niche');
    if (loadBtn) loadBtn.click();
  });

  // Load Trending Niche Button
  document.getElementById('btn-load-trending-niche')?.addEventListener('click', async () => {
    const regionCode = document.getElementById('trending-region-select')?.value || 'ES';
    const container = document.getElementById('niche-results-container');

    container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 24px;">🔥 Cargando las tendencias del momento para ${regionCode}... (Consumo: solo 1u cuota)</p>`;

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'FETCH_TRENDING_VIDEOS',
        regionCode,
        maxResults: 12
      });

      if (!res || !res.success) {
        container.innerHTML = `<div class="alert alert-info" style="grid-column: 1/-1;">⚠️ ${res?.error || 'Error al obtener tendencias.'}</div>`;
        return;
      }

      renderNicheResults(res.results, `Tendencias ${regionCode}`);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-info" style="grid-column: 1/-1;">⚠️ Error al conectar con la API de YouTube.</div>`;
    }
  });

  // Force Poll Button
  document.getElementById('btn-force-poll').addEventListener('click', async () => {
    const btn = document.getElementById('btn-force-poll');
    btn.disabled = true;
    btn.innerHTML = '<span class="btn-icon">⏳</span> Polling...';

    try {
      const res = await chrome.runtime.sendMessage({ type: 'FORCE_POLL_NOW' });
      if (res && res.success) {
        await refreshDashboardData();
        alert('✅ Snapshots de videos actualizados correctamente.');
      } else {
        alert(`Error: ${res?.error || 'No se pudo actualizar.'}`);
      }
    } catch (err) {
      alert('Error de comunicación con el service worker.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="btn-icon">🔄</span> Actualizar Ahora';
    }
  });

  // Filter chips
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentFilterType = chip.getAttribute('data-filter-type');
      renderTrackedTable();
    });
  });

  // Search input
  document.getElementById('dash-search-input').addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim();
    renderTrackedTable();
  });

  // Sort select
  document.getElementById('dash-sort-select').addEventListener('change', (e) => {
    currentSortKey = e.target.value;
    renderTrackedTable();
  });

  // Modal setup
  const modal = document.getElementById('add-video-modal');
  document.getElementById('btn-add-modal').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));
  document.getElementById('btn-cancel-modal').addEventListener('click', () => modal.classList.add('hidden'));

  // License Modal setup
  const licenseModal = document.getElementById('license-modal');
  const chipBtn = document.getElementById('license-status-chip');
  if (chipBtn) chipBtn.addEventListener('click', () => licenseModal.classList.remove('hidden'));

  document.getElementById('btn-close-license-modal')?.addEventListener('click', () => licenseModal.classList.add('hidden'));
  document.getElementById('btn-cancel-license-modal')?.addEventListener('click', () => licenseModal.classList.add('hidden'));

  document.getElementById('btn-confirm-activate-license')?.addEventListener('click', async () => {
    const keyInput = document.getElementById('modal-license-key').value.trim();
    const msgBox = document.getElementById('license-msg-box');

    const res = await activateLicenseKey(keyInput);
    msgBox.classList.remove('hidden', 'alert-info', 'alert-danger');

    if (res.success) {
      msgBox.classList.add('alert-info');
      msgBox.textContent = res.message;
      await refreshDashboardData();
      setTimeout(() => licenseModal.classList.add('hidden'), 1500);
    } else {
      msgBox.classList.add('alert-info');
      msgBox.textContent = res.error;
    }
  });

  document.getElementById('btn-confirm-add-modal').addEventListener('click', async () => {
    const inputUrl = document.getElementById('modal-input-url').value.trim();
    const nicheGroup = document.getElementById('modal-input-niche').value.trim() || 'General';
    const isOwn = document.getElementById('modal-check-own').checked;

    if (!inputUrl) {
      alert('Ingresa una URL o ID de video válido.');
      return;
    }

    const videoId = extractVideoId(inputUrl);
    if (!videoId) {
      alert('No se pudo extraer el ID del video.');
      return;
    }

    const settings = await getSettings();
    if (!settings.apiKey) {
      alert('Configura tu API Key en la pestaña de Ajustes primero.');
      return;
    }

    const confirmBtn = document.getElementById('btn-confirm-add-modal');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Obteniendo...';

    try {
      const details = await fetchVideoDetails(videoId, settings.apiKey);
      if (details.length === 0) {
        alert('Video no encontrado o privado.');
        return;
      }

      await saveTrackedVideo(details[0], isOwn, nicheGroup);
      modal.classList.add('hidden');
      document.getElementById('modal-input-url').value = '';
      await refreshDashboardData();
      alert('✅ Video agregado al seguimiento.');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Agregar Video';
    }
  });

  // Niche Search setup
  document.getElementById('btn-search-niche').addEventListener('click', async () => {
    const keyword = document.getElementById('niche-input').value.trim();
    const maxResults = parseInt(document.getElementById('niche-results-count').value, 10);
    const container = document.getElementById('niche-results-container');

    if (!keyword) {
      alert('Ingresa una palabra clave para buscar.');
      return;
    }

    container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 24px;">🔍 Buscando videos recientes de "${escapeHtml(keyword)}"... (Consumo: 100u cuota)</p>`;

    try {
      const res = await chrome.runtime.sendMessage({
        type: 'SEARCH_NICHE',
        keyword,
        maxResults
      });

      if (!res || !res.success) {
        container.innerHTML = `<div class="alert alert-info" style="grid-column: 1/-1;">⚠️ ${res?.error || 'Error al realizar la búsqueda.'}</div>`;
        return;
      }

      renderNicheResults(res.results, keyword);
    } catch (err) {
      container.innerHTML = `<div class="alert alert-info" style="grid-column: 1/-1;">⚠️ Error de conexión con la API.</div>`;
    }
  });

  // Settings form submission
  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const apiKey = document.getElementById('cfg-api-key').value.trim();
    const trendThreshold = parseInt(document.getElementById('cfg-trend-threshold').value, 10) || 500;
    const pollingInterval = parseInt(document.getElementById('cfg-polling-interval').value, 10) || 30;
    const maxTrackedVideos = parseInt(document.getElementById('cfg-max-videos').value, 10) || 30;
    const myChannelId = document.getElementById('cfg-my-channel').value.trim();

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings: { apiKey, trendThreshold, pollingInterval, maxTrackedVideos, myChannelId }
      });
      alert('✅ Configuración guardada correctamente.');
      await refreshDashboardData();
    } catch (err) {
      alert('Error al guardar la configuración.');
    }
  });

  // Sync My Videos button
  document.getElementById('btn-sync-my-vids').addEventListener('click', async () => {
    const btn = document.getElementById('btn-sync-my-vids');
    btn.disabled = true;
    btn.textContent = 'Sincronizando...';

    try {
      const res = await chrome.runtime.sendMessage({ type: 'SYNC_MY_VIDEOS' });
      if (res && res.success) {
        await refreshDashboardData();
        alert(`✅ Sincronizados ${res.ownVideosCount} videos de tu canal.`);
      } else {
        alert(`Error: ${res?.error || 'No se pudieron obtener tus videos.'}`);
      }
    } catch (err) {
      alert('Error al sincronizar tus videos.');
    } finally {
      btn.disabled = false;
      btn.textContent = '🔄 Sincronizar Mis Videos';
    }
  });
}

/**
 * Renders Niche Search Discovered Items
 */
function renderNicheResults(results, keyword) {
  const container = document.getElementById('niche-results-container');
  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = `<p class="text-muted" style="grid-column: 1/-1; text-align: center;">No se encontraron videos recientes para esa temática.</p>`;
    return;
  }

  results.forEach(video => {
    const isAlreadyTracked = trackedVideosList.some(v => v.videoId === video.videoId);
    const card = document.createElement('div');
    card.className = 'niche-item-card';

    card.innerHTML = `
      <img src="${video.thumbnailUrl}" class="niche-item-thumb" alt="Thumbnail" />
      <div class="niche-item-body">
        <div class="niche-item-title" title="${escapeHtml(video.title)}">${escapeHtml(video.title)}</div>
        <div style="font-size: 11px; color: var(--text-muted);">📺 ${escapeHtml(video.channelTitle)} (${video.durationFormatted})</div>
        <div style="font-size: 12px; font-weight: 700; color: #38bdf8;">👁️ ${video.views.toLocaleString()} vistas</div>
        <button class="btn ${isAlreadyTracked ? 'btn-secondary' : 'btn-primary'} btn-track-niche" data-id="${video.videoId}" style="margin-top: 8px; font-size: 11px; padding: 6px 10px;">
          ${isAlreadyTracked ? '✅ En seguimiento' : '➕ Trackear en Nicho'}
        </button>
      </div>
    `;

    const trackBtn = card.querySelector('.btn-track-niche');
    if (trackBtn && !isAlreadyTracked) {
      trackBtn.addEventListener('click', async () => {
        trackBtn.disabled = true;
        trackBtn.textContent = 'Guardando...';

        await saveTrackedVideo(video, false, keyword);
        await refreshDashboardData();

        trackBtn.classList.remove('btn-primary');
        trackBtn.classList.add('btn-secondary');
        trackBtn.textContent = '✅ En seguimiento';
      });
    }

    container.appendChild(card);
  });
}

/**
 * Pattern Analysis Module Rendering & Chart.js Integration
 */
function populatePatternNicheSelect() {
  const select = document.getElementById('pattern-niche-select');
  if (!select) return;

  const niches = new Set(['ALL']);
  trackedVideosList.forEach(v => {
    if (v.nicheGroup) niches.add(v.nicheGroup);
  });

  select.innerHTML = '';
  niches.forEach(niche => {
    const opt = document.createElement('option');
    opt.value = niche;
    opt.textContent = niche === 'ALL' ? 'Todos los videos trackeados' : `Nicho: ${niche}`;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => renderPatternAnalysis());
}

function renderPatternAnalysis() {
  const selectedNiche = document.getElementById('pattern-niche-select')?.value || 'ALL';
  const report = analyzeVideoPatterns(trackedVideosList, selectedNiche);

  // 1. Recommendations list
  const recBox = document.getElementById('pattern-recommendations-list');
  recBox.innerHTML = '';

  if (report.benchmark.recommendations.length === 0) {
    recBox.innerHTML = `<div class="rec-item">Agrega más videos al seguimiento para generar diagnósticos automáticos de tu nicho.</div>`;
  } else {
    report.benchmark.recommendations.forEach(rec => {
      const div = document.createElement('div');
      div.className = 'rec-item';
      div.innerHTML = parseSimpleMarkdown(rec);
      recBox.appendChild(div);
    });
  }

  // 1.5 Keyword & Title Suggestions
  const kwBox = document.getElementById('pattern-keyword-suggestions');
  if (kwBox) {
    const suggestions = generateKeywordSuggestions(trackedVideosList);
    kwBox.innerHTML = `
      <div class="rec-item" style="border-left-color: #38bdf8;">
        <strong>🏷️ Palabras clave de Alta Oportunidad (VPH):</strong>
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
          ${suggestions.suggestedKeywords.map(k => `<span class="tag-pill" style="color: #38bdf8; background: rgba(56, 189, 248, 0.15);">${escapeHtml(k)}</span>`).join('')}
        </div>
      </div>
      <div class="rec-item" style="border-left-color: #a855f7;">
        <strong>📝 Plantillas de Título Recomendadas para tu Próximo Video:</strong>
        <ul style="margin-top: 6px; padding-left: 18px; color: var(--text-main);">
          ${suggestions.titleTemplates.map(t => `<li style="margin-bottom: 4px;">"${escapeHtml(t)}"</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // 2. Chart 1: Duration Breakdown
  renderDurationChart(report.duration);

  // 3. Chart 2: Publish Timing
  renderTimingChart(report.timing);

  // 4. Title Stats & Keywords
  const titleBox = document.getElementById('pattern-title-stats');
  const topStats = report.title.topStats;
  const kwList = report.title.topKeywords.map(k => `<span class="tag-pill" style="color: #f8fafc; background: rgba(99, 102, 241, 0.2);">${escapeHtml(k.word)} (${k.freq})</span>`).join(' ');

  titleBox.innerHTML = `
    <div style="font-size: 13px; color: var(--text-muted);">
      <p>📏 Longitud Promedio: <strong>${topStats.avgWords} palabras</strong> (~${topStats.avgChars} caracteres)</p>
      <p>🔢 Títulos con Números / Cifras: <strong>${topStats.hasNumbersPct}%</strong></p>
      <p>❓ Títulos con Pregunta (¿?): <strong>${topStats.hasQuestionPct}%</strong></p>
      <p>📦 Títulos con Corchetes/Paréntesis: <strong>${topStats.hasBracketsPct}%</strong></p>
    </div>
    <div style="margin-top: 12px;">
      <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Palabras Clave Virales:</span>
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">
        ${kwList || '<span class="text-muted">Insuficientes datos de títulos</span>'}
      </div>
    </div>
  `;

  // 5. Tags Cloud
  const tagsBox = document.getElementById('pattern-tags-list');
  const tagsHtml = report.tags.topTags.map(t => `<span class="tag-pill">#${escapeHtml(t.tag)} (${t.freq})</span>`).join(' ');
  tagsBox.innerHTML = tagsHtml || '<span class="text-muted">Sin tags disponibles</span>';
}

function renderDurationChart(durationData) {
  const ctx = document.getElementById('chart-duration')?.getContext('2d');
  if (!ctx) return;

  if (chartDurationInstance) chartDurationInstance.destroy();

  const labels = durationData.buckets.map(b => b.label);
  const topCounts = durationData.buckets.map(b => b.topCount);
  const totalCounts = durationData.buckets.map(b => b.totalCount);

  chartDurationInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Videos Top (Mayor Velocidad)',
          data: topCounts,
          backgroundColor: '#6366f1',
          borderRadius: 6
        },
        {
          label: 'Total Videos Registrados',
          data: totalCounts,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Segoe UI' } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    }
  });
}

function renderTimingChart(timingData) {
  const ctx = document.getElementById('chart-timing')?.getContext('2d');
  if (!ctx) return;

  if (chartTimingInstance) chartTimingInstance.destroy();

  const labels = Object.keys(timingData.dayCounts);
  const data = Object.values(timingData.dayCounts);

  chartTimingInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Frecuencia de Publicación de Videos Top',
        data: data,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Segoe UI' } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
        y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.05)' } }
      }
    }
  });
}

async function loadSettingsForm() {
  const settings = await getSettings();

  document.getElementById('cfg-api-key').value = settings.apiKey || '';
  document.getElementById('cfg-trend-threshold').value = settings.trendThreshold || 500;
  document.getElementById('cfg-polling-interval').value = settings.pollingInterval || 30;
  document.getElementById('cfg-max-videos').value = settings.maxTrackedVideos || 30;
  document.getElementById('cfg-my-channel').value = settings.myChannelId || '';
}

function extractVideoId(urlOrId) {
  if (!urlOrId) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  
  try {
    const urlObj = new URL(urlOrId);
    if (urlObj.hostname.includes('youtu.be')) {
      return urlObj.pathname.slice(1);
    }
    return urlObj.searchParams.get('v');
  } catch (e) {
    return null;
  }
}

function parseSimpleMarkdown(str) {
  return String(str || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
