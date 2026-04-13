import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  color: string;
  status: 'active' | 'archived';
  totalPost: number;
  imageUrl: string;
  showOnHome: boolean;
}

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String },
    color: { type: String, default: '#000000' },
    imageUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
    showOnHome: { type: Boolean, default: false },
    totalPost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Category: Model<ICategory> = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
