"use client";

import React, { useState } from "react";
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
  User,
  MapPin,
  Image as ImageIcon,
  Palette,
  Twitter,
  Linkedin,
  Github,
  Globe,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Mail,
} from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type AuthorRole, type AuthorStatus } from "@/mock-data/authors";

export interface AuthorSocial {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface Author {
  id?: string;
  _id?: string;
  name: string;
  role: AuthorRole;
  bio: string;
  avatar: string;
  gradient: string;
  location: string;
  social: AuthorSocial;
  createdAt?: Date;
  status: AuthorStatus;
  totalPost: number;
  password?: string;
  email: string;
}

interface AuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues?: Author | null;
  handleAdd: (
    values: Author,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => void;
  handleEdit: (
    values: Author,
    resetForm: () => void,
    onClose: () => void,
    setSubmitting: (bool: boolean) => void
  ) => void;
}

const roleOptions = ["admin", "editor", "contributor"];

const AuthorModal = ({
  isOpen,
  onClose,
  initialValues,
  handleAdd,
  handleEdit,
}: AuthorModalProps) => {
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      name: initialValues?.name || "",
      role: initialValues?.role || "contributor",
      bio: initialValues?.bio || "",
      avatar: initialValues?.avatar || "",
      gradient: initialValues?.gradient || "#000000",
      location: initialValues?.location || "",
      social: {
        twitter: initialValues?.social?.twitter || "",
        linkedin: initialValues?.social?.linkedin || "",
        github: initialValues?.social?.github || "",
        website: initialValues?.social?.website || "",
      },
      status: initialValues?.status || "active",
      password: initialValues?.password || "",
      email: initialValues?.email || "",
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Name is required"),
      role: Yup.string()
        .oneOf(roleOptions, "Invalid role")
        .required("Role is required"),
      bio: Yup.string().required("Bio is required"),
      location: Yup.string().optional(),
      avatar: Yup.string().optional(),
      gradient: Yup.string().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
      social: Yup.object({
        twitter: Yup.string().url("Invalid URL").optional(),
        linkedin: Yup.string().url("Invalid URL").optional(),
        github: Yup.string().url("Invalid URL").optional(),
        website: Yup.string().url("Invalid URL").optional(),
      }),
      status: Yup.string().oneOf(["active", "inactive"]).required("Required"),
      password: Yup.string().when([], {
        is: () => !initialValues,
        then: (schema) => schema.required("Password is required"),
        otherwise: (schema) => schema.optional(),
      }),
      email: Yup.string().email("Invalid email").required("Email is required"),
    }),
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (initialValues) {
        handleEdit(
          values as Author,
          formik.resetForm,
          onClose,
          formik.setSubmitting
        );
      } else {
        handleAdd(
          values as Author,
          formik.resetForm,
          onClose,
          formik.setSubmitting
        );
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[90vh] w-[95vw] max-w-[90vw] flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[85vh] sm:max-w-[85vw] md:max-h-[80vh] md:max-w-[720px] lg:max-w-[800px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle className="text-base font-medium sm:text-lg">
            {initialValues ? "Edit Author Profile" : "Add New Author"}
            <p className="text-muted-foreground text-xs font-normal mt-0.5">
              {initialValues
                ? "Update the details for this author below."
                : "Fill in the details to create a new author profile."}
            </p>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-4 py-4 sm:px-6">
          <form
            id="author-form"
            onSubmit={formik.handleSubmit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <XInputField
              id="name"
              name="name"
              label="Full Name"
              placeholder="e.g. John Doe"
              icon={<User />}
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name}
            />

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="role" className="text-sm font-medium">
                Role
              </label>
              <Select
                onValueChange={(value) => formik.setFieldValue("role", value)}
                value={formik.values.role}

              >
                <SelectTrigger id="role" className="w-full  capitalize">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role} className="capitalize">
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formik.touched.role && formik.errors.role && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.role}
                </p>
              )}
            </div>
            
            <XInputField
              id="email"
              name="email"
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              icon={<Mail />}
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email}
            />

            <XInputField
              id="password"
              name="password"
              label={initialValues ? "Change Password (optional)" : "Password"}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              icon={<Lock />}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && formik.errors.password}
              rightElement={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              }
            />

            <XInputField
              id="location"
              name="location"
              label="Location"
              placeholder="e.g. New York, USA"
              icon={<MapPin />}
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.location && formik.errors.location}
            />

            <XInputField
              id="avatar"
              name="avatar"
              label="Avatar URL"
              placeholder="https://googledrive.com/image.jpg"
              icon={
                formik.values.avatar && !formik.errors.avatar ? (
                  <div className="size-5 shrink-0 overflow-hidden rounded-full border border-border bg-muted animate-in fade-in zoom-in-95">
                    <img
                      src={formik.values.avatar}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://api.dicebear.com/9.x/adventurer/svg?seed=placeholder';
                      }}
                    />
                  </div>
                ) : (
                  <ImageIcon />
                )
              }
              value={formik.values.avatar}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.avatar && formik.errors.avatar}
            />

            <XInputField
              id="gradient"
              name="gradient"
              label="Profile Background Color"
              placeholder="e.g. #3b82f6"
              icon={<Palette />}
              value={formik.values.gradient}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.gradient && formik.errors.gradient}
              rightElement={
                <div
                  className="size-6 rounded-full border border-black/10 shadow-sm"
                  style={{
                    backgroundColor: formik.values.gradient || "#000000",
                  }}
                />
              }
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
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {formik.touched.status && formik.errors.status && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.status}
                </p>
              )}
            </div>

            <div className="col-span-1 sm:col-span-2 space-y-1.5">
              <label htmlFor="bio" className="text-sm font-medium">
                Biography
              </label>
              <textarea
                id="bio"
                name="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Tell us about the author..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.bio && formik.errors.bio && (
                <p className="text-xs text-red-500 font-medium">
                  {formik.errors.bio}
                </p>
              )}
            </div>

            <div className="col-span-1 sm:col-span-2 pt-2">
              <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4" />
                Social Profiles
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <XInputField
                  id="social.twitter"
                  name="social.twitter"
                  placeholder="Twitter URL"
                  icon={<Twitter />}
                  value={formik.values.social.twitter}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.social?.twitter &&
                    formik.errors.social?.twitter
                  }
                />
                <XInputField
                  id="social.linkedin"
                  name="social.linkedin"
                  placeholder="LinkedIn URL"
                  icon={<Linkedin />}
                  value={formik.values.social.linkedin}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.social?.linkedin &&
                    formik.errors.social?.linkedin
                  }
                />
                <XInputField
                  id="social.github"
                  name="social.github"
                  placeholder="GitHub URL"
                  icon={<Github />}
                  value={formik.values.social.github}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.social?.github &&
                    formik.errors.social?.github
                  }
                />
                <XInputField
                  id="social.website"
                  name="social.website"
                  placeholder="Website URL"
                  icon={<Globe />}
                  value={formik.values.social.website}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.social?.website &&
                    formik.errors.social?.website
                  }
                />
              </div>
            </div>
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
            form="author-form"
            disabled={formik.isSubmitting}
            className="w-full sm:w-auto"
          >
            {formik.isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Saving...
              </>
            ) : (
              "Save Author"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthorModal;
