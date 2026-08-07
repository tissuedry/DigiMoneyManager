# Notification Center — Design Spec

**Date:** 2026-08-07
**Page:** `digi_app/app/notification/page.tsx` (same route, same API)

## Goal

Turn the existing notification list page into a modern notification center:
group by day, filter tabs, mark-as-read actions wired to the existing API, richer
per-type icons. Hand-rolled Tailwind consistent with the app's stone/emerald
aesthetic. No new dependencies.

## Context

- The app uses Tailwind v4 with a warm stone palette (`#f8f6f1` bg, emerald accents,
  rounded-3xl cards). No shadcn/ui or reactbits installed.
- API `GET /api/notifications` returns `{ notifications: NotificationItem[] }` where
  `NotificationItem = { id, userId, tipe, pesan, dibaca, timestamp }`.
- API `PUT /api/notifications` marks as read: `{ id }` → single, empty body → all.
- Existing helpers to reuse: `getRelativeTime`, `getTitle`, `PER_PAGE = 25`,
  `useApi`, `useMutate` (from `@/lib/use-api`), `Toast` component.

## Features

1. **Header** — keep back button + title + subtitle (`X notifikasi · Y belum
   dibaca`). Add a **Tandai semua dibaca** button (Check icon) calling
   `PUT /api/notifications` with empty body. Disabled when unreadCount === 0.

2. **Filter tabs** — segmented pill control: **Semua** / **Belum dibaca**.
   State `"all" | "unread"`. Unread count shown on the "Belum dibaca" tab.

3. **Group by day** — section headers: "Hari Ini", "Kemarin", "7 Hari Terakhir",
   "Sebelumnya", derived from `timestamp`. Reuses a day-label helper.

4. **Notification card** — per-type icon + tinted badge from a new
   `getType(item)` helper mapping to `{ label, icon, colors }`:
   - approved (emerald, Check) — PM/Keuangan approval
   - rejected (red, X)
   - disbursed (blue, banknote/wallet icon)
   - system (stone, Bell) — fallback
   Unread rows get a soft tinted background + blue dot; read rows are white/dimmed.

5. **Per-item mark-as-read** — small "Tandai dibaca" text button on unread items,
   calls `PUT` with `{ id }`. With **optimistic local update** (flip `dibaca`
   locally; server refetch reconciles).

6. **States** — keep loading skeleton, error card w/ retry, empty state (now
   filter-aware: "Tidak ada notifikasi belum dibaca" on the unread tab). Toast on
   mutation failure only.

7. **Pagination** — keep prev/next + `X / Y` control, scoped to the active
   filter's list.

## Out of scope (deliberate)

- No notification detail view (nothing beyond the message).
- No server-side pagination.
- No delete action (no API for it).
- Header/navbar unread badge and the dashboard `NotificationCard` widget live in
  `components/header.tsx` / `notification-card.tsx` — not changed by this task.
