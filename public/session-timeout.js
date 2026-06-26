(() => {
  const AUTH_TOKEN_KEY = 'towerPsaToken';
  const LAST_ACTIVITY_KEY = 'towerPsaLastActivityAt';
  const IDLE_TIMEOUT_MINUTES = 30;
  const ACTIVITY_WRITE_THROTTLE_MS = 30000;
  const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

  let idleTimerId = null;
  let tokenExpiryTimerId = null;
  let lastStoredActivityAt = 0;
  let authRedirectHandled = false;

  const clearAuthStorage = () => {
    localStorage.removeItem('towerPsaToken');
    localStorage.removeItem('towerPsaUserName');
    localStorage.removeItem('towerPsaUserEmail');
    localStorage.removeItem('towerPsaUserRole');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  const redirectToLogin = (reason = 'unauthorized') => {
    if (authRedirectHandled) {
      return;
    }

    authRedirectHandled = true;
    clearAuthStorage();
    window.location.replace(`login.html?reason=${encodeURIComponent(reason)}`);
  };

  const getTokenExpiryMs = (token) => {
    try {
      const payloadSegment = token.split('.')[1];
      if (!payloadSegment) {
        return null;
      }

      const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded));

      if (!decoded?.exp || typeof decoded.exp !== 'number') {
        return null;
      }

      return decoded.exp * 1000;
    } catch {
      return null;
    }
  };

  const scheduleTokenExpiryTimeout = (token) => {
    if (tokenExpiryTimerId) {
      window.clearTimeout(tokenExpiryTimerId);
    }

    const expiryAtMs = getTokenExpiryMs(token);
    if (!expiryAtMs) {
      return;
    }

    const remainingMs = expiryAtMs - Date.now();
    if (remainingMs <= 0) {
      redirectToLogin('expired');
      return;
    }

    tokenExpiryTimerId = window.setTimeout(() => {
      redirectToLogin('expired');
    }, remainingMs);
  };

  const scheduleIdleTimeout = (activityAt) => {
    if (idleTimerId) {
      window.clearTimeout(idleTimerId);
    }

    const now = Date.now();
    const elapsedMs = now - activityAt;
    const remainingMs = IDLE_TIMEOUT_MS - elapsedMs;

    if (remainingMs <= 0) {
      redirectToLogin('idle');
      return;
    }

    idleTimerId = window.setTimeout(() => {
      redirectToLogin('idle');
    }, remainingMs);
  };

  const writeActivity = () => {
    const now = Date.now();
    if (now - lastStoredActivityAt < ACTIVITY_WRITE_THROTTLE_MS) {
      return;
    }

    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    lastStoredActivityAt = now;
  };

  const onActivity = () => {
    writeActivity();
    scheduleIdleTimeout(lastStoredActivityAt);
  };

  const patchFetchForAuthRedirect = () => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        redirectToLogin('expired');
      }

      return response;
    };
  };

  const initializeSessionTimeout = () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    patchFetchForAuthRedirect();
    scheduleTokenExpiryTimeout(token);

    const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    const now = Date.now();
    const initialActivityAt = Number.isFinite(stored) && stored > 0 ? stored : now;

    localStorage.setItem(LAST_ACTIVITY_KEY, String(initialActivityAt));
    lastStoredActivityAt = initialActivityAt;
    scheduleIdleTimeout(initialActivityAt);

    const events = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const lastActivityAt = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
        if (Number.isFinite(lastActivityAt) && lastActivityAt > 0) {
          scheduleIdleTimeout(lastActivityAt);
        }
      }
    });
  };

  initializeSessionTimeout();
})();
