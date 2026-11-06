import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl:
    process.env.NEON_AUTH_BASE_URL ||
    "https://auth.chronicle.placeholder.neon.tech",
  cookies: {
    secret:
      process.env.NEON_AUTH_COOKIE_SECRET ||
      "build_time_placeholder_cookie_secret_minimum_32_characters_long",
  },
});

