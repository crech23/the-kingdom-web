(() => {
  const storageKey = 'thekingdom.admin-session';
  const supabaseStorageKey = 'sb-ktghamfbpsyphgibavgn-auth-token';
  const syncFromStoredAuth = () => {
    try {
      const storedSession = JSON.parse(window.localStorage.getItem(supabaseStorageKey) || 'null');
      if (storedSession?.access_token && storedSession?.user) {
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
      link.textContent = active ? 'Sesión iniciada' : 'Login';
      link.href = active ? 'comunicados.html#admin-tools' : 'admin.html';
      link.classList.toggle('is-signed-in', active);
      if (active) link.removeAttribute('aria-current');
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
