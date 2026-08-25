import { createClient } from "@supabase/supabase-js";

// 👉 Colle ici les deux valeurs trouvées dans Supabase :
// Project Settings → API → Project URL / anon public key
const SUPABASE_URL = "COLLE_TON_PROJECT_URL_ICI";
const SUPABASE_ANON_KEY = "COLLE_TA_CLE_ANON_ICI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
