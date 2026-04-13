"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { useFormik } from "formik";
import * as Yup from "yup";
import { XInputField } from "@/components/custom/XInputField";
import {
  LayoutGrid,
  Palette,
  FileText,
  Circle,
  Hash,
  Image as ImageIcon,
} from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type CategoryStatus } from "@/mock-data/categories";

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  status: CategoryStatus;
  totalPost: number;
  imageUrl?: string;
  showOnHome: boolean;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Category | null;
  handleAdd: (
    values: Category,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => void;
  handleEdit: (
    values: Category,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => void;
}

const CategoryModal = ({
  isOpen,
  onClose,
  initialValues,
  handleAdd,
  handleEdit,
}: CategoryModalProps) => {
  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || "",
      slug: initialValues?.slug || "",
      description: initialValues?.description || "",
      color: initialValues?.color || "#3b82f6",
      status: initialValues?.status || "active",
      totalPost: initialValues?.totalPost || 0,
      imageUrl: initialValues?.imageUrl || "",
      showOnHome: initialValues?.showOnHome || false,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Category name is required"),
      slug: Yup.string()
        .required("Slug is required")
        .matches(/^[a-z0-s0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
      description: Yup.string().optional(),
      imageUrl: Yup.string().url("Must be a valid URL").optional(),
      color: Yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
      status: Yup.string().oneOf(["active", "archived"]).required("Required"),
      showOnHome: Yup.boolean().optional(),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (initialValues) {
        handleEdit(
          values as Category,
          formik.resetForm,
          onClose,
          formik.setSubmitting
        );
      } else {
        handleAdd(
          values as Category,
          formik.resetForm,
          onClose,
          formik.setSubmitting
        );
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[600px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle className="text-base font-medium sm:text-lg">
            {initialValues ? "Edit Category" : "Add New Category"}
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              {initialValues
                ? "Update the details for this category below."
                : "Fill in the details to create a new category."}
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          <form
            id="category-form"
            onSubmit={formik.handleSubmit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <XInputField
              id="name"
              name="name"
              label="Category Name"
              placeholder="e.g. Technology"
              icon={<LayoutGrid />}
              value={formik.values.name}
              onChange={(e) => {
                formik.handleChange(e);
                if (!initialValues) {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/[^\w\s-]/g, "")
                    .replace(/[\s_-]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                  formik.setFieldValue("slug", slug);
                }
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name}
            />

            <XInputField
              id="slug"
              name="slug"
              label="URL Slug"
              placeholder="e.g. technology"
              icon={<Hash />}
              value={formik.values.slug}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.slug && formik.errors.slug}
            />

            <XInputField
              id="color"
              name="color"
              label="Accent Color (Hex)"
              placeholder="e.g. #3b82f6"
              icon={<Palette />}
              value={formik.values.color}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.color && formik.errors.color}
              rightElement={
                <div
                  className="size-5 rounded-full border border-black/10 shadow-sm"
                  style={{ backgroundColor: formik.values.color }}
                />
              }
            />
            <XInputField
              id="imageUrl"
              name="imageUrl"
              label="Thumbnail Image URL"
              placeholder="e.g. https://images.unsplash.com/..."
              icon={
                formik.values.imageUrl && !formik.errors.imageUrl ? (
                  <div className="size-5 shrink-0 overflow-hidden rounded-full border border-border bg-muted animate-in fade-in zoom-in-95">
                    <img
                      src={formik.values.imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/9.x/shapes/svg?seed=placeholder';
                      }}
                    />
                  </div>
                ) : (
                  <ImageIcon />
                )
              }
              value={formik.values.imageUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.imageUrl && formik.errors.imageUrl}
            />

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <Select
                onValueChange={(value) => formik.setFieldValue("status", value)}
                value={formik.values.status}
              >
                <SelectTrigger id="status" className="w-full capitalize border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {formik.touched.status && formik.errors.status && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.status}
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-2 justify-center pt-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showOnHome"
                  name="showOnHome"
                  checked={formik.values.showOnHome}
                  onChange={formik.handleChange}
                  className="size-4 rounded border-border/50 text-primary focus:ring-primary/20 cursor-pointer"
                />
                <label htmlFor="showOnHome" className="text-sm font-medium cursor-pointer">Show on Home Page</label>
              </div>
              <p className="text-[10px] text-muted-foreground ml-6">If enabled, this category show on the landing page.</p>
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:bg-muted/10"
                placeholder="Give a brief description of this category..."
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.description && formik.errors.description && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.description}
                </p>
              )}
            </div>

            {initialValues && (
              <div className="col-span-1 sm:col-span-2 bg-muted/30 rounded-lg p-3 border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <FileText className="size-4" />
                  Total Posts linked:
                </div>
                <div className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {formik.values.totalPost}
                </div>
              </div>
            )}
          </form>
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row gap-2">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="category-form"
            disabled={formik.isSubmitting}
            className="w-full sm:w-auto"
          >
            {formik.isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Saving...
              </>
            ) : (
              "Save Category"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;
