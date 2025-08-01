import { runMigrations } from "@supabase/stripe-sync-engine";
(async () => {
    await runMigrations({
        databaseUrl: process.env.DATABASE_URL!,
        schema: "stripe",
        logger: console,
    });
})();
