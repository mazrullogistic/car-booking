"use client";

import { useEffect, useState } from "react";
import { logout, getCurrentUser, type AuthUser } from "@/lib/auth";
import { Button } from "./Button";

interface HeaderProps {
  onMenuClick: () => void;
  onCollapseClick: () => void;
  collapsed: boolean;
  title?: string;
}

export function Header({
  onMenuClick,
  onCollapseClick,
  collapsed,
  title = "Admin",
}: HeaderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  const initials = (user?.display_name ?? user?.username ?? "A")
    .charAt(0)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-border bg-card-bg px-3 sm:h-16 sm:gap-3 sm:px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-text-secondary hover:bg-border-light lg:hidden"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={onCollapseClick}
          className="hidden rounded-lg p-2 text-text-secondary hover:bg-border-light lg:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <h2 className="truncate text-sm font-medium text-text-secondary">
          {title}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">
              {user?.display_name ?? "Admin"}
            </span>
            {user?.tenant?.name && (
              <span className="text-xs text-text-muted">{user.tenant.name}</span>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => logout()}>
          Logout
        </Button>
      </div>
    </header>
  );
}
