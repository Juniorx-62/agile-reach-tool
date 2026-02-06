import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ValidateRequest {
  token: string;
  user_type: 'internal' | 'partner';
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, user_type }: ValidateRequest = await req.json();

    if (!token || !user_type) {
      return new Response(JSON.stringify({ valid: false, error: "Missing parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const table = user_type === 'internal' ? 'users_internal' : 'users_partner';
    
    const { data, error } = await supabase
      .from(table)
      .select('id, name, email, invite_expires_at')
      .eq('invite_token', token)
      .gt('invite_expires_at', new Date().toISOString())
      .is('auth_id', null)
      .maybeSingle();

    if (error || !data) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired token" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        user: {
          name: data.name,
          email: data.email,
          expires_at: data.invite_expires_at,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in validate-token:", errorMessage);
    return new Response(JSON.stringify({ valid: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
