import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './apiClient';
import type {
  CreateExpensePayload,
  Expense,
  ExpenseSummary,
} from '../types/expense';

export async function fetchTripExpenses(tripId: string): Promise<{
  expenses: Expense[];
  summary: ExpenseSummary;
}> {
  return apiRequest<{ expenses: Expense[]; summary: ExpenseSummary }>(
    `/trips/${tripId}/expenses`,
  );
}

export async function createExpense(
  tripId: string,
  payload: CreateExpensePayload,
): Promise<{ expense: Expense }> {
  return apiRequest<{ expense: Expense }>(`/trips/${tripId}/expenses`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  tripId: string,
  expenseId: string,
  payload: Partial<CreateExpensePayload>,
): Promise<{ expense: Expense }> {
  return apiRequest<{ expense: Expense }>(
    `/trips/${tripId}/expenses/${expenseId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteExpense(
  tripId: string,
  expenseId: string,
): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(
    `/trips/${tripId}/expenses/${expenseId}`,
    {
      method: 'DELETE',
    },
  );
}

export function useTripExpenses(tripId: string) {
  return useQuery({
    queryKey: ['trip-expenses', tripId],
    queryFn: () => fetchTripExpenses(tripId),
    enabled: Boolean(tripId),
  });
}

export function useCreateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpensePayload) => createExpense(tripId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-expenses', tripId] });
    },
  });
}

export function useUpdateExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: string;
      payload: Partial<CreateExpensePayload>;
    }) => updateExpense(tripId, expenseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-expenses', tripId] });
    },
  });
}

export function useDeleteExpense(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(tripId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-expenses', tripId] });
    },
  });
}
