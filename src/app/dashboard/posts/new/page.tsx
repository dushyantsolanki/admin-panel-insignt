"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { calculateReadTime } from "@/lib/utils";
import {
  type Editor,
  type JSONContent,
  EditorProvider,
  EditorBubbleMenu,
  EditorCharacterCount,
  EditorClearFormatting,
  EditorFloatingMenu,
  EditorFormatBold,
  EditorFormatCode,
  EditorFormatItalic,
  EditorFormatStrike,
  EditorFormatSubscript,
  EditorFormatSuperscript,
  EditorFormatUnderline,
  EditorLinkSelector,
  EditorNodeBulletList,
  EditorNodeCode,
  EditorNodeHeading1,
  EditorNodeHeading2,
  EditorNodeHeading3,
  EditorNodeOrderedList,
  EditorNodeQuote,
  EditorNodeTable,
  EditorNodeTaskList,
  EditorNodeText,
  EditorSelector,
  EditorTableColumnAfter,
  EditorTableColumnBefore,
  EditorTableColumnDelete,
  EditorTableColumnMenu,
  EditorTableDelete,
  EditorTableFix,
  EditorTableGlobalMenu,
  EditorTableHeaderColumnToggle,
  EditorTableHeaderRowToggle,
  EditorTableMenu,
  EditorTableMergeCells,
  EditorTableRowAfter,
  EditorTableRowBefore,
  EditorTableRowDelete,
  EditorTableRowMenu,
  EditorTableSplitCell,
} from "@/components/kibo-ui/editor";
import { TableOfContentsPreview, type TOCItem } from "@/components/custom/table-of-contents-preview";
import { extractHeadingsFromHTML } from "@/lib/toc";
import { gooeyToast } from "goey-toast";

export default function NewPostPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    author: "",
    status: "draft",
    image: "",
    videoUrl: "",
    focusKeyword: "",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    canonicalUrl: "",
    ogImage: "",
    ogTitle: "",
    ogDescription: "",
    readTime: "1 min read",
    isHero: false,
    isFeatured: false,
  });

  const [content, setContent] = useState<JSONContent>({
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [{ type: "text", text: "New Post Title" }],
      },
      { type: "paragraph", content: [{ type: "text", text: "Start writing your story here..." }] },
    ],
  });

  const [htmlContent, setHtmlContent] = useState("");
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    // Fetch categories and authors
    const fetchData = async () => {
      try {
        const [catsRes, authsRes] = await Promise.all([
          fetch("/api/categories?all=true"),
          fetch("/api/authors")
        ]);
        const catsData = await catsRes.json();
        const auths = await authsRes.json();

        setCategories(catsData.categories || []);
        setAuthors(auths);

        // Set defaults if data available
        if (catsData.categories?.length > 0) setFormData(prev => ({ ...prev, category: catsData.categories[0]._id }));
        if (auths.length > 0) setFormData(prev => ({ ...prev, author: auths[0]._id }));
      } catch (error: any) {
        gooeyToast.error('Failed to load data', {
          description: error.message || 'Error fetching categories or authors',
        });
        console.error("Failed to fetch form data:", error);
      }
    };
    fetchData();
  }, []);

  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const json = editor.getJSON();
    const html = editor.getHTML();

    setHtmlContent(html);
    setContent(json);

    // Calculate read time
    const readTime = calculateReadTime(html);
    setFormData(prev => ({ ...prev, readTime }));

    // Extract headings for TOC Preview
    const headings = extractHeadingsFromHTML(html);
    setTocItems(headings);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug if title changes and slug is empty or matches previous title slug
    if (name === "title" && !formData.slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.category || !formData.author) {
      gooeyToast.error('Missing Required Fields', {
        description: 'Please fill in Title, Slug, Category, and Author before publishing.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const postData = {
        ...formData,
        content: htmlContent,
        seo: {
          focusKeyword: formData.focusKeyword,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          keywords: formData.keywords,
          canonicalUrl: formData.canonicalUrl,
          ogImage: formData.ogImage,
          ogTitle: formData.ogTitle,
          ogDescription: formData.ogDescription,
        }
      };

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create post");
      }


      gooeyToast.success('Post Published', {
        description: 'Your new story has been created successfully.',
      });

      router.push("/dashboard/posts");
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Error creating post',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="size-9 rounded-full" asChild>
            <Link href="/dashboard/posts">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Create New Post
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Draft your next masterpiece and prepare it for publication.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => router.push("/dashboard/posts")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Publish Post
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-semibold"
                placeholder="Enter a catchy title..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Slug</label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 rounded-lg bg-muted border border-border/50 text-xs text-muted-foreground">/blog/</span>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="manual-slug-here"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden flex flex-col min-h-[700px]">
            <div className="px-6 py-4 border-b bg-muted/5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Article Content</label>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
              <EditorProvider
                className="flex-1 overflow-y-auto overflow-x-auto p-8 focus:outline-none prose prose-sm dark:prose-invert max-w-none wrap-break-word font-inter"
                content={content}
                onUpdate={handleUpdate}
                placeholder="Start typing..."
              >
                <EditorFloatingMenu>
                  <EditorNodeHeading1 hideName />
                  <EditorNodeBulletList hideName />
                  <EditorNodeQuote hideName />
                  <EditorNodeCode hideName />
                  <EditorNodeTable hideName />
                </EditorFloatingMenu>

                <EditorBubbleMenu>
                  <EditorSelector title="Text">
                    <EditorNodeText />
                    <EditorNodeHeading1 />
                    <EditorNodeHeading2 />
                    <EditorNodeHeading3 />
                    <EditorNodeBulletList />
                    <EditorNodeOrderedList />
                    <EditorNodeTaskList />
                    <EditorNodeQuote />
                    <EditorNodeCode />
                  </EditorSelector>
                  <EditorSelector title="Format">
                    <EditorFormatBold />
                    <EditorFormatItalic />
                    <EditorFormatUnderline />
                    <EditorFormatStrike />
                    <EditorFormatCode />
                    <EditorFormatSuperscript />
                    <EditorFormatSubscript />
                  </EditorSelector>
                  <EditorLinkSelector />
                  <EditorClearFormatting />
                </EditorBubbleMenu>

                <EditorTableMenu>
                  <EditorTableColumnMenu>
                    <EditorTableColumnBefore />
                    <EditorTableColumnAfter />
                    <EditorTableColumnDelete />
                  </EditorTableColumnMenu>
                  <EditorTableRowMenu>
                    <EditorTableRowBefore />
                    <EditorTableRowAfter />
                    <EditorTableRowDelete />
                  </EditorTableRowMenu>
                  <EditorTableGlobalMenu>
                    <EditorTableHeaderColumnToggle />
                    <EditorTableHeaderRowToggle />
                    <EditorTableDelete />
                    <EditorTableMergeCells />
                    <EditorTableSplitCell />
                    <EditorTableFix />
                  </EditorTableGlobalMenu>
                </EditorTableMenu>

                <EditorCharacterCount.Words className="absolute right-6 bottom-6 bg-background/80 backdrop-blur-sm border rounded-full px-3 py-1 text-[10px] font-bold text-muted-foreground shadow-sm">
                  Words:{" "}
                </EditorCharacterCount.Words>
              </EditorProvider>
            </div>
          </div>
        </div>

        <div className="space-y-6 sticky top-6">
          <TableOfContentsPreview items={tocItems} />

          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2">Post Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Author</label>
                <select
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Author</option>
                  {authors.map(auth => (
                    <option key={auth._id} value={auth._id}>{auth.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>

              <div className="flex flex-col gap-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isHero"
                    name="isHero"
                    checked={formData.isHero}
                    onChange={(e) => handleCheckboxChange("isHero", e.target.checked)}
                    className="size-4 rounded border-border/50 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="isHero" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Hero Post</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleCheckboxChange("isFeatured", e.target.checked)}
                    className="size-4 rounded border-border/50 text-primary focus:ring-primary/20"
                  />
                  <label htmlFor="isFeatured" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Featured Article</label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reading Time</label>
                <div className="bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm flex items-center text-muted-foreground font-medium">
                  {formData.readTime}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2">Featured Media</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Video URL</label>
                <input
                  type="url"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">SEO & Social Metadata</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Focus Keyword</label>
                <input
                  type="text"
                  name="focusKeyword"
                  value={formData.focusKeyword}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="e.g. Next.js SEO..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Title</label>
                <input
                  type="text"
                  name="metaTitle"
                  value={formData.metaTitle}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Optimized title..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Catchy description for search engines..."
                ></textarea>
              </div>

              <div className="pt-2 border-t border-border/50 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Social Overrides</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OG Image URL</label>
                  <input
                    type="text"
                    name="ogImage"
                    value={formData.ogImage}
                    onChange={handleInputChange}
                    className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
