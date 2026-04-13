import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  status: 'unread' | 'read' | 'replied';
  senderAvatarSeed: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema(
  {
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
    },
  },
  {
    timestamps: true // This creates createdAt and updatedAt automatically, replacing receivedDate
  }
);


const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
