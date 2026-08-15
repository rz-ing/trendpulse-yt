/**
 * TrendPulse YT - Background Service Worker
 * Handles periodic polling via chrome.alarms, notification alerts, and extension message routing.
 */

import { fetchVideoDetails, searchNicheVideos, fetchChannelUploads, fetchMyVideosOAuth, fetchTrendingVideos } from './api.js';
import {
  getSettings,
  saveSettings,
  getTrackedVideos,
  getTrackedVideo,
  saveTrackedVideo,
  removeTrackedVideo,
  updateBatchSnapshots,
  addQuotaUsage,
  getQuotaStats
} from './storage.js';

const ALARM_NAME = 'trendpulse_poll_alarm';

// Initialize extension alarms and defaults on installation or startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[TrendPulse YT SW] Extension instalada o actualizada.');
  const settings = await getSettings();
  setupPollingAlarm(settings.pollingInterval || 30);
});

chrome.runtime.onStartup.addListener(async () => {
  const settings = await getSettings();
  setupPollingAlarm(settings.pollingInterval || 30);
});

/**
 * Configures chrome.alarms for periodic video snapshot polling.
 * @param {number} intervalMinutes 
 */
function setupPollingAlarm(intervalMinutes) {
  const safeInterval = Math.max(5, intervalMinutes || 30);
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: safeInterval,
      delayInMinutes: 1
    });
    console.log(`[TrendPulse YT SW] Polling alarm configurada cada ${safeInterval} minutos.`);
  });
}

// Alarm Listener
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('[TrendPulse YT SW] Ejecutando polling periódico de snapshots...');
    await performPollingUpdate();
  }
});

/**
 * Performs snapshot update for all currently tracked videos.
 */
async function performPollingUpdate() {
  try {
    const settings = await getSettings();
    if (!settings.apiKey) {
      console.log('[TrendPulse YT SW] Polling omitido: API Key no configurada.');
      return;
    }

    const tracked = await getTrackedVideos();
    if (tracked.length === 0) {
      console.log('[TrendPulse YT SW] No hay videos en seguimiento.');
      return;
    }

    const videoIds = tracked.map(v => v.videoId);
    
    // Batch fetch from API
    const updatedApiVideos = await fetchVideoDetails(videoIds, settings.apiKey, (units) => {
      addQuotaUsage(units);
    });

    if (updatedApiVideos.length > 0) {
      const newlyTrending = await updateBatchSnapshots(updatedApiVideos);

      // Trigger native notification for newly trending videos
      for (const trendVid of newlyTrending) {
        showTrendingNotification(trendVid);
      }
    }
  } catch (err) {
    console.error('[TrendPulse YT SW] Error durante polling update:', err);
  }
}

/**
 * Triggers native Chrome notification when a video enters trending state.
 * @param {Object} video 
 */
function showTrendingNotification(video) {
  const notifId = `trend_${video.videoId}_${Date.now()}`;
  const iconUrl = chrome.runtime.getURL('icons/icon-128.png');

  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: iconUrl,
    title: '🔥 TrendPulse YT: ¡Video en tendencia!',
    message: `"${(video.title || '').slice(0, 45)}..." ha alcanzado ${video.currentVelocity.toLocaleString()} vistas/hora.`,
    contextMessage: `Canal: ${video.channelTitle} | Vistas: ${video.views.toLocaleString()}`
  });
}

// Notification click listener
chrome.notifications.onClicked.addListener((notifId) => {
  if (notifId.startsWith('trend_')) {
    // Open Dashboard
    const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html');
    chrome.tabs.create({ url: dashboardUrl });
  }
});

// Central Message Handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'GET_OVERLAY_DATA': {
          const videoId = message.videoId;
          const settings = await getSettings();
          const tracked = await getTrackedVideo(videoId);
          
          let apiData = null;
          if (settings.apiKey) {
            try {
              const details = await fetchVideoDetails(videoId, settings.apiKey, (units) => addQuotaUsage(units));
              if (details.length > 0) apiData = details[0];
            } catch (apiErr) {
              console.warn('[SW] Could not fetch live API data for overlay:', apiErr);
            }
          }
          
          sendResponse({
            success: true,
            tracked: tracked,
            apiData: apiData,
            settings: settings
          });
          break;
        }

        case 'TOGGLE_TRACK_VIDEO': {
          const { videoData, isOwn, nicheGroup } = message;
          const existing = await getTrackedVideo(videoData.videoId);

          if (existing) {
            await removeTrackedVideo(videoData.videoId);
            sendResponse({ success: true, isTracked: false, message: 'Video removido del seguimiento.' });
          } else {
            const saved = await saveTrackedVideo(videoData, isOwn, nicheGroup);
            sendResponse({ success: true, isTracked: true, video: saved, message: 'Video agregado al seguimiento.' });
          }
          break;
        }

        case 'FORCE_POLL_NOW': {
          await performPollingUpdate();
          const updatedTracked = await getTrackedVideos();
          const quota = await getQuotaStats();
          sendResponse({ success: true, tracked: updatedTracked, quota: quota });
          break;
        }

        case 'SEARCH_NICHE': {
          const { keyword, maxResults } = message;
          const settings = await getSettings();
          if (!settings.apiKey) {
            sendResponse({ success: false, error: 'Ingresa tu API Key de YouTube en la configuración primero.' });
            return;
          }

          const results = await searchNicheVideos(keyword, settings.apiKey, maxResults || 10, (units) => addQuotaUsage(units));
          sendResponse({ success: true, results });
          break;
        }

        case 'FETCH_TRENDING_VIDEOS': {
          const { regionCode, maxResults } = message;
          const settings = await getSettings();
          if (!settings.apiKey) {
            sendResponse({ success: false, error: 'Ingresa tu API Key de YouTube en la configuración primero.' });
            return;
          }

          const trending = await fetchTrendingVideos(settings.apiKey, regionCode || 'ES', maxResults || 12, (units) => addQuotaUsage(units));
          sendResponse({ success: true, results: trending });
          break;
        }

        case 'SYNC_MY_VIDEOS': {
          const settings = await getSettings();
          if (!settings.apiKey) {
            sendResponse({ success: false, error: 'API Key requerida.' });
            return;
          }

          let ownVideos = [];
          if (message.authToken) {
            ownVideos = await fetchMyVideosOAuth(message.authToken, settings.apiKey);
          } else if (settings.myChannelId) {
            ownVideos = await fetchChannelUploads(settings.myChannelId, settings.apiKey, 20, (units) => addQuotaUsage(units));
          } else {
            sendResponse({ success: false, error: 'Configura tu ID de Canal o token OAuth en la pestaña de Ajustes.' });
            return;
          }

          // Auto-save videos as isOwn = true
          for (const vid of ownVideos) {
            await saveTrackedVideo(vid, true, 'Mis Videos');
          }

          const updatedTracked = await getTrackedVideos();
          sendResponse({ success: true, ownVideosCount: ownVideos.length, tracked: updatedTracked });
          break;
        }

        case 'SAVE_SETTINGS': {
          const updated = await saveSettings(message.settings);
          if (message.settings.pollingInterval) {
            setupPollingAlarm(message.settings.pollingInterval);
          }
          sendResponse({ success: true, settings: updated });
          break;
        }

        case 'GET_QUOTA_STATS': {
          const quota = await getQuotaStats();
          sendResponse({ success: true, quota });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Acción no reconocida.' });
      }
    } catch (err) {
      console.error('[SW Message Handler Error]:', err);
      sendResponse({ success: false, error: err.message || 'Error interno del servicio.' });
    }
  })();

  return true; // Keep message channel open for async response!
});
