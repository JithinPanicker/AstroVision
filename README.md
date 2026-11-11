# BookMyAstrologer

BookMyShow-style booking platform for astrology consultations.
**Day 4** — professional polish + slot CRUD + user search & filters.

## Three apps, one brain

| App | URL | Purpose |
|---|---|---|
| User app | `index.html` | Browse, filter, book, pay |
| Astrologer console | `astro.html` | Manage slots (CRUD), bookings, earnings |
| Admin console | `admin.html` | Approve astrologers, manage users & bookings, audit |

## Deploy on GitHub Pages
1. Create repo → upload all 9 files to the root.
2. Settings → Pages → Branch `main`, Folder `/ (root)`.
3. Live at `https://<user>.github.io/<repo>/`
4. Open `/`, `/astro.html`, `/admin.html` separately.

## Update flow
**Bump `CACHE` in `sw.js`** on every push, or the browser serves stale files.

## Day 4 additions

**Astrologer — Slot CRUD (full)**
- Create slot: date picker (no past dates), time, duration, fee
- Edit unbooked upcoming slots
- Delete unbooked upcoming slots
- Duplicate (same date + time) detection
- Locked when booked or in past
- Tabs: Upcoming / Past
- Every action logged to audit

**User — Search & filters**
- Text search across name / specialty / city
- Specialty chips (auto-generated)
- Price band chips
- Sort: top-rated / price low-high / price high-low
- Filters persist across page visits
- "Clear filters" action in empty state

**Professional polish**
- Toast variants (success / error / info) with icons
- Button loading spinners during actions
- Modal bottom-sheet on mobile, centered on desktop
- Focus trap + Escape to close in modals
- Page transitions (fade-slide, respects prefers-reduced-motion)
- Clearable search inputs
- Version badge (`v4 · Day 4`) shown on landing + admin dashboard

## Roadmap
- **Day 5–6**: Astrologer accept/decline bookings · richer schedule view
- **Day 7–8**: Reviews, ratings, profile editing
- **Days 9–13**: User auth start, booking wizard skeleton
- **Day 14**: Full booking flow (slot → payment mode → confirm)
- **Day 15**: 💳 Razorpay integration
- **Days 17–20**: Real auth for all 3 apps
- **Days 21–26**: Firebase swap
- **Days 27–30**: Polish + PWA + launch

## Reset demo data
User app landing → **Reset demo data**.
