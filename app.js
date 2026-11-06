/* =====================================================
   AstroSeva — Shared Logic & Mock Database
   ===================================================== */

const DB = {
  init() {
    if (!localStorage.getItem('astroseva_astros')) {
      const sample = [
        { id: 'a1', name: 'Ritu Ji', skills: 'Vedic, AI', languages: 'Hindi, English', experience: 14, fees: 5, status: 'approved', image: 'https://aws.astrotalk.com/consultant_pic/058c0216-aa9d-4913-a4aa-5692df0a4543.png' },
        { id: 'a2', name: 'Shaarvani', skills: 'Tarot, Vedic', languages: 'English, Hindi', experience: 11, fees: 5, status: 'approved', image: 'https://aws.astrotalk.com/consultant_pic/29667c2a-99e9-48a6-b2c3-088178db2d73.png' }
      ];
      localStorage.setItem('astroseva_astros', JSON.stringify(sample));
    }
    if (!localStorage.getItem('astroseva_bookings')) localStorage.setItem('astroseva_bookings', JSON.stringify([]));
    if (!localStorage.getItem('astroseva_chats')) localStorage.setItem('astroseva_chats', JSON.stringify({}));
  },
  getAstros() { return JSON.parse(localStorage.getItem('astroseva_astros')) || []; },
  getApprovedAstros() { return this.getAstros().filter(a => a.status === 'approved'); },
  getPendingAstros() { return this.getAstros().filter(a => a.status === 'pending'); },
  getAstroById(id) { return this.getAstros().find(a => a.id === id); },
  
  addAstro(data) {
    const astros = this.getAstros();
    data.id = 'astro_' + Date.now();
    data.status = 'pending';
    astros.push(data);
    localStorage.setItem('astroseva_astros', JSON.stringify(astros));
  },
  approveAstro(id) {
    const astros = this.getAstros();
    const astro = astros.find(a => a.id === id);
    if (astro) {
      astro.status = 'approved';
      astro.loginCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('astroseva_astros', JSON.stringify(astros));
      alert(`Approved! Mock SMS/WhatsApp sent with code: ${astro.loginCode}`);
      return true;
    }
    return false;
  },
  updateAstro(id, fees, start, end) {
    const astros = this.getAstros();
    const astro = astros.find(a => a.id === id);
    if (astro) {
      astro.fees = Number(fees);
      astro.start = start;
      astro.end = end;
      localStorage.setItem('astroseva_astros', JSON.stringify(astros));
    }
  },
  addBooking(b) {
    const bks = JSON.parse(localStorage.getItem('astroseva_bookings'));
    bks.push(b);
    localStorage.setItem('astroseva_bookings', JSON.stringify(bks));
  },
  getChats(astroId, customerName) {
    const chats = JSON.parse(localStorage.getItem('astroseva_chats'));
    const key = `${astroId}_${customerName}`;
    return chats[key] || [];
  },
  saveChat(astroId, customerName, msg) {
    const chats = JSON.parse(localStorage.getItem('astroseva_chats'));
    const key = `${astroId}_${customerName}`;
    if (!chats[key]) chats[key] = [];
    chats[key].push(msg);
    localStorage.setItem('astroseva_chats', JSON.stringify(chats));
  }
};

const Utils = {
  checkAuth(role) {
    const auth = JSON.parse(sessionStorage.getItem('astroseva_auth'));
    if (!auth || auth.role !== role) {
      window.location.href = 'login.html';
      return null;
    }
    return auth;
  },
  logout() {
    sessionStorage.removeItem('astroseva_auth');
    window.location.href = 'index.html';
  }
};

DB.init();

// --- Page Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // 1. Home Page
  if (path.includes('index.html') || path.endsWith('/')) {
    const grid = document.getElementById('astroGrid');
    if (grid) renderHomeGrid(grid);
  }

  // 2. Login
  if (path.includes('login.html')) {
    // handled by inline script
  }

  // 3. Register
  if (path.includes('register.html')) {
    const form = document.getElementById('registerForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        DB.addAstro({
          name: document.getElementById('regName').value,
          phone: document.getElementById('regPhone').value,
          password: document.getElementById('regPass').value,
          skills: document.getElementById('regSkills').value,
          fees: Number(document.getElementById('regFees').value),
          image: document.getElementById('regImage').value || 'https://via.placeholder.com/300x450?text=Astrologer'
        });
        alert('Application submitted! Admin will review shortly.');
        window.location.href = 'index.html';
      });
    }
  }

  // 4. Admin
  if (path.includes('admin.html')) {
    Utils.checkAuth('admin');
    const list = document.getElementById('pendingList');
    if (list) {
      const pending = DB.getPendingAstros();
      if (pending.length === 0) list.innerHTML = '<p>No pending requests.</p>';
      else {
        list.innerHTML = pending.map(a => `
          <div class="list-item">
            <div>
              <h4>${a.name}</h4>
              <p style="font-size:12px; color:#666;">📞 ${a.phone} · ₹${a.fees}</p>
            </div>
            <button class="btn-primary" onclick="approve('${a.id}')">Approve</button>
          </div>
        `).join('');
      }
    }
  }

  // 5. Astrologer Dashboard
  if (path.includes('astro-dashboard.html')) {
    const auth = Utils.checkAuth('astro');
    const astro = DB.getAstroById(auth.astroId);
    if (astro) {
      document.getElementById('adName').textContent = astro.name;
      document.getElementById('adFee').value = astro.fees;
      document.getElementById('adStart').value = astro.start || '09:00';
      document.getElementById('adEnd').value = astro.end || '17:00';
      
      document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        DB.updateAstro(astro.id, document.getElementById('adFee').value, document.getElementById('adStart').value, document.getElementById('adEnd').value);
        alert('Settings updated!');
      });

      // Load active chats
      const chatsObj = JSON.parse(localStorage.getItem('astroseva_chats'));
      const chatList = document.getElementById('chatList');
      const keys = Object.keys(chatsObj || {}).filter(k => k.startsWith(astro.id));
      if (keys.length === 0) chatList.innerHTML = '<p>No active chats.</p>';
      else {
        chatList.innerHTML = keys.map(k => {
          const cName = k.split('_')[1];
          return `<div class="list-item"><span>${cName}</span><a href="chat.html?astro=${astro.id}&customer=${cName}" class="btn-outline">Open</a></div>`;
        }).join('');
      }
    }
  }

  // 6. Chat Interface
  if (path.includes('chat.html')) {
    const params = new URLSearchParams(window.location.search);
    const astroId = params.get('astro');
    const customerName = params.get('customer') || sessionStorage.getItem('customerName');
    const auth = JSON.parse(sessionStorage.getItem('astroseva_auth'));
    const isAstro = auth && auth.role === 'astro';

    if (!astroId || (!customerName && !isAstro)) {
      window.location.href = 'index.html';
      return;
    }

    const astro = DB.getAstroById(astroId);
    document.getElementById('chatHeaderTitle').textContent = isAstro ? `Chat with ${customerName}` : `Chat with ${astro.name}`;

    const renderMsgs = () => {
      const msgs = DB.getChats(astroId, customerName);
      const box = document.getElementById('chatMessages');
      box.innerHTML = msgs.map(m => `
        <div class="message ${m.sender === 'astro' ? 'msg-astro' : 'msg-user'}">
          ${m.text}
        </div>
      `).join('');
      box.scrollTop = box.scrollHeight;
    };

    document.getElementById('sendBtn').addEventListener('click', () => {
      const input = document.getElementById('chatInput');
      const text = input.value.trim();
      if (!text) return;
      DB.saveChat(astroId, customerName, { sender: isAstro ? 'astro' : 'user', text });
      input.value = '';
      renderMsgs();
    });

    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') document.getElementById('sendBtn').click();
    });

    renderMsgs();
    setInterval(renderMsgs, 2000);
  }

  // 7. Booking Checkout
  if (path.includes('booking.html')) {
    const params = new URLSearchParams(window.location.search);
    const astroId = params.get('astro');
    const astro = DB.getAstroById(astroId);
    if (astro) {
      document.getElementById('bkAstroName').textContent = astro.name;
      document.getElementById('bkAstroFee').textContent = `₹${astro.fees} / hour`;
      
      document.getElementById('bookingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        DB.addBooking({
          id: 'BK' + Date.now(),
          astroId: astro.id,
          astroName: astro.name,
          customerName: document.getElementById('bkName').value,
          phone: document.getElementById('bkPhone').value,
          dob: document.getElementById('bkDob').value,
          fee: astro.fees
        });
        alert('Booking Confirmed!');
        window.location.href = 'index.html';
      });
    }
  }
});

// Global functions
function renderHomeGrid(container) {
  const astros = DB.getApprovedAstros();
  container.innerHTML = astros.map(a => `
    <div class="astro-card">
      <div class="card-image">
        <img src="${a.image}" alt="${a.name}" onerror="this.src='https://via.placeholder.com/300x450?text=Astrologer'">
        <span class="online-badge">ONLINE</span>
        <span class="rating-badge">★ 5.0</span>
      </div>
      <div class="card-details">
        <h3>${a.name}</h3>
        <p class="skills">${a.skills} · ${a.experience} yrs exp</p>
        <p class="lang">${a.languages || 'Hindi, English'}</p>
      </div>
      <div class="card-actions">
        <button class="btn-chat" onclick="goToChat('${a.id}')">Chat ₹${a.fees}/m</button>
        <button class="btn-call" onclick="goToBooking('${a.id}')">Book</button>
      </div>
    </div>
  `).join('');
}

function goToChat(id) {
  const name = prompt("Enter your name to start chat:");
  if (name && name.trim()) {
    sessionStorage.setItem('customerName', name.trim());
    window.location.href = `chat.html?astro=${id}&customer=${encodeURIComponent(name.trim())}`;
  }
}

function goToBooking(id) {
  window.location.href = `booking.html?astro=${id}`;
}

function approve(id) {
  if (DB.approveAstro(id)) {
    window.location.reload();
  }
}
