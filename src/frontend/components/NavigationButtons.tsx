import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { ThemeToggle } from './ThemeToggle';

export const SearchButton = () => (
  <Link
    to="/search"
    className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
    title="Search the database"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  </Link>
);

export const AboutButton = () => (
  <Link
    to="/about"
    className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
    title="View indexed philosophers"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  </Link>
);

export const ChatButton = () => (
  <Link
    to="/"
    className="flex items-center justify-center w-9 h-9 bg-surface border border-border hover:bg-surface-secondary text-text-muted hover:text-text rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
    title="Back to chat"
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  </Link>
);

export const AdminButton = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) return null;

  return (
    <Link
      to="/admin"
      className="flex items-center justify-center w-9 h-9 bg-surface border border-red-600 text-red-600  rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-600 cursor-pointer"
      title="Admin panel"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </Link>
  );
};

export const NavigationButtons = ({
  children,
}: {
  children?: React.ReactNode;
}) => (
  <div className="flex items-center gap-2">
    {children}
    <ChatButton />
    <SearchButton />
    <AboutButton />
    <AdminButton />
    <ThemeToggle />
  </div>
);
