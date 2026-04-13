"use client";

import React from "react";
import { MessagesTable } from "@/components/dashboard/messages-table";
import { Button } from "@/components/ui/button";
import { Download } from "@/components/icons";

export default function MessagesPage() {
  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Messages
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage and respond to incoming inquiries from your audience.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5">
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>
      
      <MessagesTable />
    </div>
  );
}
