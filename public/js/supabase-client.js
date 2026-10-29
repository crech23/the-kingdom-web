(() => {
  const projectUrl = 'https://ktghamfbpsyphgibavgn.supabase.co';
  const publishableKey = 'sb_publishable_W4HkgJDMgtI4ArpR_zR_EA_uCfV-Cro';

  if (!window.supabase?.createClient) {
    console.error('No se pudo cargar el cliente de Supabase.');
    return;
  }

  window.kingdomSupabase = window.supabase.createClient(projectUrl, publishableKey);
})();
