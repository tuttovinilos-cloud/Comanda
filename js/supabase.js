// Supabase connection bootstrap.
// Single source of truth:
// 1) window.__APP_CONFIG__.SUPABASE_URL / SUPABASE_ANON_KEY (recommended in deploy)
// 2) window.SUPABASE_URL / SUPABASE_ANON_KEY
// 3) safe local fallback for current project
(function () {
  const appCfg = window.__APP_CONFIG__ || {};
  const SUPABASE_URL =
    appCfg.SUPABASE_URL ||
    window.SUPABASE_URL ||
    "https://ujfdsabypflseijatxba.supabase.co";
  const SUPABASE_ANON_KEY =
    appCfg.SUPABASE_ANON_KEY ||
    window.SUPABASE_ANON_KEY ||
    "";

  window.__COMANDA_SUPABASE_CONFIG__ = {
    url: SUPABASE_URL,
    hasAnonKey: !!SUPABASE_ANON_KEY
  };

  if (!window.supabase) {
    console.error("Supabase SDK not loaded. Check the <script> tag for @supabase/supabase-js.");
    return;
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase config missing. Define SUPABASE_URL and SUPABASE_ANON_KEY in window.__APP_CONFIG__.");
    return;
  }

  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.supabaseClient = supabaseClient;
  window.db = supabaseClient;
})();
