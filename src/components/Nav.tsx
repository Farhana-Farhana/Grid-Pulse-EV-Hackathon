import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-grad-primary">
            <span className="font-display text-lg font-bold text-background">⚡</span>
            <span className="pulse-dot absolute inset-0 rounded-md" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold tracking-tight">
              GridPulse<span className="text-primary">.</span>EV
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              BESCOM · Decision Support
            </div>
          </div>
        </Link>
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <Link to="/" className="transition hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "text-foreground" }}>Overview</Link>
          <Link to="/operations" className="transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>Operations</Link>
          <Link to="/analytics" className="transition hover:text-foreground" activeProps={{ className: "text-foreground" }}>Analytics</Link>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-muted-foreground">Live · synthetic</span>
        </div>
      </div>
    </nav>
  );
}
