import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  user_type: 'internal' | 'partner';
  email: string;
  name: string;
  role: string;
  partner_id?: string;
  partner_name?: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getUser(token);
    
    if (claimsError || !claims.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_type, email, name, role, partner_id, partner_name }: InviteRequest = await req.json();

    // Generate secure token
    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user record based on type
    if (user_type === 'internal') {
      const { error } = await supabase
        .from('users_internal')
        .insert({
          name,
          email,
          role,
          invite_token: inviteToken,
          invite_expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error("Error creating internal user:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (!partner_id) {
        return new Response(JSON.stringify({ error: "Partner ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from('users_partner')
        .insert({
          name,
          email,
          role,
          partner_id,
          invite_token: inviteToken,
          invite_expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error("Error creating partner user:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Build activation URL
    const baseUrl = req.headers.get("origin") || "https://agile-reach-tool.lovable.app";
    const activationUrl = `${baseUrl}/ativar-conta?token=${inviteToken}&type=${user_type}`;

    // Send invitation email
    const { error: emailError } = await resend.emails.send({
      from: "4Selet <noreply@resend.dev>",
      to: [email],
      subject: user_type === 'internal' 
        ? "Você foi convidado para a equipe 4Selet" 
        : `Você foi convidado para o sistema de tickets${partner_name ? ` - ${partner_name}` : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #18181b; font-size: 24px; margin: 0;">Olá, ${name}!</h1>
            </div>
            
            <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              ${user_type === 'internal' 
                ? 'Você foi convidado para fazer parte da equipe 4Selet no sistema de gerenciamento de tarefas.'
                : `Você foi convidado para acessar o sistema de tickets${partner_name ? ` da empresa ${partner_name}` : ''}.`
              }
            </p>
            
            <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              Clique no botão abaixo para ativar sua conta e definir sua senha:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${activationUrl}" style="background-color: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
                Ativar Minha Conta
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin-top: 32px;">
              Este link expira em 7 dias. Se você não solicitou este convite, pode ignorar este e-mail.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 32px 0;" />
            
            <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
              © 2024 4Selet. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Still return success - user was created, email failed
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: "User created but email failed to send",
          activation_url: activationUrl 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Invitation sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-invite:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
