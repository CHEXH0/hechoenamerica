## Goal

Move the two song add-ons off `song_requests` and route each into a dedicated workflow:

- **HEA Exclusive Box** → behaves like a Gomas Chamoy order in **My Treats**, with order/shipping updates.
- **Discover Your Distro** → fulfilled by a new **`support` role** via a dedicated **Support Panel**. Triggered automatically once the client's song has been delivered. Support schedules a Google Meet using your link: `https://calendar.app.google/7giF7xaXxa7DtK1P9`.

---

## Database changes

1. **Drop columns** `wants_distro_help`, `wants_hea_box` from `song_requests` (added in the previous migration — we never shipped them).
2. **Add `support`** value to `app_role` enum.
3. **New table `distro_requests`**:
   - `song_request_id`, `user_id`, `user_email`
   - `status` (`pending` → `scheduled` → `completed` / `declined`)
   - `assigned_support_id`, `google_meet_link` (defaults to your calendar link), `client_selected_time`, `support_notes`
   - RLS:
     - User: SELECT/UPDATE (only their `client_selected_time`) for their own row
     - `support` + `admin`: SELECT/UPDATE all
4. **Update RLS** on `chamoy_requests` so the new admin-created HEA Box rows still work (current policies already allow admins to insert via service role — no change needed; we'll insert from the edge function).

---

## Checkout flow

`SongAddOnsDialog` UI stays the same. Selections are passed to `create-song-checkout` and stored only in the **Stripe session metadata** (`wants_distro_help`, `wants_hea_box`).

`verify-song-payment` (the post-payment webhook) reads metadata and:
- If `wants_hea_box=true`: insert a row into **`chamoy_requests`** with:
  - `description = "HEA Exclusive Box (bundled with song request)"`
  - `admin_price = "27.68"`, `status = "paid"`, `stripe_session_id` (idempotent), `paid_at = now()`
  - Customer then sees order/shipping updates in the existing Treats UI.
- If `wants_distro_help=true`: insert a row into **`distro_requests`** with `status='pending'` linked to the song request. It stays hidden from the support queue until the song is marked **delivered**, then becomes actionable.

---

## Support Panel (new)

- New page `/support` (route guarded by `useUserRole` → requires `support` or `admin`).
- New `useUserRole` field: `isSupport` (admin inherits).
- Sidebar/header link visible only to support+admin.
- Panel lists `distro_requests` where the linked song request status = `delivered`:
  - Client info, song idea summary, request date.
  - **Accept** → status `scheduled`, shows the Google Meet link card to the client with a "Pick a time" button that opens `https://calendar.app.google/7giF7xaXxa7DtK1P9`.
  - Optional `support_notes` field.
  - **Mark complete** once the call has happened.
- Client view: a "Distro Help" card appears on the project detail page (in MyProjects) once accepted, showing the booking link and any scheduled time.

---

## Admin role management

Existing admin role UI already inserts arbitrary roles. We just need to extend the role-select dropdown(s) in the admin panel to include `support`.

---

## Files touched (estimate)

- Migration: drop 2 cols, enum value, new table + policies.
- `supabase/functions/create-song-checkout/index.ts` — pass selections through metadata only (stop inserting into `song_requests`).
- `supabase/functions/verify-song-payment/index.ts` — create chamoy/distro rows on success (idempotent via `stripe_session_id`).
- `src/pages/GenerateSong.tsx` — drop `wants_*` from insert; still send selections to checkout.
- `src/integrations/supabase/types.ts` — regenerated.
- `src/hooks/useUserRole.ts` — add `isSupport`.
- `src/pages/Support.tsx` (new) + route in `App.tsx`.
- `src/components/DistroRequestsAdmin.tsx` (new, used by Support panel).
- Admin role-select component — add `support` option.
- `src/pages/MyProjects.tsx` — show Distro card when present.

---

## Open question (only if you object)

For the HEA Box I'm reusing the existing `chamoy_requests` table since the flow is identical (paid, shipping status, tracking, admin notes). If you'd rather have a separate `treats_orders` table I can split it — but it doubles the admin UI work. Say the word if you want a separate table.