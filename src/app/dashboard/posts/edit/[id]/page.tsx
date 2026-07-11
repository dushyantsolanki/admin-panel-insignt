"use client";

import React, { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Loader2, Upload, Headphones, CheckCircle2, Trash2 } from "lucide-react";
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

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    category: "",
    author: "",
    status: "draft" as "draft" | "published" | "scheduled",
    image: "",
    videoUrl: "",
    audioData: "",
    audioContentType: "",
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

  const [content, setContent] = useState<JSONContent | null>(null);
  const [htmlContent, setHtmlContent] = useState("");
  const [tocItems, setTocItems] = useState<TOCItem[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [catsRes, authsRes, postRes] = await Promise.all([
          fetch("/api/categories?all=true"),
          fetch("/api/authors"),
          fetch(`/api/posts/${id}`)
        ]);

        const catsData = await catsRes.json();
        const auths = await authsRes.json();
        const post = await postRes.json();

        if (post.error) throw new Error(post.error);

        setCategories(catsData.categories || []);
        setAuthors(auths);

        setFormData({
          title: post.title || "",
          slug: post.slug || "",
          category: post.category?._id || post.category?.id || (typeof post.category === 'string' ? post.category : ""),
          author: post.author?._id || post.author?.id || (typeof post.author === 'string' ? post.author : ""),
          status: post.status || "draft",
          image: post.image || "",
          videoUrl: post.videoUrl || "",
          audioData: post.audioData || "",
          audioContentType: post.audioContentType || "",
          focusKeyword: post.seo?.focusKeyword || "",
          metaTitle: post.seo?.metaTitle || "",
          metaDescription: post.seo?.metaDescription || "",
          keywords: post.seo?.keywords || "",
          canonicalUrl: post.seo?.canonicalUrl || "",
          ogImage: post.seo?.ogImage || "",
          ogTitle: post.seo?.ogTitle || "",
          ogDescription: post.seo?.ogDescription || "",
          readTime: post.readTime || calculateReadTime(post.content || ""),
          isHero: post.isHero || false,
          isFeatured: post.isFeatured || false,
        });

        setHtmlContent(post.content || "");
        setTocItems(extractHeadingsFromHTML(post.content || ""));
        setIsLoading(false);
      } catch (error: any) {
        gooeyToast.error('Failed to load post', {
          description: error.message || 'Error fetching post content',
        });
        router.push("/dashboard/posts");
      }
    };
    fetchData();
  }, [id, router]);

  const handleUpdate = ({ editor }: { editor: Editor }) => {
    const html = editor.getHTML();
    setHtmlContent(html);

    // Calculate read time
    const readTime = calculateReadTime(html);
    setFormData(prev => ({ ...prev, readTime }));

    const headings = extractHeadingsFromHTML(html);
    setTocItems(headings);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) { // 15MB limit to stay under MongoDB 16MB document limit
        gooeyToast.error('File too large', {
          description: 'Audio file must be less than 15MB to fit in the database.',
        });
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFormData(prev => ({
          ...prev,
          audioData: base64String,
          audioContentType: file.type
        }));
        gooeyToast.success('Audio prepared', {
          description: 'Audio file is ready to be saved.',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingFields = [];
    if (!formData.title) missingFields.push('Title');
    if (!formData.slug) missingFields.push('Slug');
    if (!formData.category) missingFields.push('Category');
    if (!formData.author) missingFields.push('Author');

    if (missingFields.length > 0) {
      gooeyToast.error('Missing Required Fields', {
        description: `Please fill in the following before saving: ${missingFields.join(', ')}`,
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

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `/api/posts/${id}`);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            let errorData;
            try {
              errorData = JSON.parse(xhr.responseText);
            } catch (e) {
              errorData = { error: "Failed to update post" };
            }
            reject(new Error(errorData.error || "Failed to update post"));
          }
        };

        xhr.onerror = () => reject(new Error("Network Error during upload"));

        xhr.send(JSON.stringify(postData));
      });

      gooeyToast.success('Changes Saved', {
        description: 'The article has been updated successfully.',
      });

      router.push("/dashboard/posts");
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Error updating post',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-64">
        <Loader2 className="size-8 animate-spin text-primary/40 mb-4" />
        <p className="text-sm text-muted-foreground">Loading post data...</p>
      </div>
    );
  }

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
              Edit Post
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Modify your article content and metadata.
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
            className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-4 relative overflow-hidden"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin z-10" />
                <span className="z-10">{uploadProgress > 0 && uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Saving..."}</span>
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-black/20 z-0 transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save Changes
              </>
            )}
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
                  className="flex-1 bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
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
                content={htmlContent}
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

          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm text-card-foreground">
            <h3 className="font-semibold text-sm">Post Settings</h3>
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
                    checked={formData.isHero}
                    onChange={(e) => handleCheckboxChange("isHero", e.target.checked)}
                    className="size-4 rounded border-border/50 text-primary focus:ring-primary/20 cursor-pointer"
                  />
                  <label htmlFor="isHero" className="text-xs font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Hero Post</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => handleCheckboxChange("isFeatured", e.target.checked)}
                    className="size-4 rounded border-border/50 text-primary focus:ring-primary/20 cursor-pointer"
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
            <h3 className="font-semibold text-sm">Featured Media</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Featured Image URL</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
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
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-primary" /> Audio Voice (Max 15MB)
                </label>
                
                {!formData.audioData ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-xl bg-muted/10 hover:bg-muted/30 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                      <div className="w-10 h-10 mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-primary" />
                      </div>
                      <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Click to upload</span> your audio</p>
                      <p className="text-xs text-muted-foreground/70">MP3, WAV, OGG (MAX. 15MB)</p>
                    </div>
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="relative flex flex-col gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          <span className="text-sm font-medium text-foreground">Audio Track Ready</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setFormData({...formData, audioData: "", audioContentType: ""})} 
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors group"
                        title="Remove audio"
                      >
                          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                    <audio 
                      controls 
                      src={`data:${formData.audioContentType || 'audio/mpeg'};base64,${formData.audioData}`} 
                      className="w-full h-10 outline-none rounded-lg"
                    />
                  </div>
                )}
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
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta Description</label>
                <textarea
                  name="metaDescription"
                  value={formData.metaDescription}
                  onChange={handleInputChange}
                  className="w-full bg-muted/30 border border-border/50 rounded-lg p-3 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
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
