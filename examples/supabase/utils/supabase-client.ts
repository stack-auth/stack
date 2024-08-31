import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseJwt } from "./actions";

/*
Creates a supabase client with the JWT signed by the server (instead of supabase auth)
*/
export const createSupabaseClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { accessToken: async () => await getSupabaseJwt() || "" }
  );
}
