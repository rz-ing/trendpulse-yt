/**
 * TrendPulse YT - Popup Controller
 * Manages active tab video detection, quick tracking, status metrics, and dashboard launching.
 */

import { getSettings, getTrackedVideos, getQuotaStats } from '../storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  await updatePopupUI();
  setupEventListeners();
});

async function updatePopupUI() {
  const settings = await getSettings();
  const tracked = await getTrackedVideos();
  const quota = await getQuotaStats();

  // 1. API Key Status Badge
  const statusBadge = document.getElementById('api-status-badge');
  if (settings.apiKey) {
    statusBadge.innerHTML = `
      <span class="status-dot dot-green"></span>
      <span class="status-text">API OK</span>
    `;
  } else {
    statusBadge.innerHTML = `
      <span class="status-dot dot-red"></span>
      <span class="status-text">Sin Key</span>
    `;
  }

  // 2. Metrics Summary
  document.getElementById('stat-total-tracked').textContent = tracked.length;
  const trendingCount = tracked.filter(v => v.isTrending).length;
  document.getElementById('stat-trending-count').textContent = trendingCount;

  // 3. Quota Meter
  document.getElementById('quota-text').textContent = `${quota.usedToday.toLocaleString()} / 10,000`;
  const quotaFill = document.getElementById('quota-fill');
  quotaFill.style.width = `${quota.percentage}%`;
  if (quota.percentage > 80) quotaFill.style.background = 'linear-gradient(135deg, #f97316, #ef4444)';

  // 4. Active Tab Video Detection
  await detectActiveTabVideo();
}

async function detectActiveTabVideo() {
  const container = document.getElementById('active-video-content');

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.url || !activeTab.url.includes('youtube.com/watch')) {
      container.innerHTML = `<p class="text-muted">Abre un video de YouTube para trackearlo rápidamente.</p>`;
      return;
    }

    const urlObj = new URL(activeTab.url);
    const videoId = urlObj.searchParams.get('v');

    if (!videoId) {
      container.innerHTML = `<p class="text-muted">Abre un video de YouTube para trackearlo rápidamente.</p>`;
      return;
    }

    // Ask background service worker for overlay data
    const res = await chrome.runtime.sendMessage({
      type: 'GET_OVERLAY_DATA',
      videoId: videoId
    });

    if (res && res.success) {
      const { tracked, apiData } = res;
      const isTracked = Boolean(tracked);
      const title = apiData?.title || tracked?.title || activeTab.title.replace('- YouTube', '').trim();
      const velocity = tracked?.currentVelocity || (apiData?.views ? Math.round(apiData.views / 24) : 0);

      container.innerHTML = `
        <div class="video-info">
          <div class="video-title" title="${escapeHtml(title)}">${escapeHtml(title)}</div>
          <div class="video-meta">🚀 ${velocity.toLocaleString()} views/h</div>
          <button class="btn ${isTracked ? 'btn-success' : 'btn-primary'}" id="btn-quick-track" style="margin-top: 6px; padding: 6px 10px; font-size: 11px;">
            ${isTracked ? '✅ Video Trackeado' : '➕ Trackear este video'}
          </button>
        </div>
      `;

      const trackBtn = document.getElementById('btn-quick-track');
      if (trackBtn && (apiData || tracked)) {
        trackBtn.addEventListener('click', async () => {
          trackBtn.disabled = true;
          const videoPayload = apiData || tracked;

          const toggleRes = await chrome.runtime.sendMessage({
            type: 'TOGGLE_TRACK_VIDEO',
            videoData: videoPayload
          });

          if (toggleRes && toggleRes.success) {
            await updatePopupUI();
          } else {
            alert(`Error: ${toggleRes?.error || 'No se pudo trackear.'}`);
          }
        });
      }
    } else {
      container.innerHTML = `<p class="text-muted">No se pudo obtener información del video.</p>`;
    }
  } catch (err) {
    console.error('[Popup] Active tab error:', err);
    container.innerHTML = `<p class="text-muted">Error al consultar la pestaña activa.</p>`;
  }
}

function setupEventListeners() {
  document.getElementById('btn-open-dashboard').addEventListener('click', () => {
    const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
    window.close();
  });
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
