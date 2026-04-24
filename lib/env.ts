const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseEnv() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return {
    supabaseAnonKey,
    supabaseUrl,
  };
}

export function hasGeminiApiKey() {
  return Boolean(geminiApiKey?.trim());
}

export function getGeminiApiKey() {
  const key = geminiApiKey?.trim();

  if (!key) {
    throw new Error("Missing Gemini API key. Set GEMINI_API_KEY.");
  }

  return key;
}

export function getGeminiModel() {
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return model.trim();
}
