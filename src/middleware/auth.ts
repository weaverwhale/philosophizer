import { getUserFromRequest, type User, extractToken } from '../utils/auth';
import { trackSession } from '../utils/usageTracking';

export interface AuthenticatedRequest extends Request {
  user?: User;
  sessionId?: string;
}

/**
 * Middleware to require authentication
 * Returns a 401 response if the user is not authenticated
 * Also tracks user session activity
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User; sessionId?: string } | Response> {
  const user = await getUserFromRequest(request);

  if (!user) {
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Authentication required',
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Track session activity
  const token = extractToken(request);
  let sessionId: string | undefined;

  if (token) {
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       undefined;
      const userAgent = request.headers.get('user-agent') || undefined;
      
      const session = await trackSession(user.id, token, ipAddress, userAgent);
      sessionId = session?.id;
    } catch (error) {
      // Log but don't fail the request if session tracking fails
      console.error('Session tracking error:', error);
    }
  }

  return { user, sessionId };
}

/**
 * Middleware to optionally get the authenticated user
 * Does not return an error if the user is not authenticated
 */
export async function optionalAuth(request: Request): Promise<User | null> {
  return getUserFromRequest(request);
}
