"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  X,
  FileImage,
  FileVideo,
  Music,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  CloudLightning,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { gooeyToast } from "goey-toast";
import { Pill, PillIndicator } from "@/components/kibo-ui/pill";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UploadHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  isR2Configured?: boolean;
}

interface QueueFileItem {
  id: string;
  file: File;
  name: string;
  sizeMB: string;
  type: "image" | "video" | "audio";
  previewUrl: string;
  progress: number;
  speedMBs: string;
  status: "queued" | "uploading" | "completed" | "error";
  errorMsg?: string;
  filePublicUrl?: string;
}

export function UploadHubModal({
  isOpen,
  onClose,
  onUploadSuccess,
  isR2Configured = true,
}: UploadHubModalProps) {
  const [fileQueue, setFileQueue] = useState<QueueFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (files: FileList | File[]) => {
    const newItems: QueueFileItem[] = Array.from(files).map((file) => {
      const isVideo = file.type.startsWith("video/") || Boolean(file.name.match(/\.(mp4|webm|mov|mkv)$/i));
      const isAudio = file.type.startsWith("audio/") || Boolean(file.name.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i));
      const mediaType: "image" | "video" | "audio" = isVideo ? "video" : isAudio ? "audio" : "image";

      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        file,
        name: file.name,
        sizeMB: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: mediaType,
        previewUrl: mediaType === "image" ? URL.createObjectURL(file) : "",
        progress: 0,
        speedMBs: "0.0 MB/s",
        status: "queued",
      };
    });

    setFileQueue((prev) => [...prev, ...newItems]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadSingleItem = async (item: QueueFileItem) => {
    setFileQueue((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 10 } : f))
    );

    try {
      const presignedRes = await fetch("/api/media/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.name,
          contentType: item.file.type,
          fileSize: item.file.size,
        }),
      });

      const presignedJson = await presignedRes.json();

      let uploadSuccess = false;
      let filePublicUrl = "";

      if (presignedJson.success && presignedJson.uploadUrl) {
        try {
          const uploadUrl = presignedJson.uploadUrl;
          filePublicUrl = presignedJson.filePublicUrl;

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", uploadUrl, true);
            xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                setFileQueue((prev) =>
                  prev.map((f) =>
                    f.id === item.id
                      ? { ...f, progress: percent, speedMBs: `${(e.loaded / (1024 * 1024)).toFixed(1)} MB` }
                      : f
                  )
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Cloudflare R2 upload returned status ${xhr.status}`));
              }
            };

            xhr.onerror = () => reject(new Error("Direct R2 CORS/Network error"));
            xhr.send(item.file);
          });

          await fetch("/api/media", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              type: item.type,
              url: filePublicUrl,
              size: item.sizeMB,
              r2Key: presignedJson.r2Key,
            }),
          });

          uploadSuccess = true;
        } catch (directErr) {
          console.warn("Direct R2 presigned upload encountered restriction. Falling back to server upload...", directErr);
        }
      }

      if (!uploadSuccess) {
        const formData = new FormData();
        formData.append("file", item.file);

        const res = await fetch("/api/media", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();
        if (json.success) {
          filePublicUrl = json.media.url;
          uploadSuccess = true;
        } else {
          throw new Error(json.error || "R2 Cloud upload failed.");
        }
      }

      if (uploadSuccess) {
        setFileQueue((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: "completed", progress: 100, filePublicUrl }
              : f
          )
        );
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setFileQueue((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? { ...f, status: "error", errorMsg: err.message || "Upload failed." }
            : f
        )
      );
    }
  };

  const startBatchUpload = async () => {
    setIsUploading(true);
    const queuedItems = fileQueue.filter((f) => f.status === "queued" || f.status === "error");

    for (const item of queuedItems) {
      await uploadSingleItem(item);
    }

    setIsUploading(false);
    gooeyToast.success("Upload batch completed!");
    onUploadSuccess();
  };

  const completedCount = fileQueue.filter((f) => f.status === "completed").length;
  const totalCount = fileQueue.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleClose = () => {
    if (!isUploading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => { }}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-xl p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[650px]"
      >
        {/* Modal Header */}
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4 bg-muted/20 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <CloudLightning className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold sm:text-lg tracking-tight">
                  Cloud Upload
                </DialogTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Drag and drop images, videos, and audio files to store directly in cloud storage.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 border"
          >
            <X className="size-5" />
          </button>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Dropzone Container */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${isDragOver
              ? "border-sky-500 bg-sky-500/5 scale-[0.99]"
              : "border-border/80 bg-muted/10 hover:border-sky-500/50 hover:bg-muted/20"
              }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*"
              className="hidden"
              onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
            />

            <div className="p-4 rounded-full bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Upload className="size-7" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Drop images, videos, or audio files here, or <span className="text-sky-500 underline">browse files</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports JPG, PNG, WEBP, GIF, SVG, MP4, WEBM, MOV, MP3, WAV, OGG, M4A, AAC
              </p>
            </div>
          </div>

          {/* Queue List */}
          {fileQueue.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  File Upload Queue ({fileQueue.length})
                </span>
                {fileQueue.length > 1 && !isUploading && (
                  <button
                    type="button"
                    onClick={() => setFileQueue([])}
                    className="text-[11px] text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {fileQueue.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/50 backdrop-blur-md shadow-xs space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* Top Row: File Details & Apple Status Badges */}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200/80 dark:border-slate-700/80 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-slate-200/50 dark:bg-slate-800/60 flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                            {item.type === "video" ? (
                              <FileVideo className="size-5 text-purple-500" />
                            ) : item.type === "audio" ? (
                              <Music className="size-5 text-emerald-500" />
                            ) : (
                              <FileImage className="size-5 text-blue-500" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0">
                          <h4 className="font-semibold text-foreground truncate max-w-[180px] sm:max-w-[280px] text-xs tracking-tight">
                            {item.name}
                          </h4>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 font-medium">
                            <span>{item.sizeMB}</span>
                            <span>•</span>
                            <span className="uppercase text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400">
                              {item.type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Apple Status Badges */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === "completed" && (
                          <span className="text-[#34C759] bg-[#34C759]/10 border border-[#34C759]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-semibold">
                            <CheckCircle2 className="size-3.5" /> Uploaded
                          </span>
                        )}

                        {item.status === "error" && (
                          <span
                            className="text-[#FF3B30] bg-[#FF3B30]/10 border border-[#FF3B30]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px] font-semibold"
                            title={item.errorMsg}
                          >
                            <AlertCircle className="size-3.5" /> Failed
                          </span>
                        )}

                        {item.status === "uploading" && (
                          <div className="flex items-center gap-1.5 bg-[#007AFF]/10 border border-[#007AFF]/20 px-2.5 py-0.5 rounded-full text-[#007AFF] text-[11px] font-semibold">
                            <Loader2 className="size-3.5 animate-spin" />
                            <span>{item.progress}%</span>
                          </div>
                        )}

                        {item.status === "queued" && (
                          <span className="text-slate-500 bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                            Queued
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeQueueItem(item.id)}
                          disabled={isUploading}
                          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors disabled:opacity-50"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    </div>

                    {/* Authentic Apple Progress Bar */}
                    <div className="relative w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                          item.status === "completed"
                            ? "bg-[#34C759]"
                            : item.status === "error"
                            ? "bg-[#FF3B30]"
                            : item.status === "uploading"
                            ? "bg-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.5)]"
                            : "bg-transparent"
                        }`}
                        style={{ width: `${item.status === "completed" ? 100 : item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isUploading}

          >
            Cancel
          </Button> */}

          <Button
            type="button"
            onClick={startBatchUpload}
            disabled={isUploading || fileQueue.length === 0}
          >


            <UploadCloud />
            Upload Files


          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
