import { requireAuth } from '../middleware/auth';
import {
  getUserEvents,
  getUserDailyStats,
  getAggregateStats,
  getActiveSessionsCount,
} from '../utils/usageTracking';

/**
 * GET /analytics/events - Get user events
 * Query params:
 *  - eventType: Filter by event type
 *  - eventCategory: Filter by event category
 *  - startDate: Filter events after this date
 *  - endDate: Filter events before this date
 *  - limit: Limit number of results
 *  - offset: Pagination offset
 */
export const events = async (req: Request) => {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const url = new URL(req.url);
    const eventType = url.searchParams.get('eventType') || undefined;
    const eventCategory = url.searchParams.get('eventCategory') || undefined;
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');
    const limitStr = url.searchParams.get('limit');
    const offsetStr = url.searchParams.get('offset');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    const limit = limitStr ? parseInt(limitStr) : 100;
    const offset = offsetStr ? parseInt(offsetStr) : 0;

    const events = await getUserEvents(user.id, {
      eventType,
      eventCategory,
      startDate,
      endDate,
      limit,
      offset,
    });

    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get events error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /analytics/daily-stats - Get user daily statistics
 * Query params:
 *  - startDate: Filter stats after this date
 *  - endDate: Filter stats before this date
 */
export const dailyStats = async (req: Request) => {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const stats = await getUserDailyStats(user.id, startDate, endDate);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /analytics/summary - Get summary of user activity
 * Returns a quick overview of user activity statistics
 */
export const summary = async (req: Request) => {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    // Get last 30 days of events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentEvents, dailyStats, activeSessions] = await Promise.all([
      getUserEvents(user.id, {
        startDate: thirtyDaysAgo,
        limit: 1000,
      }),
      getUserDailyStats(user.id, thirtyDaysAgo),
      getActiveSessionsCount(user.id),
    ]);

    // Calculate summary statistics
    const eventTypeCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
    });

    const totalMessages = dailyStats.reduce((sum, day) => sum + day.messagesSent, 0);
    const totalConversations = dailyStats.reduce((sum, day) => sum + day.conversationsCreated, 0);
    const totalSessions = dailyStats.reduce((sum, day) => sum + day.sessionCount, 0);
    const avgMessagesPerDay = dailyStats.length > 0 ? totalMessages / dailyStats.length : 0;

    return new Response(
      JSON.stringify({
        period: {
          start: thirtyDaysAgo,
          end: new Date(),
          days: dailyStats.length,
        },
        totals: {
          messages: totalMessages,
          conversations: totalConversations,
          sessions: totalSessions,
          events: recentEvents.length,
        },
        averages: {
          messagesPerDay: Math.round(avgMessagesPerDay * 100) / 100,
        },
        activeSessions,
        eventTypes: eventTypeCounts,
        dailyStats: dailyStats.slice(0, 7), // Last 7 days
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Get summary error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET /analytics/aggregate - Get aggregate statistics for all users
 * This is an admin-only endpoint
 * Query params:
 *  - startDate: Filter stats after this date
 *  - endDate: Filter stats before this date
 */
export const aggregate = async (req: Request) => {
  try {
    const authResult = await requireAuth(req);
    if (authResult instanceof Response) return authResult;
    const { user } = authResult;

    // TODO: Add admin check here
    // For now, we'll allow any authenticated user to access this
    // In production, you should check if the user is an admin

    const url = new URL(req.url);
    const startDateStr = url.searchParams.get('startDate');
    const endDateStr = url.searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const stats = await getAggregateStats(startDate, endDate);

    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get aggregate stats error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

export const analytics = {
  '/analytics/events': { GET: events },
  '/analytics/daily-stats': { GET: dailyStats },
  '/analytics/summary': { GET: summary },
  '/analytics/aggregate': { GET: aggregate },
};

