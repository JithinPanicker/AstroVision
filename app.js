/* =====================================================
   AstroSeva — application logic
   ===================================================== */

'use strict';

/* -----------------------------------------------------
   1. ASTROLOGER DIRECTORY (replace with your API later)
   ----------------------------------------------------- */

const ASTROLOGERS = [
  {
    id: 'a1',
    name: 'Pandit Ravi Shastri',
    title: 'Vedic Astrology · Kundli Matching',
    skills: ['Kundli', 'Vedic', 'Marriage'],
    languages: ['Hindi', 'English'],
    rating: 4.9,
    reviews: 1240,
    experience: 18,
    price: 499,
    duration: 30,
    start: '09:00',
    end: '13:00',
    avatar: '🕉️',
    bio: 'Third-generation Vedic astrologer specialising in kundli matching, muhurat and gemstone remedies.'
  },
  {
    id: 'a2',
    name: 'Meera Iyer',
    title: 'Tarot Reading · Numerology',
    skills: ['Tarot', 'Numerology', 'Career'],
    languages: ['English', 'Tamil', 'Hindi'],
    rating: 4.8,
    reviews: 892,
    experience: 11,
    price: 399,
    duration: 25,
    start: '11:00',
    end: '17:00',
    avatar: '🔮',
    bio: 'Intuitive tarot reader helping you navigate career crossroads, relationships and life transitions.'
  },
  {
    id: 'a3',
    name: 'Acharya Vikram Joshi',
    title: 'Vastu Shastra · Palmistry',
    skills: ['Vastu', 'Palmistry', 'Vedic'],
    languages: ['Hindi', 'Marathi'],
    rating: 4.7,
    reviews: 1560,
    experience: 24,
    price: 799,
    duration: 45,
    start: '08:00',
    end: '12:00',
    avatar: '🧿',
    bio: 'Vastu consultant for homes and offices, with two decades of on-site corrections across 900+ properties.'
  },
  {
    id: 'a4',
    name: 'Dr. Nandini Rao',
    title: 'Nadi Astrology · Health',
    skills: ['Nadi', 'Health', 'Vedic'],
    languages: ['Telugu', 'English', 'Kannada'],
    rating: 5.0,
    reviews: 642,
    experience: 15,
    price: 999,
    duration: 40,
    start: '15:00',
    end: '20:00',
    avatar: '🌙',
    bio: 'Nadi leaf reader and Ayurvedic counsellor blending classical jyotish with holistic health guidance.'
  },
  {
    id: 'a5',
    name: 'Kabir Malhotra',
    title: 'Western Astrology · Compatibility',
    skills: ['Western', 'Marriage', 'Career'],
    languages: ['English', 'Punjabi'],
    rating: 4.6,
    reviews: 431,
    experience: 8,
    price: 349,
    duration: 20,
    start: '10:00',
    end: '18:00',
    avatar: '✨',
    bio: 'Modern western astrologer focused on natal charts, synastry and practical compatibility insights.'
  },
  {
    id: 'a6',
    name: 'Shastri Anand Tiwari',
    title: 'Vedic Astrology · Remedies',
    skills: ['Vedic', 'Kundli', 'Remedies'],
    languages: ['Hindi', 'Bhojpuri', 'English'],
    rating: 4.8,
    reviews: 2103,
    experience: 30,
    price: 599,
    duration: 30,
    start: '07:00',
    end: '11:00',
    avatar: '🪐',
    bio: 'Senior jyotish acharya offering planetary remedy plans, pooja guidance and dasha analysis.'
  },
  {
    id: 'a7',
    name: 'Sana Qureshi',
    title: 'Numerology · Career Guidance',
    skills: ['Numerology', 'Career', 'Tarot'],
    languages: ['Hindi', 'Urdu', 'English'],
    rating: 4.9,
    reviews: 778,
    experience: 9,
    price: 449,
    duration: 25,
    start: '12:00',
    end: '18:00',
    avatar: '🔢',
    bio: 'Numerologist helping clients align names, business launches and personal years with their life path.'
  },
  {
    id: 'a8',
    name: 'Guru Prasad Nair',
    title: 'Prashna Kundli · Vastu',
    skills: ['Vastu', 'Kundli', 'Vedic'],
    languages: ['Malayalam', 'English', 'Hindi'],
    rating: 4.7,
    reviews: 512,
    experience: 21,
    price: 699,
    duration: 35,
    start: '09:30',
    end: '14:30',
    avatar: '🏛️',
    bio: 'Prashna specialist answering specific questions through horary charts and Vastu remedies.'
  }
];

/* -----------------------------------------------------
   2. DOM REFERENCES
   ----------------------------------------------------- */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const els = {
  searchInput:   $('#searchInput'),
  filterChips:   $('#filterChips'),
  astroList:     $('#astroList'),
  astroEmpty:    $('#astroEmpty'),
  bookingList:   $('#bookingList'),
  bookingEmpty:  $('#bookingEmpty'),
  bookingCount:  $('#bookingCount'),
  goBrowse:      $('#goBrowse'),
  overlay:       $('#overlay'),
  sheet:         $('#sheet'),
  sheetBody:     $('#sheetBody'),
  toast:         $('#toast'),
  installBtn:    $('#installBtn'),
  views: {
    astrologers: $('#view-astrologers'),
    bookings:    $('#view-bookings')
  }
};

/* -----------------------------------------------------
   3. STATE + STORAGE
   ----------------------------------------------------- */

const STORAGE_KEY = 'astroseva.bookings.v1';

let bookings = loadBookings();
let activeFilter = 'all';
let searchTerm = '';
let sheetState = null;       // { astro, date, time }
let toastTimer = null;

function loadBookings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch (err) {
    console.warn('Could not persist bookings:', err);
  }
}

/* -----------------------------------------------------
   4. HELPERS
   ----------------------------------------------------- */

function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function minutesToKey(mins) {
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function formatTime(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'PM' : 'AM';
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${String(m).padStart(2, '0')} ${suffix}`;
}

function formatTimeKey(hhmm) {
  return formatTime(parseTime(hhmm));
}

function formatDatePretty(dateKey) {
  const d = new Date(dateKey + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

function getAstrologer(id) {
  return ASTROLOGERS.find(a => a.id === id) || null;
}

/* -----------------------------------------------------
   5. TOAST
   ----------------------------------------------------- */

function toast(message) {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2600);
}

/* -----------------------------------------------------
   6. RENDER — FILTER CHIPS
   ----------------------------------------------------- */

function renderChips() {
  const skills = new Set();
  ASTROLOGERS.forEach(a => a.skills.forEach(s => skills.add(s)));

  const chips = ['All', ...Array.from(skills).sort()];

  els.filterChips.innerHTML = chips.map(label => {
    const value = label === 'All' ? 'all' : label;
    const active = activeFilter === value ? ' active' : '';
    return `<button class="chip${active}" data-filter="${esc(value)}" role="tab"
              aria-selected="${active ? 'true' : 'false'}">${esc(label)}</button>`;
  }).join('');
}

/* -----------------------------------------------------
   7. RENDER — ASTROLOGER LIST
   ----------------------------------------------------- */

function astrologerCardHTML(a) {
  const tags = a.skills
    .map(s => `<span class="tag">${esc(s)}</span>`)
    .join('');

  const langs = a.languages
    .map(l => `<span class="tag lang">${esc(l)}</span>`)
    .join('');

  return `
    <article class="card" data-open="${esc(a.id)}">
      <div class="card-top">
        <div class="avatar" aria-hidden="true">${esc(a.avatar)}</div>

        <div class="card-info">
          <h3>${esc(a.name)} <span class="verified">VERIFIED</span></h3>
          <p class="title">${esc(a.title)}</p>
          <div class="meta">
            <span class="rating">★ ${a.rating.toFixed(1)}</span>
            <span>${a.reviews.toLocaleString()} reviews</span>
            <span>${a.experience} yrs exp</span>
          </div>
        </div>

        <div class="price">
          <b>₹${a.price}</b>
          <small>${a.duration} min</small>
        </div>
      </div>

      <p class="bio">${esc(a.bio)}</p>

      <div class="tags">${tags}${langs}</div>

      <button class="btn-primary" type="button" data-open="${esc(a.id)}">
        Book session · ₹${a.price}
      </button>
    </article>
  `;
}

function renderAstrologers() {
  const q = searchTerm.trim().toLowerCase();

  const list = ASTROLOGERS.filter(a => {
    const matchesFilter = activeFilter === 'all' || a.skills.includes(activeFilter);
    if (!matchesFilter) return false;
    if (!q) return true;

    const haystack = [a.name, a.title, ...a.skills, ...a.languages]
      .join(' ')
      .toLowerCase();

    return haystack.includes(q);
  });

  els.astroList.innerHTML = list.map(astrologerCardHTML).join('');
  els.astroEmpty.hidden = list.length > 0;
}

/* -----------------------------------------------------
   8. RENDER — BOOKINGS
   ----------------------------------------------------- */

function renderBookings() {
  const sorted = [...bookings].sort((a, b) => {
    const ka = a.date + a.time;
    const kb = b.date + b.time;
    return ka.localeCompare(kb);
  });

  els.bookingList.innerHTML = sorted.map(b => `
    <article class="booking-card">
      <div class="booking-top">
        <div class="avatar sm" aria-hidden="true">${esc(b.avatar || '✦')}</div>
        <div>
          <h3>${esc(b.astroName)}</h3>
          <p>${esc(b.astroTitle || 'Astrology consultation')}</p>
        </div>
        <span class="status">${esc(b.status || 'Confirmed')}</span>
      </div>

      <div class="booking-meta">
        <div><span>Date</span><b>${esc(formatDatePretty(b.date))}</b></div>
        <div><span>Time</span><b>${esc(formatTimeKey(b.time))}</b></div>
        <div><span>Fee</span><b>₹${b.price}</b></div>
      </div>

      <div class="booking-foot">
        <span class="bk-id">#${esc(b.id)}</span>
        <button class="btn-ghost danger" type="button" data-cancel="${esc(b.id)}">
          Cancel booking
        </button>
      </div>
    </article>
  `).join('');

  els.bookingEmpty.hidden = sorted.length > 0;
  updateBookingBadge();
}

function updateBookingBadge() {
  const n = bookings.length;
  els.bookingCount.textContent = n > 9 ? '9+' : String(n);
  els.bookingCount.hidden = n === 0;
}

/* -----------------------------------------------------
   9. BOOKING SHEET
   ----------------------------------------------------- */

function nextDays(count) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push(d);
  }
  return out;
}

function buildSlots(astro) {
  const startM = parseTime(astro.start);
  const endM = parseTime(astro.end);
  const slots = [];

  for (let t = startM; t + astro.duration <= endM; t += astro.duration) {
    slots.push(t);
  }
  return slots;
}

function isSlotTaken(astroId, dateKey, timeKey) {
  return bookings.some(b =>
    b.astroId === astroId && b.date === dateKey && b.time === timeKey
  );
}

function isSlotInPast(dateKey, timeKey) {
  const [h, m] = timeKey.split(':').map(Number);
  const slotDate = new Date(dateKey + 'T00:00:00');
  slotDate.setHours(h, m, 0, 0);
  return slotDate.getTime() <= Date.now();
}

function openSheet(astro) {
  const days = nextDays(7);

  sheetState = {
    astro,
    date: toDateKey(days[0]),
    time: null
  };

  els.overlay.hidden = false;
  els.sheet.hidden = false;
  document.body.classList.add('sheet-open');

  renderSheet();
}

function closeSheet() {
  els.overlay.hidden = true;
  els.sheet.hidden = true;
  document.body.classList.remove('sheet-open');
  els.sheetBody.innerHTML = '';
  sheetState = null;
}

function renderSheet() {
  if (!sheetState) return;
  const { astro } = sheetState;
  const days = nextDays(7);

  const dateChips = days.map(d => {
    const key = toDateKey(d);
    const selected = key === sheetState.date ? ' selected' : '';
    return `
      <button class="date-chip${selected}" type="button" data-date="${key}"
              aria-pressed="${selected ? 'true' : 'false'}">
        <span class="dw">${d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
        <span class="dn">${d.getDate()}</span>
        <span class="mo">${d.toLocaleDateString(undefined, { month: 'short' })}</span>
      </button>
    `;
  }).join('');

  els.sheetBody.innerHTML = `
    <div class="sheet-head">
      <div class="avatar" aria-hidden="true">${esc(astro.avatar)}</div>
      <div>
        <h3>${esc(astro.name)}</h3>
        <p>${esc(astro.title)} · ₹${astro.price} / ${astro.duration} min</p>
      </div>
      <button class="icon-btn" type="button" id="closeSheet" aria-label="Close">✕</button>
    </div>

    <div class="sheet-scroll">
      <h4>Select a date</h4>
      <div class="date-row">${dateChips}</div>

      <h4>Available time slots</h4>
      <div class="slot-grid" id="slotGrid"></div>

      <h4>Your details</h4>
      <form id="bookForm" novalidate>
        <div class="field">
          <label for="fName">Full name</label>
          <input id="fName" type="text" placeholder="e.g. Ananya Sharma"
                 autocomplete="name" maxlength="60" required />
        </div>

        <div class="field">
          <label for="fPhone">Phone number</label>
          <input id="fPhone" type="tel" placeholder="10-digit mobile number"
                 inputmode="numeric" autocomplete="tel" maxlength="10" required />
        </div>

        <div class="field">
          <label for="fQuestion">Your question (optional)</label>
          <textarea id="fQuestion" rows="2" maxlength="300"
                    placeholder="What would you like guidance on?"></textarea>
        </div>
      </form>
    </div>

    <div class="sheet-foot">
      <div class="total">Total <b>₹${astro.price}</b></div>
      <button class="btn-primary" type="submit" form="bookForm" id="confirmBtn">
        Confirm booking
      </button>
    </div>
  `;

  renderSlotGrid();
}

function renderSlotGrid() {
  if (!sheetState) return;
  const grid = $('#slotGrid');
  if (!grid) return;

  const { astro, date, time } = sheetState;
  const slots = buildSlots(astro);

  if (!slots.length) {
    grid.innerHTML = `<p class="muted-note">No slots available on this date.</p>`;
    return;
  }

  grid.innerHTML = slots.map(mins => {
    const key = minutesToKey(mins);
    const disabled = isSlotTaken(astro.id, date, key) || isSlotInPast(date, key);
    const selected = time === key ? ' selected' : '';
    const label = formatTime(mins);
    return `<button type="button" class="slot${selected}" data-time="${key}"
              ${disabled ? 'disabled aria-disabled="true"' : ''}>${label}</button>`;
  }).join('');
}

function handleSheetClick(event) {
  const closeBtn = event.target.closest('#closeSheet');
  if (closeBtn) return closeSheet();

  const dateBtn = event.target.closest('[data-date]');
  if (dateBtn) {
    sheetState.date = dateBtn.dataset.date;
    sheetState.time = null;

    $$('.date-chip', els.sheetBody).forEach(chip => {
      const isSel = chip.dataset.date === sheetState.date;
      chip.classList.toggle('selected', isSel);
      chip.setAttribute('aria-pressed', isSel ? 'true' : 'false');
    });

    renderSlotGrid();
    return;
  }

  const slotBtn = event.target.closest('.slot[data-time]');
  if (slotBtn && !slotBtn.disabled) {
    sheetState.time = slotBtn.dataset.time;

    $$('.slot', els.sheetBody).forEach(s => {
      s.classList.toggle('selected', s.dataset.time === sheetState.time);
    });
    return;
  }
}

function handleSheetSubmit(event) {
  const form = event.target;
  if (!form || form.id !== 'bookForm') return;

  event.preventDefault();

  if (!sheetState) return;

  if (!sheetState.time) {
    toast('Please select a time slot first');
    return;
  }

  const nameEl = $('#fName');
  const phoneEl = $('#fPhone');
  const questionEl = $('#fQuestion');

  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim().replace(/\D/g, '');
  const question = questionEl ? questionEl.value.trim() : '';

  if (name.length < 2) {
    toast('Please enter your full name');
    nameEl.focus();
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    toast('Please enter a valid 10-digit mobile number');
    phoneEl.focus();
    return;
  }

  const { astro, date, time } = sheetState;

  if (isSlotTaken(astro.id, date, time)) {
    toast('That slot was just taken — please pick another');
    renderSlotGrid();
    sheetState.time = null;
    return;
  }

  const booking = {
    id: 'AS' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    astroId: astro.id,
    astroName: astro.name,
    astroTitle: astro.title,
    avatar: astro.avatar,
    price: astro.price,
    duration: astro.duration,
    date,
    time,
    name,
    phone,
    question,
    status: 'Confirmed',
    createdAt: Date.now()
  };

  bookings.push(booking);
  saveBookings();

  closeSheet();
  renderBookings();
  toast(`Booked! ${astro.name} · ${formatDatePretty(date)} at ${formatTimeKey(time)}`);
}

/* -----------------------------------------------------
   10. CANCEL BOOKING
   ----------------------------------------------------- */

function cancelBooking(id) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  const ok = window.confirm(
    `Cancel your session with ${booking.astroName} on ${formatDatePretty(booking.date)}?`
  );
  if (!ok) return;

  bookings = bookings.filter(b => b.id !== id);
  saveBookings();
  renderBookings();
  toast('Booking cancelled');
}

/* -----------------------------------------------------
   11. TABS / NAVIGATION
   ----------------------------------------------------- */

function switchTab(tabName) {
  Object.entries(els.views).forEach(([name, section]) => {
    section.hidden = name !== tabName;
  });

  $$('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* -----------------------------------------------------
   12. EVENT WIRING
   ----------------------------------------------------- */

function wireEvents() {
  // Search
  els.searchInput.addEventListener('input', e => {
    searchTerm = e.target.value;
    renderAstrologers();
  });

  // Filter chips
  els.filterChips.addEventListener('click', e => {
    const chip = e.target.closest('[data-filter]');
    if (!chip) return;

    activeFilter = chip.dataset.filter;
    renderChips();
    renderAstrologers();
  });

  // Open booking sheet from astrologer cards
  els.astroList.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open]');
    if (!trigger) return;

    const astro = getAstrologer(trigger.dataset.open);
    if (astro) openSheet(astro);
  });

  // Cancel booking
  els.bookingList.addEventListener('click', e => {
    const btn = e.target.closest('[data-cancel]');
    if (btn) cancelBooking(btn.dataset.cancel);
  });

  // Sheet interactions
  els.sheetBody.addEventListener('click', handleSheetClick);
  els.sheetBody.addEventListener('submit', handleSheetSubmit);

  // Phone input: digits only
  els.sheetBody.addEventListener('input', e => {
    if (e.target.id === 'fPhone') {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    }
  });

  // Overlay closes sheet
  els.overlay.addEventListener('click', closeSheet);

  // Escape closes sheet
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheetState) closeSheet();
  });

  // Tabs
  $$('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Empty state → browse
  els.goBrowse.addEventListener('click', () => switchTab('astrologers'));
}

/* -----------------------------------------------------
   13. PWA — INSTALL PROMPT + SERVICE WORKER
   ----------------------------------------------------- */

let deferredPrompt = null;

function setupPWA() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    els.installBtn.hidden = false;
  });

  els.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      toast('Use your browser menu → "Install app"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBtn.hidden = true;
    if (outcome === 'accepted') toast('AstroSeva installed ✦');
  });

  window.addEventListener('appinstalled', () => {
    els.installBtn.hidden = true;
    deferredPrompt = null;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('sw.js')
        .catch(err => console.warn('Service worker registration failed:', err));
    });
  }
}

/* -----------------------------------------------------
   14. INIT
   ----------------------------------------------------- */

function init() {
  renderChips();
  renderAstrologers();
  renderBookings();
  wireEvents();
  setupPWA();
}

document.addEventListener('DOMContentLoaded', init);