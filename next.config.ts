import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://rbkpzpaarsaoorgfyfvh.supabase.co/storage/**"),
    ],
  },
};

export default nextConfig;
