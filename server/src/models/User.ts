import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const travelPreferencesSchema = new Schema(
  {
    travelStyle: {
      type: String,
      enum: ['adventure', 'culture', 'relaxation', 'nature', 'food', 'mixed'],
      default: 'mixed',
    },
    favoriteActivities: { type: [String], default: [] },
    budgetPreference: {
      type: String,
      enum: ['budget', 'moderate', 'premium', 'flexible'],
      default: 'moderate',
    },
    dietaryPreferences: { type: [String], default: [] },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    profilePhoto: { type: String, default: null, maxlength: 2048 },
    language: { type: String, required: true, default: 'en', maxlength: 35 },
    travelPreferences: { type: travelPreferencesSchema, default: () => ({}) },
  },
  { timestamps: true, versionKey: false },
);

export type UserRecord = InferSchemaType<typeof userSchema>;
export const User: mongoose.Model<UserRecord> =
  (mongoose.models.User as mongoose.Model<UserRecord> | undefined) ??
  mongoose.model<UserRecord>('User', userSchema);
