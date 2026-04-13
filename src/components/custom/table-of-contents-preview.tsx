"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ListTree, Hash } from "lucide-react";

export interface TOCItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsPreviewProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContentsPreview({ items, className }: TableOfContentsPreviewProps) {
  if (items.length === 0) {
    return (
      <div className={cn("bg-muted/30 border border-dashed border-border/50 rounded-xl p-8 text-center space-y-3", className)}>
        <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <ListTree className="w-5 h-5 text-muted-foreground/50" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">No headings found</p>
          <p className="text-xs text-muted-foreground/60 leading-relaxed">
            Add headings (H1, H2, H3) to your article to generate a table of contents automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card border rounded-xl overflow-hidden", className)}>
      <div className="px-4 py-3 border-b bg-muted/5 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <ListTree className="w-3.5 h-3.5" />
          Table of Contents
        </h3>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {items.length} {items.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>
      
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <ul className="space-y-1">
          {items.map((item, index) => (
            <motion.li
              key={`${item.id}-${index}`}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "group flex items-center gap-3 py-1.5 px-2 rounded-lg transition-colors hover:bg-muted/50",
                item.level === 1 ? "ml-0" : item.level === 2 ? "ml-4" : "ml-8"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
                item.level === 1 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {item.level === 1 ? "H1" : item.level === 2 ? "H2" : "H3"}
              </div>
              <span className="text-sm text-foreground/80 group-hover:text-foreground line-clamp-1 truncate">
                {item.title}
              </span>
              <Hash className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-30 transition-opacity flex-shrink-0" />
            </motion.li>
          ))}
        </ul>
      </div>
      
      <div className="px-4 py-2 bg-muted/5 border-t">
        <p className="text-[10px] text-muted-foreground/60 italic">
          IDs are automatically generated for deep linking.
        </p>
      </div>
    </div>
  );
}
