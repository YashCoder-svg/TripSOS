import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const participantSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shareAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const expenseSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
      max: 100_000_000,
    },
    currency: {
      type: String,
      required: true,
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      enum: ['accommodation', 'food', 'transport', 'activities', 'shopping', 'medical', 'other'],
    },
    date: {
      type: String,
      required: true,
    },
    splitMethod: {
      type: String,
      required: true,
      enum: ['equal', 'custom'],
      default: 'equal',
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    convertedAmount: {
      type: Number,
      default: null,
    },
    exchangeRateSource: {
      type: String,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

expenseSchema.index({ trip: 1, date: -1 });

export type ExpenseRecord = InferSchemaType<typeof expenseSchema>;
export const Expense: mongoose.Model<ExpenseRecord> =
  (mongoose.models.Expense as mongoose.Model<ExpenseRecord> | undefined) ??
  mongoose.model<ExpenseRecord>('Expense', expenseSchema);
