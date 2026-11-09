/* =============================================================
   BookMyAstrologer — Day 1
   Skeleton: role router · seed data · 12 screens · PWA ready
   ============================================================= */

const CONFIG = {
  appName: 'BookMyAstrologer',
  currency: '₹',
  storageKey: 'bma_db_v1',
  version: 'day1',
};

/* Demo identities — no auth yet. Real auth lands on Days 17–20. */
const CURRENT = { userId: 'u1', astroId: 'a1' };

/* ── DB (localStorage layer — swap to Firestore on Day 21) ── */
const DB = {
  _cache: null,
  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) { this._cache = JSON.parse(raw); return this._cache; }
    } catch (e) { /* corrupt → re-seed */ }
    this._cache = this._seed();
    this.save();
    return this._cache;
  },
  save() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(this._cache)); } catch (e) {}
  },
  reset() {
    try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
    this._cache = null;
    this.load();
  },
  _seed() {
    const day = (offset) => {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const astrologers = [
      { id:'a1', name:'Pandit Rajesh Sharma', specialty:'Vedic Astrology', city:'Jaipur', languages:['Hindi','English'], fee:500, rating:4.8, reviews:120, experience:15, status:'approved', bio:'Vedic astrologer with 15+ years of experience in kundli analysis, career guidance and matchmaking.' },
      { id:'a2', name:'Dr. Meera Iyer', specialty:'Numerology', city:'Chennai', languages:['Tamil','English'], fee:750, rating:4.6, reviews:86, experience:10, status:'approved', bio:'Numerologist focusing on name correction, business success and personal growth.' },
      { id:'a3', name:'Guru Anand Joshi', specialty:'Vastu Shastra', city:'Pune', languages:['Marathi','Hindi'], fee:600, rating:4.2, reviews:34, experience:8, status:'pending', bio:'Vastu consultant for homes, offices and commercial spaces.' },
      { id:'a4', name:'Sunita Kapoor', specialty:'Tarot Reading', city:'Delhi', languages:['Hindi','English'], fee:400, rating:4.9, reviews:210, experience:12, status:'rejected', bio:'Tarot reader and spiritual counsellor. KYC needs re-upload.' },
    ];
    const slots = [
      { id:'s0-old', astrologerId:'a1', date: day(-3), time:'11:00', duration:30, price:500 },
      { id:'s1', astrologerId:'a1', date: day(0), time:'10:00', duration:30, price:500 },
      { id:'s2', astrologerId:'a1', date: day(0), time:'15:00', duration:30, price:500 },
      { id:'s3', astrologerId:'a1', date: day(1), time:'11:00', duration:30, price:500 },
      { id:'s4', astrologerId:'a1', date: day(2), time:'09:30', duration:30, price:500 },
      { id:'s5', astrologerId:'a1', date: day(3), time:'17:00', duration:30, price:500 },
      { id:'s6', astrologerId:'a2', date: day(0), time:'12:00', duration:45, price:750 },
      { id:'s7', astrologerId:'a2', date: day(1), time:'14:00', duration:45, price:750 },
      { id:'s8', astrologerId:'a2', date: day(2), time:'16:30', duration:45, price:750 },
    ];
    const nowIso = new Date().toISOString();
    const bookings = [
      { id:'b1', userId:'u1', astrologerId:'a1', slotId:'s1', date: day(0), time:'10:00', status:'confirmed', amount:500, createdAt: nowIso },
      { id:'b2', userId:'u1', astrologerId:'a2', slotId:'s7', date: day(1), time:'14:00', status:'pending', amount:750, createdAt: nowIso },
      { id:'b3', userId:'u2', astrologerId:'a1', slotId:'s0-old', date: day(-3), time:'11:00', status:'completed', amount:500, createdAt: nowIso },
    ];
    const users = [
      { id:'u1', name:'Aarav Mehta', email:'aarav@example.com', phone:'+91 98765 43210' },
      { id:'u2', name:'Priya Nair', email:'priya@example.com', phone:'+91 91234 56789' },
      { id:'u3', name:'Vikram Singh', email:'vikram@example.com', phone:'+91 99887 76655' },
    ];
    return { astrologers, slots, bookings, users };
  },
};

/* ── Helpers ── */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));
const money = (n) => CONFIG.currency + Number(n).toLocaleString('en-IN');
const initials = (name) => String(name || '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short',
});
const findAstro = (id) => DB.load().astrologers.find(a => a.id === id);
const findUser  = (id) => DB.load().users.find(u => u.id === id);
const todayIso  = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

/* ── Toast ── */
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── Router ── */
function roleFromPath(path) {
  if (path.startsWith('/user')) return 'user';
  if (path.startsWith('/astro')) return 'astro';
  if (path.startsWith('/admin')) return 'admin';
  return null;
}

function matchRoute(path) {
  if (path === '/' || path === '') return { screen: 'landing', params: {} };
  const m = path.match(/^\/user\/astrologer\/([^/]+)$/);
  if (m) return { screen: 'userAstrologer', params: { id: m[1] } };
  const map = {
    '/user/home': 'userHome',
    '/user/bookings': 'userBookings',
    '/user/profile': 'userProfile',
    '/astro/dashboard': 'astroDashboard',
    '/astro/slots': 'astroSlots',
    '/astro/bookings': 'astroBookings',
    '/astro/profile': 'astroProfile',
    '/admin/dashboard': 'adminDashboard',
    '/admin/astrologers': 'adminAstrologers',
    '/admin/bookings': 'adminBookings',
    '/admin/users': 'adminUsers',
  };
  if (map[path]) return { screen: map[path], params: {} };
  return { screen: 'notFound', params: {} };
}

function renderBottomNav(role, path) {
  const nav = document.getElementById('bottomNav');
  if (!role) { nav.hidden = true; return; }
  nav.hidden = false;
  const items = role === 'user' ? [
    { href: '#/user/home',     label: 'Home',     icon: '🏠' },
    { href: '#/user/bookings', label: 'Bookings', icon: '📅' },
    { href: '#/user/profile',  label: 'Profile',  icon: '👤' },
  ] : role === 'astro' ? [
    { href: '#/astro/dashboard', label: 'Home',     icon: '📊' },
    { href: '#/astro/slots',     label: 'Slots',    icon: '🕐' },
    { href: '#/astro/bookings',  label: 'Bookings', icon: '📋' },
    { href: '#/astro/profile',   label: 'Profile',  icon: '👤' },
  ] : [
    { href: '#/admin/dashboard',  label: 'Home',       icon: '📊' },
    { href: '#/admin/astrologers',label: 'Astrologers',icon: '🔮' },
    { href: '#/admin/bookings',   label: 'Bookings',   icon: '📋' },
    { href: '#/admin/users',      label: 'Users',      icon: '👥' },
  ];
  nav.innerHTML = items.map(it => {
    const active = path === it.href.slice(1);
    return `<a class="nav-item ${active ? 'active' : ''}" href="${it.href}">
      <span class="nav-icon">${it.icon}</span>
      <span class="nav-label">${it.label}</span>
    </a>`;
  }).join('');
}

function render() {
  const path = (location.hash.replace(/^#/, '') || '/');
  const { screen, params } = matchRoute(path);
  const fn = SCREENS[screen] || SCREENS.notFound;
  const result = fn(params) || {};

  const view = document.getElementById('view');
  view.innerHTML = result.html || '';
  document.title = (result.title ? result.title + ' · ' : '') + CONFIG.appName;

  const isRoot = path === '/';
  const backBtn = document.getElementById('backBtn');
  const roleBtn = document.getElementById('roleBtn');
  backBtn.style.visibility = isRoot ? 'hidden' : 'visible';
  roleBtn.style.visibility = isRoot ? 'hidden' : 'visible';
  backBtn.onclick = () => {
    if (history.length > 1) history.back();
    else location.hash = '#/';
  };
  roleBtn.onclick = () => { location.hash = '#/'; };

  renderBottomNav(roleFromPath(path), path);
  window.scrollTo(0, 0);

  if (typeof result.mount === 'function') result.mount(params);
}

/* ── Shared component fragments ── */
function astroCard(a) {
  return `
    <a class="card astro-card" href="#/user/astrologer/${a.id}">
      <div class="avatar">${initials(a.name)}</div>
      <div class="astro-info">
        <div class="astro-name">${esc(a.name)}</div>
        <div class="astro-meta">${esc(a.specialty)} · ${esc(a.city)}</div>
        <div class="astro-rating">⭐ ${a.rating.toFixed(1)} <span class="muted">· ${a.reviews} reviews</span></div>
      </div>
      <div class="astro-fee">
        <div class="fee">${money(a.fee)}</div>
        <div class="muted tiny">/session</div>
      </div>
    </a>`;
}

function bookingCard(b) {
  const astro = findAstro(b.astrologerId);
  return `
    <div class="card booking-card">
      <div class="booking-row">
        <div>
          <div class="astro-name">${esc(astro ? astro.name : '—')}</div>
          <div class="muted small">${fmtDate(b.date)} · ${b.time}</div>
        </div>
        <span class="badge badge--${b.status}">${b.status}</span>
      </div>
      <div class="booking-row muted small">
        <span>Booking #${b.id.toUpperCase()}</span>
        <span>${money(b.amount)}</span>
      </div>
    </div>`;
}

/* ── Screens ── */

function screenLanding() {
  return {
    html: `
      <section class="hero">
        <div class="hero-mark">✨</div>
        <h1>BookMyAstrologer</h1>
        <p class="muted">Consult verified astrologers. Book slots. Manage bookings.</p>
      </section>
      <p class="section-title">Choose your role to explore</p>
      <div class="role-grid">
        <button class="role-card" data-goto="#/user/home">
          <span class="role-emoji">🙋</span>
          <span class="role-text">
            <span class="role-name">I'm a User</span>
            <span class="role-sub">Book an astrologer</span>
          </span>
        </button>
        <button class="role-card" data-goto="#/astro/dashboard">
          <span class="role-emoji">🔮</span>
          <span class="role-text">
            <span class="role-name">I'm an Astrologer</span>
            <span class="role-sub">Manage your practice</span>
          </span>
        </button>
        <button class="role-card" data-goto="#/admin/dashboard">
          <span class="role-emoji">🛡️</span>
          <span class="role-text">
            <span class="role-name">I'm an Admin</span>
            <span class="role-sub">Approve &amp; oversee</span>
          </span>
        </button>
      </div>
      <div class="note">
        <strong>Day 1 preview.</strong> Approvals, slot creation and the booking flow unlock on later days.
        All data here is demo data stored in your browser.
      </div>
      <button class="btn btn--ghost" id="resetBtn">Reset demo data</button>
    `,
    mount() {
      document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => { location.hash = el.dataset.goto; });
      });
      document.getElementById('resetBtn').addEventListener('click', () => {
        DB.reset();
        render();
        toast('Demo data reset');
      });
    },
  };
}

function screenUserHome() {
  const approved = DB.load().astrologers.filter(a => a.status === 'approved');
  return {
    title: 'Home',
    html: `
      <div class="page-head">
        <h2>Find an astrologer</h2>
        <p class="muted small">${approved.length} verified astrologers available</p>
      </div>
      <div class="list">${approved.map(astroCard).join('')}</div>
      <p class="muted small center" style="margin-top:16px">Search &amp; filters arrive on Day 9</p>
    `,
  };
}

function screenUserAstrologer(params) {
  const a = findAstro(params.id);
  if (!a) return { title: 'Not found', html: `<div class="empty">Astrologer not found. <a href="#/user/home">Back</a></div>` };
  const bookedSlotIds = new Set(
    DB.load().bookings.filter(b => b.status !== 'cancelled').map(b => b.slotId)
  );
  const slots = DB.load().slots.filter(s => s.astrologerId === a.id && !bookedSlotIds.has(s.id));
  return {
    title: a.name,
    html: `
      <div class="profile-head">
        <div class="avatar avatar--lg">${initials(a.name)}</div>
        <div>
          <h2 class="h2">${esc(a.name)}</h2>
          <p class="muted">${esc(a.specialty)} · ${esc(a.city)}</p>
          <p class="muted small" style="margin:2px 0 0">
            ⭐ ${a.rating.toFixed(1)} · ${a.reviews} reviews · ${a.experience} yrs
          </p>
        </div>
      </div>
      <div class="card">
        <h3 class="h3">About</h3>
        <p class="body-text">${esc(a.bio)}</p>
        <p class="body-text"><strong>Languages:</strong> ${a.languages.map(esc).join(', ')}</p>
        <p class="body-text"><strong>Fee:</strong> ${money(a.fee)} per session</p>
      </div>
      <h3 class="h3" style="margin-top:20px">Available slots</h3>
      ${slots.length === 0
        ? `<p class="muted small">No slots published yet.</p>`
        : `<div class="slot-grid">${slots.map(s => `
            <button class="slot-chip" data-slot="${s.id}">
              <span class="slot-date">${fmtDate(s.date)}</span>
              <span class="slot-time">${s.time}</span>
            </button>`).join('')}</div>`}
      <div class="note" style="margin-top:16px">
        The full booking flow (select → confirm → booking ID) unlocks on Day 14.
      </div>
    `,
    mount() {
      document.querySelectorAll('[data-slot]').forEach(btn => {
        btn.addEventListener('click', () => toast('Booking flow unlocks on Day 14'));
      });
    },
  };
}

function screenUserBookings() {
  const bookings = DB.load().bookings.filter(b => b.userId === CURRENT.userId);
  return {
    title: 'My bookings',
    html: `
      <div class="page-head"><h2>My bookings</h2></div>
      ${bookings.length === 0
        ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(bookingCard).join('')}</div>`}
    `,
  };
}

function screenUserProfile() {
  const u = findUser(CURRENT.userId);
  return {
    title: 'Profile',
    html: `
      <div class="profile-head">
        <div class="avatar avatar--lg">${initials(u.name)}</div>
        <div>
          <h2 class="h2">${esc(u.name)}</h2>
          <p class="muted">${esc(u.email)}</p>
          <p class="muted">${esc(u.phone)}</p>
        </div>
      </div>
      <div class="note">Sign-in, profile editing and reviews unlock on Days 17–20.</div>
    `,
  };
}

function screenAstroDashboard() {
  const a = findAstro(CURRENT.astroId);
  const myBookings = DB.load().bookings.filter(b => b.astrologerId === a.id);
  const todayCount = myBookings.filter(b => b.date === todayIso()).length;
  const pending = myBookings.filter(b => b.status === 'pending').length;
  const earnings = myBookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.amount, 0);
  const statusLine = a.status === 'approved'
    ? '✅ Your profile is approved'
    : a.status === 'pending' ? '⏳ Awaiting admin approval' : '❌ Profile rejected';
  return {
    title: 'Dashboard',
    html: `
      <div class="page-head">
        <h2>Hi, ${esc(a.name.split(' ')[0])} 👋</h2>
        <p class="muted small">${statusLine}</p>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${todayCount}</div><div class="stat-lbl">Today's bookings</div></div>
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending requests</div></div>
        <div class="stat"><div class="stat-val">${myBookings.length}</div><div class="stat-lbl">Total bookings</div></div>
        <div class="stat"><div class="stat-val">${money(earnings)}</div><div class="stat-lbl">Earnings</div></div>
      </div>
      <div class="action-row">
        <a class="btn" href="#/astro/slots">Manage slots</a>
        <a class="btn btn--ghost" href="#/astro/bookings">View bookings</a>
      </div>
    `,
  };
}

function screenAstroSlots() {
  const a = findAstro(CURRENT.astroId);
  const slots = DB.load().slots.filter(s => s.astrologerId === a.id);
  const bookedSlotIds = new Set(
    DB.load().bookings.filter(b => b.status !== 'cancelled').map(b => b.slotId)
  );
  return {
    title: 'Slots',
    html: `
      <div class="page-head with-action">
        <h2>My slots</h2>
        <button class="btn btn--sm" id="addSlotBtn">+ Add slot</button>
      </div>
      ${slots.length === 0 ? `<div class="empty">No slots yet.</div>` :
        `<div class="list">${slots.map(s => `
          <div class="card slot-row">
            <div>
              <div class="astro-name">${fmtDate(s.date)}</div>
              <div class="muted small">${s.time} · ${s.duration} min · ${money(s.price)}</div>
            </div>
            ${bookedSlotIds.has(s.id)
              ? `<span class="badge badge--confirmed">Booked</span>`
              : `<span class="badge badge--approved">Open</span>`}
          </div>`).join('')}</div>`}
      <div class="note" style="margin-top:16px">Slot creation unlocks on Day 5.</div>
    `,
    mount() {
      const btn = document.getElementById('addSlotBtn');
      if (btn) btn.addEventListener('click', () => toast('Slot creation unlocks on Day 5'));
    },
  };
}

function screenAstroBookings() {
  const bookings = DB.load().bookings.filter(b => b.astrologerId === CURRENT.astroId);
  return {
    title: 'Bookings',
    html: `
      <div class="page-head"><h2>Booking requests</h2></div>
      ${bookings.length === 0
        ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(bookingCard).join('')}</div>`}
      <div class="note" style="margin-top:16px">Accept / decline actions unlock on Day 7.</div>
    `,
  };
}

function screenAstroProfile() {
  const a = findAstro(CURRENT.astroId);
  return {
    title: 'Profile',
    html: `
      <div class="profile-head">
        <div class="avatar avatar--lg">${initials(a.name)}</div>
        <div>
          <h2 class="h2">${esc(a.name)}</h2>
          <p class="muted">${esc(a.specialty)} · ${esc(a.city)}</p>
          <p style="margin:6px 0 0"><span class="badge badge--${a.status}">${a.status}</span></p>
        </div>
      </div>
      <div class="card">
        <h3 class="h3">KYC</h3>
        <p class="body-text">${
          a.status === 'approved' ? '✅ Verified by admin' :
          a.status === 'pending'  ? '⏳ Under review' :
                                     '❌ Not approved'
        }</p>
      </div>
      <div class="note">Profile editing &amp; KYC upload unlock on Day 8.</div>
    `,
  };
}

function screenAdminDashboard() {
  const d = DB.load();
  const pending = d.astrologers.filter(a => a.status === 'pending').length;
  const approved = d.astrologers.filter(a => a.status === 'approved').length;
  return {
    title: 'Admin',
    html: `
      <div class="page-head"><h2>Admin overview</h2></div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending approvals</div></div>
        <div class="stat"><div class="stat-val">${approved}</div><div class="stat-lbl">Approved</div></div>
        <div class="stat"><div class="stat-val">${d.bookings.length}</div><div class="stat-lbl">Bookings</div></div>
        <div class="stat"><div class="stat-val">${d.users.length}</div><div class="stat-lbl">Users</div></div>
      </div>
      <div class="action-row">
        <a class="btn" href="#/admin/astrologers">Review astrologers</a>
        <a class="btn btn--ghost" href="#/admin/bookings">All bookings</a>
      </div>
    `,
  };
}

function screenAdminAstrologers() {
  const rows = DB.load().astrologers.map(a => `
    <div class="card admin-row">
      <div class="avatar">${initials(a.name)}</div>
      <div class="astro-info">
        <div class="astro-name">${esc(a.name)}</div>
        <div class="astro-meta">${esc(a.specialty)} · ${esc(a.city)}</div>
      </div>
      <span class="badge badge--${a.status}">${a.status}</span>
    </div>`).join('');
  return {
    title: 'Astrologers',
    html: `
      <div class="page-head">
        <h2>Astrologers</h2>
        <p class="muted small">Approve / reject actions unlock on Day 2</p>
      </div>
      <div class="list">${rows}</div>
    `,
  };
}

function screenAdminBookings() {
  const bookings = DB.load().bookings;
  return {
    title: 'All bookings',
    html: `
      <div class="page-head"><h2>All bookings</h2></div>
      ${bookings.length === 0
        ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(bookingCard).join('')}</div>`}
    `,
  };
}

function screenAdminUsers() {
  const users = DB.load().users;
  return {
    title: 'Users',
    html: `
      <div class="page-head"><h2>Users</h2></div>
      <div class="list">${users.map(u => `
        <div class="card admin-row">
          <div class="avatar">${initials(u.name)}</div>
          <div class="astro-info">
            <div class="astro-name">${esc(u.name)}</div>
            <div class="astro-meta">${esc(u.email)}</div>
          </div>
        </div>`).join('')}</div>
    `,
  };
}

function screenNotFound() {
  return {
    title: 'Not found',
    html: `<div class="empty">Page not found. <a href="#/">Go home</a></div>`,
  };
}

const SCREENS = {
  landing: screenLanding,
  userHome: screenUserHome,
  userAstrologer: screenUserAstrologer,
  userBookings: screenUserBookings,
  userProfile: screenUserProfile,
  astroDashboard: screenAstroDashboard,
  astroSlots: screenAstroSlots,
  astroBookings: screenAstroBookings,
  astroProfile: screenAstroProfile,
  adminDashboard: screenAdminDashboard,
  adminAstrologers: screenAdminAstrologers,
  adminBookings: screenAdminBookings,
  adminUsers: screenAdminUsers,
  notFound: screenNotFound,
};

/* ── Boot ── */
function boot() {
  DB.load();
  if (!location.hash) history.replaceState(null, '', '#/');
  window.addEventListener('hashchange', render);
  render();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
