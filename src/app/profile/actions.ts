'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function updateProfileAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect('/login');

  const fullName = String(formData.get('full_name') ?? '').trim();
  const instagram = String(formData.get('instagram') ?? '').trim();
  const whatsapp = String(formData.get('whatsapp') ?? '').trim();

  if (!fullName) throw new Error('Nama lengkap wajib diisi');
  if (fullName.length > 120) throw new Error('Nama lengkap terlalu panjang');
  if (instagram && !/^@?[A-Za-z0-9_.]{1,30}$/.test(instagram)) throw new Error('Instagram username tidak valid');
  if (whatsapp && !/^[+0-9 ()-]{8,20}$/.test(whatsapp)) throw new Error('Nomor WhatsApp tidak valid');

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    full_name: fullName,
    instagram,
    whatsapp
  });

  if (error) throw new Error(`Gagal menyimpan profil: ${error.message}`);
  revalidatePath('/profile');
}
