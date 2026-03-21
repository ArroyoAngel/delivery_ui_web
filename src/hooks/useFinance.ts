'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  owner_type: 'shop' | 'rider';
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
  owner_type: 'shop' | 'rider';
  status: string;
  amount: string;
  external_transfer_id: string | null;
  notes: string | null;
  requested_at: string;
  processed_at: string | null;
  shop_id: string | null;
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
  shopId: string | null;
  total_orders: number;
  gross_sales: string;
  net_income: string;
  available_balance: string;
  pending_withdrawals_amount: string;
}

export interface MyBankAccountRow {
  id: string;
  shop_id: string;
  shop_name: string | null;
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

// ── SA: per-shop hooks ──────────────────────────────────────────────────

export interface ShopIncomeSummary {
  shopId: string;
  total_orders: number;
  gross_sales: string;
  net_income: string;
  available_balance: string;
  pending_withdrawals_amount: string;
}

export function useShopIncomeSummary(shopId: string) {
  return useQuery<ShopIncomeSummary>({
    queryKey: ['finance-shop-income', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/shop/${shopId}/income`);
      return data;
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useShopBankAccounts(shopId: string) {
  return useQuery<MyBankAccountRow[]>({
    queryKey: ['finance-shop-bank-accounts', shopId],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/shop/${shopId}/bank-accounts`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useShopWithdrawals(shopId: string, limit = 100) {
  return useQuery<MyWithdrawalRow[]>({
    queryKey: ['finance-shop-withdrawals', shopId, limit],
    queryFn: async () => {
      const { data } = await api.get(`/api/payments/admin/shop/${shopId}/withdrawals`, {
        params: { limit },
      });
      return Array.isArray(data) ? data : [];
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });
}

export function useProcessWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      id: string;
      action: 'completed' | 'rejected';
      externalTransferId?: string;
      notes?: string;
    }) => {
      const { id, ...body } = payload;
      const { data } = await api.put(`/api/payments/admin/withdrawals/${id}/process`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['finance-summary'] });
    },
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { amount: number; bankAccountId: string }) => {
      const { data } = await api.post('/api/payments/my/withdrawal', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance-my-income'] });
      qc.invalidateQueries({ queryKey: ['finance-my-withdrawals'] });
    },
  });
}
