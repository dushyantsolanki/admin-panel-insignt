"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface XInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  label?: string;
  icon?: React.ReactNode;
  error?: string | boolean;
  rightElement?: React.ReactNode;
}

export const XInputField = React.forwardRef<HTMLInputElement, XInputFieldProps>(
  ({ id, name, label, icon, error, rightElement, className, ...props }, ref) => {
    return (
      <div className="flex flex-col w-full space-y-1.5">
        {label && (
          <Label htmlFor={id} className="text-sm font-medium">
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-muted-foreground pointer-events-none">
              {React.cloneElement(icon as React.ReactElement, {
                // className: "h-4 w-4 sm:h-5 sm:w-5",
              })}
            </div>
          )}
          <Input
            id={id}
            name={name}
            ref={ref}
            className={cn(
              "w-full",
              icon && "pl-10",
              rightElement && "pr-12",
              error && "border-red-500 focus-visible:ring-red-500",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && typeof error === "string" && (
          <p className="mt-1 text-xs text-red-500 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

XInputField.displayName = "XInputField";
