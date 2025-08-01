import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY!;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST!;

if (!POSTHOG_KEY || !POSTHOG_HOST) {
    throw new Error(
        "NEXT_PUBLIC_POSTHOG_KEY or NEXT_PUBLIC_POSTHOG_HOST is not set",
    );
}

posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: "2025-05-24",
});
