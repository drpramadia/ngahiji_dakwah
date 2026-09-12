import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { PaymentSettings } from '@/lib/payments/qris/types';

const COLUMNS = 'id, payment_method, qr_image_url, merchant_name, instructions, bank_name, account_name, account_number, active, created_at, updated_at';

export type CmsPaymentSetting = PaymentSettings & {
  created_at: string;
  updated_at: string;
};

export async function getCmsPaymentSettings(): Promise<CmsPaymentSetting[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('payment_settings')
    .select(COLUMNS)
    .order('active', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`Unable to load payment settings: ${error.message}`);
  return (data ?? []) as CmsPaymentSetting[];
}

export async function getCmsPaymentSettingById(id: string): Promise<CmsPaymentSetting | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('payment_settings')
    .select(COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`Unable to load payment setting: ${error.message}`);
  return (data ?? null) as CmsPaymentSetting | null;
}
