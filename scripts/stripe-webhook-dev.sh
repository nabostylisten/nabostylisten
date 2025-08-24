#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Stripe Webhook Development Setup${NC}"
echo "================================================"

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo -e "${RED}Stripe CLI is not installed. Please install it first:${NC}"
    echo "brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed. Please install it first:${NC}"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

# Check if logged in to Stripe
echo -e "${YELLOW}Checking Stripe login status...${NC}"
if ! stripe config --list &> /dev/null; then
    echo -e "${YELLOW}Not logged in to Stripe. Logging in...${NC}"
    stripe login
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down services...${NC}"
    # Kill the Edge Functions server
    pkill -f "supabase functions serve"
    # Kill the Stripe listener
    pkill -f "stripe listen"
    echo -e "${GREEN}Cleanup complete!${NC}"
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start Supabase Edge Functions in the background
echo -e "${GREEN}Starting Supabase Edge Functions server...${NC}"
supabase functions serve --env-file ./supabase/functions/.env &
FUNCTIONS_PID=$!

# Wait for the functions server to be ready
echo -e "${YELLOW}Waiting for Edge Functions server to start...${NC}"
sleep 5

# Check if the functions server is running
if ! curl -s http://localhost:54321/functions/v1 > /dev/null; then
    echo -e "${RED}Edge Functions server failed to start!${NC}"
    exit 1
fi

echo -e "${GREEN}Edge Functions server is running!${NC}"

# Start Stripe webhook listener
echo -e "${GREEN}Starting Stripe webhook listener...${NC}"
echo -e "${YELLOW}Forwarding webhooks to: http://localhost:54321/functions/v1/stripe-sync${NC}"
echo ""
echo -e "${GREEN}Setup complete! You can now:${NC}"
echo "1. Trigger test events: stripe trigger payment_intent.succeeded"
echo "2. Make real Stripe API calls from your app"
echo "3. Check the database for synced data in the 'stripe' schema"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Run Stripe listener in the foreground
stripe listen --forward-to localhost:54321/functions/v1/stripe-sync