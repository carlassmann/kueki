# Kueki

A baby monitor that runs in the browser. Two devices, one room. The phone in the nursery listens, the phone with you plays live audio and gets a push notification when the room gets loud.

Kueki is a working prototype. Nothing is deployed yet.

## Why I built it

We have phones, tablets and laptops lying around the house. Why buy another device when the ones we own already do the job? I wanted to turn a phone into a baby monitor. The apps I tried were overkill and still missed the things I cared about, and I was curious whether a progressive web app could cover it and run on anything with a browser.

It can. Kueki uses the screen wake lock, the microphone, WebRTC and web push, which is everything a baby monitor needs. I also wanted several baby devices and several parent devices in the same room, and adding one should take a single link.

Kueki was the project name of my first son while he was still in my wife's belly. It is a cute version of Küken, German for chick. He is two now and we are expecting our second, which is why I am finally building this.

## What it does

- Pair any number of baby and parent devices in one room, without an account.
- Listen to several babies at once, each with its own playback control.
- Send a push notification for sustained sound, paused monitoring and disconnected baby devices, including when the parent tab is closed.
- Keep monitoring screens awake, and say so when the browser refuses.
- Set alert timing per room: how long a sound has to last, how quiet it stays afterwards, when a dropped device counts as gone, and how long activity is kept.
- Install as a PWA, follow the system light or dark appearance, dim either screen, and switch between English and German.

Kueki measures sustained sound, not whether a baby is crying. It is an extra pair of ears, not a replacement for checking on your baby.

## How it works

React, TanStack Router and TypeScript on the front end, built with Vite, scripted with Bun. One Cloudflare Worker serves both the app and the API. Each room is a Durable Object with SQLite storage holding its devices, WebSocket signaling, events and queued notifications, so state survives eviction and restarts.

Live audio is WebRTC between the devices, with Cloudflare Realtime TURN as a relay when a network blocks a direct connection. No audio is recorded or stored anywhere. Push delivery goes through Apple, Google or Mozilla because the browser requires it.

## Run it locally

You need Bun, Node 22 or newer for Wrangler, and the local `work` process manager.

```sh
bun install
bun run setup
bun run build
work up
```

Open http://localhost:4310/app, create a room, then open the invitation in a second browser profile and choose Baby there. Tabs in the same profile share one device identity.

Port 4310 is Vite with hot reload. Port 4313 serves the built app from `dist` and is what the end-to-end tests use, so rebuild before pointing anything at it. Wrangler runs the backend on port 4311 with storage under `.data/cloudflare`; restart it with `work restart api` after changing secrets.

To reach Kueki from your phones over Wi-Fi, and to deploy it to Cloudflare, see [hosting](docs/hosting.md). For invitations, removing access and switching rooms, see [rooms](docs/rooms.md).

## Tests

```sh
bun run check
bun run build
bun run test
bun run test:e2e
```

The Workers test runs against real workerd and SQLite with TURN and push mocked. Browser tests drive Chromium and WebKit with synthetic microphones. [TESTING.md](TESTING.md) records what has been verified on real devices and what still needs a physical phone.
