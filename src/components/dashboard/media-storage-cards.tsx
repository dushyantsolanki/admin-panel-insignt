"use client";

import { mediaStorageStat } from "@/mock-data/media";
import type { MediaType } from "@/mock-data/media";
import { Image } from "@/components/icons";
import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  Images: Image,
  Videos: Video,
};

const typeMap: Record<string, MediaType> = {
  Images: "image",
  Videos: "video",
};

interface MediaStorageCardsProps {
  onFilterSelect: (type: MediaType) => void;
}

export function MediaStorageCards({ onFilterSelect }: MediaStorageCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {mediaStorageStat.breakdown.map((item) => {
        const Icon = iconMap[item.type as keyof typeof iconMap] || Image;
        const percentage = ((item.size / mediaStorageStat.total) * 100).toFixed(0);
        const mediaType = typeMap[item.type as keyof typeof typeMap];

        return (
          <div
            key={item.type}
            className={cn(
              "p-4 rounded-xl border bg-card transition-all cursor-pointer group",
              "hover:bg-accent/50 hover:border-primary/20 hover:shadow-sm",
              "active:scale-[0.98]"
            )}
            onClick={() => mediaType && onFilterSelect(mediaType)}
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
            <p className="font-medium text-sm mb-0.5">{item.type}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {item.size} GB
              </span>
              <span className="text-xs text-muted-foreground">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
