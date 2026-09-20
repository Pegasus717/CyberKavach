export type EnvFlagName =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "GEMINI_API_KEY"
  | "GEMINI_MODEL";

export type EnvFlags = Record<EnvFlagName, boolean>;

export function getEnvFlags(): EnvFlags {
  return {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    GEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
    GEMINI_MODEL: Boolean(process.env.GEMINI_MODEL),
  };
}

export function getSupabaseUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return value || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return value || undefined;
}

export function getServiceRoleKey(): string | undefined {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return value || undefined;
}

export function getGeminiApiKey(): string | undefined {
  const value = process.env.GEMINI_API_KEY?.trim();
  return value || undefined;
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

export function missingEnvVars(): EnvFlagName[] {
  const flags = getEnvFlags();
  return (Object.keys(flags) as EnvFlagName[]).filter((key) => {
    if (key === "GEMINI_MODEL") return false;
    return !flags[key];
  });
}

export function hasPublicSupabase(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function hasServerSupabase(): boolean {
  return hasPublicSupabase() && Boolean(getServiceRoleKey());
}
