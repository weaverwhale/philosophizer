import { getPool } from '../db/connection';

export interface SessionInfo {
  id: string;
  userId: string;
  sessionToken: string;
  ipAddress?: string;
  userAgent?: string;
  startedAt: Date;
  lastActivityAt: Date;
}

export interface UserEvent {
  id: string;
  userId: string;
  sessionId?: string;
  eventType: string;
  eventCategory?: string;
  eventData?: Record<string, any>;
  createdAt: Date;
}

export interface DailyStats {
  userId: string;
  date: Date;
  messagesSent: number;
  conversationsCreated: number;
  conversationsDeleted: number;
  toolsUsed: number;
  sessionCount: number;
  totalSessionDurationSeconds: number;
}

/**
 * Create or update a user session
 */
export async function trackSession(
  userId: string,
  sessionToken: string,
  ipAddress?: string,
  userAgent?: string
): Promise<SessionInfo | null> {
  try {
    const pool = getPool();

    // Check if session already exists
    const existingSession = await pool.query(
      `SELECT id, user_id, session_token, ip_address, user_agent, started_at, last_activity_at
       FROM user_sessions 
       WHERE session_token = $1 AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [sessionToken]
    );

    if (existingSession.rows.length > 0) {
      // Update existing session activity
      await pool.query(
        `UPDATE user_sessions 
         SET last_activity_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [existingSession.rows[0].id]
      );

      return {
        id: existingSession.rows[0].id,
        userId: existingSession.rows[0].user_id,
        sessionToken: existingSession.rows[0].session_token,
        ipAddress: existingSession.rows[0].ip_address,
        userAgent: existingSession.rows[0].user_agent,
        startedAt: existingSession.rows[0].started_at,
        lastActivityAt: new Date(),
      };
    }

    // Create new session
    const result = await pool.query(
      `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, session_token, ip_address, user_agent, started_at, last_activity_at`,
      [userId, sessionToken, ipAddress, userAgent]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      sessionToken: row.session_token,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
    };
  } catch (error) {
    console.error('Error tracking session:', error);
    return null;
  }
}

/**
 * End a user session
 */
export async function endSession(sessionId: string): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE user_sessions 
       SET ended_at = CURRENT_TIMESTAMP 
       WHERE id = $1 AND ended_at IS NULL`,
      [sessionId]
    );
    return true;
  } catch (error) {
    console.error('Error ending session:', error);
    return false;
  }
}

/**
 * Track a user event
 */
export async function trackEvent(
  userId: string,
  eventType: string,
  eventCategory?: string,
  eventData?: Record<string, any>,
  sessionId?: string
): Promise<UserEvent | null> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO user_events (user_id, session_id, event_type, event_category, event_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, session_id, event_type, event_category, event_data, created_at`,
      [userId, sessionId || null, eventType, eventCategory || null, eventData ? JSON.stringify(eventData) : null]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      eventType: row.event_type,
      eventCategory: row.event_category,
      eventData: row.event_data,
      createdAt: row.created_at,
    };
  } catch (error) {
    console.error('Error tracking event:', error);
    return null;
  }
}

/**
 * Get user events with optional filters
 */
export async function getUserEvents(
  userId: string,
  options?: {
    eventType?: string;
    eventCategory?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<UserEvent[]> {
  try {
    const pool = getPool();
    let query = `SELECT id, user_id, session_id, event_type, event_category, event_data, created_at
                 FROM user_events
                 WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (options?.eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(options.eventType);
      paramIndex++;
    }

    if (options?.eventCategory) {
      query += ` AND event_category = $${paramIndex}`;
      params.push(options.eventCategory);
      paramIndex++;
    }

    if (options?.startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(options.endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      eventType: row.event_type,
      eventCategory: row.event_category,
      eventData: row.event_data,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Error getting user events:', error);
    return [];
  }
}

/**
 * Get daily stats for a user
 */
export async function getUserDailyStats(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<DailyStats[]> {
  try {
    const pool = getPool();
    let query = `SELECT user_id, date, messages_sent, conversations_created, 
                        conversations_deleted, tools_used, session_count, 
                        total_session_duration_seconds
                 FROM user_daily_stats
                 WHERE user_id = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(endDate);
    }

    query += ` ORDER BY date DESC`;

    const result = await pool.query(query, params);

    return result.rows.map(row => ({
      userId: row.user_id,
      date: row.date,
      messagesSent: row.messages_sent,
      conversationsCreated: row.conversations_created,
      conversationsDeleted: row.conversations_deleted,
      toolsUsed: row.tools_used,
      sessionCount: row.session_count,
      totalSessionDurationSeconds: row.total_session_duration_seconds,
    }));
  } catch (error) {
    console.error('Error getting user daily stats:', error);
    return [];
  }
}

/**
 * Get aggregate stats for all users (admin only)
 */
export async function getAggregateStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalUsers: number;
  activeUsers: number;
  totalMessages: number;
  totalConversations: number;
  totalSessions: number;
  averageSessionDuration: number;
  topEventTypes: Array<{ eventType: string; count: number }>;
}> {
  try {
    const pool = getPool();
    
    // Build date filter
    let dateFilter = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      dateFilter += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      dateFilter += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
    }

    // Total and active users
    const usersResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT id) as total_users,
        COUNT(DISTINCT CASE WHEN id IN (
          SELECT DISTINCT user_id FROM user_events 
          WHERE created_at >= NOW() - INTERVAL '30 days'
        ) THEN id END) as active_users
      FROM users
    `);

    // Total messages and conversations
    const eventsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE event_type = 'message_sent') as total_messages,
        COUNT(*) FILTER (WHERE event_type = 'conversation_created') as total_conversations
       FROM user_events
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // Session stats
    const sessionsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        AVG(EXTRACT(EPOCH FROM (COALESCE(ended_at, last_activity_at) - started_at))) as avg_duration
       FROM user_sessions
       WHERE 1=1 ${dateFilter.replace(/created_at/g, 'started_at')}`,
      params
    );

    // Top event types
    const topEventsResult = await pool.query(
      `SELECT event_type, COUNT(*) as count
       FROM user_events
       WHERE 1=1 ${dateFilter}
       GROUP BY event_type
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    return {
      totalUsers: parseInt(usersResult.rows[0]?.total_users || '0'),
      activeUsers: parseInt(usersResult.rows[0]?.active_users || '0'),
      totalMessages: parseInt(eventsResult.rows[0]?.total_messages || '0'),
      totalConversations: parseInt(eventsResult.rows[0]?.total_conversations || '0'),
      totalSessions: parseInt(sessionsResult.rows[0]?.total_sessions || '0'),
      averageSessionDuration: parseFloat(sessionsResult.rows[0]?.avg_duration || '0'),
      topEventTypes: topEventsResult.rows.map(row => ({
        eventType: row.event_type,
        count: parseInt(row.count),
      })),
    };
  } catch (error) {
    console.error('Error getting aggregate stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalMessages: 0,
      totalConversations: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      topEventTypes: [],
    };
  }
}

/**
 * Aggregate daily stats for a specific user and date
 */
export async function aggregateDailyStats(
  userId: string,
  date: Date
): Promise<boolean> {
  try {
    const pool = getPool();
    await pool.query(
      `SELECT aggregate_user_daily_stats($1, $2)`,
      [userId, date]
    );
    return true;
  } catch (error) {
    console.error('Error aggregating daily stats:', error);
    return false;
  }
}

/**
 * Get active sessions count
 */
export async function getActiveSessionsCount(userId?: string): Promise<number> {
  try {
    const pool = getPool();
    let query = `SELECT COUNT(*) as count
                 FROM user_sessions
                 WHERE ended_at IS NULL 
                 AND last_activity_at >= NOW() - INTERVAL '1 hour'`;
    const params: any[] = [];

    if (userId) {
      query += ` AND user_id = $1`;
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    console.error('Error getting active sessions count:', error);
    return 0;
  }
}

/**
 * Get session info from token
 */
export async function getSessionFromToken(sessionToken: string): Promise<SessionInfo | null> {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, user_id, session_token, ip_address, user_agent, started_at, last_activity_at
       FROM user_sessions 
       WHERE session_token = $1 AND ended_at IS NULL
       ORDER BY started_at DESC
       LIMIT 1`,
      [sessionToken]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      sessionToken: row.session_token,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
    };
  } catch (error) {
    console.error('Error getting session from token:', error);
    return null;
  }
}

