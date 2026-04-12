import posthog from "posthog-js";
import { env } from "@/env";

if (typeof window !== "undefined") {
  posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage",
  });
}

export { posthog };
