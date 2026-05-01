// Conexión a Supabase

const SUPABASE_URL = "https://ujfdsabypflseijatxba.supabase.co";
const SUPABASE_KEY = "sb_publishable_CiZo8xFKkaT7mdRrQUYxuQ_48F6Vx3w";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

window.supabaseClient = supabaseClient;
window.db = supabaseClient;
