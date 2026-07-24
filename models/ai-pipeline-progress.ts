import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAiPipelineProgressLog {
  message: string;
  step: string;
  timestamp: Date;
}

export interface IAiPipelineProgress extends Document {
  jobId: string;
  topic: string;
  category: string;
  status: "queued" | "processing" | "generating_outline" | "writing_content" | "generating_seo" | "completed" | "failed";
  progress: number; // 0 to 100
  currentStep: string;
  logs: IAiPipelineProgressLog[];
  postSlug?: string;
  postId?: mongoose.Types.ObjectId;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AiPipelineProgressSchema: Schema = new Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    topic: { type: String, required: true },
    category: { type: String, default: "General" },
    status: {
      type: String,
      enum: ["queued", "processing", "generating_outline", "writing_content", "generating_seo", "completed", "failed"],
      default: "queued",
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    currentStep: { type: String, default: "Job Queued" },
    logs: [
      {
        message: { type: String, required: true },
        step: { type: String, default: "info" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    postSlug: { type: String },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    error: { type: String },
  },
  { timestamps: true }
);

const AiPipelineProgress: Model<IAiPipelineProgress> =
  mongoose.models.AiPipelineProgress ||
  mongoose.model<IAiPipelineProgress>("AiPipelineProgress", AiPipelineProgressSchema);

export default AiPipelineProgress;
