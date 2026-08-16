const SUPABASE_URL = "https://abprmzsxrgtcabxkmzgc.supabase.co";
const SUPABASE_KEY = "sb_publishable_DnVN7TtI9sfIpIj-jZzbHQ_Zeygm1iU";

window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);
