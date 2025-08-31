# Discount System - Business Documentation

## Overview

The Nabostylisten discount system enables promotional campaigns through flexible discount codes that customers can apply during booking. The system supports percentage-based and fixed-amount discounts with comprehensive business rules for usage control, customer targeting, and order restrictions.

## Business Value

### Revenue Impact

- **Customer Acquisition**: First-time customer discounts (e.g., "VELKOMMEN20" - 20% off)
- **Customer Retention**: Loyalty programs with multiple-use discounts (e.g., "LOYALTY5X" - 5 uses per customer)
- **Seasonal Campaigns**: Time-limited promotions to drive bookings during specific periods
- **Premium Customer Programs**: VIP discounts with user restrictions and high-value thresholds

### Marketing Benefits

- **Campaign Tracking**: Monitor discount usage and conversion rates
- **Customer Segmentation**: Target specific users with exclusive discount codes
- **Seasonal Promotions**: Create urgency with time-limited offers
- **Referral Programs**: Enable affiliate marketing through specialized discount codes

## Discount Types

### 1. Percentage Discounts

- **Range**: 1% - 99% of order value
- **Use Cases**:
  - New customer welcome offers (20-30%)
  - Seasonal sales (15-50%)
  - VIP customer rewards (40-99%)
- **Example**: "VELKOMMEN20" gives 20% off orders above 500 NOK

### 2. Fixed Amount Discounts

- **Currency**: Norwegian Kroner (NOK), stored as øre in database
- **Range**: 50 NOK - 1000+ NOK off
- **Use Cases**:
  - Small trial discounts (50-100 NOK)
  - Premium service discounts (500-1000 NOK)
  - Loyalty rewards (75-200 NOK)
- **Example**: "SOMMER100" gives 100 NOK off orders above 800 NOK

## Business Rules

### Activation and Validity

- **Active Status**: Discounts must be explicitly activated by admins
- **Time Windows**: Configure start date and optional expiration date
- **Never Expires**: Some discounts can run indefinitely (e.g., loyalty programs)

### Usage Controls

- **Global Limits**: Maximum total uses across all customers
- **Per-Customer Limits**: Prevent abuse by limiting uses per individual
- **Sold Out Protection**: Automatic deactivation when max uses reached

### Order Requirements

- **Minimum Amount**: Ensure profitability with minimum order thresholds
- **Maximum Amount**: Cap discount impact for percentage-based codes
- **Sweet Spots**: Create narrow ranges (e.g., 200-300 NOK) for targeted promotions

### Customer Targeting

- **Public Discounts**: Available to all customers
- **Restricted Discounts**: Limited to specific customer lists
- **VIP Programs**: Exclusive access for premium customers

## Customer Experience

### Application Process

1. **Code Entry**: Customers enter discount codes during booking checkout
2. **Real-Time Validation**: Immediate feedback on code validity and savings
3. **Error Messaging**: Clear Norwegian-language error messages for invalid codes
4. **Savings Display**: Prominent display of discount amount and final price

### Success States

- **Valid Code**: Green checkmark with savings amount
- **Applied Discount**: Clear breakdown in order summary
- **Removal Option**: Easy way to remove applied discount

### Error Scenarios

- **Invalid Code**: "Rabattkoden finnes ikke" (Code doesn't exist)
- **Expired**: "Rabattkoden har utløpt" (Code has expired)
- **Not Yet Active**: "Rabattkoden er ikke gyldig ennå" (Code not active yet)
- **Max Uses Reached**: "Rabattkoden har nådd maksimalt antall bruk" (Global limit reached)
- **User Limit**: "Du har allerede brukt denne rabattkoden maksimalt antall ganger" (Personal limit reached)
- **Insufficient Amount**: "Minimum ordrebeløp for denne rabattkoden er X kr" (Below minimum)
- **Restricted Access**: "Du har ikke tilgang til å bruke denne rabattkoden" (User not authorized)

## Admin Management

### Discount Creation

- **Code Requirements**: Unique, uppercase alphanumeric codes
- **Type Selection**: Percentage or fixed amount (mutually exclusive)
- **Time Configuration**: Start date, optional end date
- **Usage Limits**: Global and per-user maximums
- **Order Constraints**: Minimum and optional maximum order amounts
- **Customer Restrictions**: Optional user-specific access control

### Monitoring and Analytics

- **Usage Tracking**: Real-time usage counts and remaining availability
- **Customer Analytics**: Track which customers use which discounts
- **Revenue Impact**: Monitor discount amounts and order values
- **Performance Metrics**: Conversion rates and customer acquisition costs

### Campaign Management

- **Status Control**: Activate/deactivate discounts instantly
- **Bulk Operations**: Export discount data for analysis
- **Filter Views**: Separate views for active, inactive, and expired discounts
- **Search Functionality**: Find discounts by code, description, or status

## Integration Points

### Booking System

- **Cart Integration**: Applied discounts update totals in real-time
- **Payment Processing**: Stripe receives final amount after discount
- **Invoice Generation**: Customer receipts show original price and discount
- **Payout Calculation**: Stylist payouts based on discounted amount

### Customer Communication

- **Email Receipts**: Discount details in booking confirmations
- **Marketing Emails**: Promotional codes in newsletter campaigns
- **SMS Campaigns**: Time-sensitive discount notifications
- **Website Banners**: Seasonal promotion announcements

## Success Metrics

### Financial KPIs

- **Revenue Per Discount**: Average order value with vs. without discounts
- **Customer Lifetime Value**: Long-term value of discount-acquired customers
- **Profit Margins**: Ensure discounts maintain healthy profit margins
- **Campaign ROI**: Marketing spend vs. discount-driven revenue

### Usage Analytics

- **Conversion Rate**: Percentage of codes that result in bookings
- **Popular Codes**: Most-used discounts for campaign optimization
- **Customer Segments**: Demographics of discount users
- **Seasonal Trends**: Time-based usage patterns

### Customer Satisfaction

- **Ease of Use**: Customer feedback on discount application process
- **Error Rates**: Frequency of failed discount applications
- **Support Tickets**: Discount-related customer service inquiries
- **Repeat Usage**: Customers who return to use additional discounts

## Common Business Scenarios

### New Customer Acquisition

- **"VELKOMMEN20"**: 20% off first booking, minimum 500 NOK
- **"PRØV50"**: 50 NOK off any service, no minimum
- **Target**: First-time platform users

### Seasonal Campaigns

- **"SOMMER100"**: Summer promotion, 100 NOK off 800+ NOK orders
- **"NEWYEAR2025"**: New Year campaign with limited-time availability
- **Target**: All active customers during specific periods

### Loyalty Programs

- **"LOYALTY5X"**: 75 NOK off, reusable 5 times per customer
- **"UNLIMITED10"**: 10% off with unlimited uses, long-term validity
- **Target**: Repeat customers and brand advocates

### Premium Customer Rewards

- **"VIP50"**: 50% off for selected customers, high-value orders only
- **"PREMIUM500"**: 500 NOK off for exclusive customer segment
- **Target**: High-value customers with purchase history

### Emergency Promotions

- **"TODAYONLY"**: 24-hour flash sale with immediate activation
- **"SOLDOUT"**: Limited quantity promotions to create urgency
- **Target**: All customers with time pressure

## Risk Management

### Fraud Prevention

- **User Limits**: Prevent single users from excessive discount abuse
- **IP Tracking**: Monitor for coordinated abuse patterns
- **Account Verification**: BankID verification for high-value discounts

### Financial Protection

- **Maximum Amounts**: Cap percentage discounts to prevent huge losses
- **Minimum Orders**: Ensure base profitability with order thresholds
- **Budget Controls**: Global usage limits to control campaign costs

### Operational Safety

- **Admin Controls**: Restrict discount creation to authorized staff
- **Audit Trails**: Track all discount modifications and usage
- **Emergency Deactivation**: Instant disable capability for problematic codes

## Future Opportunities

### Advanced Features

- **Dynamic Pricing**: Real-time discount adjustments based on demand
- **Bundled Discounts**: Multi-service discount packages
- **Referral Codes**: Customer-specific codes for word-of-mouth marketing
- **Geo-targeting**: Location-based discount availability

### Integration Expansion

- **Social Media**: Instagram/Facebook campaign integration
- **Partner Programs**: Stylist-generated promotional codes
- **Mobile App**: Push notification discount delivery
- **CRM Integration**: Customer behavior-triggered discount offers

### Analytics Enhancement

- **Predictive Modeling**: Forecast discount impact on revenue
- **A/B Testing**: Compare discount structures and messaging
- **Customer Journey**: Track discount influence throughout booking funnel
- **Competitive Analysis**: Monitor market discount trends
