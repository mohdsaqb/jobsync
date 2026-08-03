"use client";

import { useRef, useState } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Sparkles, UploadCloud } from "lucide-react";
import { cn } from "@/lib/cn";

const MIN_WIDTH = 76;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 264;
const COLLAPSE_THRESHOLD = 170;

type Screen = "upload" | "results" | "suggestions";

interface SidebarProps {
  screen: Screen;
  hasResults: boolean;
  onSelect: (screen: Screen) => void;
}

export default function Sidebar({ screen, hasResults, onSelect }: SidebarProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [lastExpandedWidth, setLastExpandedWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  const collapsed = width <= MIN_WIDTH + 4;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setDragging(true);
    dragStartX.current = e.clientX;
    dragStartWidth.current = width;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const next = dragStartWidth.current + (e.clientX - dragStartX.current);
    setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
  };

  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    setWidth((current) => {
      if (current < COLLAPSE_THRESHOLD) return MIN_WIDTH;
      setLastExpandedWidth(current);
      return current;
    });
  };

  const toggleCollapsed = () => {
    if (collapsed) {
      setWidth(lastExpandedWidth);
    } else {
      setLastExpandedWidth(width);
      setWidth(MIN_WIDTH);
    }
  };

  const navItems = [
    { key: "upload" as const, label: "Upload resume", icon: UploadCloud, disabled: false },
    { key: "results" as const, label: "Job matches", icon: Briefcase, disabled: !hasResults },
    { key: "suggestions" as const, label: "Improve resume", icon: Sparkles, disabled: !hasResults },
  ];

  return (
    <aside
      style={{ width }}
      className={cn(
        "relative z-10 flex shrink-0 select-none flex-col border-r border-white/10 bg-zinc-950/60 backdrop-blur-xl",
        !dragging && "transition-[width] duration-200 ease-out",
      )}
    >
      <div className={cn("flex items-center px-4 py-5", collapsed && "justify-center px-0")}>
        {collapsed ? (
          <span className="text-lg font-bold tracking-tight text-zinc-100">J</span>
        ) : (
          <span className="whitespace-nowrap text-base font-bold tracking-tight text-zinc-100">JobSync</span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2.5">
        {navItems.map(({ key, label, icon: ItemIcon, disabled }) => (
          <button
            key={key}
            type="button"
            onClick={() => !disabled && onSelect(key)}
            disabled={disabled}
            title={collapsed ? label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              collapsed && "justify-center px-0",
              disabled && "cursor-not-allowed text-zinc-600",
              !disabled && screen === key && "bg-white/10 text-zinc-50",
              !disabled && screen !== key && "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <ItemIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{label}</span>}
          </button>
        ))}
      </nav>

      <div className={cn("px-2.5 pb-4", collapsed && "flex justify-center px-0")}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Drag handle — grab anywhere along the right edge to resize; drag past the
          collapse threshold and release to snap into icon-only mode. */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className={cn(
          "absolute -right-1 top-0 z-20 h-full w-2 cursor-col-resize touch-none transition-colors",
          dragging ? "bg-indigo-400/50" : "bg-transparent hover:bg-white/10",
        )}
      />
    </aside>
  );
}
