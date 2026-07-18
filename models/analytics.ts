import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  viewId: string;
  visitorId: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  os?: string;
  language?: string;
  postSlug?: string;
  timeOnPage: number; // in seconds
  completedRead: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  timestamp: Date;
}

const AnalyticsEventSchema: Schema = new Schema(
  {
    viewId: { type: String, required: true, unique: true, index: true },
    visitorId: { type: String, required: true, index: true },
    path: { type: String, required: true, index: true },
    referrer: { type: String },
    userAgent: { type: String },
    deviceType: { 
      type: String, 
      enum: ['desktop', 'mobile', 'tablet'], 
      default: 'desktop',
      index: true 
    },
    browser: { type: String, index: true },
    os: { type: String, index: true },
    language: { type: String },
    postSlug: { type: String, index: true },
    timeOnPage: { type: Number, default: 0 },
    completedRead: { type: Boolean, default: false },
    utmSource: { type: String, index: true },
    utmMedium: { type: String },
    utmCampaign: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

const AnalyticsEvent: Model<IAnalyticsEvent> = mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
