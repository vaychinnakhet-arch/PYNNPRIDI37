/**
 * PYNN EKKAMAI 12 — Home Dashboard: Sheet Pile & Excavation Progress Plan
 * Renders the live architectural progress plan (Report-style 2D Pit Plan + 2D Excavation Section + Gridline Ledger)
 * directly on index.html and handles the 2-Phase Menu Switcher (งาน Sheet Pile <-> งานเสาเข็ม 93 ต้น).
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'pynn_ekkamai12_sheetpile_v2';
  const SUPABASE_URL = 'https://gyzrsrxzzturoqwhuiul.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enJzcnh6enR1cm9xd2h1aXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxNDcsImV4cCI6MjA5MTA2MjE0N30.CJAFW3acVnOwb5hvSDO6H0TGPTK__MOTBdgUxUWpM70';
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  let cachedMeta = null;

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatThaiDate(iso) {
    const d = iso ? new Date(iso + 'T00:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return iso || '';
    return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function readLiveState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          excavationDepth: Math.max(0, Math.min(3.65, Number(p.excavationDepth) || 0)),
          statuses: p.statuses && typeof p.statuses === 'object' ? p.statuses : {},
          statusDates: p.statusDates && typeof p.statusDates === 'object' ? p.statusDates : {},
          reportDate: p.reportDate || todayIso(),
          preloadTons: Number(p.preloadTons) || 0,
        };
      }
    } catch {}
    return {
      excavationDepth: 0,
      statuses: {},
      statusDates: {},
      reportDate: todayIso(),
      preloadTons: 0,
    };
  }

  function getStatusColor(id, stMap, dateMap, reportDate) {
    const st = stMap[id] || 'pending';
    if (st === 'done') {
      const dt = dateMap[id];
      return dt && dt === reportDate ? '#0284C7' : '#10B981';
    }
    if (st === 'progress') return '#F26B2A';
    return '#F8FAFC';
  }

  function computeStats(state, meta) {
    const items = Array.isArray(meta?.items) ? meta.items : [];
    const statuses = state.statuses || {};
    const statusDates = state.statusDates || {};
    const reportDate = state.reportDate || todayIso();

    const sides = {
      N: { key: 'N', label: 'แนว Grid A–B (ช่วง 3/4–7)', short: 'Grid A–B', total: 55, done: 0, today: 0, progress: 0, items: [] },
      S: { key: 'S', label: 'แนว Grid E (ช่วง 3/4–7)', short: 'Grid E', total: 55, done: 0, today: 0, progress: 0, items: [] },
      W: { key: 'W', label: 'แนว Grid 3–4 (ช่วง B–E)', short: 'Grid 3–4', total: 16, done: 0, today: 0, progress: 0, items: [] },
      E: { key: 'E', label: 'แนว Grid 7 (ช่วง B–E)', short: 'Grid 7', total: 16, done: 0, today: 0, progress: 0, items: [] },
    };

    const spItems = items.filter((x) => x.category === 'sheetpile');
    if (spItems.length > 0) {
      sides.N.total = sides.S.total = sides.W.total = sides.E.total = 0;
      spItems.forEach((it) => {
        const sKey = (it.id.split('_')[1] || 'S').toUpperCase();
        const b = sides[sKey] || sides.S;
        b.total += 1;
        b.items.push(it);
        if (statuses[it.id] === 'done') {
          b.done += 1;
          if (statusDates[it.id] === reportDate) b.today += 1;
        } else if (statuses[it.id] === 'progress') {
          b.progress += 1;
        }
      });
    } else {
      Object.entries(statuses).forEach(([id, st]) => {
        if (!id.startsWith('SP_')) return;
        const sKey = (id.split('_')[1] || 'S').toUpperCase();
        const b = sides[sKey] || sides.S;
        if (st === 'done') {
          b.done += 1;
          if (statusDates[id] === reportDate) b.today += 1;
        } else if (st === 'progress') {
          b.progress += 1;
        }
      });
    }

    const spTotal = Object.values(sides).reduce((a, s) => a + s.total, 0) || 142;
    const spDone = Object.values(sides).reduce((a, s) => a + s.done, 0);
    const spToday = Object.values(sides).reduce((a, s) => a + s.today, 0);
    const spMeters = +(spDone * 0.4).toFixed(1);
    const spPct = Math.round((spDone / spTotal) * 100);

    const walerDefs = [
      { id: 'WALER_North', label: 'Waler แนว Grid A–B (H-350)', len: 18.62 },
      { id: 'WALER_South', label: 'Waler แนว Grid E (H-350)', len: 18.62 },
      { id: 'WALER_West', label: 'Waler แนว Grid 3–4 (H-350)', len: 8.62 },
      { id: 'WALER_East', label: 'Waler แนว Grid 7 (H-350)', len: 8.62 },
    ];
    let walerDoneM = 0;
    walerDefs.forEach((w) => {
      if (statuses[w.id] === 'done') walerDoneM += w.len;
    });

    const strutIds = ['STRUT_01_West', 'STRUT_02_East', 'CORNER_NW', 'CORNER_NE', 'CORNER_SW', 'CORNER_SE'];
    const strutDone = strutIds.filter((id) => statuses[id] === 'done').length;
    const bkDone = statuses['BRACKETS_ALL'] === 'done';
    const jackIds = ['JACK_01_West', 'JACK_02_East'];
    const jackDone = jackIds.filter((id) => statuses[id] === 'done').length;

    const pcItems = items.filter((x) => x.category === 'packing_concrete');
    let pcDoneM = 0;
    let pcTotalM = 0;
    pcItems.forEach((it) => {
      const l = Number(it.length_m) || 0;
      pcTotalM += l;
      if (statuses[it.id] === 'done') pcDoneM += l;
    });
    if (pcTotalM === 0) pcTotalM = 54.82;

    const bracingPct = Math.round(
      ((walerDoneM / 54.48) * 0.35 + (strutDone / 6) * 0.25 + (bkDone ? 0.1 : 0) + (pcDoneM / pcTotalM) * 0.2 + (jackDone / 2) * 0.1) * 100
    );

    const depth = state.excavationDepth;
    const stages = [
      { name: 'Stage 1 · ชั้นดินถม L1 (0.00 ถึง -1.50 ม.)', top: 0, bot: 1.5, vol: 248.16 },
      { name: 'Stage 2 · ดินเหนียวปนซิลท์ L2 (-1.50 ถึง -2.50 ม.)', top: 1.5, bot: 2.5, vol: 165.44 },
      { name: 'Stage 3 · ดินเหนียวอ่อน L3a (-2.50 ถึง -3.65 ม.)', top: 2.5, bot: 3.65, vol: 190.26 },
    ].map((st) => {
      const th = st.bot - st.top;
      const dug = Math.max(0, Math.min(th, depth - st.top));
      return { ...st, pct: Math.round((dug / th) * 100), dugVol: +(st.vol * (dug / th)).toFixed(2) };
    });
    const exTotalVol = 603.86;
    const exDugVol = +stages.reduce((a, x) => a + x.dugVol, 0).toFixed(2);
    const exPct = Math.min(100, Math.round((depth / 3.65) * 100));

    return {
      reportDate,
      statuses,
      statusDates,
      sp: { sides, total: spTotal, done: spDone, today: spToday, meters: spMeters, pct: spPct },
      bracing: {
        walerDoneM: +walerDoneM.toFixed(2),
        walerTotalM: 54.48,
        strutDone,
        strutTotal: 6,
        bkDone,
        jackDone,
        pcDoneM: +pcDoneM.toFixed(2),
        pcTotalM: +pcTotalM.toFixed(2),
        pct: bracingPct,
      },
      ex: { depth, stages, dugVol: exDugVol, totalVol: exTotalVol, pct: exPct },
    };
  }

  // Plate 1: Live 2D Architectural Top Plan of Sheet Pile Pit (142 Piles + Walers + Struts along real Gridlines)
  function renderTopPlanSvg(s) {
    const pitX = 104, pitY = 92, pitW = 440, pitH = 216;
    const stMap = s.statuses;
    const dtMap = s.statusDates;
    const rDate = s.reportDate;

    const getPileColor = (sideKey, idx, total) => {
      const sideItems = s.sp.sides[sideKey]?.items || [];
      if (sideItems.length === total) {
        // Sort N & S by x ascending, W & E by y descending so visual order matches real plan
        const sorted = [...sideItems].sort((a, b) =>
          sideKey === 'N' || sideKey === 'S' ? (a.x || 0) - (b.x || 0) : (b.y || 0) - (a.y || 0)
        );
        return getStatusColor(sorted[idx].id, stMap, dtMap, rDate);
      }
      // Fallback when metadata hasn't loaded yet: fill from left/top by done count
      const b = s.sp.sides[sideKey];
      if (idx < b.today) return '#0284C7';
      if (idx < b.done) return '#10B981';
      return '#F8FAFC';
    };

    let pileRects = '';
    // Top wall: Grid A-B (55 piles)
    const wH = pitW / 55;
    for (let i = 0; i < 55; i++) {
      const c = getPileColor('N', i, 55);
      pileRects += `<rect x="${(pitX + i * wH).toFixed(1)}" y="${pitY - 12}" width="${(wH - 0.6).toFixed(1)}" height="12" fill="${c}" stroke="#1D2B45" stroke-width="0.7" />`;
    }
    // Bottom wall: Grid E (55 piles)
    for (let i = 0; i < 55; i++) {
      const c = getPileColor('S', i, 55);
      pileRects += `<rect x="${(pitX + i * wH).toFixed(1)}" y="${pitY + pitH}" width="${(wH - 0.6).toFixed(1)}" height="12" fill="${c}" stroke="#1D2B45" stroke-width="0.7" />`;
    }
    // Left wall: Grid 3-4 (16 piles)
    const hV = pitH / 16;
    for (let i = 0; i < 16; i++) {
      const c = getPileColor('W', i, 16);
      pileRects += `<rect x="${pitX - 12}" y="${(pitY + i * hV).toFixed(1)}" width="12" height="${(hV - 0.6).toFixed(1)}" fill="${c}" stroke="#1D2B45" stroke-width="0.7" />`;
    }
    // Right wall: Grid 7 (16 piles)
    for (let i = 0; i < 16; i++) {
      const c = getPileColor('E', i, 16);
      pileRects += `<rect x="${pitX + pitW}" y="${(pitY + i * hV).toFixed(1)}" width="12" height="${(hV - 0.6).toFixed(1)}" fill="${c}" stroke="#1D2B45" stroke-width="0.7" />`;
    }

    const wN = getStatusColor('WALER_North', stMap, dtMap, rDate);
    const wS = getStatusColor('WALER_South', stMap, dtMap, rDate);
    const wW = getStatusColor('WALER_West', stMap, dtMap, rDate);
    const wE = getStatusColor('WALER_East', stMap, dtMap, rDate);
    const s1 = getStatusColor('STRUT_01_West', stMap, dtMap, rDate);
    const s2 = getStatusColor('STRUT_02_East', stMap, dtMap, rDate);
    const cNW = getStatusColor('CORNER_NW', stMap, dtMap, rDate);
    const cNE = getStatusColor('CORNER_NE', stMap, dtMap, rDate);
    const cSW = getStatusColor('CORNER_SW', stMap, dtMap, rDate);
    const cSE = getStatusColor('CORNER_SE', stMap, dtMap, rDate);

    const gridCols = [
      { label: '3–4', x: pitX },
      { label: '5', x: pitX + pitW * 0.24 },
      { label: '6', x: pitX + pitW * 0.62 },
      { label: '7', x: pitX + pitW },
    ];
    const gridRows = [
      { label: 'A–B', y: pitY },
      { label: 'C', y: pitY + pitH * 0.36 },
      { label: 'D', y: pitY + pitH * 0.72 },
      { label: 'E', y: pitY + pitH },
    ];

    return `
      <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" class="w-full aspect-[16/10] bg-white block" style="font-family:'Prompt','Sarabun',sans-serif;">
        <!-- Subtle Pit Interior Fill -->
        <rect x="${pitX}" y="${pitY}" width="${pitW}" height="${pitH}" fill="${s.ex.depth > 0 ? '#F0F9FF' : '#FAF8F5'}" />

        <!-- Architectural Gridlines -->
        ${gridCols.map((g) => `
          <line x1="${g.x}" y1="36" x2="${g.x}" y2="352" stroke="#94A3B8" stroke-width="0.9" stroke-dasharray="5,4" />
          <circle cx="${g.x}" cy="22" r="13" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.8" />
          <text x="${g.x}" y="26" text-anchor="middle" font-size="9.5" font-weight="800" fill="#1D2B45">${g.label}</text>
        `).join('')}
        ${gridRows.map((g) => `
          <line x1="42" y1="${g.y}" x2="588" y2="${g.y}" stroke="#94A3B8" stroke-width="0.9" stroke-dasharray="5,4" />
          <circle cx="24" cy="${g.y}" r="13" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.8" />
          <text x="24" y="${g.y + 3.5}" text-anchor="middle" font-size="9" font-weight="800" fill="#1D2B45">${g.label}</text>
        `).join('')}

        <!-- 142 Individual Sheet Piles -->
        ${pileRects}

        <!-- 4 Waler Beams (H-350) -->
        <rect x="${pitX + 4}" y="${pitY + 4}" width="${pitW - 8}" height="10" fill="${wN}" stroke="#1D2B45" stroke-width="1.2" />
        <rect x="${pitX + 4}" y="${pitY + pitH - 14}" width="${pitW - 8}" height="10" fill="${wS}" stroke="#1D2B45" stroke-width="1.2" />
        <rect x="${pitX + 4}" y="${pitY + 14}" width="10" height="${pitH - 28}" fill="${wW}" stroke="#1D2B45" stroke-width="1.2" />
        <rect x="${pitX + pitW - 14}" y="${pitY + 14}" width="10" height="${pitH - 28}" fill="${wE}" stroke="#1D2B45" stroke-width="1.2" />

        <!-- 2 Cross Struts -->
        <rect x="${pitX + pitW * 0.34 - 5}" y="${pitY + 14}" width="10" height="${pitH - 28}" fill="${s1}" stroke="#1D2B45" stroke-width="1.2" />
        <rect x="${pitX + pitW * 0.66 - 5}" y="${pitY + 14}" width="10" height="${pitH - 28}" fill="${s2}" stroke="#1D2B45" stroke-width="1.2" />

        <!-- 4 Corner Braces -->
        <line x1="${pitX + 14}" y1="${pitY + 62}" x2="${pitX + 66}" y2="${pitY + 14}" stroke="${cNW === '#F8FAFC' ? '#64748B' : cNW}" stroke-width="6" stroke-linecap="round" />
        <line x1="${pitX + pitW - 14}" y1="${pitY + 62}" x2="${pitX + pitW - 66}" y2="${pitY + 14}" stroke="${cNE === '#F8FAFC' ? '#64748B' : cNE}" stroke-width="6" stroke-linecap="round" />
        <line x1="${pitX + 14}" y1="${pitY + pitH - 62}" x2="${pitX + 66}" y2="${pitY + pitH - 14}" stroke="${cSW === '#F8FAFC' ? '#64748B' : cSW}" stroke-width="6" stroke-linecap="round" />
        <line x1="${pitX + pitW - 14}" y1="${pitY + pitH - 62}" x2="${pitX + pitW - 66}" y2="${pitY + pitH - 14}" stroke="${cSE === '#F8FAFC' ? '#64748B' : cSE}" stroke-width="6" stroke-linecap="round" />

        <!-- Center Pit Label -->
        <rect x="${pitX + pitW / 2 - 76}" y="${pitY + pitH / 2 - 22}" width="152" height="44" rx="6" fill="#FFFFFF" fill-opacity="0.94" stroke="#1D2B45" stroke-width="1.4" />
        <text x="${pitX + pitW / 2}" y="${pitY + pitH / 2 - 3}" text-anchor="middle" font-size="11" font-weight="800" fill="#1D2B45">Sheet Pile ${s.sp.done}/${s.sp.total} แผ่น (${s.sp.pct}%)</text>
        <text x="${pitX + pitW / 2}" y="${pitY + pitH / 2 + 13}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0284C7">บ่อขุด 18.80 × 8.80 ม. · EL.-${s.ex.depth.toFixed(2)} ม.</text>

        <!-- 4 Wall Progress Badges -->
        <rect x="${pitX + pitW / 2 - 78}" y="52" width="156" height="20" rx="4" fill="#FAF5EE" stroke="#1D2B45" stroke-width="1.1" />
        <text x="${pitX + pitW / 2}" y="65" text-anchor="middle" font-size="9.5" font-weight="800" fill="#1D2B45">แนว Grid A–B: ${s.sp.sides.N.done}/${s.sp.sides.N.total} แผ่น</text>

        <rect x="${pitX + pitW / 2 - 74}" y="330" width="148" height="20" rx="4" fill="#FAF5EE" stroke="#1D2B45" stroke-width="1.1" />
        <text x="${pitX + pitW / 2}" y="343" text-anchor="middle" font-size="9.5" font-weight="800" fill="#1D2B45">แนว Grid E: ${s.sp.sides.S.done}/${s.sp.sides.S.total} แผ่น</text>

        <rect x="46" y="366" width="150" height="20" rx="4" fill="#FAF5EE" stroke="#1D2B45" stroke-width="1.1" />
        <text x="121" y="379" text-anchor="middle" font-size="9" font-weight="800" fill="#1D2B45">Grid 3–4 (ซ้าย): ${s.sp.sides.W.done}/${s.sp.sides.W.total} แผ่น</text>

        <rect x="444" y="366" width="150" height="20" rx="4" fill="#FAF5EE" stroke="#1D2B45" stroke-width="1.1" />
        <text x="519" y="379" text-anchor="middle" font-size="9" font-weight="800" fill="#1D2B45">Grid 7 (ขวา): ${s.sp.sides.E.done}/${s.sp.sides.E.total} แผ่น</text>
      </svg>
    `;
  }

  // Plate 2: Exact Same 2D Architectural Excavation Cross-Section SVG (EL. 0.00 -> -3.65m)
  function renderSectionSvg(s) {
    const depth = Math.max(0, Math.min(3.65, Number(s.ex.depth) || 0));
    const elToY = (d) => {
      if (d <= 1.5) return 64 + (d / 1.5) * (136 - 64);
      if (d <= 2.5) return 136 + ((d - 1.5) / 1.0) * (188 - 136);
      if (d <= 3.65) return 188 + ((d - 2.5) / 1.15) * (256 - 188);
      return 256 + ((d - 3.65) / 9.85) * (352 - 256);
    };
    const curY = Math.round(elToY(depth));
    const hasBracing = (s.bracing.walerDoneM > 0 || s.bracing.strutDone > 0);
    const remVol = Math.max(0, +(s.ex.totalVol - s.ex.dugVol).toFixed(1));
    const dugHeight = Math.max(0, curY - 64);
    const remHeight = Math.max(0, 256 - curY);

    return `
      <svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" class="w-full aspect-[16/10] bg-white block" style="font-family:'Prompt','Sarabun',sans-serif;">
        <defs>
          <pattern id="home-hatch-soil" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#B45309" stroke-width="1.4" stroke-opacity="0.38" />
          </pattern>
          <pattern id="home-hatch-clay" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="#64748B" stroke-width="1" stroke-opacity="0.22" />
          </pattern>
        </defs>

        <rect x="20" y="64" width="420" height="72" fill="#E8DCCB" fill-opacity="0.45" />
        <rect x="20" y="136" width="420" height="52" fill="#DDD0BE" fill-opacity="0.50" />
        <rect x="20" y="188" width="420" height="68" fill="#CBD5E1" fill-opacity="0.40" />
        <rect x="20" y="256" width="420" height="118" fill="#E2E8F0" fill-opacity="0.55" />
        <rect x="20" y="256" width="420" height="118" fill="url(#home-hatch-clay)" />

        <line x1="115" y1="36" x2="115" y2="62" stroke="#1D2B45" stroke-width="1" stroke-dasharray="3,2" />
        <circle cx="115" cy="22" r="14" fill="#FFFFFF" stroke="#1D2B45" stroke-width="2" />
        <text x="115" y="26" text-anchor="middle" font-size="10" font-weight="800" fill="#1D2B45">3–4</text>

        <line x1="425" y1="36" x2="425" y2="62" stroke="#1D2B45" stroke-width="1" stroke-dasharray="3,2" />
        <circle cx="425" cy="22" r="14" fill="#FFFFFF" stroke="#1D2B45" stroke-width="2" />
        <text x="425" y="26" text-anchor="middle" font-size="11" font-weight="800" fill="#1D2B45">7</text>

        <line x1="132" y1="22" x2="408" y2="22" stroke="#1D2B45" stroke-width="1.2" />
        <polygon points="132,22 139,18 139,26" fill="#1D2B45" />
        <polygon points="408,22 401,18 401,26" fill="#1D2B45" />
        <rect x="195" y="11" width="150" height="22" rx="4" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.2" />
        <text x="270" y="26" text-anchor="middle" font-size="10.5" font-weight="800" fill="#1D2B45">กว้างบ่อ 18.80 ม. (Grid 3/4–7)</text>

        <line x1="20" y1="64" x2="444" y2="64" stroke="#1D2B45" stroke-width="2" />
        <text x="24" y="58" font-size="10" font-weight="800" fill="#1D2B45">GL. 0.00 ม.</text>

        ${dugHeight > 0 ? `<rect x="122" y="64" width="296" height="${dugHeight}" fill="#E0F2FE" />` : ''}
        ${remHeight > 0 ? `
          <rect x="122" y="${curY}" width="296" height="${remHeight}" fill="#FDE6C4" />
          <rect x="122" y="${curY}" width="296" height="${remHeight}" fill="url(#home-hatch-soil)" />
        ` : ''}

        <line x1="122" y1="136" x2="418" y2="136" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3" />
        <line x1="122" y1="188" x2="418" y2="188" stroke="#64748B" stroke-width="1" stroke-dasharray="4,3" />

        <rect x="122" y="130" width="296" height="10" fill="${hasBracing ? '#10B981' : '#FFFFFF'}" fill-opacity="0.92" stroke="${hasBracing ? '#065F46' : '#475569'}" stroke-width="1.5" ${hasBracing ? '' : 'stroke-dasharray="4,2"'} />
        <text x="270" y="138" text-anchor="middle" font-size="8.5" font-weight="800" fill="${hasBracing ? '#FFFFFF' : '#334155'}">ค้ำยัน Waler H-350 / Strut (EL -1.50 ม.)</text>

        <line x1="104" y1="256" x2="444" y2="256" stroke="#DC2626" stroke-width="2" stroke-dasharray="6,3" />
        <rect x="198" y="261" width="144" height="18" rx="3" fill="#FEF2F2" stroke="#DC2626" stroke-width="1" />
        <text x="270" y="273" text-anchor="middle" font-size="9.5" font-weight="800" fill="#B91C1C">ก้นบ่อออกแบบ EL -3.65 ม.</text>

        ${depth > 0 ? `
          <line x1="118" y1="${curY}" x2="422" y2="${curY}" stroke="#0284C7" stroke-width="2.8" />
          <polygon points="150,${curY} 144,${curY - 8} 156,${curY - 8}" fill="#0284C7" />
          <rect x="164" y="${Math.max(68, Math.min(curY - 34, 214))}" width="212" height="30" rx="5" fill="#0284C7" stroke="#1D2B45" stroke-width="1.5" />
          <text x="270" y="${Math.max(80, Math.min(curY - 21, 226))}" text-anchor="middle" font-size="10.5" font-weight="800" fill="#FFFFFF">ขุดแล้วถึง EL -${depth.toFixed(2)} ม. (${s.ex.pct}%)</text>
          <text x="270" y="${Math.max(93, Math.min(curY - 8, 239))}" text-anchor="middle" font-size="9" font-weight="700" fill="#E0F2FE">${s.ex.dugVol} / ${s.ex.totalVol} ลบ.ม.</text>
        ` : `
          <rect x="160" y="82" width="220" height="36" rx="5" fill="#FFFFFF" stroke="#1D2B45" stroke-width="1.5" />
          <text x="270" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="#1D2B45">ยังไม่เริ่มขุดดิน (EL 0.00 ม.)</text>
          <text x="270" y="112" text-anchor="middle" font-size="9.5" font-weight="700" fill="#B45309">ปริมาตรรอขุดทั้งหมด ${s.ex.totalVol} ลบ.ม.</text>
        `}

        ${remHeight >= 34 && depth > 0 ? `
          <rect x="180" y="${Math.round(curY + remHeight / 2 - 11)}" width="180" height="22" rx="4" fill="#FFFBEB" fill-opacity="0.95" stroke="#B45309" stroke-width="1" />
          <text x="270" y="${Math.round(curY + remHeight / 2 + 4)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="#92400E">ดินคงเหลือรอขุด ${remVol} ลบ.ม.</text>
        ` : ''}

        <rect x="108" y="60" width="14" height="292" fill="#1D2B45" stroke="#0F172A" stroke-width="1.5" />
        <rect x="418" y="60" width="14" height="292" fill="#1D2B45" stroke="#0F172A" stroke-width="1.5" />
        <text x="115" y="368" text-anchor="middle" font-size="9" font-weight="800" fill="#1D2B45">Sheet Pile</text>
        <text x="425" y="368" text-anchor="middle" font-size="9" font-weight="800" fill="#1D2B45">Sheet Pile</text>
        <line x1="122" y1="352" x2="444" y2="352" stroke="#334155" stroke-width="1.2" stroke-dasharray="4,3" />
        <rect x="160" y="341" width="220" height="20" rx="3" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1" />
        <text x="270" y="354" text-anchor="middle" font-size="9" font-weight="800" fill="#334155">ปลายชีตไพล์ฝังดิน EL -13.50 ม. (ยาว 13.50 ม.)</text>

        <text x="102" y="103" text-anchor="end" font-size="9" font-weight="800" fill="#78350F">Stage 1</text>
        <text x="102" y="114" text-anchor="end" font-size="8" font-weight="700" fill="#92400E">0→-1.5m</text>
        <text x="102" y="160" text-anchor="end" font-size="9" font-weight="800" fill="#78350F">Stage 2</text>
        <text x="102" y="171" text-anchor="end" font-size="8" font-weight="700" fill="#92400E">-1.5→-2.5m</text>
        <text x="102" y="220" text-anchor="end" font-size="9" font-weight="800" fill="#1E3A8A">Stage 3</text>
        <text x="102" y="231" text-anchor="end" font-size="8" font-weight="700" fill="#1D4ED8">-2.5→-3.65m</text>

        <g font-size="9.5" font-weight="700">
          <rect x="448" y="64" width="180" height="72" fill="#F5EFE6" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="79" font-size="9" font-weight="800" fill="#78350F">EL 0.00 → -1.50 ม.</text>
          <text x="455" y="95" font-size="9.5" font-weight="800" fill="#1D2B45">L1 ดินถม (Fill)</text>
          <text x="455" y="109" font-size="8.5" fill="#475569">ปริมาตรขุด 248.16 ลบ.ม.</text>

          <rect x="448" y="136" width="180" height="52" fill="#EDE3D5" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="150" font-size="9" font-weight="800" fill="#78350F">EL -1.50 → -2.50 ม.</text>
          <text x="455" y="164" font-size="9.5" font-weight="800" fill="#1D2B45">L2 ดินเหนียวปนซิลท์</text>
          <text x="455" y="177" font-size="8.5" fill="#475569">ปริมาตรขุด 165.44 ลบ.ม.</text>

          <rect x="448" y="188" width="180" height="68" fill="#E2E8F0" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="203" font-size="9" font-weight="800" fill="#0369A1">EL -2.50 → -3.65 ม.</text>
          <text x="455" y="218" font-size="9.5" font-weight="800" fill="#1D2B45">L3a ดินเหนียวอ่อน (ก้นบ่อ)</text>
          <text x="455" y="232" font-size="8.5" fill="#475569">ปริมาตรขุด 190.26 ลบ.ม.</text>

          <rect x="448" y="256" width="180" height="96" fill="#F1F5F9" stroke="#1D2B45" stroke-width="1" />
          <text x="455" y="274" font-size="9" font-weight="800" fill="#DC2626">EL -3.65 → -13.50 ม.</text>
          <text x="455" y="292" font-size="9.5" font-weight="800" fill="#1D2B45">L3 ดินเหนียวอ่อนมาก</text>
          <text x="455" y="307" font-size="8.5" fill="#475569">Very Soft Clay (ช่วงฝังชีตไพล์)</text>
          <text x="455" y="340" font-size="9" font-weight="800" fill="#1D2B45">EL -13.50 ม. (ปลายชีตไพล์)</text>
        </g>
      </svg>
    `;
  }

  function renderDashboard() {
    const host = document.getElementById('portal-sheetpile-panel');
    if (!host) return;
    const existingFrame = document.getElementById('home-sp-3d-frame');
    const state = readLiveState();
    const s = computeStats(state, cachedMeta);
    const dateFull = formatThaiDate(s.reportDate);

    host.innerHTML = `
      <div class="doodle-card-hero mb-6 p-4 sm:p-5 md:p-6 relative bg-white border-2.5 border-[#1D2B45] rounded-3xl shadow-[6px_6px_0px_#1D2B45] space-y-5">
        <!-- Header & Primary Action Bar -->
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 border-b-2 border-[#1D2B45] pb-3.5">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="font-display text-lg sm:text-xl font-black text-[#1D2B45] tracking-tight">
                ผังแสดงความก้าวหน้างานป้องกันดิน Sheet Pile &amp; งานขุดดิน
              </h2>
              <span class="doodle-pill bg-[#ECFDF5] border-[#10B981] text-[#065F46] text-[10.5px] font-mono font-bold">
                SP ${s.sp.done}/${s.sp.total} (${s.sp.pct}%) · ขุดดิน EL.-${s.ex.depth.toFixed(2)} ม. (${s.ex.pct}%)
              </span>
            </div>
            <p class="text-xs text-[#3E4B69] font-semibold mt-1">
              อัปเดต ณ วันที่ ${esc(dateFull)} · แสดงผลเชื่อมตรงกับหน้างาน 3D แบบ Real-time
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <a href="sheetpile.html" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F26B2A] hover:bg-[#E05615] text-white border-2 border-[#1D2B45] font-display text-xs sm:text-sm font-bold shadow-[3px_3px_0px_#1D2B45] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all">
              <span>🛡️ เข้าสู่หน้างาน 3D Sheet Pile &amp; ขุดดิน</span>
              <span>→</span>
            </a>
            <a href="footing.html" class="px-3 py-2 rounded-xl bg-white hover:bg-[#E0F2FE] border-2 border-[#1D2B45] text-[#1D2B45] font-display text-xs font-bold shadow-[2px_2px_0px_#1D2B45] transition-all">
              ผังฐานราก 3D
            </a>
            <button type="button" onclick="enterAppView('residential')" class="px-3 py-2 rounded-xl bg-white hover:bg-[#FFF1F2] border-2 border-[#1D2B45] text-[#1D2B45] font-display text-xs font-bold shadow-[2px_2px_0px_#1D2B45] cursor-pointer transition-all">
              ตรวจห้อง QC
            </button>
          </div>
        </div>

        <!-- Report-Style Legend + 2 Live Engineering Plates -->
        <div>
          <div class="flex items-center justify-between flex-wrap gap-2 mb-2.5">
            <h3 class="font-display text-xs sm:text-sm font-black text-[#1D2B45]">
              ผังแปลนแสดงความก้าวหน้า &amp; รูปตัดระดับขุดดิน
            </h3>
            <div class="flex items-center gap-3 text-[11px] font-bold text-[#1D2B45] flex-wrap">
              <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-[#0284C7] border border-[#1D2B45]"></span>ทำวันนี้ (${s.sp.today})</span>
              <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-[#10B981] border border-[#1D2B45]"></span>เสร็จสะสม (${s.sp.done})</span>
              <span class="inline-flex items-center gap-1.5"><span class="inline-block w-3 h-3 bg-[#F8FAFC] border border-[#334155]"></span>ยังไม่ทำ (${s.sp.total - s.sp.done})</span>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
            <figure class="border-2 border-[#1D2B45] rounded-xl overflow-hidden bg-white shadow-[3px_3px_0px_#1D2B45] m-0">
              <div class="bg-[#FAF5EE] border-b-2 border-[#1D2B45] px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px] font-mono font-bold text-[#1D2B45] flex items-center justify-between gap-2">
                <span class="truncate">1. แปลน TOP VIEW 3D โซนชีตไพล์</span>
                <span class="text-[#065F46] shrink-0">${s.sp.done}/${s.sp.total} (${s.sp.pct}%)</span>
              </div>
              <div id="home-sp-3d-slot" class="w-full aspect-[4/3] sm:aspect-[16/10] bg-white">
                ${existingFrame ? '' : `<iframe id="home-sp-3d-frame" src="sheetpile.html?embed=top" title="แปลน 3D โซนชีตไพล์และค้ำยัน" class="w-full h-full border-0 bg-white block" loading="eager"></iframe>`}
              </div>
            </figure>

            <figure class="border-2 border-[#1D2B45] rounded-xl overflow-hidden bg-white shadow-[3px_3px_0px_#1D2B45] m-0">
              <div class="bg-[#FAF5EE] border-b-2 border-[#1D2B45] px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px] font-mono font-bold text-[#1D2B45] flex items-center justify-between gap-2">
                <span class="truncate">2. รูปตัดระดับขุดดิน &amp; ชั้นดิน (-3.65 ม.)</span>
                <span class="text-[#0284C7] shrink-0">EL.-${s.ex.depth.toFixed(2)} ม. (${s.ex.pct}%)</span>
              </div>
              ${renderSectionSvg(s)}
            </figure>
          </div>
        </div>

        <!-- 3-Package Summary + Gridline Breakdown (Report-Style Clean Engineering Tables) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          <!-- Left: 3 Packages Summary -->
          <div class="lg:col-span-6 overflow-x-auto">
            <h3 class="font-display text-xs font-black text-[#1D2B45] border-b-2 border-[#1D2B45] pb-1 mb-2">
              สรุปความก้าวหน้า 3 หมวดงานหลัก
            </h3>
            <table class="w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#1D2B45] text-white text-left">
                  <th class="border border-[#1D2B45] px-2.5 py-1.5">หมวดงาน</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ผลงานสะสม</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">เป้าหมาย</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-2 font-bold">1. งานกดชีตไพล์ (ยาว 13.50 ม.)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono font-bold text-[#065F46]">${s.sp.done} แผ่น (${s.sp.meters} ม.)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono">${s.sp.total} แผ่น (56.8 ม.)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono font-black">${s.sp.pct}%</td>
                </tr>
                <tr class="bg-[#FAF5EE]/60">
                  <td class="border border-[#1D2B45] px-2.5 py-2 font-bold">2. งานค้ำยัน Waler / Strut &amp; Packing</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono">Waler ${s.bracing.walerDoneM}ม. · Strut ${s.bracing.strutDone}/6</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono">54.48ม. · 6 ต้น</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono font-black">${s.bracing.pct}%</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-2 font-bold">3. งานขุดดิน (EL. 0.00 → -3.65 ม.)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono font-bold text-[#0284C7]">EL.-${s.ex.depth.toFixed(2)} ม. (${s.ex.dugVol} ม³)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono">EL.-3.65 ม. (603.86 ม³)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-2 text-right font-mono font-black">${s.ex.pct}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Right: Gridline Breakdown Table -->
          <div class="lg:col-span-6 overflow-x-auto">
            <h3 class="font-display text-xs font-black text-[#1D2B45] border-b-2 border-[#1D2B45] pb-1 mb-2">
              ความก้าวหน้างานกดชีตไพล์ (แยกตามแนว Gridline)
            </h3>
            <table class="w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#FAF5EE] text-left">
                  <th class="border border-[#1D2B45] px-2.5 py-1.5">แนว Gridline กำแพงชีตไพล์</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ตามแบบ</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">กดแล้ว</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">คงเหลือ</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">%</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(s.sp.sides).map((side) => {
                  const pct = side.total ? Math.round((side.done / side.total) * 100) : 0;
                  return `<tr>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 font-bold">${esc(side.label)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${side.total}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold text-[#065F46]">${side.done}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono text-[#E64C3C]">${side.total - side.done}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold">${pct}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    if (existingFrame) {
      const slot = document.getElementById('home-sp-3d-slot');
      if (slot) slot.appendChild(existingFrame);
    }
  }

  window.switchHomePhase = function (phase) {
    const spPanel = document.getElementById('portal-sheetpile-panel');
    const pilPanel = document.getElementById('portal-piling-panel');
    const btnSp = document.getElementById('btn-phase-sheetpile');
    const btnPil = document.getElementById('btn-phase-piling');
    const isSp = phase !== 'piling';

    if (spPanel) spPanel.classList.toggle('hidden', !isSp);
    if (pilPanel) pilPanel.classList.toggle('hidden', isSp);

    const activeCls = ['bg-[#1D2B45]', 'text-white', 'shadow-[3px_3px_0px_#F26B2A]'];
    const idleCls = ['bg-white', 'text-[#1D2B45]', 'hover:bg-[#FAF5EE]', 'shadow-[2px_2px_0px_#1D2B45]'];

    if (btnSp) {
      btnSp.setAttribute('aria-pressed', isSp ? 'true' : 'false');
      activeCls.forEach((c) => btnSp.classList.toggle(c, isSp));
      idleCls.forEach((c) => btnSp.classList.toggle(c, !isSp));
    }
    if (btnPil) {
      btnPil.setAttribute('aria-pressed', !isSp ? 'true' : 'false');
      activeCls.forEach((c) => btnPil.classList.toggle(c, !isSp));
      idleCls.forEach((c) => btnPil.classList.toggle(c, isSp));
    }

    if (isSp) {
      renderDashboard();
    } else {
      setTimeout(() => window.dispatchEvent(new Event('resize')), 40);
    }
  };

  function init() {
    renderDashboard();
    const initial = window.location.hash === '#piling' ? 'piling' : 'sheetpile';
    window.switchHomePhase(initial);

    fetch('sheetpile_metadata.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          cachedMeta = data;
          renderDashboard();
        }
      })
      .catch(() => {});

    // Sync latest cloud Sheet Pile progress from Supabase so every device shows up-to-date progress
    fetch(SUPABASE_URL + '/rest/v1/project_data?id=eq.1&select=data', {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((rows) => {
        const remote = rows?.[0]?.data?.sheetpileProgress;
        if (!remote || typeof remote !== 'object') return;
        const localRaw = localStorage.getItem(STORAGE_KEY);
        const localParsed = localRaw ? JSON.parse(localRaw) : null;
        const localTs = localParsed?.updatedAt ? Date.parse(localParsed.updatedAt) : 0;
        const remoteTs = remote.updatedAt ? Date.parse(remote.updatedAt) : 0;
        if (!localParsed || remoteTs > localTs) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remote));
          renderDashboard();
        }
      })
      .catch(() => {});

    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) renderDashboard();
    });
    window.addEventListener('focus', renderDashboard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
