import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../Logo';

interface MessageAvatarProps {
  role: 'user' | 'assistant';
}

function getUserInitials(email: string): string {
  if (!email) return 'U';

  // Get the part before @ symbol
  const username = email.split('@')[0];

  if (!username) return 'U';

  // Split by common separators and get initials
  const parts = username.split(/[._-]/).filter(Boolean);

  if (parts.length >= 2 && parts[0]?.[0] && parts[1]?.[0]) {
    // If we have multiple parts (like first.last), use first letter of each
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Otherwise, use first two letters of the username
  return username.substring(0, 2).toUpperCase();
}

export function MessageAvatar({ role }: MessageAvatarProps) {
  const { user } = useAuth();

  if (role === 'assistant') {
    return (
      <div className="shrink-0">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-green-600 p-1">
          <Logo width={12} height={12} invert margin="mb-1" />
        </div>
      </div>
    );
  }

  const initials = user?.email ? getUserInitials(user.email) : 'U';

  return (
    <div className="shrink-0">
      <div className="w-8 h-8 rounded-sm flex items-center justify-center bg-gray-700 text-white text-sm font-semibold">
        {initials}
      </div>
    </div>
  );
}
