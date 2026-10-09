import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['trip_invite', 'emergency_alert', 'announcement', 'expense_added', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    linkUrl: {
      type: String,
      trim: true,
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true, versionKey: false },
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export type NotificationRecord = InferSchemaType<typeof notificationSchema>;
export const Notification: mongoose.Model<NotificationRecord> =
  (mongoose.models.Notification as mongoose.Model<NotificationRecord> | undefined) ??
  mongoose.model<NotificationRecord>('Notification', notificationSchema);
