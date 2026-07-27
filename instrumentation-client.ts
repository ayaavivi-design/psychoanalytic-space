// Client-side analytics init (Next.js 16 instrumentation-client convention).
// Runs after the HTML loads, before React hydration.
//
// PRIVACY — this is a deliberately gated setup, matching Between's ephemeral core:
//   • autocapture OFF          — we never auto-record clicks/inputs
//   • capture_pageview OFF     — no automatic page tracking
//   • session recording OFF    — we never record the screen
//   • no identify()            — stays fully anonymous, no email/name/PII
// Only the four explicit events fired via window.bwTrack() are sent. Nothing else.
import posthog from 'posthog-js';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';

if (key) {
  try {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: 'always', // anonymous profiles — needed for retention, still no PII
    });
  } catch {
    /* analytics must never break the app */
  }
}

declare global {
  interface Window {
    bwTrack?: (event: string, props?: Record<string, unknown>) => void;
  }
}

if (typeof window !== 'undefined') {
  window.bwTrack = (event, props) => {
    try {
      if (key) posthog.capture(event, props);
    } catch {
      /* no-op */
    }
  };
}
