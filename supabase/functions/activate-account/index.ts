import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ActivateRequest {
  token: string;
  user_type: 'internal' | 'partner';
  password: string;
  name?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { token, user_type, password, name }: ActivateRequest = await req.json();

    if (!token || !user_type || !password) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by token
    const table = user_type === 'internal' ? 'users_internal' : 'users_partner';
    
    const { data: userData, error: findError } = await supabase
      .from(table)
      .select('*')
      .eq('invite_token', token)
      .gt('invite_expires_at', new Date().toISOString())
      .is('auth_id', null)
      .maybeSingle();

    if (findError || !userData) {
      console.error("Token validation error:", findError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name || userData.name,
        user_type: user_type,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update user record with auth_id and clear token
    const { error: updateError } = await supabase
      .from(table)
      .update({
        auth_id: authData.user.id,
        name: name || userData.name,
        invite_token: null,
        invite_expires_at: null,
      })
      .eq('id', userData.id);

    if (updateError) {
      console.error("Update error:", updateError);
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to activate account" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account activated successfully",
        email: userData.email 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in activate-account:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
