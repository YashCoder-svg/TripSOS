import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const refreshSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, select: false },
    currentJti: { type: String, required: true, select: false },
    previousJti: { type: String, default: null, select: false },
    status: { type: String, enum: ['active', 'revoked'], default: 'active', index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type RefreshSessionRecord = InferSchemaType<typeof refreshSessionSchema>;
export const RefreshSession: mongoose.Model<RefreshSessionRecord> =
  (mongoose.models.RefreshSession as mongoose.Model<RefreshSessionRecord> | undefined) ??
  mongoose.model<RefreshSessionRecord>('RefreshSession', refreshSessionSchema);
