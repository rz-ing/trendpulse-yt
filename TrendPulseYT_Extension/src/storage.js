/**
 * TrendPulse YT - Storage Layer
 * Manages chrome.storage.local for tracked videos, snapshots, user settings, and quota tracking.
 */

import { calculateSEOScore } from './seo.js';

export const DEFAULT_SETTINGS = {
  apiKey: '',
  trendThreshold: 500, // Default: 500 views/hour triggers trending status
  pollingInterval: 30, // Default: check every 30 minutes
  maxTrackedVideos: 30, // Default: cap at 30 videos to conserve quota
  myChannelId: '',
  oauthClientId: ''
};

/**
 * Retrieves extension settings from storage.
 * @returns {Promise<Object>}
 */
export async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(result.settings || {}) };
}

/**
 * Saves extension settings to storage.
 * @param {Object} newSettings 
 * @returns {Promise<Object>} Updated settings
 */
export async function saveSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await chrome.storage.local.set({ settings: updated });
  return updated;
}

/**
 * Calculates current velocity (views/hour), 24h delta, engagement rate and trending status.
 * @param {Object} video 
 * @param {number} trendThreshold 
 * @returns {Object} Video with recalculated metrics
 */
export function calculateVideoMetrics(video, trendThreshold = 500) {
  if (!video) return null;

  const snapshots = Array.isArray(video.snapshots) ? [...video.snapshots] : [];
  snapshots.sort((a, b) => a.timestamp - b.timestamp);

  const latest = snapshots.length > 0 ? snapshots[snapshots.length - 1] : {
    views: video.views || 0,
    likes: video.likes || 0,
    comments: video.comments || 0,
    timestamp: Date.now()
  };

  const currentViews = latest.views || 0;
  const currentLikes = latest.likes || 0;
  const currentComments = latest.comments || 0;

  // 1. Calculate Velocity (Views / Hour - VPH)
  let currentVelocity = 0;
  if (snapshots.length >= 2) {
    const prev = snapshots[snapshots.length - 2];
    const timeDiffHours = (latest.timestamp - prev.timestamp) / (1000 * 60 * 60);
    const viewsDiff = latest.views - prev.views;
    currentVelocity = timeDiffHours > 0 ? Math.max(0, Math.round(viewsDiff / timeDiffHours)) : 0;
  } else {
    // Fallback: estimate from publish date if available
    const pubTime = video.publishedAt ? new Date(video.publishedAt).getTime() : video.addedAt || Date.now();
    const ageHours = Math.max(0.1, (Date.now() - pubTime) / (1000 * 60 * 60));
    currentVelocity = Math.round(currentViews / ageHours);
  }

  // 2. Calculate Views gain in last 24h
  let views24h = 0;
  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  
  // Find snapshot closest to 24h ago
  const snap24h = snapshots.find(s => s.timestamp >= dayAgo);
  if (snap24h) {
    views24h = Math.max(0, currentViews - snap24h.views);
  } else if (snapshots.length > 0) {
    views24h = Math.max(0, currentViews - snapshots[0].views);
  } else {
    views24h = currentViews;
  }

  // 3. Engagement Rate: ((likes + comments) / views) * 100
  let engagementRate = 0;
  if (currentViews > 0) {
    engagementRate = parseFloat((((currentLikes + currentComments) / currentViews) * 100).toFixed(2));
  }

  // 4. SEO Score Calculation
  const seoData = calculateSEOScore({
    ...video,
    views: currentViews,
    likes: currentLikes,
    comments: currentComments,
    engagementRate
  });

  // 5. Trending status
  const isTrending = currentVelocity >= trendThreshold;

  return {
    ...video,
    views: currentViews,
    likes: currentLikes,
    comments: currentComments,
    currentVelocity, // VPH (Vistas Por Hora)
    views24h,
    engagementRate,
    seoScore: seoData.score,
    seoGrade: seoData.grade,
    seoTips: seoData.tips,
    seoBreakdown: seoData.breakdown,
    isTrending,
    snapshots
  };
}

/**
 * Gets all tracked videos from storage with computed metrics.
 * @returns {Promise<Array<Object>>}
 */
export async function getTrackedVideos() {
  const [vResult, sResult] = await Promise.all([
    chrome.storage.local.get('trackedVideos'),
    getSettings()
  ]);

  const videosObj = vResult.trackedVideos || {};
  const threshold = sResult.trendThreshold || 500;

  return Object.values(videosObj).map(v => calculateVideoMetrics(v, threshold));
}

/**
 * Gets a single tracked video by ID.
 * @param {string} videoId 
 * @returns {Promise<Object|null>}
 */
export async function getTrackedVideo(videoId) {
  const videos = await getTrackedVideos();
  return videos.find(v => v.videoId === videoId) || null;
}

/**
 * Adds or updates a video in the tracking list.
 * @param {Object} videoData Full video details from API
 * @param {boolean} [isOwn] Whether it's the user's own video
 * @param {string} [nicheGroup] Category/Niche label
 * @returns {Promise<Object>} Saved video with updated metrics
 */
export async function saveTrackedVideo(videoData, isOwn = false, nicheGroup = 'General') {
  const settings = await getSettings();
  const vResult = await chrome.storage.local.get('trackedVideos');
  const trackedVideos = vResult.trackedVideos || {};

  const videoId = videoData.videoId;
  const existing = trackedVideos[videoId] || {};

  // Cap check for new video
  if (!existing.videoId && Object.keys(trackedVideos).length >= settings.maxTrackedVideos) {
    throw new Error(`Has alcanzado el límite máximo de ${settings.maxTrackedVideos} videos trackeados. Elimina alguno o aumenta el límite en Ajustes.`);
  }

  const now = Date.now();
  const existingSnapshots = existing.snapshots || [];

  // Add new snapshot
  const newSnapshot = {
    timestamp: now,
    views: videoData.views || 0,
    likes: videoData.likes || 0,
    comments: videoData.comments || 0
  };

  // Limit snapshots history to max 100 entries per video to avoid storage bloat
  const updatedSnapshots = [...existingSnapshots, newSnapshot].slice(-100);

  // Auto-detect if own video via channel ID setting
  const autoIsOwn = isOwn || (settings.myChannelId && videoData.channelId === settings.myChannelId);

  const updatedVideo = {
    ...existing,
    ...videoData,
    isOwn: Boolean(autoIsOwn),
    nicheGroup: nicheGroup || existing.nicheGroup || 'General',
    addedAt: existing.addedAt || now,
    lastUpdated: now,
    snapshots: updatedSnapshots
  };

  trackedVideos[videoId] = updatedVideo;
  await chrome.storage.local.set({ trackedVideos });

  return calculateVideoMetrics(updatedVideo, settings.trendThreshold);
}

/**
 * Removes a video from tracking list.
 * @param {string} videoId 
 */
export async function removeTrackedVideo(videoId) {
  const vResult = await chrome.storage.local.get('trackedVideos');
  const trackedVideos = vResult.trackedVideos || {};
  delete trackedVideos[videoId];
  await chrome.storage.local.set({ trackedVideos });
}

/**
 * Updates snapshots for multiple videos at once during periodic polling.
 * @param {Array<Object>} apiVideos Hydrated videos from YouTube API
 * @returns {Promise<Array<Object>>} Videos that recently entered trending state
 */
export async function updateBatchSnapshots(apiVideos) {
  const settings = await getSettings();
  const vResult = await chrome.storage.local.get('trackedVideos');
  const trackedVideos = vResult.trackedVideos || {};
  const newlyTrending = [];

  const now = Date.now();

  for (const apiVid of apiVideos) {
    const videoId = apiVid.videoId;
    if (!trackedVideos[videoId]) continue;

    const current = trackedVideos[videoId];
    const prevMetrics = calculateVideoMetrics(current, settings.trendThreshold);
    
    const newSnapshot = {
      timestamp: now,
      views: apiVid.views || 0,
      likes: apiVid.likes || 0,
      comments: apiVid.comments || 0
    };

    const updatedSnapshots = [...(current.snapshots || []), newSnapshot].slice(-100);

    const updated = {
      ...current,
      ...apiVid,
      lastUpdated: now,
      snapshots: updatedSnapshots
    };

    trackedVideos[videoId] = updated;

    const newMetrics = calculateVideoMetrics(updated, settings.trendThreshold);

    // If it was NOT trending before, but IS trending now -> push notification candidate
    if (!prevMetrics.isTrending && newMetrics.isTrending) {
      newlyTrending.push(newMetrics);
    }
  }

  await chrome.storage.local.set({ trackedVideos });
  return newlyTrending;
}

/**
 * Manages YouTube API quota consumption tally.
 * @param {number} units 
 */
export async function addQuotaUsage(units) {
  const result = await chrome.storage.local.get('quotaStats');
  const stats = result.quotaStats || { usedToday: 0, lastReset: getTodayPSTDate() };

  const todayStr = getTodayPSTDate();
  if (stats.lastReset !== todayStr) {
    // Reset quota counter for new PST day (YouTube resets quota at 00:00 PST)
    stats.usedToday = units;
    stats.lastReset = todayStr;
  } else {
    stats.usedToday += units;
  }

  await chrome.storage.local.set({ quotaStats: stats });
}

/**
 * Returns current quota usage stats.
 * @returns {Promise<Object>}
 */
export async function getQuotaStats() {
  const result = await chrome.storage.local.get('quotaStats');
  const stats = result.quotaStats || { usedToday: 0, lastReset: getTodayPSTDate() };
  
  // Auto-reset check
  const todayStr = getTodayPSTDate();
  if (stats.lastReset !== todayStr) {
    stats.usedToday = 0;
    stats.lastReset = todayStr;
    await chrome.storage.local.set({ quotaStats: stats });
  }

  return {
    usedToday: stats.usedToday,
    totalLimit: 10000,
    percentage: Math.min(100, parseFloat(((stats.usedToday / 10000) * 100).toFixed(1))),
    lastReset: stats.lastReset
  };
}

/**
 * Helper to format current date in PST (UTC-8) format YYYY-MM-DD.
 */
function getTodayPSTDate() {
  const d = new Date();
  // Adjust to PST (UTC - 8 hours)
  const pst = new Date(d.getTime() - (8 * 60 * 60 * 1000));
  return pst.toISOString().split('T')[0];
}
