"use client";

import React, { useState } from "react";
import { SubscribersTable } from "@/components/dashboard/subscribers-table";
import { ComposeNewsletterModal } from "@/components/dashboard/compose-newsletter-modal";
import { Button } from "@/components/ui/button";
import { Mail, Download } from "@/components/icons";
import { gooeyToast } from "goey-toast";

export default function SubscribersPage() {
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const handleExportCSV = async () => {
    try {
      const response = await fetch("/api/subscribers?limit=100000"); // Fetch all
      if (!response.ok) throw new Error("Failed to fetch subscriber list");
      const data = await response.json();

      const subscribers = data.subscribers || [];
      if (subscribers.length === 0) {
        gooeyToast.info("No subscribers to export.");
        return;
      }

      // Convert to CSV format
      const csvHeaders = "Email,Status,Source,Subscribed At\n";
      const csvRows = subscribers.map((sub: any) => {
        const date = new Date(sub.createdAt).toLocaleDateString("en-GB");
        return `"${sub.email}","${sub.status}","${sub.source || "footer"}","${date}"`;
      }).join("\n");

      const csvContent = "data:text/csv;charset=utf-8," + csvHeaders + csvRows;
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `subscribers_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      gooeyToast.success("Subscribers list exported successfully!");
    } catch (error: any) {
      gooeyToast.error("Export failed", { description: error.message });
    }
  };

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage subscription status, export contact data, or broadcast newsletters.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleExportCSV}>
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button size="sm" className="h-9 gap-1.5" onClick={() => setIsComposeOpen(true)}>
            <Mail className="size-4" />
            Compose Newsletter
          </Button>
        </div>
      </div>

      <SubscribersTable />

      <ComposeNewsletterModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
      />
    </div>
  );
}
