/**
 * PYNN EKKAMAI 12 — Sheet Pile & Excavation Report Studio (Official Sansiri 4-Page Daily Report PDF)
 *
 * 4-Page Official SANSIRI Standard Layout:
 *  - Page 1: รายงานการทำงานประจำวัน (Official Sansiri Form — 24h Dual Weather Clocks,
 *            Row 1: งานเข็ม I 40 (93 ต้น 100%), Row 2: Sheet Pile (2.1 กดชีตไพล์ · 2.2 Waler/Strut/Packing · 2.3 ขุดดิน -3.65 ม.),
 *            3-Col Manpower/Equipment, Problems/Materials, Dual Signatures with Image Upload)
 *  - Page 2: สรุปความก้าวหน้าชีตไพล์ & งานขุดดิน (4-View Engineering Plates + 3-Package & Gridline Tables)
 *  - Page 3: ภาพถ่ายหน้างาน (Site Photo Sheet — 6 Photos + 1-Click 3D Capture)
 *  - Page 4: เอกสาร Consult (Conzol Document Approval Sheet — Full-Page Image + 90° Rotate)
 */
(function () {
  'use strict';

  const CONFIG_KEY = 'pynn_ekkamai12_sp_daily_cfg_v3';
  const SHARED_PILING_CONFIG_KEY = 'PE12_DAILY_REPORT_CONFIG';
  const SUPABASE_URL = 'https://gyzrsrxzzturoqwhuiul.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enJzcnh6enR1cm9xd2h1aXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxNDcsImV4cCI6MjA5MTA2MjE0N30.CJAFW3acVnOwb5hvSDO6H0TGPTK__MOTBdgUxUWpM70';
  const SHARED_SIG_FIELDS = ['toCompany', 'recipient', 'authorCompany', 'author', 'authorRole', 'authorSignatureImg', 'reviewerCompany', 'reviewer', 'reviewerRole', 'reviewerSignatureImg', 'conzolTitle', 'conzolTable', 'conzolImageUrl'];
  const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const THAI_MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  const WEATHER_CYCLE = ['none', 'clear', 'cloudy', 'rain'];
  const WEATHER_PALETTE = {
    none: { fill: '#FFFFFF', label: 'ไม่ระบุ' },
    clear: { fill: '#67E8F9', label: 'ปลอดโปร่ง' },
    cloudy: { fill: '#FDE047', label: 'ไม่แจ่มใส' },
    rain: { fill: '#FDBA74', label: 'ฝนตก' },
  };

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatThaiDateShort(iso) {
    const d = iso ? new Date(iso + 'T00:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return iso || '';
    return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  function formatThaiDateFull(iso) {
    const d = iso ? new Date(iso + 'T00:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return iso || '';
    return `${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getBridge() {
    return window.__SP_REPORT_BRIDGE__ || null;
  }

  function defaultWeatherHours() {
    const h = {};
    for (let i = 0; i < 24; i++) h[i] = (i >= 8 && i < 17) ? 'clear' : 'none';
    return h;
  }

  function loadCfg() {
    const base = {
      projectName: 'PYNN EKKAMAI 12',
      toCompany: 'บริษัท แสนสิริ จำกัด (มหาชน)',
      recipient: 'คุณ วิสุทธิ์ จันทร์วัฒรังกูล',
      date: todayIso(),
      attachmentPages: 4,
      workPermit: 'none',
      workPermitOther: '',
      normalHours: '8',
      overtimeHours: '0',
      startTime: '08:00',
      endTime: '17:00',
      weatherImpact: 'none',
      weatherHours: defaultWeatherHours(),
      remarks1: 'แล้วเสร็จ',
      remarks21: '',
      remarks22: '',
      remarks23: '',
      remarks24: '',
      extraRows: [
        { title: '', location: '', qty: '', done: '', pct: '', remarks: '' },
      ],
      manpower: {
        mgmt: [
          { label: 'ผู้จัดการงานก่อสร้าง', count: 1 },
          { label: 'วิศวกรโครงการ', count: 1 },
          { label: 'โฟร์แมน', count: 2 },
          { label: 'เจ้าหน้าที่ความปลอดภัย (จป.)', count: 1 },
          { label: 'ธุรการ / Drawing / QS', count: 1 },
        ],
        workers: [
          { label: 'คนงานกดชีตไพล์ / ค้ำยัน', count: 6 },
          { label: 'Survey / ช่างสำรวจ', count: 2 },
          { label: 'ช่างเชื่อมโครงสร้างเหล็ก', count: 4 },
          { label: 'คนขับเครื่องจักร', count: 2 },
          { label: 'ช่างไฟ', count: 1 },
          { label: 'คนงานทั่วไป', count: 4 },
        ],
        machinery: [
          { label: 'เครื่องกดชีตไพล์ (Silent Piler)', count: 1, unit: 'เครื่อง' },
          { label: 'รถโมบายเครน 25 ตัน', count: 1, unit: 'คัน' },
          { label: 'ตู้เชื่อมไฟฟ้า', count: 2, unit: 'เครื่อง' },
          { label: 'ปั๊มสูบน้ำ', count: 2, unit: 'เครื่อง' },
          { label: 'รถบรรทุก 6 ล้อ / 10 ล้อ', count: 2, unit: 'คัน' },
        ],
      },
      obstacles: '',
      solutions: '',
      materials: [
        { label: 'Sheet Pile JIS FSP-III ยาว 13.50 ม. (Case A)', count: 90, unit: 'แผ่น' },
        { label: 'Sheet Pile JIS FSP-III ยาว 12.00 ม. (Case B)', count: 52, unit: 'แผ่น' },
        { label: 'เหล็ก H-Beam 350×350 (Waler/Strut)', count: 54.5, unit: 'ม.' },
        { label: 'เหล็ก Bracket H-200BL', count: 20, unit: 'ชุด' },
        { label: 'Hydraulic Jack Preload (UJ-N40)', count: 2, unit: 'ชุด' },
      ],
      authorCompany: 'บริษัท แสนสิริ จำกัด (มหาชน)',
      author: 'นายนิวัฒน์ เวียงชัย',
      authorRole: 'ผู้จัดการส่วนก่อสร้าง',
      authorSignatureImg: '',
      reviewerCompany: 'บริษัท แสนสิริ จำกัด (มหาชน)',
      reviewer: 'นายสุวิทย์ สุขศรี',
      reviewerRole: 'ผู้ช่วยผู้จัดการฝ่ายพัฒนาโครงการแนวสูง',
      reviewerSignatureImg: '',
      conzolMode: 'table',
      conzolTitle: 'UPDATE รายการเอกสารอนุมัติ Conzol ประจำวัน',
      conzolImageUrl: '',
      conzolRotate90: false,
      conzolTable: {
        columns: ['ลำดับ', 'ID', 'รายการ', 'STATUS', 'หมายเหตุ'],
        rows: [
          { isGroup: true, label: 'Material' },
          { isGroup: false, cells: ['1', 'PE12-SSRC-SSR-MAT-STR-012:00', 'ขออนุมัติใช้น้ำยาประสานคอนกรีต', 'AP', ''] },
          { isGroup: false, cells: ['2', 'PE12-SSRC-SSR-MAT-STR-013:00', 'ขออนุมัติใช้ปูน Non-Shrink เกร้าท์', 'AP', ''] },
          { isGroup: false, cells: ['3', 'PE12-SSRC-SSR-MAT-STR-002:00', 'ขออนุมัติใช้คอนกรีตสำเร็จรูป', 'AP', ''] },
          { isGroup: false, cells: ['4', 'PE12-SSRC-SSR-MAT-STR-003:00', 'ขออนุมัติใช้เสาเข็ม', 'AP', ''] },
          { isGroup: false, cells: ['5', 'PE12-SSRC-SSR-MAT-STR-004:00', 'ขออนุมัติใช้เหล็กเส้นเสริมคอนกรีต', 'AP', ''] },
          { isGroup: false, cells: ['6', 'PE12-SSRC-SSR-MAT-STR-007:00', 'ขออนุมัติใช้ตะแกรงกัน Joint', 'AP', ''] },
          { isGroup: false, cells: ['7', 'PE12-SSRC-SSR-MAT-STR-005:00', 'ขออนุมัติใช้ Waterstop', 'AP', ''] },
          { isGroup: true, label: 'Shop Drawing' },
          { isGroup: false, cells: ['8', 'PE12-SSRC-SSR-SHOP-STR-002:00', 'แปลนค่าพิกัดเข็ม', 'AP', ''] },
          { isGroup: false, cells: ['9', 'PE12-SSRC-SSR-SHOP-STR-011:00', 'แบบขยายเสาชั้น 1-8', 'AP', ''] },
          { isGroup: false, cells: ['10', 'PE12-SSRC-SSR-SHOP-STR-007:00', 'แปลนโครงสร้างพื้นถังเก็บน้ำชั้นใต้ดิน', 'APN', '***ในกรณีที่มีการขยายหรือปรับแนวผนังถังเก็บน้ำเพื่อเพิ่มปริมาตร ให้นำเสนอต่อผู้ออกแบบอีกครั้ง เพื่อพิจารณาแนวทางดำเนินการต่อไป'] },
          { isGroup: false, cells: ['11', 'PE12-SSRC-SSR-SHOP-STR-008:00', 'รูปตัดถังเก็บน้ำใต้ดิน', 'APN', '***ในกรณีที่มีการขยายหรือปรับแนวผนังถังเก็บน้ำเพื่อเพิ่มปริมาตร ให้นำเสนอต่อผู้ออกแบบอีกครั้ง เพื่อพิจารณาแนวทางดำเนินการต่อไป'] },
        ],
      },
    };
    let merged = { ...base };
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Auto-migrate legacy 142×13.5m material row to exact JIS FSP-III Case A (90×13.5m) + Case B (52×12.0m)
        const parsedMats = parsed.materials;
        const isLegacyMat = Array.isArray(parsedMats) && parsedMats[0]?.label === 'แผ่น Sheet Pile ยาว 13.50 ม.' && Number(parsedMats[0]?.count) === 142;
        merged = {
          ...merged,
          ...parsed,
          weatherHours: { ...base.weatherHours, ...(parsed.weatherHours || {}) },
          manpower: {
            mgmt: parsed.manpower?.mgmt || base.manpower.mgmt,
            workers: parsed.manpower?.workers || base.manpower.workers,
            machinery: parsed.manpower?.machinery || base.manpower.machinery,
          },
          materials: isLegacyMat ? base.materials : (parsedMats || base.materials),
          extraRows: Array.isArray(parsed.extraRows) ? parsed.extraRows.slice(0, 1) : base.extraRows,
        };
      }
    } catch {}
    // Always sync shared header/signature fields from Piling Daily Report (PE12_DAILY_REPORT_CONFIG)
    try {
      const sharedRaw = localStorage.getItem(SHARED_PILING_CONFIG_KEY);
      if (sharedRaw) {
        const sc = JSON.parse(sharedRaw);
        SHARED_SIG_FIELDS.forEach((k) => {
          if (sc[k] !== undefined && sc[k] !== null && sc[k] !== '') merged[k] = sc[k];
        });
      }
    } catch {}
    // Always sync report date to the main page's active date picker (or today) — never stay stuck on a stale cached date from days ago!
    const liveDate = getBridge()?.getState?.()?.reportDate || todayIso();
    merged.date = liveDate;
    return merged;
  }

  function saveCfg(cfg) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch {}
    // Keep shared signature fields in sync with Piling Daily Report
    try {
      const existing = JSON.parse(localStorage.getItem(SHARED_PILING_CONFIG_KEY) || '{}');
      SHARED_SIG_FIELDS.forEach((k) => {
        if (cfg[k] !== undefined) existing[k] = cfg[k];
      });
      localStorage.setItem(SHARED_PILING_CONFIG_KEY, JSON.stringify(existing));
    } catch {}
  }

  async function syncSharedSignaturesFromSupabase(cfg, onUpdated) {
    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/project_data?id=eq.1&select=data', {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
      });
      const rows = await res.json();
      const sc = rows?.[0]?.data?.dailyReportConfig;
      if (!sc || typeof sc !== 'object') return;
      let changed = false;
      SHARED_SIG_FIELDS.forEach((k) => {
        if (sc[k] !== undefined && sc[k] !== null && sc[k] !== '' && cfg[k] !== sc[k]) {
          cfg[k] = sc[k];
          changed = true;
        }
      });
      if (changed) {
        saveCfg(cfg);
        if (typeof onUpdated === 'function') onUpdated();
      }
    } catch {}
  }

  function computeDetailedStats() {
    const b = getBridge();
    const state = b?.getState?.() || { excavationDepth: 0, statuses: {}, statusDates: {}, preloadTons: 0, logs: [] };
    const meta = b?.getMetadata?.() || { items: [] };
    const items = Array.isArray(meta.items) ? meta.items : [];
    const statuses = state.statuses || {};
    const statusDates = state.statusDates || {};
    const reportDate = state.reportDate || todayIso();

    // 1. Sheet Pile by 4 Gridline Walls + 4 Corners (Exact Hirose CAD: N=47, S=47, W=22, E=22, C=4 -> Total 142)
    //    Model: JIS A 5528 FSP-III (SP-3), SY295, 400×125×13mm (60 kg/m)
    //    Case A = 13.50m (90 pcs: 88 straight + 2 corners) | Case B = 12.00m (52 pcs: 50 straight + 2 corners)
    const sides = {
      N: { label: 'แนว Grid A–B (เหนือ)', short: 'Grid A–B', spec: 'FSP-3 · 12ม.(14)+13.5ม.(33)', total: 47, done: 0, today: 0, progress: 0, aTotal: 33, bTotal: 14 },
      S: { label: 'แนว Grid E (ใต้)', short: 'Grid E', spec: 'FSP-3 · 12ม.(14)+13.5ม.(33)', total: 47, done: 0, today: 0, progress: 0, aTotal: 33, bTotal: 14 },
      W: { label: 'แนว Grid 3–4 (ตะวันตก)', short: 'Grid 3–4', spec: 'FSP-3 · 12.00 ม. (Case B)', total: 22, done: 0, today: 0, progress: 0, aTotal: 0, bTotal: 22 },
      E: { label: 'แนว Grid 7 (ตะวันออก)', short: 'Grid 7', spec: 'FSP-3 · 13.50 ม. (Case A)', total: 22, done: 0, today: 0, progress: 0, aTotal: 22, bTotal: 0 },
      C: { label: 'แผ่นยันมุม 4 มุม (NW/SW/NE/SE)', short: '4 มุม', spec: 'FSP-3 · 12ม.(2)+13.5ม.(2)', total: 4, done: 0, today: 0, progress: 0, aTotal: 2, bTotal: 2 },
    };
    const caseA = { model: 'JIS FSP-III (SP-3)', lengthM: 13.5, total: 90, straight: 88, corner: 2, done: 0, today: 0, weightTon: 72.9 };
    const caseB = { model: 'JIS FSP-III (SP-3)', lengthM: 12.0, total: 52, straight: 50, corner: 2, done: 0, today: 0, weightTon: 37.5 };

    const spItems = items.filter((x) => x.category === 'sheetpile');
    if (spItems.length > 0) {
      Object.values(sides).forEach((b) => { b.total = 0; b.aTotal = 0; b.bTotal = 0; });
      caseA.total = 0; caseB.total = 0;
      spItems.forEach((it) => {
        const sKey = it.side === 'Corner' ? 'C' : (it.id.split('_')[1] || 'S').toUpperCase();
        const bucket = sides[sKey] || sides.S;
        const isB = it.case === 'B' || Number(it.depth_m) === 12;
        bucket.total += 1;
        if (isB) { bucket.bTotal += 1; caseB.total += 1; } else { bucket.aTotal += 1; caseA.total += 1; }
        if (statuses[it.id] === 'done') {
          bucket.done += 1;
          if (isB) caseB.done += 1; else caseA.done += 1;
          if (statusDates[it.id] === reportDate) {
            bucket.today += 1;
            if (isB) caseB.today += 1; else caseA.today += 1;
          }
        } else if (statuses[it.id] === 'progress') bucket.progress += 1;
      });
    } else {
      Object.entries(statuses).forEach(([id, st]) => {
        if (!id.startsWith('SP_')) return;
        const sKey = (id.split('_')[1] || 'S').toUpperCase();
        const bucket = sides[sKey] || sides.S;
        if (st === 'done') {
          bucket.done += 1;
          if (statusDates[id] === reportDate) bucket.today += 1;
        } else if (st === 'progress') bucket.progress += 1;
      });
    }
    caseA.pct = caseA.total ? Math.round((caseA.done / caseA.total) * 100) : 0;
    caseB.pct = caseB.total ? Math.round((caseB.done / caseB.total) * 100) : 0;
    const spTotal = Object.values(sides).reduce((a, s) => a + s.total, 0) || 142;
    const spDone = Object.values(sides).reduce((a, s) => a + s.done, 0);
    const spToday = Object.values(sides).reduce((a, s) => a + s.today, 0);
    const spTodayMeters = +(spToday * 0.4).toFixed(1);
    const spProg = Object.values(sides).reduce((a, s) => a + s.progress, 0);
    const spMeters = +(spDone * 0.4).toFixed(1);
    const spPct = Math.round((spDone / spTotal) * 100);

    // 2. Waler / Strut / Bracket / Jack & Packing Concrete (Gridline-based)
    const walerDefs = [
      { id: 'WALER_North', label: 'Waler แนว Grid A–B (H-350)', len: 18.62 },
      { id: 'WALER_South', label: 'Waler แนว Grid E (H-350)', len: 18.62 },
      { id: 'WALER_West', label: 'Waler แนว Grid 3–4 (H-350)', len: 8.62 },
      { id: 'WALER_East', label: 'Waler แนว Grid 7 (H-350)', len: 8.62 },
    ];
    let walerDoneM = 0;
    const walerRows = walerDefs.map((w) => {
      const st = statuses[w.id] || 'pending';
      if (st === 'done') walerDoneM += w.len;
      return { ...w, status: st };
    });

    const strutIds = ['STRUT_01_West', 'STRUT_02_East', 'CORNER_NW', 'CORNER_NE', 'CORNER_SW', 'CORNER_SE'];
    const strutRows = strutIds.map((id) => ({ id, status: statuses[id] || 'pending' }));
    const strutDone = strutRows.filter((r) => r.status === 'done').length;

    const bkStatus = statuses['BRACKETS_ALL'] || 'pending';
    const jackIds = ['JACK_01_West', 'JACK_02_East'];
    const jackDone = jackIds.filter((id) => statuses[id] === 'done').length;
    const jackTons = typeof state.preloadTons === 'number' ? state.preloadTons : 0;

    const pcItems = items.filter((x) => x.category === 'packing_concrete');
    let pcDoneCount = 0, pcDoneM = 0, pcDoneVol = 0, pcTotalM = 0, pcTotalVol = 0;
    pcItems.forEach((it) => {
      const l = Number(it.length_m) || 0;
      const v = Number(it.vol_m3) || 0;
      pcTotalM += l;
      pcTotalVol += v;
      if (statuses[it.id] === 'done') {
        pcDoneCount += 1;
        pcDoneM += l;
        pcDoneVol += v;
      }
    });
    if (pcTotalM === 0) pcTotalM = 54.82;
    if (pcTotalVol === 0) pcTotalVol = 3.752;

    const bracingPct = Math.round(
      ((walerDoneM / 54.48) * 0.35 + (strutDone / 6) * 0.25 + (bkStatus === 'done' ? 0.1 : 0) + (pcDoneM / pcTotalM) * 0.2 + (jackDone / 2) * 0.1) * 100
    );

    // 3. Excavation (2-Level Design: Case B West = -2.90m, Case A East = -3.80m · Total 571.79 m³)
    const depth = Math.max(0, Math.min(3.8, Number(state.excavationDepth) || 0));
    const stages = [
      { name: 'Stage 1 · ดินถม L1 (0.00 → -1.50 ม.)', top: 0, bot: 1.5, vol: 248.16 },
      { name: 'Stage 2 · ดินเหนียวปนซิลท์ L2 (-1.50 → -2.50 ม.)', top: 1.5, bot: 2.5, vol: 165.44 },
      { name: 'Stage 3a · ดินเหนียวอ่อน (-2.50 → -2.90 ม. · Case B/F18)', top: 2.5, bot: 2.9, vol: 66.18 },
      { name: 'Stage 3b · โซนขวา F20 (-2.90 → -3.80 ม. · Case A)', top: 2.9, bot: 3.8, vol: 92.01 },
    ].map((st) => {
      const thickness = st.bot - st.top;
      const dug = Math.max(0, Math.min(thickness, depth - st.top));
      const pct = Math.round((dug / thickness) * 100);
      const dugVol = +(st.vol * (dug / thickness)).toFixed(2);
      return { ...st, pct, dugVol };
    });
    const exTotalVol = 571.79;
    const exDugVol = +stages.reduce((a, s) => a + s.dugVol, 0).toFixed(2);
    const exPct = Math.min(100, Math.round((exDugVol / exTotalVol) * 100));

    const overallSpPct = Math.round((spPct * 0.4 + bracingPct * 0.3 + exPct * 0.3));

    const walerTodayM = +walerDefs.reduce((a, w) => a + (statuses[w.id] === 'done' && statusDates[w.id] === reportDate ? w.len : 0), 0).toFixed(2);
    const strutToday = strutIds.filter((id) => statuses[id] === 'done' && statusDates[id] === reportDate).length;
    const pcTodayM = +pcItems.reduce((a, it) => a + (statuses[it.id] === 'done' && statusDates[it.id] === reportDate ? (Number(it.length_m) || 0) : 0), 0).toFixed(2);

    return {
      reportDate,
      sp: { sides, caseA, caseB, total: spTotal, done: spDone, today: spToday, todayMeters: spTodayMeters, progress: spProg, meters: spMeters, pct: spPct, totalWeightTon: 110.4 },
      bracing: {
        walerRows, walerDoneM: +walerDoneM.toFixed(2), walerTodayM, walerTotalM: 54.48,
        strutRows, strutDone, strutToday, strutTotal: 6,
        bkStatus, jackDone, jackTotal: 2, jackTons,
        pcDoneCount, pcTotalCount: pcItems.length || 28,
        pcDoneM: +pcDoneM.toFixed(2), pcTodayM, pcTotalM: +pcTotalM.toFixed(2),
        pcDoneVol: +pcDoneVol.toFixed(3), pcTotalVol: +pcTotalVol.toFixed(3),
        pct: bracingPct,
      },
      ex: { depth, stages, dugVol: exDugVol, totalVol: exTotalVol, pct: exPct },
      overallSpPct,
      logs: Array.isArray(state.logs) ? state.logs : [],
    };
  }

  function statusBadgeHtml(st) {
    if (st === 'done') return '<span style="background:#ECFDF5;color:#065F46;border:1px solid #10B981;padding:1px 6px;border-radius:99px;font-weight:700;font-size:10px;">เสร็จแล้ว</span>';
    if (st === 'progress') return '<span style="background:#FEF3C7;color:#92400E;border:1px solid #F59E0B;padding:1px 6px;border-radius:99px;font-weight:700;font-size:10px;">กำลังทำ</span>';
    return '<span style="background:#F1F5F9;color:#475569;border:1px solid #CBD5E1;padding:1px 6px;border-radius:99px;font-weight:600;font-size:10px;">รอเริ่ม</span>';
  }

  // Persistent in-memory 6 photos for Page 3
  const photos = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    dataUrl: '',
    caption: i === 0 ? 'ภาพจำลองความคืบหน้างานป้องกันดิน Sheet Pile & งานขุดดิน' : `ภาพถ่ายหน้างานที่ ${i + 1}`,
  }));

  let cachedMultiViews = null;
  let reportViewMode = 'status'; // 'status' | 'sketchup'

  function refreshMultiViews(mode) {
    if (mode) reportViewMode = mode;
    const b = getBridge();
    if (b?.captureMultiViews) {
      cachedMultiViews = b.captureMultiViews(reportViewMode);
    }
    return cachedMultiViews;
  }

  function ensureModalRoot() {
    let root = document.getElementById('sp-report-studio-modal');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sp-report-studio-modal';
    root.className = 'sp-print-root hidden fixed inset-0 z-[80] bg-[#475569] text-[#0F172A] flex flex-col';
    document.body.appendChild(root);
    return root;
  }

  // Official Sansiri 12-Hour Weather Pie Clock SVG (Identical to daily_report_studio.js)
  function buildWeatherClockSvg(clockType, weatherHours) {
    const hours = clockType === 'day'
      ? [12, 13, 14, 15, 16, 17, 6, 7, 8, 9, 10, 11]
      : [0, 1, 2, 3, 4, 5, 18, 19, 20, 21, 22, 23];
    const cx = 74, cy = 57, r = 38, deg2rad = Math.PI / 180;
    let pathsHtml = '', spokesHtml = '', labelsHtml = '';

    hours.forEach((h, idx) => {
      const startDeg = -90 + idx * 30;
      const endDeg = startDeg + 30;
      const x1 = (cx + r * Math.cos(startDeg * deg2rad)).toFixed(2);
      const y1 = (cy + r * Math.sin(startDeg * deg2rad)).toFixed(2);
      const x2 = (cx + r * Math.cos(endDeg * deg2rad)).toFixed(2);
      const y2 = (cy + r * Math.sin(endDeg * deg2rad)).toFixed(2);
      const st = (weatherHours && weatherHours[h]) || 'none';
      const pal = WEATHER_PALETTE[st] || WEATHER_PALETTE.none;
      const nextH = (h + 1) % 24;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
      pathsHtml += `<path d="${d}" fill="${pal.fill}" data-weather-hour="${h}" class="cursor-pointer transition-colors"><title>${String(h).padStart(2, '0')}:00-${String(nextH).padStart(2, '0')}:00 (${pal.label}) คลิกเพื่อเปลี่ยน</title></path>`;
    });

    hours.forEach((h, idx) => {
      const rad = (-90 + idx * 30) * deg2rad;
      const cosA = Math.cos(rad), sinA = Math.sin(rad);
      const isCard = idx % 3 === 0;
      const xEdge = (cx + r * cosA).toFixed(2);
      const yEdge = (cy + r * sinA).toFixed(2);
      spokesHtml += `<line x1="${cx}" y1="${cy}" x2="${xEdge}" y2="${yEdge}" stroke="${isCard ? '#0f172a' : '#475569'}" stroke-width="${isCard ? '1.15' : '0.65'}" pointer-events="none" />`;
      const tLen = isCard ? 3.2 : 2.0;
      spokesHtml += `<line x1="${xEdge}" y1="${yEdge}" x2="${(cx + (r + tLen) * cosA).toFixed(2)}" y2="${(cy + (r + tLen) * sinA).toFixed(2)}" stroke="#0f172a" stroke-width="${isCard ? '1.15' : '0.7'}" pointer-events="none" />`;

      if (isCard) {
        const lbl = `${String(h).padStart(2, '0')}:00`;
        let lx = cx, ly = cy, anchor = 'middle';
        if (idx === 0) { ly = cy - r - 6; }
        else if (idx === 3) { lx = cx + r + 5; ly = cy + 3; anchor = 'start'; }
        else if (idx === 6) { ly = cy + r + 12; }
        else if (idx === 9) { lx = cx - r - 5; ly = cy + 3; anchor = 'end'; }
        labelsHtml += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="'Sarabun',sans-serif" font-size="9.5" font-weight="800" fill="#0f172a" pointer-events="none">${lbl}</text>`;
      } else {
        const lx = (cx + (r + 9.2) * cosA).toFixed(1);
        const ly = (cy + (r + 9.2) * sinA + 2.5).toFixed(1);
        labelsHtml += `<text x="${lx}" y="${ly}" text-anchor="middle" font-family="'Sarabun',sans-serif" font-size="7.5" font-weight="700" fill="#334155" pointer-events="none">${String(h).padStart(2, '0')}</text>`;
      }
    });

    return `
      <svg viewBox="0 0 148 114" style="width:118px;height:92px;" class="select-none overflow-visible shrink-0">
        ${pathsHtml}${spokesHtml}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#0f172a" stroke-width="1.4" pointer-events="none" />
        <circle cx="${cx}" cy="${cy}" r="1.8" fill="#0f172a" pointer-events="none" />
        ${labelsHtml}
      </svg>
    `;
  }

  // Engineered 2D Architectural 2-Level Excavation Cross-Section SVG (Case B -2.90m / Case A -3.80m · FSP-3 12.0m / 13.5m)
  function renderExcavationSectionSvg(s) {
    const depth = Math.max(0, Math.min(3.8, Number(s.ex.depth) || 0));
    const elToY = (d) => {
      if (d <= 1.5) return 64 + (d / 1.5) * (132 - 64);
      if (d <= 2.5) return 132 + ((d - 1.5) / 1.0) * (178 - 132);
      if (d <= 2.9) return 178 + ((d - 2.5) / 0.4) * (206 - 178);
      if (d <= 3.8) return 206 + ((d - 2.9) / 0.9) * (258 - 206);
      return 258 + ((d - 3.8) / 9.7) * (352 - 258);
    };
    const splitX = 235; // Exact F18/F20 split (7.18m West Case B / 11.62m East Case A)
    const yW = Math.round(elToY(Math.min(depth, 2.9)));
    const yE = Math.round(elToY(depth));
    const hasBracing = (s.bracing.walerDoneM > 0 || s.bracing.strutDone > 0);
    const remVol = Math.max(0, +(s.ex.totalVol - s.ex.dugVol).toFixed(1));
    const dugHW = Math.max(0, yW - 64);
    const remHW = Math.max(0, 206 - yW);
    const dugHE = Math.max(0, yE - 64);
    const remHE = Math.max(0, 258 - yE);

    return `
      <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" class="w-full aspect-[16/10] bg-white block" style="font-family:'Prompt','Sarabun',sans-serif;">
        <defs>
          <pattern id="sp-hatch-soil" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#B45309" stroke-width="1.4" stroke-opacity="0.38" />
          </pattern>
          <pattern id="sp-hatch-clay" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#64748B" stroke-width="1" stroke-opacity="0.22" />
          </pattern>
        </defs>
        <rect x="20" y="64" width="420" height="68" fill="#E8DCCB" fill-opacity="0.45" />
        <rect x="20" y="132" width="420" height="46" fill="#DDD0BE" fill-opacity="0.50" />
        <rect x="20" y="178" width="420" height="80" fill="#CBD5E1" fill-opacity="0.40" />
        <rect x="20" y="258" width="420" height="116" fill="#E2E8F0" fill-opacity="0.55" />
        <rect x="20" y="258" width="420" height="116" fill="url(#sp-hatch-clay)" />
        <!-- Unexcavated West SoftClay Bench under Case B (-2.90m to -3.80m) -->
        <rect x="122" y="206" width="${splitX - 122}" height="52" fill="#CBD5E1" fill-opacity="0.80" />
        <rect x="122" y="206" width="${splitX - 122}" height="52" fill="url(#sp-hatch-clay)" />

        <line x1="115" y1="36" x2="115" y2="62" stroke="#1D2B45" stroke-width="1" stroke-dasharray="3,2" />
        <circle cx="115" cy="22" r="14" fill="#FFFFFF" stroke="#1D2B45" stroke-width="2" />
        <text x="115" y="26" text-anchor="middle" font-size="10" font-weight="800" fill="#1D2B45">3–4</text>
        <line x1="425" y1="36" x2="425" y2="62" stroke="#1D2B45" stroke-width="1" stroke-dasharray="3,2" />
        <circle cx="425" cy="22" r="14" fill="#FFFFFF" stroke="#1D2B45" stroke-width="2" />
        <text x="425" y="26" text-anchor="middle" font-size="11" font-weight="800" fill="#1D2B45">7</text>
        <line x1="132" y1="22" x2="408" y2="22" stroke="#1D2B45" stroke-width="1.2" />
        <polygon points="132,22 139,18 139,26" fill="#1D2B45" />
        <polygon points="408,22 401,18 401,26" fill="#1D2B45" />
        <rect x="172" y="11" width="196" height="22" rx="4" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.2" />
        <text x="270" y="26" text-anchor="middle" font-size="10" font-weight="800" fill="#1D2B45">บ่อ 18.80 ม. (F18: -2.90 · F20: -3.80)</text>
        <line x1="20" y1="64" x2="444" y2="64" stroke="#1D2B45" stroke-width="2" />
        <text x="24" y="58" font-size="10" font-weight="800" fill="#1D2B45">GL. 0.00 ม.</text>

        <!-- Excavated & Remaining Soil (2-Level Split at F18 / F20) -->
        ${dugHW > 0 ? `<rect x="122" y="64" width="${splitX - 122}" height="${dugHW}" fill="#E0F2FE" />` : ''}
        ${remHW > 0 ? `<rect x="122" y="${yW}" width="${splitX - 122}" height="${remHW}" fill="#FDE6C4" /><rect x="122" y="${yW}" width="${splitX - 122}" height="${remHW}" fill="url(#sp-hatch-soil)" />` : ''}
        ${dugHE > 0 ? `<rect x="${splitX}" y="64" width="${418 - splitX}" height="${dugHE}" fill="#E0F2FE" />` : ''}
        ${remHE > 0 ? `<rect x="${splitX}" y="${yE}" width="${418 - splitX}" height="${remHE}" fill="#FDE6C4" /><rect x="${splitX}" y="${yE}" width="${418 - splitX}" height="${remHE}" fill="url(#sp-hatch-soil)" />` : ''}

        <line x1="122" y1="132" x2="418" y2="132" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3" />
        <line x1="122" y1="178" x2="418" y2="178" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3" />
        <line x1="${splitX}" y1="64" x2="${splitX}" y2="258" stroke="#64748B" stroke-width="1" stroke-dasharray="3,2" />

        <!-- Bracing Level @ EL -1.00m -->
        <rect x="122" y="104" width="296" height="11" fill="${hasBracing ? '#10B981' : '#FFFFFF'}" fill-opacity="0.94" stroke="${hasBracing ? '#065F46' : '#475569'}" stroke-width="1.5" ${hasBracing ? '' : 'stroke-dasharray="4,2"'} />
        <text x="270" y="112.5" text-anchor="middle" font-size="8.5" font-weight="800" fill="${hasBracing ? '#FFFFFF' : '#334155'}">ค้ำยัน Waler H-350 / Strut (EL -1.00 ม.)</text>

        <!-- Stepped Design Excavation Floor: Case B -2.90m (West) + Case A -3.80m (East) -->
        <polyline points="122,206 ${splitX},206 ${splitX},258 418,258" fill="none" stroke="#DC2626" stroke-width="2.2" stroke-dasharray="5,2.5" />
        <rect x="126" y="211" width="104" height="16" rx="3" fill="#EFF6FF" stroke="#0369A1" stroke-width="1" />
        <text x="178" y="222" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0369A1">Case B (F18) -2.90 ม.</text>
        <rect x="245" y="262" width="154" height="17" rx="3" fill="#FEF2F2" stroke="#DC2626" stroke-width="1" />
        <text x="322" y="273.5" text-anchor="middle" font-size="8.8" font-weight="800" fill="#B91C1C">Case A (F20) -3.80 ม.</text>

        ${depth > 0 ? `
          <polyline points="122,${yW} ${splitX},${yW} ${splitX},${yE} 418,${yE}" fill="none" stroke="#0284C7" stroke-width="2.8" />
          <rect x="156" y="${Math.max(66, Math.min(Math.min(yW, yE) - 34, 168))}" width="228" height="30" rx="5" fill="#0284C7" stroke="#1D2B45" stroke-width="1.5" />
          <text x="270" y="${Math.max(78, Math.min(Math.min(yW, yE) - 21, 180))}" text-anchor="middle" font-size="10" font-weight="800" fill="#FFFFFF">ขุดแล้ว EL -${depth.toFixed(2)} ม. (${s.ex.pct}%)</text>
          <text x="270" y="${Math.max(91, Math.min(Math.min(yW, yE) - 8, 193))}" text-anchor="middle" font-size="9" font-weight="700" fill="#E0F2FE">${s.ex.dugVol} / ${s.ex.totalVol} ลบ.ม. (เหลือ ${remVol})</text>
        ` : `
          <rect x="160" y="72" width="220" height="28" rx="5" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.5" />
          <text x="270" y="85" text-anchor="middle" font-size="10" font-weight="800" fill="#1D2B45">ยังไม่เริ่มขุดดิน (EL 0.00 ม.)</text>
          <text x="270" y="96" text-anchor="middle" font-size="8.8" font-weight="700" fill="#B45309">ปริมาตรรอขุด 2 ระดับ รวม ${s.ex.totalVol} ลบ.ม.</text>
        `}

        <!-- Left Sheet Pile (Case B: FSP-3 12.00m) & Right Sheet Pile (Case A: FSP-3 13.50m) -->
        <rect x="108" y="60" width="14" height="274" fill="#0369A1" stroke="#0F172A" stroke-width="1.5" />
        <rect x="418" y="60" width="14" height="294" fill="#1D2B45" stroke="#0F172A" stroke-width="1.5" />
        <text x="115" y="348" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0369A1">FSP-3</text>
        <text x="115" y="359" text-anchor="middle" font-size="8.5" font-weight="800" fill="#0369A1">12.0ม.(B)</text>
        <text x="425" y="368" text-anchor="middle" font-size="8.5" font-weight="800" fill="#1D2B45">FSP-3</text>
        <text x="425" y="379" text-anchor="middle" font-size="8.5" font-weight="800" fill="#1D2B45">13.5ม.(A)</text>

        <line x1="122" y1="334" x2="235" y2="334" stroke="#0369A1" stroke-width="1.2" stroke-dasharray="4,2" />
        <line x1="235" y1="354" x2="444" y2="354" stroke="#1D2B45" stroke-width="1.2" stroke-dasharray="4,2" />
        <rect x="132" y="316" width="128" height="16" rx="3" fill="#EFF6FF" stroke="#0369A1" stroke-width="1" />
        <text x="196" y="327" text-anchor="middle" font-size="8.2" font-weight="800" fill="#0369A1">Case B: 52 แผ่น · 12.0 ม.</text>
        <rect x="266" y="337" width="144" height="16" rx="3" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1" />
        <text x="338" y="348" text-anchor="middle" font-size="8.2" font-weight="800" fill="#1D2B45">Case A: 90 แผ่น · 13.5 ม.</text>

        <text x="102" y="99" text-anchor="end" font-size="8.5" font-weight="800" fill="#78350F">S1: 0→-1.5m</text>
        <text x="102" y="158" text-anchor="end" font-size="8.5" font-weight="800" fill="#78350F">S2: -1.5→-2.5</text>
        <text x="102" y="196" text-anchor="end" font-size="8.5" font-weight="800" fill="#0369A1">S3a: -2.90m</text>
        <text x="102" y="236" text-anchor="end" font-size="8.5" font-weight="800" fill="#B91C1C">S3b: -3.80m</text>

        <g font-size="9.2" font-weight="700">
          <rect x="448" y="64" width="182" height="68" fill="#F5EFE6" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="79" font-size="8.8" font-weight="800" fill="#78350F">EL 0.00 → -1.50 ม. (Stage 1)</text>
          <text x="455" y="94" font-size="9.2" font-weight="800" fill="#1D2B45">L1 ดินถม (Fill)</text>
          <text x="455" y="108" font-size="8.5" fill="#475569">ปริมาตรขุด 248.16 ลบ.ม.</text>
          <rect x="448" y="132" width="182" height="46" fill="#EDE3D5" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="146" font-size="8.8" font-weight="800" fill="#78350F">EL -1.50 → -2.50 ม. (Stage 2)</text>
          <text x="455" y="160" font-size="9" font-weight="800" fill="#1D2B45">L2 ดินเหนียวปนซิลท์ (165.44 ม³)</text>
          <rect x="448" y="178" width="182" height="80" fill="#E2E8F0" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="193" font-size="8.5" font-weight="800" fill="#0369A1">S3a: -2.50→-2.90 ม. (66.18 ม³)</text>
          <text x="455" y="207" font-size="8.5" font-weight="800" fill="#B91C1C">S3b: -2.90→-3.80 ม. (92.01 ม³)</text>
          <text x="455" y="223" font-size="9" font-weight="800" fill="#1D2B45">L3a ดินเหนียวอ่อน (2 ระดับ)</text>
          <text x="455" y="238" font-size="8.3" fill="#475569">F18 -2.90 ม. · F20 -3.80 ม.</text>
          <rect x="448" y="258" width="182" height="96" fill="#F1F5F9" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="275" font-size="8.8" font-weight="800" fill="#DC2626">EL -3.80 → -13.50 ม.</text>
          <text x="455" y="292" font-size="9.2" font-weight="800" fill="#1D2B45">L3 ดินเหนียวอ่อนมาก</text>
          <text x="455" y="307" font-size="8.3" fill="#475569">JIS FSP-III (400×125×13 มม.)</text>
          <text x="455" y="328" font-size="8.5" font-weight="800" fill="#0369A1">ปลาย Case B: EL -12.00 ม.</text>
          <text x="455" y="343" font-size="8.5" font-weight="800" fill="#1D2B45">ปลาย Case A: EL -13.50 ม.</text>
        </g>
      </svg>
    `;
  }

  function renderStudio(initialTab) {
    const root = ensureModalRoot();
    const cfg = loadCfg();
    // studioMode: 'summary' (Dedicated Capture PNG + Formal LINE Message Studio) | 'daily' (Official Sansiri 4-Page PDF)
    let studioMode = initialTab === 'overview' ? 'summary' : 'daily';
    let showLinePanel = true;
    let activeView = 'all';
    refreshMultiViews(reportViewMode);

    function buildLineSummary() {
      const st = computeDetailedStats();
      const dateLabel = formatThaiDateFull(st.reportDate || cfg.date);
      const todayBracingParts = [];
      if (st.bracing.walerTodayM > 0) todayBracingParts.push(`Waler ${st.bracing.walerTodayM} ม.`);
      if (st.bracing.strutToday > 0) todayBracingParts.push(`Strut/Corner ${st.bracing.strutToday} ต้น`);
      if (st.bracing.pcTodayM > 0) todayBracingParts.push(`Packing Concrete ${st.bracing.pcTodayM} ม.`);
      const todayBracingText = todayBracingParts.length ? todayBracingParts.join(', ') : 'อยู่ระหว่างเตรียมงาน / ตรวจสอบหน้างาน';

      return [
        `📋 อัปเดตผลงานประจำวัน · โครงการ ${cfg.projectName}`,
        `📅 วันที่ ${dateLabel}`,
        ``,
        `🔹 ผลงานวันนี้`,
        `• กดชีตไพล์: ${st.sp.today} แผ่น (${st.sp.todayMeters} ม.)`,
        `• ติดตั้ง Waler / Strut & เท Packing Concrete: ${todayBracingText}`,
        `• งานขุดดิน: ระดับปัจจุบัน EL. -${st.ex.depth.toFixed(2)} ม. (${st.ex.pct}%)`,
        ``,
        `📊 ผลงานสะสมรวม`,
        `✅ 1. งานเสาเข็ม (I-0.40 ม.): 93 / 93 ต้น (100% — แล้วเสร็จ)`,
        `🛡️ 2. งานป้องกันดิน Sheet Pile & งานขุดดิน (รวม ${st.overallSpPct}%)`,
        `   • 2.1 งานกดชีตไพล์ รุ่น JIS FSP-III (SP-3 · SY295 · 60 กก./ม.): ${st.sp.done} / ${st.sp.total} แผ่น (${st.sp.pct}%)`,
        `     - Case A (ยาว 13.50 ม.): ${st.sp.caseA.done}/${st.sp.caseA.total} แผ่น (${st.sp.caseA.pct}%) | Case B (ยาว 12.00 ม.): ${st.sp.caseB.done}/${st.sp.caseB.total} แผ่น (${st.sp.caseB.pct}%)`,
        `     - Grid A–B: ${st.sp.sides.N.done}/${st.sp.sides.N.total} | Grid E: ${st.sp.sides.S.done}/${st.sp.sides.S.total} | Grid 3–4: ${st.sp.sides.W.done}/${st.sp.sides.W.total} | Grid 7: ${st.sp.sides.E.done}/${st.sp.sides.E.total} | มุม: ${st.sp.sides.C.done}/${st.sp.sides.C.total}`,
        `   • 2.2 งานติดตั้ง Waler / Strut / Preload & เท Packing Concrete: ${st.bracing.pct}%`,
        `     - Waler H-350: ${st.bracing.walerDoneM} / ${st.bracing.walerTotalM} ม. | Strut & Corner: ${st.bracing.strutDone} / 6 ต้น`,
        `     - Packing Concrete: ${st.bracing.pcDoneM} / ${st.bracing.pcTotalM} ม. (${st.bracing.pcDoneVol}/${st.bracing.pcTotalVol} ม³) | Preload Jack: ${st.bracing.jackDone} / 2 จุด`,
        `   • 2.3 งานขุดดิน 2 ระดับ (Case B -2.90 ม. / Case A -3.80 ม.): EL. -${st.ex.depth.toFixed(2)} ม. · ${st.ex.dugVol} / ${st.ex.totalVol} ลบ.ม. (${st.ex.pct}%)`,
      ].join('\n');
    }

    // PAGE 1: EXACT OFFICIAL SANSIRI DAILY REPORT FORM
    function renderPage1(s) {
      const thaiDateFull = formatThaiDateFull(cfg.date);
      const sumMgmt = cfg.manpower.mgmt.reduce((a, m) => a + (parseInt(m.count, 10) || 0), 0);
      const sumWorkers = cfg.manpower.workers.reduce((a, w) => a + (parseInt(w.count, 10) || 0), 0);
      const sumMachinery = cfg.manpower.machinery.reduce((a, m) => a + (parseInt(m.count, 10) || 0), 0);
      const permitItems = [
        { key: 'noisy', label: 'งานทำให้เกิดเสียงดัง' },
        { key: 'smelly', label: 'งานที่มีกลิ่น' },
        { key: 'dusty', label: 'งานที่เกี่ยวกับฝุ่น' },
        { key: 'none', label: 'ไม่มีข้อห้าม' },
        { key: 'other', label: 'อื่นๆ' },
      ];

      return `
        <article class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-slate-900 shadow-lg p-5 sm:p-6 text-[#0F172A]" style="font-family:'Sarabun','Prompt',sans-serif;">
          <!-- SANSIRI Logo & Header -->
          <div class="flex flex-col items-center justify-center mb-1.5">
            <img src="Logo/png/Sansiri-logo-en-black.png" alt="SANSIRI" style="height:22px;width:auto;display:block;margin-bottom:4px;" onerror="this.style.display='none'" />
            <div class="flex items-center justify-center gap-1 text-xs font-bold text-slate-900">
              <span>โครงการ</span>
              <input type="text" data-cfg="projectName" value="${esc(cfg.projectName)}" class="border-b border-dashed border-slate-400 font-black text-center px-1 text-slate-900 bg-transparent outline-none w-44" />
            </div>
            <div class="w-full max-w-sm mt-1 border-2 border-slate-900 rounded-md py-0.5 px-3 text-center bg-white">
              <h1 class="text-sm font-bold text-slate-900">รายงานการทำงานประจำวัน</h1>
            </div>
          </div>

          <!-- Top Information Strip + Dual 24h Weather Clocks -->
          <div class="border border-slate-900 text-[11px] mb-1.5 bg-white leading-normal">
            <div class="p-1.5 space-y-1">
              <div class="flex justify-between items-center gap-2">
                <div class="flex items-center gap-1">
                  <span class="font-bold shrink-0">ถึง :</span>
                  <input type="text" data-cfg="toCompany" value="${esc(cfg.toCompany)}" class="border-b border-slate-300 font-bold px-1 text-slate-900 bg-transparent outline-none w-60 text-[11px]" />
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-bold">วันที่ทำงาน :</span>
                  <input type="date" data-cfg="date" value="${esc(cfg.date)}" class="no-print border-b border-slate-400 font-bold px-1 text-center bg-transparent outline-none text-[11px]" />
                  <span class="hidden print:inline font-bold border-b border-slate-400 px-1">${esc(thaiDateFull)}</span>
                </div>
              </div>

              <div class="flex justify-between items-center gap-2">
                <div class="flex items-center gap-1">
                  <span class="font-bold shrink-0">เรียน :</span>
                  <input type="text" data-cfg="recipient" value="${esc(cfg.recipient)}" class="border-b border-slate-400 font-bold px-1 text-slate-900 bg-transparent outline-none w-64 text-[11px]" />
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-bold">เอกสารแนบจำนวน :</span>
                  <input type="number" min="1" data-cfg="attachmentPages" value="${esc(cfg.attachmentPages)}" class="border-b border-slate-400 text-center w-10 font-bold outline-none bg-transparent" />
                  <span>แผ่น</span>
                </div>
              </div>

              <div class="flex items-center flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                <span class="font-bold shrink-0">การระงับการทำงาน :</span>
                ${permitItems.map((p) => `
                  <label class="inline-flex items-center gap-1 cursor-pointer select-none">
                    <input type="checkbox" data-permit="${p.key}" ${cfg.workPermit === p.key ? 'checked' : ''} class="rounded border-slate-900" />
                    <span>${p.label}</span>
                  </label>
                `).join('')}
                <input type="text" data-cfg="workPermitOther" value="${esc(cfg.workPermitOther)}" placeholder="ระบุ..." class="border-b border-slate-300 text-[10.5px] px-1 outline-none w-24 bg-transparent" />
              </div>
            </div>

            <!-- เวลาการทำงาน / สภาพอากาศ (24h Dual Clock Gauge) -->
            <div class="border-t border-slate-900">
              <div class="bg-[#e2e8f0] border-b border-slate-400 py-0.5 px-2 text-center text-xs font-extrabold text-slate-900">
                เวลาการทำงาน &nbsp;/&nbsp; สภาพอากาศ
              </div>
              <div class="bg-white" style="display:grid;grid-template-columns:120px 120px 168px 120px 112px;align-items:stretch;justify-content:space-between;padding:5px 10px;">
                <div class="flex flex-col justify-between py-1">
                  <div class="flex items-baseline gap-1 text-[10.5px] whitespace-nowrap">
                    <span class="font-bold">เวลาทำงานปกติ</span>
                    <input type="text" data-cfg="normalHours" value="${esc(cfg.normalHours)}" style="width:24px;" class="border-b border-dotted border-slate-700 text-center font-bold bg-transparent outline-none" />
                    <span class="font-bold">ชั่วโมง</span>
                  </div>
                  <div class="flex items-baseline gap-1 text-[10.5px] whitespace-nowrap">
                    <span class="font-bold">เวลาเริ่มงาน</span>
                    <input type="text" data-cfg="startTime" value="${esc(cfg.startTime)}" style="width:38px;" class="border-b border-dotted border-slate-700 text-center font-bold bg-transparent outline-none" />
                    <span class="font-bold">น.</span>
                  </div>
                </div>
                <div class="flex items-center justify-center">${buildWeatherClockSvg('day', cfg.weatherHours)}</div>
                <div class="flex flex-col justify-between border-l border-slate-200 pl-2 py-1">
                  <div class="flex items-baseline gap-1 text-[10.5px] whitespace-nowrap">
                    <span class="font-bold">นอกเวลาทำงานปกติ</span>
                    <input type="text" data-cfg="overtimeHours" value="${esc(cfg.overtimeHours)}" style="width:24px;" class="border-b border-dotted border-slate-700 text-center font-bold bg-transparent outline-none" />
                    <span class="font-bold">ชั่วโมง</span>
                  </div>
                  <div class="space-y-1">
                    <label class="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold whitespace-nowrap">
                      <input type="checkbox" data-impact="none" ${cfg.weatherImpact !== 'impact' ? 'checked' : ''} class="w-3.5 h-3.5 border-slate-900" />
                      <span>ไม่กระทบกับการทำงาน</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold whitespace-nowrap">
                      <input type="checkbox" data-impact="impact" ${cfg.weatherImpact === 'impact' ? 'checked' : ''} class="w-3.5 h-3.5 border-slate-900" />
                      <span>กระทบกับการทำงาน อธิบายในอุปสรรค</span>
                    </label>
                  </div>
                </div>
                <div class="flex items-center justify-center">${buildWeatherClockSvg('night', cfg.weatherHours)}</div>
                <div class="flex flex-col justify-between border-l border-slate-200 pl-2 py-1">
                  <div>
                    <div class="text-[10.5px] font-extrabold mb-1">สัญลักษณ์</div>
                    <div class="space-y-1">
                      <div class="flex items-center gap-1.5 text-[10px] font-bold leading-none"><span style="width:16px;height:8px;background:#67E8F9;border:1px solid #0284C7;display:inline-block;"></span>ปลอดโปร่ง</div>
                      <div class="flex items-center gap-1.5 text-[10px] font-bold leading-none"><span style="width:16px;height:8px;background:#FDE047;border:1px solid #CA8A04;display:inline-block;"></span>ไม่แจ่มใส</div>
                      <div class="flex items-center gap-1.5 text-[10px] font-bold leading-none"><span style="width:16px;height:8px;background:#FDBA74;border:1px solid #EA580C;display:inline-block;"></span>ฝนตก</div>
                    </div>
                  </div>
                  <div class="flex items-baseline gap-1 text-[10.5px] whitespace-nowrap">
                    <span class="font-bold">เวลาเลิกงาน</span>
                    <input type="text" data-cfg="endTime" value="${esc(cfg.endTime)}" style="width:36px;" class="border-b border-dotted border-slate-700 text-center font-bold bg-transparent outline-none" />
                    <span class="font-bold">น.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- รายการที่ดำเนินงานวันนี้ (ข้อ 1: งานเสาเข็ม I-0.40 93 ต้น 100% | ข้อ 2: Sheet Pile 2.1, 2.2, 2.3) -->
          <div class="mb-1">
            <table class="w-full border-collapse border border-slate-900 text-[10.5px]">
              <thead>
                <tr>
                  <th colspan="7" class="border border-slate-900 bg-slate-100 py-0.5 text-center font-bold text-[11px]">รายการที่ดำเนินงานวันนี้</th>
                </tr>
                <tr class="bg-slate-50 text-[10px]">
                  <th class="border border-slate-900 w-8 py-0.5 text-center">ลำดับ</th>
                  <th class="border border-slate-900 text-left px-1.5 py-0.5">รายการ</th>
                  <th class="border border-slate-900 w-24 py-0.5 text-center">สถานที่</th>
                  <th class="border border-slate-900 w-20 py-0.5 text-center">ปริมาณ</th>
                  <th class="border border-slate-900 w-24 py-0.5 text-center">ทำไปแล้ว</th>
                  <th class="border border-slate-900 w-14 py-0.5 text-center">% เสร็จ</th>
                  <th class="border border-slate-900 w-16 py-0.5 text-left px-1">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. งานเสาเข็ม I-0.40 93 ต้น 100% (1 บรรทัดเดียว) -->
                <tr>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">1</td>
                  <td class="border border-slate-900 px-1.5 py-0.5 font-bold whitespace-nowrap">งานเสาเข็ม (I-0.40 ม.)</td>
                  <td class="border border-slate-900 text-center py-0.5">ทั้งโครงการ</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5">93 ต้น</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">93 ต้น</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 text-emerald-700 bg-emerald-50/70">100%</td>
                  <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-cfg="remarks1" value="${esc(cfg.remarks1)}" class="w-full bg-transparent outline-none text-[10px]" /></td>
                </tr>

                <!-- 2. งานป้องกันดิน Sheet Pile (หัวข้อหลัก) -->
                <tr class="bg-slate-50/90">
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5">2</td>
                  <td class="border border-slate-900 px-1.5 py-0.5 font-black whitespace-nowrap">งานป้องกันดิน Sheet Pile (JIS FSP-III / SP-3) &amp; งานขุดดิน</td>
                  <td class="border border-slate-900 text-center py-0.5">บ่อฐานราก</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5">142 แผ่น</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">สะสมรวม</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 ${s.overallSpPct === 100 ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-900'}">${s.overallSpPct}%</td>
                  <td class="border border-slate-900 px-1 py-0.5 text-[9.5px] text-slate-600">SY295 · 110.4 ตัน</td>
                </tr>

                <!-- 2.1 งานกดชีตไพล์ Case A (FSP-3 ยาว 13.50 ม.) -->
                <tr>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">2.1</td>
                  <td class="border border-slate-900 px-1.5 pl-3 py-0.5 font-semibold whitespace-nowrap">กดชีตไพล์ JIS FSP-III (SP-3) · Case A ยาว 13.50 ม.</td>
                  <td class="border border-slate-900 text-center py-0.5 text-[9.5px] whitespace-nowrap">Grid A–B, E, 7 (ขวา)</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5">${s.sp.caseA.total} แผ่น</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">${s.sp.caseA.done} แผ่น</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 ${s.sp.caseA.pct === 100 ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-900'}">${s.sp.caseA.pct}%</td>
                  <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-cfg="remarks21" value="${esc(cfg.remarks21)}" placeholder="88ตรง+2มุม" class="w-full bg-transparent outline-none text-[9.5px]" /></td>
                </tr>

                <!-- 2.2 งานกดชีตไพล์ Case B (FSP-3 ยาว 12.00 ม.) -->
                <tr>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">2.2</td>
                  <td class="border border-slate-900 px-1.5 pl-3 py-0.5 font-semibold whitespace-nowrap">กดชีตไพล์ JIS FSP-III (SP-3) · Case B ยาว 12.00 ม.</td>
                  <td class="border border-slate-900 text-center py-0.5 text-[9.5px] whitespace-nowrap">Grid A–B, E, 3–4 (ซ้าย)</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5">${s.sp.caseB.total} แผ่น</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">${s.sp.caseB.done} แผ่น</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 ${s.sp.caseB.pct === 100 ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-900'}">${s.sp.caseB.pct}%</td>
                  <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-cfg="remarks24" value="${esc(cfg.remarks24 || '')}" placeholder="50ตรง+2มุม" class="w-full bg-transparent outline-none text-[9.5px]" /></td>
                </tr>

                <!-- 2.3 งานติดตั้ง Waler / Strut & เท Packing Concrete -->
                <tr>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">2.3</td>
                  <td class="border border-slate-900 px-1.5 pl-3 py-0.5 font-semibold whitespace-nowrap">ติดตั้ง Waler / Strut H-350 &amp; Packing Concrete (-1.00 ม.)</td>
                  <td class="border border-slate-900 text-center py-0.5">บ่อฐานราก</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5 text-[9.5px] whitespace-nowrap">54.48ม.·3.75ม³</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5 text-[9.5px] whitespace-nowrap">${s.bracing.walerDoneM}ม.·${s.bracing.strutDone}/6</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 ${s.bracing.pct === 100 ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-900'}">${s.bracing.pct}%</td>
                  <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-cfg="remarks22" value="${esc(cfg.remarks22)}" class="w-full bg-transparent outline-none text-[9.5px]" /></td>
                </tr>

                <!-- 2.4 งานขุดดิน 2 ระดับ -->
                <tr>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5">2.4</td>
                  <td class="border border-slate-900 px-1.5 pl-3 py-0.5 font-semibold whitespace-nowrap">งานขุดดิน 2 ระดับ (F18: -2.90 ม. / F20: -3.80 ม.)</td>
                  <td class="border border-slate-900 text-center py-0.5">บ่อ F18 / F20</td>
                  <td class="border border-slate-900 text-center font-mono py-0.5 text-[9.5px] whitespace-nowrap">${s.ex.totalVol} ม³</td>
                  <td class="border border-slate-900 text-center font-mono font-bold py-0.5 text-[9.5px] whitespace-nowrap">${s.ex.dugVol} ม³ (-${s.ex.depth.toFixed(2)})</td>
                  <td class="border border-slate-900 text-center font-mono font-black py-0.5 ${s.ex.pct === 100 ? 'text-emerald-700 bg-emerald-50/70' : 'text-slate-900'}">${s.ex.pct}%</td>
                  <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-cfg="remarks23" value="${esc(cfg.remarks23)}" class="w-full bg-transparent outline-none text-[9.5px]" /></td>
                </tr>

                <!-- 2 Extra Editable Blank Rows -->
                ${cfg.extraRows.map((r, idx) => `
                  <tr style="height:20px;">
                    <td class="border border-slate-900 text-center font-mono py-0.5">${r.title ? (idx + 3) : ''}</td>
                    <td class="border border-slate-900 px-1.5 py-0.5"><input type="text" data-extra="${idx}:title" value="${esc(r.title)}" class="w-full bg-transparent outline-none text-[10.5px]" /></td>
                    <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-extra="${idx}:location" value="${esc(r.location)}" class="w-full bg-transparent outline-none text-center text-[10.5px]" /></td>
                    <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-extra="${idx}:qty" value="${esc(r.qty)}" class="w-full bg-transparent outline-none text-center font-mono text-[10.5px]" /></td>
                    <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-extra="${idx}:done" value="${esc(r.done)}" class="w-full bg-transparent outline-none text-center font-mono text-[10.5px]" /></td>
                    <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-extra="${idx}:pct" value="${esc(r.pct)}" class="w-full bg-transparent outline-none text-center font-mono font-bold text-[10.5px]" /></td>
                    <td class="border border-slate-900 px-1 py-0.5"><input type="text" data-extra="${idx}:remarks" value="${esc(r.remarks)}" class="w-full bg-transparent outline-none text-[10px]" /></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- 3-Column Manpower & Machinery -->
          <div class="grid grid-cols-3 gap-2 border border-slate-900 p-1.5 mb-1.5 bg-white text-[10px]">
            <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between">
              <div>
                <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-[10.5px]">1. เจ้าหน้าที่บริหาร / โครงการ</div>
                ${cfg.manpower.mgmt.map((m, idx) => `
                  <div class="flex items-center justify-between py-0.5 border-b border-slate-200">
                    <div class="flex items-center gap-0.5 flex-1 mr-1 min-w-0">
                      <span class="text-slate-500">${idx + 1}.</span>
                      <input type="text" data-mp="mgmt:${idx}:label" value="${esc(m.label)}" class="w-full bg-transparent outline-none truncate" />
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <input type="number" min="0" data-mp="mgmt:${idx}:count" value="${m.count}" class="w-7 text-right font-mono font-black bg-transparent outline-none" />
                      <span class="text-[9px] text-slate-500">คน</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="flex justify-between items-center pt-1 mt-1 border-t border-slate-900 font-bold">
                <span>รวม</span><span><span class="font-mono text-xs">${sumMgmt}</span> คน</span>
              </div>
            </div>

            <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between">
              <div>
                <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-[10.5px]">2. ช่าง / ผู้รับเหมา / คนงาน</div>
                ${cfg.manpower.workers.map((w, idx) => `
                  <div class="flex items-center justify-between py-0.5 border-b border-slate-200">
                    <div class="flex items-center gap-0.5 flex-1 mr-1 min-w-0">
                      <span class="text-slate-500">${idx + 1}.</span>
                      <input type="text" data-mp="workers:${idx}:label" value="${esc(w.label)}" class="w-full bg-transparent outline-none truncate" />
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <input type="number" min="0" data-mp="workers:${idx}:count" value="${w.count}" class="w-7 text-right font-mono font-black bg-transparent outline-none" />
                      <span class="text-[9px] text-slate-500">คน</span>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="flex justify-between items-center pt-1 mt-1 border-t border-slate-900 font-bold">
                <span>รวม</span><span><span class="font-mono text-xs">${sumWorkers}</span> คน</span>
              </div>
            </div>

            <div class="flex flex-col justify-between">
              <div>
                <div class="font-bold border-b border-slate-900 pb-0.5 mb-0.5 text-[10.5px]">3. เครื่องจักร / ยานพาหนะ</div>
                ${cfg.manpower.machinery.map((m, idx) => `
                  <div class="flex items-center justify-between py-0.5 border-b border-slate-200">
                    <div class="flex items-center gap-0.5 flex-1 mr-1 min-w-0">
                      <span class="text-slate-500">${idx + 1}.</span>
                      <input type="text" data-mp="machinery:${idx}:label" value="${esc(m.label)}" class="w-full bg-transparent outline-none truncate" />
                    </div>
                    <div class="flex items-center gap-0.5 shrink-0">
                      <input type="number" min="0" data-mp="machinery:${idx}:count" value="${m.count}" class="w-7 text-right font-mono font-black bg-transparent outline-none" />
                      <input type="text" data-mp="machinery:${idx}:unit" value="${esc(m.unit || 'คัน')}" class="w-8 text-center text-[9px] text-slate-500 bg-transparent outline-none" />
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="flex justify-between items-center pt-1 mt-1 border-t border-slate-900 font-bold">
                <span>รวม</span><span><span class="font-mono text-xs">${sumMachinery}</span> รายการ</span>
              </div>
            </div>
          </div>

          <!-- Problems & Materials on-site -->
          <div class="grid grid-cols-2 gap-2 border border-slate-900 p-1.5 mb-1.5 text-[10.5px] bg-white">
            <div class="border-r border-slate-300 pr-1.5 flex flex-col justify-between gap-1">
              <div>
                <span class="font-bold block mb-0.5">ปัญหาและอุปสรรค :</span>
                <textarea data-cfg="obstacles" rows="2" class="w-full border border-slate-400 bg-white p-1 text-[10.5px] leading-tight outline-none resize-none">${esc(cfg.obstacles)}</textarea>
              </div>
              <div>
                <span class="font-bold block mb-0.5">วิธีการแก้ไข :</span>
                <textarea data-cfg="solutions" rows="2" class="w-full border border-slate-400 bg-white p-1 text-[10.5px] leading-tight outline-none resize-none">${esc(cfg.solutions)}</textarea>
              </div>
            </div>
            <div class="pl-1">
              <span class="font-bold block mb-0.5">วัสดุ on-site :</span>
              ${cfg.materials.map((mat, idx) => `
                <div class="flex items-center justify-between py-0.5 border-b border-slate-200 text-[10px]">
                  <div class="flex items-center gap-0.5 flex-1 mr-1 min-w-0">
                    <span class="text-slate-500">${idx + 1}.</span>
                    <input type="text" data-mat="${idx}:label" value="${esc(mat.label)}" class="w-full bg-transparent outline-none truncate" />
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <input type="number" min="0" data-mat="${idx}:count" value="${mat.count}" class="w-10 text-right font-mono font-black bg-transparent outline-none" />
                    <input type="text" data-mat="${idx}:unit" value="${esc(mat.unit)}" class="w-8 text-center text-[9px] text-slate-500 bg-transparent outline-none" />
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Dual Signatures (Exact Sansiri Form + Image Upload) -->
          <div class="grid grid-cols-2 border border-slate-900 text-[10.5px] p-1.5 bg-white">
            <div class="border-r border-slate-900 pr-2 space-y-0.5">
              <div class="flex items-center gap-1">
                <span class="font-bold shrink-0">รายงานโดย :</span>
                <input type="text" data-cfg="authorCompany" value="${esc(cfg.authorCompany)}" class="bg-transparent outline-none w-56 text-[10.5px]" />
              </div>
              <div class="pt-0.5 flex items-center justify-between gap-1">
                <div class="flex items-center gap-2 flex-1">
                  <span class="font-bold shrink-0">ลายเซ็น :</span>
                  <div class="inline-flex items-center justify-center min-h-[32px] min-w-[115px] border-b border-slate-400">
                    ${cfg.authorSignatureImg ? `<img src="${cfg.authorSignatureImg}" alt="ลายเซ็น" class="max-h-8 max-w-[120px] object-contain" />` : `<span class="italic font-serif text-slate-700 text-xs px-2">${esc(cfg.author)}</span>`}
                  </div>
                </div>
                <div class="no-print flex items-center gap-1 shrink-0">
                  <label class="cursor-pointer text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                    📷 เพิ่มรูป<input type="file" accept="image/*" data-sig="author" class="hidden" />
                  </label>
                  ${cfg.authorSignatureImg ? `<button type="button" data-sig-clear="author" class="text-[10px] text-rose-600 px-1 cursor-pointer">✕</button>` : ''}
                </div>
              </div>
              <div class="flex items-center gap-1"><span class="font-bold shrink-0">ชื่อ :</span><input type="text" data-cfg="author" value="${esc(cfg.author)}" class="font-bold bg-transparent outline-none w-52" /></div>
              <div class="flex items-center gap-1"><span class="font-bold shrink-0">ตำแหน่ง :</span><input type="text" data-cfg="authorRole" value="${esc(cfg.authorRole)}" class="bg-transparent outline-none w-52" /></div>
              <div><span class="font-bold">วันที่ :</span> ${esc(thaiDateFull)}</div>
            </div>

            <div class="pl-2 space-y-0.5">
              <div class="flex items-center gap-1">
                <span class="font-bold shrink-0">ทบทวนโดย :</span>
                <input type="text" data-cfg="reviewerCompany" value="${esc(cfg.reviewerCompany)}" class="bg-transparent outline-none w-56 text-[10.5px]" />
              </div>
              <div class="pt-0.5 flex items-center justify-between gap-1">
                <div class="flex items-center gap-2 flex-1">
                  <span class="font-bold shrink-0">ลายเซ็น :</span>
                  <div class="inline-flex items-center justify-center min-h-[32px] min-w-[115px] border-b border-slate-400">
                    ${cfg.reviewerSignatureImg ? `<img src="${cfg.reviewerSignatureImg}" alt="ลายเซ็น" class="max-h-8 max-w-[120px] object-contain" />` : `<span class="italic font-serif text-blue-700 text-xs px-2">${esc(cfg.reviewer)}</span>`}
                  </div>
                </div>
                <div class="no-print flex items-center gap-1 shrink-0">
                  <label class="cursor-pointer text-[9.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">
                    📷 เพิ่มรูป<input type="file" accept="image/*" data-sig="reviewer" class="hidden" />
                  </label>
                  ${cfg.reviewerSignatureImg ? `<button type="button" data-sig-clear="reviewer" class="text-[10px] text-rose-600 px-1 cursor-pointer">✕</button>` : ''}
                </div>
              </div>
              <div class="flex items-center gap-1"><span class="font-bold shrink-0">ชื่อ :</span><input type="text" data-cfg="reviewer" value="${esc(cfg.reviewer)}" class="font-bold bg-transparent outline-none w-52" /></div>
              <div class="flex items-center gap-1"><span class="font-bold shrink-0">ตำแหน่ง :</span><input type="text" data-cfg="reviewerRole" value="${esc(cfg.reviewerRole)}" class="bg-transparent outline-none w-52" /></div>
              <div><span class="font-bold">วันที่ :</span> ${esc(thaiDateFull)}</div>
            </div>
          </div>
        </article>
      `;
    }

    // PAGE 2: SHEET PILE & EXCAVATION PROGRESS PLAN (4-View Plates + 3-Package & Gridline Tables)
    function renderPage2(s) {
      const mv = cachedMultiViews || {};
      const dateShort = formatThaiDateShort(cfg.date);
      const hasViews = ['top', 'iso', 'pit'].some((k) => mv[k]?.dataUrl);

      return `
        <article class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-slate-900 shadow-lg p-6 sm:p-7 space-y-3.5 text-[#1D2B45]">
          <div class="flex items-start justify-between gap-4 border-b-2 border-[#1D2B45] pb-2">
            <div class="min-w-0">
              <img src="Logo/png/Sansiri-logo-en-black.png" alt="Sansiri" style="height:18px;width:auto;display:block;margin-bottom:5px;" onerror="this.style.display='none'" />
              <h2 class="font-display text-base font-black text-[#1D2B45]">รายงานผังความก้าวหน้างานป้องกันดิน Sheet Pile &amp; งานขุดดิน</h2>
              <p class="text-[11px] text-[#3E4B69] font-semibold">โครงการ ${esc(cfg.projectName)} (สุขุมวิท 63 · เอกมัย 12) · อัปเดต ณ วันที่ ${esc(dateShort)}</p>
            </div>
            <div class="text-right shrink-0 whitespace-nowrap">
              <div class="text-xs font-mono font-black text-[#1D2B45]">ERSS PROGRESS PLAN · หน้า 2 / 4</div>
              <div class="text-[11px] font-mono text-[#3E4B69] mt-0.5">SP ${s.sp.done}/${s.sp.total} (${s.sp.pct}%) · EL.-${s.ex.depth.toFixed(2)} ม.</div>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-[#1D2B45] pb-1 mb-2">
              <h3 class="font-display text-xs font-black text-[#1D2B45] tracking-wide">ผังแปลนแสดงความก้าวหน้า</h3>
              <div class="flex items-center gap-3 text-[10px] font-bold text-[#1D2B45] whitespace-nowrap">
                <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#0066FF] border border-[#002B80]"></span>ทำวันนี้</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#10B981] border border-[#1D2B45]"></span>เสร็จสะสม</span>
                <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#F8FAFC] border border-[#334155]"></span>ยังไม่ทำ</span>
              </div>
            </div>

            ${hasViews ? `
              <div class="grid grid-cols-2 gap-2.5">
                ${['top', 'iso', 'pit'].map((key) => {
                  const v = mv[key];
                  if (!v) return '';
                  return `
                    <figure class="border border-[#1D2B45] bg-white m-0">
                      <div class="bg-[#FAF5EE] border-b border-[#1D2B45] px-2 py-1 text-[10px] font-mono font-bold text-[#1D2B45] truncate">${esc(v.label)}</div>
                      <img src="${v.dataUrl}" alt="${esc(v.label)}" class="w-full aspect-[16/10] object-contain bg-white block" />
                    </figure>
                  `;
                }).join('')}
                <figure class="border border-[#1D2B45] bg-white m-0">
                  <div class="bg-[#FAF5EE] border-b border-[#1D2B45] px-2 py-1 text-[10px] font-mono font-bold text-[#1D2B45] truncate">
                    4. รูปตัดระดับขุดดิน 2 ระดับ &amp; ชีตไพล์ (Case B -2.90 / Case A -3.80 ม.)
                  </div>
                  ${renderExcavationSectionSvg(s)}
                </figure>
              </div>
            ` : `<div class="border border-[#1D2B45] p-6 text-center text-xs text-[#64748B]">กำลังเตรียมผังความก้าวหน้า...</div>`}
          </div>

          <table class="w-full border-collapse border border-[#1D2B45] text-[10.5px]">
            <thead>
              <tr class="bg-[#1D2B45] text-white text-left">
                <th class="border border-[#1D2B45] px-2 py-1">หมวดงานหลัก (ERSS · รุ่นและขนาดตามแบบ Hirose)</th>
                <th class="border border-[#1D2B45] px-2 py-1 text-right">ผลงานสะสม</th>
                <th class="border border-[#1D2B45] px-2 py-1 text-right">เป้าหมายตามแบบ</th>
                <th class="border border-[#1D2B45] px-2 py-1 text-right">% ก้าวหน้า</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-[#1D2B45] px-2 py-1 font-bold">2.1 ชีตไพล์ JIS FSP-III (SP-3) · Case A ยาว 13.50 ม.</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-bold text-[#065F46]">${s.sp.caseA.done} แผ่น</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">${s.sp.caseA.total} แผ่น (88ตรง+2มุม · 72.9ตัน)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-black">${s.sp.caseA.pct}%</td>
              </tr>
              <tr class="bg-[#F0F9FF]/60">
                <td class="border border-[#1D2B45] px-2 py-1 font-bold">2.2 ชีตไพล์ JIS FSP-III (SP-3) · Case B ยาว 12.00 ม.</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-bold text-[#0369A1]">${s.sp.caseB.done} แผ่น</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">${s.sp.caseB.total} แผ่น (50ตรง+2มุม · 37.5ตัน)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-black">${s.sp.caseB.pct}%</td>
              </tr>
              <tr class="bg-[#FAF5EE]/60">
                <td class="border border-[#1D2B45] px-2 py-1 font-bold">2.3 ค้ำยัน Waler / Strut H-350 &amp; Packing Concrete (-1.00 ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">Waler ${s.bracing.walerDoneM}ม. · Strut ${s.bracing.strutDone}/6 · PC ${s.bracing.pcDoneM}ม.</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">54.48ม. · 6 ต้น · ${s.bracing.pcTotalVol} ม³</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-black">${s.bracing.pct}%</td>
              </tr>
              <tr>
                <td class="border border-[#1D2B45] px-2 py-1 font-bold">2.4 งานขุดดิน 2 ระดับ (F18: -2.90 ม. / F20: -3.80 ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-bold text-[#0284C7]">EL.-${s.ex.depth.toFixed(2)} ม. (${s.ex.dugVol} ลบ.ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">-2.90/-3.80 ม. (${s.ex.totalVol} ลบ.ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono font-black">${s.ex.pct}%</td>
              </tr>
            </tbody>
          </table>

          <!-- Gridline Table (with Model & Length) + 2-Level Excavation Side-by-Side -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-7">
              <h3 class="font-display text-[10.5px] font-black text-[#1D2B45] border-b border-[#1D2B45] pb-0.5 mb-1">
                งานกดชีตไพล์ JIS FSP-III (400×125×13 มม.) แยกตามแนว &amp; ความยาว
              </h3>
              <table class="w-full border-collapse border border-[#1D2B45] text-[9.5px]">
                <thead>
                  <tr class="bg-[#FAF5EE] text-left">
                    <th class="border border-[#1D2B45] px-1.5 py-0.5">แนว Gridline</th>
                    <th class="border border-[#1D2B45] px-1.5 py-0.5">รุ่น / ความยาว</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">แบบ</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">แล้ว</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">เหลือ</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.values(s.sp.sides).map((side) => {
                    const pct = side.total ? Math.round((side.done / side.total) * 100) : 0;
                    return `<tr>
                      <td class="border border-[#1D2B45] px-1.5 py-0.5 font-bold whitespace-nowrap">${esc(side.label)}</td>
                      <td class="border border-[#1D2B45] px-1.5 py-0.5 font-mono text-[9px] text-[#334155] whitespace-nowrap">${esc(side.spec)}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${side.total}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono font-bold text-[#065F46]">${side.done}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono text-[#E64C3C]">${side.total - side.done}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono font-bold">${pct}%</td>
                    </tr>`;
                  }).join('')}
                  <tr class="bg-slate-100 font-extrabold">
                    <td class="border border-[#1D2B45] px-1.5 py-0.5">รวมทั้งหมด (SY295)</td>
                    <td class="border border-[#1D2B45] px-1.5 py-0.5 font-mono text-[9px]">13.5ม.(90) · 12ม.(52)</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${s.sp.total}</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono text-[#065F46]">${s.sp.done}</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono text-[#E64C3C]">${s.sp.total - s.sp.done}</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${s.sp.pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="sm:col-span-5">
              <h3 class="font-display text-[10.5px] font-black text-[#1D2B45] border-b border-[#1D2B45] pb-0.5 mb-1">
                งานขุดดิน 2 ระดับ (รวม ${s.ex.totalVol} ลบ.ม.)
              </h3>
              <table class="w-full border-collapse border border-[#1D2B45] text-[9.5px]">
                <thead>
                  <tr class="bg-[#FAF5EE] text-left">
                    <th class="border border-[#1D2B45] px-1.5 py-0.5">ลำดับชั้นขุดดิน</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">แบบ (ม³)</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">ขุดแล้ว</th>
                    <th class="border border-[#1D2B45] px-1 py-0.5 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.ex.stages.map((st) => `
                    <tr>
                      <td class="border border-[#1D2B45] px-1.5 py-0.5 font-semibold">${esc(st.name)}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${st.vol.toFixed(1)}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono font-bold text-[#0284C7]">${st.dugVol.toFixed(1)}</td>
                      <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono font-bold">${st.pct}%</td>
                    </tr>
                  `).join('')}
                  <tr class="bg-slate-100 font-extrabold">
                    <td class="border border-[#1D2B45] px-1.5 py-0.5">รวมปริมาตรขุดดิน</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${s.ex.totalVol.toFixed(1)}</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono text-[#0284C7]">${s.ex.dugVol.toFixed(1)}</td>
                    <td class="border border-[#1D2B45] px-1 py-0.5 text-right font-mono">${s.ex.pct}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      `;
    }

    // PAGE 3: SITE PHOTO SHEET (6 Photos + 1-Click 3D Capture)
    function renderPage3() {
      const dateFull = formatThaiDateFull(cfg.date);
      return `
        <article class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-slate-900 shadow-lg p-6 sm:p-7 text-[#0F172A]">
          <div class="flex items-start justify-between border-b-2 border-slate-900 pb-2">
            <div>
              <img src="Logo/png/Sansiri-logo-en-black.png" alt="SANSIRI" style="height:18px;width:auto;display:block;margin-bottom:4px;" onerror="this.style.display='none'" />
              <h2 class="font-display text-sm font-black">SITE PHOTO SHEET · แผ่นภาพถ่ายหน้างาน Sheet Pile &amp; งานขุดดิน (6 ภาพ)</h2>
              <p class="text-xs text-slate-600">โครงการ ${esc(cfg.projectName)} · วันที่ ${esc(dateFull)}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-[10px] text-slate-500 font-mono">หน้า 3 / 4</span>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-2 gap-3.5">
            ${photos.map((slot) => `
              <div class="border border-slate-900 p-2 bg-white">
                <div class="relative h-44 bg-[#FAF5EE] flex items-center justify-center overflow-hidden">
                  ${slot.dataUrl ? `
                    <img src="${slot.dataUrl}" alt="${esc(slot.caption)}" class="w-full h-full object-cover" />
                    <button id="sp-photo-del-${slot.id}" type="button" class="no-print absolute top-1.5 right-1.5 bg-white border border-slate-900 rounded px-1.5 py-0.5 text-[10px] font-bold text-rose-600 cursor-pointer">ลบ</button>
                  ` : `
                    <label class="no-print cursor-pointer flex flex-col items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#F26B2A]">
                      <span>📷 คลิกอัปโหลดภาพที่ ${slot.id}</span>
                      <input id="sp-photo-file-${slot.id}" type="file" accept="image/*" multiple class="hidden" />
                    </label>
                  `}
                </div>
                <input id="sp-photo-cap-${slot.id}" type="text" value="${esc(slot.caption)}" class="mt-1.5 w-full border-b border-slate-300 text-center text-[11px] font-semibold text-slate-900 bg-transparent focus:outline-none" />
              </div>
            `).join('')}
          </div>
        </article>
      `;
    }

    // PAGE 4: CONSULT DOCUMENT SHEET (Exact Sansiri Page 4 Conzol Table + Image Mode, Synced with Piling)
    function renderConzolTableHtml() {
      const tbl = cfg.conzolTable && Array.isArray(cfg.conzolTable.columns)
        ? cfg.conzolTable
        : { columns: ['ลำดับ', 'ID', 'รายการ', 'STATUS', 'หมายเหตุ'], rows: [] };
      const cols = tbl.columns;
      const rows = Array.isArray(tbl.rows) ? tbl.rows : [];
      const colCount = cols.length;
      const dataItemCount = rows.filter((r) => r && !r.isGroup).length;

      const thCells = cols.map((colName, cIdx) => {
        const nameStr = String(colName || '');
        const widthStyle = cIdx === 0 ? 'width:52px;' : (/status|สถานะ/i.test(nameStr) ? 'width:68px;' : '');
        return `<th class="border border-slate-500 bg-[#1f4e78] text-white font-bold text-[11px] px-1.5 py-1.5 text-center align-middle" style="${widthStyle}">${esc(nameStr)}</th>`;
      }).join('');

      const bodyRowsHtml = rows.map((row, rIdx) => {
        if (row && row.isGroup) {
          return `
            <tr class="bg-[#d9d9d9]">
              <td colspan="${colCount}" class="border border-slate-400 px-2 py-1 text-left font-bold text-[11px] text-slate-900">
                <div class="flex items-center justify-between gap-2">
                  <input type="text" data-cz-group="${rIdx}" value="${esc(row.label || '')}" class="flex-1 bg-transparent font-bold text-[11px] text-slate-900 outline-none" />
                  <button type="button" data-cz-del="${rIdx}" class="no-print text-rose-600 hover:text-rose-800 font-black text-xs px-1 cursor-pointer" title="ลบหมวดนี้">×</button>
                </div>
              </td>
              <td class="no-print border border-slate-300 bg-[#d9d9d9]"></td>
            </tr>
          `;
        }
        const cells = Array.isArray(row?.cells) ? row.cells : [];
        const tds = cols.map((colName, cIdx) => {
          const val = cells[cIdx] !== undefined ? String(cells[cIdx]) : '';
          const isStatusCol = /status|สถานะ/i.test(String(colName || ''));
          const isCenterCol = cIdx === 0 || isStatusCol;
          const up = val.trim().toUpperCase();
          let cellBg = 'bg-white', textStyle = 'text-slate-800';
          if (isStatusCol) {
            if (up === 'R' || up === 'REJECT' || up.includes('แก้')) {
              cellBg = 'bg-rose-50'; textStyle = 'text-rose-700 font-bold';
            } else {
              cellBg = 'bg-[#e2efda]'; textStyle = 'text-[#375623] font-bold';
            }
          }
          return `
            <td class="border border-slate-300 ${cellBg} ${textStyle} px-1.5 py-1 text-[10.5px] align-middle ${isCenterCol ? 'text-center' : 'text-left'}">
              <textarea rows="1" data-cz-cell="${rIdx}:${cIdx}" class="w-full bg-transparent ${textStyle} ${isCenterCol ? 'text-center' : 'text-left'} text-[10.5px] leading-snug outline-none resize-none overflow-hidden py-0">${esc(val)}</textarea>
            </td>
          `;
        }).join('');

        return `
          <tr class="hover:bg-slate-50/70">
            ${tds}
            <td class="no-print border border-slate-200 bg-slate-50 px-1 text-center align-middle" style="width:24px;">
              <button type="button" data-cz-del="${rIdx}" class="text-rose-500 hover:text-rose-700 font-black text-xs cursor-pointer" title="ลบแถวนี้">×</button>
            </td>
          </tr>
        `;
      }).join('');

      const leftSpan = Math.max(1, colCount - 2);
      return `
        <div class="w-full overflow-auto bg-white">
          <table class="w-full border-collapse table-auto">
            <thead>
              <tr>
                ${thCells}
                <th class="no-print border border-slate-400 bg-slate-700 text-white text-[10px] px-1 py-1 text-center" style="width:24px;">ลบ</th>
              </tr>
            </thead>
            <tbody>
              ${bodyRowsHtml}
              <tr class="bg-slate-50 border-t-2 border-slate-700 font-bold text-[11px] text-slate-900">
                <td colspan="${leftSpan}" class="border border-slate-300 px-3 py-1.5 text-right">รวมรายการทั้งหมด</td>
                <td class="border border-slate-300 px-2 py-1.5 text-center font-mono">${dataItemCount}</td>
                <td class="border border-slate-300 px-2 py-1.5 text-left">รายการ</td>
                <td class="no-print border border-slate-200 bg-slate-50"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    function renderPage4() {
      const dateFull = formatThaiDateFull(cfg.date);
      const mode = cfg.conzolMode === 'image' ? 'image' : 'table';
      const imgUrl = cfg.conzolImageUrl || '';
      const rot = !!cfg.conzolRotate90;

      const bodyHtml = mode === 'table'
        ? renderConzolTableHtml()
        : (imgUrl ? `
            <div class="w-full h-full min-h-[205mm] flex items-center justify-center overflow-hidden p-2 relative bg-white">
              <img src="${imgUrl}" alt="เอกสาร Consult" style="${rot ? 'max-width:210mm;max-height:170mm;transform:rotate(90deg);' : 'max-width:100%;max-height:205mm;'}object-fit:contain;" />
              <div class="no-print absolute top-2 right-2 flex items-center gap-1.5">
                <button id="sp-conzol-rotate" type="button" class="px-2 py-1 rounded bg-white border border-slate-900 text-[10.5px] font-bold cursor-pointer hover:bg-slate-100">🔄 หมุน 90°</button>
                <button id="sp-conzol-clear" type="button" class="px-2 py-1 rounded bg-white border border-rose-600 text-rose-600 text-[10.5px] font-bold cursor-pointer hover:bg-rose-50">ลบภาพ</button>
              </div>
            </div>
          ` : `
            <label class="no-print w-full h-full min-h-[200mm] border-2 border-dashed border-slate-300 rounded flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-blue-500 cursor-pointer p-6 text-center">
              <span class="text-2xl mb-2">📄</span>
              <div class="text-sm font-black text-slate-800">+ คลิกเพื่อเพิ่มภาพเอกสาร Consult / เอกสารอนุมัติ Conzol ประจำวัน</div>
              <div class="text-xs text-slate-500 mt-1">แสดงผลเต็มหน้า A4 (รองรับการหมุนภาพ 90° แนวตั้ง/แนวนอน)</div>
              <input id="sp-conzol-file" type="file" accept="image/*" class="hidden" />
            </label>
          `);

      return `
        <article class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-slate-900 shadow-lg p-5 sm:p-6 text-[#0F172A]">
          <div class="border border-slate-800 p-4 flex flex-col justify-between" style="min-height:262mm;box-sizing:border-box;">
            <div class="flex flex-col items-center justify-center mb-2 shrink-0">
              <img src="Logo/png/Sansiri-logo-en-black.png" alt="SANSIRI" style="height:20px;width:auto;display:block;margin-bottom:4px;" onerror="this.style.display='none'" />
              <div class="text-xs font-bold text-slate-900">โครงการ ${esc(cfg.projectName)}</div>
              <div class="text-[11px] text-slate-700">ประจำวันที่ ${esc(dateFull)}</div>
              <input type="text" data-cfg="conzolTitle" value="${esc(cfg.conzolTitle)}" class="mt-1 w-full max-w-[520px] text-center text-[13px] font-black text-slate-900 border-b border-dashed border-slate-300 focus:border-slate-900 outline-none py-0.5 bg-transparent" />
            </div>

            <div class="flex-1 min-h-0 w-full ${mode === 'table' ? '' : 'border border-slate-300'} bg-white flex flex-col overflow-hidden">
              ${bodyHtml}
            </div>

            <div class="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono shrink-0">
              <span>${esc(cfg.conzolTitle)}</span>
              <span>หน้า 4 / 4 (เอกสารอนุมัติ Conzol)</span>
            </div>
          </div>
        </article>
      `;
    }

    function draw() {
      const prevScrollTop = root.querySelector('.sp-print-scroll')?.scrollTop || 0;
      const s = computeDetailedStats();

      // ================================================================
      // MODE A: DEDICATED SUMMARY CAPTURE & FORMAL LINE MESSAGE STUDIO
      // ================================================================
      if (studioMode === 'summary') {
        const lineText = buildLineSummary();
        const dateFull = formatThaiDateFull(s.reportDate || cfg.date);
        root.innerHTML = `
          <!-- Top Capture & LINE Summary Toolbar -->
          <div class="no-print shrink-0 bg-white border-b-2 border-[#1D2B45] px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#ECFDF5] border-2 border-[#1D2B45] flex items-center justify-center text-sm">📊</div>
              <div>
                <div class="font-display text-xs sm:text-sm font-black text-[#1D2B45] leading-tight">
                  รายงานสรุปความก้าวหน้า Sheet Pile &amp; งานขุดดิน (สำหรับแคปภาพ &amp; ส่ง LINE)
                </div>
                <div class="text-[11px] text-[#3E4B69] font-semibold">
                  โครงการ ${esc(cfg.projectName)} · ประจำวันที่ ${esc(dateFull)}
                </div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5">
              <div class="inline-flex rounded-full border-2 border-[#1D2B45] overflow-hidden bg-[#FAF5EE] text-[11px] font-bold">
                <button id="sp-rep-mode-status" type="button" class="px-2.5 py-1 cursor-pointer ${reportViewMode === 'status' ? 'bg-[#1D2B45] text-white' : 'text-[#1D2B45] hover:bg-white'}">สีสถานะ</button>
                <button id="sp-rep-mode-sketchup" type="button" class="px-2.5 py-1 cursor-pointer border-l border-[#1D2B45] ${reportViewMode === 'sketchup' ? 'bg-[#1D2B45] text-white' : 'text-[#1D2B45] hover:bg-white'}">สี SketchUp</button>
              </div>
              <button id="sp-rep-recapture-views" type="button" class="px-2.5 py-1 rounded-full text-[11px] font-bold border-2 border-[#1D2B45] bg-white hover:bg-[#FEF3C7] cursor-pointer">🔄 อัปเดตภาพ</button>
              <div class="relative inline-block" id="sp-sum-capture-wrap">
                <button id="sp-sum-capture-menu-btn" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] bg-[#F26B2A] text-white hover:bg-[#E05615] shadow-[2px_2px_0px_#1D2B45] font-display cursor-pointer inline-flex items-center gap-1">
                  <span>📸 แคปภาพ</span><span class="text-[10px]">▾</span>
                </button>
                <div id="sp-sum-capture-menu" class="hidden absolute right-0 mt-1.5 w-64 bg-white border-2 border-[#1D2B45] rounded-xl shadow-[4px_4px_0px_#1D2B45] p-1.5 z-50 text-left">
                  <button id="sp-sum-capture-line" type="button" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#ECFDF5] transition-colors cursor-pointer flex items-start gap-2">
                    <span class="text-sm leading-none mt-0.5">💬</span>
                    <span class="min-w-0">
                      <span class="block text-[11.5px] font-black text-[#065F46]">ส่ง LINE ไม่โดนบีบ (คมชัดพอดี)</span>
                      <span class="block text-[10px] text-[#475569] leading-snug">ปรับขนาด ≤1440px · ไฟล์เบา ชัดไม่เบลอใน LINE</span>
                    </span>
                  </button>
                  <div class="my-1 border-t border-slate-200"></div>
                  <button id="sp-sum-capture-hd" type="button" class="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#FFF7ED] transition-colors cursor-pointer flex items-start gap-2">
                    <span class="text-sm leading-none mt-0.5">🖼️</span>
                    <span class="min-w-0">
                      <span class="block text-[11.5px] font-black text-[#1D2B45]">ความคมชัดสูงปกติ (HD PNG)</span>
                      <span class="block text-[10px] text-[#475569] leading-snug">ความละเอียดสูงเต็มพิกัด (2.5×) เก็บไฟล์/พิมพ์</span>
                    </span>
                  </button>
                </div>
              </div>
              <button id="sp-sum-download-pdf" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] bg-[#10B981] text-white hover:bg-[#059669] shadow-[2px_2px_0px_#1D2B45] font-display cursor-pointer">
                ⬇️ โหลด PDF
              </button>
              <button id="sp-sum-toggle-line" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] ${showLinePanel ? 'bg-[#0F766E] text-white' : 'bg-[#ECFDF5] text-[#065F46] hover:bg-[#D1FAE5]'} font-display cursor-pointer">
                💬 ข้อความ LINE
              </button>
              <button id="sp-switch-to-daily" type="button" class="px-2.5 py-1 rounded-full text-[11px] font-bold border-2 border-[#1D2B45] bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] cursor-pointer">
                📄 เปิด Daily Report (4 หน้า)
              </button>
              <button id="sp-rep-close" type="button" class="w-8 h-8 rounded-full border-2 border-[#1D2B45] bg-white hover:bg-rose-50 text-[#1D2B45] font-black text-sm cursor-pointer" title="ปิด">✕</button>
            </div>
          </div>

          <!-- Body: Capture Card (Left) + Formal LINE Message Box (Right) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#EFECE6]">
            <div class="max-w-[1440px] mx-auto grid grid-cols-1 ${showLinePanel ? 'xl:grid-cols-12' : ''} gap-5 items-start">
              <!-- Capture-Ready Progress Plan Card -->
              <div class="${showLinePanel ? 'xl:col-span-8' : ''}">
                <div id="sp-summary-capture-card" class="bg-white border-2 border-[#1D2B45] shadow-lg">
                  ${renderPage2(s)
                    .replace('ERSS PROGRESS PLAN · หน้า 2 / 4', `วันนี้ +${s.sp.today} แผ่น · สะสม ${s.sp.done}/${s.sp.total}`)
                    .replace('<article class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-slate-900 shadow-lg p-6 sm:p-7 space-y-3.5 text-[#1D2B45]">', '<div class="p-5 sm:p-6 space-y-3.5 text-[#1D2B45]">')
                    .replace(/<\/article>\s*$/, '</div>')}
                </div>
              </div>

              ${showLinePanel ? `
                <!-- Formal Official LINE Message Generator -->
                <aside class="no-print xl:col-span-4 bg-white border-2 border-[#1D2B45] rounded-2xl shadow-[4px_4px_0px_#1D2B45] p-4 space-y-3 sticky top-2">
                  <div class="flex items-center justify-between border-b-2 border-[#1D2B45] pb-2">
                    <div>
                      <div class="font-display text-sm font-black text-[#1D2B45]">💬 ข้อความรายงานส่ง LINE (ทางการ)</div>
                      <div class="text-[11px] text-[#3E4B69]">รวมวันที่ · ผลงานวันนี้ · ผลงานสะสมรวม</div>
                    </div>
                    <button id="sp-sum-copy-line-btn" type="button" class="px-3 py-1.5 rounded-full border-2 border-[#1D2B45] bg-[#10B981] hover:bg-[#059669] text-white text-xs font-extrabold shadow-[2px_2px_0px_#1D2B45] cursor-pointer">
                      📋 คัดลอกข้อความ
                    </button>
                  </div>
                  <textarea id="sp-sum-line-textarea" rows="22" class="w-full border-1.5 border-[#1D2B45] rounded-xl p-3 font-sans text-xs leading-relaxed text-[#1D2B45] bg-[#FAF5EE]/60 outline-none focus:bg-white">${esc(lineText)}</textarea>
                  <div class="flex items-center justify-between gap-2 text-[11px] text-[#475569]">
                    <span>แก้ไขข้อความเพิ่มเติมก่อนกดคัดลอกได้ทันที</span>
                    <button id="sp-sum-reset-line" type="button" class="underline font-bold text-[#1D2B45] cursor-pointer">รีเซ็ตข้อความอัตโนมัติ</button>
                  </div>
                </aside>
              ` : ''}
            </div>
          </div>
        `;

        root.querySelector('#sp-rep-close').onclick = () => root.classList.add('hidden');
        root.querySelector('#sp-switch-to-daily').onclick = () => { studioMode = 'daily'; activeView = 'all'; draw(); };
        root.querySelector('#sp-sum-toggle-line').onclick = () => { showLinePanel = !showLinePanel; draw(); };
        root.querySelector('#sp-rep-mode-status').onclick = () => { refreshMultiViews('status'); draw(); };
        root.querySelector('#sp-rep-mode-sketchup').onclick = () => { refreshMultiViews('sketchup'); draw(); };
        root.querySelector('#sp-rep-recapture-views').onclick = () => { refreshMultiViews(reportViewMode); draw(); getBridge()?.showToast?.('อัปเดตภาพล่าสุดแล้ว'); };

        const copyLineBtn = root.querySelector('#sp-sum-copy-line-btn');
        if (copyLineBtn) {
          copyLineBtn.onclick = async () => {
            const txt = root.querySelector('#sp-sum-line-textarea')?.value || buildLineSummary();
            try {
              await navigator.clipboard.writeText(txt);
              getBridge()?.showToast?.('คัดลอกข้อความรายงานทางการส่ง LINE แล้ว');
            } catch {
              getBridge()?.showToast?.('ไม่สามารถคัดลอกข้อความได้');
            }
          };
        }
        const resetLineBtn = root.querySelector('#sp-sum-reset-line');
        if (resetLineBtn) {
          resetLineBtn.onclick = () => {
            const ta = root.querySelector('#sp-sum-line-textarea');
            if (ta) ta.value = buildLineSummary();
          };
        }

        const capMenuBtn = root.querySelector('#sp-sum-capture-menu-btn');
        const capMenu = root.querySelector('#sp-sum-capture-menu');
        const capLineBtn = root.querySelector('#sp-sum-capture-line');
        const capHdBtn = root.querySelector('#sp-sum-capture-hd');

        const runSummaryCapture = async (qualityMode) => {
          const target = root.querySelector('#sp-summary-capture-card');
          if (!target) return;
          if (capMenu) capMenu.classList.add('hidden');
          const isLineMode = qualityMode === 'line';
          if (capMenuBtn) {
            capMenuBtn.disabled = true;
            capMenuBtn.innerHTML = isLineMode ? '<span>⏳ กำลังแคป (LINE)...</span>' : '<span>⏳ กำลังแคป (HD)...</span>';
          }
          try {
            if (document.fonts && document.fonts.ready) await document.fonts.ready;
            await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

            const w = Math.round(target.offsetWidth || 860);
            const h = Math.round(target.scrollHeight || target.offsetHeight || 1100);
            const TRANSPARENT_PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            const filterFn = (node) => {
              if (!node) return true;
              if (node.classList && node.classList.contains('no-print')) return false;
              if (node.tagName === 'IMG') {
                if (node.style && node.style.display === 'none') return false;
                if (!node.complete || node.naturalWidth === 0) return false;
              }
              return true;
            };

            const renderRatio = isLineMode ? 2 : 2.5;
            let rawCanvas = null;
            if (window.htmlToImage && typeof window.htmlToImage.toCanvas === 'function') {
              try {
                rawCanvas = await window.htmlToImage.toCanvas(target, {
                  pixelRatio: renderRatio,
                  backgroundColor: '#FFFFFF',
                  width: w,
                  height: h,
                  cacheBust: false,
                  imagePlaceholder: TRANSPARENT_PX,
                  filter: filterFn,
                });
              } catch (fontErr) {
                console.warn('Summary PNG htmlToImage retrying with skipFonts:', fontErr);
                rawCanvas = await window.htmlToImage.toCanvas(target, {
                  pixelRatio: renderRatio,
                  backgroundColor: '#FFFFFF',
                  width: w,
                  height: h,
                  skipFonts: true,
                  cacheBust: false,
                  imagePlaceholder: TRANSPARENT_PX,
                  filter: filterFn,
                });
              }
            } else if (typeof window.html2canvas === 'function') {
              rawCanvas = await window.html2canvas(target, { scale: renderRatio, backgroundColor: '#FFFFFF', useCORS: true });
            }

            if (!rawCanvas) throw new Error('Renderer not ready');

            // For LINE mode: smoothly scale longest side to <= 1440px (sweet spot so LINE won't crush/blur text!)
            let outCanvas = rawCanvas;
            if (isLineMode) {
              const MAX_LINE_SIDE = 1440;
              const maxCur = Math.max(rawCanvas.width, rawCanvas.height);
              if (maxCur > MAX_LINE_SIDE) {
                const sc = MAX_LINE_SIDE / maxCur;
                const c = document.createElement('canvas');
                c.width = Math.round(rawCanvas.width * sc);
                c.height = Math.round(rawCanvas.height * sc);
                const ctx2d = c.getContext('2d');
                ctx2d.fillStyle = '#FFFFFF';
                ctx2d.fillRect(0, 0, c.width, c.height);
                ctx2d.imageSmoothingEnabled = true;
                ctx2d.imageSmoothingQuality = 'high';
                ctx2d.drawImage(rawCanvas, 0, 0, c.width, c.height);
                outCanvas = c;
              }
            }

            const dateTag = s.reportDate || cfg.date;
            const mime = isLineMode ? 'image/jpeg' : 'image/png';
            const quality = isLineMode ? 0.92 : 1.0;
            const fname = isLineMode
              ? `PYNN_EKKAMAI12_SheetPile_LINE_${dateTag}.jpg`
              : `PYNN_EKKAMAI12_SheetPile_HD_${dateTag}.png`;

            const dlBlob = await new Promise((resolve) => outCanvas.toBlob(resolve, mime, quality));
            const sizeKb = dlBlob ? Math.round(dlBlob.size / 1024) : 0;

            if (dlBlob) {
              const objUrl = URL.createObjectURL(dlBlob);
              const link = document.createElement('a');
              link.download = fname;
              link.href = objUrl;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                link.remove();
                URL.revokeObjectURL(objUrl);
              }, 400);

              // Also copy crisp PNG to clipboard (ClipboardItem requires image/png) for instant Ctrl+V into LINE Desktop
              let copiedClip = false;
              try {
                if (navigator.clipboard && window.ClipboardItem) {
                  const clipBlob = isLineMode
                    ? await new Promise((resolve) => outCanvas.toBlob(resolve, 'image/png', 1.0))
                    : dlBlob;
                  if (clipBlob) {
                    await navigator.clipboard.write([new ClipboardItem({ 'image/png': clipBlob })]);
                    copiedClip = true;
                  }
                }
              } catch {}

              const dimStr = `${outCanvas.width}×${outCanvas.height}px · ${sizeKb} KB`;
              getBridge()?.showToast?.(
                isLineMode
                  ? `✅ แคปภาพสำหรับส่ง LINE แล้ว (${dimStr}${copiedClip ? ' · กด Ctrl+V วางใน LINE ได้เลย' : ''})`
                  : `✅ แคปภาพความคมชัดสูง HD PNG แล้ว (${dimStr}${copiedClip ? ' · คัดลอกลงคลิปบอร์ดแล้ว' : ''})`
              );
            } else {
              const dataUrl = outCanvas.toDataURL(mime, quality);
              const link = document.createElement('a');
              link.download = fname;
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              setTimeout(() => link.remove(), 300);
              getBridge()?.showToast?.('✅ ดาวน์โหลดภาพเรียบร้อยแล้ว!');
            }
          } catch (err) {
            console.error('Capture failed:', err);
            getBridge()?.showToast?.('⚠️ แคปภาพไม่สำเร็จ (' + (err?.message || 'Error') + ') — ลองกด โหลด PDF แทนได้');
          } finally {
            if (capMenuBtn) {
              capMenuBtn.disabled = false;
              capMenuBtn.innerHTML = '<span>📸 แคปภาพ</span><span class="text-[10px]">▾</span>';
            }
          }
        };

        if (capMenuBtn && capMenu) {
          capMenuBtn.onclick = (e) => {
            e.stopPropagation();
            capMenu.classList.toggle('hidden');
          };
          root.addEventListener('click', (e) => {
            if (!e.target.closest('#sp-sum-capture-wrap')) capMenu.classList.add('hidden');
          });
        }
        if (capLineBtn) capLineBtn.onclick = () => runSummaryCapture('line');
        if (capHdBtn) capHdBtn.onclick = () => runSummaryCapture('hd');
        const sumPdfBtn = root.querySelector('#sp-sum-download-pdf');
        if (sumPdfBtn) {
          sumPdfBtn.onclick = () => exportExactPDF('summary');
        }
        return;
      }

      // ================================================================
      // MODE B: OFFICIAL SANSIRI 4-PAGE DAILY REPORT PDF STUDIO
      // ================================================================
      const tabBtn = (id, label) => `
        <button data-sp-view="${id}" type="button" class="px-2.5 py-1 rounded text-[11px] font-extrabold border border-slate-900 cursor-pointer transition-colors ${
          activeView === id ? 'bg-[#0F172A] text-white' : 'bg-white text-slate-900 hover:bg-slate-100'
        }">${label}</button>
      `;

      const pagesHtml =
        activeView === 'p1' ? renderPage1(s)
        : activeView === 'p2' ? renderPage2(s)
        : activeView === 'p3' ? renderPage3()
        : activeView === 'p4' ? renderPage4()
        : `${renderPage1(s)}<div class="h-5 no-print"></div>${renderPage2(s)}<div class="h-5 no-print"></div>${renderPage3()}<div class="h-5 no-print"></div>${renderPage4()}`;

      root.innerHTML = `
        <!-- Top Official Sansiri Studio Toolbar (Hidden on Print, Scrollable on Mobile/Foldable) -->
        <div class="no-print shrink-0 bg-white border-b-2 border-slate-900 px-2.5 sm:px-4 py-1.5 sm:py-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1.5">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div class="w-7 h-7 sm:w-8 sm:h-8 rounded bg-amber-100 border border-slate-900 flex items-center justify-center text-sm shrink-0">📄</div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <span class="px-1.5 py-0.5 bg-slate-900 text-white text-[9px] font-mono font-bold rounded shrink-0">SANSIRI</span>
                  <span class="text-[10.5px] font-bold text-slate-600 truncate">${esc(cfg.projectName)}</span>
                </div>
                <div class="font-display text-xs sm:text-sm font-black text-slate-900 leading-tight truncate">
                  Daily Report &amp; รายงาน Sheet Pile (PDF 4 หน้า)
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 lg:hidden">
              <button id="sp-rep-download-pdf-mobile" type="button" class="px-2.5 h-8 rounded border border-slate-900 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold text-[11px] cursor-pointer whitespace-nowrap shadow-[1.5px_1.5px_0px_#0f172a]">⬇️ โหลด PDF</button>
              <button id="sp-rep-close-mobile" type="button" class="w-8 h-8 rounded border border-slate-900 bg-white hover:bg-rose-50 text-slate-900 font-black text-sm cursor-pointer shrink-0" title="ปิดหน้ารายงาน">✕</button>
            </div>
          </div>

          <div class="sp-toolbar-scroll flex items-center gap-1.5 overflow-x-auto flex-nowrap pb-0.5 lg:pb-0">
            <div class="inline-flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-300 shrink-0">
              ${tabBtn('all', 'ดูทั้งหมด (4 หน้า)')}
              ${tabBtn('p1', '1. ประจำวัน')}
              ${tabBtn('p2', '2. สรุปชีตไพล์')}
              ${tabBtn('p3', '3. ภาพถ่าย')}
              ${tabBtn('p4', '4. Consult')}
            </div>

            <div class="inline-flex rounded border border-slate-900 overflow-hidden bg-slate-50 text-[11px] font-bold shrink-0">
              <button id="sp-rep-mode-status" type="button" class="px-2 py-1 cursor-pointer whitespace-nowrap ${reportViewMode === 'status' ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-white'}">สีสถานะ</button>
              <button id="sp-rep-mode-sketchup" type="button" class="px-2 py-1 cursor-pointer border-l border-slate-900 whitespace-nowrap ${reportViewMode === 'sketchup' ? 'bg-slate-900 text-white' : 'text-slate-900 hover:bg-white'}">สี SketchUp</button>
            </div>

            <button id="sp-rep-recapture-views" type="button" class="px-2 py-1 rounded text-[11px] font-bold border border-slate-900 bg-white hover:bg-amber-50 cursor-pointer shrink-0 whitespace-nowrap" title="อัปเดตภาพ 3D ล่าสุด">🔄 อัปเดต</button>
            <button id="sp-rep-copy-line" type="button" class="px-2.5 py-1 rounded text-[11px] font-bold border border-slate-900 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer shrink-0 whitespace-nowrap">📋 LINE</button>
            <button id="sp-rep-download-pdf" type="button" class="px-3 py-1 rounded text-[11px] font-extrabold border border-slate-900 bg-[#10B981] text-white hover:bg-[#059669] shadow-[1.5px_1.5px_0px_#0f172a] cursor-pointer shrink-0 whitespace-nowrap" title="ดาวน์โหลดไฟล์ PDF 4 หน้าตรงตามตัวอย่างเป๊ะ">⬇️ ดาวน์โหลด PDF</button>
            <button id="sp-rep-print-pdf" type="button" class="px-2.5 py-1 rounded text-[11px] font-extrabold border border-slate-900 bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A] cursor-pointer shrink-0 whitespace-nowrap" title="สั่งพิมพ์หรือบันทึก PDF ผ่านเบราว์เซอร์">🖨️ พิมพ์</button>
            <button id="sp-rep-close" type="button" class="hidden lg:inline-flex items-center justify-center w-8 h-8 rounded border border-slate-900 bg-white hover:bg-rose-50 text-slate-900 font-black text-sm cursor-pointer shrink-0" title="ปิดหน้ารายงาน">✕</button>
          </div>
        </div>

        <!-- Secondary Tool Strip (Outside A4 Paper — Horizontally Scrollable on Mobile/Foldable) -->
        <div class="no-print sp-toolbar-scroll shrink-0 bg-slate-50 border-b border-slate-300 px-2.5 sm:px-4 py-1.5 flex items-center gap-2 text-[11px] overflow-x-auto flex-nowrap">
          <div class="flex items-center gap-1.5 pr-2 border-r border-slate-300 flex-wrap">
            <span class="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9.5px] font-bold">หน้า 3</span>
            <label class="px-2.5 py-0.5 rounded bg-blue-50 border border-blue-700 text-blue-900 font-bold cursor-pointer hover:bg-blue-100 inline-flex items-center gap-1">
              <span>📷 เพิ่มรูปถ่ายหน้างาน (หลายรูป)</span>
              <input id="sp-photo-bulk-file" type="file" accept="image/*" multiple class="hidden" />
            </label>
            <button id="sp-cap-3d-photo1" type="button" class="px-2 py-0.5 rounded bg-[#E0F2FE] border border-slate-900 text-[#0369A1] font-bold cursor-pointer hover:bg-[#BAE6FD]">
              📸 ดึงภาพ 3D ใส่ช่องที่ 1
            </button>
            ${photos.some((p) => p.dataUrl) ? `<button id="sp-photo-clear-all" type="button" class="px-2 py-0.5 rounded bg-white border border-rose-500 text-rose-600 font-bold cursor-pointer hover:bg-rose-50">ล้างรูปทั้งหมด</button>` : ''}
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-1.5 py-0.5 rounded bg-slate-900 text-white font-mono text-[9.5px] font-bold">หน้า 4</span>
            <div class="inline-flex rounded border border-slate-900 overflow-hidden bg-white font-bold">
              <button id="sp-cz-mode-table" type="button" class="px-2 py-0.5 cursor-pointer ${cfg.conzolMode !== 'image' ? 'bg-[#1f4e78] text-white' : 'text-slate-800 hover:bg-slate-100'}">📋 ตาราง Conzol</button>
              <button id="sp-cz-mode-image" type="button" class="px-2 py-0.5 border-l border-slate-900 cursor-pointer ${cfg.conzolMode === 'image' ? 'bg-[#1f4e78] text-white' : 'text-slate-800 hover:bg-slate-100'}">🖼️ รูปภาพ</button>
            </div>
            <button id="sp-cz-add-row" type="button" class="px-2 py-0.5 rounded font-bold border border-slate-400 bg-white hover:bg-slate-100 cursor-pointer">+ เพิ่มแถว</button>
            <button id="sp-cz-add-group" type="button" class="px-2 py-0.5 rounded font-bold border border-slate-400 bg-white hover:bg-slate-100 cursor-pointer">+ เพิ่มหมวด</button>
            <button id="sp-cz-paste-excel" type="button" class="px-2.5 py-0.5 rounded font-bold border border-emerald-700 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 cursor-pointer">📊 วางจาก Excel</button>
            ${cfg.conzolMode === 'image' ? `<button id="sp-conzol-rotate-top" type="button" class="px-2 py-0.5 rounded font-bold border border-slate-900 bg-white hover:bg-slate-100 cursor-pointer">🔄 หมุน 90°</button>` : ''}
          </div>
        </div>

        <!-- Excel Paste Modal (Hidden by default) -->
        <div id="sp-cz-excel-modal" class="no-print hidden fixed inset-0 z-[95] bg-slate-900/60 flex items-center justify-center p-4">
          <div class="bg-white border-2 border-slate-900 rounded-xl shadow-2xl max-w-2xl w-full p-4 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-200 pb-2">
              <div class="font-display text-sm font-black text-slate-900">📊 วางข้อมูลตาราง Conzol จาก Excel / Google Sheets</div>
              <button id="sp-cz-excel-close" type="button" class="w-7 h-7 rounded border border-slate-900 font-black text-xs cursor-pointer hover:bg-rose-50">✕</button>
            </div>
            <p class="text-xs text-slate-600">
              คัดลอกตารางจาก Excel (คอลัมน์: <span class="font-mono font-bold">ลำดับ | ID | รายการ | STATUS | หมายเหตุ</span>) แล้วกด <b>Ctrl+V</b> ลงในช่องด้านล่าง (แถวที่มีข้อความคอลัมน์เดียวจะถูกสร้างเป็นแถบหมวดหมู่ให้อัตโนมัติ)
            </p>
            <textarea id="sp-cz-excel-text" rows="8" placeholder="วางข้อมูลจาก Excel ที่นี่..." class="w-full border-2 border-slate-900 rounded-lg p-2.5 font-mono text-xs outline-none"></textarea>
            <div class="flex items-center justify-end gap-2">
              <button id="sp-cz-excel-append" type="button" class="px-3 py-1.5 rounded-lg border-2 border-slate-900 bg-amber-50 hover:bg-amber-100 text-xs font-bold cursor-pointer">+ ต่อท้ายตารางเดิม</button>
              <button id="sp-cz-excel-replace" type="button" class="px-3.5 py-1.5 rounded-lg border-2 border-slate-900 bg-[#1f4e78] text-white hover:bg-slate-800 text-xs font-bold cursor-pointer">แทนที่ตารางทั้งหมด</button>
            </div>
          </div>
        </div>

        <!-- Scrollable A4 Preview Canvas -->
        <div class="sp-print-scroll flex-1 overflow-y-auto p-4 sm:p-6 bg-[#475569]">
          ${pagesHtml}
        </div>
      `;

      // Bind Toolbar
      root.querySelector('#sp-rep-close').onclick = () => root.classList.add('hidden');
      const closeMob = root.querySelector('#sp-rep-close-mobile');
      if (closeMob) closeMob.onclick = () => root.classList.add('hidden');
      const dlPdfBtn = root.querySelector('#sp-rep-download-pdf');
      if (dlPdfBtn) dlPdfBtn.onclick = () => exportExactPDF('daily');
      const dlPdfMob = root.querySelector('#sp-rep-download-pdf-mobile');
      if (dlPdfMob) dlPdfMob.onclick = () => exportExactPDF('daily');
      root.querySelector('#sp-rep-print-pdf').onclick = () => window.print();
      root.querySelectorAll('[data-sp-view]').forEach((b) => {
        b.onclick = () => { activeView = b.dataset.spView; draw(); };
      });
      root.querySelector('#sp-rep-recapture-views').onclick = () => {
        refreshMultiViews(reportViewMode);
        draw();
        getBridge()?.showToast?.('อัปเดตภาพโมเดลล่าสุดแล้ว');
      };
      root.querySelector('#sp-rep-mode-status').onclick = () => { refreshMultiViews('status'); draw(); };
      root.querySelector('#sp-rep-mode-sketchup').onclick = () => { refreshMultiViews('sketchup'); draw(); };
      root.querySelector('#sp-rep-copy-line').onclick = async () => {
        try {
          await navigator.clipboard.writeText(buildLineSummary());
          getBridge()?.showToast?.('คัดลอกสรุปรายงานส่ง LINE แล้ว');
        } catch {
          getBridge()?.showToast?.('ไม่สามารถคัดลอกข้อความได้');
        }
      };

      // Bind Page 1 Form Inputs & Weather Clocks
      root.querySelectorAll('[data-cfg]').forEach((el) => {
        const k = el.dataset.cfg;
        el.oninput = (e) => { cfg[k] = e.target.value; saveCfg(cfg); };
        if (k === 'date') {
          el.onchange = (e) => {
            cfg[k] = e.target.value || todayIso();
            const mainDateInp = document.getElementById('inp-sp-report-date');
            if (mainDateInp && mainDateInp.value !== cfg[k]) {
              mainDateInp.value = cfg[k];
              mainDateInp.dispatchEvent(new Event('change'));
            }
            saveCfg(cfg);
            captureNow();
            draw();
          };
        }
      });
      root.querySelectorAll('[data-permit]').forEach((cb) => {
        cb.onchange = () => { cfg.workPermit = cb.dataset.permit; saveCfg(cfg); draw(); };
      });
      root.querySelectorAll('[data-impact]').forEach((cb) => {
        cb.onchange = () => { cfg.weatherImpact = cb.dataset.impact; saveCfg(cfg); draw(); };
      });
      root.querySelectorAll('[data-weather-hour]').forEach((slice) => {
        slice.onclick = () => {
          const h = parseInt(slice.dataset.weatherHour, 10);
          const cur = cfg.weatherHours[h] || 'none';
          const next = WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(cur) + 1) % WEATHER_CYCLE.length];
          cfg.weatherHours[h] = next;
          saveCfg(cfg);
          draw();
        };
      });
      root.querySelectorAll('[data-extra]').forEach((el) => {
        const [idxStr, field] = el.dataset.extra.split(':');
        const idx = parseInt(idxStr, 10);
        el.oninput = (e) => { cfg.extraRows[idx][field] = e.target.value; saveCfg(cfg); };
      });
      root.querySelectorAll('[data-mp]').forEach((el) => {
        const [grp, idxStr, field] = el.dataset.mp.split(':');
        const idx = parseInt(idxStr, 10);
        el.oninput = (e) => {
          cfg.manpower[grp][idx][field] = field === 'count' ? (parseInt(e.target.value, 10) || 0) : e.target.value;
          saveCfg(cfg);
        };
        if (field === 'count') el.onchange = () => draw();
      });
      root.querySelectorAll('[data-mat]').forEach((el) => {
        const [idxStr, field] = el.dataset.mat.split(':');
        const idx = parseInt(idxStr, 10);
        el.oninput = (e) => {
          cfg.materials[idx][field] = field === 'count' ? (parseInt(e.target.value, 10) || 0) : e.target.value;
          saveCfg(cfg);
        };
      });
      root.querySelectorAll('[data-sig]').forEach((inp) => {
        inp.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const r = new FileReader();
          r.onload = () => {
            if (inp.dataset.sig === 'author') cfg.authorSignatureImg = r.result;
            else cfg.reviewerSignatureImg = r.result;
            saveCfg(cfg);
            draw();
          };
          r.readAsDataURL(file);
        };
      });
      root.querySelectorAll('[data-sig-clear]').forEach((btn) => {
        btn.onclick = () => {
          if (btn.dataset.sigClear === 'author') cfg.authorSignatureImg = '';
          else cfg.reviewerSignatureImg = '';
          saveCfg(cfg);
          draw();
        };
      });

      // Bind Page 3 Photos (Single & Multi-Image Bulk Upload)
      const loadMultiplePhotos = (files, startIndex = -1) => {
        const list = Array.from(files || []).filter((f) => f && f.type.startsWith('image/'));
        if (!list.length) return;
        const targetIndices = [];
        if (startIndex >= 0) {
          for (let i = startIndex; i < photos.length && targetIndices.length < list.length; i++) {
            targetIndices.push(i);
          }
        } else {
          // Fill empty slots first, then overwrite from start if more files than empty slots
          photos.forEach((p, idx) => { if (!p.dataUrl && targetIndices.length < list.length) targetIndices.push(idx); });
          for (let i = 0; i < photos.length && targetIndices.length < list.length; i++) {
            if (!targetIndices.includes(i)) targetIndices.push(i);
          }
        }
        let remaining = targetIndices.length;
        targetIndices.forEach((slotIdx, fileIdx) => {
          const r = new FileReader();
          r.onload = () => {
            photos[slotIdx].dataUrl = r.result;
            remaining -= 1;
            if (remaining <= 0) {
              draw();
              getBridge()?.showToast?.(`เพิ่มรูปถ่ายหน้างานแล้ว ${targetIndices.length} ภาพ`);
            }
          };
          r.readAsDataURL(list[fileIdx]);
        });
      };

      const bulkInp = root.querySelector('#sp-photo-bulk-file');
      if (bulkInp) {
        bulkInp.onchange = (e) => { loadMultiplePhotos(e.target.files, -1); e.target.value = ''; };
      }
      const clearAllPhotosBtn = root.querySelector('#sp-photo-clear-all');
      if (clearAllPhotosBtn) {
        clearAllPhotosBtn.onclick = () => { photos.forEach((p) => { p.dataUrl = ''; }); draw(); };
      }
      const capBtn = root.querySelector('#sp-cap-3d-photo1');
      if (capBtn) {
        capBtn.onclick = () => {
          const dataUrl = getBridge()?.capture3DSnapshot?.();
          if (dataUrl) {
            photos[0].dataUrl = dataUrl;
            draw();
            getBridge()?.showToast?.('ดึงภาพโมเดล 3D ใส่ช่องภาพที่ 1 แล้ว');
          }
        };
      }
      photos.forEach((slot, idx) => {
        const inp = root.querySelector(`#sp-photo-file-${slot.id}`);
        if (inp) {
          inp.onchange = (e) => { loadMultiplePhotos(e.target.files, idx); e.target.value = ''; };
        }
        const del = root.querySelector(`#sp-photo-del-${slot.id}`);
        if (del) del.onclick = () => { slot.dataUrl = ''; draw(); };
        const cap = root.querySelector(`#sp-photo-cap-${slot.id}`);
        if (cap) cap.oninput = (e) => { slot.caption = e.target.value; };
      });

      // Bind Page 4 Consult Table & Image Mode
      const czModeTbl = root.querySelector('#sp-cz-mode-table');
      if (czModeTbl) czModeTbl.onclick = () => { cfg.conzolMode = 'table'; saveCfg(cfg); draw(); };
      const czModeImg = root.querySelector('#sp-cz-mode-image');
      if (czModeImg) czModeImg.onclick = () => { cfg.conzolMode = 'image'; saveCfg(cfg); draw(); };
      const czAddRow = root.querySelector('#sp-cz-add-row');
      if (czAddRow) {
        czAddRow.onclick = () => {
          cfg.conzolMode = 'table';
          const rows = cfg.conzolTable.rows;
          const nextNum = rows.filter((r) => r && !r.isGroup).length + 1;
          rows.push({ isGroup: false, cells: [String(nextNum), '', '', 'AP', ''] });
          saveCfg(cfg);
          draw();
        };
      }
      const czAddGrp = root.querySelector('#sp-cz-add-group');
      if (czAddGrp) {
        czAddGrp.onclick = () => {
          cfg.conzolMode = 'table';
          cfg.conzolTable.rows.push({ isGroup: true, label: 'หมวดใหม่' });
          saveCfg(cfg);
          draw();
        };
      }
      root.querySelectorAll('[data-cz-group]').forEach((inp) => {
        inp.oninput = (e) => { cfg.conzolTable.rows[parseInt(inp.dataset.czGroup, 10)].label = e.target.value; saveCfg(cfg); };
      });
      root.querySelectorAll('[data-cz-cell]').forEach((ta) => {
        ta.style.height = 'auto';
        ta.style.height = ta.scrollHeight + 'px';
        ta.oninput = (e) => {
          ta.style.height = 'auto';
          ta.style.height = ta.scrollHeight + 'px';
          const [rIdx, cIdx] = ta.dataset.czCell.split(':').map(Number);
          if (cfg.conzolTable.rows[rIdx]?.cells) cfg.conzolTable.rows[rIdx].cells[cIdx] = e.target.value;
          saveCfg(cfg);
        };
      });
      root.querySelectorAll('[data-cz-del]').forEach((btn) => {
        btn.onclick = () => {
          cfg.conzolTable.rows.splice(parseInt(btn.dataset.czDel, 10), 1);
          saveCfg(cfg);
          draw();
        };
      });
      const czFile = root.querySelector('#sp-conzol-file');
      if (czFile) {
        czFile.onchange = (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const r = new FileReader();
          r.onload = () => { cfg.conzolImageUrl = r.result; saveCfg(cfg); draw(); };
          r.readAsDataURL(file);
        };
      }
      const czRot = root.querySelector('#sp-conzol-rotate');
      if (czRot) czRot.onclick = () => { cfg.conzolRotate90 = !cfg.conzolRotate90; saveCfg(cfg); draw(); };
      const czRotTop = root.querySelector('#sp-conzol-rotate-top');
      if (czRotTop) czRotTop.onclick = () => { cfg.conzolRotate90 = !cfg.conzolRotate90; saveCfg(cfg); draw(); };
      const czClr = root.querySelector('#sp-conzol-clear');
      if (czClr) czClr.onclick = () => { cfg.conzolImageUrl = ''; saveCfg(cfg); draw(); };

      // Excel Paste Modal Handlers (Exact Piling Conzol Excel Paste Workflow)
      const exModal = root.querySelector('#sp-cz-excel-modal');
      const exText = root.querySelector('#sp-cz-excel-text');
      const parseExcelRows = (raw) => {
        const lines = String(raw || '').split(/\r?\n/).map((l) => l.trimEnd()).filter((l) => l.trim().length > 0);
        const colCount = (cfg.conzolTable?.columns?.length) || 5;
        const parsed = [];
        lines.forEach((line) => {
          const parts = line.split('\t').map((c) => c.trim());
          // Skip header row if user copied column headers
          if (parts[0] === 'ลำดับ' && /ID|รายการ/i.test(parts[1] || '')) return;
          const nonEmpty = parts.filter(Boolean);
          if (nonEmpty.length === 1 && parts.length <= 2) {
            parsed.push({ isGroup: true, label: nonEmpty[0] });
          } else {
            const cells = Array.from({ length: colCount }, (_, i) => parts[i] || '');
            parsed.push({ isGroup: false, cells });
          }
        });
        return parsed;
      };
      const btnOpenExcel = root.querySelector('#sp-cz-paste-excel');
      if (btnOpenExcel && exModal) {
        btnOpenExcel.onclick = () => { exModal.classList.remove('hidden'); exText?.focus(); };
      }
      const btnCloseExcel = root.querySelector('#sp-cz-excel-close');
      if (btnCloseExcel && exModal) {
        btnCloseExcel.onclick = () => exModal.classList.add('hidden');
      }
      const applyExcel = (append) => {
        const newRows = parseExcelRows(exText?.value || '');
        if (!newRows.length) return;
        cfg.conzolMode = 'table';
        cfg.conzolTable.rows = append ? [...(cfg.conzolTable.rows || []), ...newRows] : newRows;
        saveCfg(cfg);
        exModal?.classList.add('hidden');
        draw();
        getBridge()?.showToast?.(`นำเข้าตาราง Conzol จาก Excel แล้ว (${newRows.length} แถว)`);
      };
      const btnExAppend = root.querySelector('#sp-cz-excel-append');
      if (btnExAppend) btnExAppend.onclick = () => applyExcel(true);
      const btnExReplace = root.querySelector('#sp-cz-excel-replace');
      if (btnExReplace) btnExReplace.onclick = () => applyExcel(false);

      // Preserve exact scroll position across re-renders + auto-fit A4 width cleanly on Mobile / Foldable / Tablet
      const scroller = root.querySelector('.sp-print-scroll');
      if (scroller && prevScrollTop > 0) scroller.scrollTop = prevScrollTop;
      const vw = window.innerWidth;
      if (vw < 840) {
        const scale = Math.max(0.42, Math.min(1, (vw - 24) / 794));
        root.querySelectorAll('.sp-a4-page').forEach((pg) => {
          pg.style.zoom = String(scale.toFixed(3));
        });
      }
    }

    // Exact WYSIWYG A4 PDF Exporter (matches on-screen preview pixel-for-pixel on PC & Mobile)
    let isExportingPdf = false;
    function ensureJsPdf() {
      const existing = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
      if (typeof existing === 'function') return Promise.resolve(existing);
      return new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        sc.onload = () => {
          const cls = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
          if (typeof cls === 'function') resolve(cls);
          else reject(new Error('jsPDF failed to initialize'));
        };
        sc.onerror = () => reject(new Error('Failed to load jsPDF'));
        document.head.appendChild(sc);
      });
    }

    function getSpPdfFilename(kind) {
      const dateStr = cfg.date || todayIso();
      let dd = '25', mm = '11', yy = '69';
      if (typeof dateStr === 'string' && dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          let y = parseInt(parts[0], 10);
          mm = parts[1].padStart(2, '0');
          dd = parts[2].padStart(2, '0');
          if (y < 2500) y += 543;
          yy = String(y % 100).padStart(2, '0');
        }
      }
      if (kind === 'summary') {
        return `SheetPile_Summary_PYNN_EKKAMAI12_${dd}-${mm}-${yy}.pdf`;
      }
      return `Daily Report Sheet Pile PYNN EKKAMAI 12 ${dd}-${mm}-${yy}.pdf`;
    }

    async function exportExactPDF(kind) {
      if (isExportingPdf) return;
      isExportingPdf = true;

      const prevView = activeView;
      if (kind !== 'summary' && activeView !== 'all') {
        activeView = 'all';
        draw();
      }

      const toast = document.createElement('div');
      toast.className = 'no-print fixed bottom-5 right-5 z-[10000] bg-[#1D2B45] text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-[#10B981] flex items-center gap-3 text-xs font-bold max-w-[90vw]';
      toast.innerHTML = `
        <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
        <span id="sp-pdf-toast-msg">กำลังเตรียมไฟล์ PDF ตรงตามตัวอย่าง A4...</span>
      `;
      document.body.appendChild(toast);
      const setToast = (msg) => {
        const el = document.getElementById('sp-pdf-toast-msg');
        if (el) el.textContent = msg;
      };

      const savedStyles = [];
      try {
        const jsPdfClass = await ensureJsPdf();
        if (document.fonts && document.fonts.ready) {
          try { await document.fonts.ready; } catch {}
        }
        await new Promise((r) => setTimeout(r, 180));

        const targets = kind === 'summary'
          ? Array.from(root.querySelectorAll('#sp-summary-capture-card'))
          : Array.from(root.querySelectorAll('.sp-a4-page'));

        if (!targets.length || !window.htmlToImage || typeof window.htmlToImage.toCanvas !== 'function') {
          throw new Error('PDF capture engine unavailable');
        }

        const pdf = new jsPdfClass({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          compress: true,
        });

        for (let i = 0; i < targets.length; i++) {
          const sheet = targets[i];
          setToast(`กำลังสร้าง PDF หน้า ${i + 1} / ${targets.length} (คมชัด A4)...`);
          if (i > 0) pdf.addPage('a4', 'portrait');

          // Temporarily lock desktop A4 width (794px) and reset mobile zoom so phone exports match PC 100%
          const prevStyle = {
            zoom: sheet.style.zoom,
            width: sheet.style.width,
            minWidth: sheet.style.minWidth,
            maxWidth: sheet.style.maxWidth,
            boxShadow: sheet.style.boxShadow,
            margin: sheet.style.margin,
          };
          savedStyles.push({ sheet, prevStyle });
          sheet.style.zoom = '1';
          sheet.style.width = '794px';
          sheet.style.minWidth = '794px';
          sheet.style.maxWidth = '794px';
          sheet.style.boxShadow = 'none';
          sheet.style.margin = '0';

          // Mirror form inputs/textareas into static spans/divs so browser foreignObject renders exact Thai glyphs & values
          const swapped = [];
          sheet.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach((cb) => {
            if (cb.checked) cb.setAttribute('checked', 'checked');
            else cb.removeAttribute('checked');
          });
          sheet.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea').forEach((inp) => {
            const cs = window.getComputedStyle(inp);
            const rect = inp.getBoundingClientRect();
            const mirror = document.createElement(inp.tagName === 'TEXTAREA' ? 'div' : 'span');
            mirror.className = inp.className;
            mirror.style.cssText = inp.style.cssText;
            mirror.style.display = inp.tagName === 'TEXTAREA' ? 'block' : 'inline-flex';
            mirror.style.alignItems = 'center';
            mirror.style.justifyContent = cs.textAlign === 'center' ? 'center' : (cs.textAlign === 'right' ? 'flex-end' : 'flex-start');
            mirror.style.textAlign = cs.textAlign;
            mirror.style.fontFamily = cs.fontFamily;
            mirror.style.fontSize = cs.fontSize;
            mirror.style.fontWeight = cs.fontWeight;
            mirror.style.color = cs.color;
            mirror.style.lineHeight = '1.35';
            mirror.style.whiteSpace = inp.tagName === 'TEXTAREA' ? 'pre-wrap' : 'nowrap';
            mirror.style.overflow = 'visible';
            if (rect.width > 0) mirror.style.width = `${rect.width}px`;
            if (rect.height > 0) mirror.style.minHeight = `${rect.height}px`;
            mirror.style.height = 'auto';
            mirror.style.padding = cs.padding || '0 2px';
            mirror.style.boxSizing = 'border-box';
            mirror.textContent = inp.type === 'date' && inp.value ? formatThaiDateShort(inp.value) : (inp.value || '');
            if (inp.parentNode) {
              inp.parentNode.insertBefore(mirror, inp);
              inp.style.display = 'none';
              swapped.push({ inp, mirror });
            }
          });

          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

          let canvas = null;
          try {
            const w = Math.round(sheet.offsetWidth || 794);
            const h = Math.round(sheet.scrollHeight || sheet.offsetHeight || 1123);
            const TRANSPARENT_PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            const filterFn = (node) => {
              if (!node) return true;
              if (node.classList && node.classList.contains('no-print')) return false;
              if (node.tagName === 'IMG') {
                if (node.style && node.style.display === 'none') return false;
                if (!node.complete || node.naturalWidth === 0) return false;
              }
              return true;
            };
            try {
              canvas = await window.htmlToImage.toCanvas(sheet, {
                backgroundColor: '#ffffff',
                pixelRatio: 2.4,
                width: w,
                height: h,
                cacheBust: false,
                imagePlaceholder: TRANSPARENT_PX,
                filter: filterFn,
              });
            } catch (fontErr) {
              console.warn('SheetPile PDF htmlToImage retrying with skipFonts:', fontErr);
              canvas = await window.htmlToImage.toCanvas(sheet, {
                backgroundColor: '#ffffff',
                pixelRatio: 2.4,
                width: w,
                height: h,
                skipFonts: true,
                cacheBust: false,
                imagePlaceholder: TRANSPARENT_PX,
                filter: filterFn,
              });
            }
          } finally {
            swapped.forEach(({ inp, mirror }) => {
              inp.style.display = '';
              if (mirror && mirror.parentNode) mirror.parentNode.removeChild(mirror);
            });
          }

          if (!canvas) throw new Error(`Render failed on page ${i + 1}`);

          // Fit cleanly inside A4 (210x297mm) with 3mm safe margin & zero aspect-ratio distortion
          const pageW = 210;
          const pageH = 297;
          const margin = 3;
          const maxW = pageW - margin * 2;
          const maxH = pageH - margin * 2;
          const aspect = canvas.width / Math.max(1, canvas.height);
          let drawW = maxW;
          let drawH = drawW / aspect;
          if (drawH > maxH) {
            drawH = maxH;
            drawW = drawH * aspect;
          }
          const offsetX = (pageW - drawW) / 2;
          const offsetY = margin;

          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
        }

        const filename = getSpPdfFilename(kind);
        setToast(`ดาวน์โหลด ${filename} สำเร็จ!`);
        pdf.save(filename);
        getBridge()?.showToast?.('ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว');
      } catch (err) {
        console.error('SheetPile exact PDF export failed:', err);
        getBridge()?.showToast?.('ไม่สามารถสร้างไฟล์ PDF อัตโนมัติได้ กำลังเปิดหน้าพิมพ์...');
        window.print();
      } finally {
        savedStyles.forEach(({ sheet, prevStyle }) => {
          sheet.style.zoom = prevStyle.zoom;
          sheet.style.width = prevStyle.width;
          sheet.style.minWidth = prevStyle.minWidth;
          sheet.style.maxWidth = prevStyle.maxWidth;
          sheet.style.boxShadow = prevStyle.boxShadow;
          sheet.style.margin = prevStyle.margin;
        });
        if (kind !== 'summary' && prevView !== activeView) {
          activeView = prevView;
          draw();
        }
        isExportingPdf = false;
        setTimeout(() => toast.remove(), 1200);
      }
    }

    draw();
    root.classList.remove('hidden');
    syncSharedSignaturesFromSupabase(cfg, () => {
      if (!root.classList.contains('hidden')) draw();
    });
  }

  window.openSheetPileReportStudio = function (tab) {
    renderStudio(tab || 'all');
  };
})();
