import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  name: string;
  type: 'image' | 'video';
  url: string;
  size: string;
  starred: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    url: { type: String, required: true },
    size: { type: String }, // e.g., "2.4 MB"
    starred: { type: Boolean, default: false },
  },
  { 
    timestamps: true 
  }
);

const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
