import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMedia extends Document {
  name: string;
  type: "image" | "video" | "audio";
  url: string;
  size: string;
  starred: boolean;
  r2Key?: string;
  storageProvider: "cloudflare_r2";
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["image", "video", "audio"],
      required: true,
    },
    url: { type: String, required: true },
    size: { type: String }, // e.g., "2.4 MB"
    starred: { type: Boolean, default: false },
    r2Key: { type: String },
    storageProvider: { type: String, default: "cloudflare_r2" },
  },
  {
    timestamps: true,
  }
);

const Media: Model<IMedia> =
  mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

export default Media;
