/**
 * TrendPulse YT - Pattern Analysis Module ("¿Por qué funciona?")
 * Analyzes common structural patterns (duration, publish timing, titles, tags) of top-performing videos
 * in a niche, and generates comparative benchmarks for the creator's own videos.
 */

/**
 * Spanish & English stop-words for title/tag n-gram extraction.
 */
const STOP_WORDS = new Set([
  'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'sin', 'sobre', 'tras',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'e', 'o', 'u', 'pero', 'mas', 'si', 'no', 'del', 'al', 'que', 'como', 'su',
  'sus', 'mi', 'mis', 'tu', 'tus', 'lo', 'se', 'me', 'te', 'nos', 'os', 'es', 'son', 'fue', 'ser', 'estar', 'ha', 'han', 'mas', 'más',
  'como', 'cómo', 'que', 'qué', 'quien', 'quién', 'donde', 'dónde', 'cuando', 'cuándo', 'por', 'porque', 'porqué', 'este', 'esta',
  'estos', 'estas', 'esto', 'ese', 'esa', 'esos', 'esas', 'eso', 'aquel', 'aquella', 'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that',
  'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say',
  'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who',
  'get', 'which', 'go', 'me', '2024', '2025', '2026', 'video', 'youtube'
]);

/**
 * Analyzes structural patterns of a list of tracked videos.
 * @param {Array<Object>} videos Array of video objects with computed metrics
 * @param {string} [selectedNiche] Optional filter by niche group
 * @returns {Object} Comprehensive analysis report
 */
export function analyzeVideoPatterns(videos, selectedNiche = 'ALL') {
  if (!videos || videos.length === 0) {
    return createEmptyAnalysisReport();
  }

  // Filter by niche if specified
  const targetVideos = selectedNiche && selectedNiche !== 'ALL'
    ? videos.filter(v => v.nicheGroup === selectedNiche)
    : [...videos];

  if (targetVideos.length === 0) {
    return createEmptyAnalysisReport();
  }

  // Sort videos by currentVelocity (views/hour) descending
  const sorted = [...targetVideos].sort((a, b) => (b.currentVelocity || 0) - (a.currentVelocity || 0));

  // Determine top performers cutoff (top 30% or at least top 1 if small sample)
  const topCount = Math.max(1, Math.ceil(sorted.length * 0.35));
  const topPerformers = sorted.slice(0, topCount);
  const otherPerformers = sorted.slice(topCount);

  // Own videos subset
  const ownVideos = targetVideos.filter(v => v.isOwn);

  // 1. Duration Analysis
  const durationReport = analyzeDurations(topPerformers, otherPerformers);

  // 2. Publish Timing Analysis
  const timingReport = analyzePublishTiming(topPerformers);

  // 3. Title Patterns & Keywords
  const titleReport = analyzeTitles(topPerformers, otherPerformers);

  // 4. Tag Analysis
  const tagReport = analyzeTags(topPerformers, otherPerformers);

  // 5. Own Videos vs Niche Benchmark Recommendations
  const benchmarkReport = generateOwnVsBenchmark(ownVideos, topPerformers, durationReport, timingReport, titleReport);

  return {
    totalAnalyzed: targetVideos.length,
    topCount: topPerformers.length,
    niche: selectedNiche,
    duration: durationReport,
    timing: timingReport,
    title: titleReport,
    tags: tagReport,
    benchmark: benchmarkReport
  };
}

/**
 * Analyzes video duration distributions and optimal length buckets.
 */
function analyzeDurations(topPerformers, otherPerformers) {
  const getAvgDuration = (arr) => arr.length === 0 ? 0 : Math.round(arr.reduce((acc, v) => acc + (v.durationSeconds || 0), 0) / arr.length);

  const topAvgSeconds = getAvgDuration(topPerformers);
  const otherAvgSeconds = getAvgDuration(otherPerformers);

  // Duration Buckets (in seconds)
  const BUCKETS = [
    { label: '< 4 min (Cortos/Shorts)', min: 0, max: 240, topCount: 0, totalCount: 0 },
    { label: '4 - 8 min (Medio Corto)', min: 240, max: 480, topCount: 0, totalCount: 0 },
    { label: '8 - 15 min (Estándar YouTube)', min: 480, max: 900, topCount: 0, totalCount: 0 },
    { label: '15 - 30 min (Largo)', min: 900, max: 1800, topCount: 0, totalCount: 0 },
    { label: '> 30 min (Extendido)', min: 1800, max: Infinity, topCount: 0, totalCount: 0 }
  ];

  const allVids = [...topPerformers, ...otherPerformers];

  allVids.forEach(v => {
    const sec = v.durationSeconds || 0;
    const isTop = topPerformers.some(tp => tp.videoId === v.videoId);
    const bucket = BUCKETS.find(b => sec >= b.min && sec < b.max);
    if (bucket) {
      bucket.totalCount++;
      if (isTop) bucket.topCount++;
    }
  });

  // Find bucket with highest top concentration
  let optimalBucket = BUCKETS[2].label; // default 8-15 min
  let maxRatio = -1;
  BUCKETS.forEach(b => {
    if (b.totalCount > 0) {
      const ratio = b.topCount / b.totalCount;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        optimalBucket = b.label;
      }
    }
  });

  return {
    topAvgSeconds,
    topAvgFormatted: formatSecondsToMin(topAvgSeconds),
    otherAvgSeconds,
    otherAvgFormatted: formatSecondsToMin(otherAvgSeconds),
    optimalBucket,
    buckets: BUCKETS
  };
}

/**
 * Analyzes publish time window and day of week distribution.
 */
function analyzePublishTiming(topPerformers) {
  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayCounts = { 'Domingo': 0, 'Lunes': 0, 'Martes': 0, 'Miércoles': 0, 'Jueves': 0, 'Viernes': 0, 'Sábado': 0 };

  const hourWindows = {
    'Madrugada (00:00 - 06:00)': 0,
    'Mañana (06:00 - 12:00)': 0,
    'Tarde (12:00 - 18:00)': 0,
    'Noche (18:00 - 24:00)': 0
  };

  topPerformers.forEach(v => {
    if (!v.publishedAt) return;
    const pubDate = new Date(v.publishedAt);
    const dayName = daysOfWeek[pubDate.getDay()];
    const hour = pubDate.getHours();

    dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;

    if (hour >= 0 && hour < 6) hourWindows['Madrugada (00:00 - 06:00)']++;
    else if (hour >= 6 && hour < 12) hourWindows['Mañana (06:00 - 12:00)']++;
    else if (hour >= 12 && hour < 18) hourWindows['Tarde (12:00 - 18:00)']++;
    else hourWindows['Noche (18:00 - 24:00)']++;
  });

  // Best day and best hour window
  let bestDay = 'Viernes';
  let maxDayCount = -1;
  Object.entries(dayCounts).forEach(([day, cnt]) => {
    if (cnt > maxDayCount) {
      maxDayCount = cnt;
      bestDay = day;
    }
  });

  let bestHourWindow = 'Tarde (12:00 - 18:00)';
  let maxHourCount = -1;
  Object.entries(hourWindows).forEach(([win, cnt]) => {
    if (cnt > maxHourCount) {
      maxHourCount = cnt;
      bestHourWindow = win;
    }
  });

  return {
    dayCounts,
    hourWindows,
    bestDay,
    bestHourWindow
  };
}

/**
 * Analyzes title lengths, presence of structural elements, and top keywords.
 */
function analyzeTitles(topPerformers, otherPerformers) {
  const getStats = (arr) => {
    if (arr.length === 0) return { avgChars: 0, avgWords: 0, hasNumbersPct: 0, hasQuestionPct: 0, hasBracketsPct: 0 };

    let totalChars = 0;
    let totalWords = 0;
    let numCount = 0;
    let qCount = 0;
    let bracketCount = 0;

    arr.forEach(v => {
      const title = v.title || '';
      totalChars += title.length;
      totalWords += title.split(/\s+/).filter(Boolean).length;
      if (/\d/.test(title)) numCount++;
      if (/\?|¿/.test(title)) qCount++;
      if (/\[|\(|\)|\]/.test(title)) bracketCount++;
    });

    const len = arr.length;
    return {
      avgChars: Math.round(totalChars / len),
      avgWords: Math.round(totalWords / len),
      hasNumbersPct: Math.round((numCount / len) * 100),
      hasQuestionPct: Math.round((qCount / len) * 100),
      hasBracketsPct: Math.round((bracketCount / len) * 100)
    };
  };

  const topStats = getStats(topPerformers);
  const otherStats = getStats(otherPerformers);

  // Extract top keywords from top performers
  const wordFreq = {};
  topPerformers.forEach(v => {
    const title = (v.title || '').toLowerCase().replace(/[^\wáéíóúñ\s]/gi, '');
    const words = title.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));
    words.forEach(w => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, freq]) => ({ word, freq }));

  return {
    topStats,
    otherStats,
    topKeywords
  };
}

/**
 * Analyzes tag frequency in top videos vs non-top.
 */
function analyzeTags(topPerformers, otherPerformers) {
  const tagFreq = {};

  topPerformers.forEach(v => {
    const tags = Array.isArray(v.tags) ? v.tags : [];
    tags.forEach(rawTag => {
      const tag = rawTag.trim().toLowerCase();
      if (tag.length > 1 && !STOP_WORDS.has(tag)) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    });
  });

  const topTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([tag, freq]) => ({ tag, freq }));

  return {
    topTags
  };
}

/**
 * Compares user's own videos vs top niche benchmark and generates actionable recommendations.
 */
function generateOwnVsBenchmark(ownVideos, topPerformers, durationReport, timingReport, titleReport) {
  if (!ownVideos || ownVideos.length === 0) {
    return {
      hasOwnVideos: false,
      message: 'No se encontraron videos marcados como "Mis videos". Marca tus videos o conecta tu Canal ID en la configuración para comparar directamente contra el benchmark del nicho.',
      recommendations: [
        `Optimiza la duración hacia el rango top del nicho: ${durationReport.optimalBucket} (promedio top: ${durationReport.topAvgFormatted}).`,
        `Publica preferentemente en el día de mayor rendimiento: ${timingReport.bestDay} durante la ${timingReport.bestHourWindow}.`,
        `Usa títulos estructurados con ${titleReport.topStats.avgWords} palabras (aprox. ${titleReport.topStats.avgChars} caracteres).`
      ]
    };
  }

  const ownAvgSeconds = Math.round(ownVideos.reduce((acc, v) => acc + (v.durationSeconds || 0), 0) / ownVideos.length);
  const ownAvgFormatted = formatSecondsToMin(ownAvgSeconds);
  const ownAvgVelocity = Math.round(ownVideos.reduce((acc, v) => acc + (v.currentVelocity || 0), 0) / ownVideos.length);
  const topAvgVelocity = Math.round(topPerformers.reduce((acc, v) => acc + (v.currentVelocity || 0), 0) / topPerformers.length);

  const ownAvgTitleChars = Math.round(ownVideos.reduce((acc, v) => acc + ((v.title || '').length), 0) / ownVideos.length);

  const recommendations = [];

  // Duration recommendation
  const durDiff = durationReport.topAvgSeconds - ownAvgSeconds;
  if (Math.abs(durDiff) > 120) {
    if (durDiff > 0) {
      recommendations.push(`⏱️ **Duración**: Tus videos duran en promedio **${ownAvgFormatted}**, mientras que los top del nicho duran **${durationReport.topAvgFormatted}** (${durationReport.optimalBucket}). Se sugiere extender el contenido 2-5 minutos para mejorar retención y tiempo de reproducción.`);
    } else {
      recommendations.push(`⏱️ **Duración**: Tus videos son más largos (**${ownAvgFormatted}**) que el promedio top del nicho (**${durationReport.topAvgFormatted}**). Podrías probar formatos más dinámicos de ${durationReport.optimalBucket}.`);
    }
  } else {
    recommendations.push(`⏱️ **Duración**: ¡Excelente! Tu duración promedio (**${ownAvgFormatted}**) está bien alineada con el benchmark del nicho (**${durationReport.topAvgFormatted}**).`);
  }

  // Timing recommendation
  recommendations.push(`📅 **Horario óptimo**: En tu nicho, los videos con mejor vistas/hora se publican principalmente los **${timingReport.bestDay}** en la franja **${timingReport.bestHourWindow}**.`);

  // Title recommendation
  if (titleReport.topStats.hasNumbersPct > 40) {
    recommendations.push(`📝 **Estructura de Títulos**: El **${titleReport.topStats.hasNumbersPct}%** de los videos top usan números en sus títulos. Considera agregar cifras o listas a tus títulos.`);
  }

  if (titleReport.topKeywords.length > 0) {
    const topWordsStr = titleReport.topKeywords.slice(0, 5).map(k => `"${k.word}"`).join(', ');
    recommendations.push(`🏷️ **Palabras clave clave**: Las palabras más repetidas en los videos virales de tu nicho son: ${topWordsStr}.`);
  }

  return {
    hasOwnVideos: true,
    ownCount: ownVideos.length,
    ownAvgFormatted,
    ownAvgVelocity,
    topAvgVelocity,
    velocityGapRatio: topAvgVelocity > 0 ? parseFloat((ownAvgVelocity / topAvgVelocity).toFixed(2)) : 1,
    recommendations
  };
}

function formatSecondsToMin(sec) {
  if (!sec || isNaN(sec)) return '0 min';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function createEmptyAnalysisReport() {
  return {
    totalAnalyzed: 0,
    topCount: 0,
    niche: 'ALL',
    duration: { topAvgSeconds: 0, topAvgFormatted: '0m 0s', otherAvgSeconds: 0, otherAvgFormatted: '0m 0s', optimalBucket: 'N/A', buckets: [] },
    timing: { dayCounts: {}, hourWindows: {}, bestDay: 'N/A', bestHourWindow: 'N/A' },
    title: { topStats: { avgChars: 0, avgWords: 0, hasNumbersPct: 0, hasQuestionPct: 0, hasBracketsPct: 0 }, otherStats: {}, topKeywords: [] },
    tags: { topTags: [] },
    benchmark: { hasOwnVideos: false, message: 'Agrega videos para analizar patrones.', recommendations: [] }
  };
}
