"use client";

import React from "react";
import { Image, Video, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export type MediaTypeFilter = "image" | "video" | "audio";

interface MediaStatsData {
  totalFiles: number;
  imageCount: number;
  videoCount: number;
  audioCount: number;
  starredCount: number;
}

interface MediaStorageCardsProps {
  onFilterSelect: (type: MediaTypeFilter) => void;
  stats?: MediaStatsData;
}

export function MediaStorageCards({ onFilterSelect, stats }: MediaStorageCardsProps) {
  const imageCount = stats?.imageCount || 0;
  const videoCount = stats?.videoCount || 0;
  const audioCount = stats?.audioCount || 0;
  const total = imageCount + videoCount + audioCount;

  const imagePercent = total > 0 ? Math.round((imageCount / total) * 100) : 50;
  const videoPercent = total > 0 ? Math.round((videoCount / total) * 100) : 30;
  const audioPercent = total > 0 ? Math.round((audioCount / total) * 100) : 20;

  const items = [
    {
      type: "Images",
      mediaType: "image" as MediaTypeFilter,
      size: `${imageCount} files`,
      percentage: imagePercent,
      color: "#3b82f6",
      icon: Image,
    },
    {
      type: "Videos",
      mediaType: "video" as MediaTypeFilter,
      size: `${videoCount} files`,
      percentage: videoPercent,
      color: "#a855f7",
      icon: Video,
    },
    {
      type: "Audio",
      mediaType: "audio" as MediaTypeFilter,
      size: `${audioCount} files`,
      percentage: audioPercent,
      color: "#10b981",
      icon: Music,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.type}
            className={cn(
              "p-4 rounded-xl border bg-card transition-all cursor-pointer group",
              "hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm",
              "active:scale-[0.98]"
            )}
            onClick={() => onFilterSelect(item.mediaType)}
          >
            <div
              className="size-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: `${item.color}15` }}
            >
              <Icon
                className="size-5"
                style={{ color: item.color }}
              />
            </div>
            <p className="font-medium text-sm mb-0.5 text-foreground">{item.type}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {item.size}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
