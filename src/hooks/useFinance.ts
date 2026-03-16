'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface FinanceSummary {
  total_payments: number;
  total_amount: string;
  pending_payments: number;
  confirmed_payments: number;
  wallet: {
    total_wallet_entries: number;
    credits: string;
    debits: string;
  };
  withdrawals: {
    total_withdrawals: number;
    pending_withdrawals: number;
    pending_withdrawals_amount: string;
  };
}

export interface AdminPaymentRow {
  id: string;
  reference: string;
  scope_type: 'order' | 'group';
  status: string;
  subtotal: string;
  delivery_fee: string;
  platform_fee: string;
  total_amount: string;
  bank_provider: string | null;
  bank_transaction_id: string | null;
  requested_at: string;
  confirmed_at: string | null;
  order_id: string | null;
  group_id: string | null;
  payer_email: string | null;
}

export interface BankAccountRow {
  owner_type: 'restaurant' | 'rider';
  id: string;
  owner_id: string;
  owner_name: string | null;
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  branch_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRow {
  id: string;
  owner_type: 'restaurant' | 'rider';
  status: string;
  amount: string;
  external_transfer_id: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  restaurant_id: string | null;
  rider_id: string | null;
  owner_name: string | null;
  bank_name: string | null;
  account_number: string | null;
}

export function useFinanceSummary() {
  return useQuery<FinanceSummary>({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/admin/summary');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useAdminPayments(limit = 100) {
  return useQuery<AdminPaymentRow[]>({
    queryKey: ['finance-payments', limit],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/admin/list', {
        params: { limit },
      });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

export function useBankAccounts() {
  return useQuery<BankAccountRow[]>({
    queryKey: ['finance-bank-accounts'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/admin/bank-accounts');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

export function useWithdrawals(limit = 100) {
  return useQuery<WithdrawalRow[]>({
    queryKey: ['finance-withdrawals', limit],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/admin/withdrawals', {
        params: { limit },
      });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

export interface MyIncomeSummary {
  restaurantId: string | null;
  total_orders: number;
  gross_sales: string;
  net_income: string;
  pending_withdrawals_amount: string;
}

export interface MyBankAccountRow {
  id: string;
  restaurant_id: string;
  restaurant_name: string | null;
  bank_name: string;
  account_holder: string;
  account_number: string;
  account_type: string;
  branch_name: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyWithdrawalRow {
  id: string;
  status: string;
  amount: string;
  external_transfer_id: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  bank_name: string | null;
  account_number: string | null;
}

export function useMyIncomeSummary() {
  return useQuery<MyIncomeSummary>({
    queryKey: ['finance-my-income'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/my/income');
      return data;
    },
    staleTime: 30_000,
  });
}

export function useMyBankAccounts() {
  return useQuery<MyBankAccountRow[]>({
    queryKey: ['finance-my-bank-accounts'],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/my/bank-accounts');
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

export function useMyWithdrawals(limit = 100) {
  return useQuery<MyWithdrawalRow[]>({
    queryKey: ['finance-my-withdrawals', limit],
    queryFn: async () => {
      const { data } = await api.get('/api/payments/my/withdrawals', {
        params: { limit },
      });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

// ── SA: per-restaurant hooks ──────────────────────────────────────────────────

export interface RestaurantIncomeSummary {
  restaurantId: string;
  total_orders: number;
  gross_sales: string;
  net_income: string;
  pending_withdrawals_amount: string;
}

export function useRestaurantIncomeSummary(restaurantId: string) {
  return useQuery<RestaurantIncomeSummary>({
    queryKey: ['finance-restaurant-income', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/restaurant/${restaurantId}/income`);
      return data;
    },
    enabled: !!restaurantId,
    staleTime: 30_000,
  });
}

export function useRestaurantBankAccounts(restaurantId: string) {
  return useQuery<MyBankAccountRow[]>({
    queryKey: ['finance-restaurant-bank-accounts', restaurantId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/restaurant/${restaurantId}/bank-accounts`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!restaurantId,
    staleTime: 30_000,
  });
}

export function useRestaurantWithdrawals(restaurantId: string, limit = 100) {
  return useQuery<MyWithdrawalRow[]>({
    queryKey: ['finance-restaurant-withdrawals', restaurantId, limit],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/restaurant/${restaurantId}/withdrawals`, {
        params: { limit },
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!restaurantId,
    staleTime: 30_000,
  });
}
