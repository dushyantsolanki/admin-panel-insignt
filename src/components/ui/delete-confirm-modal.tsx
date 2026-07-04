"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  requireHold?: boolean;
  holdDuration?: number; // in ms, default 1500
  verificationText?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete item?",
  description = "Are you sure you want to delete this item? This action is permanent and cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  requireHold = true,
  holdDuration = 1500,
  verificationText,
}: DeleteConfirmModalProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [shake, setShake] = useState(false);

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const modalControls = useAnimation();

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setIsHolding(false);
      setHoldProgress(0);
      setIsDeleting(false);
      setIsSuccess(false);
      setIsHovered(false);
      setInputValue("");
      setShake(false);
    }
  }, [isOpen]);

  const isVerified = !verificationText || inputValue.trim().toLowerCase() === verificationText.trim().toLowerCase();

  // Trigger shake animation
  const triggerShake = async () => {
    setShake(true);
    await modalControls.start({
      x: [0, -6, 6, -6, 6, 0],
      transition: { duration: 0.4 },
    });
    setShake(false);
  };

  // Hold-to-delete animation loops
  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Avoid right click or if not verified yet
    if ("button" in e && e.button !== 0) return;
    if (!isVerified) {
      triggerShake();
      return;
    }

    setIsHolding(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min((elapsed / holdDuration) * 100, 100);
      setHoldProgress(progress);

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        handleConfirm();
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const endHold = () => {
    if (!isHolding) return;
    setIsHolding(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Animate progress back to 0
    const startProgress = holdProgress;
    const releaseTime = Date.now();
    const duration = 250; // ms to drain

    const drainProgress = () => {
      const elapsed = Date.now() - releaseTime;
      const progress = Math.max(startProgress - (elapsed / duration) * startProgress, 0);
      setHoldProgress(progress);

      if (progress > 0) {
        animationFrameRef.current = requestAnimationFrame(drainProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(drainProgress);
  };

  const handleConfirm = async () => {
    setIsHolding(false);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setIsDeleting(true);

    try {
      await onConfirm();
      setIsSuccess(true);
      setIsDeleting(false);
      // Wait for success animation before closing
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
      triggerShake();
    }
  };

  const handleSimpleClick = () => {
    if (!isVerified) {
      triggerShake();
      return;
    }
    handleConfirm();
  };

  // Trash animations variants
  const lidVariants = {
    default: { y: 0, rotate: 0, originX: 0.1, originY: 0.9 },
    hover: { y: -3, rotate: -12, originX: 0.1, originY: 0.9, transition: { type: "spring" as const, stiffness: 350, damping: 15 } },
    holding: {
      y: [-3, -5, -4, -5],
      rotate: [-12, -8, -15, -12],
      transition: { repeat: Infinity, duration: 0.15 }
    },
    deleting: {
      y: -6,
      rotate: -20,
      scale: [1, 1.1, 1],
      transition: { repeat: Infinity, duration: 0.4 }
    },
    success: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
  };

  const binVariants = {
    default: { rotate: 0, scale: 1 },
    hover: { scale: 1.05, transition: { type: "spring" as const, stiffness: 400, damping: 15 } },
    holding: {
      x: [-1, 1, -1, 1],
      y: [-0.5, 0.5, -0.5, 0.5],
      transition: { repeat: Infinity, duration: 0.1 }
    },
    deleting: {
      scale: [1, 0.95, 1.05, 1],
      transition: { repeat: Infinity, duration: 0.5 }
    },
    success: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogPrimitive.Portal forceMount>
            {/* Backdrop Overlay */}
            <DialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
              />
            </DialogPrimitive.Overlay>

            {/* Modal Container */}
            <DialogPrimitive.Content asChild>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  animate={modalControls}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring" as const, stiffness: 350, damping: 25 }}
                  className={cn(
                    "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-2xl transition-colors duration-200 focus:outline-hidden",
                    shake && "border-destructive/50 shadow-destructive/10"
                  )}
                >
                  {/* Close button */}
                  {/* <DialogPrimitive.Close className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all duration-200">
                    <X className="size-4" />
                  </DialogPrimitive.Close> */}

                  {/* Header visual block */}
                  <div className="flex flex-col items-center text-center space-y-4">
                    {/* Animated Warning / Trash Indicator */}
                    <div className="relative flex items-center justify-center size-20 rounded-full bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 shadow-inner">
                      {/* Pulse Ring */}
                      {isHolding && (
                        <motion.span
                          layoutId="pulse"
                          className="absolute inset-0 rounded-full bg-destructive/25"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        />
                      )}

                      <AnimatePresence mode="wait">
                        {!isSuccess ? (
                          <motion.svg
                            key="trash-icon"
                            width="36"
                            height="36"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn(
                              "text-destructive transition-colors duration-200",
                              (isHovered || isHolding) && "text-red-500"
                            )}
                          >
                            {/* Lid */}
                            <motion.g
                              variants={lidVariants}
                              animate={
                                isDeleting
                                  ? "deleting"
                                  : isHolding
                                    ? "holding"
                                    : isHovered
                                      ? "hover"
                                      : "default"
                              }
                            >
                              <path d="M4 6h16M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </motion.g>

                            {/* Bin Body */}
                            <motion.g
                              variants={binVariants}
                              animate={
                                isDeleting
                                  ? "deleting"
                                  : isHolding
                                    ? "holding"
                                    : isHovered
                                      ? "hover"
                                      : "default"
                              }
                            >
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </motion.g>
                          </motion.svg>
                        ) : (
                          <motion.div
                            key="success-icon"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring" as const, stiffness: 300, damping: 15 }}
                            className="flex items-center justify-center text-emerald-500"
                          >
                            <svg
                              width="40"
                              height="40"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <motion.path
                                d="M20 6L9 17l-5-5"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
                              />
                            </svg>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <DialogPrimitive.Title className="text-xl font-bold tracking-tight">
                        {isSuccess ? "Successfully Deleted" : title}
                      </DialogPrimitive.Title>
                      <DialogPrimitive.Description className="text-sm text-muted-foreground px-4 leading-relaxed">
                        {isSuccess
                          ? "The item has been permanently removed."
                          : description}
                      </DialogPrimitive.Description>
                    </div>
                  </div>

                  {/* Verification Input if provided */}
                  {verificationText && !isSuccess && (
                    <div className="mt-6 space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        To verify, type <span className="font-extrabold text-foreground">"{verificationText}"</span> below:
                      </label>
                      <Input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={`Type "${verificationText}"`}
                        className={cn(
                          "h-10 text-center font-medium border-border/60 focus-visible:ring-primary/20",
                          !isVerified && inputValue.length > 0 && "border-destructive/30 focus-visible:ring-destructive/10"
                        )}
                        disabled={isDeleting || isSuccess}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isSuccess && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Cancel Button */}
                      <DialogPrimitive.Close asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 font-semibold transition-transform active:scale-98 order-2 sm:order-1"
                          disabled={isDeleting}
                        >
                          {cancelText}
                        </Button>
                      </DialogPrimitive.Close>

                      {/* Confirm Delete Button */}
                      {requireHold ? (
                        <button
                          data-slot="button"
                          onMouseDown={startHold}
                          onMouseUp={endHold}
                          onTouchStart={startHold}
                          onTouchEnd={endHold}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => {
                            setIsHovered(false);
                            endHold();
                          }}
                          disabled={isDeleting || !isVerified}
                          className={cn(
                            "relative overflow-hidden w-full h-10 px-4 rounded-md text-sm font-semibold text-white select-none transition-all active:scale-98 flex items-center justify-center gap-2 order-1 sm:order-2",
                            isVerified
                              ? "bg-destructive hover:bg-destructive/95 cursor-pointer shadow-md hover:shadow-destructive/20"
                              : "bg-destructive/40 cursor-not-allowed opacity-50"
                          )}
                        >
                          {/* Slide Progress Background */}
                          {isVerified && (
                            <motion.div
                              className="absolute left-0 top-0 bottom-0 bg-red-800/40 dark:bg-red-500/35"
                              style={{ width: `${holdProgress}%` }}
                            />
                          )}

                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {isDeleting ? (
                              <>
                                <Loader2 className="animate-spin size-4" />
                                <span>Deleting...</span>
                              </>
                            ) : isHolding ? (
                              <>
                                <span>Hold to Confirm</span>
                              </>
                            ) : (
                              <span>Hold to Delete</span>
                            )}
                          </span>
                        </button>
                      ) : (
                        <Button
                          variant="destructive"
                          onClick={handleSimpleClick}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                          disabled={isDeleting || !isVerified}
                          className="w-full h-10 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-destructive/20 order-1 sm:order-2"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="animate-spin size-4" />
                              <span>Deleting...</span>
                            </>
                          ) : (
                            <span>{confirmText}</span>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              </div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
