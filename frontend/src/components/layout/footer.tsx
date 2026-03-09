export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 px-4 py-5 sm:py-6 md:flex-row">
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          © {new Date().getFullYear()} RepoLens. All rights reserved.
        </p>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Terms
          </a>
        </nav>
      </div>
    </footer>
  );
}
