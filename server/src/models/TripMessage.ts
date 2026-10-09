import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const tripMessageSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    type: {
      type: String,
      enum: ['chat', 'announcement', 'alert', 'system'],
      required: true,
      default: 'chat',
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false },
);

tripMessageSchema.index({ trip: 1, createdAt: -1 });
tripMessageSchema.index({ trip: 1, pinned: -1 });

export type TripMessageRecord = InferSchemaType<typeof tripMessageSchema>;
export const TripMessage: mongoose.Model<TripMessageRecord> =
  (mongoose.models.TripMessage as mongoose.Model<TripMessageRecord> | undefined) ??
  mongoose.model<TripMessageRecord>('TripMessage', tripMessageSchema);
