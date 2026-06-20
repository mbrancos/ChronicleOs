import { auth } from "@/lib/auth/server";

// Garante que a rota não seja pré-renderizada em build time (depende de cookies e env vars em runtime)
export const dynamic = "force-dynamic";

export const { GET, POST } = auth.handler();
