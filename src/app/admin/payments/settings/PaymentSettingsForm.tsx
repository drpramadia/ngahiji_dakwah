import type { CmsPaymentSetting } from '@/lib/admin/payment-settings';
import MediaUploader from '@/components/admin/MediaUploader';
import { createPaymentSettingAction, updatePaymentSettingAction } from './actions';

export default function PaymentSettingsForm({ item }: { item?: CmsPaymentSetting }) {
  const action = item ? updatePaymentSettingAction : createPaymentSettingAction;
  const isEdit = Boolean(item);

  return (
    <form className="admin-form" action={action}>
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="admin-form-grid">
        <label>Payment method<input name="payment_method" required defaultValue={item?.payment_method ?? 'QRIS'} placeholder="QRIS" /></label>
        <label>Merchant name<input name="merchant_name" required defaultValue={item?.merchant_name ?? 'NGAHIJI'} /></label>
      </div>

      <MediaUploader
        name="qr_image_url"
        bucket="payment-assets"
        folder="qris"
        label="QRIS image (upload PNG/JPG hasil scan/generate QRIS)"
        required
        defaultValue={item?.qr_image_url ?? ''}
      />

      <label>Instructions (petunjuk pembayaran, satu langkah per baris)<textarea name="instructions" rows={6} defaultValue={item?.instructions ?? ''} placeholder={'1. Scan QR menggunakan mobile banking / e-wallet.\n2. Pastikan nominal sesuai total pembayaran.\n3. Upload bukti transfer setelah pembayaran.'} /></label>

      <fieldset className="admin-fieldset">
        <legend>Bank transfer (opsional, fallback jika QRIS gagal)</legend>
        <div className="admin-form-grid">
          <label>Bank name<input name="bank_name" defaultValue={item?.bank_name ?? ''} placeholder="BCA / Mandiri / BSI" /></label>
          <label>Account name<input name="account_name" defaultValue={item?.account_name ?? ''} placeholder="Yayasan Ngahiji Dakwah" /></label>
          <label>Account number<input name="account_number" defaultValue={item?.account_number ?? ''} placeholder="1234567890" /></label>
        </div>
      </fieldset>

      <label className="admin-check">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} />
        <span>Aktifkan sebagai metode pembayaran (menonaktifkan setting lain)</span>
      </label>

      <p className="notice">Setting aktif akan otomatis tampil di halaman checkout. Hanya boleh ada <strong>1 setting aktif</strong> pada satu waktu.</p>

      <button className="btn" type="submit">{isEdit ? 'Save setting' : 'Create setting'} ↗</button>
    </form>
  );
}
