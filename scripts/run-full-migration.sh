#!/bin/bash

# Full Migration Script
# This script resets the database and runs all migration phases in order
#
# MIGRATION SCOPE (Updated):
# Phase 1: Users (buyer + stylist → profiles + stylist_details + user_preferences)
# Phase 2: Addresses (MySQL address → PostgreSQL addresses with PostGIS)
# Phase 3: Services (category/subcategory → service_categories, services with trial session defaults)
# Phase 4: Bookings (MySQL booking → bookings with enhanced payment/trial fields)
# Phase 5: Payments (MySQL payment → payments with affiliate integration fields)
# Phase 6: Communication (chat + message → chats + chat_messages)
# Phase 7: Reviews (rating → reviews)
#
# NOT MIGRATED (Clean start or new features):
# - Discount system (old promocode) - Admin will create new discounts
# - Affiliate marketing system - New business model, starts fresh
# - Recurring availability - Stylists will reconfigure in new iCal system
# - Booking notes - New feature, starts post-migration
#
# Logs are written to: scripts/migration/logs/
# - session.log: Complete session log
# - errors.log: Error details
# - warnings.log: Warning messages
# - debug.log: Debug information (when DEBUG=true)
# - progress.log: Progress updates
# - validation-errors.log: Data validation errors

# Don't exit on error - we want to handle migration warnings gracefully
set +e

echo "🚀 Starting Full Migration Process"
echo "================================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Reset database
print_info "Step 1: Resetting database..."
if bun run supabase:db:reset:no-seed > /dev/null 2>&1; then
    print_status "Database reset completed"
else
    print_error "Database reset failed"
    exit 1
fi

echo ""

# Step 2: Run migration phases
PHASES=(1 2 3 4 5 6 7)
FAILED_PHASES=()
SUCCESSFUL_PHASES=()
WARNING_PHASES=()

for phase in "${PHASES[@]}"; do
    print_info "Running Phase $phase..."
    
    # Capture both output and exit code
    if output=$(bun scripts/migration/run-phase-$phase.ts 2>&1); then
        # Phase completed successfully
        print_status "Phase $phase completed successfully"
        SUCCESSFUL_PHASES+=($phase)
        
        # Check for warnings in output
        if echo "$output" | grep -q "⚠️\|WARNING"; then
            WARNING_PHASES+=($phase)
            print_warning "Phase $phase completed with warnings"
        fi
    else
        # Phase failed
        exit_code=$?
        print_error "Phase $phase failed (exit code: $exit_code)"
        FAILED_PHASES+=($phase)
        
        # Show last few lines of error output
        echo ""
        print_error "Error details:"
        echo "$output" | tail -5
        
        # Ask user if they want to continue with next phase
        echo ""
        print_warning "Phase $phase failed. Continue with next phase? (y/n)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Migration stopped by user"
            break
        fi
    fi
    
    echo ""
done

# Final summary
echo "================================================================"
echo "🏁 Migration Summary"
echo "================================================================"

total_phases=${#PHASES[@]}
successful_count=${#SUCCESSFUL_PHASES[@]}
failed_count=${#FAILED_PHASES[@]}
warning_count=${#WARNING_PHASES[@]}

print_info "Migration Statistics:"
print_info "  - Database reset: ✅"
print_info "  - Total phases: $total_phases"
print_info "  - Successful: $successful_count"
if [ $warning_count -gt 0 ]; then
    print_info "  - With warnings: $warning_count"
fi
print_info "  - Failed: $failed_count"

echo ""

if [ ${#SUCCESSFUL_PHASES[@]} -gt 0 ]; then
    print_status "Successful phases: ${SUCCESSFUL_PHASES[*]}"
fi

if [ ${#WARNING_PHASES[@]} -gt 0 ]; then
    print_warning "Phases with warnings: ${WARNING_PHASES[*]}"
fi

if [ ${#FAILED_PHASES[@]} -gt 0 ]; then
    print_error "Failed phases: ${FAILED_PHASES[*]}"
    echo ""
    print_warning "Review the error details above and fix issues before proceeding"
    exit 1
else
    echo ""
    if [ $warning_count -gt 0 ]; then
        print_warning "🎉 Migration completed with warnings!"
        print_info "Some phases completed with warnings but data was migrated successfully."
        print_info "This is normal for data that doesn't meet all constraints."
    else
        print_status "🎉 All migration phases completed successfully!"
    fi
    echo ""
    print_status "Your database has been fully migrated from MySQL to PostgreSQL!"
    print_info "You can now run your application with the migrated data."
fi