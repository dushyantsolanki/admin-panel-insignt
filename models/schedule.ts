import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISchedule extends Document {
  title: string;
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
  date: string;      // Format: "yyyy-MM-dd"
  status: 'draft' | 'scheduled' | 'published';
  author?: string;
  post?: mongoose.Types.ObjectId; // Reference to the actual Post model
}

const ScheduleSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    date: { type: String, required: true }, // Using string format to match calendar-store.ts logic
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'scheduled',
    },
    author: { type: String },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
  },
  {
    timestamps: true
  }
);

const Schedule: Model<ISchedule> = mongoose.models.Schedule || mongoose.model<ISchedule>('Schedule', ScheduleSchema);

export default Schedule;
