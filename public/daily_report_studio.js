/**
 * Daily Report Studio for PYNN PRIDI 37
 * Standard SANSIRI Daily Work Report & Piling Progress Multi-Page PDF Exporter
 * 
 * Features:
 * - Page 1: Official SANSIRI Daily Work Report (รายงานการทำงานประจำวันตามฟอร์มแสนสิริ)
 * - Page 2: Piling Progress Report with Image 2 LEDGER Comparison Table
 * - Page 3: Site Photo Sheet (แผ่นภาพถ่ายหน้างาน 6 ภาพ พร้อมระบบอัพโหลดชั่วคราว In-Memory)
 * - Automatic Grouping of Footings in Tasks Table (F20A, F18A, F6, F3, F2, F5, F1, F8)
 * - Live Cloud Sync with Supabase (project_data) & Local Storage
 */

(function () {
  'use strict';

  // Base64 Logo of Sansiri-logo-en-black.png from Logo/png
  const SANSIRI_LOGO_BASE64 = "data:image/png;base64,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";

  // Supabase Configuration
  const SUPABASE_URL = "https://gyzrsrxzzturoqwhuiul.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enJzcnh6enR1cm9xd2h1aXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxNDcsImV4cCI6MjA5MTA2MjE0N30.CJAFW3acVnOwb5hvSDO6H0TGPTK__MOTBdgUxUWpM70";

  // Thai Public Holidays for Working Days Schedule Calculation
  const THAI_PUBLIC_HOLIDAYS = {
    '2026-01-01': 'วันขึ้นปีใหม่',
    '2026-01-02': 'วันหยุดพิเศษราชการ',
    '2026-03-03': 'วันมาฆบูชา',
    '2026-04-06': 'วันจักรี',
    '2026-04-13': 'วันสงกรานต์',
    '2026-04-14': 'วันสงกรานต์',
    '2026-04-15': 'วันสงกรานต์',
    '2026-05-01': 'วันแรงงานแห่งชาติ',
    '2026-05-04': 'วันฉัตรมงคล',
    '2026-05-31': 'วันวิสาขบูชา',
    '2026-06-01': 'วันหยุดชดเชยวันวิสาขบูชา',
    '2026-06-03': 'วันเฉลิมฯ พระบรมราชินี',
    '2026-07-28': 'วันเฉลิมฯ ร.10',
    '2026-07-29': 'วันอาสาฬหบูชา',
    '2026-07-30': 'วันเข้าพรรษา',
    '2026-08-12': 'วันแม่แห่งชาติ',
    '2026-10-13': 'วันนวมินทรมหาราช (ร.9)',
    '2026-10-23': 'วันปิยมหาราช',
    '2026-12-05': 'วันพ่อแห่งชาติ / วันชาติ',
    '2026-12-07': 'วันหยุดชดเชยวันพ่อแห่งชาติ',
    '2026-12-10': 'วันรัฐธรรมนูญ',
    '2026-12-31': 'วันสิ้นปี',
    '2027-01-01': 'วันขึ้นปีใหม่',
    '2027-02-22': 'วันหยุดชดเชยวันมาฆบูชา',
    '2027-04-06': 'วันจักรี',
    '2027-04-13': 'วันสงกรานต์',
    '2027-04-14': 'วันสงกรานต์',
    '2027-04-15': 'วันสงกรานต์',
    '2027-05-03': 'วันหยุดชดเชยวันแรงงานแห่งชาติ',
    '2027-05-04': 'วันฉัตรมงคล',
    '2027-05-20': 'วันวิสาขบูชา',
    '2027-06-03': 'วันเฉลิมฯ พระบรมราชินี',
    '2027-07-19': 'วันหยุดชดเชยวันอาสาฬหบูชา',
    '2027-07-28': 'วันเฉลิมฯ ร.10',
    '2027-08-12': 'วันแม่แห่งชาติ',
    '2027-10-13': 'วันนวมินทรมหาราช',
    '2027-10-25': 'วันหยุดชดเชยวันปิยมหาราช',
    '2027-12-06': 'วันหยุดชดเชยวันพ่อแห่งชาติ',
    '2027-12-10': 'วันรัฐธรรมนูญ',
    '2027-12-31': 'วันสิ้นปี'
  };

  function parseDateLocal(str) {
    if (!str) return new Date();
    const parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDateLocal(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function isThaiWorkingDay(dateStr) {
    if (!dateStr) return false;
    const d = parseDateLocal(dateStr);
    if (d.getDay() === 0) return false;
    if (THAI_PUBLIC_HOLIDAYS[dateStr]) return false;
    const mmdd = dateStr.slice(5);
    const fixedHolidays = ['01-01', '04-06', '04-13', '04-14', '04-15', '05-01', '05-04', '06-03', '07-28', '08-12', '10-13', '10-23', '12-05', '12-10', '12-31'];
    if (fixedHolidays.includes(mmdd)) return false;
    return true;
  }

  function getWorkingDaysSchedule(startDateStr, totalWorkingDays = 31) {
    if (typeof window.getWorkingDaysSchedule === 'function' && window.getWorkingDaysSchedule !== getWorkingDaysSchedule) {
      try {
        const sched = window.getWorkingDaysSchedule(startDateStr, totalWorkingDays);
        if (sched && sched.length >= totalWorkingDays) return sched;
      } catch (e) {}
    }

    const schedule = [];
    let cur = parseDateLocal(startDateStr || '2026-10-06');
    while (!isThaiWorkingDay(formatDateLocal(cur)) && schedule.length === 0) {
      cur.setDate(cur.getDate() + 1);
    }
    while (schedule.length < totalWorkingDays) {
      const s = formatDateLocal(cur);
      if (isThaiWorkingDay(s)) {
        schedule.push(s);
      }
      cur.setDate(cur.getDate() + 1);
    }
    return schedule;
  }

  function formatThaiDayMonth(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10);
    const mIdx = parseInt(parts[1], 10) - 1;
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    return day + ' ' + (thaiMonths[mIdx] || '');
  }

  function formatThaiDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10) + 543;
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return `${day} ${thaiMonths[monthIdx] || ''} ${year}`;
  }

  function getProgressRecords() {
    if (window.progressRecords && Object.keys(window.progressRecords).length > 0) {
      return window.progressRecords;
    }
    try {
      const raw = localStorage.getItem('PYNN37_PILING_PROGRESS_LIVE_v3') ||
                  localStorage.getItem('PYNN37_PILING_PROGRESS_v2') ||
                  localStorage.getItem('pynn_pridi37_piling_progress');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {}
    return {};
  }

  // Global State for Daily Report Studio
  const DailyReportState = {
    date: '',
    projectName: 'PYNN PRIDI 37',
    recipient: 'คุณ วิสุทธิ์ จันทร์วัฒรังกูล',
    authorSignatureImg: null,
    reviewerSignatureImg: null,
    author: 'นายนิวัฒน์ เวียงชัย',
    authorRole: 'ผู้จัดการส่วนก่อสร้าง',
    reviewer: 'นายสุวิทย์ สุขศรี',
    reviewerRole: 'ผู้ช่วยผู้จัดการฝ่ายพัฒนาโครงการแนวสูง',
    weather: 'clear',
    weatherOther: '',
    workPermit: 'none',
    workPermitOther: '',
    startTime: '08:00 น.',
    endTime: '17:00 น.',
    duration: '8 ชั่วโมง',
    attachmentPages: 3,
    activeTab: 'all',
    
    // Manpower defaults matching exact user specification
    manpower: {
      mgmt: [
        { label: 'ผู้จัดการส่วนก่อสร้าง', count: 1 },
        { label: 'วิศวกรโครงการ / โฟร์แมน', count: 0 },
        { label: 'เจ้าหน้าที่ความปลอดภัย (จป.)', count: 0 },
        { label: 'ฝ่ายแบบ / Drawing / QS', count: 0 }
      ],
      workers: [
        { label: 'Staff ควบคุมงานกดเข็ม', count: 1 },
        { label: 'Survey / ช่างสำรวจ', count: 2 },
        { label: 'คนงานกดเข็ม', count: 4 },
        { label: 'ช่างไฟ', count: 1 },
        { label: 'คนงานทั่วไป', count: 2 },
        { label: 'ช่างเชื่อม / ผรม. ทั่วไป', count: 0 }
      ],
      machinery: [
        { label: 'เครื่องกดเสาเข็มระบบไฮดรอลิก', count: 1, unit: 'เครื่อง' },
        { label: 'รถโมบายเครน 25 ตัน', count: 1, unit: 'คัน' },
        { label: 'รถขุด Backhoe PC 200', count: 0, unit: 'คัน' },
        { label: 'รถบรรทุก 6 ล้อ', count: 0, unit: 'คัน' }
      ]
    },

    // Materials on site matching user specification
    materials: [
      { label: 'เข็ม I-0.40m ยาว 10 เมตร', count: 10, unit: 'ต้น' },
      { label: 'เข็ม I-0.40m ยาว 7 เมตร', count: 5, unit: 'ต้น' },
      { label: 'เหล็กข้ออ้อย SD40 DB12/20', count: 0, unit: 'เส้น' },
      { label: 'คอนกรีตหยาบ Lean Concrete', count: 0, unit: 'คิว' }
    ],

    obstacles: 'เขี้ยวกดเข็มหลุด ตกไปในหลุม',
    solutions: 'พรุ่งนี้เอา PC 30 มาขุดเอาเขี้ยวที่หล่นลงไปในหลุม',

    tasks: [],
    photos: []
  };

  
  // Signature Image Upload Handlers (ตรงลายเซ็น ใช้การเพิ่มรูปได้)
  window.handleSignatureUpload = function (target, event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      if (target === 'author') DailyReportState.authorSignatureImg = dataUrl;
      else if (target === 'reviewer') DailyReportState.reviewerSignatureImg = dataUrl;
      renderDailyReportPage1();
      window.saveDailyReportConfigToSupabase(true);
      showDrToast('📷 เพิ่มรูปภาพลายเซ็นเรียบร้อยแล้ว', 'success');
    };
    reader.readAsDataURL(file);
  };

  window.clearSignature = function (target) {
    if (target === 'author') DailyReportState.authorSignatureImg = null;
    else if (target === 'reviewer') DailyReportState.reviewerSignatureImg = null;
    renderDailyReportPage1();
    window.saveDailyReportConfigToSupabase(true);
    showDrToast('ลบรูปภาพลายเซ็นแล้ว', 'info');
  };

  // Helper to escape HTML characters
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Floating Toast Notification
  function showDrToast(message, type = 'success') {
    const existing = document.getElementById('dr-floating-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'dr-floating-toast';
    const bg = type === 'success' ? 'bg-emerald-600 text-white border-emerald-700' :
               type === 'error' ? 'bg-rose-600 text-white border-rose-700' :
               'bg-slate-800 text-white border-slate-900';
    toast.className = `fixed bottom-6 right-6 z-[10001] ${bg} px-4 py-2.5 rounded-xl text-xs font-bold border-2 shadow-2xl flex items-center gap-2 transform transition-all duration-200 pointer-events-auto`;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // =========================================================================
  // SUPABASE CONFIG LIVE SYNC (Save & Load config in project_data table)
  // =========================================================================
  window.saveDailyReportConfigToSupabase = async function (silent = false) {
    const config = {
      recipient: DailyReportState.recipient,
      authorSignatureImg: DailyReportState.authorSignatureImg,
      reviewerSignatureImg: DailyReportState.reviewerSignatureImg,
      author: DailyReportState.author,
      authorRole: DailyReportState.authorRole,
      reviewer: DailyReportState.reviewer,
      reviewerRole: DailyReportState.reviewerRole,
      manpower: DailyReportState.manpower,
      materials: DailyReportState.materials,
      machinery: DailyReportState.manpower.machinery,
      obstacles: DailyReportState.obstacles,
      solutions: DailyReportState.solutions,
      startTime: DailyReportState.startTime,
      endTime: DailyReportState.endTime,
      duration: DailyReportState.duration
    };

    // Save locally immediately
    try {
      localStorage.setItem('PYNN37_DAILY_REPORT_CONFIG', JSON.stringify(config));
    } catch (_) {}

    const btn = document.getElementById('btn-dr-save-supabase');
    const lbl = document.getElementById('lbl-dr-save-supabase');
    if (lbl) lbl.textContent = 'กำลังบันทึก...';

    let success = false;
    try {
      const getRes = await fetch(SUPABASE_URL + '/rest/v1/project_data?id=eq.1&select=data', {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
      });
      const rows = await getRes.json();
      if (rows && rows[0] && rows[0].data) {
        const data = rows[0].data;
        data.dailyReportConfig = config;
        data.dailyReportConfigLastUpdated = new Date().toISOString();
        const patchRes = await fetch(SUPABASE_URL + '/rest/v1/project_data?id=eq.1', {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ data: data })
        });
        if (patchRes.ok) success = true;
      }
    } catch (e) {
      console.warn('Supabase dailyReportConfig sync error:', e);
    }

    if (success) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (lbl) lbl.textContent = `☁️ บันทึกแล้ว (${timeStr})`;
      if (btn) btn.className = 'px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#10b981] text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer';
      if (!silent) showDrToast('☁️ บันทึกการตั้งค่าลง Supabase เรียบร้อยแล้ว (วันต่อไปไม่ต้องกรอกใหม่)', 'success');
    } else {
      if (lbl) lbl.textContent = '💾 บันทึกในเครื่องแล้ว';
      if (btn) btn.className = 'px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#3b82f6] text-white font-black text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer';
      if (!silent) showDrToast('💾 บันทึกลงในเครื่องเรียบร้อยแล้ว (ออฟไลน์)', 'info');
    }
  };

  async function loadDailyReportConfigFromSupabase() {
    // 1. Read from localStorage cache first
    try {
      const raw = localStorage.getItem('PYNN37_DAILY_REPORT_CONFIG');
      if (raw) {
        const parsed = JSON.parse(raw);
        applyDailyReportConfig(parsed);
      }
    } catch (_) {}

    // 2. Fetch from Supabase cloud in background
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/project_data?id=eq.1&select=data', {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        }
      });
      const rows = await res.json();
      if (rows && rows[0] && rows[0].data && rows[0].data.dailyReportConfig) {
        applyDailyReportConfig(rows[0].data.dailyReportConfig);
        renderDailyReportPage1();
      }
    } catch (e) {
      console.warn('Could not fetch dailyReportConfig from Supabase:', e);
    }
  }

  function applyDailyReportConfig(cfg) {
    if (!cfg) return;
    if (cfg.recipient) DailyReportState.recipient = cfg.recipient;
    if (cfg.authorSignatureImg) DailyReportState.authorSignatureImg = cfg.authorSignatureImg;
    if (cfg.reviewerSignatureImg) DailyReportState.reviewerSignatureImg = cfg.reviewerSignatureImg;
    if (cfg.author) DailyReportState.author = cfg.author;
    if (cfg.authorRole) DailyReportState.authorRole = cfg.authorRole;
    if (cfg.reviewer) DailyReportState.reviewer = cfg.reviewer;
    if (cfg.reviewerRole) DailyReportState.reviewerRole = cfg.reviewerRole;
    if (cfg.manpower) {
      if (cfg.manpower.mgmt) {
        let staffCount = 1;
        const filteredMgmt = cfg.manpower.mgmt.filter(m => {
          if (m && m.label && m.label.includes('Staff')) {
            staffCount = m.count || 1;
            return false;
          }
          return true;
        });
        DailyReportState.manpower.mgmt = filteredMgmt;

        if (cfg.manpower.workers) {
          const hasStaff = cfg.manpower.workers.some(w => w && w.label && w.label.includes('Staff'));
          if (!hasStaff) {
            cfg.manpower.workers.unshift({ label: 'Staff ควบคุมงานกดเข็ม', count: staffCount });
          }
          DailyReportState.manpower.workers = cfg.manpower.workers;
        }
      } else if (cfg.manpower.workers) {
        DailyReportState.manpower.workers = cfg.manpower.workers;
      }
      if (cfg.manpower.machinery) DailyReportState.manpower.machinery = cfg.manpower.machinery;
      else if (cfg.machinery) DailyReportState.manpower.machinery = cfg.machinery;
    }
    if (cfg.materials) DailyReportState.materials = cfg.materials;
    if (cfg.obstacles) DailyReportState.obstacles = cfg.obstacles;
    if (cfg.solutions) DailyReportState.solutions = cfg.solutions;
    if (cfg.startTime) DailyReportState.startTime = cfg.startTime;
    if (cfg.endTime) DailyReportState.endTime = cfg.endTime;
    if (cfg.duration) DailyReportState.duration = cfg.duration;
  }

  // =========================================================================
  // AUTOMATIC TASK LIST GENERATOR (Grouped by Footings F1 - F20A)
  // =========================================================================
  function generateAutomaticTasksList(curDate) {
    const pilesDb = window.__PILES_DB__ || [];
    const progressRecs = getProgressRecords();

    // 8 Official Footing Groups of PYNN PRIDI 37
    const footingsOrder = ['F20A', 'F18A', 'F6', 'F3', 'F2', 'F5', 'F1', 'F8'];
    const existingSet = new Set(footingsOrder.map(f => f.toUpperCase()));

    pilesDb.forEach(p => {
      if (p.footing && !existingSet.has(p.footing.toUpperCase())) {
        footingsOrder.push(p.footing);
        existingSet.add(p.footing.toUpperCase());
      }
    });

    const tasks = [];

    footingsOrder.forEach((f, idx) => {
      const groupPiles = pilesDb.filter(p => (p.footing || '').toUpperCase() === f.toUpperCase());
      const totalInGroup = groupPiles.length;
      if (totalInGroup === 0) return;

      let drivenCum = 0;
      let drivenToday = 0;

      groupPiles.forEach(p => {
        const rec = progressRecs[p.no];
        if (rec && rec.status === 'driven') {
          if (!rec.date || rec.date <= curDate) {
            drivenCum++;
          }
          if (rec.date === curDate) {
            drivenToday++;
          }
        }
      });

      const pctNum = Math.round((drivenCum / totalInGroup) * 100);
      const pctStr = `${pctNum}%`;

      let remarks = '';
      if (drivenCum === totalInGroup) {
        remarks = `กดครบ 100% (${drivenCum}/${totalInGroup} ต้น) ผ่านเกณฑ์`;
      } else if (drivenToday > 0) {
        remarks = `วันนี้กด ${drivenToday} ต้น (สะสม ${drivenCum}/${totalInGroup} ต้น)`;
      } else if (drivenCum > 0) {
        remarks = `กดแล้ว ${drivenCum}/${totalInGroup} ต้น (เหลือ ${totalInGroup - drivenCum} ต้น)`;
      } else {
        remarks = `รอดำเนินการ (${totalInGroup} ต้น)`;
      }

      tasks.push({
        no: idx + 1,
        title: `เข็มกลุ่ม ${f}`,
        location: `ฐานราก ${f}`,
        qty: `${totalInGroup} ต้น`,
        drivenQty: `${drivenCum} ต้น`,
        pct: pctStr,
        remarks: '' // หมายเหตุเว้นว่างตามสั่ง
      });
    });

    return tasks;
  }

  // Refresh automatic tasks list on demand
  window.refreshDrAutomaticTasks = function () {
    DailyReportState.tasks = generateAutomaticTasksList(DailyReportState.date);
    renderDailyReportPage1();
    showDrToast('🔄 อัปเดตรายการงานแยกตามกลุ่มฐานราก (8 กลุ่ม) อัตโนมัติเรียบร้อย', 'info');
  };

  // Sample default photos for initial state
  function initDefaultPhotos() {
    if (!DailyReportState.photos) DailyReportState.photos = [];
  }

  function createSamplePhotoDataUrl(title, color) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="420" viewBox="0 0 600 420">
        <rect width="600" height="420" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>
        <line x1="0" y1="0" x2="600" y2="420" stroke="#f1f5f9" stroke-width="1.5"/>
        <line x1="600" y1="0" x2="0" y2="420" stroke="#f1f5f9" stroke-width="1.5"/>
        <rect x="15" y="15" width="570" height="390" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4"/>
        <circle cx="300" cy="180" r="42" fill="#e2e8f0"/>
        <path d="M280 195 L320 195 L310 175 L300 185 L292 175 Z" fill="#94a3b8"/>
        <circle cx="312" cy="168" r="4" fill="#94a3b8"/>
        <text x="300" y="255" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="${color}" text-anchor="middle">${title}</text>
        <text x="300" y="280" font-family="'Sarabun', sans-serif" font-size="11" fill="#64748b" text-anchor="middle">คลิกปุ่มเลือกรูปภาพด้านบนเพื่อเปลี่ยนเป็นภาพถ่ายจริงหน้างาน</text>
      </svg>
    `;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Sync state with piling database for the current date
  function syncDailyReportState() {
    const dateInput = document.getElementById('report-date-picker') || document.getElementById('date-picker');
    const curDate = dateInput ? dateInput.value : (window.todayStr || new Date().toISOString().split('T')[0]);
    DailyReportState.date = curDate;

    // Generate Automatic Task List based on live pile records
    DailyReportState.tasks = generateAutomaticTasksList(curDate);

    initDefaultPhotos();
  }

  // Open Daily Report Studio Modal
  window.openDailyReportModal = function () {
    syncDailyReportState();
    loadDailyReportConfigFromSupabase();

    let modal = document.getElementById('modal-daily-report');
    if (!modal) {
      createDailyReportModalDOM();
      modal = document.getElementById('modal-daily-report');
    }
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    renderDailyReportAll();
    
    setTimeout(() => {
      renderDailyPilingPlanMonochrome();
    }, 150);
  };

  // Close Daily Report Studio Modal
  window.closeDailyReportModal = function () {
    const modal = document.getElementById('modal-daily-report');
    if (modal) {
      modal.classList.add('hidden');
    }
    document.body.style.overflow = '';
  };

  // Switch between tabs in Daily Report Studio
  window.switchDailyReportTab = function (tab) {
    DailyReportState.activeTab = tab;
    const p1 = document.getElementById('dr-sheet-1');
    const p2 = document.getElementById('dr-sheet-2');
    const p3Container = document.getElementById('dr-photo-sheets-container');
    
    document.querySelectorAll('.dr-nav-tab').forEach(btn => {
      btn.classList.remove('bg-[#1e293b]', 'text-white', 'shadow-sm');
      btn.classList.add('bg-white', 'text-slate-700');
    });
    const activeBtn = document.getElementById(`dr-tab-${tab}`);
    if (activeBtn) {
      activeBtn.classList.remove('bg-white', 'text-slate-700');
      activeBtn.classList.add('bg-[#1e293b]', 'text-white', 'shadow-sm');
    }

    if (tab === 'all') {
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'block';
      if (p3Container) p3Container.style.display = 'flex';
    } else if (tab === 'p1') {
      if (p1) p1.style.display = 'block';
      if (p2) p2.style.display = 'none';
      if (p3Container) p3Container.style.display = 'none';
    } else if (tab === 'p2') {
      if (p1) p1.style.display = 'none';
      if (p2) p2.style.display = 'block';
      if (p3Container) p3Container.style.display = 'none';
      setTimeout(renderDailyPilingPlanMonochrome, 50);
    } else if (tab === 'p3') {
      if (p1) p1.style.display = 'none';
      if (p2) p2.style.display = 'none';
      if (p3Container) p3Container.style.display = 'flex';
    }
  };

  // Build the Modal DOM structure
  function createDailyReportModalDOM() {
    const modalHtml = `
      <div id="modal-daily-report" class="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-md overflow-y-auto flex flex-col hidden">
        
        <!-- Sticky Top Control Toolbar (Hidden in Print) -->
        <header class="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-2 border-slate-900 px-4 py-2.5 shadow-md daily-no-print flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          <!-- Left: Title & Project Badge -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#ffc45b] border-2 border-slate-900 flex items-center justify-center font-black text-slate-900 shadow-sm shrink-0">
              <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white">SANSIRI STANDARD</span>
                <span class="text-xs text-slate-500 font-bold">โครงการ PYNN PRIDI 37</span>
              </div>
              <h2 class="text-base sm:text-lg font-black text-slate-900 leading-tight">
                ระบบจัดทำ Daily Report & รายงานเสาเข็ม (PDF 3 หน้าตรงมาตรฐาน A4)
              </h2>
            </div>
          </div>

          <!-- Center: Tab Switcher -->
          <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-300 gap-1 text-xs font-bold">
            <button id="dr-tab-all" onclick="switchDailyReportTab('all')" class="dr-nav-tab px-3 py-1.5 rounded-lg bg-[#1e293b] text-white shadow-sm transition-all cursor-pointer">
              📑 ดูทั้ง 3 หน้า (PDF All)
            </button>
            <button id="dr-tab-p1" onclick="switchDailyReportTab('p1')" class="dr-nav-tab px-3 py-1.5 rounded-lg bg-white text-slate-700 transition-all hover:bg-slate-200 cursor-pointer">
              หน้า 1: รายงานประจำวัน
            </button>
            <button id="dr-tab-p2" onclick="switchDailyReportTab('p2')" class="dr-nav-tab px-3 py-1.5 rounded-lg bg-white text-slate-700 transition-all hover:bg-slate-200 cursor-pointer">
              หน้า 2: รายงานเข็ม (Ledger)
            </button>
            <button id="dr-tab-p3" onclick="switchDailyReportTab('p3')" class="dr-nav-tab px-3 py-1.5 rounded-lg bg-white text-slate-700 transition-all hover:bg-slate-200 cursor-pointer">
              หน้า 3: ภาพถ่ายหน้างาน
            </button>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-2">
            <input type="file" id="dr-file-input" multiple accept="image/*" class="hidden" onchange="handleTemporaryPhotoSelect(event)">
            
            <button type="button" id="btn-dr-save-supabase" onclick="saveDailyReportConfigToSupabase(false)" class="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#3b82f6] text-white font-black text-xs shadow-xs hover:bg-blue-600 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer" title="บันทึกการตั้งค่า (ชื่อ, กำลังคน, วัสดุ, เครื่องจักร) ขึ้น Supabase เพื่อใช้วันถัดไปโดยไม่ต้องกรอกใหม่">
              <i data-lucide="cloud-upload" class="w-4 h-4"></i>
              <span id="lbl-dr-save-supabase">☁️ บันทึกลง Supabase</span>
            </button>

            <button type="button" onclick="document.getElementById('dr-file-input').click()" class="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#e0f2fe] text-[#0369a1] font-black text-xs shadow-xs hover:bg-sky-100 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer" title="อัพโหลดรูปภาพชั่วคราวเพื่อนำไปจัดลงหน้า 3 (ไม่เปลืองพื้นที่เซิร์ฟเวอร์)">
              <i data-lucide="camera" class="w-4 h-4"></i>
              <span>📸 อัพโหลดรูปชั่วคราว</span>
            </button>

            <button type="button" onclick="printDailyReportPDF()" class="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#ffc45b] text-slate-900 font-black text-xs shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer" title="พิมพ์หรือบันทึกเป็น PDF ขนาด A4 เวกเตอร์ความคมชัดสูงสุด">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>🖨️ พิมพ์ / บันทึก PDF (A4)</span>
            </button>

            <button type="button" onclick="downloadDailyReportPDF()" class="px-3 py-1.5 rounded-xl border-2 border-slate-900 bg-[#10b981] text-white font-black text-xs shadow-xs hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer" title="ดาวน์โหลดไฟล์ PDF ทันที">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>📥 ดาวน์โหลด PDF ทันที</span>
            </button>

            <button type="button" onclick="closeDailyReportModal()" class="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-100 border border-slate-300 text-slate-600 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-all ml-1" title="ปิดหน้าต่าง">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
        </header>

        <!-- Printable Document Canvas Scroll Area -->
        <main id="daily-report-printable-area" class="daily-page-container flex-1 overflow-y-auto">
          
          <!-- ============================================================= -->
          <!-- PAGE 1: รายงานการทำงานประจำวัน (ตามฟอร์มแสนสิริ)             -->
          <!-- ============================================================= -->
          <article id="dr-sheet-1" class="daily-a4-sheet">
            <!-- Injected by renderDailyReportPage1() -->
          </article>

          <!-- ============================================================= -->
          <!-- PAGE 2: หน้ารายงานเข็ม พร้อมตาราง LEDGER เปรียบเทียบ (Image 2) -->
          <!-- ============================================================= -->
          <article id="dr-sheet-2" class="daily-a4-sheet">
            <!-- Injected by renderDailyReportPage2() -->
          </article>

          <!-- ============================================================= -->
          <!-- PAGE 3+: แผ่นภาพถ่ายหน้างาน (6 ภาพพอดี 1 หน้า A4)               -->
          <!-- ============================================================= -->
          <div id="dr-photo-sheets-container" class="w-full flex flex-col items-center gap-6">
            <!-- Injected by renderDailyReportPhotoPages() -->
          </div>

        </main>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();
  }

  function renderDailyReportAll() {
    renderDailyReportPage1();
    renderDailyReportPage2();
    renderDailyReportPhotoPages();
    if (window.lucide) window.lucide.createIcons();
  }

  // =========================================================================
  // PAGE 1 BUILDER: SANSIRI DAILY WORK REPORT (Strict Height Fit for A4)
  // =========================================================================
  function renderDailyReportPage1() {
    const container = document.getElementById('dr-sheet-1');
    if (!container) return;

    const thaiDate = formatThaiDate(DailyReportState.date);

    const sumMgmt = DailyReportState.manpower.mgmt.reduce((acc, cur) => acc + (parseInt(cur.count, 10) || 0), 0);
    const sumWorkers = DailyReportState.manpower.workers.reduce((acc, cur) => acc + (parseInt(cur.count, 10) || 0), 0);
    const sumMachinery = DailyReportState.manpower.machinery.reduce((acc, cur) => acc + (parseInt(cur.count, 10) || 0), 0);

    const weatherItems = [
      { key: 'clear', label: 'แจ่มใส' },
      { key: 'overcast', label: 'เมฆปกคลุม' },
      { key: 'rain', label: 'ฝนตก' },
      { key: 'drizzle', label: 'ฝนตกปรอยๆ' },
      { key: 'heavy_rain', label: 'ฝนตกหนัก' },
      { key: 'other', label: 'อื่นๆ' }
    ];

    const permitItems = [
      { key: 'noisy', label: 'งานทำให้เกิดเสียงดัง' },
      { key: 'smelly', label: 'งานที่มีกลิ่น' },
      { key: 'dusty', label: 'งานที่เกี่ยวกับฝุ่น' },
      { key: 'none', label: 'ไม่มีข้อห้าม' },
      { key: 'other', label: 'อื่นๆ' }
    ];

    // Main Work Table: Automatically grouped by 8 Footings (F20A, F18A, F6, F3, F2, F5, F1, F8)
    let tasksRows = '';
    let totalQtyNum = 0;
    let totalDrivenNum = 0;

    for (let i = 0; i < 8; i++) {
      const t = DailyReportState.tasks[i] || { no: i + 1, title: '', location: '', qty: '', drivenQty: '', pct: '', remarks: '' };

      const qVal = parseInt((t.qty || '').replace(/[^\d]/g, ''), 10) || 0;
      const dVal = parseInt((t.drivenQty || '').replace(/[^\d]/g, ''), 10) || 0;
      totalQtyNum += qVal;
      totalDrivenNum += dVal;

      tasksRows += `
        <tr style="height: 22px;">
          <td class="text-center font-mono py-0.5 text-xs">${t.title ? (i + 1) : ''}</td>
          <td class="py-0.5 px-1.5"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-slate-900 text-xs font-bold" value="${escapeHtml(t.title)}" onchange="updateDrTask(${i}, 'title', this.value)"></td>
          <td class="text-center py-0.5"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-center text-slate-800 text-xs" value="${escapeHtml(t.location)}" onchange="updateDrTask(${i}, 'location', this.value)"></td>
          <td class="text-center py-0.5"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-center text-slate-800 text-xs font-mono" value="${escapeHtml(t.qty)}" onchange="updateDrTask(${i}, 'qty', this.value)"></td>
          <td class="text-center py-0.5"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-center text-slate-900 text-xs font-mono font-bold" value="${escapeHtml(t.drivenQty || '')}" onchange="updateDrTask(${i}, 'drivenQty', this.value)"></td>
          <td class="text-center font-mono font-black py-0.5 ${t.pct === '100%' ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-800'}"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-center text-xs font-mono font-black" value="${escapeHtml(t.pct)}" onchange="updateDrTask(${i}, 'pct', this.value)"></td>
          <td class="py-0.5 px-1.5"><input type="text" class="w-full bg-transparent border-0 outline-none p-0 text-slate-800 text-[11px]" value="${escapeHtml(t.remarks || '')}" onchange="updateDrTask(${i}, 'remarks', this.value)"></td>
        </tr>
      `;
    }

    const totalPctStr = totalQtyNum > 0 ? `${Math.round((totalDrivenNum / totalQtyNum) * 100)}%` : '0%';

    let mgmtRows = DailyReportState.manpower.mgmt.map((m, idx) => `
      <div class="flex items-center justify-between py-0.25 border-b border-slate-200">
        <span class="truncate pr-1 text-[10px] text-slate-800">${idx + 1}. ${m.label}</span>
        <div class="flex items-center gap-1 shrink-0">
          <input type="number" min="0" value="${m.count}" onchange="updateManpower('mgmt', ${idx}, this.value)" class="w-7 text-right font-mono font-black text-slate-900 bg-transparent border-0 outline-none p-0 pr-0.5 hover:bg-slate-100/60 focus:bg-amber-50 text-[11px]">
          <span class="text-[9px] text-slate-500">คน</span>
        </div>
      </div>
    `).join('');

    let workersRows = DailyReportState.manpower.workers.map((w, idx) => `
      <div class="flex items-center justify-between py-0.25 border-b border-slate-200">
        <span class="truncate pr-1 text-[10px] text-slate-800">${idx + 1}. ${w.label}</span>
        <div class="flex items-center gap-1 shrink-0">
          <input type="number" min="0" value="${w.count}" onchange="updateManpower('workers', ${idx}, this.value)" class="w-7 text-right font-mono font-black text-slate-900 bg-transparent border-0 outline-none p-0 pr-0.5 hover:bg-slate-100/60 focus:bg-amber-50 text-[11px]">
          <span class="text-[9px] text-slate-500">คน</span>
        </div>
      </div>
    `).join('');

    let machineryRows = DailyReportState.manpower.machinery.map((m, idx) => `
      <div class="flex items-center justify-between py-0.25 border-b border-slate-200">
        <span class="truncate pr-1 text-[10px] text-slate-800">${idx + 1}. ${m.label}</span>
        <div class="flex items-center gap-1 shrink-0">
          <input type="number" min="0" value="${m.count}" onchange="updateManpower('machinery', ${idx}, this.value)" class="w-7 text-right font-mono font-black text-slate-900 bg-transparent border-0 outline-none p-0 pr-0.5 hover:bg-slate-100/60 focus:bg-amber-50 text-[11px]">
          <span class="text-[9px] text-slate-500">${m.unit || 'คัน'}</span>
        </div>
      </div>
    `).join('');

    let materialsRows = DailyReportState.materials.map((mat, idx) => `
      <div class="flex items-center justify-between py-0.25 border-b border-slate-200 text-[10px]">
        <span class="truncate pr-1 text-slate-800 font-medium">${idx + 1}. ${mat.label}</span>
        <div class="flex items-center gap-1 shrink-0">
          <input type="number" min="0" value="${mat.count}" onchange="updateMaterialCount(${idx}, this.value)" class="w-8 text-right font-mono font-black text-slate-900 bg-transparent border-0 outline-none p-0 pr-0.5 hover:bg-slate-100/60 focus:bg-amber-50 text-[11px]">
          <span class="text-[9px] text-slate-500 font-bold">${mat.unit}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <!-- SANSIRI Logo & Header (Using exact Sansiri-logo-en-black) -->
      <div class="flex flex-col items-center justify-center mb-1.5">
        <div class="flex items-center justify-center gap-2 mb-0.5">
          <img src="${SANSIRI_LOGO_BASE64}" onerror="if(this.src!='Logo/png/Sansiri-logo-en-black.png')this.src='Logo/png/Sansiri-logo-en-black.png';" alt="SANSIRI" class="h-6 max-w-[170px] object-contain inline-block">
        </div>
        <div class="flex items-center justify-center gap-1 text-xs font-bold text-slate-900">
          <span>โครงการ</span>
          <input type="text" class="border-b border-dashed border-slate-400 font-black text-center px-1 text-slate-900 bg-transparent outline-none" value="${escapeHtml(DailyReportState.projectName)}" onchange="DailyReportState.projectName=this.value; renderDailyReportAll();">
        </div>
        <div class="w-full max-w-sm mt-0.5 border-2 border-slate-900 rounded-md py-0.5 px-3 text-center bg-white shadow-2xs">
          <h1 class="text-sm font-bold text-slate-900" style="font-family: 'Sarabun', 'Prompt', sans-serif !important; font-weight: 700; letter-spacing: 0;">รายงานการทำงานประจำวัน</h1>
        </div>
      </div>

      <!-- Top Information Strip -->
      <div class="border border-slate-900 text-[11px] p-2 mb-1.5 bg-white space-y-1.5 leading-normal">
        <div class="flex justify-between items-center">
          <div><span class="font-bold">ถึง :</span> บริษัท แสนสิริ จำกัด (มหาชน)</div>
          <div class="flex items-center gap-1">
            <span class="font-bold">วันที่ทำงาน :</span>
            <input type="text" class="border-b border-slate-400 font-bold px-1 text-center bg-transparent outline-none w-36" value="${escapeHtml(thaiDate)}" onchange="handleManualDateChange(this.value)">
          </div>
        </div>

        <div class="flex justify-between items-center pt-1 mt-0.5">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-[11.5px] shrink-0">เรียน :</span>
            <span contenteditable="true" tabindex="0" role="textbox" id="dr-recipient-input" class="border-b border-slate-400 font-bold px-1.5 text-slate-900 bg-transparent outline-none w-80 text-[12px] inline-block align-middle cursor-text" style="font-family: 'Sarabun', 'Prompt', sans-serif; line-height: 1.8; min-height: 28px; padding-top: 1px; padding-bottom: 1px;" onblur="DailyReportState.recipient=(this.innerText||'').trim() || 'คุณ วิสุทธิ์ จันทร์วัฒรังกูล'; autoDebouncedSaveSupabase();" onkeydown="if(event.key==='Enter'){event.preventDefault(); this.blur();}" oninput="DailyReportState.recipient=(this.innerText||'').trim();">${escapeHtml(DailyReportState.recipient || 'คุณ วิสุทธิ์ จันทร์วัฒรังกูล')}</span>
          </div>
        </div>

        <!-- Weather Checkboxes -->
        <div class="flex items-center flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
          <span class="font-bold shrink-0">อากาศ :</span>
          ${weatherItems.map(w => `
            <label class="inline-flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" ${DailyReportState.weather === w.key ? 'checked' : ''} onchange="DailyReportState.weather='${w.key}'; renderDailyReportPage1();" class="rounded border-slate-900 text-slate-900 focus:ring-0">
              <span>${w.label}</span>
            </label>
          `).join('')}
          <input type="text" placeholder="ระบุเพิ่มเติม..." class="border-b border-slate-300 text-[11px] px-1 outline-none w-28 bg-transparent" value="${escapeHtml(DailyReportState.weatherOther)}" onchange="DailyReportState.weatherOther=this.value">
        </div>

        <!-- Permit Restrictions Checkboxes -->
        <div class="flex items-center flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
          <span class="font-bold shrink-0">การระงับการทำงาน :</span>
          ${permitItems.map(p => `
            <label class="inline-flex items-center gap-1 cursor-pointer select-none">
              <input type="checkbox" ${DailyReportState.workPermit === p.key ? 'checked' : ''} onchange="DailyReportState.workPermit='${p.key}'; renderDailyReportPage1();" class="rounded border-slate-900 text-slate-900 focus:ring-0">
              <span>${p.label}</span>
            </label>
          `).join('')}
          <input type="text" placeholder="ระบุ..." class="border-b border-slate-300 text-[11px] px-1 outline-none w-24 bg-transparent" value="${escapeHtml(DailyReportState.workPermitOther)}" onchange="DailyReportState.workPermitOther=this.value">
        </div>

        <!-- Work Time & Attachments -->
        <div class="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-200">
          <div class="flex items-center gap-4">
            <div><span class="font-bold">เวลาเริ่มทำงาน :</span> <input type="text" id="dr-input-start-time" class="border-b border-slate-400 text-center w-20 outline-none" value="${DailyReportState.startTime}" onchange="handleWorkTimeChange('start', this.value)"></div>
            <div><span class="font-bold">เวลาเลิกงาน :</span> <input type="text" id="dr-input-end-time" class="border-b border-slate-400 text-center w-20 outline-none" value="${DailyReportState.endTime}" onchange="handleWorkTimeChange('end', this.value)"></div>
            <div><span class="font-bold">ระยะเวลาทำงาน :</span> <input type="text" id="dr-input-duration" class="border-b border-slate-400 text-center w-20 outline-none" value="${DailyReportState.duration}" onchange="DailyReportState.duration=this.value; autoDebouncedSaveSupabase();"></div>
          </div>
          <div>
            <span class="font-bold">เอกสารแนบจำนวน :</span>
            <input type="number" min="1" class="border-b border-slate-400 text-center w-10 font-bold outline-none" value="${DailyReportState.attachmentPages}" onchange="DailyReportState.attachmentPages=this.value">
            <span>แผ่น</span>
          </div>
        </div>
      </div>

      <!-- Main Work Table (Automatically Grouped by Footings) -->
      <div class="mb-1.5">
        <table class="dr-table">
          <thead>
            <tr>
              <th colspan="7" class="bg-slate-100 py-0.5 text-slate-900 text-xs px-2 text-center font-bold">
                รายการที่ดำเนินงานวันนี้
              </th>
            </tr>
            <tr class="bg-slate-50">
              <th class="w-8 py-0.5">ลำดับ</th>
              <th class="text-left pl-2 py-0.5">รายการ</th>
              <th class="w-20 py-0.5">สถานที่</th>
              <th class="w-16 py-0.5">ปริมาณ</th>
              <th class="w-24 py-0.5 text-center font-bold text-slate-900">ปริมาณที่กดไปแล้ว</th>
              <th class="w-20 py-0.5">% งานที่ทำเสร็จ</th>
              <th class="w-20 py-0.5 text-left pl-2">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${tasksRows}
            <tr class="bg-slate-100 font-bold border-t-2 border-slate-900" style="height: 22px;">
              <td colspan="3" class="text-center font-bold py-0.5 text-xs text-slate-900">รวม</td>
              <td class="text-center font-mono font-bold py-0.5 text-xs text-slate-900">${totalQtyNum} ต้น</td>
              <td class="text-center font-mono font-black py-0.5 text-xs text-slate-900">${totalDrivenNum} ต้น</td>
              <td class="text-center font-mono font-black py-0.5 text-xs ${totalPctStr === '100%' ? 'text-emerald-700 bg-emerald-50/50' : 'text-slate-900'}">${totalPctStr}</td>
              <td class="py-0.5 px-1.5 text-center text-[10px] text-slate-400"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3-Column Manpower & Machinery Section -->
      <div class="grid grid-cols-3 gap-2 border border-slate-900 p-1.5 mb-1.5 bg-white text-[10px]">
        
        <!-- Col 1: Management (ผู้จัดการ 1 คน, Staff 1 คน) -->
        <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between">
          <div>
            <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-slate-900 text-[10.5px]">1. เจ้าหน้าที่บริหาร / โครงการ</div>
            <div class="space-y-0.25">
              ${mgmtRows}
            </div>
          </div>
          <div class="flex justify-between items-center pt-0.5 mt-0.5 border-t border-slate-900 font-bold">
            <span>รวม</span>
            <span><span class="font-mono text-xs">${sumMgmt}</span> คน</span>
          </div>
        </div>

        <!-- Col 2: Workers & Subcontractors (Survey 2, คนงานกดเข็ม 4, ช่างไฟ 1, คนงานทั่วไป 2) -->
        <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between">
          <div>
            <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-slate-900 text-[10.5px]">2. ช่าง / ผู้รับเหมา / คนงาน</div>
            <div class="space-y-0.25">
              ${workersRows}
            </div>
          </div>
          <div class="flex justify-between items-center pt-0.5 mt-0.5 border-t border-slate-900 font-bold">
            <span>รวม</span>
            <span><span class="font-mono text-xs">${sumWorkers}</span> คน</span>
          </div>
        </div>

        <!-- Col 3: Machinery (เครื่องกดไฮดรอลิก 1 เครื่อง, โมบาย 25 ตัน 1 คัน) -->
        <div class="flex flex-col justify-between">
          <div>
            <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-slate-900 text-[10.5px]">3. เครื่องจักร / ยานพาหนะ</div>
            <div class="space-y-0.25">
              ${machineryRows}
            </div>
          </div>
          <div class="flex justify-between items-center pt-0.5 mt-0.5 border-t border-slate-900 font-bold">
            <span>รวม</span>
            <span><span class="font-mono text-xs">${sumMachinery}</span> รายการ</span>
          </div>
        </div>

      </div>

      <!-- Bottom Grid: Problems & Materials (เข็ม i40 ยาว 10m 10 ต้น, เข็ม i40 ยาว 7m 5 ต้น) -->
      <div class="grid grid-cols-2 gap-2 border border-slate-900 p-1.5 mb-1.5 text-[10.5px] bg-white">
        <!-- Left: Problems & Fixes -->
        <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between">
          <div class="mb-1">
            <span class="font-bold block mb-0.5 text-slate-900">ปัญหาและอุปสรรค :</span>
            <textarea class="w-full h-8 border border-slate-400 bg-white p-1 text-[10.5px] leading-tight outline-none resize-none font-medium" style="overflow: hidden; scrollbar-width: none; -ms-overflow-style: none;" onchange="DailyReportState.obstacles=this.value; autoDebouncedSaveSupabase();">${escapeHtml(DailyReportState.obstacles)}</textarea>
          </div>
          <div>
            <span class="font-bold block mb-0.5 text-slate-900">วิธีการแก้ไข :</span>
            <textarea class="w-full h-8 border border-slate-400 bg-white p-1 text-[10.5px] leading-tight outline-none resize-none font-medium" style="overflow: hidden; scrollbar-width: none; -ms-overflow-style: none;" onchange="DailyReportState.solutions=this.value; autoDebouncedSaveSupabase();">${escapeHtml(DailyReportState.solutions)}</textarea>
          </div>
        </div>

        <!-- Right: Materials on Site -->
        <div class="pl-1">
          <span class="font-bold block mb-0.5 text-slate-900">วัสดุ on-site :</span>
          <div class="space-y-0.25">
            ${materialsRows}
          </div>
        </div>
      </div>

      <!-- Footer Signatures (พร้อมระบบเพิ่มรูปภาพลายเซ็น) -->
      <div class="grid grid-cols-2 border border-slate-900 text-[10.5px] p-1.5 bg-white">
        <!-- Left Signature: รายงานโดย -->
        <div class="border-r border-slate-900 pr-2 space-y-0.5">
          <div><span class="font-bold">รายงานโดย :</span> บริษัท แสนสิริ จำกัด (มหาชน)</div>
          <div class="pt-0.5 flex items-center justify-between gap-1">
            <div class="flex items-center gap-2 flex-1">
              <span class="font-bold shrink-0">ลายเซ็น :</span>
              <div class="relative inline-flex items-center justify-center min-h-[34px] min-w-[120px] border-b border-slate-400">
                ${DailyReportState.authorSignatureImg ? `
                  <img src="${DailyReportState.authorSignatureImg}" alt="ลายเซ็นรายงานโดย" class="max-h-8 max-w-[130px] object-contain inline-block">
                ` : `
                  <span class="italic font-serif text-slate-900 px-2 font-bold text-xs">${escapeHtml(DailyReportState.author)}</span>
                `}
              </div>
            </div>
            <div class="daily-no-print flex items-center gap-1 shrink-0">
              <label class="cursor-pointer text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-300 transition-all flex items-center gap-1 shadow-2xs" title="คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น">
                <span>📷 เพิ่มรูป</span>
                <input type="file" accept="image/*" class="hidden" onchange="handleSignatureUpload('author', event)">
              </label>
              ${DailyReportState.authorSignatureImg ? `
                <button type="button" onclick="clearSignature('author')" class="text-[9.5px] text-rose-600 hover:text-rose-800 px-1 py-0.5" title="ลบรูปภาพ">✕</button>
              ` : ''}
            </div>
          </div>
          <div><span class="font-bold">ชื่อ :</span> ${DailyReportState.author}</div>
          <div><span class="font-bold">ตำแหน่ง :</span> ${DailyReportState.authorRole}</div>
          <div><span class="font-bold">วันที่ :</span> ${thaiDate}</div>
        </div>

        <!-- Right Signature: ทบทวนโดย -->
        <div class="pl-2 space-y-0.5">
          <div><span class="font-bold">ทบทวนโดย :</span> บริษัท แสนสิริ จำกัด (มหาชน)</div>
          <div class="pt-0.5 flex items-center justify-between gap-1">
            <div class="flex items-center gap-2 flex-1">
              <span class="font-bold shrink-0">ลายเซ็น :</span>
              <div class="relative inline-flex items-center justify-center min-h-[34px] min-w-[120px] border-b border-slate-400">
                ${DailyReportState.reviewerSignatureImg ? `
                  <img src="${DailyReportState.reviewerSignatureImg}" alt="ลายเซ็นทบทวนโดย" class="max-h-8 max-w-[130px] object-contain inline-block">
                ` : `
                  <span class="italic font-serif text-blue-700 px-2 font-bold text-xs">${escapeHtml(DailyReportState.reviewer)}</span>
                `}
              </div>
            </div>
            <div class="daily-no-print flex items-center gap-1 shrink-0">
              <label class="cursor-pointer text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-300 transition-all flex items-center gap-1 shadow-2xs" title="คลิกเพื่อเลือกไฟล์รูปภาพลายเซ็น">
                <span>📷 เพิ่มรูป</span>
                <input type="file" accept="image/*" class="hidden" onchange="handleSignatureUpload('reviewer', event)">
              </label>
              ${DailyReportState.reviewerSignatureImg ? `
                <button type="button" onclick="clearSignature('reviewer')" class="text-[9.5px] text-rose-600 hover:text-rose-800 px-1 py-0.5" title="ลบรูปภาพ">✕</button>
              ` : ''}
            </div>
          </div>
          <div><span class="font-bold">ชื่อ :</span> ${DailyReportState.reviewer}</div>
          <div><span class="font-bold">ตำแหน่ง :</span> ${DailyReportState.reviewerRole}</div>
          <div><span class="font-bold">วันที่ :</span> ${thaiDate}</div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PAGE 2 BUILDER: PILING PROGRESS REPORT (With Image 2 LEDGER Table)
  // =========================================================================
  function renderDailyReportPage2() {
    const container = document.getElementById('dr-sheet-2');
    if (!container) return;

    const curDate = DailyReportState.date;
    const pilesDb = window.__PILES_DB__ || [];
    const progressRecs = getProgressRecords();

    let drivenCount = 0;
    let todayCount = 0;
    const todayPilesList = [];

    pilesDb.forEach(p => {
      const rec = progressRecs[p.no];
      if (rec && rec.status === 'driven') {
        if (!rec.date || rec.date <= curDate) {
          drivenCount++;
        }
        if (rec.date === curDate) {
          todayCount++;
          todayPilesList.push({ pile: p, rec: rec });
        }
      }
    });

    const drivenRecords = Object.values(progressRecs).filter(r => r && r.status === 'driven');
    const uniqueDates = [...new Set(drivenRecords.map(r => r.date))].filter(Boolean).sort();
    const projectStartDate = (uniqueDates.length > 0) ? uniqueDates[0] : '2026-10-06';
    
    // Complete 31-day working schedule
    const workingDaysSchedule = getWorkingDaysSchedule(projectStartDate, 31);

    let elapsedDays = 1;
    if (curDate >= projectStartDate) {
      elapsedDays = workingDaysSchedule.filter(d => d <= curDate).length;
    }
    elapsedDays = Math.min(31, Math.max(1, elapsedDays));
    const planCumCount = Math.min(elapsedDays * 3, 93);
    const variance = drivenCount - planCumCount;
    const varianceText = variance > 0 ? `เร็วกว่าแผน +${variance} ต้น` : (variance < 0 ? `ช้ากว่าแผน ${Math.abs(variance)} ต้น` : `ตามแผนงาน (0 ต้น)`);
    const pct = ((drivenCount / 93) * 100).toFixed(1);

    // =========================================================================
    // BUILD IMAGE 2 COMPARISON TABLE (LEDGER - Plan 3 ต้น/วันทำการ vs Actual)
    // =========================================================================
    const activeIdx = workingDaysSchedule.indexOf(curDate);
    const targetIdx = (activeIdx >= 0) ? activeIdx : 12;

    // Window of 18 days (e.g. 10 ต.ค. to 2 พ.ย. when active is 21 ต.ค.)
    const numCols = 18;
    const startIdx = Math.max(0, Math.min(targetIdx - 8, workingDaysSchedule.length - numCols));
    const visibleDays = workingDaysSchedule.slice(startIdx, startIdx + numCols);

    let dateHeaders = '';
    let planRow = '';
    let actualRow = '';
    let cumPlanRow = '';
    let cumActualRow = '';

    visibleDays.forEach((schedDate, relIdx) => {
      const isCur = (schedDate === curDate);
      const isFuture = (schedDate > curDate);
      const fullDayIdx = startIdx + relIdx;
      const dayPlan = 3;
      const runningPlanCum = Math.min(93, (fullDayIdx + 1) * 3);

      const dayActual = drivenRecords.filter(r => r.date === schedDate).length;
      const cumActual = drivenRecords.filter(r => r.date && r.date <= schedDate).length;

      const dateFormatted = formatThaiDayMonth(schedDate);
      const colClass = isCur ? 'active-col' : '';

      dateHeaders += `
        <th class="p-1 border border-slate-700 font-bold text-center select-none ${colClass}" title="วันที่ ${schedDate}">
          ${dateFormatted}
        </th>
      `;

      planRow += `
        <td class="p-1 border border-slate-700 font-mono text-center text-slate-800 ${colClass}">
          ${dayPlan} <span class="text-[8px] font-sans text-slate-500">ต้น</span>
        </td>
      `;

      if (isFuture) {
        actualRow += `<td class="p-1 border border-slate-700 ${colClass}"></td>`;
      } else {
        actualRow += `
          <td class="p-1 border border-slate-700 font-mono text-center font-bold text-slate-900 ${colClass}">
            ${dayActual} <span class="text-[8px] font-sans text-slate-500">ต้น</span>
          </td>
        `;
      }

      cumPlanRow += `
        <td class="p-1 border border-slate-700 font-mono text-center font-bold text-slate-800 ${colClass}">
          ${runningPlanCum} <span class="text-[8px] font-sans text-slate-500">ต้น</span>
        </td>
      `;

      if (isFuture) {
        cumActualRow += `<td class="p-1 border border-slate-700 ${colClass}"></td>`;
      } else {
        cumActualRow += `
          <td class="p-1 border border-slate-700 font-mono text-center font-black text-emerald-800 ${colClass}">
            ${cumActual} <span class="text-[8px] font-sans text-emerald-700 font-semibold">ต้น</span>
          </td>
        `;
      }
    });

    // Build Today's Pressed Piles Log Rows
    let pilesLogRows = '';
    if (todayPilesList.length === 0) {
      pilesLogRows = `
        <tr>
          <td colspan="12" class="p-2 text-center text-slate-500 italic border border-slate-700 text-[10px]">
            ไม่มีรายการเสาเข็มที่กดในวันที่รายงาน (${curDate})
          </td>
        </tr>
      `;
    } else {
      todayPilesList.forEach((item, idx) => {
        const p = item.pile;
        const r = item.rec;
        const targetN = p.targetCo?.y ? p.targetCo.y.toFixed(3) : '-';
        const targetE = p.targetCo?.x ? p.targetCo.x.toFixed(3) : '-';
        const actualN = r.actualCo?.y ? r.actualCo.y.toFixed(3) : '-';
        const actualE = r.actualCo?.x ? r.actualCo.x.toFixed(3) : '-';
        const dn = (r.actualCo?.y && p.targetCo?.y) ? (r.actualCo.y - p.targetCo.y).toFixed(3) : '-';
        const de = (r.actualCo?.x && p.targetCo?.x) ? (r.actualCo.x - p.targetCo.x).toFixed(3) : '-';
        const pco = p.targetTop ? p.targetTop.toFixed(3) : '-';
        const actualTop = r.actualTop ? r.actualTop.toFixed(3) : '-';
        const diffTop = (r.actualTop && p.targetTop) ? (r.actualTop - p.targetTop).toFixed(3) : '-';

        pilesLogRows += `
          <tr class="text-[9.5px]">
            <td class="border border-slate-700 p-1 text-center font-mono">${idx + 1}</td>
            <td class="border border-slate-700 p-1 font-bold text-center">${p.pileId}</td>
            <td class="border border-slate-700 p-1 text-center">${p.footing || '-'}</td>
            <td class="border border-slate-700 p-1 text-center font-mono">${p.grid || '-'}</td>
            <td class="border border-slate-700 p-1 text-right font-mono text-[9px]">${targetN}, ${targetE}</td>
            <td class="border border-slate-700 p-1 text-right font-mono text-[9px] font-bold">${actualN}, ${actualE}</td>
            <td class="border border-slate-700 p-1 text-center font-mono text-[9px]">${dn}, ${de}</td>
            <td class="border border-slate-700 p-1 text-right font-mono">${pco}</td>
            <td class="border border-slate-700 p-1 text-right font-mono font-bold">${actualTop}</td>
            <td class="border border-slate-700 p-1 text-center font-mono">${diffTop}</td>
            <td class="border border-slate-700 p-1 text-center text-[9px]">I-0.40m</td>
            <td class="border border-slate-700 p-1 text-center font-mono text-[9px]">${r.date || curDate}</td>
          </tr>
        `;
      });
    }

    container.innerHTML = `
      <!-- Header: Clean Rectangular Frame (Monochrome) -->
      <div class="border-2 border-black p-2 mb-2 bg-white">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-[11px] font-bold text-slate-800">โครงการ PYNN PRIDI 37 (ซอยปรีดี พนมยงค์ 37)</div>
            <h2 class="text-sm font-black text-black">รายงานความคืบหน้างานเสาเข็ม (Piling Progress Report)</h2>
          </div>
          <div class="text-right">
            <div class="text-xs font-bold text-slate-800">วันที่รายงาน : <span class="font-mono font-black">${curDate}</span></div>
            <div class="text-[10px] text-slate-600 font-mono">เสาเข็มไอไมโครไพล์ รวม 93 ต้น</div>
          </div>
        </div>
      </div>

      <!-- KPI Summary Table: Simple Rectangular B&W Grid -->
      <table class="w-full border-collapse border border-black text-[11px] text-center font-bold mb-2 bg-white">
        <thead>
          <tr class="bg-slate-100">
            <th class="border border-black p-1 w-1/4">แผนวันนี้ / กดแล้ว</th>
            <th class="border border-black p-1 w-1/4">แผนสะสม (${elapsedDays}/31 วัน)</th>
            <th class="border border-black p-1 w-1/4">กดจริงสะสม</th>
            <th class="border border-black p-1 w-1/4">สถานะเทียบแผนงาน</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-black p-1.5 font-mono text-xs">
              แผน 3 ต้น | <span class="font-black text-black">กดแล้ว ${todayCount} ต้น</span>
            </td>
            <td class="border border-black p-1.5 font-mono text-xs">
              <span class="font-black text-black">${planCumCount}</span> ต้น
            </td>
            <td class="border border-black p-1.5 font-mono text-xs">
              <span class="font-black text-black">${drivenCount}/93</span> (${pct}%)
            </td>
            <td class="border border-black p-1.5 font-mono text-xs font-black">
              ${varianceText}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Piling Progress Plan Snapshot (Crisp Architectural Blueprint - Image 2) -->
      <div class="border border-black mb-1.5 bg-white">
        <div class="bg-slate-100 border-b border-black px-2.5 py-0.5 flex items-center justify-between text-[11px] font-black">
          <span>แผนผังความคืบหน้างานเสาเข็ม (Piling Progress Plan)</span>
          <div class="flex items-center gap-4 text-[10.5px]">
            <span class="inline-flex items-center gap-1.5 font-bold text-sky-700"><span class="w-3 h-3 rounded-full bg-[#0284c7] inline-block border border-sky-800 shadow-2xs"></span> ★ กดวันนี้</span>
            <span class="inline-flex items-center gap-1.5 font-bold text-emerald-800"><span class="w-3 h-3 rounded-full bg-[#10b981] inline-block border border-emerald-800 shadow-2xs"></span> ⚫ กดแล้ว</span>
            <span class="inline-flex items-center gap-1.5 font-bold text-slate-800"><span class="w-3 h-3 rounded-full bg-white inline-block border-1.5 border-black shadow-2xs"></span> ○ รอกด</span>
          </div>
        </div>
        <div class="p-1 flex items-center justify-center bg-white" style="height: 245px;">
          <canvas id="drPlanCanvas" class="w-full h-[240px] block object-contain" width="1200" height="490"></canvas>
        </div>
      </div>

      <!-- S-Curve Progress Graph (กราฟความคืบหน้าสะสม Plan vs Actual) -->
      <div class="border border-slate-700 rounded-lg overflow-hidden mb-1.5 bg-white shadow-xs">
        <div class="bg-slate-100 border-b border-slate-700 px-2.5 py-0.5 flex items-center justify-between text-[11px] font-black">
          <span class="text-slate-900">กราฟความคืบหน้าสะสมงานเสาเข็ม (Accumulated Progress S-Curve: Plan vs Actual)</span>
          <span class="text-[10px] text-slate-600 font-normal">เกณฑ์แผนงาน 3 ต้น/วันทำการ (รวม 93 ต้น)</span>
        </div>
        <div class="p-1.5 flex items-center justify-center bg-white" style="height: 240px;">
          <canvas id="drProgressChartCanvas" class="w-full h-full block" width="1160" height="460"></canvas>
        </div>
      </div>

      <!-- EXACT IMAGE 2 COMPARISON TABLE: Plan 3 ต้น/วันทำการ vs Actual (ภาพที่ 3: ไม่ใส่ LEDGER, วันที่ปัจจุบัน, เลื่อนตาราง) -->
      <div class="border border-slate-700 rounded-lg overflow-hidden mb-1.5 bg-white shadow-xs">
        <div class="bg-white px-2.5 py-1 border-b border-slate-700 flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-900">ตารางเปรียบเทียบแผนงานรายวันและสะสม (Plan 3 ต้น/วันทำการ vs Actual)</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="piling-daily-table w-full text-center border-collapse text-[10px]">
            <thead>
              <tr>
                <th class="p-1 border border-slate-700 sticky-col font-black tracking-wider text-center text-slate-900 bg-[#fceee7]">DATE</th>
                ${dateHeaders}
              </tr>
            </thead>
            <tbody>
              <tr class="row-plan">
                <td class="p-1 border border-slate-700 sticky-col font-bold text-slate-900 bg-white">PLAN</td>
                ${planRow}
              </tr>
              <tr class="row-actual">
                <td class="p-1 border border-slate-700 sticky-col font-bold text-slate-900 bg-[#f8fafc]">ACTUAL</td>
                ${actualRow}
              </tr>
              <tr class="row-accum-plan">
                <td class="p-1 border border-slate-700 sticky-col font-black text-slate-900 bg-[#e2e8f0]">Accumulated PLAN</td>
                ${cumPlanRow}
              </tr>
              <tr class="row-accum-actual">
                <td class="p-1 border border-slate-700 sticky-col font-black text-emerald-950 bg-[#d1fae5]">Accumulated ACTUAL</td>
                ${cumActualRow}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Today's Pressed Piles Log Table -->
      <div class="border border-slate-700 rounded-lg overflow-hidden bg-white shadow-xs">
        <div class="bg-slate-100 border-b border-slate-700 px-2.5 py-1 text-xs font-bold flex justify-between items-center">
          <span class="text-slate-900">รายการเสาเข็มที่กดในวันที่รายงาน (Daily Pressed Piles Log)</span>
          <span class="font-mono font-black text-slate-800">${todayCount} ต้น</span>
        </div>
        <div class="overflow-x-auto">
          <table class="dr-piling-table">
            <thead>
              <tr class="bg-slate-50 text-[9.5px]">
                <th class="w-7">No.</th>
                <th>รหัสเข็ม (ID)</th>
                <th>ฐานราก</th>
                <th>ตำแหน่งกริด</th>
                <th>Co (N, E) แบบ (m)</th>
                <th>Co (n,e) หลังกด (m)</th>
                <th>ผลต่าง (Δn, Δe)</th>
                <th>ระดับ PCO (แบบ)</th>
                <th>ระดับ TOP จริง (m)</th>
                <th>ผลต่าง (ม.)</th>
                <th>ชนิดเข็ม</th>
                <th>วันที่กด</th>
              </tr>
            </thead>
            <tbody>
              ${pilesLogRows}
            </tbody>
          </table>
        </div>
      </div>
    `;

    setTimeout(() => {
      renderDailyPilingPlanMonochrome();
      renderDailyProgressChart();
    }, 60);
  }

  
  // Render S-Curve Progress Chart onto drProgressChartCanvas (มีเส้นและมีจุดเหมือนในเว็บ ขยายขนาดเต็มพื้นที่)
  function renderDailyProgressChart() {
    const canvas = document.getElementById('drProgressChartCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width || 1160;
    const h = canvas.height || 460;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    const padL = 55, padR = 25, padT = 36, padB = 40;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const maxY = 95;

    const curDate = DailyReportState.date;
    const progressRecs = getProgressRecords();
    const drivenRecords = Object.values(progressRecs).filter(r => r && r.status === 'driven');
    const uniqueDates = [...new Set(drivenRecords.map(r => r.date))].filter(Boolean).sort();
    const projectStartDate = (uniqueDates.length > 0) ? uniqueDates[0] : '2026-10-06';
    const schedule = getWorkingDaysSchedule(projectStartDate, 31);

    // Plan array: [3, 6, 9, ..., 93]
    const planData = schedule.map((_, idx) => Math.min(93, (idx + 1) * 3));

    // Actual array up to curDate
    const actualData = [];
    for (let i = 0; i < schedule.length; i++) {
      const sDate = schedule[i];
      if (sDate <= curDate) {
        const count = drivenRecords.filter(r => r.date && r.date <= sDate).length;
        actualData.push(count);
      } else {
        break;
      }
    }

    // Y-Grid & Labels (เส้นตารางแนวนอน)
    ctx.font = 'bold 11.5px Montserrat, Sarabun, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let yVal = 0; yVal <= 90; yVal += 15) {
      const py = padT + plotH - (yVal / maxY) * plotH;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, py);
      ctx.lineTo(w - padR, py);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillText(yVal + ' ต้น', padL - 8, py);
    }

    // X-Axis Grid & Labels (วันทำการ D1, D5, D10, D15, D20, D25, D31 เหมือนในเว็บ)
    ctx.font = 'bold 10px Montserrat, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const markedIndices = [0, 4, 9, 14, 19, 24, 30]; // D1, D5, D10, D15, D20, D25, D31
    markedIndices.forEach(idx => {
      if (idx < schedule.length) {
        const px = padL + (idx / (schedule.length - 1)) * plotW;
        ctx.strokeStyle = '#f1f5f9';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, padT);
        ctx.lineTo(px, padT + plotH);
        ctx.stroke();

        ctx.fillStyle = '#64748b';
        ctx.fillText('D' + (idx + 1), px, padT + plotH + 5);

        // วันที่แบบย่อ
        const sDate = schedule[idx];
        const sParts = sDate.split('-');
        if (sParts.length === 3) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '9px Montserrat, Sarabun, sans-serif';
          ctx.fillText(parseInt(sParts[2], 10) + '/' + parseInt(sParts[1], 10), px, padT + plotH + 18);
          ctx.font = 'bold 10px Montserrat, Sarabun, sans-serif';
        }
      }
    });

    // 1. Plan Line (เส้นประสีส้ม/แดง พร้อมจุดกลมสีส้มทุกวันทำการ D1..D31 เหมือนในเว็บ)
    ctx.strokeStyle = '#ed6845';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < planData.length; i++) {
      const px = padL + (i / (planData.length - 1)) * plotW;
      const py = padT + plotH - (planData[i] / maxY) * plotH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // วาดจุดกลมสีส้มบนเส้นแผนงาน
    for (let i = 0; i < planData.length; i++) {
      const px = padL + (i / (planData.length - 1)) * plotW;
      const py = padT + plotH - (planData[i] / maxY) * plotH;
      ctx.fillStyle = '#ed6845';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Actual Line with Fill & Points (เส้นทึบสีเขียวพร้อมแถบสีโปร่งแสงและจุดกลมสีเขียวขอบเข้ม เหมือนในเว็บ)
    if (actualData.length > 0) {
      // Area Fill
      ctx.beginPath();
      for (let i = 0; i < actualData.length; i++) {
        const px = padL + (i / (planData.length - 1)) * plotW;
        const py = padT + plotH - (actualData[i] / maxY) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      const lastPx = padL + ((actualData.length - 1) / (planData.length - 1)) * plotW;
      ctx.lineTo(lastPx, padT + plotH);
      ctx.lineTo(padL, padT + plotH);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.fill();

      // Solid emerald line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3.6;
      ctx.beginPath();
      for (let i = 0; i < actualData.length; i++) {
        const px = padL + (i / (planData.length - 1)) * plotW;
        const py = padT + plotH - (actualData[i] / maxY) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // วาดจุดกลมสีเขียวขอบเข้มทุกจุดผลงานจริง
      for (let i = 0; i < actualData.length; i++) {
        const px = padL + (i / (planData.length - 1)) * plotW;
        const py = padT + plotH - (actualData[i] / maxY) * plotH;
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#064e3b';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // จุดวันปัจจุบัน (Current Day Pulse Highlight) พร้อมป้ายแสดงยอดสะสม
      const curIdx = actualData.length - 1;
      const curPx = padL + (curIdx / (planData.length - 1)) * plotW;
      const curPy = padT + plotH - (actualData[curIdx] / maxY) * plotH;

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(curPx, curPy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Badge ป้ายบอกยอดสะสม
      const labelText = actualData[curIdx] + ' ต้น';
      ctx.font = 'bold 11px Montserrat, Sarabun, sans-serif';
      const badgeW = ctx.measureText(labelText).width + 12;
      const badgeH = 18;
      const badgeX = curPx - badgeW / 2;
      const badgeY = curPy - 24;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, curPx, badgeY + badgeH / 2);
    }

    // แถบคำอธิบาย Legend ด้านบน (สอดคล้องกับในเว็บ)
    ctx.font = 'bold 11.5px Sarabun, Montserrat, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 1. Plan Legend (เส้นประ + จุดส้ม)
    ctx.strokeStyle = '#ed6845';
    ctx.lineWidth = 2.6;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(padL + 15, 14);
    ctx.lineTo(padL + 35, 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ed6845';
    ctx.beginPath();
    ctx.arc(padL + 25, 14, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillText('แผนงานสะสม (3 ต้น/วันทำการ)', padL + 42, 14);

    // 2. Actual Legend (เส้นทึบเขียว + จุดเขียว)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(padL + 220, 14);
    ctx.lineTo(padL + 245, 14);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(padL + 232, 14, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.fillText('ผลงานจริงสะสม (Actual)', padL + 252, 14);

    // 3. Current Day Legend (จุดฟ้า)
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(padL + 415, 14, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0369a1';
    ctx.fillText('วันที่รายงานปัจจุบัน', padL + 426, 14);
  }

  // Draw Architectural Plan onto drPlanCanvas (Exactly matches Image 2)
  function renderDailyPilingPlanMonochrome() {
    const canvas = document.getElementById('drPlanCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width || 1200;
    const h = canvas.height || 420;

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // 1. Direct WebGL Top-Down Render if available
    if (window.currentModel && window.renderer && window.orthoCamera && window.scene) {
      try {
        const prevSize = new THREE.Vector2();
        window.renderer.getSize(prevSize);
        const prevRatio = window.renderer.getPixelRatio();
        const prevCam = window.activeCamera;

        window.renderer.setSize(w, h, false);
        window.renderer.setPixelRatio(1);

        const centerX = 16.85;
        const centerY = 8.30;
        const spanX = 46.5;
        const spanY = 23.8;
        const canvasAspect = w / h;
        let camW, camH;
        if (canvasAspect > spanX / spanY) {
          camH = spanY;
          camW = spanY * canvasAspect;
        } else {
          camW = spanX;
          camH = spanX / canvasAspect;
        }

        window.orthoCamera.left = -camW / 2;
        window.orthoCamera.right = camW / 2;
        window.orthoCamera.top = camH / 2;
        window.orthoCamera.bottom = -camH / 2;
        window.orthoCamera.updateProjectionMatrix();
        window.orthoCamera.position.set(centerX, centerY, 80);
        window.orthoCamera.up.set(0, 1, 0);
        window.orthoCamera.lookAt(centerX, centerY, 0);

        if (typeof window.updatePileMeshVisuals === 'function') window.updatePileMeshVisuals();
        window.renderer.render(window.scene, window.orthoCamera);

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(window.renderer.domElement, 0, 0, w, h);

        window.renderer.setSize(prevSize.x, prevSize.y, false);
        window.renderer.setPixelRatio(prevRatio);
        if (prevCam) window.activeCamera = prevCam;
        return;
      } catch (err) {
        console.warn('3D top-down snapshot error, falling back to 2D vector CAD:', err);
      }
    }

    // 2. High-Precision 2D CAD Blueprint Vector Render (Image 2)
    const minX = -6.2, maxX = 39.8;
    const minY = -3.4, maxY = 20.0;
    const spanX = maxX - minX;
    const spanY = maxY - minY;

    const padX = 14;
    const padY = 12;
    const availW = Math.max(80, w - padX * 2);
    const availH = Math.max(80, h - padY * 2);
    const scale = Math.min(availW / spanX, availH / spanY);

    const drawW = spanX * scale;
    const drawH = spanY * scale;
    const offsetX = padX + (availW - drawW) / 2;
    const offsetY = padY + (availH - drawH) / 2;

    const mapX = (x) => offsetX + (x - minX) * scale;
    const mapY = (y) => h - (offsetY + (y - minY) * scale); // North UP!

    // 1. Draw Property Boundary Line (เส้นขอบเขตที่ดินสีแดงขีดประ)
    const boundaryPolygon = [
      [-2.596, 17.223],
      [36.546, 16.713],
      [37.852, -2.495],
      [-4.060, -2.495]
    ];

    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = Math.max(1.6, scale * 0.08);
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    boundaryPolygon.forEach(([bx, by], idx) => {
      const px = mapX(bx);
      const py = mapY(by);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // Boundary Pins Circles & Labels (หมุดรังวัดสีแดง)
    const pins = [
      { label: 'n114250', x: -2.596, y: 17.223, dx: -8, dy: -6, align: 'right' },
      { label: 'n117402', x: 36.546, y: 16.713, dx: 8, dy: -6, align: 'left' },
      { label: 'n115372', x: 37.852, y: -2.495, dx: 8, dy: 3, align: 'left' },
      { label: 'n115816', x: 4.490, y: -2.495, dx: 0, dy: 14, align: 'center' },
      { label: 'ปร', x: -4.060, y: -2.495, dx: -8, dy: 3, align: 'right' }
    ];

    const pinRadius = Math.max(3.8, Math.min(5.2, scale * 0.2));
    pins.forEach(pin => {
      const px = mapX(pin.x);
      const py = mapY(pin.y);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(px, py, pinRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#991b1b';
      ctx.font = `bold ${Math.max(9, Math.min(11, scale * 0.44))}px Montserrat, Sarabun, sans-serif`;
      ctx.textAlign = pin.align;
      ctx.textBaseline = 'middle';
      ctx.fillText(pin.label, px + pin.dx, py + pin.dy);
    });

    // Property Boundary Dimension Labels (ระยะขอบเขตที่ดินทั้ง 4 ด้านตามภาพ 2)
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 0.8;
    ctx.font = `bold ${Math.max(11, Math.min(14.5, scale * 0.58))}px Arial, Tahoma, Montserrat, Sarabun, sans-serif`;

    // Top: 39.15 m
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.strokeText('39.15 m', mapX(17.0), mapY(17.1) - 6);
    ctx.fillText('39.15 m', mapX(17.0), mapY(17.1) - 6);

    // Bottom: 41.91 m
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.strokeText('41.91 m', mapX(18.0), mapY(-2.55) + 6);
    ctx.fillText('41.91 m', mapX(18.0), mapY(-2.55) + 6);

    // Left: 19.77 m
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.strokeText('19.77 m', mapX(-4.2) - 6, mapY(7.35));
    ctx.fillText('19.77 m', mapX(-4.2) - 6, mapY(7.35));

    // Right: 19.25 m (SOI PRID)
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.strokeText('19.25 m (SOI PRID)', mapX(38.0) + 8, mapY(7.15));
    ctx.fillText('19.25 m (SOI PRID)', mapX(38.0) + 8, mapY(7.15));

    // 2. Draw Grid Lines & Distinct CAD Bubbles
    const gridX = [
      { name: '1', x: 0.00 }, { name: '2', x: 0.50 }, { name: '3', x: 5.70 },
      { name: '4', x: 10.85 }, { name: '5', x: 12.20 }, { name: '6', x: 20.00 },
      { name: '7', x: 27.50 }, { name: '8', x: 29.45 }, { name: '9', x: 32.70 },
      { name: '10', x: 32.90 }
    ];

    const gridY = [
      { name: 'A', y: 12.40 }, { name: 'B', y: 5.20 }, { name: 'C', y: 3.50 },
      { name: 'D', y: 1.30 }, { name: 'E', y: 0.00 }
    ];

    const yTopGrid = mapY(18.2);
    const yBotGrid = mapY(-1.2);

    gridX.forEach(g => {
      const gx = mapX(g.x);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(gx, yTopGrid);
      ctx.lineTo(gx, yBotGrid);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Top Bubbles
    const topBubbles = [
      { name: '1', x: 0.00, dy: 0 },
      { name: '3', x: 5.70, dy: 0 },
      { name: '4', x: 10.85, dy: 0 },
      { name: '5', x: 12.20, dy: 0 },
      { name: '6', x: 20.00, dy: 0 },
      { name: '7', x: 27.50, dy: 0 },
      { name: '8', x: 29.45, dy: 0 },
      { name: '9', x: 32.70, dy: 0 }
    ];

    const bubbleRadius = Math.max(8.5, Math.min(11.5, scale * 0.44));
    topBubbles.forEach(b => {
      const bx = mapX(b.x);
      const by = yTopGrid - bubbleRadius - 2 + (b.dy || 0);

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, bubbleRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = `bold ${Math.max(8, bubbleRadius * 0.9)}px Montserrat, Sarabun, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.name, bx, by);
    });

    // Top Dimension Lines
    const dimY1 = yTopGrid - bubbleRadius * 2 - 14;
    const dimY2 = dimY1 - 14;
    ctx.strokeStyle = '#0891b2';
    ctx.fillStyle = '#0891b2';
    ctx.lineWidth = 1;
    ctx.font = 'bold 9.5px Montserrat, Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    const topSegments = [
      { x1: 0.00, x2: 0.50, val: '0.90' },
      { x1: 0.50, x2: 5.70, val: '5.20' },
      { x1: 5.70, x2: 10.85, val: '5.15' },
      { x1: 10.85, x2: 12.20, val: '1.35' },
      { x1: 12.20, x2: 20.00, val: '7.80' },
      { x1: 20.00, x2: 27.50, val: '7.50' },
      { x1: 27.50, x2: 29.45, val: '1.95' },
      { x1: 29.45, x2: 32.70, val: '3.25' }
    ];

    topSegments.forEach(seg => {
      const p1 = mapX(seg.x1);
      const p2 = mapX(seg.x2);
      ctx.beginPath();
      ctx.moveTo(p1, dimY1 + 3);
      ctx.lineTo(p1, dimY1 - 3);
      ctx.moveTo(p1, dimY1);
      ctx.lineTo(p2, dimY1);
      ctx.moveTo(p2, dimY1 + 3);
      ctx.lineTo(p2, dimY1 - 3);
      ctx.stroke();
      if (p2 - p1 > 14) {
        ctx.fillText(seg.val, (p1 + p2) / 2, dimY1 - 2);
      }
    });

    // Total Top Dimension: 32.90
    const startTop = mapX(0.00);
    const endTop = mapX(32.90);
    ctx.beginPath();
    ctx.moveTo(startTop, dimY2 + 3);
    ctx.lineTo(startTop, dimY2 - 3);
    ctx.moveTo(startTop, dimY2);
    ctx.lineTo(endTop, dimY2);
    ctx.moveTo(endTop, dimY2 + 3);
    ctx.lineTo(endTop, dimY2 - 3);
    ctx.stroke();
    ctx.fillText('32.90', (startTop + endTop) / 2, dimY2 - 2);

    // Horizontal Grids & Left Dimensions
    const xLeftGrid = mapX(-2.5);
    const xRightGrid = mapX(35.0);

    gridY.forEach(g => {
      const gy = mapY(g.y);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(xLeftGrid, gy);
      ctx.lineTo(xRightGrid, gy);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    const dimX1 = xLeftGrid - 18;
    const dimX2 = dimX1 - 16;
    ctx.strokeStyle = '#0891b2';
    ctx.fillStyle = '#0891b2';
    ctx.lineWidth = 1;
    ctx.font = 'bold 9px Montserrat, Sarabun, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const leftSegments = [
      { y1: 12.40, y2: 5.20, val: '7.20' },
      { y1: 5.20, y2: 3.50, val: '1.70' },
      { y1: 3.50, y2: 1.30, val: '2.20' },
      { y1: 1.30, y2: 0.00, val: '1.30' }
    ];

    leftSegments.forEach(seg => {
      const py1 = mapY(seg.y1);
      const py2 = mapY(seg.y2);
      ctx.beginPath();
      ctx.moveTo(dimX1 - 3, py1);
      ctx.lineTo(dimX1 + 3, py1);
      ctx.moveTo(dimX1, py1);
      ctx.lineTo(dimX1, py2);
      ctx.moveTo(dimX1 - 3, py2);
      ctx.lineTo(dimX1 + 3, py2);
      ctx.stroke();
      ctx.fillText(seg.val, dimX1 - 5, (py1 + py2) / 2);
    });

    // Total Left Dimension: 12.40
    const startLeftY = mapY(12.40);
    const endLeftY = mapY(0.00);
    ctx.beginPath();
    ctx.moveTo(dimX2 - 3, startLeftY);
    ctx.lineTo(dimX2 + 3, startLeftY);
    ctx.moveTo(dimX2, startLeftY);
    ctx.lineTo(dimX2, endLeftY);
    ctx.moveTo(dimX2 - 3, endLeftY);
    ctx.lineTo(dimX2 + 3, endLeftY);
    ctx.stroke();
    ctx.fillText('12.40', dimX2 - 5, (startLeftY + endLeftY) / 2);

    // North Symbol (Compass Rose at top right)
    const naX = mapX(34.8);
    const naY = mapY(18.5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(naX, naY, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(naX, naY - 10);
    ctx.lineTo(naX + 3.5, naY);
    ctx.lineTo(naX, naY - 2);
    ctx.lineTo(naX - 3.5, naY);
    ctx.closePath();
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(naX, naY + 10);
    ctx.lineTo(naX + 3.5, naY);
    ctx.lineTo(naX, naY + 2);
    ctx.lineTo(naX - 3.5, naY);
    ctx.closePath();
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 9px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('N', naX, naY - 13);
    ctx.restore();

    // 3. Draw All 93 Piles with I-beam shape & user colors (ภาพที่ 5: สีฟ้ากดวันนี้, สีเขียวกดแล้ว, สีขาวรอกด)
    const curDate = DailyReportState.date;
    const pilesDb = window.__PILES_DB__ || window.PILES_DATABASE || [];
    const progressRecs = getProgressRecords();
    const radius = Math.max(7.8, Math.min(10.8, scale * 0.42));
    const fontSize = Math.max(7.5, Math.min(9.8, radius * 0.95));

    pilesDb.forEach(p => {
      const cx = mapX(p.x);
      const cy = mapY(p.y);
      const rec = progressRecs[p.no];
      const isDriven = rec && rec.status === 'driven';
      const pileDate = rec ? rec.date : null;
      const isToday = isDriven && pileDate === curDate;
      const isPastDriven = isDriven && (!pileDate || pileDate < curDate);

      // Radial glow if driven today
      if (isToday) {
        ctx.save();
        const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius + 12);
        glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
        glowGrad.addColorStop(0.45, 'rgba(14, 165, 233, 0.5)');
        glowGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      let fillColor = '#ffffff';
      let strokeColor = '#000000';
      let strokeWidth = 1.4;
      let textColor = '#0f172a';

      if (isToday) {
        fillColor = '#0284c7'; // Sky Blue (สีฟ้ากดวันนี้)
        strokeColor = '#0369a1';
        strokeWidth = 2.0;
        textColor = '#ffffff';
      } else if (isPastDriven) {
        fillColor = '#10b981'; // Emerald Green (สีเขียวกดแล้ว)
        strokeColor = '#064e3b';
        strokeWidth = 1.8;
        textColor = '#ffffff';
      }

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // If waiting, draw small I-beam icon inside
      if (!isToday && !isPastDriven) {
        const iw = radius * 0.7;
        const ih = radius * 0.9;
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - iw / 2, cy - ih / 2);
        ctx.lineTo(cx + iw / 2, cy - ih / 2);
        ctx.moveTo(cx, cy - ih / 2);
        ctx.lineTo(cx, cy + ih / 2);
        ctx.moveTo(cx - iw / 2, cy + ih / 2);
        ctx.lineTo(cx + iw / 2, cy + ih / 2);
        ctx.stroke();
      }

      ctx.fillStyle = textColor;
      ctx.font = `bold ${fontSize}px Montserrat, Sarabun, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.no.toString(), cx, cy);
    });
  }


  // =========================================================================
  // PAGE 3 BUILDER: SITE PHOTO SHEET (Strict A4 Fit, 6 Photos per Sheet)
  // =========================================================================
  function renderDailyReportPhotoPages() {
    const container = document.getElementById('dr-photo-sheets-container');
    if (!container) return;

    const thaiDate = formatThaiDate(DailyReportState.date);
    const photos = DailyReportState.photos || [];

    const photosPerPage = 6;
    const totalPages = Math.max(1, Math.ceil(photos.length / photosPerPage));

    let pagesHtml = '';

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pagePhotos = photos.slice(pageIdx * photosPerPage, (pageIdx + 1) * photosPerPage);
      
      let photoCardsHtml = '';
      for (let slot = 0; slot < 6; slot++) {
        const photo = pagePhotos[slot];
        const globalIdx = pageIdx * photosPerPage + slot;

        if (photo) {
          photoCardsHtml += `
            <div class="dr-photo-card group relative">
              <div class="dr-photo-frame shadow-xs">
                <img src="${photo.url}" alt="ภาพถ่ายงานกดเสาเข็ม" class="w-full h-full object-cover">
                <div class="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity daily-no-print flex items-center gap-1">
                  <button type="button" onclick="removeDrPhoto(${globalIdx})" class="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 shadow-sm text-xs cursor-pointer" title="ลบภาพนี้">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
                </div>
              </div>
              <div class="w-full mt-1">
                <input type="text" value="${escapeHtml(photo.caption || 'ภาพถ่ายงานกดเสาเข็ม')}" onchange="updateDrPhotoCaption(${globalIdx}, this.value)" class="w-full text-center text-[10.5px] font-bold text-slate-800 border-b border-transparent hover:border-slate-400 focus:border-slate-800 outline-none py-0.5 bg-transparent" placeholder="ภาพถ่ายงานกดเสาเข็ม">
              </div>
            </div>
          `;
        } else {
          photoCardsHtml += `
            <div class="dr-photo-card daily-no-print border-2 border-dashed border-slate-300 rounded p-2 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-slate-100 hover:border-blue-400 transition-all cursor-pointer h-full" style="aspect-ratio: 4/3; max-height: 185px;" onclick="uploadDrPhotoAtSlot(${globalIdx})">
              <i data-lucide="camera" class="w-6 h-6 text-slate-400 mb-1"></i>
              <span class="text-[11px] font-bold text-slate-700">+ ใส่ภาพถ่ายงานกดเสาเข็ม (4:3)</span>
              <span class="text-[9.5px] text-slate-400">ช่องที่ ${slot + 1} คลิกเพื่อเลือกรูป</span>
            </div>
          `;
        }
      }

      pagesHtml += `
        <article id="dr-photo-page-${pageIdx + 1}" class="daily-a4-sheet mx-auto">
          <div class="border border-slate-800 p-4 h-full flex flex-col justify-between" style="height: 270mm; max-height: 270mm; box-sizing: border-box; overflow: hidden;">
            
            <!-- Header Section (Sansiri Logo) -->
            <div class="flex flex-col items-center justify-center mb-2">
              <div class="mb-1">
                <img src="${SANSIRI_LOGO_BASE64}" onerror="if(this.src!=='Logo/png/Sansiri-logo-en-black.png')this.src='Logo/png/Sansiri-logo-en-black.png';" alt="SANSIRI" class="h-6 max-w-[170px] object-contain inline-block">
              </div>
              <div class="text-xs font-bold text-slate-900 mt-0.5">
                โครงการ ${DailyReportState.projectName}
              </div>
              <div class="text-[11px] text-slate-700 font-medium">
                ประจำวันที่ ${thaiDate}
              </div>
              <div class="text-[11px] font-bold text-slate-800">
                หมวดงานเสาเข็ม
              </div>
            </div>

            <!-- 6 Photos Grid (2 Columns x 3 Rows in 4:3 Ratio) -->
            <div class="dr-photo-grid flex-1">
              ${photoCardsHtml}
            </div>

            <!-- Page Number Footer -->
            <div class="mt-2 pt-1 border-t border-slate-200 text-right text-[10px] text-slate-500 font-mono">
              แผ่นภาพที่ ${pageIdx + 1} / ${totalPages}
            </div>

          </div>
        </article>
      `;
    }

    container.innerHTML = pagesHtml;
    if (window.lucide) window.lucide.createIcons();
  }

  let activeTargetSlot = null;
  window.uploadDrPhotoAtSlot = function(slotIdx) {
    activeTargetSlot = slotIdx;
    const fileInput = document.getElementById('dr-file-input');
    if (fileInput) fileInput.click();
  };

  // =========================================================================
  // TEMPORARY IN-MEMORY PHOTO UPLOAD LOGIC
  // =========================================================================
  window.handleTemporaryPhotoSelect = function (event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (!DailyReportState.photos) DailyReportState.photos = [];

    if (activeTargetSlot !== null && activeTargetSlot !== undefined) {
      const file = files[0];
      const blobUrl = URL.createObjectURL(file);
      DailyReportState.photos[activeTargetSlot] = {
        id: 'upload-' + Date.now(),
        url: blobUrl,
        caption: 'ภาพถ่ายงานกดเสาเข็ม'
      };
      activeTargetSlot = null;
    } else {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blobUrl = URL.createObjectURL(file);
        DailyReportState.photos.push({
          id: 'upload-' + Date.now() + '-' + i,
          url: blobUrl,
          caption: 'ภาพถ่ายงานกดเสาเข็ม'
        });
      }
    }

    event.target.value = '';
    
    const totalSheets = 2 + Math.max(1, Math.ceil(DailyReportState.photos.length / 6));
    DailyReportState.attachmentPages = totalSheets;

    renderDailyReportAll();
    switchDailyReportTab('p3');
  };

  window.removeDrPhoto = function (index) {
    if (!DailyReportState.photos) return;
    DailyReportState.photos.splice(index, 1);
    const totalSheets = 2 + Math.max(1, Math.ceil(DailyReportState.photos.length / 6));
    DailyReportState.attachmentPages = totalSheets;
    renderDailyReportPhotoPages();
  };

  window.updateDrPhotoCaption = function (index, newCaption) {
    if (DailyReportState.photos && DailyReportState.photos[index]) {
      DailyReportState.photos[index].caption = newCaption || 'ภาพถ่ายงานกดเสาเข็ม';
    }
  };

  window.updateDrTask = function (index, field, value) {
    if (!DailyReportState.tasks[index]) {
      DailyReportState.tasks[index] = { no: index + 1, title: '', location: '', qty: '', drivenQty: '', pct: '', remarks: '' };
    }
    DailyReportState.tasks[index][field] = value;
  };

  window.DailyReportState = DailyReportState;

  let autoSaveTimeout = null;
  function autoDebouncedSaveSupabase() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      saveDailyReportConfigToSupabase(true);
    }, 1200);
  }
  window.autoDebouncedSaveSupabase = autoDebouncedSaveSupabase;

  // Automatic Working Duration Calculation (e.g. 08:00 to 17:00 with 1 hr lunch break = 8 hrs)
  function calculateDailyWorkDuration(startStr, endStr) {
    if (!startStr || !endStr) return '';
    function parseMins(s) {
      if (!s) return null;
      const clean = s.toString().replace(/น\.?/g, '').trim();
      const m = clean.match(/(\d{1,2})(?:[:.](\d{1,2}))?/);
      if (!m) return null;
      const hrs = parseInt(m[1], 10);
      const mins = m[2] ? parseInt(m[2], 10) : 0;
      if (isNaN(hrs) || hrs < 0 || hrs > 24) return null;
      if (isNaN(mins) || mins < 0 || mins >= 60) return null;
      return hrs * 60 + mins;
    }

    const startM = parseMins(startStr);
    const endM = parseMins(endStr);
    if (startM === null || endM === null || endM <= startM) {
      return '';
    }

    let totalMins = endM - startM;

    // Deduct 1 hour (60 mins) for lunch break if shift spans lunch (e.g. start <= 12:00 and end >= 13:00, or total duration >= 5 hours)
    const crossesLunch = (startM <= 12 * 60 && endM >= 13 * 60) || totalMins >= 5 * 60;
    if (crossesLunch && totalMins > 60) {
      totalMins -= 60;
    }

    const h = Math.floor(totalMins / 60);
    const remM = totalMins % 60;

    if (remM === 0) {
      return `${h} ชั่วโมง`;
    } else if (remM === 30) {
      return `${h}.5 ชั่วโมง`;
    } else {
      return `${h} ชั่วโมง ${remM} นาที`;
    }
  }

  window.handleWorkTimeChange = function (type, val) {
    if (type === 'start') {
      DailyReportState.startTime = val;
    } else if (type === 'end') {
      DailyReportState.endTime = val;
    }
    const autoDur = calculateDailyWorkDuration(DailyReportState.startTime, DailyReportState.endTime);
    if (autoDur) {
      DailyReportState.duration = autoDur;
      const durEl = document.getElementById('dr-input-duration');
      if (durEl) durEl.value = autoDur;
    }
    autoDebouncedSaveSupabase();
  };

  window.updateManpower = function (type, index, value) {
    if (DailyReportState.manpower[type] && DailyReportState.manpower[type][index]) {
      DailyReportState.manpower[type][index].count = parseInt(value, 10) || 0;
      renderDailyReportPage1();
      autoDebouncedSaveSupabase();
    }
  };

  window.updateMaterialCount = function (index, value) {
    if (DailyReportState.materials[index]) {
      DailyReportState.materials[index].count = parseInt(value, 10) || 0;
      renderDailyReportPage1();
      autoDebouncedSaveSupabase();
    }
  };

  window.handleManualDateChange = function (newVal) {
    DailyReportState.date = newVal;
    DailyReportState.tasks = generateAutomaticTasksList(newVal);
    renderDailyReportAll();
  };

  // =========================================================================
  // PDF EXPORT ENGINES: PRINT TO PDF & DIRECT PDF DOWNLOAD
  // =========================================================================
  window.printDailyReportPDF = function () {
    switchDailyReportTab('all');

    document.body.classList.add('is-printing-daily-report');
    
    setTimeout(() => {
      window.print();
    }, 200);

    window.addEventListener('afterprint', () => {
      document.body.classList.remove('is-printing-daily-report');
    }, { once: true });
  };

  window.downloadDailyReportPDF = async function () {
    switchDailyReportTab('all');

    const printArea = document.getElementById('daily-report-printable-area');
    if (!printArea) return;

    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-[10000] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border-2 border-[#ffc45b] flex items-center gap-3 text-xs font-bold';
    toast.innerHTML = `
      <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      <span>กำลังส่งออก PDF ขนาด A4 (3 หน้าพอดีขอบ)... กรุณารอสักครู่</span>
    `;
    document.body.appendChild(toast);

    const filename = `Daily_Report_PYNN_PRIDI_37_${DailyReportState.date || 'today'}.pdf`;

    try {
      if (typeof window.html2pdf === 'function') {
        const opt = {
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            scrollY: 0,
            windowWidth: 794
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], after: '.daily-a4-sheet' }
        };
        await window.html2pdf().set(opt).from(printArea).save();
      } else {
        window.print();
      }
    } catch (e) {
      console.error('Error generating PDF with html2pdf:', e);
      window.print();
    } finally {
      if (toast && toast.parentElement) toast.remove();
    }
  };

  function injectDailyReportStyles() {
    if (document.getElementById('daily-report-injected-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'daily-report-injected-styles';
    styleEl.textContent = `
      .daily-page-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
        padding: 20px 16px 80px 16px;
      }
      #dr-photo-sheets-container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }
      .daily-a4-sheet {
        width: 210mm;
        height: 288mm;
        min-height: 288mm;
        max-height: 290mm;
        max-width: 100%;
        margin-left: auto;
        margin-right: auto;
        background: #ffffff;
        color: #000000;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border: 1px solid #cbd5e1;
        padding: 7mm 8mm 6mm 8mm;
        box-sizing: border-box;
        position: relative;
        font-family: 'Sarabun', 'Prompt', sans-serif;
        overflow: hidden;
        page-break-after: always;
        break-after: page;
      }
      .daily-a4-sheet input[type="text"],
      .daily-a4-sheet input:not([type="checkbox"]):not([type="radio"]):not([type="file"]) {
        font-family: 'Sarabun', 'Prompt', sans-serif;
        line-height: normal;
      }
      .dr-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11px;
        line-height: 1.3;
      }
      .dr-table th, .dr-table td {
        border: 1px solid #000000;
        padding: 2px 4px;
      }
      .dr-table th {
        background-color: #f8fafc;
        font-weight: 700;
        text-align: center;
      }
      .dr-piling-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 9.5px;
        line-height: 1.25;
      }
      .dr-piling-table th, .dr-piling-table td {
        border: 1px solid #000000;
        padding: 2.5px 3.5px;
      }
      .dr-piling-table th {
        background-color: #f1f5f9;
        font-weight: 700;
      }

      /* =========================================================================
         IMAGE 2 LEDGER COMPARISON TABLE STYLES
         ========================================================================= */
      .piling-daily-table {
        border-collapse: separate;
        border-spacing: 0;
        width: 100%;
        font-size: 10px;
        table-layout: fixed;
      }
      .piling-daily-table th,
      .piling-daily-table td {
        border-right: 1px solid #475569;
        border-bottom: 1px solid #475569;
        padding: 4px 3px;
        text-align: center;
        white-space: nowrap;
        box-sizing: border-box;
      }
      .piling-daily-table thead th {
        background-color: #fceee7;
        color: #1e293b;
        font-weight: 800;
        font-size: 10px;
      }
      .piling-daily-table th.sticky-col,
      .piling-daily-table td.sticky-col {
        position: sticky;
        left: 0;
        min-width: 135px;
        width: 135px;
        max-width: 135px;
        text-align: left;
        padding-left: 8px;
        padding-right: 4px;
        box-sizing: border-box;
      }
      .piling-daily-table th.sticky-col {
        z-index: 20;
        background-color: #fceee7;
        text-align: center;
        padding-left: 4px;
        box-shadow: 2px 0 4px rgba(0,0,0,0.08);
      }
      .piling-daily-table td.sticky-col {
        z-index: 10;
        background-color: #ffffff;
        box-shadow: 2px 0 4px rgba(0,0,0,0.08);
      }
      .piling-daily-table tr.row-plan td {
        background-color: #ffffff;
      }
      .piling-daily-table tr.row-actual td {
        background-color: #f8fafc;
      }
      .piling-daily-table tr.row-accum-plan td {
        border-top: 2px solid #1e293b !important;
        background-color: #f1f5f9;
        color: #1e293b;
      }
      .piling-daily-table tr.row-accum-plan td.sticky-col {
        border-top: 2px solid #1e293b !important;
        background-color: #e2e8f0;
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      }
      .piling-daily-table tr.row-accum-actual td {
        background-color: #ecfdf5;
        color: #064e3b;
      }
      .piling-daily-table tr.row-accum-actual td.sticky-col {
        background-color: #d1fae5;
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      }

      /* Orange Highlight Column for Active / Selected Reporting Date */
      .piling-daily-table .active-col {
        background-color: #fff7ed !important;
      }
      .piling-daily-table th.active-col {
        border-top: 2.5px solid #ea580c !important;
        border-left: 2.5px solid #ea580c !important;
        border-right: 2.5px solid #ea580c !important;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        background-color: #ffedd5 !important;
        color: #9a3412 !important;
        font-weight: 900;
      }
      .piling-daily-table td.active-col {
        border-left: 2.5px solid #ea580c !important;
        border-right: 2.5px solid #ea580c !important;
      }
      .piling-daily-table tr.row-accum-plan td.active-col {
        background-color: #fed7aa !important;
        color: #9a3412 !important;
        font-weight: 900;
      }
      .piling-daily-table tr.row-accum-actual td.active-col {
        background-color: #a7f3d0 !important;
        color: #064e3b !important;
        font-weight: 900;
        border-bottom: 2.5px solid #ea580c !important;
        border-bottom-left-radius: 6px;
        border-bottom-right-radius: 6px;
      }

      /* Photo Grid */
      .dr-photo-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px 16px;
      }
      .dr-photo-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      .dr-photo-frame {
        width: 100%;
        aspect-ratio: 4 / 3;
        max-height: 185px;
        background: #f8fafc;
        border: 1px solid #000000;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .dr-photo-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* =========================================================================
         PRINT & EXPORT RULES FOR EXACT A4 PAGE FITTING
         ========================================================================= */
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        body.is-printing-daily-report {
          overflow: visible !important;
          background: #ffffff !important;
        }
        body.is-printing-daily-report > *:not(#modal-daily-report) {
          display: none !important;
        }
        body.is-printing-daily-report #modal-daily-report {
          position: static !important;
          display: block !important;
          background: #ffffff !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          inset: auto !important;
        }
        body.is-printing-daily-report #modal-daily-report .daily-no-print {
          display: none !important;
        }
        body.is-printing-daily-report .daily-page-container {
          padding: 0 !important;
          margin: 0 !important;
          gap: 0 !important;
          display: block !important;
        }
        body.is-printing-daily-report #dr-photo-sheets-container {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
          gap: 0 !important;
          width: 100% !important;
        }
        body.is-printing-daily-report .daily-a4-sheet {
          width: 210mm !important;
          height: 297mm !important;
          max-height: 297mm !important;
          min-height: 297mm !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          page-break-after: always !important;
          break-after: page !important;
          border: none !important;
          box-shadow: none !important;
          margin: 0 !important;
          padding: 7mm 8mm 6mm 8mm !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
  }

  // Wire up listeners
  function initDailyReportTriggers() {
    injectDailyReportStyles();
    document.getElementById('btn-open-daily-report')?.addEventListener('click', window.openDailyReportModal);
    document.getElementById('btn-rep-open-daily-report')?.addEventListener('click', window.openDailyReportModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDailyReportTriggers);
  } else {
    initDailyReportTriggers();
  }

})();
