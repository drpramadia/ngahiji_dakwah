'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { expireStaleOrders } from '@/lib/orders/expire';

export async function runExpireOrdersAction(): Promise<{ pendingExpired: number; waitingExpired: number; errors: string[] }> {
  await requireAdmin();
  const result = await expireStaleOrders();
  revalidatePath('/admin/payments');
  return result;
}
