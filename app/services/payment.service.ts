import { apiClient } from './api';
import type { Payment, PaymentMethod } from '../types';

export const paymentService = {
  /**
   * Create a new payment
   */
  async createPayment(data: {
    userId: string;
    amount: number;
    currency?: string;
    method: PaymentMethod;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    return await apiClient.post<Payment>('/payments', {
      ...data,
      requestId: crypto.randomUUID(), // Idempotency key
    });
  },

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string) {
    return await apiClient.get<Payment>(`/payments/${paymentId}`);
  },

  /**
   * Get user's payment history
   */
  async getPaymentHistory(
    userId: string,
    params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return await apiClient.get<Payment[]>(`/users/${userId}/payments`, params);
  },

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string) {
    return await apiClient.post<Payment>(`/payments/${paymentId}/cancel`);
  },

  /**
   * Refund a payment
   */
  async refundPayment(paymentId: string, reason?: string) {
    return await apiClient.post<Payment>(`/payments/${paymentId}/refund`, { reason });
  },

  /**
   * Process payment with wallet
   */
  async payWithWallet(data: {
    userId: string;
    amount: number;
    description: string;
    metadata?: Record<string, any>;
  }) {
    return await apiClient.post<Payment>('/payments/wallet', data);
  },

  /**
   * Process payment with card
   */
  async payWithCard(data: {
    userId: string;
    amount: number;
    cardToken: string;
    description: string;
    metadata?: Record<string, any>;
  }) {
    return await apiClient.post<Payment>('/payments/card', data);
  },
};
