export type TicketStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED' | 'REFUNDED' | 'USED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

export function canActivateTicket(paymentStatus: PaymentStatus, verificationStatus: VerificationStatus) {
  return paymentStatus === 'PAID' && verificationStatus === 'VERIFIED';
}

export function assertTicketActivation(status: TicketStatus, paymentStatus: PaymentStatus, verificationStatus: VerificationStatus) {
  if (status === 'ACTIVE' && !canActivateTicket(paymentStatus, verificationStatus)) {
    throw new Error('Tickets can only become active after paid and verified state');
  }
}
