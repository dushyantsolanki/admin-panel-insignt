import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuthor extends Document {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  gradient: string;
  location: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  joined: string;
  totalPost: number;
  status: "active" | "inactive";
  password?: string;
  email: string;
}

const AuthorSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: { type: String },
    gradient: { type: String },
    location: { type: String },
    social: {
      twitter: { type: String },
      linkedin: { type: String },
      github: { type: String },
      website: { type: String },
    },
    totalPost: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true }
  },
  { timestamps: true }
);

const Author: Model<IAuthor> = mongoose.models.Author || mongoose.model<IAuthor>('Author', AuthorSchema);

export default Author;
