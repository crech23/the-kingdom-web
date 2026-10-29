(() => {
  const storageKey = 'thekingdom.admin-session';
  const supabaseStorageKey = 'sb-ktghamfbpsyphgibavgn-auth-token';
  const syncFromStoredAuth = () => {
    try {
      const storedSession = JSON.parse(window.localStorage.getItem(supabaseStorageKey) || 'null');
      const tokenStillValid = !storedSession?.expires_at || storedSession.expires_at * 1000 > Date.now();
      if (storedSession?.access_token && storedSession?.user && tokenStillValid) {
        window.localStorage.setItem(storageKey, 'active');
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  };
  const updateNavigation = () => {
    const active = window.localStorage.getItem(storageKey) === 'active';
    document.querySelectorAll('.nav-login').forEach((link) => {
      link.hidden = active;
      link.href = 'admin.html';
      if (!active) link.textContent = 'Login';
      link.classList.remove('is-signed-in');
      if (!active && link.hasAttribute('aria-current')) link.removeAttribute('aria-current');
    });
  };

  window.kingdomAdminSession = {
    activate() {
      window.localStorage.setItem(storageKey, 'active');
      updateNavigation();
      window.dispatchEvent(new Event('kingdom:admin-session-changed'));
    },
    clear() {
      window.localStorage.removeItem(storageKey);
      updateNavigation();
      window.dispatchEvent(new Event('kingdom:admin-session-changed'));
    },
    isActive() {
      return window.localStorage.getItem(storageKey) === 'active';
    },
  };

  syncFromStoredAuth();
  updateNavigation();
  window.addEventListener('storage', (event) => {
    if (event.key === supabaseStorageKey) syncFromStoredAuth();
    if (event.key === storageKey || event.key === supabaseStorageKey) updateNavigation();
  });
  window.addEventListener('kingdom:admin-session-changed', updateNavigation);
})();
