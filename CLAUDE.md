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

### Loading States

- Use `Spinner` component from `components/ui/kibo-ui/spinner/index.tsx`
- Implement proper loading states with React Suspense
- Show skeleton loaders for list items and cards, based on `Skeleton` component from `components/ui/skeleton.tsx`.

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

- Generate types: `bun gen:types`
- Create migrations: `bun supabase:db:diff <migration_name>`
- Apply migrations: `bun supabase:migrate:up`
- Push to production: `bun supabase:db:push`

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

- when running seed script, first run the seed script and then afterwards reset the database
- After making changes to the database, before running seed script again, we must run seed:sync to sync snaplet to the database