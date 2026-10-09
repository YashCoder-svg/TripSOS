import mongoose from 'mongoose';
import { Router, type Request } from 'express';
import { Expense } from '../models/Expense.js';
import { TripMember } from '../models/TripMember.js';
import { exchangeService } from '../services/exchange/exchangeService.js';
import {
  calculateTripSettlement,
  type ParticipantUser,
  type SettlementExpenseItem,
} from '../services/expense/settlementService.js';
import { AppError } from '../types/errors.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/expenseValidators.js';
import { assertTripAccess } from './tripAuthHelper.js';

export const expenseRoutes = Router({ mergeParams: true });

function getParams(req: Request): { tripId: string } {
  return req.params as unknown as { tripId: string };
}

// GET /api/trips/:tripId/expenses
expenseRoutes.get('/', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { trip } = await assertTripAccess(tripId, req.auth!.userId);

    const expenses = await Expense.find({ trip: trip._id })
      .populate('paidBy', 'name email profilePhoto')
      .populate('participants.user', 'name email profilePhoto')
      .sort({ date: -1, createdAt: -1 });

    // Collect all active trip members + owner for balances calculation
    const activeMembers = await TripMember.find({ trip: trip._id, status: 'active' }).populate(
      'user',
      'name email',
    );

    const memberMap = new Map<string, ParticipantUser>();
    for (const m of activeMembers) {
      if (m.user && typeof m.user === 'object' && '_id' in m.user) {
        const u = m.user as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          email?: string;
        };
        memberMap.set(u._id.toString(), {
          _id: u._id.toString(),
          name: u.name,
          email: u.email,
        });
      }
    }

    const participantList: ParticipantUser[] = Array.from(memberMap.values());

    // Prepare items for settlement calculation
    const settlementItems: SettlementExpenseItem[] = expenses.map((e) => ({
      amount: e.amount,
      currency: e.currency,
      exchangeRate: e.exchangeRate,
      convertedAmount: e.convertedAmount,
      paidBy:
        typeof e.paidBy === 'object' && e.paidBy !== null && '_id' in e.paidBy
          ? String((e.paidBy as { _id: unknown })._id)
          : String(e.paidBy),
      splitMethod: e.splitMethod,
      participants: e.participants.map((p) => ({
        user:
          typeof p.user === 'object' && p.user !== null && '_id' in p.user
            ? String((p.user as { _id: unknown })._id)
            : String(p.user),
        shareAmount: p.shareAmount,
      })),
    }));

    const settlement = calculateTripSettlement(settlementItems, participantList, trip.currency);

    res.json({
      success: true,
      data: {
        expenses,
        summary: {
          totalExpense: settlement.totalExpense,
          currency: trip.currency,
          memberBalances: settlement.memberBalances,
          settlements: settlement.settlements,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips/:tripId/expenses
expenseRoutes.post('/', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { trip } = await assertTripAccess(tripId, req.auth!.userId);
    const input = createExpenseSchema.parse(req.body);

    // Verified exchange rate calculation
    let exchangeRate = 1.0;
    let convertedAmount = input.amount;
    let exchangeRateSource = 'Trip base currency';

    if (input.currency.toUpperCase() !== trip.currency.toUpperCase()) {
      try {
        const rateInfo = await exchangeService.getExchangeRate(input.currency, trip.currency);
        exchangeRate = rateInfo.rate;
        convertedAmount = Number((input.amount * rateInfo.rate).toFixed(2));
        exchangeRateSource = rateInfo.source;
      } catch {
        // Safe fallback without hardcoded rates: record in original currency
        exchangeRate = 1.0;
        convertedAmount = input.amount;
        exchangeRateSource = 'Live conversion unavailable; recorded in original currency';
      }
    }

    // Determine participants and shares
    let participants = input.participants ?? [];

    if (participants.length === 0) {
      // Default: include all active members + current user
      const activeMembers = await TripMember.find({ trip: trip._id, status: 'active' });
      const userIds = Array.from(
        new Set([
          req.auth!.userId,
          trip.owner.toString(),
          ...activeMembers.filter((m) => m.user).map((m) => m.user!.toString()),
        ]),
      );

      const count = userIds.length;
      const share = Number((input.amount / count).toFixed(2));
      participants = userIds.map((u) => ({
        user: u,
        shareAmount: share,
      }));
    } else if (input.splitMethod === 'percentage') {
      const totalPct = participants.reduce((sum, p) => sum + (p.percentage ?? 0), 0);
      if (Math.abs(totalPct - 100) > 0.5) {
        throw new AppError(400, 'INVALID_PERCENTAGE', 'Participant percentages must add up to 100%.');
      }
      participants = participants.map((p) => ({
        user: p.user,
        shareAmount: Number(((input.amount * (p.percentage ?? 0)) / 100).toFixed(2)),
        percentage: p.percentage,
      }));
    } else if (input.splitMethod === 'equal') {
      const share = Number((input.amount / participants.length).toFixed(2));
      participants = participants.map((p) => ({
        user: p.user,
        shareAmount: share,
      }));
    }

    const expense = await Expense.create({
      trip: trip._id,
      paidBy: req.auth!.userId,
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      category: input.category,
      date: input.date,
      splitMethod: input.splitMethod,
      participants: participants.map((p) => ({
        user: new mongoose.Types.ObjectId(p.user),
        shareAmount: p.shareAmount ?? 0,
        percentage: p.percentage ?? null,
      })),
      notes: input.notes,
      exchangeRate,
      convertedAmount,
      exchangeRateSource,
    });

    await expense.populate('paidBy', 'name email profilePhoto');
    await expense.populate('participants.user', 'name email profilePhoto');

    res.status(201).json({
      success: true,
      data: {
        expense,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/trips/:tripId/expenses/:expenseId
expenseRoutes.patch('/:expenseId', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { expenseId } = req.params;
    const { trip, role } = await assertTripAccess(tripId, req.auth!.userId);

    if (!expenseId || !mongoose.isValidObjectId(expenseId)) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found.');
    }

    const expense = await Expense.findOne({ _id: expenseId, trip: trip._id });
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found.');
    }

    // Only expense author or trip owner can edit
    if (expense.paidBy.toString() !== req.auth!.userId && role !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'You can only edit expenses you created.');
    }

    const input = updateExpenseSchema.parse(req.body);

    if (input.description !== undefined) expense.description = input.description;
    if (input.category !== undefined) expense.category = input.category;
    if (input.date !== undefined) expense.date = input.date;
    if (input.notes !== undefined) expense.notes = input.notes;

    if (input.amount !== undefined || input.currency !== undefined) {
      const nextAmount = input.amount ?? expense.amount;
      const nextCurrency = input.currency ?? expense.currency;
      expense.amount = nextAmount;
      expense.currency = nextCurrency;

      if (nextCurrency.toUpperCase() === trip.currency.toUpperCase()) {
        expense.exchangeRate = 1.0;
        expense.convertedAmount = nextAmount;
        expense.exchangeRateSource = 'Trip base currency';
      } else {
        try {
          const rateInfo = await exchangeService.getExchangeRate(nextCurrency, trip.currency);
          expense.exchangeRate = rateInfo.rate;
          expense.convertedAmount = Number((nextAmount * rateInfo.rate).toFixed(2));
          expense.exchangeRateSource = rateInfo.source;
        } catch {
          expense.exchangeRate = 1.0;
          expense.convertedAmount = nextAmount;
        }
      }
    }

    await expense.save();
    await expense.populate('paidBy', 'name email profilePhoto');
    await expense.populate('participants.user', 'name email profilePhoto');

    res.json({
      success: true,
      data: {
        expense,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trips/:tripId/expenses/:expenseId
expenseRoutes.delete('/:expenseId', async (req, res, next) => {
  try {
    const { tripId } = getParams(req);
    const { expenseId } = req.params;
    const { trip, role } = await assertTripAccess(tripId, req.auth!.userId);

    if (!expenseId || !mongoose.isValidObjectId(expenseId)) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found.');
    }

    const expense = await Expense.findOne({ _id: expenseId, trip: trip._id });
    if (!expense) {
      throw new AppError(404, 'EXPENSE_NOT_FOUND', 'Expense not found.');
    }

    if (expense.paidBy.toString() !== req.auth!.userId && role !== 'owner') {
      throw new AppError(403, 'FORBIDDEN', 'You can only delete expenses you created.');
    }

    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      data: {
        deleted: true,
      },
    });
  } catch (error) {
    next(error);
  }
});
