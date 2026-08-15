/**
 * TrendPulse YT - Sales Website Script
 * Handles multi-language switching (Spanish, English, Portuguese),
 * pricing checkout modal, FAQ accordion, and competitor comparison tool.
 */

const TRANSLATIONS = {
  es: {
    navFeatures: "Funcionalidades",
    navComparison: "Comparativa",
    navPricing: "Precios",
    navFaq: "Preguntas Frecuentes",
    navBuy: "Descargar / Comprar",

    heroBadge: "⚡ Herramienta #1 de Inteligencia para Creadores de YouTube",
    heroTitle: "Monitorea <span class='gradient-text'>Vistas Por Hora (VPH)</span> en Tiempo Real y Domina tu Nicho",
    heroSubtitle: "Descubre la velocidad de crecimiento de cualquier video de YouTube, compara tu canal con la competencia, analiza patrones virales y multiplica tus ingresos.",
    btnBuyPro: "🔥 Obtener Licencia PRO ($50)",
    btnBuyBasic: "⚡ Comprar Versión Básica ($25)",
    heroGuarantee: "✓ Licencia de Por Vida (Sin suscripciones) &nbsp;•&nbsp; ✓ Instalador 1-Clic para Windows &nbsp;•&nbsp; ✓ Garantía 30 Días",

    demoTitle: "Velocidad VPH & Estadísticas en Tiempo Real",
    demoSub: "Cualquier video público de YouTube en vivo",
    statVph: "🚀 VPH (Vistas/Hora)",
    statTotalViews: "👁️ Vistas Totales",
    statSeo: "🎯 SEO Score",
    statEng: "💬 Engagement Rate",

    featTitle: "Funcionalidades Diseñadas para Viralizar y Monetizar",
    featSub: "Todo lo que necesitas para optimizar la estructura de tus videos y superar a tus competidores.",

    f1Title: "📊 Overlay Flotante en YouTube",
    f1Desc: "Panel Glassmorphism inyectado en cualquier video con VPH en vivo, SEO score y botón de seguimiento en 1 clic.",

    f2Title: "🚀 Métrica VPH en Tiempo Real",
    f2Desc: "Calcula cuántas vistas gana un video por hora para detectar qué temas están explotando antes que nadie.",

    f3Title: "🎯 Calculador SEO Score (0-100)",
    f3Desc: "Evalúa títulos, riqueza de etiquetas, descripción y miniaturas para garantizar el máximo alcance orgánico.",

    f4Title: "📋 Copiador de Tags en 1 Clic",
    f4Desc: "Visualiza y copia al instante las etiquetas de los videos más virales de tu nicho para aplicarlas a tus contenidos.",

    f5Title: "🧬 Análisis de Patrones Virales",
    f5Desc: "Descubre duraciones ideales, mejores días/horas de publicación y palabras clave con mayor conversión.",

    f6Title: "🔥 Buscador de Tendencias por País",
    f6Desc: "Descubre los videos en tendencia mundial o por país (España, México, EE.UU., etc.) consumiendo solo 1u de cuota.",

    compTitle: "TrendPulse YT vs Aplicaciones Tradicionales",
    compSub: "Por qué los creadores inteligentes eligen TrendPulse YT frente a herramientas costosas.",
    compColFeature: "Característica / Función",
    compColTp: "TrendPulse YT (PRO)",
    compColVidiq: "vidIQ (Pro/Boost)",
    compColTubebuddy: "TubeBuddy (Legend)",

    compR1: "Modelo de Pago",
    compR1Tp: "Pago Único ($50 De Por Vida)",
    compR1Vidiq: "$49 - $149 / mes",
    compR1Tubebuddy: "$39 - $89 / mes",

    compR2: "Velocidad VPH en Tiempo Real",
    compR2Tp: "✓ Incluido (Cualquier Video)",
    compR2Vidiq: "❌ Limitado / Solo propio",
    compR2Tubebuddy: "❌ No disponible",

    compR3: "Análisis de Patrones de Nicho",
    compR3Tp: "✓ Incluido Automático",
    compR3Vidiq: "❌ Requiere plan Enterprise",
    compR3Tubebuddy: "❌ No disponible",

    compR4: "Copiador Directo de Tags",
    compR4Tp: "✓ 1-Clic Ilimitado",
    compR4Vidiq: "✓ Limitado por plan",
    compR4Tubebuddy: "✓ Limitado por plan",

    compR5: "Privacidad & Datos Privados",
    compR5Tp: "✓ 100% Datos Públicos API",
    compR5Vidiq: "⚠️ Requiere vinculación canal",
    compR5Tubebuddy: "⚠️ Requiere vinculación canal",

    priceTitle: "Planes Simples y Transparentes",
    priceSub: "Sin suscripciones mensuales ocultas. Elige la versión que mejor se adapte a tus necesidades.",

    pBasicTitle: "Versión Básica",
    pBasicDesc: "Ideal para pequeños creadores que están comenzando.",
    pBasicPrice: "$25 USD",
    pBasicPeriod: "Pago Único De Por Vida",
    pBasicF1: "✓ Seguimiento de hasta 5 videos",
    pBasicF2: "✓ Overlay en YouTube con VPH",
    pBasicF3: "✓ Tabla Comparativa Básica",
    pBasicF4: "✓ Instalador 1-Clic Windows",
    pBasicF5: "❌ Análisis de Patrones Virales",
    pBasicF6: "❌ Buscador de Tendencias por País",
    pBasicBtn: "Comprar Básica ($25)",

    pProTitle: "Versión PRO / Premium",
    pProDesc: "Para creadores serios y agencias que buscan maximizar ingresos.",
    pProBadge: "🔥 MÁS POPULAR - 50% OFF",
    pProPrice: "$50 USD",
    pProPeriod: "Pago Único De Por Vida (Normal $100)",
    pProF1: "✓ Seguimiento ILIMITADO de Videos",
    pProF2: "✓ Módulo de Patrones (\"¿Por qué funciona?\")",
    pProF3: "✓ Calculador SEO Score (0-100)",
    pProF4: "✓ Copiador de Tags en 1-Clic",
    pProF5: "✓ Buscador de Tendencias por País (1u)",
    pProF6: "✓ Sugerencias de Títulos y Keywords",
    pProF7: "✓ Notificaciones de Tendencias en Vivo",
    pProF8: "✓ Clave de Licencia PRO + Soporte VIP",
    pProBtn: "🚀 Obtener Licencia PRO ($50)",

    faqTitle: "Preguntas Frecuentes",
    q1: "¿Cómo recibo e instalo el software tras comprar?",
    a1: "Recibirás de inmediato un enlace para descargar `TrendPulse_YT_Setup.bat`. Al ejecutarlo en Windows, la extensión se instalará automáticamente en tu equipo en 1 clic.",
    q2: "¿Hay algún cobro mensual o suscripción?",
    a2: "No. TrendPulse YT es un pago único de por vida. No pagarás renovaciones mensuales ni tarifas ocultas.",
    q3: "¿Necesito una API Key de YouTube?",
    a3: "Sí, la extensión utiliza la API oficial de YouTube. En la guía te mostramos cómo obtener tu API Key gratuita de 10,000 unidades/día en solo 2 minutos.",
    q4: "¿Es seguro y cumple con las políticas de YouTube?",
    a4: "100% seguro. Solo utiliza datos públicos oficiales de la API de YouTube v3 sin realizar scraping ni acceder a datos privados de otros canales.",

    footerText: "© 2026 TrendPulse YT. Todos los derechos reservados. Diseñado para creadores de contenido de YouTube."
  },

  en: {
    navFeatures: "Features",
    navComparison: "Comparison",
    navPricing: "Pricing",
    navFaq: "FAQ",
    navBuy: "Download / Buy",

    heroBadge: "⚡ #1 Creator Intelligence Tool for YouTube",
    heroTitle: "Track Real-Time <span class='gradient-text'>Views Per Hour (VPH)</span> & Dominate Your Niche",
    heroSubtitle: "Uncover the growth velocity of any YouTube video, benchmark against competitors, analyze viral structural patterns, and multiply your revenue.",
    btnBuyPro: "🔥 Get PRO License ($50)",
    btnBuyBasic: "⚡ Buy Basic Version ($25)",
    heroGuarantee: "✓ Lifetime License (No Subscriptions) &nbsp;•&nbsp; ✓ 1-Click Windows Installer &nbsp;•&nbsp; ✓ 30-Day Money Back",

    demoTitle: "VPH Velocity & Real-Time Statistics",
    demoSub: "Live monitoring on any public YouTube video",
    statVph: "🚀 VPH (Views/Hour)",
    statTotalViews: "👁️ Total Views",
    statSeo: "🎯 SEO Score",
    statEng: "💬 Engagement Rate",

    featTitle: "Features Engineered for Virality & Monetization",
    featSub: "Everything you need to optimize video structure and outrank your competition.",

    f1Title: "📊 Floating YouTube Overlay",
    f1Desc: "Glassmorphism panel injected into any watch page with live VPH, SEO score, and 1-click tracking.",

    f2Title: "🚀 Real-Time VPH Metric",
    f2Desc: "Calculates exact hourly view gains to catch exploding viral topics before anyone else.",

    f3Title: "🎯 SEO Score Calculator (0-100)",
    f3Desc: "Evaluates titles, tag richness, descriptions, and thumbnails to guarantee maximum organic reach.",

    f4Title: "📋 1-Click Tag Copier",
    f4Desc: "Instantly inspect and copy tags from viral competitor videos to apply to your own content.",

    f5Title: "🧬 Viral Pattern Analysis",
    f5Desc: "Discover optimal video lengths, best publishing days/hours, and high-converting keywords.",

    f6Title: "🔥 Country-Based Trending Search",
    f6Desc: "Discover trending videos worldwide or by country (US, UK, Spain, Mexico) consuming only 1u quota.",

    compTitle: "TrendPulse YT vs Traditional Tools",
    compSub: "Why smart creators choose TrendPulse YT over expensive monthly subscriptions.",
    compColFeature: "Feature / Capability",
    compColTp: "TrendPulse YT (PRO)",
    compColVidiq: "vidIQ (Pro/Boost)",
    compColTubebuddy: "TubeBuddy (Legend)",

    compR1: "Pricing Model",
    compR1Tp: "One-Time Payment ($50 Lifetime)",
    compR1Vidiq: "$49 - $149 / month",
    compR1Tubebuddy: "$39 - $89 / month",

    compR2: "Real-Time VPH Velocity",
    compR2Tp: "✓ Included (Any Video)",
    compR2Vidiq: "❌ Limited / Own videos only",
    compR2Tubebuddy: "❌ Not Available",

    compR3: "Niche Structural Pattern Analysis",
    compR3Tp: "✓ Automatic Included",
    compR3Vidiq: "❌ Requires Enterprise Plan",
    compR3Tubebuddy: "❌ Not Available",

    compR4: "Direct Tag Copier",
    compR4Tp: "✓ Unlimited 1-Click",
    compR4Vidiq: "✓ Plan Restricted",
    compR4Tubebuddy: "✓ Plan Restricted",

    compR5: "Privacy & Data Access",
    compR5Tp: "✓ 100% Public API Data",
    compR5Vidiq: "⚠️ Requires Channel Link",
    compR5Tubebuddy: "⚠️ Requires Channel Link",

    priceTitle: "Simple, Transparent Pricing",
    priceSub: "No hidden monthly fees. Choose the plan that fits your growth goals.",

    pBasicTitle: "Basic Version",
    pBasicDesc: "Perfect for beginner creators getting started.",
    pBasicPrice: "$25 USD",
    pBasicPeriod: "One-Time Lifetime Payment",
    pBasicF1: "✓ Track up to 5 videos",
    pBasicF2: "✓ YouTube Floating Overlay with VPH",
    pBasicF3: "✓ Basic Comparison Table",
    pBasicF4: "✓ 1-Click Windows Installer",
    pBasicF5: "❌ Viral Pattern Analysis",
    pBasicF6: "❌ Country Trending Search",
    pBasicBtn: "Buy Basic ($25)",

    pProTitle: "PRO / Premium Version",
    pProDesc: "For serious creators & agencies scaling YouTube revenue.",
    pProBadge: "🔥 MOST POPULAR - 50% OFF",
    pProPrice: "$50 USD",
    pProPeriod: "One-Time Lifetime Payment (Reg. $100)",
    pProF1: "✓ UNLIMITED Video Tracking",
    pProF2: "✓ Structural Pattern Module (\"Why It Works\")",
    pProF3: "✓ SEO Score Calculator (0-100)",
    pProF4: "✓ 1-Click Tag Copier",
    pProF5: "✓ Country Trending Search (1u)",
    pProF6: "✓ Title & Keyword Suggestions Engine",
    pProF7: "✓ Live Trending Notifications",
    pProF8: "✓ PRO License Key + VIP Support",
    pProBtn: "🚀 Get PRO License ($50)",

    faqTitle: "Frequently Asked Questions",
    q1: "How do I download and install after purchasing?",
    a1: "You will instantly receive a download link for `TrendPulse_YT_Setup.bat`. Running it on Windows installs the extension in 1 click.",
    q2: "Is there any recurring monthly subscription?",
    a2: "No. TrendPulse YT is a single one-time payment. You will never pay monthly renewals or hidden fees.",
    q3: "Do I need a YouTube API Key?",
    a3: "Yes, it connects via the official YouTube API. Our quick guide shows you how to get a free 10,000 units/day key in under 2 minutes.",
    q4: "Is it safe and compliant with YouTube policies?",
    a4: "100% compliant. It uses official YouTube API v3 public endpoints without scraping private channel data.",

    footerText: "© 2026 TrendPulse YT. All rights reserved. Built for YouTube Content Creators."
  },

  pt: {
    navFeatures: "Recursos",
    navComparison: "Comparação",
    navPricing: "Preços",
    navFaq: "Perguntas Frequentes",
    navBuy: "Baixar / Comprar",

    heroBadge: "⚡ Ferramenta #1 de Inteligência para Criadores no YouTube",
    heroTitle: "Monitore <span class='gradient-text'>Visualizações Por Hora (VPH)</span> em Tempo Real e Domine seu Nicho",
    heroSubtitle: "Descubra a velocidade de crescimento de qualquer vídeo do YouTube, compare seu canal com concorrentes, analise padrões virais e multiplique sua receita.",
    btnBuyPro: "🔥 Obter Licença PRO ($50)",
    btnBuyBasic: "⚡ Comprar Versão Básica ($25)",
    heroGuarantee: "✓ Licença Vitalícia (Sem assinaturas) &nbsp;•&nbsp; ✓ Instalador 1-Clique Windows &nbsp;•&nbsp; ✓ Garantia de 30 Dias",

    demoTitle: "Velocidade VPH & Estatísticas em Tempo Real",
    demoSub: "Monitoramento ao vivo em qualquer vídeo público do YouTube",
    statVph: "🚀 VPH (Views/Hora)",
    statTotalViews: "👁️ Visualizações Totais",
    statSeo: "🎯 SEO Score",
    statEng: "💬 Taxa de Engajamento",

    featTitle: "Recursos Criados para Viralizar e Monetizar",
    featSub: "Tudo o que você precisa para otimizar seus vídeos e superar a concorrência.",

    f1Title: "📊 Overlay Flutuante no YouTube",
    f1Desc: "Painel Glassmorphism injetado em qualquer vídeo com VPH ao vivo, pontuação SEO e rastreamento em 1 clique.",

    f2Title: "🚀 Métrica VPH em Tempo Real",
    f2Desc: "Calcula o ganho de visualizações por hora para detectar tópicos virais antes de todos.",

    f3Title: "🎯 Calculadora SEO Score (0-100)",
    f3Desc: "Avalia títulos, riqueza de tags, descrição e miniaturas para garantir o máximo alcance orgânico.",

    f4Title: "📋 Copiador de Tags em 1 Clique",
    f4Desc: "Inspecione e copie instantaneamente as tags dos vídeos virais do seu nicho para aplicar ao seu conteúdo.",

    f5Title: "🧬 Análise de Padrões Virais",
    f5Desc: "Descubra durações ideais, melhores dias/horas de publicação e palavras-chave com maior conversão.",

    f6Title: "🔥 Pesquisa de Tendências por País",
    f6Desc: "Descubra vídeos em alta no mundo ou por país (EUA, Brasil, Portugal, Espanha) consumindo apenas 1u de cota.",

    compTitle: "TrendPulse YT vs Ferramentas Tradicionais",
    compSub: "Por que criadores inteligentes escolhem o TrendPulse YT em vez de assinaturas mensais caras.",
    compColFeature: "Recurso / Função",
    compColTp: "TrendPulse YT (PRO)",
    compColVidiq: "vidIQ (Pro/Boost)",
    compColTubebuddy: "TubeBuddy (Legend)",

    compR1: "Modelo de Pagamento",
    compR1Tp: "Pagamento Único ($50 Vitalício)",
    compR1Vidiq: "$49 - $149 / mês",
    compR1Tubebuddy: "$39 - $89 / mês",

    compR2: "Velocidade VPH em Tempo Real",
    compR2Tp: "✓ Incluído (Qualquer Vídeo)",
    compR2Vidiq: "❌ Limitado / Apenas próprio",
    compR2Tubebuddy: "❌ Não Disponível",

    compR3: "Análise de Padrões de Nicho",
    compR3Tp: "✓ Automático Incluído",
    compR3Vidiq: "❌ Requer Plano Enterprise",
    compR3Tubebuddy: "❌ Não Disponível",

    compR4: "Copiador Direto de Tags",
    compR4Tp: "✓ Ilimitado 1-Clique",
    compR4Vidiq: "✓ Limitado pelo plano",
    compR4Tubebuddy: "✓ Limitado pelo plano",

    compR5: "Privacidade e Dados",
    compR5Tp: "✓ 100% Dados Públicos API",
    compR5Vidiq: "⚠️ Requer vincular canal",
    compR5Tubebuddy: "⚠️ Requer vincular canal",

    priceTitle: "Preços Simples e Transparentes",
    priceSub: "Sem mensalidades ocultas. Escolha o plano perfeito para seu crescimento.",

    pBasicTitle: "Versão Básica",
    pBasicDesc: "Ideal para pequenos criadores iniciando no YouTube.",
    pBasicPrice: "$25 USD",
    pBasicPeriod: "Pagamento Único Vitalício",
    pBasicF1: "✓ Rastreie até 5 vídeos",
    pBasicF2: "✓ Overlay Flutuante com VPH",
    pBasicF3: "✓ Tabela Comparativa Básica",
    pBasicF4: "✓ Instalador 1-Clique Windows",
    pBasicF5: "❌ Análise de Padrões Virais",
    pBasicF6: "❌ Pesquisa de Tendências por País",
    pBasicBtn: "Comprar Básica ($25)",

    pProTitle: "Versão PRO / Premium",
    pProDesc: "Para criadores sérios e agências buscando escalar receita.",
    pProBadge: "🔥 MAIS POPULAR - 50% OFF",
    pProPrice: "$50 USD",
    pProPeriod: "Pagamento Único Vitalício (Reg. $100)",
    pProF1: "✓ Rastreamento ILIMITADO de Vídeos",
    pProF2: "✓ Módulo de Padrões (\"Por Que Funciona\")",
    pProF3: "✓ Calculadora SEO Score (0-100)",
    pProF4: "✓ Copiador de Tags em 1-Clique",
    pProF5: "✓ Pesquisa de Tendências por País (1u)",
    pProF6: "✓ Gerador de Sugestões de Títulos e Keywords",
    pProF7: "✓ Notificações de Tendências Ao Vivo",
    pProF8: "✓ Chave de Licença PRO + Suporte VIP",
    pProBtn: "🚀 Obter Licença PRO ($50)",

    faqTitle: "Perguntas Frequentes",
    q1: "Como baixo e instalo após a compra?",
    a1: "Você receberá instantaneamente um link para baixar `TrendPulse_YT_Setup.bat`. Ao executá-lo no Windows, a extensão instala em 1 clique.",
    q2: "Existe alguma assinatura mensal?",
    a2: "Não. TrendPulse YT é um pagamento único vitalício. Você nunca pagará renovações mensais.",
    q3: "Preciso de uma chave API do YouTube?",
    a3: "Sim, ele se conecta via API oficial do YouTube. Nosso guia ensina a obter uma chave gratuita de 10.000 unidades/dia em 2 minutos.",
    q4: "É seguro e compatível com as regras do YouTube?",
    a4: "100% seguro. Ele usa dados públicos oficiais da API v3 do YouTube sem fazer scraping de dados privados.",

    footerText: "© 2026 TrendPulse YT. Todos os direitos reservados. Feito para Criadores do YouTube."
  }
};

let currentLang = 'es';

document.addEventListener('DOMContentLoaded', () => {
  setupLanguageSwitcher();
  setupFaqAccordion();
  setupCheckoutModal();
});

function setupLanguageSwitcher() {
  const langBtn = document.getElementById('lang-btn');
  const langMenu = document.getElementById('lang-menu');
  const langItems = document.querySelectorAll('.lang-item');

  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => langMenu.classList.remove('show'));

    langItems.forEach(item => {
      item.addEventListener('click', () => {
        const selectedLang = item.getAttribute('data-lang');
        if (selectedLang && TRANSLATIONS[selectedLang]) {
          currentLang = selectedLang;
          updateLanguageUI(selectedLang);
          langMenu.classList.remove('show');
        }
      });
    });
  }
}

function updateLanguageUI(lang) {
  const dict = TRANSLATIONS[lang];
  if (!dict) return;

  // Update Language Button label
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    const flags = { es: '🇪🇸 ES', en: '🇺🇸 EN', pt: '🇧🇷 PT' };
    langBtn.innerHTML = `${flags[lang]} ▾`;
  }

  // Update all elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.innerHTML = dict[key];
    }
  });
}

function setupFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        faqItems.forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      });
    }
  });
}

function setupCheckoutModal() {
  const modal = document.getElementById('checkout-modal');
  const closeModalBtn = document.getElementById('close-checkout-modal');
  const cancelBtn = document.getElementById('btn-cancel-checkout');
  const confirmBtn = document.getElementById('btn-confirm-checkout');

  const buyButtons = document.querySelectorAll('.btn-buy');

  buyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const plan = btn.getAttribute('data-plan') || 'PRO';
      const price = plan === 'PRO' ? '$50 USD' : '$25 USD';

      document.getElementById('modal-plan-name').textContent = plan === 'PRO' ? 'Licencia PRO / Premium (Vitalicia)' : 'Licencia Básica (Vitalicia)';
      document.getElementById('modal-plan-price').textContent = price;

      modal.classList.remove('hidden');
    });
  });

  if (closeModalBtn) closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => modal.classList.add('hidden'));

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const email = document.getElementById('modal-email-input').value.trim();
      if (!email || !email.includes('@')) {
        alert('Por favor ingresa un correo electrónico válido.');
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Procesando Pago...';

      setTimeout(() => {
        alert(`🎉 ¡Pago realizado con éxito!\n\nSe ha generado tu clave de Licencia PRO:\n🔑 TPYT-PRO-2026-PREMIUM\n\nHemos enviado las instrucciones de instalación a: ${email}`);
        modal.classList.add('hidden');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Completar Compra';
      }, 1500);
    });
  }
}
