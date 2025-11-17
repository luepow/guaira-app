import { apiClient } from './api';
import type { Wallet, Transaction, PaginatedResponse } from '../types';

export const walletService = {
  /**
   * Get user's wallet
   */
  async getWallet(userId: string) {
    return await apiClient.get<Wallet>(`/wallets/${userId}`);
  },

  /**
   * Get wallet balance
   */
  async getBalance(userId: string) {
    return await apiClient.get<{ balance: number; currency: string }>(`/wallets/${userId}/balance`);
  },

  /**
   * Deposit money into wallet
   */
  async deposit(data: {
    userId: string;
    amount: number;
    paymentMethod: 'card' | 'cash';
    paymentDetails?: any;
  }) {
    return await apiClient.post<Transaction>('/wallets/deposit', data);
  },

  /**
   * Withdraw money from wallet
   */
  async withdraw(data: {
    userId: string;
    amount: number;
    destination: string;
  }) {
    return await apiClient.post<Transaction>('/wallets/withdraw', data);
  },

  /**
   * Transfer money between wallets
   */
  async transfer(data: {
    fromUserId: string;
    toUserId: string;
    amount: number;
    description?: string;
  }) {
    return await apiClient.post<Transaction>('/wallets/transfer', data);
  },

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    params?: {
      page?: number;
      pageSize?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    return await apiClient.get<PaginatedResponse<Transaction>>(
      `/wallets/${userId}/transactions`,
      params
    );
  },

  /**
   * Get transaction details
   */
  async getTransaction(transactionId: string) {
    return await apiClient.get<Transaction>(`/transactions/${transactionId}`);
  },
};
