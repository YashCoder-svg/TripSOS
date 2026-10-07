import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const emergencyCategories = [
  'medical',
  'police',
  'fire',
  'accident',
  'lost',
  'general',
] as const;

export type EmergencyCategory = (typeof emergencyCategories)[number];

const emergencySessionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    type: {
      type: String,
      enum: emergencyCategories,
      required: true,
      default: 'general',
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'cancelled'],
      default: 'active',
      index: true,
    },
    locationSnapshot: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
      accuracyMeters: { type: Number, min: 0 },
    },
    startedAt: { type: Date, default: Date.now, required: true },
    endedAt: { type: Date, default: null },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true, versionKey: false },
);

emergencySessionSchema.index({ user: 1, status: 1 });
emergencySessionSchema.index({ startedAt: -1 });

export type EmergencySessionRecord = InferSchemaType<typeof emergencySessionSchema>;
export const EmergencySession: mongoose.Model<EmergencySessionRecord> =
  (mongoose.models.EmergencySession as mongoose.Model<EmergencySessionRecord> | undefined) ??
  mongoose.model<EmergencySessionRecord>('EmergencySession', emergencySessionSchema);
