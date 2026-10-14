import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveGrokOAuthCredentials } from "./oauth-config.server.ts";

test("the shipped auth-off game needs no broker credential", () => {
  assert.deepEqual(
    resolveGrokOAuthCredentials({ VITE_AUTH_ENABLED: "false" }),
    { enabled: false, clientId: "grok_preview", clientSecret: undefined },
  );
});

test("auth off never returns a configured credential", () => {
  const config = resolveGrokOAuthCredentials({
    VITE_AUTH_ENABLED: " false ",
    GROK_AUTH_CLIENT_SECRET: "synthetic-test-secret",
  });
  assert.equal(config.enabled, false);
  assert.equal(config.clientSecret, undefined);
});

test("auth enabled fails closed without a server-injected secret", () => {
  for (const flag of [undefined, "true", "", "invalid"]) {
    for (const secret of [undefined, "", "   "]) {
      assert.throws(
        () => resolveGrokOAuthCredentials({
          VITE_AUTH_ENABLED: flag,
          GROK_AUTH_CLIENT_SECRET: secret,
        }),
        /^Error: Authentication requires server-only GROK_AUTH_CLIENT_SECRET configuration\.$/,
      );
    }
  }
});

test("a client-visible variable cannot configure a broker secret", () => {
  assert.throws(() => resolveGrokOAuthCredentials({
    VITE_AUTH_ENABLED: "true",
    VITE_GROK_AUTH_CLIENT_SECRET: "synthetic-client-visible-value",
  }), /requires server-only GROK_AUTH_CLIENT_SECRET/);
});

test("preview retains its public client ID with an injected secret", () => {
  assert.deepEqual(resolveGrokOAuthCredentials({
    GROK_AUTH_CLIENT_SECRET: " synthetic-test-secret ",
  }), {
    enabled: true,
    clientId: "grok_preview",
    clientSecret: "synthetic-test-secret",
  });
});

test("deployed app credentials override the public preview client ID", () => {
  assert.deepEqual(resolveGrokOAuthCredentials({
    VITE_AUTH_ENABLED: "true",
    GROK_AUTH_CLIENT_ID: " synthetic-app-client ",
    GROK_AUTH_CLIENT_SECRET: "synthetic-app-secret",
  }), {
    enabled: true,
    clientId: "synthetic-app-client",
    clientSecret: "synthetic-app-secret",
  });
});
