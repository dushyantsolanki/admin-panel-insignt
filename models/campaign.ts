import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  subject: string;
  content: string; // HTML format newsletter content
  sentBy?: string;  // Name or ID of the author who sent it
  recipientCount: number;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema: Schema = new Schema(
  {
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sentBy: {
      type: String,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'sending', 'sent', 'failed'],
      default: 'sent',
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;
