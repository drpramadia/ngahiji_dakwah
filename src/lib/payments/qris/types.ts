export type OrderStatus = 'DRAFT' | 'PENDING_PAYMENT' | 'WAITING_VERIFICATION' | 'PROCESSING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';

export type PaymentSettings = {
  id: string;
  payment_method: string;
  qr_image_url: string;
  merchant_name: string;
  instructions: string;
  bank_name: string | null;
  account_name: string | null;
  account_number: string | null;
  active: boolean;
};

export type OrderSummary = {
  id: string;
  event_id: string;
  buyer_id: string;
  status: OrderStatus;
  subtotal_idr: number;
  fee_idr: number;
  discount_idr: number;
  total_idr: number;
  payment_proof_url: string | null;
  payment_uploaded_at: string | null;
  paid_at: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
};

export type OrderWithContext = OrderSummary & {
  event_title: string;
  event_slug: string;
  ticket_name: string;
  quantity: number;
  buyer_email: string | null;
  buyer_name: string | null;
};