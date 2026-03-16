"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ExpandedPanelOverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
};

export function ExpandedPanelOverlay({
  open,
  onClose,
  title,
  children,
  className,
}: ExpandedPanelOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <header className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-4 py-3 sm:px-10 sm:py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>
      <div className={cn("min-h-0 flex-1 overflow-hidden p-4 sm:p-6", className)}>{children}</div>
    </div>
  );
}
