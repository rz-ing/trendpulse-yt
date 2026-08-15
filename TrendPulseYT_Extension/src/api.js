/**
 * TrendPulse YT - API Module (YouTube Data API v3 Client)
 * Handles data retrieval, ISO 8601 duration parsing, quota tracking, and OAuth2 requests.
 */

export const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Quota costs according to YouTube API v3 documentation
export const QUOTA_COSTS = {
  VIDEOS_LIST: 1,      // part=statistics,snippet,contentDetails (batch up to 50 videos)
  CHANNELS_LIST: 1,    // part=contentDetails
  PLAYLIST_ITEMS: 1,   // part=snippet
  SEARCH_LIST: 100     // part=snippet (High cost! Use carefully)
};

/**
 * Parses YouTube ISO 8601 duration strings (e.g. PT1H2M10S, PT15M33S, PT45S) into seconds.
 * @param {string} isoDuration 
 * @returns {number} duration in seconds
 */
export function parseISODuration(isoDuration) {
  if (!isoDuration) return 0;
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats duration in seconds to standard HH:MM:SS or MM:SS format.
 * @param {number} totalSeconds 
 * @returns {string} formatted string e.g. "12:34"
 */
export function formatDuration(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '0:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  
  const mStr = String(m).padStart(h > 0 ? 2 : 1, '0');
  const sStr = String(s).padStart(2, '0');
  
  return h > 0 ? `${h}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
}

/**
 * Fetches statistics, snippet, and contentDetails for up to 50 video IDs in a single batch request.
 * @param {string|string[]} videoIds 
 * @param {string} apiKey 
 * @param {Function} [onQuotaUsed] callback to log quota consumption
 * @returns {Promise<Array<Object>>}
 */
export async function fetchVideoDetails(videoIds, apiKey, onQuotaUsed = null) {
  if (!apiKey) {
    throw new Error('API Key de YouTube no configurada. Ingresa tu API Key en la configuración.');
  }

  const idsArray = Array.isArray(videoIds) ? videoIds : [videoIds];
  if (idsArray.length === 0) return [];

  // YouTube allows max 50 IDs per videos.list request
  const batches = [];
  for (let i = 0; i < idsArray.length; i += 50) {
    batches.push(idsArray.slice(i, i + 50));
  }

  const results = [];

  for (const batch of batches) {
    const idsParam = batch.join(',');
    const url = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${idsParam}&key=${apiKey}`;

    try {
      const response = await fetch(url);
      
      if (onQuotaUsed) onQuotaUsed(QUOTA_COSTS.VIDEOS_LIST);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403 && errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
          throw new Error('⚠️ Cuota diaria de YouTube API excedida (10,000 unidades/día). El servicio se reanudará cuando YouTube reinicie tu cuota.');
        }
        throw new Error(`Error HTTP (${response.status}): ${errorData?.error?.message || 'No se pudieron obtener datos del video.'}`);
      }

      const data = await response.json();
      const items = data.items || [];

      items.forEach(item => {
        const stats = item.statistics || {};
        const snippet = item.snippet || {};
        const details = item.contentDetails || {};

        const durationSeconds = parseISODuration(details.duration);
        const thumbnails = snippet.thumbnails || {};
        const thumbnailUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';

        results.push({
          videoId: item.id,
          title: snippet.title || 'Sin título',
          description: snippet.description || '',
          channelId: snippet.channelId || '',
          channelTitle: snippet.channelTitle || 'Canal desconocido',
          publishedAt: snippet.publishedAt || new Date().toISOString(),
          durationSeconds: durationSeconds,
          durationFormatted: formatDuration(durationSeconds),
          tags: snippet.tags || [],
          categoryId: snippet.categoryId || '0',
          thumbnailUrl: thumbnailUrl,
          views: parseInt(stats.viewCount || '0', 10),
          likes: parseInt(stats.likeCount || '0', 10),
          comments: parseInt(stats.commentCount || '0', 10)
        });
      });
    } catch (err) {
      console.error('[TrendPulse YT API] Error en fetchVideoDetails:', err);
      throw err;
    }
  }

  return results;
}

/**
 * Searches YouTube for videos matching a niche keyword (High quota cost: 100 units).
 * @param {string} keyword 
 * @param {string} apiKey 
 * @param {number} maxResults (default 10)
 * @param {Function} [onQuotaUsed] 
 * @returns {Promise<Array<Object>>} Hydrated video list
 */
export async function searchNicheVideos(keyword, apiKey, maxResults = 10, onQuotaUsed = null) {
  if (!apiKey) {
    throw new Error('API Key no configurada para realizar la búsqueda por nicho.');
  }

  const url = `${YOUTUBE_API_BASE}/search?part=snippet&type=video&order=date&maxResults=${maxResults}&q=${encodeURIComponent(keyword)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (onQuotaUsed) onQuotaUsed(QUOTA_COSTS.SEARCH_LIST);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403 && errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        throw new Error('⚠️ Cuota diaria de YouTube API excedida.');
      }
      throw new Error(`Error en búsqueda (${response.status}): ${errorData?.error?.message || 'Fallo al buscar en YouTube.'}`);
    }

    const data = await response.json();
    const videoIds = (data.items || []).map(item => item.id?.videoId).filter(Boolean);

    if (videoIds.length === 0) return [];

    // Hydrate video details to get full statistics, duration and tags
    return await fetchVideoDetails(videoIds, apiKey, onQuotaUsed);
  } catch (err) {
    console.error('[TrendPulse YT API] Error en searchNicheVideos:', err);
    throw err;
  }
}

/**
 * Fetches recent uploaded videos from a channel ID efficiently (2 units quota total).
 * @param {string} channelId 
 * @param {string} apiKey 
 * @param {number} maxResults 
 * @param {Function} [onQuotaUsed] 
 * @returns {Promise<Array<Object>>}
 */
export async function fetchChannelUploads(channelId, apiKey, maxResults = 20, onQuotaUsed = null) {
  if (!apiKey || !channelId) {
    throw new Error('API Key o Channel ID faltante.');
  }

  // 1. Fetch channel's uploads playlist ID (1 unit)
  const channelUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
  const cRes = await fetch(channelUrl);
  if (onQuotaUsed) onQuotaUsed(QUOTA_COSTS.CHANNELS_LIST);
  
  if (!cRes.ok) throw new Error('No se pudo encontrar el canal especificado.');
  const cData = await cRes.json();
  const uploadsPlaylistId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  // 2. Fetch items from uploads playlist (1 unit)
  const playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`;
  const pRes = await fetch(playlistUrl);
  if (onQuotaUsed) onQuotaUsed(QUOTA_COSTS.PLAYLIST_ITEMS);

  if (!pRes.ok) throw new Error('No se pudieron listar los videos del canal.');
  const pData = await pRes.json();
  const videoIds = (pData.items || []).map(item => item.snippet?.resourceId?.videoId).filter(Boolean);

  if (videoIds.length === 0) return [];

  // 3. Hydrate videos with statistics (1 unit)
  return await fetchVideoDetails(videoIds, apiKey, onQuotaUsed);
}

/**
 * Fetches current trending / most popular videos for a region (1 unit quota total!).
 * @param {string} apiKey 
 * @param {string} regionCode (e.g. 'ES', 'MX', 'US', 'AR', 'CO')
 * @param {number} maxResults 
 * @param {Function} [onQuotaUsed] 
 * @returns {Promise<Array<Object>>}
 */
export async function fetchTrendingVideos(apiKey, regionCode = 'ES', maxResults = 12, onQuotaUsed = null) {
  if (!apiKey) {
    throw new Error('API Key no configurada para consultar las tendencias.');
  }

  const url = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&chart=mostPopular&regionCode=${encodeURIComponent(regionCode)}&maxResults=${maxResults}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (onQuotaUsed) onQuotaUsed(QUOTA_COSTS.VIDEOS_LIST);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 403 && errorData?.error?.errors?.[0]?.reason === 'quotaExceeded') {
        throw new Error('⚠️ Cuota diaria de YouTube API excedida.');
      }
      throw new Error(`Error en tendencias (${response.status}): ${errorData?.error?.message || 'No se pudieron obtener las tendencias.'}`);
    }

    const data = await response.json();
    const items = data.items || [];

    return items.map(item => {
      const stats = item.statistics || {};
      const snippet = item.snippet || {};
      const details = item.contentDetails || {};

      const durationSeconds = parseISODuration(details.duration);
      const thumbnails = snippet.thumbnails || {};
      const thumbnailUrl = thumbnails.maxres?.url || thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';

      return {
        videoId: item.id,
        title: snippet.title || 'Sin título',
        description: snippet.description || '',
        channelId: snippet.channelId || '',
        channelTitle: snippet.channelTitle || 'Canal desconocido',
        publishedAt: snippet.publishedAt || new Date().toISOString(),
        durationSeconds: durationSeconds,
        durationFormatted: formatDuration(durationSeconds),
        tags: snippet.tags || [],
        categoryId: snippet.categoryId || '0',
        thumbnailUrl: thumbnailUrl,
        views: parseInt(stats.viewCount || '0', 10),
        likes: parseInt(stats.likeCount || '0', 10),
        comments: parseInt(stats.commentCount || '0', 10)
      };
    });
  } catch (err) {
    console.error('[TrendPulse YT API] Error en fetchTrendingVideos:', err);
    throw err;
  }
}
export async function fetchMyVideosOAuth(authToken, apiKey, maxResults = 20) {
  if (!authToken) throw new Error('Token OAuth2 no disponible.');

  // Get user channel contentDetails
  const channelUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&mine=true`;
  const cRes = await fetch(channelUrl, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!cRes.ok) throw new Error('Error al autenticar el canal con OAuth2.');
  const cData = await cRes.json();
  const uploadsPlaylistId = cData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

  if (!uploadsPlaylistId) return [];

  const playlistUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`;
  const pRes = await fetch(playlistUrl, {
    headers: { Authorization: `Bearer ${authToken}` }
  });

  if (!pRes.ok) throw new Error('Error al obtener la lista de reproducción de subidas.');
  const pData = await pRes.json();
  const videoIds = (pData.items || []).map(item => item.snippet?.resourceId?.videoId).filter(Boolean);

  if (videoIds.length === 0) return [];

  return await fetchVideoDetails(videoIds, apiKey);
}
