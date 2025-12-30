#!/bin/bash

# Migration script to add usage tracking tables to the database
# This script adds the usage tracking schema to an existing database

set -e  # Exit on error

echo "🔄 Starting database migration for usage tracking..."

# Get database connection string from environment or use default
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/philosophizer}"

echo "📊 Applying usage tracking schema..."

# Execute the SQL migration
psql "$DB_URL" << 'EOF'

-- ==========================================================================
-- User Sessions Table (for usage tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45), -- IPv4 and IPv6 compatible
    user_agent TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);

-- ==========================================================================
-- User Events Table (for detailed usage tracking)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- e.g., 'message_sent', 'conversation_created', 'tool_used', 'login', 'logout'
    event_category VARCHAR(50), -- e.g., 'chat', 'conversation', 'authentication', 'tool'
    event_data JSONB, -- Additional event-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_session_id ON user_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_events_event_type ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_event_category ON user_events(event_category);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);

-- GIN index for querying event_data JSONB
CREATE INDEX IF NOT EXISTS idx_user_events_event_data ON user_events USING gin (event_data);

-- ==========================================================================
-- User Daily Stats Table (for aggregated analytics)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS user_daily_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_sent INTEGER DEFAULT 0,
    conversations_created INTEGER DEFAULT 0,
    conversations_deleted INTEGER DEFAULT 0,
    tools_used INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    total_session_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_id ON user_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_date ON user_daily_stats(date DESC);

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $BODY$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$BODY$ language 'plpgsql';

CREATE TRIGGER update_user_daily_stats_updated_at BEFORE UPDATE ON user_daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Functions for Usage Analytics
-- ==========================================================================

-- Function to aggregate daily stats for a user and date
CREATE OR REPLACE FUNCTION aggregate_user_daily_stats(p_user_id UUID, p_date DATE)
RETURNS void AS $BODY$
BEGIN
    INSERT INTO user_daily_stats (user_id, date, messages_sent, conversations_created, conversations_deleted, tools_used, session_count)
    SELECT 
        p_user_id,
        p_date,
        COUNT(*) FILTER (WHERE event_type = 'message_sent'),
        COUNT(*) FILTER (WHERE event_type = 'conversation_created'),
        COUNT(*) FILTER (WHERE event_type = 'conversation_deleted'),
        COUNT(*) FILTER (WHERE event_type = 'tool_used'),
        (SELECT COUNT(DISTINCT session_id) FROM user_events 
         WHERE user_id = p_user_id 
         AND DATE(created_at) = p_date
         AND session_id IS NOT NULL)
    FROM user_events
    WHERE user_id = p_user_id
    AND DATE(created_at) = p_date
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        messages_sent = EXCLUDED.messages_sent,
        conversations_created = EXCLUDED.conversations_created,
        conversations_deleted = EXCLUDED.conversations_deleted,
        tools_used = EXCLUDED.tools_used,
        session_count = EXCLUDED.session_count,
        updated_at = CURRENT_TIMESTAMP;
END;
$BODY$ LANGUAGE 'plpgsql';

-- Function to update session last activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id UUID)
RETURNS void AS $BODY$
BEGIN
    UPDATE user_sessions
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END;
$BODY$ LANGUAGE 'plpgsql';

EOF

echo "✅ Migration completed successfully!"
echo ""
echo "📋 Summary of changes:"
echo "  - Created user_sessions table for tracking user sessions"
echo "  - Created user_events table for tracking detailed user actions"
echo "  - Created user_daily_stats table for aggregated daily statistics"
echo "  - Created helper functions for analytics"
echo ""
echo "🎉 Your database is now ready to track user usage!"
echo ""
echo "💡 Usage tracking will automatically capture:"
echo "  - User login/signup events"
echo "  - Message sent events"
echo "  - Conversation created/deleted events"
echo "  - Session activity"
echo ""
echo "📊 Access analytics through the following endpoints:"
echo "  GET /analytics/events       - Get detailed event log"
echo "  GET /analytics/daily-stats  - Get daily aggregated stats"
echo "  GET /analytics/summary      - Get activity summary"
echo "  GET /analytics/aggregate    - Get system-wide stats"

