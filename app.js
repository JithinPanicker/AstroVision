/* =====================================================
   AstroSeva — Application Logic
   ===================================================== */

'use strict';

// --- Mock Database ---
const ASTROLOGERS = [
  { id: 1, name: 'Ritu Ji', skills: 'Vedic, AI Astrologer', languages: 'Hindi, English', experience: 14, rating: 5.0, price: 5, image: 'https://aws.astrotalk.com/consultant_pic/058c0216-aa9d-4913-a4aa-5692df0a4543.png', online: true },
  { id: 2, name: 'Shaarvani', skills: 'Vedic, Tarot', languages: 'English, Hindi', experience: 11, rating: 5.0, price: 5, image: 'https://aws.astrotalk.com/consultant_pic/29667c2a-99e9-48a6-b2c3-088178db2d73.png', online: true },
  { id: 3, name: 'Bharadwaj', skills: 'Vedic, Prashana', languages: 'English, Hindi', experience: 6, rating: 5.0, price: 5, image: 'https://aws.astrotalk.com/consultant_pic/p-92397.jpg', online: true },
  { id: 4, name: 'Tarot Dhwaani', skills: 'Tarot, Numerology', languages: 'English, Hindi', experience: 9, rating: 5.0, price: 54, image: 'https://aws.astrotalk.com/consultant_pic/p-39263.jpg', online: false },
  { id: 5, name: 'Gyaneshwar', skills: 'Vedic, Vastu', languages: 'Hindi', experience: 15, rating: 5.0, price: 30, image: 'https://aws.astrotalk.com/consultant_pic/p-52047.jpg', online: true },
  { id: 6, name: 'Vasuprada', skills: 'Tarot, Life Coach', languages: 'Hindi', experience: 11, rating: 5.0, price: 24, image: 'https://aws.astrotalk.com/consultant_pic/p-119696.jpg', online: true },
  { id: 7, name: 'Harjit', skills: 'Tarot, AI Astrologer', languages: 'English, Hindi', experience: 9, rating: 5.0, price: 27, image: 'https://aws.astrotalk.com/consultant_pic/7825511e-99d8-458d-bf75-3812989eda25.png', online: true },
  { id: 8, name: 'Antrika', skills: 'Nadi, Tarot', languages: 'English, Hindi', experience: 5, rating: 5.0, price: 26, image: 'https://aws.astrotalk.com/consultant_pic/p-105186.jpg', online: false }
];

// --- State ---
let activeSkill = 'all';
let activeLang = 'all';
let searchQuery = '';

// --- DOM Elements ---
const grid = document.getElementById('astroGrid');
const searchInput = document.getElementById('searchInput');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');
const chips = document.querySelectorAll('.chip');

// --- Render Logic ---
function renderAstrologers() {
  grid.innerHTML = '';

  // Filter logic
  const filtered = ASTROLOGERS.filter(astro => {
    const matchesSkill = activeSkill === 'all' || astro.skills.toLowerCase().includes(activeSkill.toLowerCase());
    const matchesLang = activeLang === 'all' || astro.languages.toLowerCase().includes(activeLang.toLowerCase());
    
    const haystack = `${astro.name} ${astro.skills} ${astro.languages}`.toLowerCase();
    const matchesSearch = searchQuery === '' || haystack.includes(searchQuery.toLowerCase());

    return matchesSkill && matchesLang && matchesSearch;
  });

  // Update count
  resultsCount.textContent = `Showing ${filtered.length} astrologers`;

  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  // Build HTML
  const html = filtered.map(astro => `
    <div class="astro-card">
      <div class="card-image-wrap">
        <img src="${astro.image}" alt="${astro.name}" onerror="this.src='https://via.placeholder.com/300x450?text=Astrologer'">
        ${astro.online ? `<span class="online-badge">ONLINE</span>` : ''}
        <span class="rating-badge">★ ${astro.rating.toFixed(1)}</span>
      </div>
      <div class="card-details">
        <h3>${astro.name}</h3>
        <p class="skills">${astro.skills} · ${astro.experience} yrs exp</p>
        <p class="lang">${astro.languages}</p>
      </div>
      <div class="card-actions">
        <button class="btn-chat" onclick="startChat(${astro.id})">Chat ₹${astro.price}/m</button>
        <button class="btn-call" onclick="startCall(${astro.id})">Call</button>
      </div>
    </div>
  `).join('');

  grid.innerHTML = html;
}

// --- Interaction Handlers ---
function startChat(id) {
  const astro = ASTROLOGERS.find(a => a.id === id);
  const name = prompt(`Enter your name to chat with ${astro.name}:`);
  if (name && name.trim()) {
    alert(`Connecting you to ${astro.name}... (Mock)`);
    // window.location.href = `chat.html?astro=${id}&name=${encodeURIComponent(name)}`;
  }
}

function startCall(id) {
  const astro = ASTROLOGERS.find(a => a.id === id);
  alert(`Initiating call with ${astro.name}... (Mock)`);
}

// Search Event
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderAstrologers();
});

// Filter Chips Event
chips.forEach(chip => {
  chip.addEventListener('click', (e) => {
    const type = e.target.closest('.filter-row').querySelector('.filter-label').textContent.includes('Skills') ? 'skill' : 'lang';
    const value = e.target.dataset.filter;

    // Reset siblings in same row
    const rowChips = e.target.closest('.filter-row').querySelectorAll('.chip');
    rowChips.forEach(c => c.classList.remove('active'));
    e.target.classList.add('active');

    if (type === 'skill') activeSkill = value;
    else activeLang = value;

    renderAstrologers();
  });
});

// --- Init ---
renderAstrologers();

// --- PWA Setup ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.log('SW registration failed:', err));
  });
}
