"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Explain repository architecture",
  "Where is authentication implemented?",
  "Show dependency graph",
  "What are the main modules?",
];

type RepoInputProps = {
  onSubmit: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

export function RepoInput({
  onSubmit,
  disabled = false,
  placeholder = "Ask RepoLens about this repository...",
  className,
}: RepoInputProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v || disabled) return;
    onSubmit(v);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={cn("shrink-0 border-t border-border bg-card/50 p-4", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Try asking:</span>
        {SUGGESTIONS.map((s) => (
          <motion.button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              inputRef.current?.focus();
            }}
            className="rounded-md bg-muted/80 px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            {s}
          </motion.button>
        ))}
      </div>
      <div className="relative flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-w-0 bg-background pr-6"
          />
          {focused && !value && (
            <motion.span
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 border-r-2 border-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.1 }}
              aria-hidden
            />
          )}
        </div>
        <Button
          type="button"
          size="icon"
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className="shrink-0 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
