import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubscriber extends Document {
  email: string;
  status: 'active' | 'unsubscribed' | 'pending';
  token: string; // Used for secure verification or single-click unsubscribe links
  source: string; // e.g., 'footer', 'popup', etc.
  subscribedAt: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed', 'pending'],
      default: 'active', // Set default to active for single opt-in, or pending if double opt-in is configured
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    },
    source: {
      type: String,
      default: 'footer',
    },
    unsubscribedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Subscriber: Model<ISubscriber> =
  mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema);

export default Subscriber;
