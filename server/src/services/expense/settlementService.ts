export interface ParticipantUser {
  _id: string;
  name: string;
  email?: string;
}

export interface SettlementExpenseItem {
  amount: number;
  currency: string;
  exchangeRate?: number;
  convertedAmount?: number | null;
  paidBy: string; // userId string
  splitMethod: 'equal' | 'custom';
  participants: Array<{
    user: string; // userId string
    shareAmount: number;
  }>;
}

export interface MemberBalanceSummary {
  userId: string;
  name: string;
  email?: string;
  paidTotal: number;
  owedTotal: number;
  netBalance: number; // positive = owed money, negative = owes money
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

export interface SettlementCalculationResult {
  totalExpense: number;
  currency: string;
  memberBalances: MemberBalanceSummary[];
  settlements: SettlementTransfer[];
}

export function calculateTripSettlement(
  expenses: SettlementExpenseItem[],
  members: ParticipantUser[],
  tripBaseCurrency: string,
): SettlementCalculationResult {
  const memberMap = new Map<string, ParticipantUser>();
  for (const m of members) {
    memberMap.set(m._id.toString(), m);
  }

  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();

  for (const m of members) {
    paidMap.set(m._id.toString(), 0);
    owedMap.set(m._id.toString(), 0);
  }

  let totalTripExpense = 0;

  for (const expense of expenses) {
    // Determine effective amount in trip base currency
    const effectiveAmount =
      typeof expense.convertedAmount === 'number' && expense.convertedAmount > 0
        ? expense.convertedAmount
        : expense.amount * (expense.exchangeRate ?? 1);

    totalTripExpense += effectiveAmount;

    // Credit the payer
    const payerId = expense.paidBy.toString();
    const currentPaid = paidMap.get(payerId) ?? 0;
    paidMap.set(payerId, currentPaid + effectiveAmount);

    // Debit the participants
    if (expense.participants && expense.participants.length > 0) {
      for (const part of expense.participants) {
        const participantId = part.user.toString();
        // Convert share amount if necessary
        const rate = expense.exchangeRate ?? 1;
        const shareInTripCurrency = part.shareAmount * rate;
        const currentOwed = owedMap.get(participantId) ?? 0;
        owedMap.set(participantId, currentOwed + shareInTripCurrency);
      }
    } else {
      // If no explicit participants specified, distribute equally among all trip members
      const activeMemberIds = members.map((m) => m._id.toString());
      const sharePerPerson = activeMemberIds.length > 0 ? effectiveAmount / activeMemberIds.length : effectiveAmount;
      for (const mId of activeMemberIds) {
        const currentOwed = owedMap.get(mId) ?? 0;
        owedMap.set(mId, currentOwed + sharePerPerson);
      }
    }
  }

  // Calculate net balances
  const allUserIds = Array.from(new Set([...members.map((m) => m._id.toString()), ...paidMap.keys(), ...owedMap.keys()]));
  const memberBalances: MemberBalanceSummary[] = allUserIds.map((uId) => {
    const user = memberMap.get(uId) ?? { _id: uId, name: 'Traveler' };
    const paid = Number((paidMap.get(uId) ?? 0).toFixed(2));
    const owed = Number((owedMap.get(uId) ?? 0).toFixed(2));
    const net = Number((paid - owed).toFixed(2));
    return {
      userId: uId,
      name: user.name,
      email: user.email,
      paidTotal: paid,
      owedTotal: owed,
      netBalance: net,
    };
  });

  // Deterministic settlement algorithm
  const debtors: Array<{ userId: string; name: string; amount: number }> = [];
  const creditors: Array<{ userId: string; name: string; amount: number }> = [];

  for (const b of memberBalances) {
    if (b.netBalance < -0.01) {
      debtors.push({ userId: b.userId, name: b.name, amount: -b.netBalance });
    } else if (b.netBalance > 0.01) {
      creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
    }
  }

  // Sort descending by amount for greedy minimal transactions
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementTransfer[] = [];
  let dIndex = 0;
  let cIndex = 0;

  while (dIndex < debtors.length && cIndex < creditors.length) {
    const debtor = debtors[dIndex]!;
    const creditor = creditors[cIndex]!;
    const settleAmount = Number(Math.min(debtor.amount, creditor.amount).toFixed(2));

    if (settleAmount > 0.01) {
      settlements.push({
        from: { userId: debtor.userId, name: debtor.name },
        to: { userId: creditor.userId, name: creditor.name },
        amount: settleAmount,
        currency: tripBaseCurrency,
      });
    }

    debtor.amount = Number((debtor.amount - settleAmount).toFixed(2));
    creditor.amount = Number((creditor.amount - settleAmount).toFixed(2));

    if (debtor.amount <= 0.01) dIndex++;
    if (creditor.amount <= 0.01) cIndex++;
  }

  return {
    totalExpense: Number(totalTripExpense.toFixed(2)),
    currency: tripBaseCurrency,
    memberBalances,
    settlements,
  };
}
