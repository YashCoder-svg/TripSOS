import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const emergencyContactSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 16 },
    relationship: {
      type: String,
      required: true,
      enum: ['family', 'friend', 'partner', 'colleague', 'other'],
    },
    isPrimary: { type: Boolean, default: false, required: true },
  },
  { timestamps: true, versionKey: false },
);

emergencyContactSchema.index(
  { userId: 1, isPrimary: 1 },
  { unique: true, partialFilterExpression: { isPrimary: true } },
);

export type EmergencyContactRecord = InferSchemaType<typeof emergencyContactSchema>;
export const EmergencyContact: mongoose.Model<EmergencyContactRecord> =
  (mongoose.models.EmergencyContact as mongoose.Model<EmergencyContactRecord> | undefined) ??
  mongoose.model<EmergencyContactRecord>('EmergencyContact', emergencyContactSchema);
