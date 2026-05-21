// Supabase connection (frontend-safe publishable key)
// Exposes window.supabaseClient and window.db for the rest of the app.
(async function initSupabaseClient() {
  const SUPABASE_URL = "https://ujfdsabypflseijatxba.supabase.co";
  const SUPABASE_KEY = "sb_publishable_CiZo8xFKkaT7mdRrQUYxuQ_48F6Vx3w";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  if (!window.supabase) {
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    } catch (_e1) {
      try {
        await loadScript("https://unpkg.com/@supabase/supabase-js@2");
      } catch (_e2) {
        console.error("Supabase SDK could not be loaded from CDN.");
        return;
      }
    }
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase SDK not available after loading attempts.");
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window.db = window.supabaseClient;
})();

