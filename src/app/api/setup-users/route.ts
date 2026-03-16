import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const users = [
    { email: 'admin@hidasol.com', password: 'Hid@s0l-2026*', name: 'Administrador', role: 'admin' },
    { email: 'usuario@hidasol.com', password: 'User-@rt3.2026*', name: 'Usuario', role: 'user' },
  ];

  const results = [];

  for (const u of users) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((x: any) => x.email === u.email);

    if (existing) {
      // Update password only
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });
      if (updateError) {
        results.push({ email: u.email, step: 'update', error: updateError.message });
        continue;
      }
      // Ensure profile exists
      await supabase.from('user_profiles').upsert(
        { id: existing.id, email: u.email, name: u.name, role: u.role },
        { onConflict: 'id' }
      );
      results.push({ email: u.email, action: 'updated', id: existing.id });
    } else {
      // Create fresh user
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role },
      });

      if (createError) {
        results.push({ email: u.email, step: 'create', error: createError.message });
        continue;
      }

      if (created?.user) {
        await supabase.from('user_profiles').upsert(
          { id: created.user.id, email: u.email, name: u.name, role: u.role },
          { onConflict: 'id' }
        );
        results.push({ email: u.email, action: 'created', id: created.user.id });
      }
    }
  }

  return NextResponse.json({ results });
}
