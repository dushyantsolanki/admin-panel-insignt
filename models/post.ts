import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPost extends Document {
  title: string;
  slug: string;
  content: string; // HTML Content
  excerpt: string;
  category: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'scheduled';
  image: string;
  videoUrl?: string;
  views: number;
  readTime: string;
  seo: {
    focusKeyword?: string;
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  isHero: boolean;
  isFeatured: boolean;
  date: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    content: { type: String, required: true }, // Stores HTML content
    excerpt: { type: String },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'Author', required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'scheduled'],
      default: 'draft',
    },
    image: { type: String }, // Featured Image URL
    videoUrl: { type: String }, // Featured Video URL
    readTime: { type: String },
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: { type: String },
      ogDescription: { type: String },
    },
    isHero: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Middleware to update Author and Category totalPost counts
PostSchema.post('save', async function (doc) {
  try {
    const Author = mongoose.model('Author');
    const Category = mongoose.model('Category');

    await Promise.all([
      Author.findByIdAndUpdate(doc.author, { $inc: { totalPost: 1 } }),
      Category.findByIdAndUpdate(doc.category, { $inc: { totalPost: 1 } })
    ]);
  } catch (error) {
    console.error('Error updating counts after save:', error);
  }
});

PostSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    try {
      const Author = mongoose.model('Author');
      const Category = mongoose.model('Category');

      await Promise.all([
        Author.findByIdAndUpdate(doc.author, { $inc: { totalPost: -1 } }),
        Category.findByIdAndUpdate(doc.category, { $inc: { totalPost: -1 } })
      ]);
    } catch (error) {
      console.error('Error updating counts after delete:', error);
    }
  }
});

PostSchema.pre('findOneAndUpdate', async function () {
  try {
    const query = this.getQuery();
    const docToUpdate = await this.model.findOne(query);
    if (docToUpdate) {
      (this as any)._originalAuthor = docToUpdate.author;
      (this as any)._originalCategory = docToUpdate.category;
    }
  } catch (error) {
    console.error('Error in pre findOneAndUpdate hook:', error);
  }
});

PostSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    try {
      const Author = mongoose.model('Author');
      const Category = mongoose.model('Category');

      const originalAuthor = (this as any)._originalAuthor;
      const originalCategory = (this as any)._originalCategory;

      const updates = [];

      if (originalAuthor && originalAuthor.toString() !== doc.author.toString()) {
        updates.push(Author.findByIdAndUpdate(originalAuthor, { $inc: { totalPost: -1 } }));
        updates.push(Author.findByIdAndUpdate(doc.author, { $inc: { totalPost: 1 } }));
      }

      if (originalCategory && originalCategory.toString() !== doc.category.toString()) {
        updates.push(Category.findByIdAndUpdate(originalCategory, { $inc: { totalPost: -1 } }));
        updates.push(Category.findByIdAndUpdate(doc.category, { $inc: { totalPost: 1 } }));
      }

      if (updates.length > 0) {
        await Promise.all(updates);
      }
    } catch (error) {
      console.error('Error updating counts after update:', error);
    }
  }
});

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);

export default Post;
