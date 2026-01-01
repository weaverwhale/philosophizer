import { getUserFromRequest, isAdmin, type User } from '../utils/auth';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to require authentication
 * Returns a 401 response if the user is not authenticated
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User } | Response> {
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

  return { user };
}

/**
 * Middleware to require admin authentication
 * Returns a 401 if not authenticated, 403 if not an admin
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User } | Response> {
  const authResult = await requireAuth(request);

  // If requireAuth returned a Response (error), return it
  if (authResult instanceof Response) {
    return authResult;
  }

  // Check if user is an admin
  if (!isAdmin(authResult.user)) {
    return new Response(
      JSON.stringify({
        error: 'Forbidden',
        message: 'Admin access required',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return authResult;
}

/**
 * Middleware to optionally get the authenticated user
 * Does not return an error if the user is not authenticated
 */
export async function optionalAuth(request: Request): Promise<User | null> {
  return getUserFromRequest(request);
}
