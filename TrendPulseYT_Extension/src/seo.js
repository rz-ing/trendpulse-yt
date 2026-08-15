/**
 * TrendPulse YT - SEO Score & Keyword Generator Module
 * Calculates YouTube SEO Optimization Score (0-100) and extracts keyword recommendations.
 */

/**
 * Calculates SEO Score (0-100) and provides actionable optimization tips.
 * @param {Object} video 
 * @returns {Object} { score, grade, breakdown, tips }
 */
export function calculateSEOScore(video) {
  if (!video) {
    return { score: 0, grade: 'F', breakdown: {}, tips: ['Datos de video no disponibles.'] };
  }

  let titleScore = 0;
  let tagScore = 0;
  let descScore = 0;
  let thumbScore = 0;
  let engScore = 0;

  const tips = [];

  // 1. Title Optimization (Max 25 pts)
  const title = (video.title || '').trim();
  const titleLength = title.length;
  const titleWords = title.split(/\s+/).filter(Boolean);

  if (titleLength >= 40 && titleLength <= 70) {
    titleScore += 15; // Ideal YouTube title length
  } else if (titleLength >= 25 && titleLength < 40) {
    titleScore += 10;
    tips.push('El título es un poco corto. Intenta ampliarlo a 40-70 caracteres para incluir más palabras clave.');
  } else if (titleLength > 70) {
    titleScore += 8;
    tips.push('El título supera los 70 caracteres y podría truncarse en dispositivos móviles.');
  } else {
    titleScore += 5;
    tips.push('El título es demasiado corto para un buen posicionamiento SEO.');
  }

  if (/\d/.test(title)) titleScore += 5; // Contains numbers
  if (/\?|¿|!|¡|\[|\(|\)|\]/.test(title)) titleScore += 5; // Power punctuation

  // 2. Tags Optimization (Max 25 pts)
  const tags = Array.isArray(video.tags) ? video.tags : [];
  const tagCount = tags.length;
  const totalTagChars = tags.reduce((acc, t) => acc + t.length, 0);

  if (tagCount >= 10 && tagCount <= 30) {
    tagScore += 15;
  } else if (tagCount > 0 && tagCount < 10) {
    tagScore += 8;
    tips.push(`El video solo tiene ${tagCount} tags. Se recomienda usar de 12 a 20 tags relevantes.`);
  } else {
    tips.push('El video no contiene tags/etiquetas. Agregar tags ayuda al algoritmo a categorizar el video.');
  }

  if (totalTagChars >= 200) {
    tagScore += 5;
  }

  // Tag & Title keyword overlap check
  const titleKeywords = titleWords.map(w => w.toLowerCase()).filter(w => w.length > 3);
  const matchingTags = tags.filter(t => titleKeywords.some(kw => t.toLowerCase().includes(kw)));
  if (matchingTags.length >= 2) {
    tagScore += 5;
  } else if (tagCount > 0) {
    tips.push('Las etiquetas no coinciden con las palabras clave del título. Incluye los términos principales del título en tus tags.');
  }

  // 3. Description Optimization (Max 20 pts)
  const desc = (video.description || '').trim();
  if (desc.length >= 300) {
    descScore += 12;
  } else if (desc.length >= 100) {
    descScore += 7;
    tips.push('Extiende la descripción del video a más de 300 caracteres para mejorar el SEO orgánico.');
  } else {
    descScore += 3;
    tips.push('La descripción es muy corta. Redacta un resumen detallado con palabras clave en los primeros 200 caracteres.');
  }

  if (/https?:\/\//.test(desc)) descScore += 4; // Contains links
  if (/\d{1,2}:\d{2}/.test(desc)) descScore += 4; // Contains timestamps / chapters

  // 4. Thumbnail Quality (Max 10 pts)
  if (video.thumbnailUrl && video.thumbnailUrl.includes('maxresdefault')) {
    thumbScore += 10;
  } else if (video.thumbnailUrl) {
    thumbScore += 8;
  } else {
    tips.push('Asegúrate de subir una miniatura personalizada en alta resolución (1280x720).');
  }

  // 5. Engagement Rate (Max 20 pts)
  const eng = video.engagementRate || 0;
  if (eng >= 5.0) {
    engScore += 20;
  } else if (eng >= 3.0) {
    engScore += 14;
  } else if (eng >= 1.5) {
    engScore += 8;
    tips.push('El engagement es bajo. Incluye llamadas a la acción (CTA) para solicitar Likes y Comentarios.');
  } else {
    engScore += 4;
  }

  const totalScore = Math.min(100, titleScore + tagScore + descScore + thumbScore + engScore);

  let grade = 'C';
  if (totalScore >= 90) grade = 'A+';
  else if (totalScore >= 80) grade = 'A';
  else if (totalScore >= 70) grade = 'B';
  else if (totalScore >= 50) grade = 'C';
  else grade = 'D';

  return {
    score: totalScore,
    grade,
    breakdown: {
      titleScore,
      tagScore,
      descScore,
      thumbScore,
      engScore
    },
    tips: tips.length > 0 ? tips : ['¡Excelente optimización SEO general!']
  };
}

/**
 * Generates Keyword and Title Suggestions based on high-VPH competitor videos.
 * @param {Array<Object>} topVideos 
 * @returns {Object} { suggestedKeywords, titleTemplates, recommendedTags }
 */
export function generateKeywordSuggestions(topVideos) {
  if (!topVideos || topVideos.length === 0) {
    return {
      suggestedKeywords: [],
      titleTemplates: [
        'Cómo [Acción/Tema Principal] en 2026 (Guía Paso a Paso)',
        'El Secreto de [Tema] que Nadie Te Cuenta',
        'Top 5 Errores al [Acción] y Cómo Evitarlos'
      ],
      recommendedTags: []
    };
  }

  // Sort top videos by VPH
  const sorted = [...topVideos].sort((a, b) => (b.currentVelocity || 0) - (a.currentVelocity || 0));
  const viralVids = sorted.slice(0, 5);

  const wordCounts = {};
  const tagCounts = {};

  viralVids.forEach(v => {
    // Title words
    const words = (v.title || '').toLowerCase()
      .replace(/[^\wáéíóúñ\s]/gi, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['para', 'como', 'sobre', 'este', 'esta', 'estos', '2025', '2026', 'video', 'youtube'].includes(w));

    words.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);

    // Tags
    (v.tags || []).forEach(t => {
      const tagClean = t.trim().toLowerCase();
      if (tagClean.length > 2) tagCounts[tagClean] = (tagCounts[tagClean] || 0) + 1;
    });
  });

  const topKeywords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([t]) => t);

  const kw1 = topKeywords[0] || 'Tu Tema';
  const kw2 = topKeywords[1] || 'Tutorial';

  const titleTemplates = [
    `🔥 Cómo dominar ${capitalize(kw1)}: Guía Definitiva 2026`,
    `Lo que NUNCA te dijeron sobre ${capitalize(kw1)} (${capitalize(kw2)})`,
    `3 Estrategias Virales para ${capitalize(kw1)} que FUNCIONAN`
  ];

  return {
    suggestedKeywords: topKeywords,
    titleTemplates,
    recommendedTags: topTags
  };
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
