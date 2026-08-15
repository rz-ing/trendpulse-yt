/**
 * TrendPulse YT - Commercial License & Activation Module
 * Handles license key validation (Gumroad API / Master Key / Custom Webhook),
 * feature gating, and license status persistence.
 */

export const LICENSE_CONFIG = {
  // Set your Gumroad Product Permalink or Product ID here if selling on Gumroad
  gumroadProductPermalink: 'trendpulse-yt-pro',
  // Master fallback keys for testing/admin access
  masterKeys: ['TPYT-PRO-2026-PREMIUM', 'TPYT-VIP-SUCCESS-888', 'TRENDPULSE-FULL-ACCESS'],
  // Default limits for Unlicensed/Trial mode
  freeLimits: {
    maxTrackedVideos: 3,
    allowNicheSearch: false,
    allowPatternAnalysis: false
  }
};

/**
 * Gets current license status from storage.
 * @returns {Promise<Object>}
 */
export async function getLicenseStatus() {
  const result = await chrome.storage.local.get('licenseInfo');
  const info = result.licenseInfo || {
    isActivated: false,
    licenseKey: '',
    activatedAt: null,
    planType: 'FREE' // 'FREE' or 'PRO'
  };

  return info;
}

/**
 * Validates and activates a License Key.
 * @param {string} licenseKey 
 * @returns {Promise<Object>} Result object { success: boolean, message: string }
 */
export async function activateLicenseKey(licenseKey) {
  const key = (licenseKey || '').trim().toUpperCase();

  if (!key) {
    return { success: false, error: 'Por favor ingresa una clave de licencia válida.' };
  }

  // 1. Check Master / Admin keys offline
  if (LICENSE_CONFIG.masterKeys.includes(key)) {
    const licenseInfo = {
      isActivated: true,
      licenseKey: key,
      activatedAt: Date.now(),
      planType: 'PRO',
      provider: 'MasterKey'
    };
    await chrome.storage.local.set({ licenseInfo });
    return { success: true, message: '🎉 ¡Licencia PRO activada con éxito!', licenseInfo };
  }

  // 2. Validate via Gumroad API if format matches Gumroad key structure
  try {
    const gumroadRes = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        product_permalink: LICENSE_CONFIG.gumroadProductPermalink,
        license_key: key
      })
    });

    if (gumroadRes.ok) {
      const data = await gumroadRes.json();
      if (data.success && !data.purchase.refunded && !data.purchase.chargebacked) {
        const licenseInfo = {
          isActivated: true,
          licenseKey: key,
          activatedAt: Date.now(),
          planType: 'PRO',
          provider: 'Gumroad',
          customerEmail: data.purchase.email
        };
        await chrome.storage.local.set({ licenseInfo });
        return { success: true, message: '🎉 ¡Licencia PRO activada mediante Gumroad!', licenseInfo };
      }
    }
  } catch (err) {
    console.warn('[License] Gumroad API validation offline or skipped:', err);
  }

  // 3. Fallback: Generic Key format check (e.g. TPYT-XXXX-XXXX-XXXX)
  if (/^TPYT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key)) {
    const licenseInfo = {
      isActivated: true,
      licenseKey: key,
      activatedAt: Date.now(),
      planType: 'PRO',
      provider: 'StandardKey'
    };
    await chrome.storage.local.set({ licenseInfo });
    return { success: true, message: '🎉 ¡Licencia PRO activada con éxito!', licenseInfo };
  }

  return {
    success: false,
    error: 'La clave de licencia ingresada no es válida. Revisa tu correo de compra o contacta a soporte.'
  };
}

/**
 * Deactivates current license.
 */
export async function deactivateLicense() {
  await chrome.storage.local.remove('licenseInfo');
  return { success: true, message: 'Licencia desactivada.' };
}
