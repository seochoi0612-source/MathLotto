const SUPABASE_URL = "https://abprmzsxrgtcabxkmzgc.supabase.co";
const SUPABASE_KEY = "여기에 지금 사용 중인 키 그대로";

window.supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);