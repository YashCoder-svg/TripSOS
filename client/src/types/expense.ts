export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transport'
  | 'activities'
  | 'shopping'
  | 'medical'
  | 'other';

export type ExpenseCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface ExpenseParticipant {
  user: {
    _id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  };
  shareAmount: number;
}

export interface Expense {
  _id: string;
  trip: string;
  paidBy: {
    _id: string;
    name: string;
    email?: string;
    profilePhoto?: string;
  };
  amount: number;
  currency: ExpenseCurrency;
  description: string;
  category: ExpenseCategory;
  date: string;
  splitMethod: 'equal' | 'custom';
  participants: ExpenseParticipant[];
  notes?: string;
  exchangeRate?: number;
  convertedAmount?: number | null;
  exchangeRateSource?: string | null;
  createdAt: string;
}

export interface MemberBalanceSummary {
  userId: string;
  name: string;
  email?: string;
  paidTotal: number;
  owedTotal: number;
  netBalance: number;
}

export interface SettlementTransfer {
  from: {
    userId: string;
    name: string;
  };
  to: {
    userId: string;
    name: string;
  };
  amount: number;
  currency: string;
}

export interface ExpenseSummary {
  totalExpense: number;
  currency: string;
  memberBalances: MemberBalanceSummary[];
  settlements: SettlementTransfer[];
}

export interface CreateExpensePayload {
  amount: number;
  currency: ExpenseCurrency;
  description: string;
  category: ExpenseCategory;
  date: string;
  splitMethod?: 'equal' | 'custom';
  participants?: Array<{ user: string; shareAmount?: number }>;
  notes?: string;
}
