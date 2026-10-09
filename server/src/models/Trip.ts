import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const destinationDetailSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    formattedAddress: { type: String, trim: true, maxlength: 250 },
    city: { type: String, trim: true, maxlength: 120 },
    region: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    providerId: { type: String, trim: true, maxlength: 120 },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
  },
  { _id: false },
);

const tripSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    destination: { type: destinationDetailSchema, default: null },
    destinationName: { type: String, required: true, trim: true, maxlength: 120 },
    destinationCountry: { type: String, trim: true, maxlength: 120, default: null },
    destinationCoordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    // Calendar dates are kept as YYYY-MM-DD strings to preserve the intended travel day.
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    travelerCount: { type: Number, required: true, min: 1, max: 30 },
    budget: { type: Number, required: true, min: 0, max: 100_000_000 },
    currency: { type: String, required: true, enum: ['INR', 'USD', 'EUR', 'GBP'] },
    travelStyle: {
      type: String,
      required: true,
      enum: ['budget', 'balanced', 'comfort', 'adventure', 'family', 'backpacking'],
    },
    interests: {
      type: [String],
      default: [],
      enum: [
        'nature',
        'food',
        'adventure',
        'history',
        'shopping',
        'photography',
        'nightlife',
        'family',
        'culture',
      ],
    },
    status: {
      type: String,
      enum: ['planning', 'upcoming', 'active', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    tripCode: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  { timestamps: true, versionKey: false },
);

tripSchema.index({ tripCode: 1 }, { unique: true, sparse: true });
tripSchema.index({ owner: 1, startDate: 1 });
tripSchema.index({ owner: 1, status: 1 });

export type TripRecord = InferSchemaType<typeof tripSchema>;
export const Trip: mongoose.Model<TripRecord> =
  (mongoose.models.Trip as mongoose.Model<TripRecord> | undefined) ??
  mongoose.model<TripRecord>('Trip', tripSchema);
