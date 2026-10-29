(() => {
  const client = window.kingdomSupabase;
  const status = document.querySelector('#admin-status');
  const loginForm = document.querySelector('#login-form');
  const passwordForm = document.querySelector('#invite-password-form');
  if (!status || !loginForm || !passwordForm) return;

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('is-error', isError);
  };
  const getForm = (selector) => document.querySelector(selector);
  const loginEmail = getForm('#login-email');
  const loginPassword = getForm('#login-password');
  const newPassword = getForm('#new-password');
  const confirmPassword = getForm('#confirm-password');
  const resetPasswordButton = getForm('#password-reset-button');
  const callbackParams = new URLSearchParams(window.location.hash.slice(1));
  const queryParams = new URLSearchParams(window.location.search);
  const isAuthCallback = ['invite', 'recovery'].includes(callbackParams.get('type')) || queryParams.has('code');

  if (!client) {
    setStatus('No se pudo conectar con Supabase. Recarga la página e inténtalo de nuevo.', true);
    return;
  }

  const verifyAdministrator = async (user) => {
    const { data, error } = await client
      .from('communication_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      await client.auth.signOut();
      window.kingdomAdminSession?.clear();
      loginForm.hidden = false;
      passwordForm.hidden = true;
      setStatus('La cuenta inició sesión, pero todavía no tiene permisos de administrador.', true);
      return false;
    }

    window.kingdomAdminSession?.activate();
    setStatus('Sesión iniciada. Abriendo el inicio del sitio…');
    window.location.replace('index.html#inicio');
    return true;
  };

  const showPasswordForm = (user) => {
    loginForm.hidden = true;
    passwordForm.hidden = false;
    getForm('#invite-password-title').textContent = callbackParams.get('type') === 'recovery'
      ? 'Restablece tu contraseña'
      : 'Crea tu contraseña';
    getForm('#invite-password-help').textContent = `Define una contraseña para ${user.email || 'tu cuenta'}.`;
    setStatus('Enlace verificado. Ya puedes definir tu contraseña.');
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    const { data, error } = await client.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value,
    });
    submitButton.disabled = false;
    if (error) {
      setStatus('No se pudo iniciar sesión. Revisa el correo y la contraseña.', true);
      return;
    }
    loginPassword.value = '';
    await verifyAdministrator(data.user);
  });

  passwordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (newPassword.value.length < 8) {
      setStatus('La contraseña debe tener al menos 8 caracteres.', true);
      return;
    }
    if (newPassword.value !== confirmPassword.value) {
      setStatus('Las contraseñas no coinciden.', true);
      return;
    }

    const submitButton = passwordForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus('Guardando contraseña…');
    const { data, error } = await client.auth.updateUser({ password: newPassword.value });
    submitButton.disabled = false;
    if (error) {
      setStatus(error.message || 'No se pudo guardar la contraseña. Solicita un enlace nuevo.', true);
      return;
    }

    passwordForm.hidden = true;
    passwordForm.reset();
    window.history.replaceState(null, document.title, window.location.pathname);
    setStatus('Contraseña guardada. Comprobando permisos del panel…');
    await verifyAdministrator(data.user);
  });

  resetPasswordButton.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    if (!email) {
      setStatus('Escribe tu correo y vuelve a pulsar “¿Olvidaste tu contraseña?”.', true);
      loginEmail.focus();
      return;
    }
    resetPasswordButton.disabled = true;
    const { error } = await client.auth.resetPasswordForEmail(email);
    resetPasswordButton.disabled = false;
    setStatus(error
      ? `Supabase no pudo enviar el enlace: ${error.message}`
      : 'Si el correo está registrado, recibirás un enlace para crear una contraseña.', Boolean(error));
  });

  client.auth.getSession().then(({ data }) => {
    if (data.session?.user && isAuthCallback) showPasswordForm(data.session.user);
    else if (data.session?.user) verifyAdministrator(data.session.user);
    else if (isAuthCallback) setStatus('No se pudo validar el enlace. Corrige la URL en Supabase y solicita uno nuevo.', true);
  });
})();
