"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { Workspace } from "@/lib/workspace";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  current: Workspace;
  onNavigate: (workspace: Workspace) => void;
  matchCount: number | null;
  hasResults: boolean;
  busy: boolean;
  children: ReactNode;
}

export default function AppShell({ current, onNavigate, children, busy, ...nav }: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [current]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-canvas">
      <aside className="hidden w-[244px] shrink-0 border-r border-hairline lg:block">
        <Sidebar current={current} onNavigate={onNavigate} {...nav} />
      </aside>

      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-slate-900/30"
          />
          <div className="absolute inset-y-0 left-0 w-[268px] max-w-[85vw] border-r border-hairline shadow-panel">
            <Sidebar
              current={current}
              onNavigate={onNavigate}
              onClose={() => setNavOpen(false)}
              {...nav}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header current={current} busy={busy} onOpenNav={() => setNavOpen(true)} />

        <main key={current} className="workspace-enter min-h-0 flex-1 overflow-y-auto scrollbar-slim">
          {children}
        </main>
      </div>
    </div>
  );
}
