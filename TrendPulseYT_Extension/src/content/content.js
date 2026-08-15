/**
 * TrendPulse YT - Content Script
 * Injected into youtube.com/watch* pages to render real-time overlay widget.
 */

(function () {
  let currentVideoId = null;
  let isMinimized = false;
  let overlayEl = null;
  let activeVideoData = null;
  let isTracked = false;

  // Initialize overlay injection
  function init() {
    checkAndInjectOverlay();

    // Listen for YouTube SPA navigation events
    document.addEventListener('yt-navigate-finish', () => {
      checkAndInjectOverlay();
    });

    // Fallback URL observer for dynamically changing parameters
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        checkAndInjectOverlay();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  /**
   * Extracts YouTube Video ID from current URL.
   */
  function getVideoIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  /**
   * Checks if current page is a watch page and injects or updates overlay widget.
   */
  async function checkAndInjectOverlay() {
    const videoId = getVideoIdFromUrl();
    if (!videoId) {
      removeOverlay();
      return;
    }

    if (videoId === currentVideoId && overlayEl) {
      return; // Already rendering for this video
    }

    currentVideoId = videoId;
    createOverlayDOM();
    await loadOverlayData(videoId);
  }

  /**
   * Removes overlay if leaving watch page.
   */
  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
      currentVideoId = null;
    }
  }

  /**
   * Constructs the overlay container and initial skeleton UI.
   */
  function createOverlayDOM() {
    if (overlayEl) overlayEl.remove();

    overlayEl = document.createElement('div');
    overlayEl.id = 'trendpulse-overlay-root';
    if (isMinimized) overlayEl.classList.add('tp-minimized');

    overlayEl.innerHTML = `
      <div class="tp-header" id="tp-drag-header">
        <div class="tp-brand">
          <div class="tp-brand-icon">📈</div>
          <span>TrendPulse YT</span>
        </div>
        <div class="tp-controls">
          <button class="tp-btn-icon" id="tp-toggle-min" title="${isMinimized ? 'Expandir' : 'Minimizar'}">
            ${isMinimized ? '➕' : '➖'}
          </button>
          <button class="tp-btn-icon" id="tp-close" title="Cerrar overlay">✕</button>
        </div>
      </div>
      <div class="tp-body" id="tp-body-content">
        <div class="tp-loading">⚡ Obteniendo velocidad de crecimiento...</div>
      </div>
    `;

    document.body.appendChild(overlayEl);

    // Event handlers
    setupDragAndDrop(overlayEl, document.getElementById('tp-drag-header'));

    document.getElementById('tp-toggle-min').addEventListener('click', (e) => {
      e.stopPropagation();
      isMinimized = !isMinimized;
      overlayEl.classList.toggle('tp-minimized', isMinimized);
      e.target.textContent = isMinimized ? '➕' : '➖';
      e.target.title = isMinimized ? 'Expandir' : 'Minimizar';
    });

    document.getElementById('tp-close').addEventListener('click', (e) => {
      e.stopPropagation();
      removeOverlay();
    });
  }

  /**
   * Fetches video stats & local tracking status via background service worker.
   */
  async function loadOverlayData(videoId) {
    const bodyContent = document.getElementById('tp-body-content');
    if (!bodyContent) return;

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_OVERLAY_DATA',
        videoId: videoId
      });

      if (!response || !response.success) {
        bodyContent.innerHTML = `<div class="tp-loading">⚠️ ${response?.error || 'Ingresa tu API Key en la extensión.'}</div>`;
        return;
      }

      const { tracked, apiData, settings } = response;
      isTracked = Boolean(tracked);
      
      // Extract data from tracked record or fresh API call
      const stats = apiData || tracked || {};
      const views = stats.views || 0;
      const likes = stats.likes || 0;
      const comments = stats.comments || 0;
      const velocity = tracked?.currentVelocity || calculateQuickVelocity(stats, tracked);
      const views24h = tracked?.views24h || Math.round(velocity * 24);
      const threshold = settings?.trendThreshold || 500;
      const isTrending = velocity >= threshold;

      activeVideoData = {
        videoId: videoId,
        title: stats.title || getDOMTitleFallback(),
        channelId: stats.channelId || '',
        channelTitle: stats.channelTitle || getDOMChannelFallback(),
        publishedAt: stats.publishedAt || new Date().toISOString(),
        durationSeconds: stats.durationSeconds || 0,
        durationFormatted: stats.durationFormatted || '0:00',
        tags: stats.tags || [],
        categoryId: stats.categoryId || '0',
        thumbnailUrl: stats.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        views: views,
        likes: likes,
        comments: comments
      };

      // Render inner UI
      renderOverlayBody(bodyContent, {
        views,
        likes,
        comments,
        velocity,
        views24h,
        isTrending,
        threshold,
        isTracked
      });

    } catch (err) {
      console.error('[TrendPulse Overlay] Error al cargar datos:', err);
      bodyContent.innerHTML = `<div class="tp-loading">⚠️ Error de conexión con la extensión.</div>`;
    }
  }

  /**
   * Renders populated UI inside overlay body.
   */
  function renderOverlayBody(container, data) {
    const { views, likes, comments, velocity, views24h, isTrending, isTracked } = data;
    const tags = activeVideoData?.tags || [];
    const seoScore = activeVideoData?.seoScore || Math.min(100, Math.round(50 + (likes > 1000 ? 20 : 10) + (tags.length > 5 ? 20 : 5)));

    let seoColor = '#ef4444'; // Red
    if (seoScore >= 80) seoColor = '#10b981'; // Green
    else if (seoScore >= 60) seoColor = '#f59e0b'; // Yellow

    container.innerHTML = `
      <div class="tp-badge-container" style="display: flex; gap: 6px; flex-wrap: wrap;">
        ${isTrending ? `
          <div class="tp-badge-trending">
            🔥 EN TENDENCIA (${formatNumber(velocity)} VPH)
          </div>
        ` : `
          <div class="tp-badge-normal">
            📊 VPH: ${formatNumber(velocity)} views/h
          </div>
        `}
        <div class="tp-badge-normal" style="border: 1px solid ${seoColor}; color: ${seoColor}; font-weight: 800;">
          🎯 SEO Score: ${seoScore}/100
        </div>
      </div>

      <div class="tp-grid-stats">
        <div class="tp-stat-card tp-highlight">
          <span class="tp-stat-label">🚀 VPH (Vistas Por Hora)</span>
          <span class="tp-stat-value tp-accent">${formatNumber(velocity)} /h</span>
          <span class="tp-stat-sub">Ganancia 24h: ~${formatNumber(views24h)} vistas</span>
        </div>
        <div class="tp-stat-card">
          <span class="tp-stat-label">👁️ Vistas Totales</span>
          <span class="tp-stat-value">${formatCompactNumber(views)}</span>
        </div>
        <div class="tp-stat-card">
          <span class="tp-stat-label">👍 Likes / 💬 Com.</span>
          <span class="tp-stat-value">${formatCompactNumber(likes)} / ${formatCompactNumber(comments)}</span>
        </div>
      </div>

      ${tags.length > 0 ? `
        <div class="tp-tags-section" style="margin-bottom: 12px; padding: 8px 10px; background: rgba(0,0,0,0.3); border-radius: 10px; border: 1px solid var(--tp-border-glass);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 10px; font-weight: 700; color: var(--tp-text-muted); text-transform: uppercase;">🏷️ Tags del Video (${tags.length})</span>
            <button id="tp-btn-copy-tags" class="tp-btn-icon" style="width: auto; height: auto; padding: 2px 8px; font-size: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;" title="Copiar todas las etiquetas">📋 Copiar Tags</button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; max-height: 70px; overflow-y: auto;">
            ${tags.slice(0, 10).map(t => `<span style="font-size: 10px; background: rgba(99,102,241,0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">#${escapeHtml(t)}</span>`).join('')}
            ${tags.length > 10 ? `<span style="font-size: 10px; color: var(--tp-text-muted);">+${tags.length - 10} más</span>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="tp-actions">
        <button class="tp-btn-primary ${isTracked ? 'tp-active' : ''}" id="tp-btn-track">
          ${isTracked ? '✅ Video Trackeado' : '➕ Trackear este video'}
        </button>
        <button class="tp-btn-secondary" id="tp-btn-dashboard">
          📊 Abrir Dashboard Comparativo
        </button>
      </div>
    `;

    // Copy Tags listener
    const copyTagsBtn = container.querySelector('#tp-btn-copy-tags');
    if (copyTagsBtn) {
      copyTagsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagsText = tags.join(', ');
        navigator.clipboard.writeText(tagsText).then(() => {
          copyTagsBtn.textContent = '✅ ¡Copiadas!';
          setTimeout(() => copyTagsBtn.textContent = '📋 Copiar Tags', 2000);
        });
      });
    }

    // Bind action listeners
    const trackBtn = container.querySelector('#tp-btn-track');
    if (trackBtn) {
      trackBtn.addEventListener('click', async () => {
        if (!activeVideoData) return;
        trackBtn.disabled = true;
        trackBtn.textContent = 'Guardando...';

        try {
          const res = await chrome.runtime.sendMessage({
            type: 'TOGGLE_TRACK_VIDEO',
            videoData: activeVideoData
          });

          if (res && res.success) {
            isTracked = res.isTracked;
            trackBtn.classList.toggle('tp-active', isTracked);
            trackBtn.textContent = isTracked ? '✅ Video Trackeado' : '➕ Trackear este video';
          } else {
            alert(`Error: ${res?.error || 'No se pudo trackear.'}`);
          }
        } catch (err) {
          alert('Error al comunicar con la extensión.');
        } finally {
          trackBtn.disabled = false;
        }
      });
    }

    const dashBtn = container.querySelector('#tp-btn-dashboard');
    if (dashBtn) {
      dashBtn.addEventListener('click', () => {
        const dashboardUrl = chrome.runtime.getURL('src/dashboard/dashboard.html');
        window.open(dashboardUrl, '_blank');
      });
    }
  }

  /**
   * Helper to estimate quick velocity if only 1 snapshot exists.
   */
  function calculateQuickVelocity(stats, tracked) {
    if (tracked?.currentVelocity) return tracked.currentVelocity;
    const views = stats.views || 0;
    const pubTime = stats.publishedAt ? new Date(stats.publishedAt).getTime() : Date.now();
    const ageHours = Math.max(0.1, (Date.now() - pubTime) / (1000 * 60 * 60));
    return Math.round(views / ageHours);
  }

  function getDOMTitleFallback() {
    const el = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1');
    return el?.textContent?.trim() || document.title || 'Video de YouTube';
  }

  function getDOMChannelFallback() {
    const el = document.querySelector('#owner #channel-name a, ytd-channel-name a');
    return el?.textContent?.trim() || 'Canal';
  }

  function formatNumber(num) {
    return new Intl.NumberFormat('es-ES').format(num || 0);
  }

  function formatCompactNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return String(num);
  }

  /**
   * Draggable widget helper with strict viewport boundary clamping
   */
  function setupDragAndDrop(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;

      let newTop = element.offsetTop - pos2;
      let newLeft = element.offsetLeft - pos1;

      // Restrict drag inside visible window bounds
      const maxTop = Math.max(10, window.innerHeight - element.offsetHeight - 10);
      const maxLeft = Math.max(10, window.innerWidth - element.offsetWidth - 10);

      newTop = Math.max(10, Math.min(maxTop, newTop));
      newLeft = Math.max(10, Math.min(maxLeft, newLeft));

      element.style.top = newTop + "px";
      element.style.left = newLeft + "px";
      element.style.right = 'auto'; // Clear right positioning once dragged
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Handle Fullscreen & Window Resize to avoid losing buttons
  document.addEventListener('fullscreenchange', () => {
    if (overlayEl) {
      if (document.fullscreenElement) {
        overlayEl.style.display = 'none'; // Hide overlay in video fullscreen
      } else {
        overlayEl.style.display = 'flex';
      }
    }
  });

  window.addEventListener('resize', () => {
    if (overlayEl && overlayEl.style.left && overlayEl.style.left !== 'auto') {
      const currentLeft = parseInt(overlayEl.style.left, 10);
      const maxLeft = window.innerWidth - overlayEl.offsetWidth - 10;
      if (currentLeft > maxLeft) {
        overlayEl.style.left = Math.max(10, maxLeft) + 'px';
      }
    }
  });

  // Run initial script
  init();
})();
