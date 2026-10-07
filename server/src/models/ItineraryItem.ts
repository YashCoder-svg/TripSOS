import mongoose, { Schema, type InferSchemaType } from 'mongoose';

export const itineraryCategories = [
  'activity',
  'food',
  'sightseeing',
  'travel',
  'lodging',
  'other',
] as const;

export type ItineraryCategory = (typeof itineraryCategories)[number];

const itineraryItemSchema = new Schema(
  {
    trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, trim: true, default: null }, // e.g. "09:00"
    endTime: { type: String, trim: true, default: null }, // e.g. "11:30"
    location: { type: String, trim: true, maxlength: 200, default: null },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    placeProviderId: { type: String, trim: true, maxlength: 150, default: null },
    category: {
      type: String,
      enum: itineraryCategories,
      default: 'activity',
    },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['planned', 'completed'],
      default: 'planned',
    },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

itineraryItemSchema.index({ trip: 1, date: 1, order: 1 });

export type ItineraryItemRecord = InferSchemaType<typeof itineraryItemSchema>;
export const ItineraryItem: mongoose.Model<ItineraryItemRecord> =
  (mongoose.models.ItineraryItem as mongoose.Model<ItineraryItemRecord> | undefined) ??
  mongoose.model<ItineraryItemRecord>('ItineraryItem', itineraryItemSchema);
