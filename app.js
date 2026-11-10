/* ================================================================
   BookMyAstrologer — App (Day 3)
   Three apps in one codebase: User · Astrologer · Admin
   Architecture:
     §1 Constants         §4 UI primitives
     §2 Utilities         §5 Shared components
     §3 Store + Actions   §6 Screens  §7 Routes  §8 Router  §9 Boot
   ================================================================ */

/* ─── §1 Constants ───────────────────────────────────────────── */
const APP = document.body.dataset.app || 'user';
const CONFIG = {
  appName: 'BookMyAstrologer',
  currency: '₹',
  storageKey: 'bma_db_v3',
  version: 'day3',
};
const CURRENT = {
  userId: 'u1',
  astroId: 'a1',
  adminName: 'Super Admin',
};
const AUDIT_META = {
  approve_astrologer: { icon: '✓', cls: 'success', label: 'Approved astrologer' },
  reject_astrologer:  { icon: '✕', cls: 'danger',  label: 'Rejected astrologer' },
  ban_user:           { icon: '🚫', cls: 'danger', label: 'Banned user' },
  unban_user:         { icon: '🔓', cls: 'success', label: 'Unbanned user' },
  cancel_booking:     { icon: '✕', cls: 'danger',  label: 'Cancelled booking' },
  mark_paid:          { icon: '💵', cls: 'success', label: 'Marked payment received' },
};

/* Global UI state (persists across renders) */
const state = {
  adminAstroTab: 'pending',
  adminUserFilter: 'all',
  adminUserQuery: '',
  adminBookingFilter: 'all',
  adminBookingQuery: '',
};

/* ─── §2 Utilities ───────────────────────────────────────────── */
const U = {
  esc: (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  )),
  money: (n) => CONFIG.currency + Number(n || 0).toLocaleString('en-IN'),
  initials: (name) => String(name || '').split(/\s+/).map(w => w[0] || '').join('').slice(0, 2).toUpperCase(),
  fmtDate: (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN',
    { weekday: 'short', day: 'numeric', month: 'short' }),
  fmtDateTime: (iso) => new Date(iso).toLocaleString('en-IN',
    { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
  relTime: (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  },
  todayIso: () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
  nowIso: () => new Date().toISOString(),
  uid: (p = 'id') => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
  debounce: (fn, ms = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  },
};

/* ─── §3 Store (data layer) ──────────────────────────────────── */
const Store = {
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

  /* getters */
  getAstro:    (id) => Store.load().astrologers.find(a => a.id === id),
  getUser:     (id) => Store.load().users.find(u => u.id === id),
  getBooking:  (id) => Store.load().bookings.find(b => b.id === id),
  getSlot:     (id) => Store.load().slots.find(s => s.id === id),

  listAstros:    (status) => status ? Store.load().astrologers.filter(a => a.status === status) : Store.load().astrologers,
  listUsers:     ()       => Store.load().users,
  listBookings:  ()       => Store.load().bookings,
  listSlots:     (astroId) => astroId ? Store.load().slots.filter(s => s.astrologerId === astroId) : Store.load().slots,
  listAudit:     ()       => [...Store.load().audit].sort((a, b) => b.ts.localeCompare(a.ts)),
  listBookingAudit: (bookingId) => Store.load().audit
    .filter(l => l.targetType === 'booking' && l.targetId === bookingId)
    .sort((a, b) => a.ts.localeCompare(b.ts)),

  /* mutations */
  updateAstro(id, patch) {
    const a = this.load().astrologers.find(x => x.id === id);
    if (!a) return null;
    Object.assign(a, patch);
    this.save();
    return a;
  },
  updateUser(id, patch) {
    const u = this.load().users.find(x => x.id === id);
    if (!u) return null;
    Object.assign(u, patch);
    this.save();
    return u;
  },
  updateBooking(id, patch) {
    const b = this.load().bookings.find(x => x.id === id);
    if (!b) return null;
    Object.assign(b, patch);
    this.save();
    return b;
  },
  log(actorRole, actorName, action, targetType, targetId, meta) {
    this.load().audit.push({
      id: U.uid('log'),
      ts: U.nowIso(),
      actorRole, actorName, action, targetType, targetId,
      meta: meta || {},
    });
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
    const now = U.nowIso();
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
      { id:'s6', astrologerId:'a2', date: day(0), time:'12:00', duration:45, price:750 },
      { id:'s7', astrologerId:'a2', date: day(1), time:'14:00', duration:45, price:750 },
    ];

    const bookings = [
      { id:'b1', userId:'u1', astrologerId:'a1', slotId:'s1', date: day(0), time:'10:00',
        amount:500, status:'confirmed', paymentMode:'online', paymentStatus:'paid',
        paymentRef:'pay_RZP_A1B2C3', createdAt: daysAgo(2), paidAt: daysAgo(2) },
      { id:'b2', userId:'u1', astrologerId:'a2', slotId:'s7', date: day(1), time:'14:00',
        amount:750, status:'pending', paymentMode:'offline', paymentStatus:'unpaid',
        paymentRef:null, createdAt: now },
      { id:'b3', userId:'u2', astrologerId:'a1', slotId:'s0-old', date: day(-3), time:'11:00',
        amount:500, status:'completed', paymentMode:'offline', paymentStatus:'paid',
        paymentRef:'CASH-session-42', createdAt: daysAgo(4), paidAt: daysAgo(3) },
      { id:'b4', userId:'u3', astrologerId:'a2', slotId:'s6', date: day(-1), time:'12:00',
        amount:750, status:'cancelled', paymentMode:'online', paymentStatus:'refunded',
        paymentRef:'pay_RZP_D4E5F6', refundAmount:750, refundReason:'Astrologer unavailable',
        createdAt: daysAgo(5), paidAt: daysAgo(5), refundedAt: daysAgo(4), cancelledAt: daysAgo(4) },
    ];

    const users = [
      { id:'u1', name:'Aarav Mehta', email:'aarav@example.com', phone:'+91 98765 43210',
        joinedAt: daysAgo(45), banned:false },
      { id:'u2', name:'Priya Nair', email:'priya@example.com', phone:'+91 91234 56789',
        joinedAt: daysAgo(22), banned:false },
      { id:'u3', name:'Vikram Singh', email:'vikram@example.com', phone:'+91 99887 76655',
        joinedAt: daysAgo(12), banned:false },
    ];

    const audit = [
      { id:'log-s1', ts: daysAgo(3), actorRole:'admin', actorName:'Super Admin',
        action:'approve_astrologer', targetType:'astrologer', targetId:'a1',
        meta:{ name:'Pandit Rajesh Sharma' } },
      { id:'log-s2', ts: daysAgo(5), actorRole:'admin', actorName:'Super Admin',
        action:'reject_astrologer', targetType:'astrologer', targetId:'a4',
        meta:{ name:'Sunita Kapoor', reason:'PAN number did not match uploaded document.' } },
      { id:'log-s3', ts: daysAgo(4), actorRole:'admin', actorName:'Super Admin',
        action:'cancel_booking', targetType:'booking', targetId:'b4',
        meta:{ reason:'Astrologer unavailable', refunded:true, refundAmount:750 } },
    ];

    return { astrologers, slots, bookings, users, audit };
  },
};

/* ─── §3b Actions (business logic) ───────────────────────────── */
const Actions = {
  approveAstrologer(id) {
    const a = Store.getAstro(id);
    if (!a) return { error: 'Astrologer not found' };
    if (a.status === 'approved') return { error: 'Already approved' };
    Store.updateAstro(id, { status: 'approved', statusReason: null, statusUpdatedAt: U.nowIso() });
    Store.log('admin', CURRENT.adminName, 'approve_astrologer', 'astrologer', id, { name: a.name });
    return { ok: true, message: `Approved ${a.name}` };
  },

  rejectAstrologer(id, reason) {
    const a = Store.getAstro(id);
    if (!a) return { error: 'Astrologer not found' };
    if (!reason || reason.trim().length < 5) return { error: 'Reason must be at least 5 characters' };
    Store.updateAstro(id, { status: 'rejected', statusReason: reason.trim(), statusUpdatedAt: U.nowIso() });
    Store.log('admin', CURRENT.adminName, 'reject_astrologer', 'astrologer', id, { name: a.name, reason: reason.trim() });
    return { ok: true, message: `Rejected ${a.name}` };
  },

  banUser(id, reason) {
    const u = Store.getUser(id);
    if (!u) return { error: 'User not found' };
    if (u.banned) return { error: 'Already banned' };
    if (!reason || reason.trim().length < 5) return { error: 'Reason must be at least 5 characters' };
    Store.updateUser(id, { banned: true, bannedReason: reason.trim(), bannedAt: U.nowIso() });
    Store.log('admin', CURRENT.adminName, 'ban_user', 'user', id, { name: u.name, reason: reason.trim() });
    return { ok: true, message: `Banned ${u.name}` };
  },

  unbanUser(id) {
    const u = Store.getUser(id);
    if (!u) return { error: 'User not found' };
    if (!u.banned) return { error: 'User is not banned' };
    Store.updateUser(id, { banned: false, bannedReason: null, bannedAt: null });
    Store.log('admin', CURRENT.adminName, 'unban_user', 'user', id, { name: u.name });
    return { ok: true, message: `Unbanned ${u.name}` };
  },

  cancelBooking(id, reason) {
    const b = Store.getBooking(id);
    if (!b) return { error: 'Booking not found' };
    if (b.status === 'cancelled') return { error: 'Already cancelled' };
    if (b.status === 'completed') return { error: 'Cannot cancel a completed session' };
    if (!reason || reason.trim().length < 5) return { error: 'Reason must be at least 5 characters' };

    const patch = {
      status: 'cancelled',
      cancelledAt: U.nowIso(),
      cancelledBy: 'admin',
      cancelledReason: reason.trim(),
    };
    let refunded = false;
    if (b.paymentStatus === 'paid') {
      patch.paymentStatus = 'refunded';
      patch.refundAmount = b.amount;
      patch.refundReason = reason.trim();
      patch.refundedAt = U.nowIso();
      refunded = true;
    }
    Store.updateBooking(id, patch);
    Store.log('admin', CURRENT.adminName, 'cancel_booking', 'booking', id,
      { reason: reason.trim(), refunded, refundAmount: refunded ? b.amount : 0 });

    return {
      ok: true,
      message: refunded ? `Cancelled & refunded ${U.money(b.amount)}` : 'Booking cancelled',
    };
  },

  markBookingPaid(id, ref) {
    const b = Store.getBooking(id);
    if (!b) return { error: 'Booking not found' };
    if (b.paymentStatus !== 'unpaid') return { error: 'Booking is not unpaid' };
    if (b.status === 'cancelled') return { error: 'Cannot mark a cancelled booking as paid' };
    Store.updateBooking(id, {
      paymentStatus: 'paid',
      paymentRef: (ref || '').trim() || `CASH-${Date.now().toString(36)}`,
      paidAt: U.nowIso(),
    });
    Store.log('admin', CURRENT.adminName, 'mark_paid', 'booking', id,
      { amount: b.amount, ref: ref || 'cash' });
    return { ok: true, message: 'Marked as paid' };
  },
};

/* ─── §4 UI primitives ────────────────────────────────────────── */
let _toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-backdrop is-open"><div class="modal">${html}</div></div>`;
  const bd = root.querySelector('.modal-backdrop');
  bd.addEventListener('click', (e) => { if (e.target === bd) closeModal(); });
  // auto-focus first input
  const inp = bd.querySelector('input, textarea');
  if (inp) setTimeout(() => inp.focus(), 50);
}
function closeModal() {
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}

/* run an action, then refresh + toast */
function exec(fn) {
  try {
    const res = fn();
    if (!res) return;
    if (res.ok) {
      closeModal();
      render();
      toast(res.message || 'Done');
    } else if (res.error) {
      toast(res.error);
    }
  } catch (err) {
    console.error(err);
    toast('Something went wrong');
  }
}

/* reusable confirm dialog */
function confirmDialog({ title, message, confirmText = 'Confirm', danger = false, onConfirm }) {
  openModal(`
    <h3 class="modal__title">${U.esc(title)}</h3>
    <p class="modal__message">${U.esc(message)}</p>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Cancel</button>
      <button class="btn ${danger ? 'btn--danger' : ''}" data-confirm>${U.esc(confirmText)}</button>
    </div>
  `);
  document.querySelector('[data-close]').onclick = closeModal;
  document.querySelector('[data-confirm]').onclick = () => {
    if (onConfirm) onConfirm();
  };
}

/* reusable prompt-for-reason dialog */
function reasonDialog({ title, message, placeholder, confirmText = 'Confirm', danger = false, onConfirm }) {
  openModal(`
    <h3 class="modal__title">${U.esc(title)}</h3>
    <p class="modal__message">${U.esc(message)}</p>
    <div class="field">
      <label class="field__label" for="reasonInput">Reason</label>
      <textarea id="reasonInput" class="field__input" placeholder="${U.esc(placeholder || 'Type your reason…')}" maxlength="300"></textarea>
      <div class="field__error" id="reasonError" style="display:none"></div>
    </div>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Cancel</button>
      <button class="btn ${danger ? 'btn--danger' : ''}" data-confirm>${U.esc(confirmText)}</button>
    </div>
  `);
  const input = document.getElementById('reasonInput');
  const err = document.getElementById('reasonError');
  document.querySelector('[data-close]').onclick = closeModal;
  document.querySelector('[data-confirm]').onclick = () => {
    const v = input.value.trim();
    if (v.length < 5) {
      err.textContent = 'Please enter at least 5 characters';
      err.style.display = 'block';
      input.focus();
      return;
    }
    onConfirm(v);
  };
  input.addEventListener('input', () => { err.style.display = 'none'; });
}

/* ─── §5 Shared components ───────────────────────────────────── */
const C = {
  badge: (status) => `<span class="badge badge--${status}">${status}</span>`,

  avatar: (name, opts = {}) => {
    const cls = opts.banned ? 'avatar avatar--banned' : (opts.large ? 'avatar avatar--lg' : 'avatar');
    return `<div class="${cls}">${U.initials(name)}</div>`;
  },

  empty: (icon, title, sub) => `
    <div class="empty">
      <span class="empty__icon">${icon}</span>
      <div class="empty__title">${U.esc(title)}</div>
      <div class="small">${U.esc(sub || '')}</div>
    </div>`,

  paymentBadges: (b) => {
    const mode = b.paymentMode === 'online'
      ? `<span class="badge badge--online">💳 Online</span>`
      : `<span class="badge badge--offline">💵 Cash / offline</span>`;
    const stat = `<span class="badge badge--${b.paymentStatus}">${b.paymentStatus}</span>`;
    return `<div class="booking-tags">${mode}${stat}</div>`;
  },

  bookingCard: (b, opts = {}) => {
    const astro = Store.getAstro(b.astrologerId);
    const user = Store.getUser(b.userId);
    const who = opts.showUser ? (user && user.name) : (astro && astro.name);
    const href = opts.href || null;
    const wrap = href
      ? `<a class="card booking-card" href="${href}">`
      : `<div class="card booking-card">`;
    const close = href ? '</a>' : '</div>';
    return `${wrap}
      <div class="booking-row">
        <div>
          <div class="row-title">${U.esc(who || '—')}</div>
          <div class="muted small">${U.fmtDate(b.date)} · ${b.time}</div>
        </div>
        ${C.badge(b.status)}
      </div>
      ${C.paymentBadges(b)}
      <div class="booking-row muted small">
        <span>#${b.id.toUpperCase()}</span>
        <span>${U.money(b.amount)}</span>
      </div>
      ${b.paymentRef ? `<div class="muted tiny mono">Ref: ${U.esc(b.paymentRef)}</div>` : ''}
      ${b.refundAmount ? `<div class="muted tiny">Refunded ${U.money(b.refundAmount)}${b.refundReason ? ' · ' + U.esc(b.refundReason) : ''}</div>` : ''}
    ${close}`;
  },

  astroCardPublic: (a) => `
    <a class="card astro-card" href="#/astrologer/${a.id}">
      ${C.avatar(a.name)}
      <div class="row-info">
        <div class="row-title">${U.esc(a.name)}</div>
        <div class="row-sub">${U.esc(a.specialty)} · ${U.esc(a.city)}</div>
        <div class="astro-rating">⭐ ${a.rating.toFixed(1)} <span class="muted">· ${a.reviews} reviews</span></div>
      </div>
      <div class="row-side">
        <div class="fee">${U.money(a.fee)}</div>
        <div class="muted tiny">/session</div>
      </div>
    </a>`,

  timelineItem: (icon, cls, title, time) => `
    <div class="timeline-item">
      <div class="timeline-icon ${cls ? 'timeline-icon--' + cls : ''}">${icon}</div>
      <div class="timeline-body">
        <div class="timeline-title">${U.esc(title)}</div>
        <div class="timeline-time">${U.esc(time)}</div>
      </div>
    </div>`,
};

/* ─── §6 Screens ─────────────────────────────────────────────── */

/* ── USER screens ── */

function screenUserLanding() {
  return {
    title: 'Home',
    html: `
      <section class="hero">
        <div class="hero-mark">✨</div>
        <h1>BookMyAstrologer</h1>
        <p>Consult verified astrologers · Pay online or at session</p>
      </section>
      <div class="role-grid">
        <button class="role-card" data-goto="#/home">
          <span class="role-emoji">🙋</span>
          <span class="role-text">
            <span class="role-name">Browse astrologers</span>
            <span class="role-sub">${Store.listAstros('approved').length} verified experts</span>
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
            <span class="role-sub">Manage astrologers, users, bookings</span>
          </span>
        </a>
      </div>
      <div class="note">
        <strong>Day 3 preview.</strong> Payment gateway (Razorpay) unlocks on Day 15.
        Full booking flow unlocks on Day 14.
      </div>
      <button class="btn btn--ghost" id="resetBtn">Reset demo data</button>
    `,
    mount() {
      document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => { location.hash = el.dataset.goto; });
      });
      const r = document.getElementById('resetBtn');
      if (r) r.addEventListener('click', () => {
        confirmDialog({
          title: 'Reset demo data?',
          message: 'This clears all local data and restores the seed. All your changes will be lost.',
          confirmText: 'Reset',
          danger: true,
          onConfirm: () => {
            Store.reset();
            closeModal();
            render();
            toast('Demo data reset');
          },
        });
      });
    },
  };
}

function screenUserHome() {
  const approved = Store.listAstros('approved');
  return {
    title: 'Find astrologer',
    html: `
      <div class="page-head">
        <h2>Find an astrologer</h2>
        <p>${approved.length} verified experts</p>
      </div>
      ${approved.length === 0
        ? C.empty('🔮', 'No astrologers yet', 'Check back soon')
        : `<div class="list">${approved.map(C.astroCardPublic).join('')}</div>`}
    `,
  };
}

function screenUserAstrologer(params) {
  const a = Store.getAstro(params.id);
  if (!a || a.status !== 'approved') {
    return {
      title: 'Not found',
      html: C.empty('🔮', 'Astrologer not found', 'They may have been removed.'),
    };
  }
  const bookedSlotIds = new Set(
    Store.listBookings().filter(b => b.status !== 'cancelled').map(b => b.slotId)
  );
  const slots = Store.listSlots(a.id).filter(s => !bookedSlotIds.has(s.id));
  return {
    title: a.name,
    html: `
      <div class="profile-head">
        ${C.avatar(a.name, { large: true })}
        <div>
          <h2 class="h2">${U.esc(a.name)}</h2>
          <p class="muted">${U.esc(a.specialty)} · ${U.esc(a.city)}</p>
          <p class="muted small">⭐ ${a.rating.toFixed(1)} · ${a.reviews} reviews · ${a.experience} yrs</p>
        </div>
      </div>
      <div class="section-card">
        <div class="section-card__title">About</div>
        <p class="body-text">${U.esc(a.bio)}</p>
        <p class="body-text"><strong>Languages:</strong> ${a.languages.map(U.esc).join(', ')}</p>
        <p class="body-text"><strong>Fee:</strong> ${U.money(a.fee)} per session</p>
      </div>
      <div class="section-card">
        <div class="section-card__title">Available slots</div>
        ${slots.length === 0
          ? `<p class="muted small">No slots available right now.</p>`
          : `<div class="slot-grid">${slots.map(s => `
              <button class="slot-chip" data-slot="${s.id}">
                <span class="slot-date">${U.fmtDate(s.date)}</span>
                <span class="slot-time">${s.time}</span>
              </button>`).join('')}</div>`}
      </div>
      <div class="note">
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
  const bookings = Store.listBookings().filter(b => b.userId === CURRENT.userId);
  return {
    title: 'My bookings',
    html: `
      <div class="page-head"><h2>My bookings</h2></div>
      ${bookings.length === 0
        ? C.empty('📅', 'No bookings yet', 'Browse astrologers to book a session.')
        : `<div class="list">${bookings.map(b => C.bookingCard(b)).join('')}</div>`}
    `,
  };
}

function screenUserProfile() {
  const u = Store.getUser(CURRENT.userId);
  const bookings = Store.listBookings().filter(b => b.userId === CURRENT.userId);
  const spent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  return {
    title: 'Profile',
    html: `
      <div class="profile-head">
        ${C.avatar(u.name, { large: true })}
        <div>
          <h2 class="h2">${U.esc(u.name)}</h2>
          <p class="muted">${U.esc(u.email)}</p>
          <p class="muted">${U.esc(u.phone)}</p>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${bookings.length}</div><div class="stat-lbl">Bookings</div></div>
        <div class="stat"><div class="stat-val">${U.money(spent)}</div><div class="stat-lbl">Total spent</div></div>
      </div>
      <div class="note">Sign-in & profile editing unlock on Days 17–20.</div>
    `,
  };
}

/* ── ASTROLOGER screens ── */

function screenAstroDashboard() {
  const a = Store.getAstro(CURRENT.astroId);
  const mine = Store.listBookings().filter(b => b.astrologerId === a.id);
  const todayCount = mine.filter(b => b.date === U.todayIso() && b.status !== 'cancelled').length;
  const pending = mine.filter(b => b.status === 'pending').length;
  const earnings = mine.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  const statusLine = a.status === 'approved' ? '✅ Profile approved'
    : a.status === 'pending' ? '⏳ Awaiting admin approval'
    : '❌ Not approved — see profile';
  return {
    title: 'Dashboard',
    html: `
      <div class="page-head">
        <h2>Hi, ${U.esc(a.name.split(' ')[0])} 👋</h2>
        <p>${statusLine}</p>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${todayCount}</div><div class="stat-lbl">Today's bookings</div></div>
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending requests</div></div>
        <div class="stat"><div class="stat-val">${mine.length}</div><div class="stat-lbl">Total bookings</div></div>
        <div class="stat"><div class="stat-val">${U.money(earnings)}</div><div class="stat-lbl">Earnings (paid)</div></div>
      </div>
      <div class="action-row">
        <a class="btn" href="#/slots">Manage slots</a>
        <a class="btn btn--ghost" href="#/bookings">View bookings</a>
      </div>
    `,
  };
}

function screenAstroSlots() {
  const a = Store.getAstro(CURRENT.astroId);
  const slots = Store.listSlots(a.id);
  const bookedIds = new Set(Store.listBookings().filter(b => b.status !== 'cancelled').map(b => b.slotId));
  return {
    title: 'Slots',
    html: `
      <div class="page-head with-action">
        <h2>My slots</h2>
        <button class="btn btn--sm" id="addSlotBtn">+ Add slot</button>
      </div>
      ${slots.length === 0
        ? C.empty('🕐', 'No slots yet', 'Create slots so users can book sessions.')
        : `<div class="list">${slots.map(s => `
            <div class="card slot-row booking-row">
              <div>
                <div class="row-title">${U.fmtDate(s.date)}</div>
                <div class="muted small">${s.time} · ${s.duration} min · ${U.money(s.price)}</div>
              </div>
              ${bookedIds.has(s.id) ? C.badge('confirmed') : C.badge('approved')}
            </div>`).join('')}</div>`}
      <div class="note">Slot creation unlocks on Day 5.</div>
    `,
    mount() {
      const btn = document.getElementById('addSlotBtn');
      if (btn) btn.addEventListener('click', () => toast('Slot creation unlocks on Day 5'));
    },
  };
}

function screenAstroBookings() {
  const bookings = Store.listBookings().filter(b => b.astrologerId === CURRENT.astroId);
  return {
    title: 'Bookings',
    html: `
      <div class="page-head"><h2>Booking requests</h2></div>
      ${bookings.length === 0
        ? C.empty('📋', 'No bookings yet', 'Bookings from users will appear here.')
        : `<div class="list">${bookings.map(b => C.bookingCard(b, { showUser: true })).join('')}</div>`}
      <div class="note">Accept/decline unlocks on Day 7.</div>
    `,
  };
}

function screenAstroProfile() {
  const a = Store.getAstro(CURRENT.astroId);
  return {
    title: 'Profile',
    html: `
      <div class="profile-head">
        ${C.avatar(a.name, { large: true })}
        <div>
          <h2 class="h2">${U.esc(a.name)}</h2>
          <p class="muted">${U.esc(a.specialty)} · ${U.esc(a.city)}</p>
          <p style="margin-top:6px">${C.badge(a.status)}</p>
        </div>
      </div>
      <div class="section-card">
        <div class="section-card__title">KYC status</div>
        <p class="body-text">${
          a.status === 'approved' ? '✅ Verified by admin'
          : a.status === 'pending' ? '⏳ Under review'
          : '❌ Not approved'
        }</p>
        ${a.statusReason ? `<p class="body-text"><strong>Reason:</strong> ${U.esc(a.statusReason)}</p>` : ''}
      </div>
    `,
  };
}

/* ── ADMIN screens ── */

function screenAdminDashboard() {
  const d = Store.load();
  const pending = d.astrologers.filter(a => a.status === 'pending').length;
  const approved = d.astrologers.filter(a => a.status === 'approved').length;
  const onlineRev = d.bookings.filter(b => b.paymentStatus === 'paid' && b.paymentMode === 'online').reduce((s, b) => s + b.amount, 0);
  const offlineRev = d.bookings.filter(b => b.paymentStatus === 'paid' && b.paymentMode === 'offline').reduce((s, b) => s + b.amount, 0);
  const refunded = d.bookings.filter(b => b.paymentStatus === 'refunded').reduce((s, b) => s + (b.refundAmount || 0), 0);
  return {
    title: 'Admin',
    html: `
      <div class="page-head">
        <h2>Admin overview</h2>
        <p>Signed in as ${U.esc(CURRENT.adminName)}</p>
      </div>
      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${pending}</div><div class="stat-lbl">Pending approvals</div></div>
        <div class="stat"><div class="stat-val">${approved}</div><div class="stat-lbl">Approved astrologers</div></div>
        <div class="stat"><div class="stat-val">${d.bookings.length}</div><div class="stat-lbl">Total bookings</div></div>
        <div class="stat"><div class="stat-val">${d.users.length}</div><div class="stat-lbl">Users</div></div>
      </div>
      <div class="section-card">
        <div class="section-card__title">Revenue (paid)</div>
        <div class="kv">
          <div class="kv__row"><span class="kv__label">💳 Online</span><span class="kv__value">${U.money(onlineRev)}</span></div>
          <div class="kv__row"><span class="kv__label">💵 Cash / offline</span><span class="kv__value">${U.money(offlineRev)}</span></div>
          <div class="kv__row"><span class="kv__label">💸 Refunded</span><span class="kv__value" style="color:var(--c-danger)">${U.money(refunded)}</span></div>
        </div>
      </div>
      <div class="action-row">
        <a class="btn" href="#/astrologers">${pending > 0 ? `Review ${pending} pending →` : 'All astrologers'}</a>
        <a class="btn btn--ghost" href="#/audit">Audit log</a>
      </div>
    `,
  };
}

function screenAdminAstrologers() {
  const all = Store.listAstros();
  const counts = {
    pending:  all.filter(a => a.status === 'pending').length,
    approved: all.filter(a => a.status === 'approved').length,
    rejected: all.filter(a => a.status === 'rejected').length,
    all:      all.length,
  };
  const filtered = state.adminAstroTab === 'all' ? all : all.filter(a => a.status === state.adminAstroTab);
  const tabs = ['pending','approved','rejected','all'].map(k => `
    <button class="tab ${state.adminAstroTab === k ? 'active' : ''}" data-tab="${k}">
      ${k[0].toUpperCase() + k.slice(1)} <span class="tab-count">${counts[k]}</span>
    </button>`).join('');
  return {
    title: 'Astrologers',
    html: `
      <div class="page-head"><h2>Astrologers</h2></div>
      <div class="tabs">${tabs}</div>
      ${filtered.length === 0
        ? C.empty('🔮', 'Nothing here', 'No astrologers in this tab.')
        : `<div class="list">${filtered.map(a => `
            <a class="card row" href="#/astrologers/${a.id}">
              ${C.avatar(a.name)}
              <div class="row-info">
                <div class="row-title">${U.esc(a.name)}</div>
                <div class="row-sub">${U.esc(a.specialty)} · ${U.esc(a.city)}</div>
              </div>
              ${C.badge(a.status)}
            </a>`).join('')}</div>`}
    `,
    mount() {
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.addEventListener('click', () => { state.adminAstroTab = b.dataset.tab; render(); }));
    },
  };
}

function screenAdminAstrologerDetail(params) {
  const a = Store.getAstro(params.id);
  if (!a) return { title: 'Not found', html: C.empty('🔮', 'Not found', '') };
  const mine = Store.listBookings().filter(b => b.astrologerId === a.id);
  const canAct = a.status === 'pending';
  return {
    title: a.name,
    html: `
      <div class="profile-head">
        ${C.avatar(a.name, { large: true })}
        <div>
          <h2 class="h2">${U.esc(a.name)}</h2>
          <p class="muted">${U.esc(a.specialty)} · ${U.esc(a.city)}</p>
          <p style="margin-top:6px">${C.badge(a.status)}</p>
        </div>
      </div>

      <div class="section-card">
        <div class="section-card__title">Profile</div>
        <p class="body-text">${U.esc(a.bio)}</p>
        <div class="kv" style="margin-top:8px">
          <div class="kv__row"><span class="kv__label">Languages</span><span class="kv__value">${a.languages.map(U.esc).join(', ')}</span></div>
          <div class="kv__row"><span class="kv__label">Experience</span><span class="kv__value">${a.experience} years</span></div>
          <div class="kv__row"><span class="kv__label">Fee</span><span class="kv__value">${U.money(a.fee)} / session</span></div>
          <div class="kv__row"><span class="kv__label">Rating</span><span class="kv__value">⭐ ${a.rating.toFixed(1)} · ${a.reviews} reviews</span></div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-card__title">KYC</div>
        <div class="kv">
          <div class="kv__row"><span class="kv__label">PAN</span><span class="kv__value mono">${a.kyc.pan ? U.esc(a.kyc.pan) : '<span class="muted">not submitted</span>'}</span></div>
          <div class="kv__row"><span class="kv__label">Aadhaar</span><span class="kv__value mono">${a.kyc.aadhaarMasked ? U.esc(a.kyc.aadhaarMasked) : '<span class="muted">not submitted</span>'}</span></div>
          <div class="kv__row"><span class="kv__label">Verified</span><span class="kv__value">${a.kyc.verified ? '✅ Yes' : C.badge('pending')}</span></div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-card__title">Activity</div>
        <div class="kv">
          <div class="kv__row"><span class="kv__label">Bookings</span><span class="kv__value">${mine.length}</span></div>
          ${a.submittedAt ? `<div class="kv__row"><span class="kv__label">Submitted</span><span class="kv__value">${U.relTime(a.submittedAt)}</span></div>` : ''}
          ${a.statusUpdatedAt ? `<div class="kv__row"><span class="kv__label">Status updated</span><span class="kv__value">${U.relTime(a.statusUpdatedAt)}</span></div>` : ''}
        </div>
        ${a.status === 'rejected' && a.statusReason ? `
          <p class="body-text" style="margin-top:12px"><strong>Rejection reason:</strong> ${U.esc(a.statusReason)}</p>` : ''}
      </div>

      ${canAct ? `
        <div class="action-row">
          <button class="btn btn--success" id="approveBtn">✓ Approve</button>
          <button class="btn btn--danger" id="rejectBtn">✕ Reject</button>
        </div>
      ` : `
        <div class="note">This astrologer has already been ${U.esc(a.status)}. No action available.</div>
      `}
    `,
    mount() {
      const approve = document.getElementById('approveBtn');
      const reject = document.getElementById('rejectBtn');

      if (approve) approve.onclick = () => {
        confirmDialog({
          title: `Approve ${a.name}?`,
          message: 'They will become visible to users and can receive bookings.',
          confirmText: 'Approve',
          onConfirm: () => exec(() => Actions.approveAstrologer(a.id)),
        });
      };
      if (reject) reject.onclick = () => {
        reasonDialog({
          title: `Reject ${a.name}`,
          message: 'The astrologer will see this reason. Be specific so they can fix it.',
          placeholder: 'e.g. PAN document unclear, please re-submit',
          confirmText: 'Reject',
          danger: true,
          onConfirm: (reason) => exec(() => Actions.rejectAstrologer(a.id, reason)),
        });
      };
    },
  };
}

function screenAdminBookings() {
  const q = state.adminBookingQuery.toLowerCase();
  let rows = Store.listBookings();
  if (state.adminBookingFilter !== 'all') rows = rows.filter(b => b.status === state.adminBookingFilter);
  if (q) {
    rows = rows.filter(b => {
      const astro = Store.getAstro(b.astrologerId);
      const user = Store.getUser(b.userId);
      return (
        (user && user.name.toLowerCase().includes(q)) ||
        (astro && astro.name.toLowerCase().includes(q)) ||
        b.id.toLowerCase().includes(q)
      );
    });
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const tabs = ['all','pending','confirmed','completed','cancelled'].map(k => `
    <button class="tab ${state.adminBookingFilter === k ? 'active' : ''}" data-tab="${k}">
      ${k[0].toUpperCase() + k.slice(1)}
    </button>`).join('');

  return {
    title: 'Bookings',
    html: `
      <div class="page-head"><h2>All bookings</h2></div>
      <div class="search-bar">
        <input type="search" class="field__input" id="bookingsSearch"
          placeholder="Search by user, astrologer or #ID"
          value="${U.esc(state.adminBookingQuery)}" />
      </div>
      <div class="tabs">${tabs}</div>
      <div id="bookingsList">
        ${rows.length === 0
          ? C.empty('📋', 'No bookings', 'Try a different filter or search.')
          : `<div class="list">${rows.map(b => {
              const user = Store.getUser(b.userId);
              const astro = Store.getAstro(b.astrologerId);
              return `
                <a class="card booking-card" href="#/bookings/${b.id}">
                  <div class="booking-row">
                    <div>
                      <div class="row-title">${U.esc(astro ? astro.name : '—')}</div>
                      <div class="row-sub">Booked by ${U.esc(user ? user.name : '—')}</div>
                    </div>
                    ${C.badge(b.status)}
                  </div>
                  <div class="muted small">${U.fmtDate(b.date)} · ${b.time}</div>
                  ${C.paymentBadges(b)}
                  <div class="booking-row muted small">
                    <span>#${b.id.toUpperCase()}</span>
                    <span>${U.money(b.amount)}</span>
                  </div>
                </a>`;
            }).join('')}</div>`}
      </div>
    `,
    mount() {
      const input = document.getElementById('bookingsSearch');
      const list = document.getElementById('bookingsList');
      const rerender = () => {
        const q2 = state.adminBookingQuery.toLowerCase();
        let r = Store.listBookings();
        if (state.adminBookingFilter !== 'all') r = r.filter(b => b.status === state.adminBookingFilter);
        if (q2) r = r.filter(b => {
          const astro = Store.getAstro(b.astrologerId);
          const user = Store.getUser(b.userId);
          return (user && user.name.toLowerCase().includes(q2)) ||
                 (astro && astro.name.toLowerCase().includes(q2)) ||
                 b.id.toLowerCase().includes(q2);
        });
        r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        list.innerHTML = r.length === 0
          ? C.empty('📋', 'No bookings', 'Try a different filter or search.')
          : `<div class="list">${r.map(b => {
              const user = Store.getUser(b.userId);
              const astro = Store.getAstro(b.astrologerId);
              return `
                <a class="card booking-card" href="#/bookings/${b.id}">
                  <div class="booking-row">
                    <div>
                      <div class="row-title">${U.esc(astro ? astro.name : '—')}</div>
                      <div class="row-sub">Booked by ${U.esc(user ? user.name : '—')}</div>
                    </div>
                    ${C.badge(b.status)}
                  </div>
                  <div class="muted small">${U.fmtDate(b.date)} · ${b.time}</div>
                  ${C.paymentBadges(b)}
                  <div class="booking-row muted small">
                    <span>#${b.id.toUpperCase()}</span>
                    <span>${U.money(b.amount)}</span>
                  </div>
                </a>`;
            }).join('')}</div>`;
      };
      input.addEventListener('input', U.debounce(() => {
        state.adminBookingQuery = input.value;
        rerender();
      }, 150));
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.addEventListener('click', () => { state.adminBookingFilter = b.dataset.tab; render(); }));
    },
  };
}

function screenAdminBookingDetail(params) {
  const b = Store.getBooking(params.id);
  if (!b) return { title: 'Not found', html: C.empty('📋', 'Booking not found', '') };
  const astro = Store.getAstro(b.astrologerId);
  const user = Store.getUser(b.userId);
  const events = Store.listBookingAudit(b.id);

  // actions
  const canCancel = b.status === 'pending' || b.status === 'confirmed';
  const canMarkPaid = b.paymentStatus === 'unpaid' && b.status !== 'cancelled';

  return {
    title: `Booking #${b.id.toUpperCase()}`,
    html: `
      <div class="detail-header">
        <h2 class="detail-title">Booking #${b.id.toUpperCase()}</h2>
        ${C.badge(b.status)}
      </div>
      <p class="detail-meta">Created ${U.relTime(b.createdAt)}</p>

      <div class="section-card">
        <div class="section-card__title">Session</div>
        <a class="row" href="#/astrologers/${astro ? astro.id : ''}" style="padding:4px 0;text-decoration:none;color:inherit">
          ${astro ? C.avatar(astro.name) : ''}
          <div class="row-info">
            <div class="row-title">${U.esc(astro ? astro.name : '—')}</div>
            <div class="row-sub">Astrologer</div>
          </div>
          <span class="muted">→</span>
        </a>
        <div class="kv" style="margin-top:12px">
          <div class="kv__row"><span class="kv__label">Date</span><span class="kv__value">${U.fmtDate(b.date)}</span></div>
          <div class="kv__row"><span class="kv__label">Time</span><span class="kv__value">${b.time}</span></div>
          <div class="kv__row"><span class="kv__label">Amount</span><span class="kv__value">${U.money(b.amount)}</span></div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-card__title">User</div>
        <a class="row" href="#/users/${user ? user.id : ''}" style="padding:4px 0;text-decoration:none;color:inherit">
          ${user ? C.avatar(user.name, { banned: user.banned }) : ''}
          <div class="row-info">
            <div class="row-title">${U.esc(user ? user.name : '—')} ${user && user.banned ? C.badge('banned') : ''}</div>
            <div class="row-sub">${U.esc(user ? user.email : '')}</div>
          </div>
          <span class="muted">→</span>
        </a>
      </div>

      <div class="section-card">
        <div class="section-card__title">Payment</div>
        <div class="kv">
          <div class="kv__row"><span class="kv__label">Mode</span><span class="kv__value">${b.paymentMode === 'online' ? '💳 Online' : '💵 Cash / offline'}</span></div>
          <div class="kv__row"><span class="kv__label">Status</span><span class="kv__value">${C.badge(b.paymentStatus)}</span></div>
          ${b.paymentRef ? `<div class="kv__row"><span class="kv__label">Reference</span><span class="kv__value mono">${U.esc(b.paymentRef)}</span></div>` : ''}
          ${b.paidAt ? `<div class="kv__row"><span class="kv__label">Paid</span><span class="kv__value">${U.relTime(b.paidAt)}</span></div>` : ''}
          ${b.refundAmount ? `<div class="kv__row"><span class="kv__label">Refunded</span><span class="kv__value">${U.money(b.refundAmount)}</span></div>` : ''}
          ${b.refundReason ? `<div class="kv__row"><span class="kv__label">Refund reason</span><span class="kv__value">${U.esc(b.refundReason)}</span></div>` : ''}
        </div>
      </div>

      ${b.cancelledReason ? `
      <div class="section-card">
        <div class="section-card__title">Cancellation</div>
        <p class="body-text"><strong>Reason:</strong> ${U.esc(b.cancelledReason)}</p>
        ${b.cancelledAt ? `<p class="body-text muted small">Cancelled ${U.relTime(b.cancelledAt)}</p>` : ''}
      </div>` : ''}

      ${events.length > 0 ? `
      <div class="section-card">
        <div class="section-card__title">Timeline</div>
        <div class="timeline">
          ${events.map(e => {
            const meta = AUDIT_META[e.action] || { icon: '•', cls: '', label: e.action };
            return C.timelineItem(meta.icon, meta.cls, meta.label, `${U.relTime(e.ts)} · by ${e.actorName}`);
          }).join('')}
        </div>
      </div>` : ''}

      ${canCancel || canMarkPaid ? `
        <div class="action-row">
          ${canMarkPaid ? `<button class="btn btn--success" id="markPaidBtn">✓ Mark as paid</button>` : ''}
          ${canCancel ? `<button class="btn btn--danger-ghost" id="cancelBtn">✕ Cancel booking${b.paymentStatus === 'paid' ? ' & refund' : ''}</button>` : ''}
        </div>` : ''}
    `,
    mount() {
      const cancelBtn = document.getElementById('cancelBtn');
      const markPaidBtn = document.getElementById('markPaidBtn');

      if (cancelBtn) cancelBtn.onclick = () => {
        const msg = b.paymentStatus === 'paid'
          ? `This booking will be cancelled and ${U.money(b.amount)} will be refunded to the user.`
          : 'This booking will be cancelled.';
        reasonDialog({
          title: `Cancel booking #${b.id.toUpperCase()}?`,
          message: msg + ' The reason will be logged.',
          placeholder: 'e.g. Astrologer unavailable, technical issue',
          confirmText: b.paymentStatus === 'paid' ? 'Cancel & refund' : 'Cancel booking',
          danger: true,
          onConfirm: (reason) => exec(() => Actions.cancelBooking(b.id, reason)),
        });
      };

      if (markPaidBtn) markPaidBtn.onclick = () => {
        confirmDialog({
          title: 'Mark as paid?',
          message: `Confirm that the user has paid ${U.money(b.amount)} in cash for this session.`,
          confirmText: 'Mark paid',
          onConfirm: () => exec(() => Actions.markBookingPaid(b.id, '')),
        });
      };
    },
  };
}

function screenAdminUsers() {
  const q = state.adminUserQuery.toLowerCase();
  let users = Store.listUsers();
  if (state.adminUserFilter === 'banned') users = users.filter(u => u.banned);
  if (state.adminUserFilter === 'active') users = users.filter(u => !u.banned);
  if (q) users = users.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  const tabs = ['all','active','banned'].map(k => `
    <button class="tab ${state.adminUserFilter === k ? 'active' : ''}" data-tab="${k}">
      ${k[0].toUpperCase() + k.slice(1)}
    </button>`).join('');

  const renderRows = () => {
    const qq = state.adminUserQuery.toLowerCase();
    let r = Store.listUsers();
    if (state.adminUserFilter === 'banned') r = r.filter(u => u.banned);
    if (state.adminUserFilter === 'active') r = r.filter(u => !u.banned);
    if (qq) r = r.filter(u => u.name.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq));
    if (r.length === 0) return C.empty('👥', 'No users', 'Try a different filter or search.');
    return `<div class="list">${r.map(u => {
      const bc = Store.listBookings().filter(b => b.userId === u.id).length;
      return `
        <a class="card row" href="#/users/${u.id}">
          ${C.avatar(u.name, { banned: u.banned })}
          <div class="row-info">
            <div class="row-title">${U.esc(u.name)} ${u.banned ? C.badge('banned') : ''}</div>
            <div class="row-sub">${U.esc(u.email)}</div>
          </div>
          <div class="row-side muted small">${bc} booking${bc === 1 ? '' : 's'}</div>
        </a>`;
    }).join('')}</div>`;
  };

  return {
    title: 'Users',
    html: `
      <div class="page-head"><h2>Users</h2><p>${Store.listUsers().length} registered</p></div>
      <div class="search-bar">
        <input type="search" class="field__input" id="usersSearch"
          placeholder="Search by name or email"
          value="${U.esc(state.adminUserQuery)}" />
      </div>
      <div class="tabs">${tabs}</div>
      <div id="usersList">${renderRows()}</div>
    `,
    mount() {
      const input = document.getElementById('usersSearch');
      const list = document.getElementById('usersList');
      input.addEventListener('input', U.debounce(() => {
        state.adminUserQuery = input.value;
        list.innerHTML = renderRows();
      }, 150));
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.addEventListener('click', () => { state.adminUserFilter = b.dataset.tab; render(); }));
    },
  };
}

function screenAdminUserDetail(params) {
  const u = Store.getUser(params.id);
  if (!u) return { title: 'Not found', html: C.empty('👥', 'User not found', '') };
  const bookings = Store.listBookings()
    .filter(b => b.userId === u.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const spent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  const cancelled = bookings.filter(b => b.status === 'cancelled').length;
  const refunded = bookings.filter(b => b.paymentStatus === 'refunded').reduce((s, b) => s + (b.refundAmount || 0), 0);

  return {
    title: u.name,
    html: `
      <div class="profile-head">
        ${C.avatar(u.name, { large: true, banned: u.banned })}
        <div>
          <h2 class="h2">${U.esc(u.name)} ${u.banned ? C.badge('banned') : C.badge('active')}</h2>
          <p class="muted">${U.esc(u.email)}</p>
          <p class="muted">${U.esc(u.phone)}</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat"><div class="stat-val">${bookings.length}</div><div class="stat-lbl">Bookings</div></div>
        <div class="stat"><div class="stat-val">${U.money(spent)}</div><div class="stat-lbl">Total spent</div></div>
        <div class="stat"><div class="stat-val">${cancelled}</div><div class="stat-lbl">Cancellations</div></div>
        <div class="stat"><div class="stat-val">${U.money(refunded)}</div><div class="stat-lbl">Refunded</div></div>
      </div>

      <div class="section-card">
        <div class="section-card__title">Account</div>
        <div class="kv">
          <div class="kv__row"><span class="kv__label">User ID</span><span class="kv__value mono">${U.esc(u.id)}</span></div>
          <div class="kv__row"><span class="kv__label">Joined</span><span class="kv__value">${U.relTime(u.joinedAt)}</span></div>
          ${u.banned && u.bannedAt ? `<div class="kv__row"><span class="kv__label">Banned</span><span class="kv__value">${U.relTime(u.bannedAt)}</span></div>` : ''}
        </div>
        ${u.banned && u.bannedReason ? `<p class="body-text" style="margin-top:12px"><strong>Ban reason:</strong> ${U.esc(u.bannedReason)}</p>` : ''}
      </div>

      <div class="section-card">
        <div class="section-card__title">Booking history</div>
        ${bookings.length === 0
          ? `<p class="muted small">No bookings yet.</p>`
          : `<div class="stack">${bookings.map(b => {
              const astro = Store.getAstro(b.astrologerId);
              return `
                <a class="row" href="#/bookings/${b.id}" style="padding:10px 0;text-decoration:none;color:inherit;border-bottom:1px solid var(--c-border)">
                  <div class="avatar" style="width:36px;height:36px;font-size:12px">${U.initials(astro ? astro.name : '—')}</div>
                  <div class="row-info">
                    <div class="row-title" style="font-size:14px">${U.esc(astro ? astro.name : '—')}</div>
                    <div class="row-sub">${U.fmtDate(b.date)} · ${b.time}</div>
                  </div>
                  <div class="row-side">
                    ${C.badge(b.status)}
                    <div class="muted tiny" style="margin-top:2px">${U.money(b.amount)}</div>
                  </div>
                </a>`;
            }).join('')}</div>`}
      </div>

      <div class="action-row">
        ${u.banned
          ? `<button class="btn btn--success" id="unbanBtn">🔓 Unban user</button>`
          : `<button class="btn btn--danger" id="banBtn">🚫 Ban user</button>`}
      </div>
    `,
    mount() {
      const banBtn = document.getElementById('banBtn');
      const unbanBtn = document.getElementById('unbanBtn');

      if (banBtn) banBtn.onclick = () => {
        reasonDialog({
          title: `Ban ${u.name}?`,
          message: 'A banned user cannot make new bookings. They will see the ban status in their app.',
          placeholder: 'e.g. Repeated no-shows, abusive behaviour',
          confirmText: 'Ban user',
          danger: true,
          onConfirm: (reason) => exec(() => Actions.banUser(u.id, reason)),
        });
      };
      if (unbanBtn) unbanBtn.onclick = () => {
        confirmDialog({
          title: `Unban ${u.name}?`,
          message: 'They will be able to book sessions again.',
          confirmText: 'Unban',
          onConfirm: () => exec(() => Actions.unbanUser(u.id)),
        });
      };
    },
  };
}

function screenAdminAudit() {
  const logs = Store.listAudit();
  return {
    title: 'Audit log',
    html: `
      <div class="page-head"><h2>Audit log</h2><p>Every admin action is recorded</p></div>
      ${logs.length === 0
        ? C.empty('📜', 'No actions yet', 'Admin actions will appear here.')
        : `<div class="list">${logs.map(l => {
            const meta = AUDIT_META[l.action] || { icon: '•', cls: '', label: l.action };
            const name = (l.meta && l.meta.name) || l.targetId;
            return `
              <div class="card">
                <div class="row" style="grid-template-columns:32px 1fr auto;gap:10px">
                  <div class="timeline-icon timeline-icon--${meta.cls}">${meta.icon}</div>
                  <div class="row-info">
                    <div class="row-title" style="font-size:14px">${meta.label} · ${U.esc(name)}</div>
                    <div class="row-sub">${U.esc(l.actorName)}</div>
                    ${l.meta && l.meta.reason ? `<div class="row-sub">${U.esc(l.meta.reason)}</div>` : ''}
                  </div>
                  <div class="muted tiny" style="white-space:nowrap">${U.relTime(l.ts)}</div>
                </div>
              </div>`;
          }).join('')}</div>`}
    `,
  };
}

function screenNotFound() {
  return { title: 'Not found', html: C.empty('🔍', 'Page not found', 'The page you were looking for does not exist.') };
}

/* ─── §6b Screen registry ────────────────────────────────────── */
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
  adminBookingDetail: screenAdminBookingDetail,
  adminUsers: screenAdminUsers,
  adminUserDetail: screenAdminUserDetail,
  adminAudit: screenAdminAudit,
  notFound: screenNotFound,
};

/* ─── §7 Routes ──────────────────────────────────────────────── */
const ROUTES = {
  user: {
    '/home':            'userHome',
    '/astrologer/:id':  'userAstrologer',
    '/bookings':        'userBookings',
    '/profile':         'userProfile',
  },
  astro: {
    '/dashboard': 'astroDashboard',
    '/slots':     'astroSlots',
    '/bookings':  'astroBookings',
    '/profile':   'astroProfile',
  },
  admin: {
    '/dashboard':       'adminDashboard',
    '/astrologers':     'adminAstrologers',
    '/astrologers/:id': 'adminAstrologerDetail',
    '/bookings':        'adminBookings',
    '/bookings/:id':    'adminBookingDetail',
    '/users':           'adminUsers',
    '/users/:id':       'adminUserDetail',
    '/audit':           'adminAudit',
  },
};

/* ─── §8 Router ──────────────────────────────────────────────── */
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
    const active = path === it.path || path.startsWith(it.path + '/');
    return `<a class="nav-item ${active ? 'active' : ''}" href="#${it.path}">
      <span class="nav-icon">${it.icon}</span>
      <span class="nav-label">${it.label}</span>
    </a>`;
  }).join('');
}

function render() {
  const path = location.hash.replace(/^#/, '') || '/';
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

/* ─── §9 Boot ────────────────────────────────────────────────── */
function boot() {
  Store.load();
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
