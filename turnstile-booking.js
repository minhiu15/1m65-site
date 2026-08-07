(function setupBookingTurnstile(global) {
  const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  const VERIFY_TIMEOUT_MS = 20_000;
  let scriptPromise;
  let widgetId;
  let pending;

  function siteKey() {
    return String(global.MEW_TURNSTILE_SITE_KEY || '').trim();
  }

  function turnstileError(message) {
    const error = new Error(message || 'turnstile_unavailable');
    error.code = 'turnstile_unavailable';
    return error;
  }

  function settle(kind, value) {
    if (!pending) return;
    const current = pending;
    pending = null;
    clearTimeout(current.timer);
    current[kind](value);
  }

  function loadScript() {
    if (global.turnstile) return Promise.resolve(global.turnstile);
    if (scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-mew-turnstile]');
      const script = existing || document.createElement('script');
      const onLoad = () => global.turnstile
        ? resolve(global.turnstile)
        : reject(turnstileError());
      const onError = () => reject(turnstileError());
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      if (!existing) {
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        script.dataset.mewTurnstile = '1';
        document.head.appendChild(script);
      }
    }).catch((error) => {
      scriptPromise = null;
      throw error;
    });
    return scriptPromise;
  }

  function ensureWidget(api) {
    if (widgetId != null) return widgetId;
    const host = document.createElement('div');
    host.id = 'mew-turnstile-host';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:500;width:1px;height:1px;overflow:visible';
    document.body.appendChild(host);
    widgetId = api.render(host, {
      sitekey: siteKey(),
      size: 'invisible',
      execution: 'execute',
      appearance: 'interaction-only',
      callback: (token) => settle('resolve', token),
      'error-callback': () => {
        settle('reject', turnstileError());
        return true;
      },
      'expired-callback': () => settle('reject', turnstileError())
    });
    return widgetId;
  }

  async function getToken() {
    if (!siteKey()) return '';
    if (pending) throw turnstileError();
    const api = await loadScript();
    const id = ensureWidget(api);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => settle('reject', turnstileError()), VERIFY_TIMEOUT_MS);
      pending = { resolve, reject, timer };
      try {
        api.reset(id);
        api.execute(id);
      } catch {
        settle('reject', turnstileError());
      }
    });
  }

  global.mewTurnstileBooking = Object.freeze({
    enabled: () => Boolean(siteKey()),
    getToken
  });
})(window);
