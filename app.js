/* =====================================================
   AstroSeva — Shared Logic & Mock Database
   ===================================================== */

const DB = {
  // Initialize DB with empty arrays if not present
  init() {
    if (!localStorage.getItem('astroseva_astros')) {
      localStorage.setItem('astroseva_astros', JSON.stringify([]));
    }
    if (!localStorage.getItem('astroseva_bookings')) {
      localStorage.setItem('astroseva_bookings', JSON.stringify([]));
    }
    if (!localStorage.getItem('astroseva_chats')) {
      localStorage.setItem('astroseva_chats', JSON.stringify({}));
    }
    if (!localStorage.getItem('astroseva_notifications')) {
      localStorage.setItem('astroseva_notifications', JSON.stringify([]));
    }
  },

  // Astrologer Methods
  getAstros() { return JSON.parse(localStorage.getItem('astroseva_astros')) || []; },
  getApprovedAstros() { return this.getAstros().filter(a => a.status === 'approved'); },
  getPendingAstros() { return this.getAstros().filter(a => a.status === 'pending'); },
  getAstroById(id) { return this.getAstros().find(a => a.id === id); },
  
  addAstro(astro) {
    const astros = this.getAstros();
    astro.id = 'astro_' + Date.now();
    astro.status = 'pending';
    astro.loginCode = null;
    astro.availability = { start: '09:00', end: '17:00' };
    astros.push(astro);
    localStorage.setItem('astroseva_astros', JSON.stringify(astros));
    
    // Add notification for admin
    const notes = JSON.parse(localStorage.getItem('astroseva_notifications'));
    notes.push({ id: astro.id, name: astro.name, message: 'New astrologer registration request.' });
    localStorage.setItem('astroseva_notifications', JSON.stringify(notes));
  },

  approveAstro(id) {
    const astros = this.getAstros();
    const astro = astros.find(a => a.id === id);
    if (!astro) return null;

    // Generate 6-digit login code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    astro.status = 'approved';
    astro.loginCode = code;
    localStorage.setItem('astroseva_astros', JSON.stringify(astros));

    // Remove from notifications
    let notes = JSON.parse(localStorage.getItem('astroseva_notifications'));
    notes = notes.filter(n => n.id !== id);
    localStorage.setItem('astroseva_notifications', JSON.stringify(notes));

    // Simulate SMS and WhatsApp
    setTimeout(() => {
      alert(`[MOCK SMS to ${astro.phone}]\nYour AstroSeva login code is: ${code}\n\n[MOCK WhatsApp]\nWelcome to AstroSeva! Your login code is: ${code}`);
    }, 500);

    return code;
  },

  updateAstroSettings(id, fees, availability) {
    const astros = this.getAstros();
    const astro = astros.find(a => a.id === id);
    if (astro) {
      astro.fees = Number(fees);
      astro.availability = availability;
      localStorage.setItem('astroseva_astros', JSON.stringify(astros));
    }
  },

  // Chat Methods
  getChats(astroId, customerName) {
    const chats = JSON.parse(localStorage.getItem('astroseva_chats'));
    const key = `${astroId}_${customerName}`;
    return chats[key] || [];
  },

  saveChat(astroId, customerName, messageObj) {
    const chats = JSON.parse(localStorage.getItem('astroseva_chats'));
    const key = `${astroId}_${customerName}`;
    if (!chats[key]) chats[key] = [];
    chats[key].push(messageObj);
    localStorage.setItem('astroseva_chats', JSON.stringify(chats));
  },

  // Booking Methods
  addBooking(booking) {
    const bookings = JSON.parse(localStorage.getItem('astroseva_bookings'));
    bookings.push(booking);
    localStorage.setItem('astroseva_bookings', JSON.stringify(bookings));
  },

  getBookingsForAstro(astroId) {
    const bookings = JSON.parse(localStorage.getItem('astroseva_bookings'));
    return bookings.filter(b => b.astroId === astroId);
  }
};

// Global Helpers
const Utils = {
  // Check if user is logged in
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
  },

  // Generate random date string for display
  formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
};

// Initialize DB on load
DB.init();
