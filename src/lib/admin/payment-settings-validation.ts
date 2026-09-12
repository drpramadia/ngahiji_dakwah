export type PaymentSettingsFormInput = {
  id?: string;
  payment_method: string;
  qr_image_url: string;
  merchant_name: string;
  instructions: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  active: boolean;
};

function str(fd: FormData, key: string, max = 500): string {
  const raw = fd.get(key);
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value.length > max) throw new Error(`${key} melebihi ${max} karakter`);
  return value;
}

export function parsePaymentSettingsForm(fd: FormData): PaymentSettingsFormInput {
  const id = str(fd, 'id', 40) || undefined;
  const payment_method = str(fd, 'payment_method', 40) || 'QRIS';
  const qr_image_url = str(fd, 'qr_image_url', 1000);
  const merchant_name = str(fd, 'merchant_name', 120) || 'NGAHIJI';
  const instructions = str(fd, 'instructions', 2000);
  const bank_name = str(fd, 'bank_name', 120) || null;
  const account_name = str(fd, 'account_name', 120) || null;
  const account_number = str(fd, 'account_number', 40) || null;
  const active = fd.get('active') === 'on' || fd.get('active') === 'true';

  if (!qr_image_url) throw new Error('QR image URL wajib diisi (upload gambar QRIS terlebih dahulu)');
  if (!merchant_name) throw new Error('Merchant name wajib diisi');

  return {
    id,
    payment_method,
    qr_image_url,
    merchant_name,
    instructions,
    bank_name,
    account_name,
    account_number,
    active
  };
}
