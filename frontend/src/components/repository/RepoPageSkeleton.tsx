"use client";

/* Skeleton matching RepoHeader: back button, title, meta chips, action buttons */
function RepoHeaderSkeleton() {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/80 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
      <div className="flex min-w-0 flex-1 basis-0 items-center gap-2 sm:gap-3">
        <div className="h-8 w-8 shrink-0 rounded-md bg-muted animate-pulse" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="h-4 max-w-[200px] rounded bg-muted animate-pulse sm:h-5 sm:max-w-[280px]" />
          <div className="flex gap-2">
            <div className="h-5 w-14 rounded bg-muted animate-pulse" />
            <div className="h-5 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/* Skeleton matching Chat/Docs toggle */
function MobileToggleSkeleton() {
  return (
    <div className="flex shrink-0 flex-col pb-4 pt-3">
      <div className="flex justify-center gap-1 rounded-xl bg-muted/50 p-1.5">
        <div className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
        <div className="h-9 flex-1 rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/* Skeleton matching RepoChat: input + message area */
function RepoChatSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col rounded-xl border border-border bg-card/30 overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <div className="mb-4 flex justify-center">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex justify-end">
            <div className="h-12 max-w-[85%] rounded-lg rounded-br-sm bg-muted animate-pulse sm:max-w-[70%]" />
          </div>
          <div className="flex justify-start">
            <div className="h-16 max-w-[90%] rounded-lg rounded-bl-sm bg-muted animate-pulse sm:max-w-[75%]" />
          </div>
          <div className="flex justify-end">
            <div className="h-10 max-w-[60%] rounded-lg rounded-br-sm bg-muted animate-pulse" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full max-w-sm rounded bg-muted animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-border p-3 sm:p-4">
        <div className="h-10 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/* Skeleton matching RepoPreviewPanel: tabs + content */
function RepoPreviewPanelSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex shrink-0 items-center border-b border-border bg-muted/30">
        <div className="flex flex-1 gap-1 p-2 sm:p-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 flex-1 rounded bg-muted animate-pulse" />
          ))}
        </div>
        <div className="m-2 h-8 w-8 shrink-0 rounded bg-muted animate-pulse" />
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-4">
        <div className="space-y-3">
          <div className="h-6 w-3/4 max-w-md rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-full max-w-[90%] rounded bg-muted animate-pulse" />
          <div className="h-4 w-2/3 max-w-sm rounded bg-muted animate-pulse" />
          <div className="mt-4 h-4 w-1/2 max-w-xs rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-full max-w-[85%] rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function RepoPageSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-2 overflow-x-hidden overflow-y-hidden p-2 sm:gap-4 sm:p-4">
      <header className="shrink-0">
        <RepoHeaderSkeleton />
      </header>

      {/* Mobile skeleton */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:hidden">
        <MobileToggleSkeleton />
        <div className="min-h-0 flex-1 overflow-hidden">
          <RepoChatSkeleton />
        </div>
      </div>

      {/* Desktop skeleton: two panels (matches RepoResizableLayout ~35% / 65%) */}
      <div className="hidden min-h-0 flex-1 flex-col overflow-hidden md:flex">
        <div className="flex h-full min-h-0 w-full overflow-hidden">
          <div className="flex min-h-0 w-[35%] shrink-0 overflow-hidden">
            <RepoChatSkeleton />
          </div>
          <div className="w-1 shrink-0 bg-border" aria-hidden />
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <RepoPreviewPanelSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
