import mongoose from 'mongoose';
import Author from '../models/author';
import Category from '../models/category';
import Post from '../models/post';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Attempt to load MONGODB_URI from .env.local
let MONGODB_URI = "mongodb://localhost:27017/modern-blog";

try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match && match[1]) {
      MONGODB_URI = match[1].trim();
    }
  }
} catch (e) {
  console.log('Could not read .env.local, using default URI');
}

const titles = [
  "Understanding the Power of Next.js 15",
  "Tailwind CSS: Beyond the Basics",
  "State Management in 2024: From Redux to Zustand",
  "The Rise of Server Components",
  "Optimizing Web Performance for Core Web Vitals",
  "A Deep Dive into TypeScript Generics",
  "Mastering Framer Motion for Premium Animations",
  "The Future of Web Development with AI",
  "Building Scalable Microservices with Node.js",
  "Effective SEO Strategies for Developers",
  "The Art of Minimalist UI Design",
  "Responsive Design Patterns that Work",
  "Exploring the New Features in React 19",
  "How to Build a High-Performance Blog",
  "Cybersecurity Best Practices for Web Apps"
];

const adjectives = ["Revolutionary", "Advanced", "Comprehensive", "Essential", "Modern", "Dynamic", "Scalable", "Robust", "Interactive"];
const subjects = ["Architecture", "Infrastructure", "Ecosystem", "Paradigm", "Workflow", "Interface", "Database", "Security"];

// Simple encryption helper to match the app's logic
function encrypt(text: string): string {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'antigravity-author-secret-key-32';
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    return text;
  }
}

async function seed() {
  try {
    console.log('Connecting to database:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    console.log('Checking/Creating authors...');
    const authorData = [
      { name: "John Doe", role: "Full Stack Developer", email: "john@example.com", avatar: "https://i.pravatar.cc/150?u=john" },
      { name: "Jane Smith", role: "UI/UX Designer", email: "jane@example.com", avatar: "https://i.pravatar.cc/150?u=jane" },
      { name: "Alex Rivera", role: "DevOps Engineer", email: "alex@example.com", avatar: "https://i.pravatar.cc/150?u=alex" },
      { name: "Sarah Chen", role: "Senior Content Strategist", email: "sarah@example.com", avatar: "https://i.pravatar.cc/150?u=sarah" },
      { name: "Michael Ross", role: "Security Architect", email: "michael@example.com", avatar: "https://i.pravatar.cc/150?u=michael" }
    ];

    const authors = [];
    for (const data of authorData) {
      const author = await Author.findOneAndUpdate(
        { email: data.email },
        {
          ...data,
          bio: `Experienced ${data.role} with a passion for building high-quality digital products.`,
          password: encrypt('password123'),
          status: 'active',
          gradient: 'from-blue-500 to-purple-600',
          location: 'Remote',
          joined: new Date().toISOString()
        },
        { upsert: true, new: true }
      );
      authors.push(author);
    }

    console.log('Checking/Creating categories...');
    const categoryData = [
      { name: 'Engineering', slug: 'engineering', color: '#3b82f6' },
      { name: 'Design', slug: 'design', color: '#ec4899' },
      { name: 'Product', slug: 'product', color: '#10b981' },
      { name: 'Culture', slug: 'culture', color: '#f59e0b' },
      { name: 'Security', slug: 'security', color: '#6366f1' },
      { name: 'AI & Data', slug: 'ai-data', color: '#8b5cf6' }
    ];

    const categories = [];
    for (const data of categoryData) {
      const category = await Category.findOneAndUpdate(
        { slug: data.slug },
        { ...data, description: `Latest insights and trends in ${data.name}.`, status: 'active' },
        { upsert: true, new: true }
      );
      categories.push(category);
    }

    console.log('Generating 500 posts...');
    
    // Reset posts for a clean test? No, let's just append if needed or let user decide.
    // To make it easy, we'll just create 500 new ones.
    
    for (let i = 1; i <= 500; i++) {
      const randomTitle = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${subjects[Math.floor(Math.random() * subjects.length)]}: ${titles[Math.floor(Math.random() * titles.length)]}`;
      const slug = `${randomTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}-${Math.random().toString(36).substring(7)}`;
      const author = authors[Math.floor(Math.random() * authors.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];

      const post = new Post({
        title: randomTitle,
        slug,
        content: `
          <p>In the world of modern web development, <strong>${randomTitle}</strong> represents a significant shift in how we approach digital experiences.</p>
          <h2>The Core Principles</h2>
          <p>Developing a robust ${subjects[Math.floor(Math.random() * subjects.length)]} requires a deep understanding of current trends and user expectations. By leveraging tools like Next.js and Tailwind CSS, developers can create lightning-fast applications that look stunning on any device.</p>
          <blockquote>"The best code is the code that's easy to read and even easier to maintain."</blockquote>
          <h3>Key Features</h3>
          <ul>
            <li>High performance and SEO optimization</li>
            <li>Cloud-native architecture and scalability</li>
            <li>User-centric design and accessibility</li>
          </ul>
          <p>As we look towards the future, the integration of AI and more advanced developer tools will only continue to accelerate this progress.</p>
        `,
        excerpt: `Discover the essential strategies for ${randomTitle} in this comprehensive guide for modern developers.`,
        category: category._id,
        author: author._id,
        status: 'published',
        image: `https://picsum.photos/seed/${slug}/1200/630`,
        readTime: `${Math.floor(Math.random() * 8) + 4} min read`,
        seo: {
          metaTitle: `${randomTitle} | Modern Blog`,
          metaDescription: `Everything you need to know about ${randomTitle} and its impact on the industry.`,
          keywords: 'tech, innovation, webdev',
        },
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
      });
      
      await post.save();

      if (i % 50 === 0) {
        console.log(`Successfully saved ${i} posts...`);
      }
    }

    console.log('Seeding completed successfully! Created 500 posts and established relationships.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
