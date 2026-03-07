"use client";

import * as React from "react";
import {
  Command as CmdkCommand,
  CommandDialog as CmdkCommandDialog,
  CommandEmpty as CmdkCommandEmpty,
  CommandGroup as CmdkCommandGroup,
  CommandInput as CmdkCommandInput,
  CommandItem as CmdkCommandItem,
  CommandList as CmdkCommandList,
  CommandSeparator as CmdkCommandSeparator,
} from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ComponentRef<typeof CmdkCommand>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand>
>(({ className, ...props }, ref) => (
  <CmdkCommand
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-lg bg-card text-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = CmdkCommand.displayName ?? "Command";

const CommandDialog = ({
  contentClassName,
  overlayClassName,
  ...props
}: React.ComponentProps<typeof CmdkCommandDialog>) => (
  <CmdkCommandDialog
    overlayClassName={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      overlayClassName
    )}
    contentClassName={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg",
      contentClassName
    )}
    {...props}
  />
);
CommandDialog.displayName = CmdkCommandDialog.displayName ?? "CommandDialog";

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandInput>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandInput> & { suffix?: React.ReactNode }
>(({ className, suffix, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-border px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
    <CmdkCommandInput
      ref={ref}
      className={cn(
        "flex h-11 flex-1 rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
    {suffix}
  </div>
));
CommandInput.displayName = CmdkCommandInput.displayName ?? "CommandInput";

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandList>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandList>
>(({ className, ...props }, ref) => (
  <CmdkCommandList
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = CmdkCommandList.displayName ?? "CommandList";

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandEmpty>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandEmpty>
>(({ className, ...props }, ref) => (
  <CmdkCommandEmpty
    ref={ref}
    className={cn("py-6 text-center text-sm text-muted-foreground", className)}
    {...props}
  />
));
CommandEmpty.displayName = CmdkCommandEmpty.displayName ?? "CommandEmpty";

const CommandGroup = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandGroup>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandGroup>
>(({ className, ...props }, ref) => (
  <CmdkCommandGroup
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
));
CommandGroup.displayName = CmdkCommandGroup.displayName ?? "CommandGroup";

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandItem>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandItem>
>(({ className, ...props }, ref) => (
  <CmdkCommandItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-muted data-[selected=true]:text-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = CmdkCommandItem.displayName ?? "CommandItem";

const CommandSeparator = React.forwardRef<
  React.ComponentRef<typeof CmdkCommandSeparator>,
  React.ComponentPropsWithoutRef<typeof CmdkCommandSeparator>
>(({ className, ...props }, ref) => (
  <CmdkCommandSeparator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CmdkCommandSeparator.displayName ?? "CommandSeparator";

function CommandShortcut({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
