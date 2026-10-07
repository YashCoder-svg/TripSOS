import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const tripMemberSchema = new Schema(
  {
    trip: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    invitedEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      required: true,
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'declined'],
      required: true,
      default: 'pending',
      index: true,
    },
    inviteToken: {
      type: String,
      default: null,
      index: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    joinedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

tripMemberSchema.index({ trip: 1, user: 1 }, { unique: true, sparse: true });
tripMemberSchema.index({ trip: 1, inviteToken: 1 });

export type TripMemberRecord = InferSchemaType<typeof tripMemberSchema>;
export const TripMember: mongoose.Model<TripMemberRecord> =
  (mongoose.models.TripMember as mongoose.Model<TripMemberRecord> | undefined) ??
  mongoose.model<TripMemberRecord>('TripMember', tripMemberSchema);
