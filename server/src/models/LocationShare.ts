import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const locationSnapshotSchema = new Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracyMeters: { type: Number, min: 0, default: null },
    address: { type: String, trim: true, maxlength: 200, default: null },
  },
  { _id: false },
);

const locationShareSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'EmergencySession',
      default: null,
    },
    location: {
      type: locationSnapshotSchema,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Emergency SOS location snapshot',
    },
    durationMinutes: {
      type: Number,
      required: true,
      enum: [30, 60, 240],
      default: 60,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

locationShareSchema.index({ expiresAt: 1, revokedAt: 1 });

export type LocationShareRecord = InferSchemaType<typeof locationShareSchema>;
export const LocationShare: mongoose.Model<LocationShareRecord> =
  (mongoose.models.LocationShare as mongoose.Model<LocationShareRecord> | undefined) ??
  mongoose.model<LocationShareRecord>('LocationShare', locationShareSchema);
