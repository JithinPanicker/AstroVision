/* =============================================================
   BookMyAstrologer — Day 2
   3 apps · 1 shared brain · admin approvals · payment model
   ============================================================= */

const APP = document.body.dataset.app || 'user'; // 'user' | 'admin' | 'astro'

const CONFIG = {
  appName: 'BookMyAstrologer',
  currency: '₹',
  storageKey: 'bma_db_v2',
  version: 'day2',
};

const CURRENT = { userId: 'u1', astroId: 'a1', adminName: 'Super Admin' };

/* ── DB ────────────────────────────────────────────────── */
const DB = {
  _cache: null,
  load() {
    if (this._cache) return this._cache;
    try {
      const raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) { this._cache = JSON.parse(raw); return this._cache; }
    } catch (e) {}
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
  getAstro(id)   { return this.load().astrologers.find(a => a.id === id); },
  getSlot(id)    { return this.load().slots.find(s => s.id === id); },
  getBooking(id) { return this.load().bookings.find(b => b.id === id); },
  getUser(id)    { return this.load().users.find(u => u.id === id); },
  listAudit()    { return [...this.load().audit].sort((a,b) => b.ts.localeCompare(a.ts)); },

  log(actorRole, actorName, action, targetType, targetId, meta) {
    const d = this.load();
    d.audit.push({
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      ts: new Date().toISOString(),
      actorRole, actorName, action, targetType, targetId,
      meta: meta || {},
    });
    this.save();
  },

  setAstrologerStatus(id, status, reason) {
    const d = this.load();
    const a = d.astrologers.find(x => x.id === id);
    if (!a) return;
    a.status = status;
    a.statusReason = reason || null;
    a.statusUpdatedAt = new Date().toISOString();
    this.save();
  },

  _seed() {
    const day = (offset) => {
      const d = new Date(); d.setDate(d.getDate() + offset);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };
    const nowIso = new Date().toISOString();
    const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

    const astrologers = [
      { id:'a1', name:'Pandit Rajesh Sharma', specialty:'Vedic Astrology', city:'Jaipur',
        languages:['Hindi','English'], fee:500, rating:4.8, reviews:120, experience:15,
        status:'approved', bio:'Vedic astrologer with 15+ years of experience in kundli analysis, career guidance and matchmaking.',
        kyc:{ pan:'ABCDE1234F', aadhaarMasked:'XXXX XXXX 4321', verified:true } },
      { id:'a2', name:'Dr. Meera Iyer', specialty:'Numerology', city:'Chennai',
        languages:['Tamil','English'], fee:750, rating:4.6, reviews:86, experience:10,
        status:'approved', bio:'Numerologist focusing on name correction, business success and personal growth.',
        kyc:{ pan:'XYZAB5678G', aadhaarMasked:'XXXX XXXX 9911', verified:true } },
      { id:'a3', name:'Guru Anand Joshi', specialty:'Vastu Shastra', city:'Pune',
        languages:['Marathi','Hindi'], fee:600, rating:4.2, reviews:34, experience:8,
        status:'pending', bio:'Vastu consultant for homes, offices and commercial spaces.',
        kyc:{ pan:'PQRST9012H', aadhaarMasked:'XXXX XXXX 2244', verified:false },
        submittedAt: daysAgo(2) },
      { id:'a4', name:'Sunita Kapoor', specialty:'Tarot Reading', city:'Delhi',
        languages:['Hindi','English'], fee:400, rating:4.9, reviews:210, experience:12,
        status:'rejected', bio:'Tarot reader and spiritual counsellor.',
        kyc:{ pan:'', aadhaarMasked:'', verified:false },
        statusReason:'PAN number did not match uploaded document. Please re-submit.',
        statusUpdatedAt: daysAgo(5), submittedAt: daysAgo(7) },
    ];

    const slots = [
      { id:'s0-old', astrologerId:'a1', date: day(-3), time:'11:00', duration:30, price:500 },
      { id:'s1', astrologerId:'a1', date: day(0), time:'10:00', duration:30, price:500 },
      { id:'s2', astrologerId:'a1', date: day(0), time:'15:00', duration:30, price:500 },
      { id:'s3', astrologerId:'a1', date: day(1), time:'11:00', duration:30, price:500 },
      { id:'s4', astrologerId:'a1', date: day(2), time:'09:30', duration:30, price:500 },
      { id:'s6', astrologerId:'a2', date: day(0), time:'12:00', duration:45, price:750 },
      { id:'s7', astrologerId:'a2', date: day(1), time:'14:00', duration:45, price:750 },
    ];

    const bookings = [
      { id:'b1', userId:'u1', astrologerId:'a1', slotId:'s1', date: day(0), time:'10:00',
        amount:500, status:'confirmed',
        paymentMode:'online', paymentStatus:'paid', paymentRef:'pay_RZP_A1B2C3',
        createdAt: nowIso, paidAt: nowIso },
      { id:'b2', userId:'u1', astrologerId:'a2', slotId:'s7', date: day(1), time:'14:00',
        amount:750, status:'pending',
        paymentMode:'offline', paymentStatus:'unpaid', paymentRef:null,
        createdAt: nowIso },
      { id:'b3', userId:'u2', astrologerId:'a1', slotId:'s0-old', date: day(-3), time:'11:00',
        amount:500, status:'completed',
        paymentMode:'offline', paymentStatus:'paid', paymentRef:'CASH-session-42',
        createdAt: daysAgo(4), paidAt: daysAgo(3) },
    ];

    const users = [
      { id:'u1', name:'Aarav Mehta', email:'aarav@example.com', phone:'+91 98765 43210' },
      { id:'u2', name:'Priya Nair', email:'priya@example.com', phone:'+91 91234 56789' },
      { id:'u3', name:'Vikram Singh', email:'vikram@example.com', phone:'+91 99887 76655' },
    ];

    const audit = [
      { id:'log-seed-1', ts: daysAgo(3), actorRole:'admin', actorName:'Super Admin',
        action:'approve_astrologer', targetType:'astrologer', targetId:'a1',
        meta:{ name:'Pandit Rajesh Sharma' } },
      { id:'log-seed-2', ts: daysAgo(5), actorRole:'admin', actorName:'Super Admin',
        action:'reject_astrologer', targetType:'astrologer', targetId:'a4',
        meta:{ name:'Sunita Kapoor', reason:'PAN number did not match uploaded document.' } },
    ];

    return { astrologers, slots, bookings, users, audit };
  },
};

/* ── Helpers ───────────────────────────────────────────── */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));
const money = (n) => CONFIG.currency + Number(n).toLocaleString('en-IN');
const initials = (name) => String(name || '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase();
const fmtDate = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN',
  { weekday: 'short', day: 'numeric', month: 'short' });
const fmtDateTime = (iso) => new Date(iso).toLocaleString('en-IN',
  { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function showModal(html) {
  const root = document.getElementById('modalRoot');
  if (!root) return;
  root.innerHTML = `<div class="modal-backdrop show"><div class="modal">${html}</div></div>`;
  root.querySelector('.modal-backdrop').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) closeModal();
  });
}
function closeModal() {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}

/* ── Shared: booking card with payment info ──────────── */
function paymentBadges(b) {
  const mode = b.paymentMode === 'online'
    ? `<span class="badge badge--online">💳 Online</span>`
    : `<span class="badge badge--offline">💵 Cash / at session</span>`;
  const stat = `<span class="badge badge--${b.paymentStatus}">${b.paymentStatus}</span>`;
  return `<div class="booking-tags">${mode}${stat}</div>`;
}

function bookingCard(b, opts) {
  const astro = DB.getAstro(b.astrologerId);
  const user = DB.getUser(b.userId);
  const show = opts || {};
  const who = show.user ? user && user.name : astro && astro.name;
  const sub = show.user
    ? `${b.date} · ${b.time} · ${money(b.amount)}`
    : `${b.date} · ${b.time}`;
  return `
    <div class="card booking-card">
      <div class="booking-row">
        <div>
          <div class="astro-name">${esc(who || '—')}</div>
          <div class="muted small">${fmtDate(b.date)} · ${b.time}</div>
        </div>
        <span class="badge badge--${b.status}">${b.status}</span>
      </div>
      ${paymentBadges(b)}
      <div class="booking-row muted small">
        <span>#${b.id.toUpperCase()}</span>
        <span>${money(b.amount)}</span>
      </div>
      ${b.paymentRef ? `<div class="muted tiny">Ref: ${esc(b.paymentRef)}</div>` : ''}
    </div>`;
}

function astroCard(a) {
  return `
    <a class="card astro-card" href="#/astrologer/${a.id}">
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

/* ── Router ───────────────────────────────────────────── */
function matchRoute(path) {
  if (path === '' || path === '/') return { screen: 'default', params: {} };
  const parts = path.split('/').filter(Boolean);
  const routes = ROUTES[APP] || {};
  for (const pattern in routes) {
    const pp = pattern.split('/').filter(Boolean);
    if (pp.length !== parts.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < pp.length; i++) {
      if (pp[i].startsWith(':')) params[pp[i].slice(1)] = parts[i];
      else if (pp[i] !== parts[i]) { ok = false; break; }
    }
    if (ok) return { screen: routes[pattern], params };
  }
  return { screen: 'notFound', params: {} };
}

function renderBottomNav(path) {
  const nav = document.getElementById('bottomNav');
  if (!nav) return;
  const sets = {
    user: [
      { path:'/home',     label:'Home',     icon:'🏠' },
      { path:'/bookings', label:'Bookings', icon:'📅' },
      { path:'/profile',  label:'Profile',  icon:'👤' },
    ],
    astro: [
      { path:'/dashboard', label:'Home',     icon:'📊' },
      { path:'/slots',     label:'Slots',    icon:'🕐' },
      { path:'/bookings',  label:'Bookings', icon:'📋' },
      { path:'/profile',   label:'Profile',  icon:'👤' },
    ],
    admin: [
      { path:'/dashboard',   label:'Home',        icon:'📊' },
      { path:'/astrologers', label:'Astrologers', icon:'🔮' },
      { path:'/bookings',    label:'Bookings',    icon:'📋' },
      { path:'/users',       label:'Users',       icon:'👥' },
      { path:'/audit',       label:'Audit',       icon:'📜' },
    ],
  };
  const items = sets[APP] || [];
  nav.innerHTML = items.map(it => {
    const active = path === it.path || (path === '' && it.path === '/home');
    return `<a class="nav-item ${active ? 'active' : ''}" href="#${it.path}">
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

  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    const isRoot = path === '/' || path === '';
    backBtn.style.visibility = isRoot ? 'hidden' : 'visible';
    backBtn.onclick = () => {
      if (history.length > 1) history.back();
      else location.hash = '#/';
    };
  }
  renderBottomNav(path);
  window.scrollTo(0, 0);
  if (typeof result.mount === 'function') result.mount(params);
}

/* =============================================================
   USER APP SCREENS
   ============================================================= */

function screenUserLanding() {
  return {
    title: 'Home',
    html: `
      <section class="hero">
        <div class="hero-mark">✨</div>
        <h1>BookMyAstrologer</h1>
        <p class="muted">Consult verified astrologers. Book slots. Pay online or at session.</p>
      </section>
      <div class="role-grid">
        <button class="role-card" data-goto="#/home">
          <span class="role-emoji">🙋</span>
          <span class="role-text">
            <span class="role-name">Browse astrologers</span>
            <span class="role-sub">${DB.load().astrologers.filter(a=>a.status==='approved').length} verified experts</span>
          </span>
        </button>
        <a class="role-card" href="./astro.html">
          <span class="role-emoji">🔮</span>
          <span class="role-text">
            <span class="role-name">I'm an astrologer →</span>
            <span class="role-sub">Open astrologer console</span>
          </span>
        </a>
        <a class="role-card" href="./admin.html">
          <span class="role-emoji">🛡️</span>
          <span class="role-text">
            <span class="role-name">Admin console →</span>
            <span class="role-sub">Approve astrologers, view audit</span>
          </span>
        </a>
      </div>
      <div class="note">
        <strong>Day 2 preview.</strong> Payment gateway (Razorpay / UPI) unlocks on Day 15.
        Booking flow (choose slot → confirm → pay) unlocks on Day 14.
      </div>
      <button class="btn btn--ghost" id="resetBtn">Reset demo data</button>
    `,
    mount() {
      document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => { location.hash = el.dataset.goto; });
      });
      const r = document.getElementById('resetBtn');
      if (r) r.addEventListener('click', () => { DB.reset(); render(); toast('Demo data reset'); });
    },
  };
}

function screenUserHome() {
  const approved = DB.load().astrologers.filter(a => a.status === 'approved');
  return {
    title: 'Find astrologer',
    html: `
      <div class="page-head">
        <h2>Find an astrologer</h2>
        <p class="muted small">${approved.length} verified experts</p>
      </div>
      <div class="list">${approved.map(astroCard).join('')}</div>
    `,
  };
}

function screenUserAstrologer(params) {
  const a = DB.getAstro(params.id);
  if (!a) return { title: 'Not found', html: `<div class="empty">Astrologer not found. <a href="#/home">Back</a></div>` };
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
          <p class="muted small" style="margin:2px 0 0">⭐ ${a.rating.toFixed(1)} · ${a.reviews} reviews · ${a.experience} yrs</p>
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
        ? `<p class="muted small">No slots published.</p>`
        : `<div class="slot-grid">${slots.map(s => `
            <button class="slot-chip" data-slot="${s.id}">
              <span class="slot-date">${fmtDate(s.date)}</span>
              <span class="slot-time">${s.time}</span>
            </button>`).join('')}</div>`}
      <div class="note" style="margin-top:16px">
        The full booking flow (choose slot → pick payment → confirm) unlocks on Day 14.
      </div>
    `,
    mount() {
      document.querySelectorAll('[data-slot]').forEach(b =>
        b.addEventListener('click', () => toast('Booking flow unlocks on Day 14')));
    },
  };
}

function screenUserBookings() {
  const bookings = DB.load().bookings.filter(b => b.userId === CURRENT.userId);
  return {
    title: 'My bookings',
    html: `
      <div class="page-head"><h2>My bookings</h2></div>
      ${bookings.length === 0 ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(b => bookingCard(b)).join('')}</div>`}
    `,
  };
}

function screenUserProfile() {
  const u = DB.getUser(CURRENT.userId);
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
      <div class="note">Sign-in & profile editing unlock on Days 17–20.</div>
    `,
  };
}

/* =============================================================
   ASTROLOGER APP SCREENS
   ============================================================= */

function screenAstroDashboard() {
  const a = DB.getAstro(CURRENT.astroId);
  const mine = DB.load().bookings.filter(b => b.astrologerId === a.id);
  const todayCount = mine.filter(b => b.date === todayIso()).length;
  const pending = mine.filter(b => b.status === 'pending').length;
  const earnings = mine.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  const statusLine = a.status === 'approved' ? '✅ Profile approved'
    : a.status === 'pending' ? '⏳ Awaiting admin approval'
    : '❌ Not approved — see profile for reason';
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
        <div class="stat"><div class="stat-val">${mine.length}</div><div class="stat-lbl">Total bookings</div></div>
        <div class="stat"><div class="stat-val">${money(earnings)}</div><div class="stat-lbl">Earnings (paid)</div></div>
      </div>
      <div class="action-row">
        <a class="btn" href="#/slots">Manage slots</a>
        <a class="btn btn--ghost" href="#/bookings">View bookings</a>
      </div>
    `,
  };
}

function screenAstroSlots() {
  const a = DB.getAstro(CURRENT.astroId);
  const slots = DB.load().slots.filter(s => s.astrologerId === a.id);
  const bookedIds = new Set(DB.load().bookings.filter(b => b.status !== 'cancelled').map(b => b.slotId));
  return {
    title: 'Slots',
    html: `
      <div class="page-head with-action">
        <h2>My slots</h2>
        <button class="btn btn--sm" id="addSlotBtn">+ Add slot</button>
      </div>
      ${slots.length === 0 ? `<div class="empty">No slots yet.</div>`
        : `<div class="list">${slots.map(s => `
          <div class="card slot-row">
            <div>
              <div class="astro-name">${fmtDate(s.date)}</div>
              <div class="muted small">${s.time} · ${s.duration} min · ${money(s.price)}</div>
            </div>
            ${bookedIds.has(s.id) ? `<span class="badge badge--confirmed">Booked</span>`
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
      ${bookings.length === 0 ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(b => bookingCard(b, { user: true })).join('')}</div>`}
      <div class="note" style="margin-top:16px">Accept/decline unlocks on Day 7.</div>
    `,
  };
}

function screenAstroProfile() {
  const a = DB.getAstro(CURRENT.astroId);
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
        <h3 class="h3">KYC status</h3>
        <p class="body-text">${
          a.status === 'approved' ? '✅ Verified by admin'
          : a.status === 'pending' ? '⏳ Under review'
          : '❌ Rejected'
        }</p>
        ${a.statusReason ? `<p class="body-text"><strong>Reason:</strong> ${esc(a.statusReason)}</p>` : ''}
      </div>
    `,
  };
}

/* =============================================================
   ADMIN APP SCREENS (Day 2 — the main event)
   ============================================================= */

function screenAdminDashboard() {
  const d = DB.load();
  const pending = d.astrologers.filter(a => a.status === 'pending').length;
  const approved = d.astrologers.filter(a => a.status === 'approved').length;
  const paidCount = d.bookings.filter(b => b.paymentStatus === 'paid').length;
  const onlineRev = d.bookings.filter(b => b.paymentStatus === 'paid' && b.paymentMode === 'online')
    .reduce((s, b) => s + b.amount, 0);
  const offlineRev = d.bookings.filter(b => b.paymentStatus === 'paid' && b.paymentMode === 'offline')
    .reduce((s, b) => s + b.amount, 0);
  return {
    title: 'Admin',
    html: `
      <div class="page-head"><h2>Admin overview</h2>
        <p class="muted small">Signed in as ${esc(CURRENT.adminName)}</p>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending approvals</div></div>
        <div class="stat"><div class="stat-val">${approved}</div><div class="stat-lbl">Approved astrologers</div></div>
        <div class="stat"><div class="stat-val">${d.bookings.length}</div><div class="stat-lbl">Total bookings</div></div>
        <div class="stat"><div class="stat-val">${d.users.length}</div><div class="stat-lbl">Users</div></div>
      </div>
      <div class="card" style="margin-top:8px">
        <h3 class="h3">Revenue (paid)</h3>
        <div class="stat-grid" style="margin:8px 0 0">
          <div class="stat" style="box-shadow:none;border:0;padding:8px 0">
            <div class="stat-val">${money(onlineRev)}</div>
            <div class="stat-lbl">💳 Online</div>
          </div>
          <div class="stat" style="box-shadow:none;border:0;padding:8px 0">
            <div class="stat-val">${money(offlineRev)}</div>
            <div class="stat-lbl">💵 Cash / offline</div>
          </div>
        </div>
        <p class="muted tiny">${paidCount} paid booking${paidCount === 1 ? '' : 's'} total</p>
      </div>
      <div class="action-row">
        <a class="btn" href="#/astrologers">${pending > 0 ? `Review ${pending} pending →` : 'All astrologers'}</a>
        <a class="btn btn--ghost" href="#/audit">Audit log</a>
      </div>
    `,
  };
}

let adminAstroTab = 'pending';

function screenAdminAstrologers() {
  const all = DB.load().astrologers;
  const counts = {
    pending:  all.filter(a => a.status === 'pending').length,
    approved: all.filter(a => a.status === 'approved').length,
    rejected: all.filter(a => a.status === 'rejected').length,
    all:      all.length,
  };
  const filtered = adminAstroTab === 'all' ? all
    : all.filter(a => a.status === adminAstroTab);
  const tabs = ['pending','approved','rejected','all'].map(k => `
    <button class="tab ${adminAstroTab === k ? 'active' : ''}" data-tab="${k}">
      ${k[0].toUpperCase() + k.slice(1)}
      <span class="tab-count">${counts[k]}</span>
    </button>`).join('');
  const rows = filtered.map(a => `
    <a class="card admin-row" href="#/astrologers/${a.id}">
      <div class="avatar">${initials(a.name)}</div>
      <div class="astro-info">
        <div class="astro-name">${esc(a.name)}</div>
        <div class="astro-meta">${esc(a.specialty)} · ${esc(a.city)}</div>
      </div>
      <span class="badge badge--${a.status}">${a.status}</span>
    </a>`).join('');
  return {
    title: 'Astrologers',
    html: `
      <div class="page-head"><h2>Astrologers</h2></div>
      <div class="tabs">${tabs}</div>
      ${filtered.length === 0
        ? `<div class="empty">No astrologers in this tab.</div>`
        : `<div class="list">${rows}</div>`}
    `,
    mount() {
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.addEventListener('click', () => { adminAstroTab = b.dataset.tab; render(); }));
    },
  };
}

function screenAdminAstrologerDetail(params) {
  const a = DB.getAstro(params.id);
  if (!a) return { title: 'Not found', html: `<div class="empty">Not found. <a href="#/astrologers">Back</a></div>` };
  const mine = DB.load().bookings.filter(b => b.astrologerId === a.id);
  const canAct = a.status === 'pending';
  return {
    title: a.name,
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
        <div class="detail-section">
          <div class="detail-label">Bio</div>
          <div class="detail-value">${esc(a.bio)}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Languages</div>
          <div class="detail-value">${a.languages.map(esc).join(', ')}</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Experience & fee</div>
          <div class="detail-value">${a.experience} years · ${money(a.fee)} / session</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Rating</div>
          <div class="detail-value">⭐ ${a.rating.toFixed(1)} · ${a.reviews} reviews</div>
        </div>
        <div class="detail-section">
          <div class="detail-label">KYC</div>
          <div class="detail-value">
            PAN: ${a.kyc.pan ? esc(a.kyc.pan) : '<span class="muted">not submitted</span>'}<br>
            Aadhaar: ${a.kyc.aadhaarMasked ? esc(a.kyc.aadhaarMasked) : '<span class="muted">not submitted</span>'}<br>
            Verified: ${a.kyc.verified ? '✅ Yes' : '<span class="badge badge--pending">Pending</span>'}
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-label">Bookings</div>
          <div class="detail-value">${mine.length} total</div>
        </div>
        ${a.status === 'rejected' && a.statusReason ? `
        <div class="detail-section">
          <div class="detail-label">Rejection reason</div>
          <div class="detail-value">${esc(a.statusReason)}</div>
        </div>` : ''}
      </div>

      ${canAct ? `
      <div class="action-row" style="margin-top:16px">
        <button class="btn btn--success" id="approveBtn">✓ Approve</button>
        <button class="btn btn--danger" id="rejectBtn">✕ Reject</button>
      </div>` : `
      <div class="note" style="margin-top:16px">
        This astrologer has already been ${a.status}. No action available.
      </div>`}
    `,
    mount() {
      const approve = document.getElementById('approveBtn');
      const reject  = document.getElementById('rejectBtn');
      if (approve) approve.onclick = () => {
        DB.setAstrologerStatus(a.id, 'approved');
        DB.log('admin', CURRENT.adminName, 'approve_astrologer', 'astrologer', a.id, { name: a.name });
        toast(`Approved ${a.name}`);
        location.hash = '#/astrologers';
      };
      if (reject) reject.onclick = () => {
        showModal(`
          <h3>Reject ${esc(a.name)}</h3>
          <p class="muted small">Please provide a reason. The astrologer will see this.</p>
          <textarea id="reasonInput" placeholder="e.g. PAN document unclear, please re-submit"></textarea>
          <div class="modal-actions">
            <button class="btn btn--ghost" id="cancelBtn">Cancel</button>
            <button class="btn btn--danger" id="confirmReject">Reject</button>
          </div>
        `);
        document.getElementById('cancelBtn').onclick = closeModal;
        document.getElementById('confirmReject').onclick = () => {
          const reason = document.getElementById('reasonInput').value.trim();
          if (!reason) { toast('Please enter a reason'); return; }
          DB.setAstrologerStatus(a.id, 'rejected', reason);
          DB.log('admin', CURRENT.adminName, 'reject_astrologer', 'astrologer', a.id,
            { name: a.name, reason });
          closeModal();
          toast(`Rejected ${a.name}`);
          location.hash = '#/astrologers';
        };
      };
    },
  };
}

function screenAdminBookings() {
  const bookings = [...DB.load().bookings].sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  return {
    title: 'Bookings',
    html: `
      <div class="page-head"><h2>All bookings</h2>
        <p class="muted small">${bookings.length} total · admin view shows user & payment</p>
      </div>
      ${bookings.length === 0 ? `<div class="empty">No bookings yet.</div>`
        : `<div class="list">${bookings.map(b => {
          const user = DB.getUser(b.userId);
          const astro = DB.getAstro(b.astrologerId);
          return `
            <div class="card booking-card">
              <div class="booking-row">
                <div>
                  <div class="astro-name">${esc(astro ? astro.name : '—')}</div>
                  <div class="muted small">Booked by ${esc(user ? user.name : '—')}</div>
                </div>
                <span class="badge badge--${b.status}">${b.status}</span>
              </div>
              <div class="muted small">${fmtDate(b.date)} · ${b.time}</div>
              ${paymentBadges(b)}
              <div class="booking-row muted small">
                <span>#${b.id.toUpperCase()}</span>
                <span>${money(b.amount)}</span>
              </div>
              ${b.paymentRef ? `<div class="muted tiny">Ref: ${esc(b.paymentRef)}</div>` : ''}
            </div>`;
        }).join('')}</div>`}
    `,
  };
}

function screenAdminUsers() {
  const users = DB.load().users;
  return {
    title: 'Users',
    html: `
      <div class="page-head"><h2>Users</h2><p class="muted small">${users.length} registered</p></div>
      <div class="list">${users.map(u => {
        const bc = DB.load().bookings.filter(b => b.userId === u.id).length;
        return `
          <div class="card admin-row">
            <div class="avatar">${initials(u.name)}</div>
            <div class="astro-info">
              <div class="astro-name">${esc(u.name)}</div>
              <div class="astro-meta">${esc(u.email)}</div>
            </div>
            <div class="muted small">${bc} booking${bc === 1 ? '' : 's'}</div>
          </div>`;
      }).join('')}</div>
    `,
  };
}

function screenAdminAudit() {
  const logs = DB.listAudit();
  return {
    title: 'Audit log',
    html: `
      <div class="page-head"><h2>Audit log</h2>
        <p class="muted small">Every admin action is recorded here</p>
      </div>
      ${logs.length === 0 ? `<div class="empty">No actions yet.</div>` :
        `<div class="card">${logs.map(l => `
          <div class="audit-row">
            <div class="audit-line">
              <span class="audit-actor">${esc(l.actorName)}</span>
              <span class="audit-time">${fmtDateTime(l.ts)}</span>
            </div>
            <div class="audit-action">${esc(l.action.replace(/_/g,' '))} → ${esc(l.meta.name || l.targetId)}</div>
            ${l.meta.reason ? `<div class="audit-meta">Reason: ${esc(l.meta.reason)}</div>` : ''}
          </div>`).join('')}</div>`}
    `,
  };
}

function screenNotFound() {
  return {
    title: 'Not found',
    html: `<div class="empty">Page not found. <a href="#/">Home</a></div>`,
  };
}

/* ── Screen registry ─────────────────────────────────── */
const SCREENS = {
  default: APP === 'admin' ? screenAdminDashboard
        : APP === 'astro' ? screenAstroDashboard
        : screenUserLanding,
  // user
  userLanding: screenUserLanding,
  userHome: screenUserHome,
  userAstrologer: screenUserAstrologer,
  userBookings: screenUserBookings,
  userProfile: screenUserProfile,
  // astro
  astroDashboard: screenAstroDashboard,
  astroSlots: screenAstroSlots,
  astroBookings: screenAstroBookings,
  astroProfile: screenAstroProfile,
  // admin
  adminDashboard: screenAdminDashboard,
  adminAstrologers: screenAdminAstrologers,
  adminAstrologerDetail: screenAdminAstrologerDetail,
  adminBookings: screenAdminBookings,
  adminUsers: screenAdminUsers,
  adminAudit: screenAdminAudit,
  notFound: screenNotFound,
};

/* ── Route tables per app ────────────────────────────── */
const ROUTES = {
  user: {
    '/home':                'userHome',
    '/astrologer/:id':      'userAstrologer',
    '/bookings':            'userBookings',
    '/profile':             'userProfile',
  },
  astro: {
    '/dashboard': 'astroDashboard',
    '/slots':     'astroSlots',
    '/bookings':  'astroBookings',
    '/profile':   'astroProfile',
  },
  admin: {
    '/dashboard':          'adminDashboard',
    '/astrologers':        'adminAstrologers',
    '/astrologers/:id':    'adminAstrologerDetail',
    '/bookings':           'adminBookings',
    '/users':              'adminUsers',
    '/audit':              'adminAudit',
  },
};

/* ── Boot ─────────────────────────────────────────────── */
function boot() {
  DB.load();
  if (!location.hash) {
    history.replaceState(null, '', APP === 'user' ? '#/home' : '#/dashboard');
  }
  window.addEventListener('hashchange', render);
  render();
  if ('serviceWorker' in navigator && APP === 'user') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
