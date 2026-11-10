# BookMyAstrologer

BookMyShow-style booking platform for astrology consultations.
**Day 3** — professional rewrite + admin user/booking management.

## Three apps, one brain

| App | URL | Purpose |
|---|---|---|
| User app | `index.html` | Browse, book, pay |
| Astrologer console | `astro.html` | Manage slots, bookings, earnings |
| Admin console | `admin.html` | Approve astrologers, manage users & bookings, audit |

All three share `app.js` + `style.css` + `localStorage` (Firestore swap on Day 21).

## Deploy on GitHub Pages
1. Create repo → upload all 9 files to the root.
2. Settings → Pages → Branch `main`, Folder `/ (root)`.
3. Live at `https://<user>.github.io/<repo>/`
4. Open `/`, `/astro.html`, `/admin.html` separately.

## Update flow
**Bump `CACHE` in `sw.js`** (e.g. `bma-v3` → `bma-v4`) on every push, or the browser will serve the old files forever.

## Admin capabilities (Day 3)

**Astrologers**
- Tabbed queue: Pending · Approved · Rejected · All
- Detail page with KYC, bio, activity
- Approve / reject with reason (logged)

**Users**
- Search by name/email · filter active/banned
- Detail page: stats, full booking history, account info
- **Ban/unban** with reason (logged)

**Bookings**
- Search by user / astrologer / ID · filter by status
- Detail page with session, user, payment, timeline
- **Cancel** → auto-refunds if paid online, reason required
- **Mark as paid** for offline/unpaid bookings

**Audit**
- Every action recorded with icon, actor, timestamp, target, reason

## Roadmap
- **Day 4**: Astrologer slot CRUD start
- **Days 5–8**: Slot management + accept/decline bookings
- **Days 9–13**: User search/filter, profile polish
- **Day 14**: Booking flow (slot → payment → confirm)
- **Day 15**: 💳 Razorpay integration
- **Days 17–20**: Real auth for all 3 apps
- **Days 21–26**: Firebase swap
- **Days 27–30**: Polish + PWA + launch

## Reset demo data
User app landing → **Reset demo data**.
