#!/bin/bash

# Test script for dev cron jobs using curl
# This script tests the dev payment and payout processing endpoints

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SERVER_URL="http://localhost:3000"
SHOW_HELP=false

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Test dev cron jobs using curl with CRON_SECRET authentication"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -u, --url URL           Server URL (default: http://localhost:3000)"
    echo "  -p, --payments          Test payment processing only"
    echo "  -o, --payouts           Test payout processing only"
    echo ""
    echo "Examples:"
    echo "  $0                      # Test both payment and payout processing"
    echo "  $0 -p                   # Test payment processing only"
    echo "  $0 -o                   # Test payout processing only"
    echo "  $0 -u http://localhost:4000  # Use different server URL"
    echo ""
    echo "Requirements:"
    echo "  - CRON_SECRET must be set in .env.local"
    echo "  - Server must be running in development mode"
    echo "  - curl must be installed"
}

# Parse command line arguments
PAYMENTS_ONLY=false
PAYOUTS_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -u|--url)
            SERVER_URL="$2"
            shift 2
            ;;
        -p|--payments)
            PAYMENTS_ONLY=true
            shift
            ;;
        -o|--payouts)
            PAYOUTS_ONLY=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Function to load environment variables
load_env() {
    if [ -f ".env.local" ]; then
        # Load environment variables, handling quoted values properly
        set -o allexport
        source .env.local
        set +o allexport
        echo -e "${GREEN}✓ Loaded environment variables from .env.local${NC}"
    else
        echo -e "${RED}✗ .env.local not found. Please create it with CRON_SECRET variable.${NC}"
        exit 1
    fi
}

# Function to check if CRON_SECRET is set
check_cron_secret() {
    if [ -z "$CRON_SECRET" ]; then
        echo -e "${RED}✗ CRON_SECRET is not set in environment variables${NC}"
        echo -e "${YELLOW}Please add CRON_SECRET to your .env.local file${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ CRON_SECRET found${NC}"
}

# Function to check if curl is available
check_curl() {
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}✗ curl is not installed${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ curl is available${NC}"
}

# Function to test server connectivity
test_server() {
    echo -e "${BLUE}Testing server connectivity...${NC}"
    if curl -s --connect-timeout 5 "$SERVER_URL" > /dev/null; then
        echo -e "${GREEN}✓ Server is running at $SERVER_URL${NC}"
    else
        echo -e "${RED}✗ Cannot connect to server at $SERVER_URL${NC}"
        echo -e "${YELLOW}Make sure your Next.js dev server is running with 'bun dev'${NC}"
        exit 1
    fi
}

# Function to make API request
make_request() {
    local endpoint="$1"
    local description="$2"
    
    echo ""
    echo -e "${BLUE}Testing $description...${NC}"
    echo -e "${YELLOW}Endpoint: $SERVER_URL$endpoint${NC}"
    
    # Make the request and capture both output and HTTP status
    local response
    local http_code
    
    response=$(curl -s -w "\\nHTTP_STATUS:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $CRON_SECRET" \
        -H "Content-Type: application/json" \
        "$SERVER_URL$endpoint")
    
    # Extract HTTP status code
    http_code=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    # Remove HTTP status from response body
    response=$(echo "$response" | sed '/HTTP_STATUS:/d')
    
    echo -e "${YELLOW}Response (HTTP $http_code):${NC}"
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ Success${NC}"
        # Pretty print JSON if possible
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.' 2>/dev/null || echo "$response"
        else
            echo "$response"
        fi
    elif [ "$http_code" -eq 401 ]; then
        echo -e "${RED}✗ Unauthorized (401)${NC}"
        echo "Check your CRON_SECRET or make sure you're in development mode"
        echo "$response"
    elif [ "$http_code" -eq 403 ]; then
        echo -e "${RED}✗ Forbidden (403)${NC}"
        echo "This endpoint is not available in production mode"
        echo "$response"
    else
        echo -e "${RED}✗ Failed (HTTP $http_code)${NC}"
        echo "$response"
    fi
}

# Main execution
echo -e "${BLUE}=== Dev Cron Job Testing Script ===${NC}"
echo ""

# Pre-flight checks
load_env
check_cron_secret
check_curl
test_server

echo ""
echo -e "${GREEN}All checks passed! Starting tests...${NC}"

# Run tests based on options
if [ "$PAYMENTS_ONLY" = true ]; then
    make_request "/api/dev/trigger-payment-processing" "Payment Processing"
elif [ "$PAYOUTS_ONLY" = true ]; then
    make_request "/api/dev/trigger-payout-processing" "Payout Processing"
else
    make_request "/api/dev/trigger-payment-processing" "Payment Processing"
    make_request "/api/dev/trigger-payout-processing" "Payout Processing"
fi

echo ""
echo -e "${GREEN}=== Testing Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Check your dev server logs for detailed processing information"
echo "2. Verify the results in your database"
echo "3. Check if emails were sent (look for [DEV] prefix in subjects)"
echo ""
echo -e "${BLUE}Pro tip: Use 'bun run test:dev:cron -h' to see all options${NC}"