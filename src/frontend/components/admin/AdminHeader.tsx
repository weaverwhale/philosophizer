import { NavigationButtons } from '../NavigationButtons';

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-text">Admin Panel</h1>
          <span className="text-sm text-text-muted"> | </span>
          {userEmail && (
            <span className="text-sm text-text-muted">{userEmail}</span>
          )}
        </div>
        <NavigationButtons />
      </div>
    </header>
  );
}
