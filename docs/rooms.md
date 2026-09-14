# Rooms, devices and delivery

## Inviting someone

From any parent device, choose Invite device, then Copy invite link. Whoever opens it picks Me, names their device, and joins. They can listen live and enable notifications.

The invitation also carries a QR code containing the raw code. Scan it and paste the code into Join a room, or use Join a room, Scan QR code to open the camera and fill it in directly. The camera stops on scan or close, and manual entry stays available if permission is denied.

Invitations never expire on their own. If the device already belongs to another room, Kueki asks whether to switch first, and keeps the previous membership saved.

## Installing on a phone

Phones only deliver push notifications to installed apps, so a phone that should receive alerts needs Kueki on its Home Screen. Kueki nudges mobile visitors once per session and explains the steps for the current platform; Settings replaces the notification button with the same guide until the app runs standalone. Desktop browsers are left alone.

## Removing access

Open Settings, Manage this device, Room access, then Remove next to the device. That revokes its session, disconnects its audio, drops its push subscription and queued notifications, and resets the room invitation, so old links stop working. Everyone else stays connected and can copy the new invitation. A notification a push service already accepted may still arrive.

Invite device, Reset invitation link invalidates old links without removing anyone. Leaving a room removes only that device and leaves the invitation alone.

Every parent has these controls. Kueki has no owner and no restricted guest. If someone joined on several devices, remove each one. They can only come back through a fresh invitation.

## Switching rooms

Tap the room name to open Your rooms, then create, join or select a room. Memberships stay in this browser across reloads, and an existing installation keeps its current room.

Only the active room monitors or notifies this device. Switching stops live audio and baby monitoring, removes the previous room's push subscription and pending notifications, and needs a server connection. Start monitoring or listening again after switching back.

Parents rename the room under Settings, Room. Device names and participant removal live under Settings, Manage this device. Names sync to connected devices. Leave room revokes this device's membership, while Forget only drops an inactive room from this browser's list.

## What happens when things go wrong

If the connection drops, Kueki stops playback and reconnects the room on its own. Tap Listen again to resume audio. If the browser pauses playback, Kueki offers Resume audio instead of claiming it is still listening.

Room WebSockets use Durable Object hibernation and restore their metadata after eviction. A baby device sends a heartbeat every three seconds. A durable alarm notices missing heartbeats after twelve seconds, including from paused devices, and records the disconnect once. Alarm scheduling is not an exact deadline.

Alert events and per-parent notification jobs are written in one SQLite transaction. Jobs survive restarts, retry for up to sixty seconds, and stop retrying an invalid subscription. A retry after an ambiguous response can deliver twice, so notification tags use stable event IDs to replace duplicates. Events are capped at thirty per room and expire after the room's retention setting. Clearing activity does not cancel delivery that is already queued.

## Limits and privacy

Kueki sets no device-count cap. Practical capacity comes from browser and Cloudflare limits. Invitation codes are random capabilities, each device holds its own token, and the public room ID alone grants nothing. Device tokens are stored as hashes. Push subscriptions and TURN API tokens are never broadcast.

Sensitivity is stored per baby device and can be changed by that device or any parent. Alert timing is stored per room and applies to every device in it. Both sync immediately and survive reloads.

Parent devices request a screen wake lock whenever the room is open, including on Activity and Settings. The OS can still deny or revoke it, so Kueki shows the status and retries after release, on return to the foreground, or on the next interaction.

## Navigation and updates

`/app` is the monitor, `/app/activity` the event log, `/app/settings` the settings. Setup uses `/app/create` and `/app/join`. TanStack Router handles navigation, history and direct links. The room connection and audio live in the shared layout and stay active while moving between pages. Old hash invitation links still work.

A service worker update shows up as a toast on load or on return to the foreground, and only updates when clicked. While this device is monitoring or listening, the toast asks you to pause first and offers no update button. Installation is offered the same way. Privacy information lives in Settings.
