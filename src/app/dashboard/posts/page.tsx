"use client";

import React from "react";
import { PostsTable } from "@/components/dashboard/posts-table";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "@/components/icons";
import Link from "next/link";

export default function PostsPage() {
  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Posts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create, edit, and manage your blog articles and SEO metadata.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/50">
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button size="sm" className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" asChild>
            <Link href="/dashboard/posts/new">
              <Plus className="size-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>
      
      <PostsTable />
    </div>
  );
}
