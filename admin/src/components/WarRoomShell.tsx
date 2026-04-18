"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  FlaskConical,
  LineChart,
  Menu,
  Moon,
  RefreshCw,
  Sun,
  Target,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Overview", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Boxes },
  { href: "/admin/reviews", label: "Reviews", icon: Target },
  { href: "/admin/trends", label: "Trends", icon: LineChart },
  { href: "/admin/directives", label: "Directives", icon: Zap },
  { href: "/admin/analyze", label: "Analyze", icon: FlaskConical },
];

function titleFor(pathname: string) {
  const item = NAV.find((n) => n.href === pathname);
  return item?.label || "VantageAI War Room";
}

export default function WarRoomShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [lastSynced, setLastSynced] = useState(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.remove("light");
    } else {
      html.classList.add("light");
    }
  }, [darkMode]);

  useEffect(() => {
    const i = setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastSynced) / 1000)), 1000);
    return () => clearInterval(i);
  }, [lastSynced]);

  useEffect(() => {
    const onSynced = () => setLastSynced(Date.now());
    window.addEventListener("warroom-synced", onSynced);
    return () => window.removeEventListener("warroom-synced", onSynced);
  }, []);

  const pageTitle = useMemo(() => titleFor(pathname), [pathname]);

  const refresh = () => {
    setLastSynced(Date.now());
    window.dispatchEvent(new CustomEvent("warroom-refresh"));
  };

  return (
    <div className="h-screen bg-bg text-text flex overflow-hidden">
      <aside
        className={`border-r border-border bg-surface transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        } flex-shrink-0`}
      >
        <div className="h-16 border-b border-border px-3 flex items-center justify-between">
          <div className={`flex items-center gap-2 ${collapsed ? "justify-center w-full" : ""}`}>
            <span className="w-8 h-8 rounded-lg bg-accent inline-flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </span>
            {!collapsed && <span className="font-black">War Room</span>}
          </div>
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} className="p-1.5 rounded hover:bg-surface-2">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {collapsed && (
            <button onClick={() => setCollapsed(false)} className="p-1.5 rounded hover:bg-surface-2">
              <Menu className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="p-2 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  active ? "bg-accent text-white" : "text-muted hover:bg-surface-2 hover:text-text"
                }`}
              >
                <Icon className="w-4 h-4" />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-border bg-surface px-4 flex items-center justify-between">
          <h1 className="font-black text-lg">{pageTitle}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-border bg-surface-2 hover:opacity-90"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Last synced: {secondsAgo}s ago
            </button>
            <span className="text-xs px-2.5 py-1 rounded-full bg-accent/20 text-accent border border-accent/30">
              SwiftCart × VantageAI
            </span>
            <button
              onClick={() => setDarkMode((v) => !v)}
              className="p-2 rounded-lg border border-border bg-surface-2"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto thin-scrollbar p-4">{children}</main>
      </div>
    </div>
  );
}
