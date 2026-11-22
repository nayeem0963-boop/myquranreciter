import type { MouseEvent, ReactNode } from "react";

export type NavTab = "read" | "library" | "bookmarks" | "settings";

interface BottomNavProps {
  active: NavTab;
  bookmarkCount: number;
  onRead: () => void;
  onLibrary: (trigger: HTMLElement) => void;
  onBookmarks: (trigger: HTMLElement) => void;
  onSettings: (trigger: HTMLElement) => void;
}

const svgProps = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONS: Record<NavTab, ReactNode> = {
  read: <svg {...svgProps}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M8 7h8M8 11h6" /></svg>,
  library: <svg {...svgProps}><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  bookmarks: <svg {...svgProps}><path d="M6 3h12v18l-6-4-6 4V3Z" /></svg>,
  settings: <svg {...svgProps}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>,
};

export default function BottomNav({ active, bookmarkCount, onRead, onLibrary, onBookmarks, onSettings }: BottomNavProps) {
  const item = (tab: NavTab, label: string, onClick: (event: MouseEvent<HTMLButtonElement>) => void, badge?: number) => (
    <button
      key={tab}
      className={`bottom-nav-item${active === tab ? " active" : ""}`}
      type="button"
      aria-current={active === tab ? "page" : undefined}
      onClick={onClick}
    >
      <span className="bottom-nav-icon">
        {ICONS[tab]}
        {badge ? <span className="bottom-nav-badge" aria-label={`${badge} saved`}>{badge}</span> : null}
      </span>
      <span className="bottom-nav-label">{label}</span>
    </button>
  );

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {item("read", "Read", () => onRead())}
      {item("library", "Library", (event) => onLibrary(event.currentTarget))}
      {item("bookmarks", "Saved", (event) => onBookmarks(event.currentTarget), bookmarkCount)}
      {item("settings", "Display", (event) => onSettings(event.currentTarget))}
    </nav>
  );
}
