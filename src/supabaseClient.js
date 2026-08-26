import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qihqziamanbdwisvkmih.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_zwZAbw6Vb1qTFUja1wLLtA_V-hrnw0A";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
