# BookMyAstrologer

BookMyShow-style booking platform for astrology consultations.
**Day 5** — Astrologer booking inbox + Schedule view.

## Three apps, one brain

| App | URL | Purpose |
|---|---|---|
| User app | `index.html` | Browse, filter, book, pay |
| Astrologer console | `astro.html` | Manage slots, accept bookings, view schedule |
| Admin console | `admin.html` | Approve astrologers, manage users & bookings, audit |

## Deploy on GitHub Pages
1. Create repo → upload all 9 files to the root.
2. Settings → Pages → Branch `main`, Folder `/ (root)`.
3. Live at `https://<user>.github.io/<repo>/`
4. Open `/`, `/astro.html`, `/admin.html` separately.

## Update flow
**Bump `CACHE` in `sw.js`** on every push.

## Day 5 additions

**Astrologer — Booking lifecycle**
- **Accept** pending requests → moves to Active
- **Decline** with reason → auto-refunds online-paid
- **Complete** confirmed sessions (today or past) → auto-collects cash if offline/unpaid
- Every action logged to the shared audit trail

**Astrologer — Bookings inbox**
- 3 tabs: **Requests** (pending) · **Active** (confirmed) · **History** (completed + cancelled)
- Inline action buttons on each card
- Default tab is Requests

**Astrologer — Schedule view** (new)
- Grouped by date: Today / Tomorrow / dated headers
- Shows sessions and open slots together, sorted by time
- Quick action icons for accept / decline / complete / edit / delete
- 5th bottom-nav tab

**Astrologer — Dashboard upgrade**
- 🔔 Alert banner for pending requests (only when > 0)
- "Today's schedule" preview with top 3 sessions
- "View full schedule →" link

**Nav badge**
- Red badge on the Bookings tab showing pending request count (astrologer app only)

**Audit log expanded**
- `confirm_booking`, `decline_booking`, `complete_booking` now recorded
- Admin's booking detail timeline shows astro-side actions with 🔮 icon

## Day 5 seed data
- 1 pending booking on Rajesh (`a1`) — test **Accept / Decline**
- 1 pending booking on Meera (`a2`)
- 1 confirmed today, cash-unpaid → test **Complete & collect**
- 1 confirmed today, online-paid → test **Complete**
- 1 completed past, 1 cancelled+refunded for history

## Roadmap
- **Day 6**: Reviews & ratings (user submits, astro sees)
- **Day 7–8**: Profile editing (users & astrologers)
- **Days 9–13**: User auth start, booking wizard skeleton
- **Day 14**: Full booking flow (slot → payment mode → confirm)
- **Day 15**: 💳 Razorpay integration
- **Days 17–20**: Real auth for all 3 apps
- **Days 21–26**: Firebase swap
- **Days 27–30**: Polish + PWA + launch

## Reset demo data
User app landing → **Reset demo data**.
