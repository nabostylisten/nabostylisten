# Nabostylisten - Stylist Booking Platform

## Project Overview

Nabostylisten is a Norwegian marketplace platform connecting customers with professional stylists for beauty services. The platform enables customers to discover, book, and pay for various beauty services (hair, nails, makeup, lashes/brows, wedding) either at the stylist's location or at the customer's address.

### Key Features

- Service discovery with search, filtering, and geographical mapping
- Real-time booking system with calendar integration
- Secure payment processing via Stripe
- Real-time chat between customers and stylists
- Review and rating system
- Stylist application and approval workflow
- Admin dashboard for managing applications and categories

## Tech Stack

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS** - Utility-first CSS framework

### UI Libraries

- **shadcn/ui** - Primary component library
- **Kibo UI** - Additional specialized components
- **Magic UI** - Enhanced UI components
- **Mina Scheduler** - Calendar and booking system (<https://github.com/Mina-Massoud/mina-scheduler>)

### State Management & Data Fetching

- **Zustand** - Global state management with session storage persistence
- **TanStack Query** - Server state management and caching
- **React Hook Form** - Form handling with Zod validation

### Backend & Database

- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication system
  - Real-time subscriptions
  - File storage
  - Row Level Security (RLS)
- **Supabase Edge Functions** - Serverless functions (Deno runtime)

### External Services

- **Stripe** - Payment processing with Supabase Stripe Sync Engine
- **Resend** - Transactional email delivery
- **React Email** - Email template system
- **Mapbox** - Address autocomplete and geographical features
- **PostHog** - Analytics and error tracking
- **Brevo** - Newsletter management
- **Vercel** - Hosting and deployment

### Development Tools

- **Bun** - Package manager and runtime
- **Supazod** - Generate Zod schemas from Supabase types
- **ESLint** - Code linting
- **Supabase CLI** - Database management and migrations

## Code Conventions

### TypeScript Standards

- Use strict TypeScript configuration
- Prefer explicit type annotations for function parameters and return types
- Prefer function parameters as object `({p1, p2, p3})` instead of named parameters `(p1, p2, p3)`.
- Use type imports: `import type { ... } from '...'`
- Leverage generated database types from `types/database.types.ts`
- Use Zod schemas from `schemas/database.schema.ts` for validation
- Prefer to **infer** types from database instead of typing it. Example: `type Booking = DatabaseTables["bookings"]["Update"]` or `z.infer<typeof BookingStatusSchema>`

### Shared Filter Types Rule

- **Filter Type Location**: When client-side filters are saved in URL parameters AND used in server actions, store the shared filter types in `types/index.ts` (runtime-agnostic location)
- **Type Consistency**: Both client components and server actions must import from the same centralized type definition
- **Utility Functions**: Include URL parameter conversion utilities alongside the filter types
- **Examples**: `BookingFilters`, `ServiceFilters` with corresponding `searchParamsTo[FilterName]` and `[filterName]ToSearchParams` functions

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for components and types
- Use kebab-case for file names
- Use SCREAMING_SNAKE_CASE for constants
- Prefix custom hooks with `use`
- Suffix Zustand stores with `Store`

### Component Patterns

```typescript
// Prefer explicit prop types
interface ComponentProps {
  title: string;
  isVisible?: boolean;
  onAction: () => void;
}

export const Component = ({
  title,
  isVisible = false,
  onAction,
}: ComponentProps) => {
  // Component implementation
};
```

## Data Flow Architecture

### Client-Server Communication

- **Public pages** (landing, services listing): Server-side data fetching for SEO
- **Protected pages** (dashboard, bookings): Client-side data fetching with TanStack Query
- **Real-time features**: Supabase real-time subscriptions
- **Forms**: React Hook Form + Zod validation + TanStack Query mutations

### Server Actions Pattern

All server actions follow this structure with individual exported async functions:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { [tableName]InsertSchema } from "@/schemas/database.schema";

export async function get[EntityName](id: string) {
  const supabase = await createClient();
  return await supabase.from("[table]").select("*").eq("id", id);
}

export async function create[EntityName](data: Database["public"]["Tables"]["[table]"]["Insert"]) {
  const { success, data: validatedData } = [tableName]InsertSchema.safeParse(data);
  if (!success) {
    return { error: "Invalid data", data: null };
  }

  const supabase = await createClient();
  return await supabase.from("[table]").insert(validatedData);
}
```

### Form Handling Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

const form = useForm({
  resolver: zodResolver(schemaFromDatabase),
});

const mutation = useMutation({
  mutationFn: serverAction,
  onSuccess: () => toast.success("Success message"),
  onError: () => toast.error("Error message"),
});
```

## Database Management

### Schema Organization

- **Declarative schemas**: Define desired state in `supabase/schemas/`
- **Generated migrations**: Use `bun supabase:db:diff` to create migrations
- **Type generation**: `bun gen:types` generates TypeScript types and Zod schemas

### Key Database Tables

- `profiles` - User information and roles (customer/stylist/admin)
- `bookings` - Service bookings with status tracking
- `services` - Services offered by stylists
- `chats` & `chat_messages` - Real-time messaging
- `addresses` - Customer and stylist locations
- `applications` - Stylist applications with approval workflow

### Row Level Security (RLS)

- All tables have RLS policies defined in `supabase/schemas/01-policies.sql`
- Users can only access their own data unless explicitly granted
- Admin users have elevated permissions for management operations

## File Structure

```text
nabostylisten/
├── app/                    # Next.js app router pages
│   ├── auth/              # Authentication pages
│   ├── protected/         # Protected routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   │   └── kibo-ui/      # Kibo UI components
│   ├── schedule/         # Mina scheduler components
│   ├── skeletons/        # Loading state components
│   └── [feature]/        # Feature-specific components
├── docs/                 # Project documentation
│   ├── business/         # Business feature documentation
│   └── technical/        # Technical implementation docs
├── hooks/                # Custom React hooks
├── lib/                  # External service configurations
│   └── supabase/         # Supabase client configuration
├── providers/            # React context providers
├── schemas/              # Generated Zod schemas
├── scripts/              # Utility scripts
├── server/               # Server actions
├── stores/               # Zustand stores
├── supabase/             # Supabase configuration
│   ├── schemas/          # Declarative database schemas
│   ├── migrations/       # Generated SQL migrations
│   └── functions/        # Edge functions
├── transactional/        # React Email templates
└── types/                # TypeScript type definitions
```

## UI Component Patterns

### Component Library Priority

1. **shadcn/ui** - Primary choice for standard components
2. **Kibo UI** - Specialized components not in shadcn/ui
3. **Magic UI** - Enhanced animations and effects
4. **Custom components** - When existing libraries don't meet needs

### Styling Conventions

- Use semantic color classes: `primary`, `secondary`, `accent` instead of literal colors
- Leverage Tailwind's design system
- Use `cn()` utility for conditional classes
- Prefer composition over customization for component variants

### Color Pattern Standards

Always respect light and dark mode when using colors. Use Tailwind's color system with appropriate dark mode variants.

#### Color Usage Pattern

```tsx
// ✅ CORRECT - Respects both light and dark mode
<div className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
  <p className="text-green-800 dark:text-green-200">Success message</p>
</div>

// ❌ INCORRECT - No dark mode support
<div className="bg-green-50 border-green-200">
  <p className="text-green-800">Success message</p>
</div>
```

#### Standard Color Combinations

| Color | Light Background | Dark Background | Light Border | Dark Border | Light Text | Dark Text |
|-------|-----------------|-----------------|--------------|-------------|------------|----------|
| Green | `bg-green-50` | `dark:bg-green-950/30` | `border-green-200` | `dark:border-green-800` | `text-green-800` | `dark:text-green-200` |
| Red | `bg-red-50` | `dark:bg-red-950/30` | `border-red-200` | `dark:border-red-800` | `text-red-800` | `dark:text-red-200` |
| Blue | `bg-blue-50` | `dark:bg-blue-950/30` | `border-blue-200` | `dark:border-blue-800` | `text-blue-800` | `dark:text-blue-200` |
| Purple | `bg-purple-50` | `dark:bg-purple-950/30` | `border-purple-200` | `dark:border-purple-800` | `text-purple-800` | `dark:text-purple-200` |
| Amber | `bg-amber-50` | `dark:bg-amber-950/30` | `border-amber-200` | `dark:border-amber-800` | `text-amber-800` | `dark:text-amber-200` |
| Yellow | `bg-yellow-50` | `dark:bg-yellow-950/30` | `border-yellow-200` | `dark:border-yellow-800` | `text-yellow-800` | `dark:text-yellow-200` |

#### Real-World Examples

```tsx
// Success notification
<div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
  <p className="text-green-800 dark:text-green-200">Operation completed successfully</p>
</div>

// Error notification
<div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
  <p className="text-red-800 dark:text-red-200">An error occurred</p>
</div>

// Info card
<Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
  <CardHeader>
    <CardTitle className="text-blue-800 dark:text-blue-200">Information</CardTitle>
  </CardHeader>
</Card>

// Warning alert
<div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
  <p className="text-amber-900 dark:text-amber-100">Warning message</p>
</div>
```

#### Guidelines

- Always provide both light and dark mode variants
- Use `/30` opacity for dark backgrounds (e.g., `dark:bg-color-950/30`)
- Maintain sufficient contrast for accessibility
- Test color combinations in both light and dark modes
- Follow the established pattern consistently across the application

### Loading States

- Use `Spinner` component from `components/ui/kibo-ui/spinner/index.tsx`
- Implement proper loading states with React Suspense
- Show skeleton loaders for list items and cards, based on `Skeleton` component from `components/ui/skeleton.tsx`

### Animation Standards

Use the BlurFade component from `@/components/magicui/blur-fade` for consistent page animations.

**Component Location**: `components/magicui/blur-fade.tsx`

**Preferred Settings**:

- **Duration**: `0.5` seconds (good balance between smooth and snappy)
- **Delays**: Keep minimal for responsive feel
  - Single elements: `0.1` - `0.25` seconds
  - List items: Use index-based delays (`index * 0.1`) - this pattern is encouraged
  - Sequential sections: `0.12`, `0.15`, `0.2`, `0.25` seconds

**Usage Examples**:

```tsx
// Single element
<BlurFade duration={0.5} inView>
  <Card>Content</Card>
</BlurFade>

// With small delay
<BlurFade delay={0.1} duration={0.5} inView>
  <Section>Content</Section>
</BlurFade>

// List items with staggered animation (preferred for lists)
{items.map((item, index) => (
  <BlurFade key={item.id} delay={index * 0.1} duration={0.5} inView>
    <ItemCard item={item} />
  </BlurFade>
))}

// Loading states
<BlurFade duration={0.5} inView>
  <LoadingSkeleton />
</BlurFade>
```

**Guidelines**:

- Always use `inView` prop for performance
- Keep durations consistent across the app (prefer 0.5s)
- Use index-based delays for list animations
- Add BlurFade to loading states and skeleton components
- Avoid delays longer than 0.25s for individual elements

### Error Handling

- Use Sonner toast library for user feedback
- Implement error boundaries for component-level errors
- Use PostHog for error tracking and analytics

## Authentication Patterns

### User Roles

- **Customer** - Can book services, chat with stylists, leave reviews
- **Stylist** - Can offer services, manage availability, chat with customers
- **Admin** - Can manage applications, categories, and platform settings

### Protected Routes

- Middleware handles authentication at the route level
- Client-side checks for role-based access control
- Redirect to login for unauthenticated users

### Authentication Flow

- Email/OTP or Google OAuth via Supabase Auth
- Automatic profile creation on signup
- Newsletter subscription during registration

## State Management

### Zustand Stores

- **Shopping Cart** - Persisted in session storage

### TanStack Query Keys

- Use consistent query key patterns: `['entity', 'action', ...params]`
- Implement proper cache invalidation
- Use infinite queries for paginated lists

## Development Workflow

### Package Management

- Use `bun` for all package operations
- Install dependencies: `bun add <package>`
- Install dev dependencies: `bun add -D <package>`
- Add shadcn components: `bunx --bun shadcn@latest add <component>`

### Database Development

- Generate types from local database: `bun gen:types`
- Generate TypeScript types only: `bun supabase:db:types`
- Create migrations: `bun supabase:db:diff <migration_name>`
- Apply migrations: `bun supabase:migrate:up`
- Push to production: `bun supabase:db:push`

#### Local Database Type Generation

The `bun supabase:db:types` command automatically ensures your local Nabostylisten database is running before generating types:

1. Checks Docker is running
2. Verifies Nabostylisten database container is up and healthy
3. Generates TypeScript types from the local database schema
4. Provides clear error messages if prerequisites aren't met

For database verification only (no type generation): `bun ensure:nabostylisten-db`

### Documentation Standards

All new features and significant functionality changes must be documented in the `docs/` directory:

#### Business Documentation (`docs/business/`)

- **Purpose**: Document features from a business/user perspective
- **Audience**: Product managers, stakeholders, customer support
- **Content**:
  - Feature overview and business purpose
  - User workflows and use cases
  - Business rules and validation logic
  - Integration points with other features
  - Success metrics and KPIs
  - Future enhancement opportunities
- **Format**: Comprehensive markdown files with clear structure
- **Examples**: User journeys, feature specifications, business logic explanations

#### Technical Documentation (`docs/technical/`)

- **Purpose**: Document implementation details and architecture decisions
- **Audience**: Developers, DevOps, technical stakeholders
- **Content**:
  - API documentation and schemas
  - Database design and relationships
  - Architecture patterns and decisions
  - Performance considerations
  - Security implementations
  - Deployment procedures
- **Format**: Technical specifications, code examples, diagrams
- **Examples**: API references, database schemas, system architecture

#### Documentation Requirements

- **When to Document**: Create documentation for all new features, significant refactors, or complex business logic
- **Update Policy**: Keep documentation current with code changes
- **Review Process**: Documentation should be reviewed alongside code changes
- **Naming Convention**: Use kebab-case for file names, descriptive titles

### Code Quality

- Implement proper error handling
- Do NOT run `tsc` or `bun dev` or `bun build` to validate your changes. I will do that.

## Key Business Rules

### Booking Rules

- Customers can only book with one stylist at a time
- Bookings must be canceled 24+ hours in advance for refunds
- Payment is captured 24 hours before the appointment
- Services can be provided at customer's or stylist's location

### Stylist Application Process

- Applications go through: Applied → Pending Info → Approved/Rejected
- Email notifications for status changes
- Admin dashboard for application management

### Real-time Features

- Chat messages between customers and stylists
- Booking status updates
- Availability changes

## Scheduled Tasks & Automation

### Cron Jobs

- **Infrastructure**: Vercel Cron Jobs for scheduled task execution
- **Security**: Protected endpoints using `CRON_SECRET` environment variable
- **Configuration**: Defined in `vercel.json` with cron expressions
- **Location**: API routes in `/app/api/cron/[job-name]/route.ts`

### Active Cron Jobs

- **Chat Message Cleanup**: Monthly deletion of messages older than 5 years (1st of month, 3 AM UTC)
  - Preserves recent history for customer service
  - Reduces storage costs and maintains performance
  - Complies with data retention policies

### Testing Cron Jobs Locally

```bash
# Test with curl (requires CRON_SECRET env var)
curl -H "Authorization: Bearer your-secret-here" \
  http://localhost:3000/api/cron/cleanup-old-messages
```

## Database Seeding

### Seed Script Workflow

1. **Initial Seeding**:

   ```bash
   bun seed               # Run the seed script first
   bun supabase:db:reset  # Then reset the database
   ```

2. **After Database Schema Changes**:

   ```bash
   bun seed:sync          # Sync Snaplet with the new database schema
   bun seed               # Run the seed script
   bun supabase:db:reset  # Reset the database
   ```

### Important Notes

- Always run the seed script BEFORE resetting the database
- After modifying database schemas, you MUST run `seed:sync` to synchronize Snaplet with the database before seeding again
- This ensures that Snaplet generates data that matches your current schema
