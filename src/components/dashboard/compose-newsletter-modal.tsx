"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Edit3, Send, Loader2, Mail } from "lucide-react";
import { gooeyToast } from "goey-toast";

interface ComposeNewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComposeNewsletterModal({ isOpen, onClose }: ComposeNewsletterModalProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSending, setIsSending] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleSendBroadcast = async () => {
    if (!subject || !content) {
      gooeyToast.error("Subject and content are required.");
      return;
    }

    if (!confirm("Are you sure you want to broadcast this newsletter to all active subscribers? This action cannot be undone.")) {
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send newsletter");
      }

      const result = await response.json();
      gooeyToast.success("Newsletter Broadcast Dispatched!", {
        description: `Successfully sent to ${result.summary.sent} subscribers. (${result.summary.failed} failed)`,
      });
      onClose();
      // Reset form
      setSubject("");
      setContent("");
      setActiveTab("edit");
    } catch (error: any) {
      gooeyToast.error("Broadcast failed", { description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!subject || !content) {
      gooeyToast.error("Subject and content are required for test emails.");
      return;
    }

    if (!testEmail) {
      gooeyToast.error("Please enter a valid email address to send a test.");
      return;
    }

    setIsSendingTest(true);
    try {
      // Create a test route or just use the subscriber signup with a custom flag,
      // or we can use the backend email sender to send a direct email.
      // Wait, we can hit /api/newsletter/send with a special "testEmail" parameter!
      // Let's check: our /api/newsletter/send route currently sends to all active subscribers.
      // If we want to support a test email in the API, we can either:
      // A) Create a small test API endpoint, or
      // B) Update /api/newsletter/send to handle test emails if a specific testEmail field is passed!
      // Let's make an API call to a specific test endpoint or we can update our send route.
      // Wait, updating our send route to support a "testEmail" is super clean!
      // But since we already wrote send/route.ts, let's look at it: it only fetches active subscribers.
      // If we pass `{ subject, content, testEmail }` to `/api/newsletter/send`, we can handle it.
      // Oh! Let's modify `/api/newsletter/send/route.ts` to allow testing, or we can just send it.
      // Yes, modifying /api/newsletter/send/route.ts to check if `body.testEmail` exists, and if so, send ONLY to that email, is incredibly elegant!
      // Let's do that! Let's write the fetch first, then update route.ts.
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, content, testEmail }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to send test email");
      }

      gooeyToast.success(`Test email sent to ${testEmail}`);
    } catch (error: any) {
      gooeyToast.error("Test email failed", { description: error.message });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Mock template HTML for live preview
  const getPreviewHtml = () => {
    const defaultBody = "<p style='color: #64748b; font-style: italic;'>Your newsletter content will render here. Supports HTML formatting.</p>";
    const parsedContent = content || defaultBody;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; color: #1f2937; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
          <div style="background-color: #0f172a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800;">Pubpulse</h1>
          </div>
          <div style="padding: 30px; line-height: 1.6; font-size: 15px;">
            ${parsedContent}
          </div>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 8px 0;">You received this email because you subscribed to our newsletter.</p>
            <p style="margin: 0;">
              <p style="color: #4f46e5; text-decoration: underline;">Unsubscribe</p> from this list at any time.
            </p>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-base font-semibold flex items-center justify-between">
            <span>Compose Newsletter</span>
            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border text-xs mr-6">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "edit"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Edit3 className="size-3.5" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all ${activeTab === "preview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Eye className="size-3.5" />
                Preview
              </button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Email Subject</label>
            <Input
              placeholder="e.g. Weekly Roundup: New AI Trends and Designs"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10"
            />
          </div>

          {activeTab === "edit" ? (
            <div className="space-y-1.5 flex flex-col h-[380px]">
              <label className="text-sm font-medium text-foreground">Email Body (HTML / Rich Text)</label>
              <textarea
                placeholder="<p>Hello Readers,</p><p>Check out our latest post...</p>"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="flex-1 w-full p-4 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono"
              />
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden h-[380px] bg-muted/20">
              <iframe
                title="Newsletter Preview"
                srcDoc={getPreviewHtml()}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Test Email Row */}
          <div className="border-t pt-4 flex flex-col sm:flex-row items-end gap-3 bg-muted/10 -mx-6 -mb-6 p-6">
            <div className="flex-1 space-y-1.5 w-full">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Mail className="size-3.5" />
                Send a test email first
              </label>
              <Input
                placeholder="your-test-email@domain.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="h-9 bg-background"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 whitespace-nowrap"
              onClick={handleSendTestEmail}
              disabled={isSendingTest}
            >
              {isSendingTest && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Send Test
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-10">
              Discard
            </Button>
          </DialogClose>
          <Button type="button" className="h-10" onClick={handleSendBroadcast} disabled={isSending}>
            {isSending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Broadcasting...
              </>
            ) : (
              <>
                <Send className="size-4 mr-2" />
                Send Broadcast
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
