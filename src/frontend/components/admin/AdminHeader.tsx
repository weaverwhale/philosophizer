import { Link } from 'react-router';
import { ThemeToggle } from '../ThemeToggle';

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-surface sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            title="Back to chat"
          >
            ←
          </Link>
          <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="text-sm text-text-muted">{userEmail}</span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
