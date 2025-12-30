#!/bin/bash

# Script to test analytics endpoints
# Usage: ./test-analytics.sh <auth-token>

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <auth-token>"
    echo "Example: $0 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    exit 1
fi

AUTH_TOKEN=$1
BASE_URL="${BASE_URL:-http://localhost:1738}"

echo "🧪 Testing Analytics Endpoints"
echo "================================"
echo ""

# Test 1: Get events
echo "📋 Test 1: Get recent events"
echo "GET $BASE_URL/analytics/events?limit=5"
echo ""
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/analytics/events?limit=5" | \
    jq '.' || echo "Failed or no JSON response"
echo ""
echo "---"
echo ""

# Test 2: Get daily stats
echo "📊 Test 2: Get daily stats"
echo "GET $BASE_URL/analytics/daily-stats"
echo ""
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/analytics/daily-stats" | \
    jq '.' || echo "Failed or no JSON response"
echo ""
echo "---"
echo ""

# Test 3: Get summary
echo "📈 Test 3: Get activity summary"
echo "GET $BASE_URL/analytics/summary"
echo ""
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/analytics/summary" | \
    jq '.' || echo "Failed or no JSON response"
echo ""
echo "---"
echo ""

# Test 4: Get specific event types
echo "💬 Test 4: Get message events only"
echo "GET $BASE_URL/analytics/events?eventType=message_sent&limit=3"
echo ""
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/analytics/events?eventType=message_sent&limit=3" | \
    jq '.' || echo "Failed or no JSON response"
echo ""
echo "---"
echo ""

# Test 5: Get aggregate stats (may require admin)
echo "🌐 Test 5: Get aggregate stats"
echo "GET $BASE_URL/analytics/aggregate"
echo ""
curl -s -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/analytics/aggregate" | \
    jq '.' || echo "Failed or no JSON response"
echo ""
echo "---"
echo ""

echo "✅ Tests complete!"
echo ""
echo "💡 Tips:"
echo "  - Use 'jq' to format JSON output (install with: brew install jq)"
echo "  - Add date filters: ?startDate=2025-12-01&endDate=2025-12-31"
echo "  - Filter by category: ?eventCategory=chat"
echo "  - Paginate results: ?limit=50&offset=0"

