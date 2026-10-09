import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const savedPlaceSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: 250,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    providerId: {
      type: String,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    userNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  { timestamps: true, versionKey: false },
);

savedPlaceSchema.index({ user: 1, createdAt: -1 });
savedPlaceSchema.index({ trip: 1, createdAt: -1 });
savedPlaceSchema.index({ user: 1, providerId: 1 });

export type SavedPlaceRecord = InferSchemaType<typeof savedPlaceSchema>;
export const SavedPlace: mongoose.Model<SavedPlaceRecord> =
  (mongoose.models.SavedPlace as mongoose.Model<SavedPlaceRecord> | undefined) ??
  mongoose.model<SavedPlaceRecord>('SavedPlace', savedPlaceSchema);
