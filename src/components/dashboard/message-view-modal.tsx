"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileText, Mail, Type } from "@/components/icons";
export type MessageStatus = "unread" | "read" | "replied";

export interface Message {
  _id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  content: string;
  status: MessageStatus;
  createdAt: string;
  senderAvatarSeed?: string;
}

interface MessageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
}

export function MessageViewModal({ isOpen, onClose, message }: MessageViewModalProps) {
  if (!message) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col gap-0 p-0 sm:max-h-[80vh] sm:max-w-lg md:max-h-[70vh] md:max-w-2xl lg:max-h-[70vh] lg:max-w-2xl [&>button:last-child]:top-4">
        <DialogHeader className="contents space-y-0 text-left">
          <DialogTitle className="border-b px-6 py-4 text-base font-semibold">
            View Message
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              Detailed view of the message received on {message.createdAt}.
            </p>
          </DialogTitle>

          <div className="scrollbar-hide overflow-y-auto">
            <DialogDescription asChild>
              <div className="space-y-6 px-6 py-6">
                {/* First Row: Avatar and basic info */}
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  {/* Left Column: Subject + Sender Name */}
                  <div className="order-2 flex flex-col gap-6 md:order-1 flex-1">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Type className="text-primary h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Sender Name</p>
                        <p className="text-sm text-muted-foreground">{message.senderName}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{message.senderEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Mail className="text-amber-600 dark:text-amber-400 h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Subject</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {message.subject}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Avatar (mobile: top, desktop: right) */}
                  <div className="order-1 flex justify-center md:order-2 md:justify-end shrink-0">
                    <Avatar className="size-24 rounded-2xl border-4 border-muted shadow-sm">
                      <AvatarImage
                        src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${message.senderAvatarSeed}`}
                        alt={message.senderName}
                      />
                      <AvatarFallback className="rounded-2xl text-2xl font-bold bg-muted">
                        {message.senderName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "UN"}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Second Row: Message Body */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <p className="text-sm font-semibold">Message Body</p>
                  </div>
                  <div className="bg-muted/30 dark:bg-muted/10 rounded-xl border border-border/50 p-4 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap min-h-[120px]">
                    {message.content}
                  </div>
                </div>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>

        <DialogFooter className="border-t px-6 py-4 bg-muted/20">
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-9 w-full sm:w-auto" onClick={onClose}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
