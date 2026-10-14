# OAuth credential configuration

The game ships with `VITE_AUTH_ENABLED=false` and does not require a broker
credential in that mode. Keep that setting for the existing game experience.

If authentication is enabled, the server must receive `GROK_AUTH_CLIENT_SECRET`
from its deployment secret store. Missing or blank values stop authentication
initialization before OAuth provider construction. Never
prefix this variable with `VITE_`, send it to the browser, put it in source, or
write it into a committed environment file.

`GROK_AUTH_CLIENT_ID` identifies the client and is public metadata. Deployments
should inject their per-app ID and secret together. An authorized preview may
use the public `grok_preview` ID with its server-injected credential. There is
no embedded credential or secret fallback. Existing template references to a
"baked preview client" do not authorize restoring a secret in source.

The previously committed preview credential remains in repository history.
Removing it from current source does not revoke it. The operator of the Grok
OAuth broker (`auth.grok.me`) must revoke or rotate the broker's
`GROK_PREVIEW_CLIENT_SECRET`, then provision any required replacement through
server-side secret configuration. The KYREC deployment owner must coordinate
that change with the broker operator before releasing authentication-enabled
builds. This source repair does not rotate credentials, rewrite history or
deploy a release.
