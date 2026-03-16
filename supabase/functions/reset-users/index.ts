import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const users = [
      {
        email: "admin@hidasol.com",
        password: "Hid@s0l-2026*",
        name: "Administrador",
        role: "admin",
      },
      {
        email: "usuario@hidasol.com",
        password: "User-@rt3.2026*",
        name: "Usuario",
        role: "user",
      },
    ];

    const results = [];

    for (const u of users) {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (x: any) => x.email === u.email
      );

      if (existing) {
        // Delete profile first to avoid FK constraint
        await supabase.from("user_profiles").delete().eq("id", existing.id);

        // Delete auth user
        const { error: delError } = await supabase.auth.admin.deleteUser(
          existing.id
        );
        if (delError) {
          results.push({
            email: u.email,
            step: "delete",
            error: delError.message,
          });
          continue;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Create fresh user with Admin API
      const { data: created, error: createError } =
        await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name, role: u.role },
        });

      if (createError) {
        results.push({
          email: u.email,
          step: "create",
          error: createError.message,
        });
        continue;
      }

      if (created?.user) {
        const { error: profileError } = await supabase
          .from("user_profiles")
          .upsert(
            {
              id: created.user.id,
              email: u.email,
              name: u.name,
              role: u.role,
            },
            { onConflict: "id" }
          );

        if (profileError) {
          results.push({
            email: u.email,
            step: "profile",
            error: profileError.message,
            userId: created.user.id,
          });
          continue;
        }
      }

      results.push({ email: u.email, success: true, id: created?.user?.id });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
