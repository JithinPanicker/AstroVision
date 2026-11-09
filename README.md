# BookMyAstrologer

BookMyShow-style booking for astrology consultations.
**Day 2** — 3-app architecture + admin approvals + payment model.

## Three apps, one brain

| App | URL | Purpose |
|---|---|---|
| User app | `index.html` | Browse astrologers, book slots, pay |
| Astrologer console | `astro.html` | Manage slots, view bookings, see earnings |
| Admin console | `admin.html` | Approve/reject astrologers, view audit log, revenue |

All three share `app.js` + `style.css` + `localStorage` (as a stand-in backend until Day 21).

## Deploy on GitHub Pages
1. Create repo, upload all 9 files at the root.
2. Settings → Pages → Branch: `main`, Folder: `/ (root)`.
3. Live at `https://<user>.github.io/<repo>/`.
4. Open all 3 URLs directly:
   - `/` (user)
   - `/astro.html` (astrologer)
   - `/admin.html` (admin)

## Update flow
Bump `CACHE` version in `sw.js` (e.g. `bma-v2` → `bma-v3`) on every push.

## Day 2 scope
- ✓ 3 separate entry points (user / astro / admin)
- ✓ Admin **approve** / **reject** with rejection reason
- ✓ Admin **KYC detail page** with full profile review
- ✓ **Audit log** — every approval/rejection recorded
- ✓ Payment fields on bookings (`paymentMode`, `paymentStatus`, `paymentRef`)
- ✓ Payment badges on booking cards
- ✓ Admin revenue split (online vs offline)

## Roadmap
- **Day 3–4**: Admin user/booking management, refunds, ban users
- **Day 5–8**: Astrologer slot CRUD, accept/decline bookings
- **Day 9–13**: User search & filters, profile pages
- **Day 14**: Booking flow — choose slot → pick payment → confirm
- **Day 15**: 💳 Razorpay integration (online) + cash collection tracking (offline)
- **Days 17–20**: Real auth & passwords for all 3 apps
- **Days 21–26**: Firebase swap (real DB)
- **Days 27–30**: Polish, PWA install, offline page

## Reset demo data
User app landing page → **Reset demo data**.
