-- Philosophizer Database Schema
-- PostgreSQL 16+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ==========================================================================
-- Users Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==========================================================================
-- Magic Links Table (for passwordless authentication)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS magic_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(64) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);
CREATE INDEX IF NOT EXISTS idx_magic_links_user_id ON magic_links(user_id);
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);


-- ==========================================================================
-- Triggers
-- ==========================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Cleanup function for expired magic links (optional)
-- ==========================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
    DELETE FROM magic_links 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND used_at IS NULL;
END;
$$ LANGUAGE 'plpgsql';

-- ==========================================================================
-- Philosopher Text Chunks Table (RAG System with HQE)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS philosopher_text_chunks (
    id VARCHAR(255) PRIMARY KEY,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL, -- nomic-embed-text produces 768-dimensional vectors
    philosopher VARCHAR(255) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    start_char INTEGER DEFAULT 0,
    end_char INTEGER DEFAULT 0,
    questions TEXT[], -- HQE: Array of hypothetical questions this chunk answers
    question_embeddings vector(768)[], -- HQE: Embeddings for each hypothetical question
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_philosopher_text_chunks_philosopher ON philosopher_text_chunks(philosopher);
CREATE INDEX IF NOT EXISTS idx_philosopher_text_chunks_source_id ON philosopher_text_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_philosopher_text_chunks_chunk_index ON philosopher_text_chunks(chunk_index);

-- Vector similarity index using HNSW for fast approximate nearest neighbor search
-- Using cosine distance for semantic similarity
CREATE INDEX IF NOT EXISTS idx_philosopher_text_chunks_embedding ON philosopher_text_chunks 
USING hnsw (embedding vector_cosine_ops);

-- ==========================================================================
-- Conversations Table (with semantic search support)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    embedding vector(768), -- Embedding of title + conversation content for semantic search
    content_preview TEXT, -- First 500 chars of conversation for quick preview
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- Vector similarity index for conversation semantic search
CREATE INDEX IF NOT EXISTS idx_conversations_embedding ON conversations 
USING hnsw (embedding vector_cosine_ops);

-- ==========================================================================
-- Conversation Messages Table
-- ==========================================================================
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    parts JSONB, -- Store additional message parts as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON conversation_messages(created_at);

-- ==========================================================================
-- Additional Triggers
-- ==========================================================================
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

CREATE TRIGGER update_user_daily_stats_updated_at BEFORE UPDATE ON user_daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Functions for Usage Analytics
-- ==========================================================================

-- Function to aggregate daily stats for a user and date
CREATE OR REPLACE FUNCTION aggregate_user_daily_stats(p_user_id UUID, p_date DATE)
RETURNS void AS $$
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
$$ LANGUAGE 'plpgsql';

-- Function to update session last activity
CREATE OR REPLACE FUNCTION update_session_activity(p_session_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE user_sessions
    SET last_activity_at = CURRENT_TIMESTAMP
    WHERE id = p_session_id;
END;
$$ LANGUAGE 'plpgsql';

