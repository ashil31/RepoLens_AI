"use client";

import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser } from "@/hooks/queries";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Search,
  Settings,
  Sparkles,
  History,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";

type CommandPaletteProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const router = useRouter();
  const { user } = useCurrentUser();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isControlled && onOpenChange) onOpenChange(!open);
        else setInternalOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isControlled, onOpenChange, open]);

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      contentClassName="w-full max-w-xl p-0 rounded-2xl border border-border bg-card shadow-lg"
    >
      <Command className="rounded-2xl">
        <VisuallyHidden>
          <Dialog.Title>Find</Dialog.Title>
        </VisuallyHidden>

        {/* Header: workspace */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Avatar className="h-8 w-8 shrink-0 border border-border">
            <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
              {user.initial}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {user.projectsLabel}
          </span>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {user.workspacePlan}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>

        {/* Search + Esc */}
        <CommandInput
          placeholder="Find..."
          suffix={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              Esc
            </Button>
          }
        />

        <CommandList className="max-h-[320px] p-1">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Actions" className="[&_[cmdk-group-heading]]:sr-only">
            <CommandItem
              onSelect={() => run(() => router.push("/dashboard/repositories"))}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  Search repository
                </p>
                <p className="truncate text-xs text-muted-foreground">Go to Repositories</p>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/dashboard/analysis"))}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  Create analysis
                </p>
                <p className="truncate text-xs text-muted-foreground">Run new analysis</p>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/dashboard/history"))}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <History className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Go to history</p>
                <p className="truncate text-xs text-muted-foreground">View past analyses</p>
              </div>
            </CommandItem>
            <CommandItem
              onSelect={() => run(() => router.push("/dashboard/settings"))}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <Settings className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">Open settings</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.projectsLabel} / Settings
                </p>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
