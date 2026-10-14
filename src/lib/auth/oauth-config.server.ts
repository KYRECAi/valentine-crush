import { PREVIEW_CLIENT_ID } from "./preview.ts";

/** Resolve broker credentials on the server; never return them to the client. */
export function resolveGrokOAuthCredentials(
  environment: Readonly<Record<string, string | undefined>>,
) {
  const clientId = environment.GROK_AUTH_CLIENT_ID?.trim() || PREVIEW_CLIENT_ID;

  // Preserve the shipped auth-off game without requiring any OAuth secret.
  if (environment.VITE_AUTH_ENABLED?.trim() === "false") {
    return { enabled: false as const, clientId, clientSecret: undefined };
  }

  const clientSecret = environment.GROK_AUTH_CLIENT_SECRET?.trim();
  if (!clientSecret) {
    throw new Error(
      "Authentication requires server-only GROK_AUTH_CLIENT_SECRET configuration.",
    );
  }

  return { enabled: true as const, clientId, clientSecret };
}
