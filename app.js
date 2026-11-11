/* ================================================================
   BookMyAstrologer — App (Day 4)
   Three apps in one codebase: User · Astrologer · Admin
   ================================================================ */

/* ─── §1 Constants ───────────────────────────────────────────── */
const APP = document.body.dataset.app || 'user';
const CONFIG = {
  appName: 'BookMyAstrologer',
  currency: '₹',
  storageKey: 'bma_db_v4',
  version: 'day4',
  buildLabel: 'v4 · Day 4',
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
  create_slot:        { icon: '➕', cls: 'success', label: 'Created slot' },
  update_slot:        { icon: '✏️', cls: 'info',    label: 'Updated slot' },
  delete_slot:        { icon: '🗑️', cls: 'danger',  label: 'Deleted slot' },
};

const state = {
  // admin
  adminAstroTab: 'pending',
  adminUserFilter: 'all',
  adminUserQuery: '',
  adminBookingFilter: 'all',
  adminBookingQuery: '',
  // user browse
  userQuery: '',
  userSpecialty: 'all',
  userPriceBand: 'all',
  userSort: 'rating',
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
  isPastDate: (iso) => iso < U.todayIso(),
};

/* ─── §3 Store ───────────────────────────────────────────────── */
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
  getAstro:   (id) => Store.load().astrologers.find(a => a.id === id),
  getUser:    (id) => Store.load().users.find(u => u.id === id),
  getBooking: (id) => Store.load().bookings.find(b => b.id === id),
  getSlot:    (id) => Store.load().slots.find(s => s.id === id),
  listAstros:    (status) => status ? Store.load().astrologers.filter(a => a.status === status) : Store.load().astrologers,
  listUsers:     () => Store.load().users,
  listBookings:  () => Store.load().bookings,
  listSlots:     (astroId) => astroId ? Store.load().slots.filter(s => s.astrologerId === astroId) : Store.load().slots,
  listAudit:     () => [...Store.load().audit].sort((a, b) => b.ts.localeCompare(a.ts)),
  listBookingAudit: (bookingId) => Store.load().audit
    .filter(l => l.targetType === 'booking' && l.targetId === bookingId)
    .sort((a, b) => a.ts.localeCompare(b.ts)),
  listSlotAudit: (slotId) => Store.load().audit
    .filter(l => l.targetType === 'slot' && l.targetId === slotId)
    .sort((a, b) => a.ts.localeCompare(b.ts)),

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
  addSlot(slot) {
    this.load().slots.push(slot);
    this.save();
    return slot;
  },
  updateSlot(id, patch) {
    const s = this.load().slots.find(x => x.id === id);
    if (!s) return null;
    Object.assign(s, patch);
    this.save();
    return s;
  },
  removeSlot(id) {
    const arr = this.load().slots;
    const i = arr.findIndex(s => s.id === id);
    if (i < 0) return false;
    arr.splice(i, 1);
    this.save();
    return true;
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
      { id:'a5', name:'Astro Vikram Rao', specialty:'Vedic Astrology', city:'Hyderabad',
        languages:['Telugu','English'], fee:1200, rating:4.7, reviews:58, experience:20,
        status:'approved', bio:'Specialist in career and business astrology. Consults by appointment.',
        kyc:{ pan:'VRAO1234K', aadhaarMasked:'XXXX XXXX 8877', verified:true } },
      { id:'a6', name:'Pooja Desai', specialty:'Numerology', city:'Ahmedabad',
        languages:['Gujarati','Hindi','English'], fee:350, rating:4.5, reviews:62, experience:6,
        status:'approved', bio:'Numerologist and vastu consultant for homes.',
        kyc:{ pan:'PDES5678M', aadhaarMasked:'XXXX XXXX 3322', verified:true } },
    ];

    const slots = [
      { id:'s0-old', astrologerId:'a1', date: day(-3), time:'11:00', duration:30, price:500 },
      { id:'s1', astrologerId:'a1', date: day(0), time:'10:00', duration:30, price:500 },
      { id:'s2', astrologerId:'a1', date: day(0), time:'15:00', duration:30, price:500 },
      { id:'s3', astrologerId:'a1', date: day(1), time:'11:00', duration:30, price:500 },
      { id:'s6', astrologerId:'a2', date: day(0), time:'12:00', duration:45, price:750 },
      { id:'s7', astrologerId:'a2', date: day(1), time:'14:00', duration:45, price:750 },
      { id:'s8', astrologerId:'a5', date: day(0), time:'16:00', duration:60, price:1200 },
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
      { id:'log-s3', ts: daysAgo(4), actorRole:'admin', actorName:'Super Admin',
        action:'cancel_booking', targetType:'booking', targetId:'b4',
        meta:{ reason:'Astrologer unavailable', refunded:true, refundAmount:750 } },
    ];

    return { astrologers, slots, bookings, users, audit };
  },
};

/* ─── §3b Actions ────────────────────────────────────────────── */
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
      status: 'cancelled', cancelledAt: U.nowIso(),
      cancelledBy: 'admin', cancelledReason: reason.trim(),
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

  /* ── Slot CRUD (astrologer) ── */
  createSlot(astroId, { date, time, duration, price }) {
    const a = Store.getAstro(astroId);
    if (!a) return { error: 'Astrologer not found' };
    if (a.status !== 'approved') return { error: 'Your profile must be approved first' };
    if (!date || !time) return { error: 'Date and time are required' };
    if (U.isPastDate(date)) return { error: 'Cannot create a slot in the past' };
    const dup = Store.listSlots(astroId).find(s => s.date === date && s.time === time);
    if (dup) return { error: 'A slot already exists at that date & time' };

    const slot = {
      id: U.uid('slot'),
      astrologerId: astroId,
      date, time,
      duration: Number(duration) || 30,
      price: Number(price) || a.fee,
      createdAt: U.nowIso(),
    };
    Store.addSlot(slot);
    Store.log('astro', a.name, 'create_slot', 'slot', slot.id,
      { name: a.name, date, time });
    return { ok: true, message: 'Slot created', slot };
  },
  updateSlot(slotId, patch) {
    const s = Store.getSlot(slotId);
    if (!s) return { error: 'Slot not found' };
    const booked = Store.listBookings().some(b => b.slotId === s.id && b.status !== 'cancelled');
    if (booked) return { error: 'Cannot edit a booked slot' };
    if (U.isPastDate(s.date)) return { error: 'Cannot edit a past slot' };
    if (patch.date && U.isPastDate(patch.date)) return { error: 'Date cannot be in the past' };
    if (patch.date && patch.time) {
      const dup = Store.listSlots(s.astrologerId)
        .find(x => x.id !== s.id && x.date === patch.date && x.time === patch.time);
      if (dup) return { error: 'A slot already exists at that date & time' };
    }
    Store.updateSlot(slotId, patch);
    Store.log('astro', Store.getAstro(s.astrologerId).name, 'update_slot', 'slot', slotId,
      { date: patch.date || s.date, time: patch.time || s.time });
    return { ok: true, message: 'Slot updated' };
  },
  deleteSlot(slotId) {
    const s = Store.getSlot(slotId);
    if (!s) return { error: 'Slot not found' };
    const booked = Store.listBookings().some(b => b.slotId === s.id && b.status !== 'cancelled');
    if (booked) return { error: 'Cannot delete a booked slot' };
    Store.removeSlot(slotId);
    Store.log('astro', Store.getAstro(s.astrologerId).name, 'delete_slot', 'slot', slotId,
      { date: s.date, time: s.time });
    return { ok: true, message: 'Slot deleted' };
  },
};

/* ─── §4 UI primitives ───────────────────────────────────────── */
let _toastTimer;
function toast(msg, type = 'default') {
  const t = document.getElementById('toast');
  if (!t) return;
  const iconMap = { success: '✓', error: '!', info: 'i', default: '' };
  const cls = type !== 'default' ? `toast--${type}` : '';
  const icon = iconMap[type];
  t.className = `toast ${cls}`;
  t.innerHTML = (icon ? `<span class="toast__icon">${icon}</span>` : '') +
                `<span class="toast__text">${U.esc(msg)}</span>`;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

let _modalCleanup = null;
function openModal(html) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = `<div class="modal-backdrop is-open" role="dialog" aria-modal="true"><div class="modal"><div class="modal__handle"></div>${html}</div></div>`;
  const bd = root.querySelector('.modal-backdrop');
  const modal = root.querySelector('.modal');

  bd.addEventListener('click', (e) => { if (e.target === bd) closeModal(); });

  // focus trap
  const focusables = () => Array.from(modal.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  ));
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key !== 'Tab') return;
    const els = focusables();
    if (!els.length) return;
    const first = els[0], last = els[els.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', onKey);
  _modalCleanup = () => document.removeEventListener('keydown', onKey);

  const first = modal.querySelector('input, textarea, select, button');
  if (first) setTimeout(() => first.focus(), 60);
}
function closeModal() {
  if (_modalCleanup) { _modalCleanup(); _modalCleanup = null; }
  const root = document.getElementById('modalRoot');
  if (root) root.innerHTML = '';
}

function setLoading(btn, on) {
  if (!btn) return;
  if (on) {
    btn.dataset.original = btn.innerHTML;
    btn.classList.add('is-loading');
    btn.disabled = true;
    btn.innerHTML = `<span class="btn__spinner"></span>${btn.dataset.original}`;
  } else {
    btn.classList.remove('is-loading');
    btn.disabled = false;
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
  }
}

function exec(fn, btn) {
  if (btn) setLoading(btn, true);
  // small artificial delay so the spinner is visible
  setTimeout(() => {
    try {
      const res = fn();
      if (btn) setLoading(btn, false);
      if (!res) return;
      if (res.ok) {
        closeModal();
        render();
        toast(res.message || 'Done', 'success');
      } else if (res.error) {
        toast(res.error, 'error');
      }
    } catch (err) {
      console.error(err);
      if (btn) setLoading(btn, false);
      toast('Something went wrong', 'error');
    }
  }, 180);
}

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
  document.querySelector('[data-confirm]').onclick = (e) => {
    if (onConfirm) onConfirm(e.currentTarget);
  };
}

function reasonDialog({ title, message, placeholder, confirmText = 'Confirm', danger = false, onConfirm }) {
  openModal(`
    <h3 class="modal__title">${U.esc(title)}</h3>
    <p class="modal__message">${U.esc(message)}</p>
    <div class="field">
      <label class="field__label" for="reasonInput">Reason</label>
      <textarea id="reasonInput" class="field__input" placeholder="${U.esc(placeholder || 'Type your reason…')}" maxlength="300"></textarea>
      <div class="field__error" id="reasonError"></div>
    </div>
    <div class="modal__actions">
      <button class="btn btn--ghost" data-close>Cancel</button>
      <button class="btn ${danger ? 'btn--danger' : ''}" data-confirm>${U.esc(confirmText)}</button>
    </div>
  `);
  const input = document.getElementById('reasonInput');
  const err = document.getElementById('reasonError');
  document.querySelector('[data-close]').onclick = closeModal;
  document.querySelector('[data-confirm]').onclick = (e) => {
    const v = input.value.trim();
    if (v.length < 5) {
      err.textContent = 'Please enter at least 5 characters';
      err.classList.add('show');
      input.focus();
      return;
    }
    onConfirm(v, e.currentTarget);
  };
  input.addEventListener('input', () => err.classList.remove('show'));
}

/* slot form (shared for create + edit) */
function slotFormModal({ mode, astroId, slot, onSave }) {
  const a = Store.getAstro(astroId);
  const today = U.todayIso();
  openModal(`
    <h3 class="modal__title">${mode === 'edit' ? 'Edit slot' : 'Create slot'}</h3>
    <p class="modal__message">${
      mode === 'edit'
        ? 'Update the date, time or fee. Booked slots cannot be edited.'
        : 'Add a new bookable slot to your calendar.'
    }</p>
    <form id="slotForm" novalidate>
      <div class="field">
        <label class="field__label" for="slotDate">Date</label>
        <input type="date" id="slotDate" class="field__input" min="${today}"
          value="${slot ? slot.date : today}" required />
        <div class="field__error" id="errDate"></div>
      </div>
      <div class="field">
        <label class="field__label" for="slotTime">Time</label>
        <input type="time" id="slotTime" class="field__input"
          value="${slot ? slot.time : '10:00'}" required />
        <div class="field__error" id="errTime"></div>
      </div>
      <div class="field">
        <label class="field__label" for="slotDuration">Duration (minutes)</label>
        <select id="slotDuration" class="field__input">
          ${[15, 30, 45, 60].map(n => `<option value="${n}" ${(slot && slot.duration === n) || (!slot && n === 30) ? 'selected' : ''}>${n} minutes</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label" for="slotPrice">Fee (₹)</label>
        <input type="number" id="slotPrice" class="field__input" min="0" step="50"
          value="${slot ? slot.price : a.fee}" required />
        <div class="field__hint">Default is your session fee · ${U.money(a.fee)}</div>
        <div class="field__error" id="errPrice"></div>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" data-close>Cancel</button>
        <button type="submit" class="btn">${mode === 'edit' ? 'Save changes' : 'Create slot'}</button>
      </div>
    </form>
  `);
  document.querySelector('[data-close]').onclick = closeModal;

  document.getElementById('slotForm').onsubmit = (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('[type=submit]');
    const date = document.getElementById('slotDate').value;
    const time = document.getElementById('slotTime').value;
    const duration = Number(document.getElementById('slotDuration').value);
    const price = Number(document.getElementById('slotPrice').value);

    let bad = false;
    const err = (id, msg) => {
      const el = document.getElementById(id);
      el.textContent = msg;
      el.classList.toggle('show', !!msg);
      if (msg) bad = true;
    };
    err('errDate', !date ? 'Pick a date' : U.isPastDate(date) ? 'Cannot be in the past' : '');
    err('errTime', !time ? 'Pick a time' : '');
    err('errPrice', price <= 0 ? 'Enter a valid fee' : '');
    if (bad) return;

    setLoading(btn, true);
    setTimeout(() => {
      const res = onSave({ date, time, duration, price });
      setLoading(btn, false);
      if (res.ok) { closeModal(); render(); toast(res.message, 'success'); }
      else toast(res.error, 'error');
    }, 180);
  };
}

/* ─── §5 Shared components ───────────────────────────────────── */
const C = {
  badge: (status) => `<span class="badge badge--${status}">${status}</span>`,
  avatar: (name, opts = {}) => {
    const cls = opts.banned ? 'avatar avatar--banned' : (opts.large ? 'avatar avatar--lg' : 'avatar');
    return `<div class="${cls}">${U.initials(name)}</div>`;
  },
  empty: (icon, title, sub, cta) => `
    <div class="empty">
      <span class="empty__icon">${icon}</span>
      <div class="empty__title">${U.esc(title)}</div>
      <div class="small">${U.esc(sub || '')}</div>
      ${cta ? `<div class="empty__cta">${cta}</div>` : ''}
    </div>`,
  paymentBadges: (b) => {
    const mode = b.paymentMode === 'online'
      ? `<span class="badge badge--online">💳 Online</span>`
      : `<span class="badge badge--offline">💵 Cash / offline</span>`;
    return `<div class="booking-tags">${mode}<span class="badge badge--${b.paymentStatus}">${b.paymentStatus}</span></div>`;
  },
  bookingCard: (b, opts = {}) => {
    const astro = Store.getAstro(b.astrologerId);
    const user = Store.getUser(b.userId);
    const who = opts.showUser ? (user && user.name) : (astro && astro.name);
    const href = opts.href;
    const wrap = href ? `<a class="card booking-card" href="${href}">` : `<div class="card booking-card">`;
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

/* ── USER ── */

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
        <strong>Day 4 preview.</strong> Payment gateway (Razorpay) unlocks on Day 15.
        Booking flow unlocks on Day 14.
      </div>
      <div class="center">
        <span class="version-badge">${CONFIG.buildLabel}</span>
      </div>
      <div class="action-row" style="margin-top:16px">
        <button class="btn btn--ghost" id="resetBtn">Reset demo data</button>
      </div>
    `,
    mount() {
      document.querySelectorAll('[data-goto]').forEach(el => {
        el.addEventListener('click', () => { location.hash = el.dataset.goto; });
      });
      const r = document.getElementById('resetBtn');
      if (r) r.onclick = () => {
        confirmDialog({
          title: 'Reset demo data?',
          message: 'This clears all local data and restores the seed. All your changes will be lost.',
          confirmText: 'Reset', danger: true,
          onConfirm: (btn) => {
            setLoading(btn, true);
            setTimeout(() => { Store.reset(); closeModal(); render(); toast('Demo data reset', 'success'); }, 200);
          },
        });
      };
    },
  };
}

function filterAstrologers(list, f) {
  let r = list.filter(a => a.status === 'approved');
  const q = (f.q || '').trim().toLowerCase();
  if (q) r = r.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.specialty.toLowerCase().includes(q) ||
    a.city.toLowerCase().includes(q)
  );
  if (f.specialty !== 'all') r = r.filter(a => a.specialty === f.specialty);
  if (f.priceBand !== 'all') {
    const [min, max] = f.priceBand.split('-').map(Number);
    r = r.filter(a => a.fee >= min && (max ? a.fee < max : true));
  }
  if (f.sort === 'rating') r.sort((a, b) => b.rating - a.rating);
  else if (f.sort === 'price-asc') r.sort((a, b) => a.fee - b.fee);
  else if (f.sort === 'price-desc') r.sort((a, b) => b.fee - a.fee);
  return r;
}

function screenUserHome() {
  const all = Store.listAstros('approved');
  const specialties = [...new Set(all.map(a => a.specialty))].sort();
  const filtered = filterAstrologers(all, state);
  const priceBands = [
    { k: 'all', label: 'Any price' },
    { k: '0-500', label: 'Under ₹500' },
    { k: '500-1000', label: '₹500–₹1000' },
    { k: '1000-99999', label: '₹1000+' },
  ];
  const sorts = [
    { k: 'rating', label: '⭐ Top rated' },
    { k: 'price-asc', label: '↑ Price: low' },
    { k: 'price-desc', label: '↓ Price: high' },
  ];
  return {
    title: 'Find astrologer',
    html: `
      <div class="page-head">
        <h2>Find an astrologer</h2>
        <p>${filtered.length} of ${all.length} verified experts</p>
      </div>
      <div class="search-bar">
        <input type="search" class="field__input" id="astroSearch"
          placeholder="Search by name, specialty or city"
          value="${U.esc(state.userQuery)}" />
        <button class="search-clear ${state.userQuery ? 'show' : ''}" id="searchClear" aria-label="Clear search">✕</button>
      </div>
      <div class="chip-row" id="specialtyChips">
        <button class="chip ${state.userSpecialty === 'all' ? 'active' : ''}" data-sp="all">All</button>
        ${specialties.map(sp => `<button class="chip ${state.userSpecialty === sp ? 'active' : ''}" data-sp="${U.esc(sp)}">${U.esc(sp)}</button>`).join('')}
      </div>
      <div class="chip-row">
        ${priceBands.map(p => `<button class="chip ${state.userPriceBand === p.k ? 'active' : ''}" data-band="${p.k}">${p.label}</button>`).join('')}
      </div>
      <div class="chip-row">
        ${sorts.map(s => `<button class="chip ${state.userSort === s.k ? 'active' : ''}" data-sort="${s.k}">${s.label}</button>`).join('')}
      </div>
      <div id="astroList">
        ${filtered.length === 0
          ? C.empty('🔮', 'No matching astrologers', 'Try clearing some filters.',
              `<button class="btn btn--ghost" id="clearFilters">Clear filters</button>`)
          : `<div class="list">${filtered.map(C.astroCardPublic).join('')}</div>`}
      </div>
    `,
    mount() {
      const input = document.getElementById('astroSearch');
      const clear = document.getElementById('searchClear');
      const list = document.getElementById('astroList');

      const rerenderList = () => {
        const f = filterAstrologers(all, state);
        list.innerHTML = f.length === 0
          ? C.empty('🔮', 'No matching astrologers', 'Try clearing some filters.',
              `<button class="btn btn--ghost" id="clearFilters">Clear filters</button>`)
          : `<div class="list">${f.map(C.astroCardPublic).join('')}</div>`;
        const cf = document.getElementById('clearFilters');
        if (cf) cf.onclick = () => {
          state.userQuery = ''; state.userSpecialty = 'all';
          state.userPriceBand = 'all'; state.userSort = 'rating';
          render();
        };
      };

      input.addEventListener('input', U.debounce(() => {
        state.userQuery = input.value;
        clear.classList.toggle('show', !!input.value);
        rerenderList();
      }, 150));
      clear.onclick = () => { state.userQuery = ''; input.value = ''; clear.classList.remove('show'); rerenderList(); input.focus(); };

      document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => {
        state.userSpecialty = b.dataset.sp;
        document.querySelectorAll('[data-sp]').forEach(x => x.classList.toggle('active', x === b));
        rerenderList();
      });
      document.querySelectorAll('[data-band]').forEach(b => b.onclick = () => {
        state.userPriceBand = b.dataset.band;
        document.querySelectorAll('[data-band]').forEach(x => x.classList.toggle('active', x === b));
        rerenderList();
      });
      document.querySelectorAll('[data-sort]').forEach(b => b.onclick = () => {
        state.userSort = b.dataset.sort;
        document.querySelectorAll('[data-sort]').forEach(x => x.classList.toggle('active', x === b));
        rerenderList();
      });

      // re-bind clear button in initial empty state
      const cf = document.getElementById('clearFilters');
      if (cf) cf.onclick = () => {
        state.userQuery = ''; state.userSpecialty = 'all';
        state.userPriceBand = 'all'; state.userSort = 'rating';
        render();
      };
    },
  };
}

function screenUserAstrologer(params) {
  const a = Store.getAstro(params.id);
  if (!a || a.status !== 'approved') {
    return { title: 'Not found', html: C.empty('🔮', 'Astrologer not found', 'They may have been removed.') };
  }
  const bookedSlotIds = new Set(
    Store.listBookings().filter(b => b.status !== 'cancelled').map(b => b.slotId)
  );
  const slots = Store.listSlots(a.id)
    .filter(s => !bookedSlotIds.has(s.id) && s.date >= U.todayIso())
    .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
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
        b.onclick = () => toast('Booking flow unlocks on Day 14', 'info'));
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
        ? C.empty('📅', 'No bookings yet', 'Browse astrologers to book a session.',
            `<a class="btn" href="#/home">Browse astrologers</a>`)
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

/* ── ASTROLOGER ── */

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
  const allSlots = Store.listSlots(a.id);
  const bookedIds = new Set(Store.listBookings().filter(b => b.status !== 'cancelled').map(b => b.slotId));
  const upcoming = allSlots
    .filter(s => s.date >= U.todayIso())
    .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time));
  const past = allSlots
    .filter(s => s.date < U.todayIso())
    .sort((x, y) => (y.date + y.time).localeCompare(x.date + x.time));
  const canCreate = a.status === 'approved';

  const renderRow = (s) => {
    const booked = bookedIds.has(s.id);
    const isPast = U.isPastDate(s.date);
    return `
      <div class="card booking-card" data-slot-row="${s.id}">
        <div class="booking-row">
          <div>
            <div class="row-title">${U.fmtDate(s.date)}</div>
            <div class="muted small">${s.time} · ${s.duration} min · ${U.money(s.price)}</div>
          </div>
          ${booked ? C.badge('confirmed') : isPast ? C.badge('completed') : C.badge('approved')}
        </div>
        <div class="booking-row" style="justify-content:flex-end">
          ${!booked && !isPast ? `
            <button class="btn btn--ghost btn--sm" data-action="edit" data-id="${s.id}">Edit</button>
            <button class="btn btn--danger-ghost btn--sm" data-action="delete" data-id="${s.id}">Delete</button>
          ` : `
            <span class="muted tiny">${booked ? 'Booked — locked' : 'Past slot'}</span>
          `}
        </div>
      </div>`;
  };

  return {
    title: 'Slots',
    html: `
      <div class="page-head with-action">
        <h2>My slots</h2>
        <button class="btn btn--sm" id="addSlotBtn" ${canCreate ? '' : 'disabled title="Profile must be approved"'}>+ Add slot</button>
      </div>
      ${!canCreate ? `<div class="note">Your profile must be approved before you can create slots.</div>` : ''}
      <div class="tabs">
        <button class="tab active" data-stab="upcoming">Upcoming <span class="tab-count">${upcoming.length}</span></button>
        <button class="tab" data-stab="past">Past <span class="tab-count">${past.length}</span></button>
      </div>
      <div id="slotList">
        ${upcoming.length === 0
          ? C.empty('🕐', 'No upcoming slots', 'Create slots so users can book sessions.',
              canCreate ? `<button class="btn" id="emptyAddBtn">+ Add slot</button>` : '')
          : `<div class="list">${upcoming.map(renderRow).join('')}</div>`}
      </div>
    `,
    mount() {
      const bindRowActions = () => {
        document.querySelectorAll('[data-slot-row] [data-action]').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const slot = Store.getSlot(id);
            if (action === 'edit') {
              slotFormModal({
                mode: 'edit', astroId: a.id, slot,
                onSave: (patch) => Actions.updateSlot(id, patch),
              });
            } else if (action === 'delete') {
              confirmDialog({
                title: 'Delete this slot?',
                message: `${U.fmtDate(slot.date)} · ${slot.time} will be removed. Users won't be able to book it.`,
                confirmText: 'Delete', danger: true,
                onConfirm: (b) => exec(() => Actions.deleteSlot(id), b),
              });
            }
          };
        });
      };

      const bindAdd = (btn) => {
        if (!btn) return;
        btn.onclick = () => slotFormModal({
          mode: 'create', astroId: a.id,
          onSave: (data) => Actions.createSlot(a.id, data),
        });
      };
      bindAdd(document.getElementById('addSlotBtn'));
      bindAdd(document.getElementById('emptyAddBtn'));

      // tab switching (local to slots screen, not shared)
      const renderTab = (tab) => {
        const list = document.getElementById('slotList');
        if (tab === 'upcoming') {
          list.innerHTML = upcoming.length === 0
            ? C.empty('🕐', 'No upcoming slots', 'Create slots so users can book sessions.',
                canCreate ? `<button class="btn" id="emptyAddBtn">+ Add slot</button>` : '')
            : `<div class="list">${upcoming.map(renderRow).join('')}</div>`;
          bindAdd(document.getElementById('emptyAddBtn'));
        } else {
          list.innerHTML = past.length === 0
            ? C.empty('🗓', 'No past slots', 'Completed slots will show here.')
            : `<div class="list">${past.map(renderRow).join('')}</div>`;
        }
        bindRowActions();
      };
      bindRowActions();
      document.querySelectorAll('[data-stab]').forEach(t => t.onclick = () => {
        document.querySelectorAll('[data-stab]').forEach(x => x.classList.toggle('active', x === t));
        renderTab(t.dataset.stab);
      });
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

/* ── ADMIN ── */

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
      <div class="page-head" style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <h2>Admin overview</h2>
          <p>Signed in as ${U.esc(CURRENT.adminName)}</p>
        </div>
        <span class="version-badge">${CONFIG.buildLabel}</span>
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
        b.onclick = () => { state.adminAstroTab = b.dataset.tab; render(); });
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
          onConfirm: (btn) => exec(() => Actions.approveAstrologer(a.id), btn),
        });
      };
      if (reject) reject.onclick = () => {
        reasonDialog({
          title: `Reject ${a.name}`,
          message: 'The astrologer will see this reason. Be specific so they can fix it.',
          placeholder: 'e.g. PAN document unclear, please re-submit',
          confirmText: 'Reject', danger: true,
          onConfirm: (reason, btn) => exec(() => Actions.rejectAstrologer(a.id, reason), btn),
        });
      };
    },
  };
}

function screenAdminBookings() {
  const renderRows = () => {
    const q = state.adminBookingQuery.toLowerCase();
    let r = Store.listBookings();
    if (state.adminBookingFilter !== 'all') r = r.filter(b => b.status === state.adminBookingFilter);
    if (q) r = r.filter(b => {
      const astro = Store.getAstro(b.astrologerId);
      const user = Store.getUser(b.userId);
      return (user && user.name.toLowerCase().includes(q)) ||
             (astro && astro.name.toLowerCase().includes(q)) ||
             b.id.toLowerCase().includes(q);
    });
    r.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (r.length === 0) return C.empty('📋', 'No bookings', 'Try a different filter or search.');
    return `<div class="list">${r.map(b => {
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
        <button class="search-clear ${state.adminBookingQuery ? 'show' : ''}" id="searchClear" aria-label="Clear">✕</button>
      </div>
      <div class="tabs">${tabs}</div>
      <div id="bookingsList">${renderRows()}</div>
    `,
    mount() {
      const input = document.getElementById('bookingsSearch');
      const clear = document.getElementById('searchClear');
      const list = document.getElementById('bookingsList');
      input.addEventListener('input', U.debounce(() => {
        state.adminBookingQuery = input.value;
        clear.classList.toggle('show', !!input.value);
        list.innerHTML = renderRows();
      }, 150));
      clear.onclick = () => {
        state.adminBookingQuery = ''; input.value = '';
        clear.classList.remove('show'); list.innerHTML = renderRows(); input.focus();
      };
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.onclick = () => { state.adminBookingFilter = b.dataset.tab; render(); });
    },
  };
}

function screenAdminBookingDetail(params) {
  const b = Store.getBooking(params.id);
  if (!b) return { title: 'Not found', html: C.empty('📋', 'Booking not found', '') };
  const astro = Store.getAstro(b.astrologerId);
  const user = Store.getUser(b.userId);
  const events = Store.listBookingAudit(b.id);
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
          ? `This booking will be cancelled and ${U.money(b.amount)} will be refunded.`
          : 'This booking will be cancelled.';
        reasonDialog({
          title: `Cancel booking #${b.id.toUpperCase()}?`,
          message: msg + ' The reason will be logged.',
          placeholder: 'e.g. Astrologer unavailable, technical issue',
          confirmText: b.paymentStatus === 'paid' ? 'Cancel & refund' : 'Cancel booking',
          danger: true,
          onConfirm: (reason, btn) => exec(() => Actions.cancelBooking(b.id, reason), btn),
        });
      };
      if (markPaidBtn) markPaidBtn.onclick = () => {
        confirmDialog({
          title: 'Mark as paid?',
          message: `Confirm the user has paid ${U.money(b.amount)} in cash for this session.`,
          confirmText: 'Mark paid',
          onConfirm: (btn) => exec(() => Actions.markBookingPaid(b.id, ''), btn),
        });
      };
    },
  };
}

function screenAdminUsers() {
  const renderRows = () => {
    const q = state.adminUserQuery.toLowerCase();
    let r = Store.listUsers();
    if (state.adminUserFilter === 'banned') r = r.filter(u => u.banned);
    if (state.adminUserFilter === 'active') r = r.filter(u => !u.banned);
    if (q) r = r.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
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
  const tabs = ['all','active','banned'].map(k => `
    <button class="tab ${state.adminUserFilter === k ? 'active' : ''}" data-tab="${k}">
      ${k[0].toUpperCase() + k.slice(1)}
    </button>`).join('');
  return {
    title: 'Users',
    html: `
      <div class="page-head"><h2>Users</h2><p>${Store.listUsers().length} registered</p></div>
      <div class="search-bar">
        <input type="search" class="field__input" id="usersSearch"
          placeholder="Search by name or email"
          value="${U.esc(state.adminUserQuery)}" />
        <button class="search-clear ${state.adminUserQuery ? 'show' : ''}" id="searchClear" aria-label="Clear">✕</button>
      </div>
      <div class="tabs">${tabs}</div>
      <div id="usersList">${renderRows()}</div>
    `,
    mount() {
      const input = document.getElementById('usersSearch');
      const clear = document.getElementById('searchClear');
      const list = document.getElementById('usersList');
      input.addEventListener('input', U.debounce(() => {
        state.adminUserQuery = input.value;
        clear.classList.toggle('show', !!input.value);
        list.innerHTML = renderRows();
      }, 150));
      clear.onclick = () => {
        state.adminUserQuery = ''; input.value = '';
        clear.classList.remove('show'); list.innerHTML = renderRows(); input.focus();
      };
      document.querySelectorAll('[data-tab]').forEach(b =>
        b.onclick = () => { state.adminUserFilter = b.dataset.tab; render(); });
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
          message: 'A banned user cannot make new bookings.',
          placeholder: 'e.g. Repeated no-shows, abusive behaviour',
          confirmText: 'Ban user', danger: true,
          onConfirm: (reason, btn) => exec(() => Actions.banUser(u.id, reason), btn),
        });
      };
      if (unbanBtn) unbanBtn.onclick = () => {
        confirmDialog({
          title: `Unban ${u.name}?`,
          message: 'They will be able to book sessions again.',
          confirmText: 'Unban',
          onConfirm: (btn) => exec(() => Actions.unbanUser(u.id), btn),
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
      <div class="page-head"><h2>Audit log</h2><p>Every admin & astrologer action is recorded</p></div>
      ${logs.length === 0
        ? C.empty('📜', 'No actions yet', 'Actions will appear here.')
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
  userLanding: screenUserLanding,
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
    '/home':           'userHome',
    '/astrologer/:id': 'userAstrologer',
    '/bookings':       'userBookings',
    '/profile':        'userProfile',
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
  console.log(`%c${CONFIG.appName} · ${CONFIG.buildLabel}`, 'color:#4338ca;font-weight:700');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
