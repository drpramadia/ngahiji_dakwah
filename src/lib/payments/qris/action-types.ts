export type AttendeeInput = {
  full_name: string;
  email: string;
  whatsapp: string;
  instagram: string;
};

export type BuyerInput = {
  full_name?: string;
  email?: string;
  whatsapp?: string;
  instagram?: string;
};

export type CreateOrderInput = {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyer?: BuyerInput;
  attendees?: AttendeeInput[];
};