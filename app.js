/* ==========================================================================
   BookMy Astrologer Kerala — Production Prototype Engine (v2 PWA)
   - Bilingual (EN | മലയാളം) dictionary
   - Chat-only live consultations & manual slots + offline Kerala chambers
   - 70% Astrologer / 30% Admin derived double-entry ledger
   - Bank penny-drop verification gate & jithinck2000-1@okhdfcbank settlement
   - PWA Install prompt + Web Share API integration
   ========================================================================== */

'use strict';

// ── 1. CONSTANTS & I18N DICTIONARY ──────────────────────────────────────────
const STORAGE_KEY = 'bma_kerala_state_v2';
const ADMIN_SETTLEMENT_UPI = 'jithinck2000-1@okhdfcbank';
const MIN_TOPUP_AMOUNT = 50;

const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha',
  'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur',
  'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad',
  'Kannur', 'Kasaragod'
];

const I18N = {
  en: {
    astrologer: 'Astrologer',
    liveChat: 'Live Chat',
    bookSlot: 'Book Slot',
    onlineBooking: 'Online Booking',
    offlineVisit: 'Offline / Chamber Visit',
    kundali: 'Kundali / Birth Chart',
    rasi: 'Rasi (Moon Sign)',
    lagna: 'Lagna (Ascendant)',
    nakshatra: 'Nakshatra',
    dosham: 'Dosham',
    pariharam: 'Pariharam / Remedy',
    muhurtham: 'Muhurtham',
    prasnam: 'Prasnam',
    wallet: 'Wallet',
    recharge: 'Recharge',
    withdraw: 'Withdraw',
    bankDetails: 'Bank Details',
    verified: 'Verified',
    pending: 'Pending',
    topic: 'Consultation Topic',
    heroTitle: 'Sacred Kerala Jyothisham, Live Chat & Verified Chambers',
    heroSub: 'Connect via encrypted text chat or reserve an in-person chamber visit across all 14 districts of Kerala.'
  },
  ml: {
    astrologer: 'ജ്യോതിഷി',
    liveChat: 'ലൈവ് ചാറ്റ്',
    bookSlot: 'സ്ലോട്ട് ബുക്ക് ചെയ്യുക',
    onlineBooking: 'ഓൺലൈൻ ബുക്കിംഗ്',
    offlineVisit: 'ഓഫ്‌ലൈൻ / ചേംബർ സന്ദർശനം',
    kundali: 'കുണ്ഡലി / ജാതകം',
    rasi: 'രാശി',
    lagna: 'ലഗ്നം',
    nakshatra: 'നക്ഷത്രം',
    dosham: 'ദോഷം',
    pariharam: 'പരിഹാരം',
    muhurtham: 'മുഹൂർത്തം',
    prasnam: 'പ്രശ്നം',
    wallet: 'വാലറ്റ്',
    recharge: 'റീചാർജ് ചെയ്യുക',
    withdraw: 'പിൻവലിക്കുക',
    bankDetails: 'ബാങ്ക് വിവരങ്ങൾ',
    verified: 'സ്ഥിരീകരിച്ചു',
    pending: 'കാത്തിരിക്കുന്നു',
    topic: 'കൺസൾട്ടേഷൻ വിഷയം'
  }
};

// ── 2. SEED DATA ────────────────────────────────────────────────────────────
function createSeedState() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return {
    lang: 'en',
    activePortal: 'customer', // customer | astrologer | admin
    customerSubView: 'discover', // discover | booking | bookings | wallet | chat
    astrologerSubView: 'console', // console | slots | chamber | earnings | profile
    adminSubView: 'overview', // overview | banks | withdrawals | kyc | settlement | ledger | audit
    selectedAstrologerId: 'ast-1',
    activeAstrologerId: 'ast-1',
    activeCustomerId: 'cust-1',
    dpdpAccepted: false,
    admin2faVerified: false,
    lastActionTimestamps: {},
    processedIdempotencyKeys: [],

    filters: {
      search: '',
      speciality: 'All',
      district: 'All',
      language: 'All',
      onlineOnly: false,
      offlineOnly: false
    },

    customers: [
      { id: 'cust-1', name: 'Arjun Nair', phone: '+91 98470 11223', email: 'arjun.nair@kerala.in', district: 'Ernakulam', verified: true },
      { id: 'cust-2', name: 'Meera Menon', phone: '+91 94471 33445', email: 'meera.m@kerala.in', district: 'Thrissur', verified: true },
      { id: 'cust-3', name: 'Rahul Krishnan', phone: '+91 99950 55667', email: 'rahul.k@kerala.in', district: 'Kozhikode', verified: true }
    ],

    astrologers: [
      {
        id: 'ast-1',
        name: 'Acharya Kottarathil Sankaran Namboothiri',
        nameMl: 'ആചാര്യ കൊട്ടാരത്തിൽ ശങ്കരൻ നമ്പൂതിരി',
        district: 'Thrissur',
        experience: 24,
        rating: 4.95,
        reviewsCount: 418,
        ratePerMin: 25,
        online: true,
        kycStatus: 'Verified',
        languages: ['Malayalam', 'Sanskrit', 'English'],
        specialities: ['Vedic/Jyothisha', 'Prasnam', 'Muhurtham'],
        bioEn: 'Traditional Ashtamangala Prasnam and Kerala Panchangam scholar near Vadakkunnathan Temple.',
        bioMl: 'വടക്കുംനാഥ ക്ഷേത്രത്തിന് സമീപം അഷ്ടമംഗല പ്രശ്നത്തിലും കേരള പഞ്ചാംഗത്തിലും 24 വർഷത്തെ പരിചയം.',
        chamber: {
          visible: true,
          address: 'Sree Sankara Jyothisha Nilayam, Round North, Near Vadakkunnathan Temple',
          district: 'Thrissur',
          landmark: 'Opp. Paramekkavu Devaswom Building',
          pincode: '680001',
          mapsUrl: 'https://maps.google.com/?q=Vadakkunnathan+Temple+Thrissur'
        },
        bank: {
          status: 'Verified',
          pennyDropVerified: true,
          holderName: 'Sankaran Namboothiri K',
          accountMasked: 'XXXX XXXX 4821',
          ifsc: 'SBIN0000940',
          bankName: 'State Bank of India',
          branch: 'Thrissur Main',
          upiId: 'sankaran.jyothisham@oksbi',
          rejectReason: ''
        }
      },
      {
        id: 'ast-2',
        name: 'Jyothishi Parvathy Amma',
        nameMl: 'ജ്യോതിഷി പാർവ്വതി അമ്മ',
        district: 'Kottayam',
        experience: 19,
        rating: 4.91,
        reviewsCount: 312,
        ratePerMin: 20,
        online: true,
        kycStatus: 'Verified',
        languages: ['Malayalam', 'English'],
        specialities: ['Kundali Matching (Porutham)', 'Vedic/Jyothisha', 'Muhurtham'],
        bioEn: 'Specialist in Dasavidha Porutham, marriage compatibility, and Pariharam remedies.',
        bioMl: 'ദശവിധ പൊരുത്തം, വിവാഹ ജാതക പൊരുത്തം, ദോഷ പരിഹാരങ്ങൾ എന്നിവയിൽ വിദഗ്ധ.',
        chamber: {
          visible: true,
          address: 'Devi Kripa Astrological Centre, Baker Junction, Thirunakkara',
          district: 'Kottayam',
          landmark: 'Near Thirunakkara Mahadeva Temple',
          pincode: '686001',
          mapsUrl: 'https://maps.google.com/?q=Thirunakkara+Temple+Kottayam'
        },
        bank: {
          status: 'Pending',
          pennyDropVerified: false,
          holderName: 'Parvathy Amma R',
          accountMasked: 'XXXX XXXX 7719',
          ifsc: 'FDRL0001024',
          bankName: 'Federal Bank',
          branch: 'Kottayam Baker Jn',
          upiId: 'parvathy.astro@okicici',
          rejectReason: ''
        }
      },
      {
        id: 'ast-3',
        name: 'Acharya Hariharan Pillai',
        nameMl: 'ആചാര്യ ഹരിഹരൻ പിള്ള',
        district: 'Thiruvananthapuram',
        experience: 28,
        rating: 4.97,
        reviewsCount: 529,
        ratePerMin: 30,
        online: true,
        kycStatus: 'Verified',
        languages: ['Malayalam', 'English', 'Tamil', 'Sanskrit'],
        specialities: ['Prasnam', 'Vastu', 'Vedic/Jyothisha'],
        bioEn: 'Renowned Tambula Prasnam and Kerala Thachu Shastra Vastu consultant in Fort Trivandrum.',
        bioMl: 'തിരുവനന്തപുരം ഫോർട്ടിൽ താംബൂല പ്രശ്നത്തിലും വാസ്തു ശാസ്ത്രത്തിലും പ്രമുഖ ആചാര്യൻ.',
        chamber: {
          visible: true,
          address: 'Ananthapuri Jyothisha Kendram, East Fort, Padmanabhaswamy Temple Road',
          district: 'Thiruvananthapuram',
          landmark: 'Near East Fort Bus Stand',
          pincode: '695023',
          mapsUrl: 'https://maps.google.com/?q=East+Fort+Thiruvananthapuram'
        },
        bank: {
          status: 'Verified',
          pennyDropVerified: true,
          holderName: 'Hariharan Pillai V',
          accountMasked: 'XXXX XXXX 9104',
          ifsc: 'HDFC0000063',
          bankName: 'HDFC Bank',
          branch: 'Vazhuthacaud',
          upiId: 'hariharan.vastu@okhdfcbank',
          rejectReason: ''
        }
      },
      {
        id: 'ast-4',
        name: 'Vidwan Madhavanunni Panicker',
        nameMl: 'വിദ്വാൻ മാധവനുണ്ണി പണിക്കർ',
        district: 'Kozhikode',
        experience: 16,
        rating: 4.84,
        reviewsCount: 198,
        ratePerMin: 18,
        online: false,
        kycStatus: 'Verified',
        languages: ['Malayalam', 'English'],
        specialities: ['Numerology (Sankhya Shastram)', 'Vastu', 'Muhurtham'],
        bioEn: 'Malabar Kaniyar tradition astrologer blending classical Jyothisha with Sankhya Shastram.',
        bioMl: 'മലബാർ കണിയാർ പാരമ്പര്യ ജ്യോതിഷവും സംഖ്യാശാസ്ത്രവും സംയോജിപ്പിച്ചുള്ള പ്രവചനങ്ങൾ.',
        chamber: {
          visible: true,
          address: 'Malabar Jyothisha Bhavan, Tali Temple Road, Chalappuram',
          district: 'Kozhikode',
          landmark: 'Opposite Tali Shiva Temple',
          pincode: '673002',
          mapsUrl: 'https://maps.google.com/?q=Tali+Temple+Kozhikode'
        },
        bank: {
          status: 'Pending',
          pennyDropVerified: false,
          holderName: 'Madhavanunni Panicker',
          accountMasked: 'XXXX XXXX 3390',
          ifsc: 'CNRB0000812',
          bankName: 'Canara Bank',
          branch: 'SM Street Kozhikode',
          upiId: '',
          rejectReason: ''
        }
      },
      {
        id: 'ast-5',
        name: 'Smt. Devika Warrier',
        nameMl: 'ശ്രീമതി ദേവിക വാര്യർ',
        district: 'Ernakulam',
        experience: 12,
        rating: 4.88,
        reviewsCount: 245,
        ratePerMin: 22,
        online: true,
        kycStatus: 'Verified',
        languages: ['Malayalam', 'English', 'Hindi'],
        specialities: ['Kundali Matching (Porutham)', 'Numerology (Sankhya Shastram)', 'Vedic/Jyothisha'],
        bioEn: 'Career, higher education, and relationship Kundali specialist based in Tripunithura, Kochi.',
        bioMl: 'തൃപ്പൂണിത്തുറ കേന്ദ്രമായി കരിയർ, വിദ്യാഭ്യാസം, വിവാഹ ജാതക വിശകലന വിദഗ്ധ.',
        chamber: {
          visible: true,
          address: 'Poornathrayeesa Jyothisha Studio, Statue Junction, Tripunithura',
          district: 'Ernakulam',
          landmark: 'Near Sree Poornathrayeesa Temple',
          pincode: '682301',
          mapsUrl: 'https://maps.google.com/?q=Tripunithura+Ernakulam'
        },
        bank: {
          status: 'Verified',
          pennyDropVerified: true,
          holderName: 'Devika Warrier',
          accountMasked: 'XXXX XXXX 6502',
          ifsc: 'ICIC0000185',
          bankName: 'ICICI Bank',
          branch: 'Tripunithura',
          upiId: 'devika.warrier@okicici',
          rejectReason: ''
        }
      },
      {
        id: 'ast-6',
        name: 'Acharya Narayanan Potti',
        nameMl: 'ആചാര്യ നാരായണൻ പോറ്റി',
        district: 'Palakkad',
        experience: 14,
        rating: 4.79,
        reviewsCount: 142,
        ratePerMin: 16,
        online: false,
        kycStatus: 'Pending',
        languages: ['Malayalam', 'Tamil', 'Sanskrit'],
        specialities: ['Vedic/Jyothisha', 'Muhurtham', 'Prasnam'],
        bioEn: 'Kalpathy Agraharam Vedic scholar specializing in Graha Shanti and Muhurtham selection.',
        bioMl: 'കൽപ്പാത്തി അഗ്രഹാരത്തിലെ വേദ പണ്ഡിതൻ; മുഹൂർത്ത നിർണ്ണയത്തിലും ഗ്രഹശാന്തിയിലും വിദഗ്ധൻ.',
        chamber: {
          visible: false,
          address: 'Agraharam Vedic Centre, New Kalpathy',
          district: 'Palakkad',
          landmark: 'Near Viswanathaswamy Temple',
          pincode: '678003',
          mapsUrl: 'https://maps.google.com/?q=Kalpathy+Palakkad'
        },
        bank: {
          status: 'Pending',
          pennyDropVerified: false,
          holderName: 'Narayanan Potti S',
          accountMasked: 'XXXX XXXX 1184',
          ifsc: 'SBIN0000893',
          bankName: 'State Bank of India',
          branch: 'Palakkad Town',
          upiId: '',
          rejectReason: ''
        }
      }
    ],

    slots: [
      { id: 'slot-101', astrologerId: 'ast-1', date: today, startTime: '10:30', durationMin: 20, mode: 'Online Chat', price: 300, maxBookings: 1, bookedCount: 1 },
      { id: 'slot-102', astrologerId: 'ast-1', date: today, startTime: '11:30', durationMin: 20, mode: 'Online Chat', price: 300, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-103', astrologerId: 'ast-1', date: today, startTime: '16:00', durationMin: 30, mode: 'Offline Chamber', price: 500, maxBookings: 2, bookedCount: 1 },
      { id: 'slot-104', astrologerId: 'ast-1', date: tomorrow, startTime: '09:30', durationMin: 30, mode: 'Offline Chamber', price: 500, maxBookings: 2, bookedCount: 0 },
      { id: 'slot-105', astrologerId: 'ast-2', date: today, startTime: '14:00', durationMin: 15, mode: 'Online Chat', price: 250, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-106', astrologerId: 'ast-2', date: today, startTime: '17:00', durationMin: 30, mode: 'Offline Chamber', price: 450, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-107', astrologerId: 'ast-3', date: today, startTime: '12:00', durationMin: 20, mode: 'Online Chat', price: 400, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-108', astrologerId: 'ast-3', date: tomorrow, startTime: '10:00', durationMin: 40, mode: 'Offline Chamber', price: 700, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-109', astrologerId: 'ast-5', date: today, startTime: '15:30', durationMin: 20, mode: 'Online Chat', price: 350, maxBookings: 1, bookedCount: 0 }
    ],

    bookings: [
      { id: 'BK-9001', customerId: 'cust-1', astrologerId: 'ast-1', slotId: 'slot-101', mode: 'Online Chat', date: today, time: '10:30', durationMin: 20, amount: 300, topic: 'Career & Abroad Opportunity', birthDetails: { name: 'Arjun Nair', dob: '1996-05-14', tob: '06:45', pob: 'Ernakulam', rasi: 'Mesham (Aries)', lagna: 'Vrishabham', nakshatra: 'Bharani' }, status: 'Confirmed', token: 'ONL-9001', rated: false },
      { id: 'BK-9002', customerId: 'cust-1', astrologerId: 'ast-1', slotId: 'slot-103', mode: 'Offline Chamber', date: today, time: '16:00', durationMin: 30, amount: 500, topic: 'Ashtamangala Prasnam for Family Home', birthDetails: { name: 'Arjun Nair', dob: '1996-05-14', tob: '06:45', pob: 'Ernakulam', rasi: 'Mesham (Aries)', lagna: 'Vrishabham', nakshatra: 'Bharani' }, status: 'Confirmed', token: 'CHM-4412', rated: false },
      { id: 'BK-9003', customerId: 'cust-2', astrologerId: 'ast-2', slotId: 'slot-105', mode: 'Online Chat', date: today, time: '11:00', durationMin: 15, amount: 250, topic: 'Kundali Porutham Verification', birthDetails: { name: 'Meera Menon', dob: '1998-09-22', tob: '14:20', pob: 'Thrissur', rasi: 'Kanni (Virgo)', lagna: 'Dhanu', nakshatra: 'Hasta' }, status: 'Completed', token: 'ONL-9003', rated: true },
      { id: 'BK-9004', customerId: 'cust-3', astrologerId: 'ast-3', slotId: 'slot-107', mode: 'Online Chat', date: today, time: '09:30', durationMin: 20, amount: 400, topic: 'New Office Vastu Muhurtham', birthDetails: { name: 'Rahul Krishnan', dob: '1993-11-08', tob: '08:10', pob: 'Kozhikode', rasi: 'Simham (Leo)', lagna: 'Vrischikam', nakshatra: 'Magha' }, status: 'Completed', token: 'ONL-9004', rated: true },
      { id: 'BK-9005', customerId: 'cust-1', astrologerId: 'ast-5', slotId: 'slot-109', mode: 'Online Chat', date: tomorrow, time: '15:30', durationMin: 20, amount: 350, topic: 'Sankhya Shastram Business Name', birthDetails: { name: 'Arjun Nair', dob: '1996-05-14', tob: '06:45', pob: 'Ernakulam', rasi: 'Mesham (Aries)', lagna: 'Vrishabham', nakshatra: 'Bharani' }, status: 'Confirmed', token: 'ONL-9005', rated: false },
      { id: 'BK-9006', customerId: 'cust-2', astrologerId: 'ast-1', slotId: 'slot-102', mode: 'Online Chat', date: today, time: '08:00', durationMin: 20, amount: 300, topic: 'Gochara Dosham Pariharam', birthDetails: { name: 'Meera Menon', dob: '1998-09-22', tob: '14:20', pob: 'Thrissur', rasi: 'Kanni (Virgo)', lagna: 'Dhanu', nakshatra: 'Hasta' }, status: 'Completed', token: 'ONL-9006', rated: true },
      { id: 'BK-9007', customerId: 'cust-3', astrologerId: 'ast-2', slotId: 'slot-106', mode: 'Offline Chamber', date: tomorrow, time: '17:00', durationMin: 30, amount: 450, topic: 'Marriage Muhurtham Selection', birthDetails: { name: 'Rahul Krishnan', dob: '1993-11-08', tob: '08:10', pob: 'Kozhikode', rasi: 'Simham (Leo)', lagna: 'Vrischikam', nakshatra: 'Magha' }, status: 'Confirmed', token: 'CHM-7781', rated: false },
      { id: 'BK-9008', customerId: 'cust-1', astrologerId: 'ast-3', slotId: 'slot-108', mode: 'Offline Chamber', date: tomorrow, time: '10:00', durationMin: 40, amount: 700, topic: 'Tambula Prasnam Session', birthDetails: { name: 'Arjun Nair', dob: '1996-05-14', tob: '06:45', pob: 'Ernakulam', rasi: 'Mesham (Aries)', lagna: 'Vrishabham', nakshatra: 'Bharani' }, status: 'Confirmed', token: 'CHM-8820', rated: false },
      { id: 'BK-9009', customerId: 'cust-2', astrologerId: 'ast-4', slotId: 'slot-101', mode: 'Online Chat', date: today, time: '07:30', durationMin: 15, amount: 200, topic: 'Numerology Lucky Dates', birthDetails: { name: 'Meera Menon', dob: '1998-09-22', tob: '14:20', pob: 'Thrissur', rasi: 'Kanni (Virgo)', lagna: 'Dhanu', nakshatra: 'Hasta' }, status: 'Completed', token: 'ONL-9009', rated: true },
      { id: 'BK-9010', customerId: 'cust-3', astrologerId: 'ast-5', slotId: 'slot-109', mode: 'Online Chat', date: today, time: '12:30', durationMin: 20, amount: 350, topic: 'Rahu-Ketu Transit Query', birthDetails: { name: 'Rahul Krishnan', dob: '1993-11-08', tob: '08:10', pob: 'Kozhikode', rasi: 'Simham (Leo)', lagna: 'Vrischikam', nakshatra: 'Magha' }, status: 'Cancelled', token: 'ONL-9010', rated: false },
      { id: 'BK-9011', customerId: 'cust-1', astrologerId: 'ast-2', slotId: 'slot-105', mode: 'Online Chat', date: today, time: '09:00', durationMin: 15, amount: 250, topic: 'Shani Sade Sati Remedy', birthDetails: { name: 'Arjun Nair', dob: '1996-05-14', tob: '06:45', pob: 'Ernakulam', rasi: 'Mesham (Aries)', lagna: 'Vrishabham', nakshatra: 'Bharani' }, status: 'Completed', token: 'ONL-9011', rated: true },
      { id: 'BK-9012', customerId: 'cust-2', astrologerId: 'ast-3', slotId: 'slot-107', mode: 'Online Chat', date: today, time: '13:15', durationMin: 20, amount: 400, topic: 'House Warming Muhurtham', birthDetails: { name: 'Meera Menon', dob: '1998-09-22', tob: '14:20', pob: 'Thrissur', rasi: 'Kanni (Virgo)', lagna: 'Dhanu', nakshatra: 'Hasta' }, status: 'Completed', token: 'ONL-9012', rated: true }
    ],

    // Double-entry derived ledger: wallet balances are always computed from these entries
    ledger: [
      { id: 'TX-1001', type: 'RECHARGE', customerId: 'cust-1', astrologerId: null, gross: 1850, astroShare: 0, adminShare: 0, status: 'Settled', ref: 'UPI-PG-884120', ts: '2026-11-25 08:10' },
      { id: 'TX-1002', type: 'CONSULTATION', customerId: 'cust-1', astrologerId: 'ast-1', gross: 300, astroShare: 210, adminShare: 90, status: 'Settled', ref: 'ORD-BK-9001', ts: '2026-11-25 09:15' },
      { id: 'TX-1003', type: 'CONSULTATION', customerId: 'cust-1', astrologerId: 'ast-1', gross: 500, astroShare: 350, adminShare: 150, status: 'Settled', ref: 'ORD-BK-9002', ts: '2026-11-25 09:30' },
      { id: 'TX-1004', type: 'CONSULTATION', customerId: 'cust-1', astrologerId: 'ast-5', gross: 350, astroShare: 245, adminShare: 105, status: 'Settled', ref: 'ORD-BK-9005', ts: '2026-11-25 10:05' },
      { id: 'TX-1005', type: 'CONSULTATION', customerId: 'cust-1', astrologerId: 'ast-2', gross: 200, astroShare: 140, adminShare: 60, status: 'Settled', ref: 'ORD-BK-9011', ts: '2026-11-25 10:40' },
      { id: 'TX-1006', type: 'CONSULTATION', customerId: 'cust-2', astrologerId: 'ast-3', gross: 400, astroShare: 280, adminShare: 120, status: 'Settled', ref: 'ORD-BK-9012', ts: '2026-11-25 11:20' }
    ],

    withdrawals: [
      { id: 'WD-401', astrologerId: 'ast-1', amount: 300, status: 'Pending', bankMasked: 'XXXX XXXX 4821 (SBIN0000940)', ref: 'REQ-401', reason: '', ts: '2026-11-25 11:45' },
      { id: 'WD-402', astrologerId: 'ast-3', amount: 200, status: 'Approved', bankMasked: 'XXXX XXXX 9104 (HDFC0000063)', ref: 'IMPS-6629104', reason: '', ts: '2026-11-24 18:10' }
    ],

    upiClaims: [
      { id: 'CLM-201', claimedBy: 'Acharya Hariharan Pillai (Commission Remittance)', amount: 120, utr: '632910482910', status: 'Pending', ts: '2026-11-25 11:50' }
    ],

    disputes: [
      { id: 'DSP-101', bookingId: 'BK-9010', customerName: 'Rahul Krishnan', astrologerName: 'Smt. Devika Warrier', amount: 350, reason: 'Slot cancelled 4 hours prior due to travel', status: 'Pending' }
    ],

    activeChat: {
      astrologerId: 'ast-1',
      customerId: 'cust-1',
      mode: 'Online Slot',
      secondsRemaining: 90, // 1m 30s so user can quickly experience low-time warning & timeout top-up modal
      totalSlotSeconds: 120,
      isExpired: false,
      ratePerMin: 25,
      messages: [
        { id: 'm1', sender: 'system', text: 'Encrypted Chat Session started. Phone numbers, UPI IDs & emails are automatically masked for DPDP safety.', ts: '10:30' },
        { id: 'm2', sender: 'astrologer', text: 'നമസ്കാരം അർജുൻ! ഞാൻ നിങ്ങളുടെ ജാതകം പരിശോധിച്ചു. ഭരണി നക്ഷത്രം, മേടം രാശി. കരിയർ സംബന്ധമായ ചോദ്യമാണോ?', ts: '10:30' },
        { id: 'm3', sender: 'customer', text: 'Namaskaram Acharya! Yes, I received an offer from Kochi and another from Bengaluru. Which period is auspicious?', ts: '10:31' }
      ]
    },

    auditLog: [
      { id: 'AUD-1', actor: 'System Seed', action: 'Initialized Kerala 3-Portal State & 70/30 Derived Ledger', before: 'null', after: 'Active', ts: '2026-11-25 08:00' },
      { id: 'AUD-2', actor: 'Admin (SuperUser)', action: 'Verified Bank Penny-Drop for Acharya Sankaran Namboothiri', before: 'Pending', after: 'Verified (XXXX 4821)', ts: '2026-11-25 08:45' }
    ]
  };
}

let state = loadState();
let deferredInstallPrompt = null;
let chatTimerInterval = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedState();
    const parsed = JSON.parse(raw);
    return { ...createSeedState(), ...parsed };
  } catch (e) {
    return createSeedState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    const syncEl = document.getElementById('sync-indicator');
    if (syncEl) {
      syncEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400"></span><span>Synced ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>`;
    }
  } catch (e) {
    toast('Storage quota warning — running in memory mode.', 'warning');
  }
}

// ── 3. SECURITY, SANITIZATION & DERIVED LEDGER HELPERS ──────────────────────
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function redactChatPII(text) {
  // Mask Indian phone numbers, emails, and UPI handles in chat for anti-disintermediation & privacy
  return text
    .replace(/(\+91[\s-]?)?[6-9]\d{9}/g, '[PHONE REDACTED]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]')
    .replace(/[a-zA-Z0-9._-]+@(okaxis|oksbi|okhdfcbank|okicici|ybl|paytm|upi)/gi, '[UPI REDACTED]');
}

function checkRateLimit(actionKey, cooldownMs = 1500) {
  const now = Date.now();
  const last = state.lastActionTimestamps[actionKey] || 0;
  if (now - last < cooldownMs) {
    toast('Rate limit guard: Please wait a moment before retrying.', 'warning');
    return false;
  }
  state.lastActionTimestamps[actionKey] = now;
  return true;
}

function recordAudit(actor, action, beforeVal, afterVal) {
  state.auditLog.unshift({
    id: 'AUD-' + (state.auditLog.length + 1),
    actor,
    action,
    before: String(beforeVal),
    after: String(afterVal),
    ts: new Date().toLocaleString('en-IN', { hour12: false })
  });
}

// Derived balances from immutable double-entry ledger
function getCustomerWalletBalance(customerId) {
  return state.ledger.reduce((sum, tx) => {
    if (tx.customerId !== customerId) return sum;
    if (tx.type === 'RECHARGE' || tx.type === 'REFUND') return sum + tx.gross;
    if (tx.type === 'CONSULTATION' || tx.type === 'TOPUP') return sum - tx.gross;
    return sum;
  }, 0);
}

function getAstrologerFinancials(astrologerId) {
  let totalGross = 0;
  let totalEarned70 = 0;
  let platformFee30 = 0;

  state.ledger.forEach((tx) => {
    if (tx.astrologerId !== astrologerId) return;
    if (tx.type === 'CONSULTATION' || tx.type === 'TOPUP') {
      totalGross += tx.gross;
      totalEarned70 += tx.astroShare;
      platformFee30 += tx.adminShare;
    } else if (tx.type === 'REFUND') {
      totalGross -= tx.gross;
      totalEarned70 -= tx.astroShare;
      platformFee30 -= tx.adminShare;
    }
  });

  const withdrawnOrPending = state.withdrawals
    .filter((w) => w.astrologerId === astrologerId && (w.status === 'Approved' || w.status === 'Pending'))
    .reduce((sum, w) => sum + w.amount, 0);

  const pendingWithdrawals = state.withdrawals
    .filter((w) => w.astrologerId === astrologerId && w.status === 'Pending')
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    totalGross,
    totalEarned70,
    platformFee30,
    pendingWithdrawals,
    availableBalance: Math.max(0, totalEarned70 - withdrawnOrPending)
  };
}

function getPlatformTotals() {
  return state.ledger.reduce(
    (acc, tx) => {
      if (tx.type === 'CONSULTATION' || tx.type === 'TOPUP') {
        acc.gross += tx.gross;
        acc.astro70 += tx.astroShare;
        acc.admin30 += tx.adminShare;
      } else if (tx.type === 'REFUND') {
        acc.gross -= tx.gross;
        acc.astro70 -= tx.astroShare;
        acc.admin30 -= tx.adminShare;
      }
      return acc;
    },
    { gross: 0, astro70: 0, admin30: 0 }
  );
}

function t(key) {
  return (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
}

function bi(key) {
  if (state.lang === 'ml') {
    return `${I18N.ml[key]} (${I18N.en[key]})`;
  }
  return `${I18N.en[key]} • ${I18N.ml[key]}`;
}

// ── 4. TOAST & MODAL SYSTEM (ZERO alert/confirm/prompt) ─────────────────────
function toast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const colors = {
    success: 'bg-emerald-950 border-emerald-500 text-emerald-100',
    warning: 'bg-amber-950 border-amber-500 text-amber-100',
    error: 'bg-rose-950 border-rose-500 text-rose-100',
    info: 'bg-slate-900 border-amber-400/50 text-white'
  };

  const icons = {
    success: 'fa-circle-check text-emerald-400',
    warning: 'fa-triangle-exclamation text-amber-400',
    error: 'fa-circle-xmark text-rose-400',
    info: 'fa-sparkles text-amber-400'
  };

  const el = document.createElement('div');
  el.className = `toast-enter pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start gap-3 text-xs ${colors[type] || colors.info}`;
  el.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-sm mt-0.5"></i>
    <div class="flex-1 leading-relaxed font-medium">${esc(message)}</div>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s';
    setTimeout(() => el.remove(), 260);
  }, 3600);
}

function openModal(htmlContent) {
  const root = document.getElementById('modal-root');
  const card = document.getElementById('modal-card');
  if (!root || !card) return;
  card.innerHTML = htmlContent;
  root.classList.remove('hidden');
}

function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.classList.add('hidden');
}

// ── 5. PWA INSTALLATION & WEB SHARE API ─────────────────────────────────────
function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // Silent fallback if opened directly via file:// instead of http(s)://
      });
    });
  }

  const installBtn = document.getElementById('pwa-install-btn');

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (installBtn) {
      installBtn.classList.remove('hidden');
      installBtn.classList.add('inline-flex');
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
    toast('BookMy Astrologer Kerala installed to your device!', 'success');
  });
}

async function triggerInstallPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      toast('Installing BookMy Astrologer App...', 'success');
    }
    deferredInstallPrompt = null;
    return;
  }

  // Fallback instructions modal for iOS Safari / desktop browsers when prompt isn't triggered
  openModal(`
    <div class="p-6">
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <h3 class="font-display text-lg font-bold text-slate-900">Install BookMy Astrologer App</h3>
        <button type="button" data-action="close-modal" class="text-slate-400 hover:text-slate-700 text-lg"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="mt-4 space-y-3 text-sm text-slate-700">
        <p class="font-medium text-slate-900">Install this app on your phone or computer for full-screen standalone access:</p>
        <div class="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <p class="font-bold text-amber-900"><i class="fa-brands fa-android mr-1.5"></i> Android (Chrome / Edge)</p>
          <p class="text-xs text-amber-800 mt-1">Tap the <strong>⋮ Menu</strong> in the top-right corner and select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200">
          <p class="font-bold text-indigo-900"><i class="fa-brands fa-apple mr-1.5"></i> iPhone / iPad (Safari)</p>
          <p class="text-xs text-indigo-800 mt-1">Tap the <strong>Share icon <i class="fa-solid fa-arrow-up-from-bracket"></i></strong> at the bottom bar, scroll down, and tap <strong>"Add to Home Screen"</strong>.</p>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-100 border border-slate-200">
          <p class="font-bold text-slate-900"><i class="fa-solid fa-desktop mr-1.5"></i> Desktop (Chrome / Edge)</p>
          <p class="text-xs text-slate-600 mt-1">Click the <strong>Install icon</strong> in the right side of the address bar.</p>
        </div>
      </div>
      <div class="mt-5 flex justify-end">
        <button type="button" data-action="close-modal" class="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold">Got It</button>
      </div>
    </div>
  `);
}

async function triggerShareApp() {
  const shareUrl = window.location.href;
  const shareData = {
    title: 'BookMy Astrologer Kerala — ജ്യോതിഷ കൺസൾട്ടേഷൻ',
    text: 'Consult verified Kerala Jyothishis via Live Chat or book an Offline Chamber visit across all 14 districts!',
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      toast('App link shared!', 'success');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareUrl);
    toast('App link copied to clipboard — ready to paste & share!', 'success');
  } catch (e) {
    toast('Share URL: ' + shareUrl, 'info');
  }
}

// ── 6. LIVE CHAT COUNTDOWN TIMER & AUTO-TIMEOUT MODAL ───────────────────────
function startChatTimerLoop() {
  if (chatTimerInterval) clearInterval(chatTimerInterval);
  chatTimerInterval = setInterval(() => {
    const chat = state.activeChat;
    if (!chat || chat.isExpired) return;
    const isViewingChat =
      (state.activePortal === 'customer' && state.customerSubView === 'chat') ||
      (state.activePortal === 'astrologer' && state.astrologerSubView === 'console');

    if (!isViewingChat) return;

    if (chat.secondsRemaining > 0) {
      chat.secondsRemaining -= 1;
      const timerBadges = document.querySelectorAll('[data-chat-timer]');
      timerBadges.forEach((el) => {
        el.textContent = formatSeconds(chat.secondsRemaining);
        if (chat.secondsRemaining <= 30) {
          el.classList.add('text-rose-400', 'animate-pulse');
        }
      });
      if (chat.secondsRemaining === 30) {
        toast('Session time warning: 30 seconds remaining!', 'warning');
      }
    } else {
      chat.isExpired = true;
      saveState();
      render();
      showSessionTimeoutModal();
    }
  }, 1000);
}

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function showSessionTimeoutModal() {
  const chat = state.activeChat;
  const astro = state.astrologers.find((a) => a.id === chat.astrologerId) || state.astrologers[0];
  const custBal = getCustomerWalletBalance(state.activeCustomerId);
  const extPrice = Math.max(MIN_TOPUP_AMOUNT, astro.ratePerMin * 5); // 5-minute block, min ₹50
  const astro70 = Math.round(extPrice * 0.7);
  const admin30 = extPrice - astro70;

  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div class="w-11 h-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
          <i class="fa-solid fa-hourglass-end"></i>
        </div>
        <div>
          <h3 class="font-display text-lg font-bold text-slate-900">Session Time Completed • സമയം പൂർത്തിയായി</h3>
          <p class="text-xs text-slate-500">Your reserved chat slot with ${esc(astro.name)} has ended.</p>
        </div>
      </div>

      <div class="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-600">Your Wallet Balance (${t('wallet')}):</span>
          <span class="font-bold text-emerald-700">₹${custBal}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-600">5-Minute Extension Block (Min ₹${MIN_TOPUP_AMOUNT}):</span>
          <span class="font-bold text-slate-900">₹${extPrice}</span>
        </div>
        <div class="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
          <span>Transparent Split Preview:</span>
          <span>₹${astro70} Astrologer (70%) / ₹${admin30} Platform (30%)</span>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button type="button" data-action="end-chat-session"
          class="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs">
          End Session • സെഷൻ അവസാനിപ്പിക്കുക
        </button>
        <button type="button" data-action="extend-chat-session" data-amount="${extPrice}"
          class="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-saffron text-slate-950 font-bold text-xs shadow hover:brightness-105">
          Top-up ₹${extPrice} to Continue (+5m)<br/>
          <span class="text-[10px] font-semibold">തുടരാൻ റീചാർജ് ചെയ്യുക</span>
        </button>
      </div>
    </div>
  `);
}

// ── 7. KUNDALI GENERATOR HELPER ─────────────────────────────────────────────
function computeMiniKundali(dob, tob, pob) {
  const rasis = ['Mesham (Aries)', 'Vrishabham (Taurus)', 'Mithunam (Gemini)', 'Karkidakam (Cancer)', 'Simham (Leo)', 'Kanni (Virgo)', 'Thulam (Libra)', 'Vrischikam (Scorpio)', 'Dhanu (Sagittarius)', 'Makaram (Capricorn)', 'Kumbham (Aquarius)', 'Meenam (Pisces)'];
  const nakshatras = ['Ashwini', 'Bharani', 'Karthika', 'Rohini', 'Makayiram', 'Thiruvathira', 'Punartham', 'Pooyam', 'Ayilyam', 'Magha', 'Pooram', 'Uthram', 'Hasta', 'Chithira', 'Chothi', 'Vishakham', 'Anizham', 'Thrikketta', 'Moolam', 'Pooradam', 'Uthradam', 'Thiruvonam', 'Avittam', 'Chathayam', 'Poororuttathi', 'Uthrattathi', 'Revathi'];

  const seed = (dob + tob + pob).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const rasi = rasis[seed % rasis.length];
  const lagna = rasis[(seed + 4) % rasis.length];
  const nakshatra = nakshatras[seed % nakshatras.length];
  const dosham = seed % 3 === 0 ? 'Mild Kuja Dosham (Pariharam advised)' : 'No Major Dosham Detected';

  return { rasi, lagna, nakshatra, dosham };
}

// ── 8. MAIN RENDER ROUTER ───────────────────────────────────────────────────
function render() {
  saveState();
  updateHeaderChrome();

  const root = document.getElementById('app-root');
  if (!root) return;

  if (state.activePortal === 'customer') {
    root.innerHTML = renderCustomerPortal();
  } else if (state.activePortal === 'astrologer') {
    root.innerHTML = renderAstrologerPortal();
  } else {
    root.innerHTML = renderAdminPortal();
  }
}

function updateHeaderChrome() {
  const domainMap = {
    customer: 'https://bookmyastrologer.kerala',
    astrologer: 'https://partner.bookmyastrologer.kerala',
    admin: 'https://admin.bookmyastrologer.kerala'
  };
  const domainEl = document.getElementById('active-domain-label');
  if (domainEl) domainEl.textContent = domainMap[state.activePortal];

  ['customer', 'astrologer', 'admin'].forEach((p) => {
    const btn = document.getElementById(`portal-btn-${p}`);
    if (!btn) return;
    if (state.activePortal === p) {
      btn.className = 'portal-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-saffron text-slate-950 shadow';
    } else {
      btn.className = 'portal-tab px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 text-slate-300 hover:text-white';
    }
  });

  const custBal = getCustomerWalletBalance(state.activeCustomerId);
  const walletAmtEl = document.getElementById('header-wallet-amount');
  if (walletAmtEl) walletAmtEl.textContent = `₹${custBal}`;

  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) langBtn.textContent = state.lang === 'en' ? 'EN | മലയാളം' : 'മലയാളം | EN';

  const dpdpBanner = document.getElementById('dpdp-banner');
  if (dpdpBanner) {
    dpdpBanner.classList.toggle('hidden', state.dpdpAccepted);
  }
}

// ── 9. PORTAL 1: CUSTOMER APP ───────────────────────────────────────────────
function renderCustomerPortal() {
  const subNav = `
    <div class="bg-white border-b border-amber-200/70 sticky top-[61px] z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5 text-xs font-bold">
        <button type="button" data-action="set-customer-view" data-view="discover"
          class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.customerSubView === 'discover' ? 'bg-midnight text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50'}">
          <i class="fa-solid fa-om mr-1.5 text-saffron"></i>${bi('astrologer')}
        </button>
        <button type="button" data-action="set-customer-view" data-view="booking"
          class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.customerSubView === 'booking' ? 'bg-midnight text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50'}">
          <i class="fa-solid fa-calendar-check mr-1.5 text-saffron"></i>${bi('bookSlot')}
        </button>
        <button type="button" data-action="set-customer-view" data-view="chat"
          class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.customerSubView === 'chat' ? 'bg-midnight text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50'}">
          <i class="fa-solid fa-comments mr-1.5 text-emerald-500"></i>${bi('liveChat')}
        </button>
        <button type="button" data-action="set-customer-view" data-view="bookings"
          class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.customerSubView === 'bookings' ? 'bg-midnight text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50'}">
          <i class="fa-solid fa-receipt mr-1.5 text-saffron"></i>My Bookings (${state.bookings.filter((b) => b.customerId === state.activeCustomerId).length})
        </button>
        <button type="button" data-action="set-customer-view" data-view="wallet"
          class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.customerSubView === 'wallet' ? 'bg-midnight text-amber-300 shadow' : 'text-slate-600 hover:bg-amber-50'}">
          <i class="fa-solid fa-wallet mr-1.5 text-emerald-600"></i>${bi('wallet')} (₹${getCustomerWalletBalance(state.activeCustomerId)})
        </button>
      </div>
    </div>
  `;

  let body = '';
  if (state.customerSubView === 'discover') body = renderCustomerDiscover();
  else if (state.customerSubView === 'booking') body = renderCustomerSlotBooking();
  else if (state.customerSubView === 'chat') body = renderCustomerChatRoom();
  else if (state.customerSubView === 'bookings') body = renderCustomerMyBookings();
  else if (state.customerSubView === 'wallet') body = renderCustomerWallet();

  return subNav + body;
}

function renderCustomerDiscover() {
  const f = state.filters;
  const filtered = state.astrologers.filter((a) => {
    if (a.kycStatus !== 'Verified') return false;
    if (f.onlineOnly && !a.online) return false;
    if (f.offlineOnly && !a.chamber.visible) return false;
    if (f.district !== 'All' && a.district !== f.district) return false;
    if (f.language !== 'All' && !a.languages.includes(f.language)) return false;
    if (f.speciality !== 'All' && !a.specialities.includes(f.speciality)) return false;
    if (f.search.trim()) {
      const q = f.search.toLowerCase();
      const hay = `${a.name} ${a.nameMl} ${a.district} ${a.specialities.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const specialities = ['All', 'Vedic/Jyothisha', 'Prasnam', 'Kundali Matching (Porutham)', 'Numerology (Sankhya Shastram)', 'Vastu', 'Muhurtham'];

  return `
    <!-- KERALA HERO BANNER -->
    <section class="kerala-hero-bg text-white py-10 px-4 sm:px-6 border-b kasavu-border">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        <div class="lg:col-span-2 space-y-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold">
            <i class="fa-solid fa-comments"></i>
            <span>Chat-Only Live Consultations &amp; Offline Kerala Chambers</span>
          </div>
          <h2 class="font-display text-2xl sm:text-4xl font-bold text-amber-200 leading-tight">
            ${esc(t('heroTitle'))}
          </h2>
          <p class="text-slate-300 text-sm sm:text-base max-w-2xl">
            ${esc(t('heroSub'))}
          </p>
          <div class="flex flex-wrap gap-3 pt-1">
            <button type="button" data-action="set-customer-view" data-view="chat"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-saffron text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:brightness-105 transition">
              <i class="fa-solid fa-comments mr-1.5"></i> Start ${bi('liveChat')}
            </button>
            <button type="button" data-action="set-customer-view" data-view="booking"
              class="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-amber-200 border border-amber-400/40 font-bold text-xs sm:text-sm transition">
              <i class="fa-solid fa-building-columns mr-1.5"></i> ${bi('offlineVisit')}
            </button>
          </div>
        </div>

        <!-- LIVE KERALA PANCHANGAM CARD -->
        <div class="bg-slate-900/80 backdrop-blur border kasavu-border rounded-2xl p-5 text-xs space-y-2.5">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="font-display font-bold text-amber-300 text-sm">Kollam Era Panchangam</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">1202 Vrischikam</span>
          </div>
          <div class="flex justify-between"><span class="text-slate-400">${bi('nakshatra')}:</span><span class="font-semibold text-white">Thiruvonam (തിരുവോണം)</span></div>
          <div class="flex justify-between"><span class="text-slate-400">${bi('rasi')}:</span><span class="font-semibold text-white">Makaram (മകരം)</span></div>
          <div class="flex justify-between"><span class="text-slate-400">${bi('muhurtham')}:</span><span class="font-semibold text-amber-300">09:15 AM – 10:45 AM</span></div>
          <div class="flex justify-between"><span class="text-slate-400">Rahu Kalam:</span><span class="font-semibold text-rose-300">12:00 PM – 01:30 PM</span></div>
        </div>
      </div>
    </section>

    <!-- FILTER BAR -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div class="bg-white rounded-2xl p-4 kasavu-card space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="lg:col-span-2 relative">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400 text-xs"></i>
            <input type="text" id="filter-search-input" value="${esc(f.search)}" placeholder="Search Jyothishi, district, Prasnam, Porutham..."
              class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <select id="filter-district-select" aria-label="Filter by District"
            class="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="All">All 14 Kerala Districts</option>
            ${KERALA_DISTRICTS.map((d) => `<option value="${esc(d)}" ${f.district === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
          </select>
          <select id="filter-lang-select" aria-label="Filter by Language"
            class="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="All">All Languages</option>
            ${['Malayalam', 'English', 'Sanskrit', 'Tamil', 'Hindi'].map((l) => `<option value="${esc(l)}" ${f.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}
          </select>
          <div class="flex items-center gap-2">
            <button type="button" data-action="toggle-filter-online"
              class="flex-1 px-2.5 py-2 rounded-xl text-[11px] font-bold border transition ${f.onlineOnly ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-700 border-slate-200'}">
              ● Online Only
            </button>
            <button type="button" data-action="toggle-filter-offline"
              class="flex-1 px-2.5 py-2 rounded-xl text-[11px] font-bold border transition ${f.offlineOnly ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700 border-slate-200'}">
              Chamber
            </button>
          </div>
        </div>

        <!-- Speciality Chips -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1">
          ${specialities.map((sp) => `
            <button type="button" data-action="set-filter-speciality" data-speciality="${esc(sp)}"
              class="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${f.speciality === sp ? 'bg-midnight text-amber-300' : 'bg-amber-50 text-slate-700 hover:bg-amber-100'}">
              ${esc(sp)}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- ASTROLOGER CARDS GRID -->
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${filtered.length === 0 ? `
          <div class="col-span-full bg-white rounded-2xl p-10 text-center kasavu-card">
            <p class="font-display text-lg font-bold text-slate-800">No verified Jyothishis match your filter</p>
            <button type="button" data-action="clear-filters" class="mt-3 px-4 py-2 rounded-xl bg-midnight text-amber-300 text-xs font-bold">Reset Filters</button>
          </div>
        ` : filtered.map((a) => renderAstrologerCard(a)).join('')}
      </div>
    </section>
  `;
}

function renderAstrologerCard(a) {
  const slotCount = state.slots.filter((s) => s.astrologerId === a.id && s.bookedCount < s.maxBookings).length;
  return `
    <article class="bg-white rounded-2xl p-5 kasavu-card flex flex-col justify-between transition hover:-translate-y-0.5">
      <div>
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-midnight to-indigo-900 text-amber-300 font-display font-bold text-lg flex items-center justify-center border border-amber-400/40 flex-shrink-0">
              ${esc(a.name.split(' ').slice(0, 2).map((w) => w[0]).join(''))}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h3 class="font-bold text-sm text-slate-900 leading-snug">${esc(a.name)}</h3>
                <i class="fa-solid fa-circle-check text-emerald-600 text-xs" title="KYC Verified"></i>
              </div>
              <p class="text-xs text-slate-600 font-medium">${esc(a.nameMl)}</p>
              <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                <span><i class="fa-solid fa-star text-amber-500"></i> ${a.rating} (${a.reviewsCount})</span>
                <span>• ${a.experience} yrs</span>
              </div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${a.online ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}">
            <span class="w-2 h-2 rounded-full ${a.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}"></span>
            ${a.online ? 'Online' : 'Offline'}
          </span>
        </div>

        <p class="mt-3 text-xs text-slate-600 leading-relaxed">${esc(state.lang === 'ml' ? a.bioMl : a.bioEn)}</p>

        <div class="mt-3 flex flex-wrap gap-1.5">
          ${a.specialities.map((s) => `<span class="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/70 text-[11px] font-semibold">${esc(s)}</span>`).join('')}
        </div>

        <div class="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
          <div class="flex items-center justify-between">
            <span><i class="fa-solid fa-language text-slate-400 mr-1"></i> ${esc(a.languages.join(', '))}</span>
            <span class="font-bold text-slate-900">₹${a.ratePerMin}/min <span class="text-[10px] font-normal text-slate-500">(Chat)</span></span>
          </div>
          ${a.chamber.visible ? `
            <div class="flex items-center justify-between text-[11px] text-indigo-900 bg-indigo-50/70 px-2.5 py-1.5 rounded-lg">
              <span><i class="fa-solid fa-location-dot text-saffron mr-1"></i> Chamber in <strong>${esc(a.chamber.district)}</strong></span>
              <span>${slotCount} open slots</span>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        <button type="button" data-action="start-live-chat" data-astrologer-id="${esc(a.id)}"
          class="px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${a.online ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}">
          <i class="fa-solid fa-comments"></i>
          <span>${t('liveChat')}</span>
        </button>
        <button type="button" data-action="open-booking-for" data-astrologer-id="${esc(a.id)}"
          class="px-3 py-2 rounded-xl bg-midnight hover:bg-indigo-950 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition">
          <i class="fa-solid fa-calendar-plus"></i>
          <span>${t('bookSlot')}</span>
        </button>
      </div>
    </article>
  `;
}

function renderCustomerSlotBooking() {
  const verifiedAstros = state.astrologers.filter((a) => a.kycStatus === 'Verified');
  const astro = verifiedAstros.find((a) => a.id === state.selectedAstrologerId) || verifiedAstros[0];
  const astroSlots = state.slots.filter((s) => s.astrologerId === astro.id);
  const custBal = getCustomerWalletBalance(state.activeCustomerId);

  return `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left 2 Columns: Slot & Kundali Form -->
        <div class="lg:col-span-2 space-y-5">
          <div class="bg-white rounded-2xl p-6 kasavu-card">
            <h2 class="font-display text-xl font-bold text-slate-900">${bi('bookSlot')}</h2>
            <p class="text-xs text-slate-500 mt-1">Select an Online Chat slot or an Offline In-Person Chamber slot manually published by the Jyothishi.</p>

            <!-- Astrologer Selector -->
            <div class="mt-4">
              <label class="block text-xs font-bold text-slate-700 mb-1.5">1. Choose Verified ${bi('astrologer')}</label>
              <select id="booking-astro-select" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white">
                ${verifiedAstros.map((a) => `<option value="${esc(a.id)}" ${a.id === astro.id ? 'selected' : ''}>${esc(a.name)} — ${esc(a.district)} (₹${a.ratePerMin}/min)</option>`).join('')}
              </select>
            </div>

            <!-- Chamber Address Banner if visible -->
            ${astro.chamber.visible ? `
              <div class="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <p class="font-bold text-amber-950"><i class="fa-solid fa-building-columns text-saffron mr-1.5"></i>Offline Chamber Address (${esc(astro.chamber.district)}):</p>
                  <p class="text-slate-700 mt-0.5">${esc(astro.chamber.address)}, ${esc(astro.chamber.landmark)} — ${esc(astro.chamber.pincode)}</p>
                </div>
                <a href="${esc(astro.chamber.mapsUrl)}" target="_blank" rel="noopener noreferrer"
                  class="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100">
                  <i class="fa-solid fa-map-location-dot mr-1"></i> Google Maps
                </a>
              </div>
            ` : ''}

            <!-- Available Manual Slots -->
            <div class="mt-5">
              <label class="block text-xs font-bold text-slate-700 mb-2">2. Pick an Available Time Slot (Online Chat or Offline Chamber)</label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="booking-slots-grid">
                ${astroSlots.length === 0 ? `<p class="text-xs text-slate-500">No slots published yet by this Jyothishi.</p>` : astroSlots.map((s) => {
                  const full = s.bookedCount >= s.maxBookings;
                  const isOffline = s.mode === 'Offline Chamber';
                  return `
                    <label class="relative flex items-start gap-3 p-3.5 rounded-xl border transition ${full ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-amber-500 cursor-pointer'}">
                      <input type="radio" name="selectedSlotId" value="${esc(s.id)}" data-price="${s.price}" data-mode="${esc(s.mode)}" ${full ? 'disabled' : ''} class="mt-1 accent-amber-600" />
                      <div class="flex-1 text-xs">
                        <div class="flex items-center justify-between">
                          <span class="font-bold text-slate-900">${esc(s.date)} • ${esc(s.startTime)}</span>
                          <span class="font-bold text-emerald-700">₹${s.price}</span>
                        </div>
                        <div class="mt-1 flex items-center gap-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold ${isOffline ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                            ${isOffline ? t('offlineVisit') : t('onlineBooking')}
                          </span>
                          <span class="text-slate-500">${s.durationMin} mins</span>
                        </div>
                        <p class="mt-1 text-[11px] text-slate-500">${full ? 'Slot Full (Booked)' : `${s.maxBookings - s.bookedCount} of ${s.maxBookings} seats open`}</p>
                      </div>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Janma Kundali Birth Details -->
            <div class="mt-6 pt-5 border-t border-slate-200">
              <h3 class="font-bold text-sm text-slate-900 mb-3">3. ${bi('kundali')} &amp; ${bi('topic')}</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Full Name</label>
                  <input type="text" id="bk-name" value="Arjun Nair" class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">${bi('topic')}</label>
                  <select id="bk-topic" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
                    <option>Career &amp; Job Change</option>
                    <option>Marriage &amp; Porutham Matching</option>
                    <option>Ashtamangala / Tambula Prasnam</option>
                    <option>Home Vastu &amp; Muhurtham</option>
                    <option>Graha Dosham &amp; Pariharam</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input type="date" id="bk-dob" value="1996-05-14" class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Time of Birth</label>
                  <input type="time" id="bk-tob" value="06:45" class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block font-semibold text-slate-700 mb-1">Place of Birth (District / Town)</label>
                  <input type="text" id="bk-pob" value="Ernakulam, Kerala" class="w-full px-3 py-2 rounded-xl border border-slate-300" />
                </div>
              </div>
              <button type="button" data-action="preview-kundali" class="mt-3 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs">
                <i class="fa-solid fa-dharmachakra mr-1.5"></i> Auto-Calculate Mini Kundali (Rasi / Lagna / Nakshatra)
              </button>
              <div id="kundali-preview-box" class="mt-3 hidden p-3.5 rounded-xl bg-slate-900 text-amber-100 text-xs space-y-1"></div>
            </div>
          </div>
        </div>

        <!-- Right Sticky Summary with 70/30 Split Preview -->
        <div>
          <div class="bg-white rounded-2xl p-6 kasavu-card sticky top-32 space-y-4">
            <h3 class="font-display text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Booking &amp; Split Summary</h3>
            <div class="text-xs space-y-2">
              <div class="flex justify-between"><span class="text-slate-500">Jyothishi:</span><span class="font-bold text-slate-900 text-right">${esc(astro.name)}</span></div>
              <div class="flex justify-between"><span class="text-slate-500">Your Wallet Balance:</span><span class="font-bold text-emerald-700">₹${custBal}</span></div>
              <div id="split-preview-panel" class="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                <p class="font-bold text-amber-950">Transparent 70 / 30 Revenue Split</p>
                <p class="text-[11px] text-amber-900">Select a slot on the left to preview exact Astrologer (70%) &amp; Platform (30%) allocation.</p>
              </div>
            </div>
            <label class="flex items-start gap-2 text-[11px] text-slate-600">
              <input type="checkbox" id="bk-dpdp-consent" checked class="mt-0.5 accent-amber-600" />
              <span>I consent under DPDP Act 2023 to share my birth chart with this verified Jyothishi.</span>
            </label>
            <button type="button" data-action="confirm-slot-booking"
              class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-saffron text-slate-950 font-bold text-xs shadow-lg hover:brightness-105 transition">
              Pay from Wallet &amp; Confirm Slot
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCustomerChatRoom() {
  const chat = state.activeChat;
  const astro = state.astrologers.find((a) => a.id === chat.astrologerId) || state.astrologers[0];
  const custBal = getCustomerWalletBalance(state.activeCustomerId);

  return `
    <section class="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
      <div class="bg-white rounded-2xl kasavu-card overflow-hidden flex flex-col h-[74vh]">
        <!-- Chat Top Bar -->
        <div class="bg-midnight text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b kasavu-border">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-display font-bold flex items-center justify-center">
              ${esc(astro.name[0])}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold text-sm text-amber-200">${esc(astro.name)}</h2>
                <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Chat Only • Encrypted</span>
              </div>
              <p class="text-[11px] text-slate-400">Rate: ₹${astro.ratePerMin}/min • Wallet: ₹${custBal}</p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs font-mono font-bold text-amber-300 flex items-center gap-2">
              <i class="fa-solid fa-clock"></i>
              <span data-chat-timer>${formatSeconds(chat.secondsRemaining)}</span>
            </div>
            <button type="button" data-action="force-timeout-test" class="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold">
              Simulate Timeout
            </button>
            <button type="button" data-action="end-chat-session" class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold">
              End Chat
            </button>
          </div>
        </div>

        <!-- Messages Feed -->
        <div id="chat-messages-scroll" class="flex-1 p-5 overflow-y-auto space-y-3 bg-ivory">
          ${chat.messages.map((m) => {
            if (m.sender === 'system') {
              return `<div class="text-center"><span class="inline-block px-3 py-1 rounded-full bg-slate-200/80 text-slate-700 text-[11px]">${esc(m.text)}</span></div>`;
            }
            const isCust = m.sender === 'customer';
            return `
              <div class="flex ${isCust ? 'justify-end' : 'justify-start'}">
                <div class="max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${isCust ? 'bg-midnight text-white rounded-br-none' : 'bg-white border border-amber-200 text-slate-900 rounded-bl-none'}">
                  <p>${esc(m.text)}</p>
                  <p class="text-[10px] mt-1 ${isCust ? 'text-amber-300/80 text-right' : 'text-slate-400'}">${esc(m.ts)}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Quick Replies + Input -->
        <div class="p-3.5 bg-white border-t border-slate-200 space-y-2">
          <div class="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
            <button type="button" data-action="send-quick-chat" data-text="നമസ്കാരം ആചാര്യ, എന്റെ ജാതകത്തിലെ ദോഷ പരിഹാരം പറഞ്ഞു തരാമോ?"
              class="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 whitespace-nowrap">
              നമസ്കാരം, പരിഹാരം പറഞ്ഞു തരാമോ?
            </button>
            <button type="button" data-action="send-quick-chat" data-text="Please share my Kundali chart summary & auspicious Muhurtham."
              class="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 whitespace-nowrap">
              Share Kundali &amp; Muhurtham
            </button>
            <button type="button" data-action="report-chat-abuse"
              class="px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap ml-auto">
              <i class="fa-solid fa-flag mr-1"></i> Report / Block
            </button>
          </div>
          <form id="customer-chat-form" class="flex gap-2">
            <input type="text" id="customer-chat-input" placeholder="${chat.isExpired ? 'Session timed out — top up to continue...' : 'Type your message (phone/UPI automatically masked)...'}"
              ${chat.isExpired ? 'disabled' : ''}
              class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <button type="submit" ${chat.isExpired ? 'disabled' : ''}
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron text-slate-950 font-bold text-xs disabled:opacity-50">
              Send <i class="fa-solid fa-paper-plane ml-1"></i>
            </button>
          </form>
        </div>
      </div>
    </section>
  `;
}

function renderCustomerMyBookings() {
  const myBookings = state.bookings.filter((b) => b.customerId === state.activeCustomerId);
  return `
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="font-display text-xl font-bold text-slate-900">My Consultations &amp; Chamber Tokens</h2>
        <button type="button" data-action="set-customer-view" data-view="booking" class="px-4 py-2 rounded-xl bg-midnight text-amber-300 text-xs font-bold">
          + New Slot Booking
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${myBookings.map((b) => {
          const astro = state.astrologers.find((a) => a.id === b.astrologerId) || state.astrologers[0];
          const isOffline = b.mode === 'Offline Chamber';
          return `
            <div class="bg-white rounded-2xl p-5 kasavu-card space-y-3 text-xs">
              <div class="flex items-start justify-between">
                <div>
                  <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] ${isOffline ? 'bg-indigo-100 text-indigo-900' : 'bg-emerald-100 text-emerald-900'}">
                    ${esc(b.mode)} • Token ${esc(b.token)}
                  </span>
                  <h3 class="font-bold text-sm text-slate-900 mt-1.5">${esc(astro.name)}</h3>
                  <p class="text-slate-500">${esc(b.date)} at ${esc(b.time)} (${b.durationMin} mins)</p>
                </div>
                <div class="text-right">
                  <span class="font-bold text-sm text-slate-900">₹${b.amount}</span>
                  <p class="text-[11px] font-semibold ${b.status === 'Confirmed' ? 'text-emerald-600' : 'text-slate-500'}">${esc(b.status)}</p>
                </div>
              </div>
              <p class="text-slate-700"><strong>Topic:</strong> ${esc(b.topic)}</p>
              ${isOffline && astro.chamber.visible ? `
                <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px]">
                  <p class="font-bold text-amber-950">Chamber Address:</p>
                  <p class="text-slate-700">${esc(astro.chamber.address)}, ${esc(astro.chamber.district)} (${esc(astro.chamber.pincode)})</p>
                  <a href="${esc(astro.chamber.mapsUrl)}" target="_blank" rel="noopener noreferrer" class="inline-block mt-1 text-indigo-700 font-bold underline">Open in Google Maps →</a>
                </div>
              ` : ''}
              <div class="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                ${!isOffline && b.status === 'Confirmed' ? `
                  <button type="button" data-action="start-live-chat" data-astrologer-id="${esc(astro.id)}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">
                    Enter Chat Room
                  </button>
                ` : ''}
                ${b.status === 'Confirmed' ? `
                  <button type="button" data-action="cancel-booking" data-booking-id="${esc(b.id)}" class="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                    Cancel &amp; Request Refund
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderCustomerWallet() {
  const custBal = getCustomerWalletBalance(state.activeCustomerId);
  const myLedger = state.ledger.filter((tx) => tx.customerId === state.activeCustomerId);
  const packs = [100, 250, 500, 1000];

  return `
    <section class="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <div class="bg-midnight text-white rounded-2xl p-6 kasavu-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs text-amber-300 uppercase tracking-wider font-bold">Derived Double-Entry ${bi('wallet')}</p>
          <p class="font-display text-3xl font-bold text-white mt-1">₹${custBal}</p>
          <p class="text-xs text-slate-400 mt-1">PCI-DSS Hosted Gateway • Idempotency Protected • Instant 70/30 Escrow Split on Consultations</p>
        </div>
        <div class="flex flex-wrap gap-2">
          ${packs.map((amt) => `
            <button type="button" data-action="recharge-wallet" data-amount="${amt}"
              class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-saffron text-slate-950 font-bold text-xs shadow hover:brightness-105">
              + ₹${amt} ${t('recharge')}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 kasavu-card">
        <h3 class="font-display text-base font-bold text-slate-900 mb-4">Customer Wallet &amp; Split Ledger</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500">
                <th class="py-2">Ref ID</th>
                <th class="py-2">Type</th>
                <th class="py-2">Gross</th>
                <th class="py-2">70/30 Split Allocation</th>
                <th class="py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${myLedger.map((tx) => `
                <tr>
                  <td class="py-2.5 font-mono text-slate-700">${esc(tx.ref)}</td>
                  <td class="py-2.5 font-bold">${esc(tx.type)}</td>
                  <td class="py-2.5 font-bold ${tx.type === 'RECHARGE' || tx.type === 'REFUND' ? 'text-emerald-700' : 'text-slate-900'}">
                    ${tx.type === 'RECHARGE' || tx.type === 'REFUND' ? '+' : '-'}₹${tx.gross}
                  </td>
                  <td class="py-2.5 text-slate-600">
                    ${tx.astroShare > 0 ? `₹${tx.astroShare} Astrologer (70%) / ₹${tx.adminShare} Platform (30%)` : 'Wallet Top-Up'}
                  </td>
                  <td class="py-2.5 text-slate-500">${esc(tx.ts)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

// ── 10. PORTAL 2: ASTROLOGER PARTNER PORTAL ─────────────────────────────────
function renderAstrologerPortal() {
  const astro = state.astrologers.find((a) => a.id === state.activeAstrologerId) || state.astrologers[0];
  const fin = getAstrologerFinancials(astro.id);
  const canGoLive = astro.kycStatus === 'Verified';
  const canWithdraw = astro.kycStatus === 'Verified' && astro.bank.status === 'Verified' && astro.bank.pennyDropVerified;

  return `
    <div class="bg-slate-900 text-white border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <label for="partner-astro-switcher" class="text-xs text-slate-400">Logged in as:</label>
          <select id="partner-astro-switcher" class="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300">
            ${state.astrologers.map((a) => `<option value="${esc(a.id)}" ${a.id === astro.id ? 'selected' : ''}>${esc(a.name)} (${esc(a.kycStatus)})</option>`).join('')}
          </select>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-xs text-slate-400">KYC: <strong class="${canGoLive ? 'text-emerald-400' : 'text-amber-400'}">${esc(astro.kycStatus)}</strong></span>
          <button type="button" data-action="toggle-astro-online"
            class="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition ${astro.online ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-200'}">
            <span class="w-2.5 h-2.5 rounded-full ${astro.online ? 'bg-slate-950 animate-ping' : 'bg-slate-400'}"></span>
            <span>${astro.online ? 'LIVE FOR CHAT (ONLINE)' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      <!-- Astrologer Sub-Nav -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto pb-2.5 text-xs font-bold">
        ${[
          ['console', 'Live Chat Console', 'fa-comments'],
          ['slots', 'Manual Slot Builder', 'fa-calendar-plus'],
          ['chamber', 'Office / Chamber Location', 'fa-location-dot'],
          ['earnings', 'Earnings, Bank & Withdraw', 'fa-indian-rupee-sign'],
          ['profile', 'Profile & KYC', 'fa-id-card']
        ].map(([id, label, icon]) => `
          <button type="button" data-action="set-astro-view" data-view="${id}"
            class="px-3.5 py-2 rounded-xl whitespace-nowrap transition ${state.astrologerSubView === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800/80 text-slate-300 hover:text-white'}">
            <i class="fa-solid ${icon} mr-1.5"></i>${label}
          </button>
        `).join('')}
      </div>
    </div>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      ${state.astrologerSubView === 'console' ? renderAstroChatConsole(astro) : ''}
      ${state.astrologerSubView === 'slots' ? renderAstroSlotBuilder(astro) : ''}
      ${state.astrologerSubView === 'chamber' ? renderAstroChamberSetup(astro) : ''}
      ${state.astrologerSubView === 'earnings' ? renderAstroEarningsAndBank(astro, fin, canWithdraw) : ''}
      ${state.astrologerSubView === 'profile' ? renderAstroProfileKYC(astro) : ''}
    </section>
  `;
}

function renderAstroChatConsole(astro) {
  const chat = state.activeChat;
  const myBookings = state.bookings.filter((b) => b.astrologerId === astro.id);

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-white rounded-2xl kasavu-card overflow-hidden flex flex-col h-[68vh]">
        <div class="bg-midnight text-white px-5 py-3 flex items-center justify-between">
          <div>
            <h3 class="font-bold text-sm text-amber-300">Active Customer Chat — Arjun Nair</h3>
            <p class="text-[11px] text-slate-400">Mirrored Session Timer • Top-up extensions appear here automatically</p>
          </div>
          <div class="flex items-center gap-2">
            <span data-chat-timer class="px-3 py-1 rounded-lg bg-slate-800 border border-amber-500/40 font-mono text-xs font-bold text-amber-300">
              ${formatSeconds(chat.secondsRemaining)}
            </span>
            <button type="button" data-action="end-chat-session" class="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold">End Chat</button>
          </div>
        </div>

        <div class="flex-1 p-4 overflow-y-auto space-y-3 bg-ivory">
          ${chat.messages.map((m) => `
            <div class="flex ${m.sender === 'astrologer' ? 'justify-end' : m.sender === 'system' ? 'justify-center' : 'justify-start'}">
              <div class="${m.sender === 'system' ? 'bg-slate-200 text-slate-700 text-[11px] px-3 py-1 rounded-full' : m.sender === 'astrologer' ? 'bg-indigo-950 text-white px-4 py-2.5 rounded-2xl text-xs max-w-md' : 'bg-white border border-amber-200 text-slate-900 px-4 py-2.5 rounded-2xl text-xs max-w-md'}">
                <p>${esc(m.text)}</p>
                ${m.sender !== 'system' ? `<p class="text-[10px] opacity-70 mt-1">${esc(m.ts)}</p>` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <form id="astro-chat-form" class="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input type="text" id="astro-chat-input" placeholder="Reply in Malayalam or English (PII auto-redacted)..."
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs" />
          <button type="submit" class="px-5 py-2.5 rounded-xl bg-midnight text-amber-300 font-bold text-xs">Send Reply</button>
        </form>
      </div>

      <div class="bg-white rounded-2xl p-5 kasavu-card space-y-3 text-xs">
        <h3 class="font-display text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Upcoming &amp; Chamber Bookings</h3>
        ${myBookings.map((b) => `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div class="flex justify-between font-bold">
              <span>${esc(b.birthDetails.name)}</span>
              <span class="text-emerald-700">₹${b.amount} (70%: ₹${Math.round(b.amount * 0.7)})</span>
            </div>
            <p class="text-slate-600">${esc(b.date)} • ${esc(b.time)} • <strong>${esc(b.mode)}</strong></p>
            <p class="text-[11px] text-slate-500">Rasi: ${esc(b.birthDetails.rasi)} | Nakshatra: ${esc(b.birthDetails.nakshatra)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAstroSlotBuilder(astro) {
  const mySlots = state.slots.filter((s) => s.astrologerId === astro.id);
  const today = new Date().toISOString().split('T')[0];

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="bg-white rounded-2xl p-6 kasavu-card space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-base font-bold text-slate-900">Manual Slot Builder</h3>
          <button type="button" data-action="quick-fill-slots" class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-950 text-[11px] font-bold">
            + Quick-Fill Standard
          </button>
        </div>
        <form id="manual-slot-form" class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Date</label>
            <input type="date" id="slot-date" value="${today}" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Start Time</label>
              <input type="time" id="slot-time" value="18:00" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Duration (mins)</label>
              <input type="number" id="slot-duration" value="20" min="10" max="90" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
            </div>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Consultation Mode</label>
            <select id="slot-mode" class="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white">
              <option value="Online Chat">Online Chat (Scheduled Text)</option>
              <option value="Offline Chamber">Offline Chamber (In-Person Visit)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Slot Price (₹)</label>
              <input type="number" id="slot-price" value="350" min="50" max="10000" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
            </div>
            <div>
              <label class="block font-bold text-slate-700 mb-1">Max Capacity</label>
              <input type="number" id="slot-capacity" value="1" min="1" max="10" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
            </div>
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-saffron text-slate-950 font-bold">
            Publish Slot Live to Customers
          </button>
        </form>
      </div>

      <div class="lg:col-span-2 bg-white rounded-2xl p-6 kasavu-card">
        <h3 class="font-display text-base font-bold text-slate-900 mb-4">Your Published Slots (${mySlots.length})</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-200 text-slate-500">
                <th class="py-2">Date &amp; Time</th>
                <th class="py-2">Mode</th>
                <th class="py-2">Price (Your 70%)</th>
                <th class="py-2">Booked</th>
                <th class="py-2">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${mySlots.map((s) => `
                <tr>
                  <td class="py-2.5 font-bold">${esc(s.date)} • ${esc(s.startTime)} (${s.durationMin}m)</td>
                  <td class="py-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.mode === 'Offline Chamber' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}">
                      ${esc(s.mode)}
                    </span>
                  </td>
                  <td class="py-2.5 font-bold text-emerald-700">₹${s.price} <span class="text-slate-400 font-normal">(₹${Math.round(s.price * 0.7)})</span></td>
                  <td class="py-2.5">${s.bookedCount} / ${s.maxBookings}</td>
                  <td class="py-2.5">
                    <button type="button" data-action="delete-slot" data-slot-id="${esc(s.id)}" class="text-rose-600 hover:underline font-semibold">Remove</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAstroChamberSetup(astro) {
  const c = astro.chamber;
  return `
    <div class="max-w-3xl bg-white rounded-2xl p-6 kasavu-card">
      <h3 class="font-display text-lg font-bold text-slate-900">Office / Chamber Location Setup</h3>
      <p class="text-xs text-slate-500 mt-1">Changes saved here immediately update your card and offline booking confirmations in the Customer Portal.</p>
      <form id="chamber-setup-form" class="mt-4 space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Kerala District</label>
            <select id="ch-district" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white">
              ${KERALA_DISTRICTS.map((d) => `<option value="${esc(d)}" ${c.district === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Pincode</label>
            <input type="text" id="ch-pincode" value="${esc(c.pincode)}" pattern="[0-9]{6}" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300" />
          </div>
        </div>
        <div>
          <label class="block font-bold text-slate-700 mb-1">Full Chamber Address</label>
          <input type="text" id="ch-address" value="${esc(c.address)}" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Temple / Town Landmark</label>
            <input type="text" id="ch-landmark" value="${esc(c.landmark)}" required class="w-full px-3 py-2.5 rounded-xl border border-slate-300" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Google Maps URL</label>
            <input type="url" id="ch-maps" value="${esc(c.mapsUrl)}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300" />
          </div>
        </div>
        <label class="flex items-center gap-2 font-bold text-slate-800">
          <input type="checkbox" id="ch-visible" ${c.visible ? 'checked' : ''} class="accent-amber-600" />
          <span>Show chamber location &amp; enable Offline Chamber bookings for customers</span>
        </label>
        <button type="submit" class="px-5 py-2.5 rounded-xl bg-midnight text-amber-300 font-bold">Save Chamber Location</button>
      </form>
    </div>
  `;
}

function renderAstroEarningsAndBank(astro, fin, canWithdraw) {
  const b = astro.bank;
  const myWithdrawals = state.withdrawals.filter((w) => w.astrologerId === astro.id);

  return `
    <div class="space-y-6">
      <!-- KPI Strip -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-slate-500 font-bold">Gross Consultations</p>
          <p class="font-display text-2xl font-bold text-slate-900 mt-1">₹${fin.totalGross}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-emerald-700 font-bold">Your 70% Share Earned</p>
          <p class="font-display text-2xl font-bold text-emerald-700 mt-1">₹${fin.totalEarned70}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-slate-500 font-bold">Platform Commission (30%)</p>
          <p class="font-display text-2xl font-bold text-slate-700 mt-1">₹${fin.platformFee30}</p>
        </div>
        <div class="bg-midnight text-white rounded-2xl p-4 kasavu-border">
          <p class="text-[11px] text-amber-300 font-bold">Available to Withdraw</p>
          <p class="font-display text-2xl font-bold text-white mt-1">₹${fin.availableBalance}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Bank Details & Penny Drop Gate -->
        <div class="bg-white rounded-2xl p-6 kasavu-card space-y-4 text-xs">
          <div class="flex items-center justify-between">
            <h3 class="font-display text-base font-bold text-slate-900">${bi('bankDetails')}</h3>
            <span class="px-2.5 py-1 rounded-full font-bold ${b.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : b.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
              ${esc(b.status)} ${b.pennyDropVerified ? '• ₹1 Penny-Drop OK' : ''}
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <p><strong>Account Holder:</strong> ${esc(b.holderName)}</p>
            <p><strong>Account Number (Encrypted/Masked):</strong> <span class="font-mono">${esc(b.accountMasked)}</span></p>
            <p><strong>IFSC &amp; Bank:</strong> ${esc(b.ifsc)} — ${esc(b.bankName)} (${esc(b.branch)})</p>
            ${b.rejectReason ? `<p class="text-rose-600 font-bold mt-1">Rejection Reason: ${esc(b.rejectReason)}</p>` : ''}
          </div>

          <form id="astro-bank-form" class="space-y-3 pt-2 border-t border-slate-100">
            <p class="font-bold text-slate-800">Update Bank Details (Resets status to Pending Admin Verification)</p>
            <div class="grid grid-cols-2 gap-2">
              <input type="text" id="bank-holder" placeholder="Account Holder Name" value="${esc(b.holderName)}" required class="px-3 py-2 rounded-xl border border-slate-300" />
              <input type="text" id="bank-acc" placeholder="Account Number (10-16 digits)" required class="px-3 py-2 rounded-xl border border-slate-300" />
              <input type="text" id="bank-ifsc" placeholder="IFSC Code (e.g. SBIN0000940)" value="${esc(b.ifsc)}" required class="px-3 py-2 rounded-xl border border-slate-300" />
              <input type="text" id="bank-name" placeholder="Bank Name" value="${esc(b.bankName)}" required class="px-3 py-2 rounded-xl border border-slate-300" />
            </div>
            <button type="submit" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">Submit Bank Details for Admin Verification</button>
          </form>
        </div>

        <!-- Withdrawal Request Card -->
        <div class="bg-white rounded-2xl p-6 kasavu-card space-y-4 text-xs">
          <h3 class="font-display text-base font-bold text-slate-900">${bi('withdraw')}</h3>
          ${!canWithdraw ? `
            <div class="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1">
              <p class="font-bold"><i class="fa-solid fa-lock mr-1.5"></i>Withdrawals Locked</p>
              <p>Admin must verify your KYC and complete the ₹1 bank penny-drop check before payouts are unlocked.</p>
            </div>
          ` : `
            <form id="astro-withdraw-form" class="space-y-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Withdrawal Amount (Max ₹${fin.availableBalance})</label>
                <input type="number" id="wd-amount" min="100" max="${fin.availableBalance}" value="${Math.min(200, fin.availableBalance)}" required class="w-full px-3 py-2 rounded-xl border border-slate-300" />
              </div>
              <button type="submit" ${fin.availableBalance < 100 ? 'disabled' : ''}
                class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold disabled:opacity-50">
                Request Bank Payout to ${esc(b.accountMasked)}
              </button>
            </form>
          `}

          <div class="pt-3 border-t border-slate-100">
            <p class="font-bold text-slate-800 mb-2">Payout History</p>
            ${myWithdrawals.length === 0 ? `<p class="text-slate-500">No withdrawal requests yet.</p>` : myWithdrawals.map((w) => `
              <div class="flex items-center justify-between py-2 border-b border-slate-100">
                <div>
                  <span class="font-bold">₹${w.amount}</span> • <span class="font-mono text-[11px]">${esc(w.ref)}</span>
                  <p class="text-[10px] text-slate-500">${esc(w.ts)}</p>
                </div>
                <span class="px-2 py-0.5 rounded font-bold text-[10px] ${w.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : w.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">
                  ${esc(w.status)}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAstroProfileKYC(astro) {
  return `
    <div class="max-w-3xl bg-white rounded-2xl p-6 kasavu-card space-y-4 text-xs">
      <div class="flex items-center justify-between">
        <h3 class="font-display text-lg font-bold text-slate-900">Astrologer Profile &amp; KYC Credentials</h3>
        <span class="px-3 py-1 rounded-full font-bold ${astro.kycStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          KYC: ${esc(astro.kycStatus)}
        </span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-3 rounded-xl bg-slate-50"><strong>Name:</strong> ${esc(astro.name)}</div>
        <div class="p-3 rounded-xl bg-slate-50"><strong>Malayalam:</strong> ${esc(astro.nameMl)}</div>
        <div class="p-3 rounded-xl bg-slate-50"><strong>District:</strong> ${esc(astro.district)}</div>
        <div class="p-3 rounded-xl bg-slate-50"><strong>Chat Rate:</strong> ₹${astro.ratePerMin}/min</div>
      </div>
      <p class="text-slate-600"><strong>Bio (EN):</strong> ${esc(astro.bioEn)}</p>
      <p class="text-slate-600"><strong>Bio (ML):</strong> ${esc(astro.bioMl)}</p>
    </div>
  `;
}

// ── 11. PORTAL 3: ADMIN COMMAND PANEL ───────────────────────────────────────
function renderAdminPortal() {
  const totals = getPlatformTotals();
  const pendingBanks = state.astrologers.filter((a) => a.bank.status === 'Pending').length;
  const pendingWds = state.withdrawals.filter((w) => w.status === 'Pending').length;

  return `
    <div class="bg-slate-950 text-white border-b border-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2 text-xs">
          <span class="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
            <i class="fa-solid fa-key mr-1"></i> RBAC Admin Session
          </span>
          <span class="text-slate-400">2FA Status: <strong class="${state.admin2faVerified ? 'text-emerald-400' : 'text-amber-400'}">${state.admin2faVerified ? 'Verified (OTP OK)' : 'Pending OTP'}</strong></span>
          ${!state.admin2faVerified ? `
            <button type="button" data-action="verify-admin-2fa" class="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              Verify 2FA OTP (123456)
            </button>
          ` : ''}
        </div>

        <div class="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          ${[
            ['overview', 'Overview & Settlement'],
            ['banks', `Bank KYC (${pendingBanks})`],
            ['withdrawals', `Payouts (${pendingWds})`],
            ['kyc', 'Astrologer KYC'],
            ['ledger', '70/30 Ledger & Disputes'],
            ['audit', 'Immutable Audit Log']
          ].map(([id, label]) => `
            <button type="button" data-action="set-admin-view" data-view="${id}"
              class="px-3 py-1.5 rounded-lg whitespace-nowrap transition ${state.adminSubView === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-300 hover:text-white'}">
              ${label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    <section class="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <!-- KPI Row -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-slate-500 font-bold">Total Platform GMV</p>
          <p class="font-display text-2xl font-bold text-slate-900 mt-1">₹${totals.gross}</p>
        </div>
        <div class="bg-midnight text-white rounded-2xl p-4 kasavu-border">
          <p class="text-[11px] text-amber-300 font-bold">Admin 30% Share</p>
          <p class="font-display text-2xl font-bold text-amber-300 mt-1">₹${totals.admin30}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-emerald-700 font-bold">Astrologers 70% Pool</p>
          <p class="font-display text-2xl font-bold text-emerald-700 mt-1">₹${totals.astro70}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 kasavu-card">
          <p class="text-[11px] text-slate-500 font-bold">Pending Approvals</p>
          <p class="font-display text-2xl font-bold text-saffron mt-1">${pendingBanks + pendingWds}</p>
        </div>
      </div>

      ${state.adminSubView === 'overview' ? renderAdminSettlementAndBroadcast() : ''}
      ${state.adminSubView === 'banks' ? renderAdminBankQueue() : ''}
      ${state.adminSubView === 'withdrawals' ? renderAdminWithdrawalQueue() : ''}
      ${state.adminSubView === 'kyc' ? renderAdminAstroKYC() : ''}
      ${state.adminSubView === 'ledger' ? renderAdminLedgerAndDisputes() : ''}
      ${state.adminSubView === 'audit' ? renderAdminAuditLog() : ''}
    </section>
  `;
}

function renderAdminSettlementAndBroadcast() {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Platform Settlement Account (jithinck2000-1@okhdfcbank appears ONLY here in Admin) -->
      <div class="bg-white rounded-2xl p-6 kasavu-card space-y-4 text-xs">
        <div class="flex items-center justify-between">
          <h3 class="font-display text-base font-bold text-slate-900">Platform Settlement Account (30% Pool)</h3>
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">Active Collection UPI</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-[11px] text-amber-300 font-semibold">Platform Settlement UPI / GPay ID</p>
            <p class="font-mono text-sm sm:text-base font-bold text-white mt-0.5">${esc(ADMIN_SETTLEMENT_UPI)}</p>
          </div>
          <button type="button" data-action="copy-admin-upi" class="px-3.5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400">
            <i class="fa-solid fa-copy mr-1"></i> Copy UPI ID
          </button>
        </div>

        <!-- Log Incoming UPI Settlement Claim -->
        <form id="upi-claim-form" class="space-y-2.5 pt-2 border-t border-slate-100">
          <p class="font-bold text-slate-800">Record / Verify Incoming UPI Remittance UTR</p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input type="text" id="claim-source" placeholder="Remitter / Batch" required class="px-3 py-2 rounded-xl border border-slate-300" />
            <input type="number" id="claim-amount" placeholder="Amount ₹" min="1" required class="px-3 py-2 rounded-xl border border-slate-300" />
            <input type="text" id="claim-utr" placeholder="12-digit UTR Ref" required class="px-3 py-2 rounded-xl border border-slate-300" />
          </div>
          <button type="submit" class="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold">Add UTR Claim to Verification Queue</button>
        </form>

        <div class="space-y-2 pt-2">
          ${state.upiClaims.map((c) => `
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
              <div>
                <p class="font-bold text-slate-900">${esc(c.claimedBy)} — ₹${c.amount}</p>
                <p class="font-mono text-[11px] text-slate-500">UTR: ${esc(c.utr)} • ${esc(c.ts)}</p>
              </div>
              ${c.status === 'Pending' ? `
                <button type="button" data-action="verify-upi-claim" data-claim-id="${esc(c.id)}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">
                  Verify UTR
                </button>
              ` : `<span class="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold">Verified</span>`}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Broadcast & Quick Overview -->
      <div class="bg-white rounded-2xl p-6 kasavu-card space-y-4 text-xs">
        <h3 class="font-display text-base font-bold text-slate-900">Kerala Platform Broadcast &amp; Controls</h3>
        <form id="admin-broadcast-form" class="space-y-3">
          <label class="block font-bold text-slate-700">Send Bilingual Muhurtham / Festival Alert</label>
          <input type="text" id="broadcast-msg" value="Mandala-Makaravilakku Special: Book verified Sabarimala & Kerala Jyothishis via Live Chat!" class="w-full px-3 py-2.5 rounded-xl border border-slate-300" />
          <button type="submit" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-saffron text-slate-950 font-bold">
            <i class="fa-solid fa-bullhorn mr-1"></i> Broadcast Notification
          </button>
        </form>
        <div class="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-1 text-indigo-950">
          <p class="font-bold">Security &amp; Compliance Summary</p>
          <p>• Chat-only consultation policy enforced across all portals.</p>
          <p>• Bank payouts strictly gated behind Admin KYC + ₹1 Penny-Drop verification.</p>
          <p>• Every Admin action is appended to the Immutable Audit Log.</p>
        </div>
      </div>
    </div>
  `;
}

function renderAdminBankQueue() {
  return `
    <div class="bg-white rounded-2xl p-6 kasavu-card text-xs">
      <h3 class="font-display text-base font-bold text-slate-900 mb-4">Bank Detail &amp; Penny-Drop Verification Queue</h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="py-2">Astrologer</th>
              <th class="py-2">Account &amp; IFSC</th>
              <th class="py-2">Penny-Drop</th>
              <th class="py-2">Status</th>
              <th class="py-2">Admin Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${state.astrologers.map((a) => `
              <tr>
                <td class="py-3 font-bold">${esc(a.name)}<br/><span class="text-slate-500 font-normal">${esc(a.district)}</span></td>
                <td class="py-3 font-mono">${esc(a.bank.holderName)}<br/>${esc(a.bank.accountMasked)} • ${esc(a.bank.ifsc)}</td>
                <td class="py-3">${a.bank.pennyDropVerified ? '<span class="text-emerald-700 font-bold">₹1 Matched</span>' : '<span class="text-amber-700">Awaiting Check</span>'}</td>
                <td class="py-3"><span class="px-2 py-0.5 rounded font-bold ${a.bank.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : a.bank.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}">${esc(a.bank.status)}</span></td>
                <td class="py-3 space-x-2">
                  <button type="button" data-action="admin-verify-bank" data-astro-id="${esc(a.id)}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">
                    Penny-Drop &amp; Verify
                  </button>
                  <button type="button" data-action="admin-reject-bank" data-astro-id="${esc(a.id)}" class="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold">
                    Reject
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminWithdrawalQueue() {
  return `
    <div class="bg-white rounded-2xl p-6 kasavu-card text-xs">
      <h3 class="font-display text-base font-bold text-slate-900 mb-4">Astrologer Payout Requests</h3>
      <div class="space-y-3">
        ${state.withdrawals.map((w) => {
          const astro = state.astrologers.find((a) => a.id === w.astrologerId) || state.astrologers[0];
          return `
            <div class="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-bold text-sm text-slate-900">${esc(astro.name)} — ₹${w.amount}</p>
                <p class="font-mono text-slate-500">${esc(w.bankMasked)} • Ref: ${esc(w.ref)} • ${esc(w.ts)}</p>
              </div>
              <div class="flex items-center gap-2">
                ${w.status === 'Pending' ? `
                  <button type="button" data-action="admin-approve-wd" data-wd-id="${esc(w.id)}" class="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                    Approve IMPS Payout
                  </button>
                  <button type="button" data-action="admin-reject-wd" data-wd-id="${esc(w.id)}" class="px-3.5 py-2 rounded-xl bg-rose-100 text-rose-800 font-bold">
                    Reject &amp; Return Funds
                  </button>
                ` : `<span class="px-3 py-1 rounded-full font-bold ${w.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${esc(w.status)}</span>`}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderAdminAstroKYC() {
  return `
    <div class="bg-white rounded-2xl p-6 kasavu-card text-xs">
      <h3 class="font-display text-base font-bold text-slate-900 mb-4">Astrologer KYC &amp; Live Presence Override</h3>
      <div class="space-y-3">
        ${state.astrologers.map((a) => `
          <div class="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-bold text-sm">${esc(a.name)} <span class="text-slate-500 font-normal">(${esc(a.district)})</span></p>
              <p class="text-slate-600">Specialities: ${esc(a.specialities.join(', '))}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded font-bold ${a.kycStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">KYC: ${esc(a.kycStatus)}</span>
              ${a.kycStatus !== 'Verified' ? `
                <button type="button" data-action="admin-approve-kyc" data-astro-id="${esc(a.id)}" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold">Approve KYC</button>
              ` : ''}
              <button type="button" data-action="admin-toggle-astro-live" data-astro-id="${esc(a.id)}" class="px-3 py-1.5 rounded-lg bg-slate-900 text-amber-300 font-bold">
                Force ${a.online ? 'Offline' : 'Online'}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderAdminLedgerAndDisputes() {
  return `
    <div class="space-y-6 text-xs">
      <div class="bg-white rounded-2xl p-6 kasavu-card">
        <h3 class="font-display text-base font-bold text-slate-900 mb-3">Dispute &amp; Symmetric Refund Center</h3>
        ${state.disputes.map((d) => `
          <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="font-bold text-slate-900">${esc(d.id)} • Booking ${esc(d.bookingId)} — ₹${d.amount}</p>
              <p class="text-slate-600">${esc(d.customerName)} vs ${esc(d.astrologerName)} — "${esc(d.reason)}"</p>
            </div>
            ${d.status === 'Pending' ? `
              <button type="button" data-action="admin-refund-dispute" data-dispute-id="${esc(d.id)}" class="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold">
                Issue Symmetric Refund (Reverses 70/30)
              </button>
            ` : `<span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">${esc(d.status)}</span>`}
          </div>
        `).join('')}
      </div>

      <div class="bg-white rounded-2xl p-6 kasavu-card overflow-x-auto">
        <h3 class="font-display text-base font-bold text-slate-900 mb-3">Master 70/30 Financial Ledger</h3>
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500">
              <th class="py-2">TX ID</th>
              <th class="py-2">Type</th>
              <th class="py-2">Gross</th>
              <th class="py-2">Astrologer (70%)</th>
              <th class="py-2">Admin (30%)</th>
              <th class="py-2">Ref</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${state.ledger.map((tx) => `
              <tr>
                <td class="py-2 font-mono">${esc(tx.id)}</td>
                <td class="py-2 font-bold">${esc(tx.type)}</td>
                <td class="py-2 font-bold">₹${tx.gross}</td>
                <td class="py-2 text-emerald-700 font-bold">₹${tx.astroShare}</td>
                <td class="py-2 text-indigo-800 font-bold">₹${tx.adminShare}</td>
                <td class="py-2 font-mono text-slate-500">${esc(tx.ref)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminAuditLog() {
  return `
    <div class="bg-white rounded-2xl p-6 kasavu-card text-xs">
      <h3 class="font-display text-base font-bold text-slate-900 mb-4">Immutable Admin &amp; Security Audit Log</h3>
      <div class="space-y-2">
        ${state.auditLog.map((log) => `
          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span class="font-bold text-slate-900">[${esc(log.actor)}]</span>
              <span class="text-slate-700"> ${esc(log.action)}</span>
              <p class="font-mono text-[11px] text-slate-500 mt-0.5">${esc(log.before)} → ${esc(log.after)}</p>
            </div>
            <span class="font-mono text-[11px] text-slate-400">${esc(log.ts)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── 12. EVENT DELEGATION & FORM HANDLERS ────────────────────────────────────
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.dataset.action;

  if (action === 'install-pwa') return triggerInstallPWA();
  if (action === 'share-app') return triggerShareApp();
  if (action === 'close-modal') return closeModal();

  if (action === 'switch-portal') {
    state.activePortal = btn.dataset.portal;
    render();
    return;
  }

  if (action === 'toggle-lang') {
    state.lang = state.lang === 'en' ? 'ml' : 'en';
    toast(state.lang === 'ml' ? 'ഭാഷ മലയാളത്തിലേക്ക് മാറ്റി' : 'Language switched to English', 'info');
    render();
    return;
  }

  if (action === 'open-wallet-view') {
    state.activePortal = 'customer';
    state.customerSubView = 'wallet';
    render();
    return;
  }

  if (action === 'set-customer-view') {
    state.customerSubView = btn.dataset.view;
    render();
    return;
  }

  if (action === 'set-astro-view') {
    state.astrologerSubView = btn.dataset.view;
    render();
    return;
  }

  if (action === 'set-admin-view') {
    state.adminSubView = btn.dataset.view;
    render();
    return;
  }

  if (action === 'accept-dpdp') {
    state.dpdpAccepted = true;
    recordAudit('Customer (Arjun Nair)', 'Accepted DPDP Act 2023 Consent', 'Unconsented', 'Consented');
    toast('DPDP 2023 privacy preferences saved.', 'success');
    render();
    return;
  }

  if (action === 'dpdp-export') {
    const exportData = {
      customer: state.customers.find((c) => c.id === state.activeCustomerId),
      bookingsCount: state.bookings.filter((b) => b.customerId === state.activeCustomerId).length,
      walletBalance: getCustomerWalletBalance(state.activeCustomerId),
      exportedAt: new Date().toISOString()
    };
    toast(`DPDP Data Export generated (${JSON.stringify(exportData).length} bytes).`, 'success');
    return;
  }

  if (action === 'reset-demo-state') {
    localStorage.removeItem(STORAGE_KEY);
    state = createSeedState();
    toast('Demo data reset to fresh Kerala seed state.', 'info');
    render();
    return;
  }

  if (action === 'open-security-modal' || action === 'open-auth-modal') {
    openModal(`
      <div class="p-6 text-xs space-y-4">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 class="font-display text-lg font-bold text-slate-900">Security, RBAC &amp; DPDP Act 2023 Architecture</h3>
          <button type="button" data-action="close-modal" class="text-slate-400 hover:text-slate-700 text-base"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <ul class="space-y-2 text-slate-700 leading-relaxed">
          <li><strong>• Role-Based Access Control (RBAC):</strong> Separate Customer, Astrologer Partner, and Admin domains with 2FA OTP enforcement on Admin actions.</li>
          <li><strong>• Payment &amp; Ledger Integrity:</strong> PCI-DSS hosted checkout posture, idempotency keys, symmetric 70/30 splits, and derived double-entry wallet balances.</li>
          <li><strong>• Bank Encryption &amp; KYC Gate:</strong> Account numbers masked at rest (<code>XXXX XXXX 4821</code>) and locked until Admin ₹1 penny-drop verification.</li>
          <li><strong>• Chat PII Protection:</strong> Automatic regex redaction of phone numbers, emails, and UPI handles in live consultations.</li>
        </ul>
        <div class="flex justify-end">
          <button type="button" data-action="close-modal" class="px-4 py-2 rounded-xl bg-midnight text-amber-300 font-bold">Close</button>
        </div>
      </div>
    `);
    return;
  }

  // Filter actions
  if (action === 'toggle-filter-online') {
    state.filters.onlineOnly = !state.filters.onlineOnly;
    render();
    return;
  }
  if (action === 'toggle-filter-offline') {
    state.filters.offlineOnly = !state.filters.offlineOnly;
    render();
    return;
  }
  if (action === 'set-filter-speciality') {
    state.filters.speciality = btn.dataset.speciality;
    render();
    return;
  }
  if (action === 'clear-filters') {
    state.filters = { search: '', speciality: 'All', district: 'All', language: 'All', onlineOnly: false, offlineOnly: false };
    render();
    return;
  }

  // Start Live Chat or Open Booking
  if (action === 'start-live-chat') {
    const astro = state.astrologers.find((a) => a.id === btn.dataset.astrologerId);
    if (!astro || !astro.online) {
      toast('This Jyothishi is currently offline. Please book an upcoming slot.', 'warning');
      return;
    }
    state.activeChat.astrologerId = astro.id;
    state.activeChat.ratePerMin = astro.ratePerMin;
    state.activeChat.isExpired = false;
    if (state.activeChat.secondsRemaining <= 0) state.activeChat.secondsRemaining = 120;
    state.customerSubView = 'chat';
    render();
    return;
  }

  if (action === 'open-booking-for') {
    state.selectedAstrologerId = btn.dataset.astrologerId;
    state.customerSubView = 'booking';
    render();
    return;
  }

  if (action === 'preview-kundali') {
    const dob = document.getElementById('bk-dob')?.value || '1996-05-14';
    const tob = document.getElementById('bk-tob')?.value || '06:45';
    const pob = document.getElementById('bk-pob')?.value || 'Ernakulam';
    const k = computeMiniKundali(dob, tob, pob);
    const box = document.getElementById('kundali-preview-box');
    if (box) {
      box.classList.remove('hidden');
      box.innerHTML = `
        <p class="font-bold text-amber-300">Generated Kerala Janma Kundali Summary:</p>
        <p>• <strong>${bi('rasi')}:</strong> ${esc(k.rasi)} | <strong>${bi('lagna')}:</strong> ${esc(k.lagna)}</p>
        <p>• <strong>${bi('nakshatra')}:</strong> ${esc(k.nakshatra)} | <strong>${bi('dosham')}:</strong> ${esc(k.dosham)}</p>
      `;
    }
    toast('Mini Kundali calculated & attached to booking.', 'success');
    return;
  }

  if (action === 'confirm-slot-booking') {
    if (!checkRateLimit('booking', 1500)) return;
    const selectedRadio = document.querySelector('input[name="selectedSlotId"]:checked');
    if (!selectedRadio) {
      toast('Please choose an available Online or Offline slot first.', 'warning');
      return;
    }
    const consent = document.getElementById('bk-dpdp-consent');
    if (consent && !consent.checked) {
      toast('Please check the DPDP Act 2023 consent checkbox.', 'warning');
      return;
    }

    const slot = state.slots.find((s) => s.id === selectedRadio.value);
    if (!slot || slot.bookedCount >= slot.maxBookings) {
      toast('Sorry, this slot was just filled!', 'error');
      return;
    }

    const custBal = getCustomerWalletBalance(state.activeCustomerId);
    if (custBal < slot.price) {
      toast(`Insufficient wallet balance (₹${custBal}). Please recharge ₹${slot.price - custBal} more.`, 'warning');
      state.customerSubView = 'wallet';
      render();
      return;
    }

    const astro70 = Math.round(slot.price * 0.7);
    const admin30 = slot.price - astro70;
    const bkId = 'BK-' + (9000 + state.bookings.length + 1);
    const dob = document.getElementById('bk-dob')?.value || '1996-05-14';
    const tob = document.getElementById('bk-tob')?.value || '06:45';
    const pob = document.getElementById('bk-pob')?.value || 'Ernakulam';
    const k = computeMiniKundali(dob, tob, pob);

    slot.bookedCount += 1;
    state.bookings.unshift({
      id: bkId,
      customerId: state.activeCustomerId,
      astrologerId: slot.astrologerId,
      slotId: slot.id,
      mode: slot.mode,
      date: slot.date,
      time: slot.startTime,
      durationMin: slot.durationMin,
      amount: slot.price,
      topic: document.getElementById('bk-topic')?.value || 'Vedic Consultation',
      birthDetails: {
        name: document.getElementById('bk-name')?.value || 'Arjun Nair',
        dob, tob, pob,
        rasi: k.rasi, lagna: k.lagna, nakshatra: k.nakshatra
      },
      status: 'Confirmed',
      token: (slot.mode === 'Offline Chamber' ? 'CHM-' : 'ONL-') + Math.floor(1000 + Math.random() * 9000),
      rated: false
    });

    state.ledger.unshift({
      id: 'TX-' + (1000 + state.ledger.length + 1),
      type: 'CONSULTATION',
      customerId: state.activeCustomerId,
      astrologerId: slot.astrologerId,
      gross: slot.price,
      astroShare: astro70,
      adminShare: admin30,
      status: 'Settled',
      ref: 'ORD-' + bkId,
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });

    toast(`Slot confirmed! ₹${slot.price} split: ₹${astro70} Astrologer (70%) / ₹${admin30} Platform (30%).`, 'success');
    state.customerSubView = 'bookings';
    render();
    return;
  }

  if (action === 'recharge-wallet') {
    if (!checkRateLimit('recharge', 1200)) return;
    const amt = Number(btn.dataset.amount || 100);
    state.ledger.unshift({
      id: 'TX-' + (1000 + state.ledger.length + 1),
      type: 'RECHARGE',
      customerId: state.activeCustomerId,
      astrologerId: null,
      gross: amt,
      astroShare: 0,
      adminShare: 0,
      status: 'Settled',
      ref: 'UPI-PG-' + Math.floor(100000 + Math.random() * 900000),
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });
    toast(`₹${amt} added to your wallet via hosted UPI gateway!`, 'success');
    render();
    return;
  }

  if (action === 'cancel-booking') {
    const bk = state.bookings.find((b) => b.id === btn.dataset.bookingId);
    if (!bk || bk.status !== 'Confirmed') return;
    bk.status = 'Cancelled';
    const astro70 = Math.round(bk.amount * 0.7);
    const admin30 = bk.amount - astro70;
    state.ledger.unshift({
      id: 'TX-' + (1000 + state.ledger.length + 1),
      type: 'REFUND',
      customerId: bk.customerId,
      astrologerId: bk.astrologerId,
      gross: bk.amount,
      astroShare: astro70,
      adminShare: admin30,
      status: 'Refunded',
      ref: 'RFD-' + bk.id,
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });
    toast(`Booking ${bk.id} cancelled & ₹${bk.amount} refunded symmetrically.`, 'info');
    render();
    return;
  }

  // Chat Timeout, Extension & End Session
  if (action === 'force-timeout-test') {
    state.activeChat.secondsRemaining = 0;
    state.activeChat.isExpired = true;
    render();
    showSessionTimeoutModal();
    return;
  }

  if (action === 'extend-chat-session') {
    const amount = Math.max(MIN_TOPUP_AMOUNT, Number(btn.dataset.amount || 50));
    const custBal = getCustomerWalletBalance(state.activeCustomerId);
    if (custBal < amount) {
      toast(`Insufficient wallet balance (₹${custBal}). Recharge at least ₹${amount}.`, 'warning');
      closeModal();
      state.customerSubView = 'wallet';
      render();
      return;
    }

    const astro70 = Math.round(amount * 0.7);
    const admin30 = amount - astro70;
    state.ledger.unshift({
      id: 'TX-' + (1000 + state.ledger.length + 1),
      type: 'TOPUP',
      customerId: state.activeCustomerId,
      astrologerId: state.activeChat.astrologerId,
      gross: amount,
      astroShare: astro70,
      adminShare: admin30,
      status: 'Settled',
      ref: 'EXT-' + Math.floor(1000 + Math.random() * 9000),
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });

    state.activeChat.secondsRemaining += 300; // +5 minutes
    state.activeChat.isExpired = false;
    state.activeChat.messages.push({
      id: 'm-' + Date.now(),
      sender: 'system',
      text: `Session extended by +5 mins (₹${amount} paid: ₹${astro70} Astrologer / ₹${admin30} Platform).`,
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    closeModal();
    toast(`Extended +5 mins! ₹${astro70} credited to Astrologer & ₹${admin30} to Platform.`, 'success');
    render();
    return;
  }

  if (action === 'end-chat-session') {
    closeModal();
    state.activeChat.isExpired = false;
    state.activeChat.secondsRemaining = 120;
    toast('Chat session ended. Thank you for consulting on BookMy Astrologer Kerala!', 'info');
    if (state.activePortal === 'customer') state.customerSubView = 'discover';
    render();
    return;
  }

  if (action === 'send-quick-chat') {
    if (state.activeChat.isExpired) return showSessionTimeoutModal();
    state.activeChat.messages.push({
      id: 'm-' + Date.now(),
      sender: 'customer',
      text: redactChatPII(btn.dataset.text),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    render();
    return;
  }

  if (action === 'report-chat-abuse') {
    recordAudit('Customer (Arjun Nair)', 'Reported chat transcript for moderation review', 'Active', 'Flagged');
    toast('Chat transcript flagged for Admin moderation review.', 'warning');
    return;
  }

  // Astrologer Portal Actions
  if (action === 'toggle-astro-online') {
    const astro = state.astrologers.find((a) => a.id === state.activeAstrologerId);
    if (!astro) return;
    if (astro.kycStatus !== 'Verified') {
      toast('KYC Gate: Admin must approve your KYC before you can go live.', 'warning');
      return;
    }
    astro.online = !astro.online;
    toast(`Status updated: ${astro.online ? 'ONLINE (Visible to customers)' : 'OFFLINE'}`, 'success');
    render();
    return;
  }

  if (action === 'quick-fill-slots') {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    state.slots.push(
      { id: 'slot-' + Date.now() + 'a', astrologerId: state.activeAstrologerId, date: tomorrow, startTime: '11:00', durationMin: 20, mode: 'Online Chat', price: 300, maxBookings: 1, bookedCount: 0 },
      { id: 'slot-' + Date.now() + 'b', astrologerId: state.activeAstrologerId, date: tomorrow, startTime: '16:30', durationMin: 30, mode: 'Offline Chamber', price: 500, maxBookings: 1, bookedCount: 0 }
    );
    toast('Added 2 standard slots (Online Chat & Offline Chamber).', 'success');
    render();
    return;
  }

  if (action === 'delete-slot') {
    state.slots = state.slots.filter((s) => s.id !== btn.dataset.slotId);
    toast('Slot removed.', 'info');
    render();
    return;
  }

  // Admin Portal Actions
  if (action === 'verify-admin-2fa') {
    state.admin2faVerified = true;
    recordAudit('Admin (SuperUser)', 'Completed 2FA OTP challenge', 'Unverified', '2FA Verified');
    toast('Admin 2FA verified.', 'success');
    render();
    return;
  }

  if (action === 'copy-admin-upi') {
    navigator.clipboard?.writeText(ADMIN_SETTLEMENT_UPI);
    toast(`Copied Platform Settlement UPI: ${ADMIN_SETTLEMENT_UPI}`, 'success');
    return;
  }

  if (action === 'verify-upi-claim') {
    const claim = state.upiClaims.find((c) => c.id === btn.dataset.claimId);
    if (claim) {
      claim.status = 'Verified';
      recordAudit('Admin (SuperUser)', `Verified UPI UTR ${claim.utr} (₹${claim.amount})`, 'Pending', 'Verified');
      toast(`UTR ${claim.utr} verified against ${ADMIN_SETTLEMENT_UPI}.`, 'success');
      render();
    }
    return;
  }

  if (action === 'admin-verify-bank') {
    const astro = state.astrologers.find((a) => a.id === btn.dataset.astroId);
    if (!astro) return;
    astro.bank.status = 'Verified';
    astro.bank.pennyDropVerified = true;
    astro.bank.rejectReason = '';
    recordAudit('Admin (SuperUser)', `Verified Bank & ₹1 Penny-Drop for ${astro.name}`, 'Pending', 'Verified');
    toast(`Bank details verified for ${astro.name}. Withdrawals unlocked!`, 'success');
    render();
    return;
  }

  if (action === 'admin-reject-bank') {
    const astro = state.astrologers.find((a) => a.id === btn.dataset.astroId);
    if (!astro) return;
    astro.bank.status = 'Rejected';
    astro.bank.pennyDropVerified = false;
    astro.bank.rejectReason = 'IFSC / Beneficiary name mismatch during penny-drop check';
    recordAudit('Admin (SuperUser)', `Rejected Bank Details for ${astro.name}`, 'Pending', 'Rejected');
    toast(`Bank details rejected for ${astro.name}.`, 'warning');
    render();
    return;
  }

  if (action === 'admin-approve-wd') {
    const wd = state.withdrawals.find((w) => w.id === btn.dataset.wdId);
    if (!wd) return;
    wd.status = 'Approved';
    wd.ref = 'IMPS-' + Math.floor(1000000 + Math.random() * 9000000);
    recordAudit('Admin (SuperUser)', `Approved payout ${wd.id} (₹${wd.amount})`, 'Pending', wd.ref);
    toast(`Payout approved! Bank Ref: ${wd.ref}`, 'success');
    render();
    return;
  }

  if (action === 'admin-reject-wd') {
    const wd = state.withdrawals.find((w) => w.id === btn.dataset.wdId);
    if (!wd) return;
    wd.status = 'Rejected';
    recordAudit('Admin (SuperUser)', `Rejected payout ${wd.id} — funds returned to astrologer balance`, 'Pending', 'Rejected');
    toast(`Payout ${wd.id} rejected; balance restored.`, 'info');
    render();
    return;
  }

  if (action === 'admin-approve-kyc') {
    const astro = state.astrologers.find((a) => a.id === btn.dataset.astroId);
    if (!astro) return;
    astro.kycStatus = 'Verified';
    recordAudit('Admin (SuperUser)', `Approved Astrologer KYC for ${astro.name}`, 'Pending', 'Verified');
    toast(`KYC approved for ${astro.name}.`, 'success');
    render();
    return;
  }

  if (action === 'admin-toggle-astro-live') {
    const astro = state.astrologers.find((a) => a.id === btn.dataset.astroId);
    if (!astro) return;
    astro.online = !astro.online;
    recordAudit('Admin (SuperUser)', `Overrode presence for ${astro.name}`, !astro.online, astro.online);
    toast(`${astro.name} forced ${astro.online ? 'Online' : 'Offline'}.`, 'info');
    render();
    return;
  }

  if (action === 'admin-refund-dispute') {
    const dsp = state.disputes.find((d) => d.id === btn.dataset.disputeId);
    if (!dsp || dsp.status !== 'Pending') return;
    dsp.status = 'Refunded';
    const bk = state.bookings.find((b) => b.id === dsp.bookingId);
    const astroId = bk ? bk.astrologerId : 'ast-5';
    const custId = bk ? bk.customerId : 'cust-3';
    const astro70 = Math.round(dsp.amount * 0.7);
    const admin30 = dsp.amount - astro70;
    state.ledger.unshift({
      id: 'TX-' + (1000 + state.ledger.length + 1),
      type: 'REFUND',
      customerId: custId,
      astrologerId: astroId,
      gross: dsp.amount,
      astroShare: astro70,
      adminShare: admin30,
      status: 'Refunded',
      ref: 'DSP-' + dsp.id,
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });
    recordAudit('Admin (SuperUser)', `Symmetric refund issued for ${dsp.id} (₹${dsp.amount})`, 'Pending', 'Refunded');
    toast(`Symmetric refund of ₹${dsp.amount} processed (reversed ₹${astro70} / ₹${admin30}).`, 'success');
    render();
  }
});

// Change & Input listeners (Slot split preview, filter dropdowns, partner switcher)
document.addEventListener('change', (e) => {
  const target = e.target;
  if (target.id === 'filter-district-select') {
    state.filters.district = target.value;
    render();
  } else if (target.id === 'filter-lang-select') {
    state.filters.language = target.value;
    render();
  } else if (target.id === 'booking-astro-select') {
    state.selectedAstrologerId = target.value;
    render();
  } else if (target.id === 'partner-astro-switcher') {
    state.activeAstrologerId = target.value;
    render();
  } else if (target.name === 'selectedSlotId') {
    const price = Number(target.dataset.price || 0);
    const mode = target.dataset.mode || '';
    const astro70 = Math.round(price * 0.7);
    const admin30 = price - astro70;
    const panel = document.getElementById('split-preview-panel');
    if (panel) {
      panel.innerHTML = `
        <p class="font-bold text-amber-950">${esc(mode)} — ₹${price}</p>
        <p class="text-xs text-slate-800 mt-1">₹${price} charged → <strong>₹${astro70} Astrologer (70%)</strong> / <strong>₹${admin30} Platform (30%)</strong></p>
      `;
    }
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'filter-search-input') {
    state.filters.search = e.target.value;
    render();
    const input = document.getElementById('filter-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
});

// Form submissions
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;

  if (form.id === 'customer-chat-form') {
    const input = document.getElementById('customer-chat-input');
    const text = input?.value.trim();
    if (!text) return;
    if (state.activeChat.isExpired) return showSessionTimeoutModal();
    state.activeChat.messages.push({
      id: 'm-' + Date.now(),
      sender: 'customer',
      text: redactChatPII(text),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    render();
    return;
  }

  if (form.id === 'astro-chat-form') {
    const input = document.getElementById('astro-chat-input');
    const text = input?.value.trim();
    if (!text) return;
    state.activeChat.messages.push({
      id: 'm-' + Date.now(),
      sender: 'astrologer',
      text: redactChatPII(text),
      ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    render();
    return;
  }

  if (form.id === 'manual-slot-form') {
    const date = document.getElementById('slot-date').value;
    const startTime = document.getElementById('slot-time').value;
    const durationMin = Number(document.getElementById('slot-duration').value);
    const mode = document.getElementById('slot-mode').value;
    const price = Number(document.getElementById('slot-price').value);
    const maxBookings = Number(document.getElementById('slot-capacity').value);

    state.slots.unshift({
      id: 'slot-' + Date.now(),
      astrologerId: state.activeAstrologerId,
      date,
      startTime,
      durationMin,
      mode,
      price,
      maxBookings,
      bookedCount: 0
    });
    toast(`Manual ${mode} slot (${date} ${startTime}) published to Customer Portal!`, 'success');
    render();
    return;
  }

  if (form.id === 'chamber-setup-form') {
    const astro = state.astrologers.find((a) => a.id === state.activeAstrologerId);
    if (!astro) return;
    astro.chamber.district = document.getElementById('ch-district').value;
    astro.chamber.pincode = document.getElementById('ch-pincode').value;
    astro.chamber.address = document.getElementById('ch-address').value;
    astro.chamber.landmark = document.getElementById('ch-landmark').value;
    astro.chamber.mapsUrl = document.getElementById('ch-maps').value || astro.chamber.mapsUrl;
    astro.chamber.visible = document.getElementById('ch-visible').checked;
    toast('Chamber location updated & synced to Customer Portal.', 'success');
    render();
    return;
  }

  if (form.id === 'astro-bank-form') {
    const astro = state.astrologers.find((a) => a.id === state.activeAstrologerId);
    if (!astro) return;
    const acc = document.getElementById('bank-acc').value.trim();
    const last4 = acc.slice(-4) || '0000';
    astro.bank.holderName = document.getElementById('bank-holder').value.trim();
    astro.bank.accountMasked = `XXXX XXXX ${last4}`;
    astro.bank.ifsc = document.getElementById('bank-ifsc').value.trim().toUpperCase();
    astro.bank.bankName = document.getElementById('bank-name').value.trim();
    astro.bank.status = 'Pending';
    astro.bank.pennyDropVerified = false;
    astro.bank.rejectReason = '';
    toast('Bank details submitted! Queued for Admin Penny-Drop verification.', 'info');
    render();
    return;
  }

  if (form.id === 'astro-withdraw-form') {
    if (!checkRateLimit('withdraw', 2000)) return;
    const astro = state.astrologers.find((a) => a.id === state.activeAstrologerId);
    if (!astro || astro.bank.status !== 'Verified') {
      toast('Bank verification required before withdrawal.', 'error');
      return;
    }
    const fin = getAstrologerFinancials(astro.id);
    const amount = Number(document.getElementById('wd-amount').value);
    if (amount < 100 || amount > fin.availableBalance) {
      toast(`Invalid withdrawal amount. Available: ₹${fin.availableBalance}`, 'warning');
      return;
    }
    state.withdrawals.unshift({
      id: 'WD-' + (400 + state.withdrawals.length + 1),
      astrologerId: astro.id,
      amount,
      status: 'Pending',
      bankMasked: `${astro.bank.accountMasked} (${astro.bank.ifsc})`,
      ref: 'REQ-' + Math.floor(1000 + Math.random() * 9000),
      reason: '',
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });
    toast(`Withdrawal request for ₹${amount} sent to Admin Payout Queue.`, 'success');
    render();
    return;
  }

  if (form.id === 'upi-claim-form') {
    const claimedBy = document.getElementById('claim-source').value.trim();
    const amount = Number(document.getElementById('claim-amount').value);
    const utr = document.getElementById('claim-utr').value.trim();
    state.upiClaims.unshift({
      id: 'CLM-' + (200 + state.upiClaims.length + 1),
      claimedBy,
      amount,
      utr,
      status: 'Pending',
      ts: new Date().toLocaleString('en-IN', { hour12: false })
    });
    toast(`UTR claim ${utr} added to verification queue.`, 'success');
    render();
    return;
  }

  if (form.id === 'admin-broadcast-form') {
    const msg = document.getElementById('broadcast-msg').value.trim();
    if (!msg) return;
    recordAudit('Admin (SuperUser)', 'Broadcasted platform alert', 'None', msg);
    toast(`Broadcast sent: "${msg}"`, 'success');
  }
});

// ── 13. BOOTSTRAP APPLICATION ───────────────────────────────────────────────
initPWA();
startChatTimerLoop();
render();
