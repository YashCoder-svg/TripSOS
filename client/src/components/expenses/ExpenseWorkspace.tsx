import { useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  Plus,
  Receipt,
  Scale,
  Trash2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useCreateExpense, useDeleteExpense, useTripExpenses } from '../../services/expenseService';
import { useTripMembers } from '../../services/groupService';
import { useOptionalAuth } from '../../store/AuthProvider';
import type { CreateExpensePayload, ExpenseCategory, ExpenseCurrency } from '../../types/expense';
import type { Trip } from '../../types/trip';

export interface ExpenseWorkspaceProps {
  trip: Trip;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  accommodation: 'Accommodation',
  food: 'Food & Dining',
  transport: 'Transport',
  activities: 'Activities & Tours',
  shopping: 'Shopping',
  medical: 'Medical & Health',
  other: 'General',
};

export function ExpenseWorkspace({ trip }: ExpenseWorkspaceProps) {
  const auth = useOptionalAuth();
  const currentUserId = auth?.user?.id;

  const { data, isLoading, error } = useTripExpenses(trip._id);
  const { data: membersData } = useTripMembers(trip._id);
  const createExpenseMutation = useCreateExpense(trip._id);
  const deleteExpenseMutation = useDeleteExpense(trip._id);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<ExpenseCurrency>(trip.currency as ExpenseCurrency);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]!);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const expenses = data?.expenses ?? [];
  const summary = data?.summary;
  const activeMembers = membersData?.members.filter((m) => m.status === 'active') ?? [];

  // Filtered expenses
  const filteredExpenses =
    activeCategoryFilter === 'all'
      ? expenses
      : expenses.filter((e) => e.category === activeCategoryFilter);

  // User's personal balance
  const userBalance = summary?.memberBalances.find((b) => b.userId === currentUserId);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    try {
      const payload: CreateExpensePayload = {
        description: description.trim(),
        amount: parsedAmount,
        currency,
        category,
        date,
        splitMethod,
        notes: notes.trim(),
      };

      await createExpenseMutation.mutateAsync(payload);
      setShowAddModal(false);
      setDescription('');
      setAmount('');
      setNotes('');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to record expense.');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await deleteExpenseMutation.mutateAsync(expenseId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete expense.');
    }
  };

  if (isLoading) {
    return (
      <div className="expenses-loading-state" role="status">
        <span className="auth-spinner" aria-hidden="true" />
        <p>Loading trip expenses and settlements…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="expenses-error-box" role="alert">
        <p>Unable to load expenses. Please try again later.</p>
      </div>
    );
  }

  return (
    <section className="expense-workspace" aria-labelledby="expenses-heading">
      {/* Metrics Row */}
      <div className="expenses-metrics-grid">
        <article className="expense-metric-card">
          <div className="metric-icon-box bg-emerald-500/10 text-emerald-400">
            <Wallet size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">TOTAL TRIP SPENDING</span>
            <span className="metric-value">
              {trip.currency} {summary?.totalExpense.toLocaleString() ?? '0'}
            </span>
          </div>
        </article>

        <article className="expense-metric-card">
          <div className="metric-icon-box bg-sky-500/10 text-sky-400">
            <CreditCard size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">YOU PAID</span>
            <span className="metric-value">
              {trip.currency} {userBalance ? userBalance.paidTotal.toLocaleString() : '0'}
            </span>
          </div>
        </article>

        <article className="expense-metric-card">
          <div className="metric-icon-box bg-purple-500/10 text-purple-400">
            <Scale size={20} />
          </div>
          <div className="metric-info">
            <span className="metric-label">YOUR NET BALANCE</span>
            <div className="metric-balance-row">
              {userBalance && userBalance.netBalance > 0 ? (
                <span className="balance-pill balance-positive">
                  You are owed {trip.currency} {userBalance.netBalance.toLocaleString()}
                </span>
              ) : userBalance && userBalance.netBalance < 0 ? (
                <span className="balance-pill balance-negative">
                  You owe {trip.currency} {Math.abs(userBalance.netBalance).toLocaleString()}
                </span>
              ) : (
                <span className="balance-pill balance-neutral">All settled up</span>
              )}
            </div>
          </div>
        </article>
      </div>

      {/* Settlement Transfers Card */}
      {summary?.settlements && summary.settlements.length > 0 && (
        <section className="settlements-card" aria-label="Settlement instructions">
          <div className="settlements-header">
            <TrendingUp size={18} className="text-emerald-400" />
            <h3>Suggested Settlement Transfers</h3>
          </div>
          <div className="settlements-list">
            {summary.settlements.map((s, idx) => (
              <div key={idx} className="settlement-item">
                <span className="settlement-from">{s.from.name}</span>
                <span className="settlement-arrow">
                  owes <ArrowRight size={14} className="inline mx-1" />
                </span>
                <span className="settlement-to">{s.to.name}</span>
                <span className="settlement-amount">
                  {s.currency} {s.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action Bar & Category Filters */}
      <div className="expenses-action-bar">
        <div className="category-chips">
          <button
            type="button"
            className={`filter-chip ${activeCategoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategoryFilter('all')}
          >
            All Categories ({expenses.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = expenses.filter((e) => e.category === key).length;
            if (count === 0 && activeCategoryFilter !== key) return null;
            return (
              <button
                key={key}
                type="button"
                className={`filter-chip ${activeCategoryFilter === key ? 'active' : ''}`}
                onClick={() => setActiveCategoryFilter(key)}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="add-expense-btn"
          onClick={() => {
            setShowAddModal(true);
            setFormError(null);
          }}
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="expenses-empty-card">
          <Receipt size={32} className="text-slate-500 mb-2" />
          <h3>No expenses recorded yet</h3>
          <p>
            Keep your group budget organized. Add hotels, meals, transport, and split costs evenly.
          </p>
          <button
            type="button"
            className="add-expense-btn mt-4"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} /> Add First Expense
          </button>
        </div>
      ) : (
        <div className="expenses-list">
          {filteredExpenses.map((expense) => {
            const payerName = expense.paidBy?.name ?? 'Traveler';
            const isPayer = expense.paidBy?._id === currentUserId;

            return (
              <article key={expense._id} className="expense-card">
                <div className="expense-card-left">
                  <div className="expense-category-icon">
                    <Receipt size={18} />
                  </div>
                  <div>
                    <h4 className="expense-title">{expense.description}</h4>
                    <div className="expense-meta-row">
                      <span className="expense-payer">
                        Paid by <strong>{isPayer ? 'You' : payerName}</strong>
                      </span>
                      <span>•</span>
                      <span className="expense-date">{expense.date}</span>
                      <span>•</span>
                      <span className="expense-category-pill">
                        {CATEGORY_LABELS[expense.category] ?? expense.category}
                      </span>
                    </div>

                    {expense.exchangeRateSource &&
                      expense.currency.toUpperCase() !== trip.currency.toUpperCase() && (
                        <p className="expense-exchange-note">
                          Converted from {expense.currency} {expense.amount} using{' '}
                          {expense.exchangeRateSource}
                        </p>
                      )}
                  </div>
                </div>

                <div className="expense-card-right">
                  <div className="expense-amount-block">
                    <span className="expense-amount-value">
                      {trip.currency} {(expense.convertedAmount ?? expense.amount).toLocaleString()}
                    </span>
                    {expense.currency !== trip.currency && (
                      <span className="expense-original-amount">
                        ({expense.currency} {expense.amount.toLocaleString()})
                      </span>
                    )}
                  </div>

                  {isPayer && (
                    <button
                      type="button"
                      className="expense-delete-btn"
                      title="Delete expense"
                      aria-label="Delete expense"
                      onClick={() => handleDeleteExpense(expense._id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddModal && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-expense-title"
        >
          <div className="group-modal-card">
            <h3 id="add-expense-title" className="group-modal-title">
              Record an Expense
            </h3>
            <p className="group-modal-desc">
              Log spending for the group. TripSOS automatically calculates balances and minimal
              settlement transfers.
            </p>

            <form onSubmit={handleAddExpense} className="expense-form">
              <label className="form-label">
                Description
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Himalayan Dinner"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input"
                />
              </label>

              <div className="form-row-2">
                <label className="form-label">
                  Amount
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="1500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="form-input"
                  />
                </label>

                <label className="form-label">
                  Currency
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as ExpenseCurrency)}
                    className="form-input"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2">
                <label className="form-label">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="form-input"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-label">
                  Date
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </label>
              </div>

              <label className="form-label">
                Split Method
                <select
                  value={splitMethod}
                  onChange={(e) => setSplitMethod(e.target.value as 'equal' | 'custom')}
                  className="form-input"
                >
                  <option value="equal">
                    Equal Split (across all {activeMembers.length || 1} trip members)
                  </option>
                </select>
              </label>

              <label className="form-label">
                Notes (Optional)
                <input
                  type="text"
                  placeholder="Additional receipt or payment notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </label>

              {formError && <p className="modal-error-text">{formError}</p>}

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? 'Saving…' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
