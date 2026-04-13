"use client";

import React, { useState } from "react";
import { CategoriesTable } from "@/components/dashboard/categories-table";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "@/components/icons";
import CategoryModal, { type Category } from "@/components/dashboard/category-modal";
import { gooeyToast } from "goey-toast";

export default function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteCategory = async (id: string) => {
    gooeyToast.warning('Delete category?', {
      description: 'Are you sure you want to delete this category? This will affect posts assigned to it.',
      duration: 8000,
      action: {
        label: 'Confirm Delete',
        onClick: async () => {
          try {
            const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete category");
            
            gooeyToast.success('Category deleted', {
              description: 'The category has been removed successfully.',
            });
            triggerRefresh();
          } catch (error: any) {
            gooeyToast.error('Something went wrong', {
              description: error.message || 'Error deleting category',
            });
            console.error("Error deleting category:", error);
          }
        },
      },
    });
  };

  const handleSaveCategory = async (
    values: Category,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => {
    try {
      const isEditing = !!selectedCategory?._id || !!selectedCategory?.id;
      const categoryId = selectedCategory?._id || selectedCategory?.id;
      const url = isEditing 
        ? `/api/categories/${categoryId}` 
        : "/api/categories";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save category");
      }
      
      gooeyToast.success(isEditing ? 'Category updated' : 'Category created', {
        description: `Successfully ${isEditing ? 'updated' : 'added'} the category.`,
      });

      triggerRefresh();
      resetForm();
      onClose();
    } catch (error: any) {
      gooeyToast.error('Something went wrong', {
        description: error.message || 'Error saving category',
      });
      console.error("Error saving category:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize your blog content with custom categories and tags.
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
            onClick={handleAddCategory}
          >
            <Plus className="size-4" />
            Add Category
          </Button>
        </div>
      </div>
      
      <CategoriesTable 
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        refreshTrigger={refreshTrigger}
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={selectedCategory}
        handleAdd={handleSaveCategory}
        handleEdit={handleSaveCategory}
      />
    </div>
  );
}
