"use client";

import React, { useState, useEffect } from "react";
import { AuthorsTable } from "@/components/dashboard/authors-table";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "@/components/icons";
import AuthorModal, { type Author } from "@/components/dashboard/author-modal";
import { gooeyToast } from "goey-toast";

export default function AuthorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/authors");
      if (!res.ok) throw new Error("Failed to fetch authors");
      const data = await res.json();
      setAuthors(data);
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Failed to fetch authors',
      })
      console.error("Error fetching authors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthors();
  }, []);

  const handleAddAuthor = () => {
    setSelectedAuthor(null);
    setIsModalOpen(true);
  };

  const handleEditAuthor = (author: Author) => {
    setSelectedAuthor(author);
    setIsModalOpen(true);
  };

  const handleDeleteAuthor = async (id: string) => {
    gooeyToast.warning('Delete this author?', {
      description: 'This action is permanent and cannot be undone.',
      duration: 8000,
      action: {
        label: 'Confirm Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/authors/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete author");
            
            gooeyToast.success('Author deleted', {
              description: 'The author has been removed successfully.',
            });
            fetchAuthors();
          } catch (error: any) {
            gooeyToast.error('Something went wrong', {
              description: error.message || 'Error deleting author',
            });
            console.error("Error deleting author:", error);
          }
        },
      },
    });
  };

  const handleSaveAuthor = async (
    values: Author,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => {
    try {
      const isEditing = !!selectedAuthor?._id;
      const url = isEditing
        ? `/api/authors/${selectedAuthor._id}`
        : "/api/authors";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Failed to save author");

      gooeyToast.success(isEditing ? 'Author updated' : 'Author created', {
        description: `Successfully ${isEditing ? 'updated' : 'added'} the author profile.`,
      });

      await fetchAuthors();
      resetForm();
      onClose();
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Error saving author',
      });
      console.error("Error saving author:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Authors
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your content creators and their publishing roles.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border/50">
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            size="sm"
            className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
            onClick={handleAddAuthor}
          >
            <Plus className="size-4" />
            Add Author
          </Button>
        </div>
      </div>

      <AuthorsTable
        authors={authors}
        isLoading={isLoading}
        onEditAuthor={handleEditAuthor}
        onDeleteAuthor={handleDeleteAuthor}
      />

      <AuthorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={selectedAuthor || undefined}
        handleAdd={handleSaveAuthor}
        handleEdit={handleSaveAuthor}
      />
    </div>
  );
}
