# Hosting Kueki

## Two phones on your Wi-Fi

```sh
bun run setup:https
bun run build
work run https
```

The setup command prints the LAN URL on port 4312. Install and trust the local CA from `/kueki-local-ca.crt` on each phone. On iOS, enable full trust under Settings, General, About, Certificate Trust Settings. The certificates stay local. Never commit or deploy them.

Leave the baby device plugged in with Kueki open and its screen awake, and keep the Mac running while the local backend is in use. Audio on the same network often works without TURN. Restrictive networks need relay credentials.

## Cloudflare

`wrangler.jsonc` holds the Worker and Durable Object configuration. The `v1` migration creates the Room class with SQLite storage. Static assets come from `dist`, and `/app` supports direct navigation and offline launch.

1. Sign in with `bunx wrangler login`.
2. Create a Cloudflare Realtime TURN key in the dashboard.
3. Put the secrets below in `.dev.vars`, which git ignores.
4. Run `bun run check`, `bun run build` and `bun run test`. The Worker test bundles with `wrangler deploy --dry-run` and uploads nothing.
5. Publish with `bunx wrangler deploy --secrets-file .dev.vars`, which creates the Worker and supplies its secrets in one deployment. This has not been run yet.
6. Open the HTTPS URL Wrangler prints, pair fresh devices, and work through the [hosted checks](../TESTING.md#before-relying-on-the-hosted-app).

Change a secret later with `bunx wrangler secret put NAME`.

| Secret             | Purpose                                         |
| ------------------ | ----------------------------------------------- |
| VAPID_PUBLIC_KEY   | Browser push subscription key                   |
| VAPID_PRIVATE_KEY  | Server push signing key                         |
| VAPID_SUBJECT      | Contact URI, such as mailto:you@example.com     |
| TURN_KEY_ID        | Cloudflare Realtime TURN key ID                 |
| TURN_KEY_API_TOKEN | Server-only token for issuing relay credentials |

`VAPID_SUBJECT` needs a real HTTPS URL or email. Apple rejects placeholder domains such as `kueki.example` with `BadJwtToken`. Kueki falls back to this repository's public URL.

`bun run setup` generates local VAPID keys and copies the push settings into `.dev.vars`. Keep those keys stable once devices have subscribed, or their subscriptions break.

TURN credentials are issued only to authenticated room devices, cached for five minutes, and valid for 24 hours. Each new listening connection fetches configuration again. A single session running past 24 hours would need credential renewal, which does not exist yet.

Without TURN secrets, Kueki tries a direct WebRTC connection using Cloudflare STUN. With secrets configured, a failed credential request is reported instead of quietly dropping the relay.
