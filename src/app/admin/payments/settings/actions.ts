'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { parsePaymentSettingsForm, type PaymentSettingsFormInput } from '@/lib/admin/payment-settings-validation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function payload(input: PaymentSettingsFormInput) {
  return {
    payment_method: input.payment_method,
    qr_image_url: input.qr_image_url,
    merchant_name: input.merchant_name,
    instructions: input.instructions,
    bank_name: input.bank_name,
    account_name: input.account_name,
    account_number: input.account_number,
    active: input.active
  };
}

function revalidateAll(id?: string) {
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/payments/settings');
  if (id) revalidatePath(`/admin/payments/settings/${id}`);
  // Checkout pages use active payment_settings; invalidate broadly.
  revalidatePath('/checkout', 'layout');
}

async function ensureSingleActive(id: string) {
  // When one setting is set to active, deactivate the others to keep
  // getActivePaymentSettings() deterministic.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('payment_settings')
    .update({ active: false })
    .neq('id', id);
  if (error) throw new Error(`Unable to deactivate other settings: ${error.message}`);
}

export async function createPaymentSettingAction(formData: FormData) {
  await requireAdmin();
  const input = parsePaymentSettingsForm(formData);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('payment_settings')
    .insert(payload(input))
    .select('id')
    .single();

  if (error) throw new Error(`Unable to create payment setting: ${error.message}`);
  if (input.active) await ensureSingleActive(String(data.id));

  revalidateAll();
  redirect(`/admin/payments/settings/${data.id}`);
}

export async function updatePaymentSettingAction(formData: FormData) {
  await requireAdmin();
  const input = parsePaymentSettingsForm(formData);
  if (!input.id) throw new Error('Payment setting ID is required');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('payment_settings')
    .update(payload(input))
    .eq('id', input.id);

  if (error) throw new Error(`Unable to update payment setting: ${error.message}`);
  if (input.active) await ensureSingleActive(input.id);

  revalidateAll(input.id);
}

export async function activatePaymentSettingAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid payment setting ID');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('payment_settings').update({ active: true }).eq('id', id);
  if (error) throw new Error(`Unable to activate: ${error.message}`);
  await ensureSingleActive(id);

  revalidateAll(id);
}

export async function deletePaymentSettingAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid payment setting ID');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('payment_settings').delete().eq('id', id);
  if (error) throw new Error(`Unable to delete: ${error.message}`);

  revalidateAll();
  redirect('/admin/payments/settings');
}
