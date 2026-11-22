/**
 * PYNN EKKAMAI 12 — Sheet Pile & 4D Excavation Report Studio
 * Matches piling.html DoodleWeb Report Center & 3-Page Sansiri Daily Report PDF
 *
 * 3 Engineering Work Packages:
 *  1. งานกดชีตไพล์ (Sheet Pile Driving — 142 แผ่น / 56.8 ม. · N/S/E/W)
 *  2. งานติดตั้ง Waler / Strut / Preload & เทคอนกรีต Packing Concrete
 *  3. งานขุดดิน 4D (Excavation — 3 Stages · 628.67 ลบ.ม. · EL. 0.00 -> -3.80m)
 */
(function () {
  'use strict';

  const CONFIG_KEY = 'pynn_ekkamai12_sp_daily_cfg_v1';
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

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

  function getBridge() {
    return window.__SP_REPORT_BRIDGE__ || null;
  }

  function loadCfg() {
    const base = {
      reportNo: 'DR-SP-001',
      date: todayIso(),
      weatherAm: 'แจ่มใส / ปกติ',
      weatherPm: 'มีเมฆบางส่วน',
      manpower: 'วิศวกร 2 · โฟร์แมน 2 · ช่างเชื่อม/คนงาน 14 คน',
      equipment: 'รถแบคโฮ PC200 + ไวโบร (1) · เครน 25T (1) · ตู้เชื่อม (2) · ปั๊มน้ำ (2)',
      workSummary: '1. กด/ตอก Sheet Pile FSP-III 13.5m\n2. ติดตั้ง Waler H-350, Strut/Corner Brace และเทคอนกรีตอุดช่องว่าง (Packing Concrete)\n3. ขุดดินบ่อฐานรากตามลำดับชั้น (4D Excavation)',
      issuesNote: 'ตรวจสอบการเคลื่อนตัวแนวกำแพง Sheet Pile ปกติ ไม่มีน้ำซึมผิดปกติ',
      engineerName: 'วิศวกรโครงการ (Site Engineer)',
      inspectorName: 'ผู้ควบคุมงาน (CM / Sansiri QC)',
    };
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (raw) return { ...base, ...JSON.parse(raw) };
    } catch {}
    return base;
  }

  function saveCfg(cfg) {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch {}
  }

  function computeDetailedStats() {
    const b = getBridge();
    const state = b?.getState?.() || { excavationDepth: 0, statuses: {}, preloadTons: 0, logs: [] };
    const meta = b?.getMetadata?.() || { items: [] };
    const items = Array.isArray(meta.items) ? meta.items : [];
    const statuses = state.statuses || {};

    // 1. Sheet Pile by 4 sides (Exact design counts: N=55, S=55, E=16, W=16 -> Total 142)
    const sides = {
      N: { label: 'ด้านเหนือ (North)', total: 55, done: 0, progress: 0 },
      S: { label: 'ด้านใต้ (South)', total: 55, done: 0, progress: 0 },
      E: { label: 'ด้านตะวันออก (East)', total: 16, done: 0, progress: 0 },
      W: { label: 'ด้านตะวันตก (West)', total: 16, done: 0, progress: 0 },
    };
    const spItems = items.filter((x) => x.category === 'sheetpile');
    if (spItems.length > 0) {
      sides.N.total = sides.S.total = sides.E.total = sides.W.total = 0;
      spItems.forEach((it) => {
        const sKey = (it.id.split('_')[1] || 'S').toUpperCase();
        const bucket = sides[sKey] || sides.S;
        bucket.total += 1;
        if (statuses[it.id] === 'done') bucket.done += 1;
        else if (statuses[it.id] === 'progress') bucket.progress += 1;
      });
    } else {
      Object.entries(statuses).forEach(([id, st]) => {
        if (!id.startsWith('SP_')) return;
        const sKey = (id.split('_')[1] || 'S').toUpperCase();
        const bucket = sides[sKey] || sides.S;
        if (st === 'done') bucket.done += 1;
        else if (st === 'progress') bucket.progress += 1;
      });
    }
    const spTotal = Object.values(sides).reduce((a, s) => a + s.total, 0) || 142;
    const spDone = Object.values(sides).reduce((a, s) => a + s.done, 0);
    const spProg = Object.values(sides).reduce((a, s) => a + s.progress, 0);
    const spMeters = +(spDone * 0.4).toFixed(1);
    const spPct = Math.round((spDone / spTotal) * 100);

    // 2. Waler / Strut / Bracket / Jack & Packing Concrete
    const walerDefs = [
      { id: 'WALER_North', label: 'Waler ด้านเหนือ (H-350)', len: 18.62 },
      { id: 'WALER_South', label: 'Waler ด้านใต้ (H-350)', len: 18.62 },
      { id: 'WALER_West', label: 'Waler ด้านตะวันตก (H-350)', len: 8.62 },
      { id: 'WALER_East', label: 'Waler ด้านตะวันออก (H-350)', len: 8.62 },
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
    if (pcTotalVol === 0) pcTotalVol = 1.626;

    const bracingPct = Math.round(
      ((walerDoneM / 54.48) * 0.35 + (strutDone / 6) * 0.25 + (bkStatus === 'done' ? 0.1 : 0) + (pcDoneM / pcTotalM) * 0.2 + (jackDone / 2) * 0.1) * 100
    );

    // 3. Excavation 4D (3 Stages)
    const depth = Number(state.excavationDepth) || 0;
    const stages = [
      { name: 'Stage 1 · ชั้นดินถม L1 (0.00 ถึง -1.50 ม.)', top: 0, bot: 1.5, vol: 248.16 },
      { name: 'Stage 2 · ดินเหนียวปนซิลท์ L2 (-1.50 ถึง -2.50 ม.)', top: 1.5, bot: 2.5, vol: 165.44 },
      { name: 'Stage 3 · ดินเหนียวอ่อน L3a (-2.50 ถึง -3.80 ม.)', top: 2.5, bot: 3.8, vol: 215.07 },
    ].map((st) => {
      const thickness = st.bot - st.top;
      const dug = Math.max(0, Math.min(thickness, depth - st.top));
      const pct = Math.round((dug / thickness) * 100);
      const dugVol = +(st.vol * (dug / thickness)).toFixed(2);
      return { ...st, pct, dugVol };
    });
    const exTotalVol = 628.67;
    const exDugVol = +stages.reduce((a, s) => a + s.dugVol, 0).toFixed(2);
    const exPct = Math.min(100, Math.round((exDugVol / exTotalVol) * 100));

    return {
      sp: { sides, total: spTotal, done: spDone, progress: spProg, meters: spMeters, pct: spPct },
      bracing: {
        walerRows, walerDoneM: +walerDoneM.toFixed(2), walerTotalM: 54.48,
        strutRows, strutDone, strutTotal: 6,
        bkStatus, jackDone, jackTotal: 2, jackTons,
        pcDoneCount, pcTotalCount: pcItems.length || 28,
        pcDoneM: +pcDoneM.toFixed(2), pcTotalM: +pcTotalM.toFixed(2),
        pcDoneVol: +pcDoneVol.toFixed(3), pcTotalVol: +pcTotalVol.toFixed(3),
        pct: bracingPct,
      },
      ex: { depth, stages, dugVol: exDugVol, totalVol: exTotalVol, pct: exPct },
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
    caption: i === 0 ? 'ภาพจำลอง 3D ความคืบหน้า Sheet Pile & ขุดดิน 4D' : `ภาพถ่ายหน้างานที่ ${i + 1}`,
  }));

  function ensureModalRoot() {
    let root = document.getElementById('sp-report-studio-modal');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'sp-report-studio-modal';
    root.className = 'sp-print-root hidden fixed inset-0 z-[80] bg-[#FAF5EE] text-[#1D2B45] flex flex-col';
    document.body.appendChild(root);
    return root;
  }

  // Cached multi-view 3D architectural plates (defaults to 'status' Ghost + Emerald/Tangerine mode!)
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

  function renderStudio(initialTab) {
    const root = ensureModalRoot();
    const cfg = loadCfg();
    let activeTab = initialTab || 'overview'; // 'overview' | 'daily3page'
    // Capture live 4-view 3D Plan & Progress plates in high-contrast Status Mode by default!
    refreshMultiViews(reportViewMode);

    function buildLineSummary() {
      const st = computeDetailedStats();
      return [
        `📋 รายงานความคืบหน้างาน Sheet Pile & ขุดดิน — PYNN EKKAMAI 12`,
        `วันที่ ${formatThaiDate(cfg.date)} (${cfg.reportNo})`,
        ``,
        `1️⃣ งานกดชีตไพล์ (FSP-III 13.5m): ${st.sp.done}/${st.sp.total} แผ่น (${st.sp.pct}%) · ${st.sp.meters} / 56.8 ม.`,
        `   • เหนือ ${st.sp.sides.N.done}/${st.sp.sides.N.total} | ใต้ ${st.sp.sides.S.done}/${st.sp.sides.S.total} | ออก ${st.sp.sides.E.done}/${st.sp.sides.E.total} | ตก ${st.sp.sides.W.done}/${st.sp.sides.W.total}`,
        `2️⃣ งานติดตั้ง Waler / Strut & เทคอนกรีต Packing: ${st.bracing.pct}%`,
        `   • Waler H-350: ${st.bracing.walerDoneM}/${st.bracing.walerTotalM} ม. | Strut/Corner: ${st.bracing.strutDone}/6 ต้น`,
        `   • Packing Concrete: ${st.bracing.pcDoneM}/${st.bracing.pcTotalM} ม. (${st.bracing.pcDoneVol} ลบ.ม.) | Preload Jack: ${st.bracing.jackDone}/2 จุด`,
        `3️⃣ งานขุดดิน 4D: ระดับ EL. -${st.ex.depth.toFixed(2)} ม. · ปริมาตร ${st.ex.dugVol}/${st.ex.totalVol} ลบ.ม. (${st.ex.pct}%)`,
      ].join('\n');
    }

    function draw() {
      const s = computeDetailedStats();
      const dateFull = formatThaiDate(cfg.date);

      root.innerHTML = `
        <!-- Top Studio Bar (Hidden on Print) -->
        <div class="no-print shrink-0 bg-white border-b-2 border-[#1D2B45] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-[#FEF3C7] border-2 border-[#1D2B45] shadow-[2px_2px_0px_#1D2B45] flex items-center justify-center text-base">📊</div>
            <div>
              <div class="font-display text-sm font-black text-[#1D2B45] leading-tight">
                ศูนย์รายงานงานป้องกันดิน Sheet Pile &amp; Daily Report (PDF)
              </div>
              <div class="text-[11px] text-[#3E4B69] font-semibold">
                PYNN EKKAMAI 12 · 1. งานกดชีตไพล์ · 2. งาน Waler/Strut/Packing · 3. งานขุดดิน 4D
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <button id="sp-rep-tab-overview" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] font-display cursor-pointer ${
              activeTab === 'overview' ? 'bg-[#1D2B45] text-white shadow-[2px_2px_0px_#F26B2A]' : 'bg-white text-[#1D2B45] hover:bg-[#FAF5EE]'
            }">📈 หน้ารายงานสรุป 3 หมวด</button>

            <button id="sp-rep-tab-daily" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] font-display cursor-pointer ${
              activeTab === 'daily3page' ? 'bg-[#F26B2A] text-white shadow-[2px_2px_0px_#1D2B45]' : 'bg-white text-[#1D2B45] hover:bg-[#FFF7ED]'
            }">📄 Daily Report (PDF 3 หน้า)</button>

            <button id="sp-rep-copy-line" type="button" class="px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] bg-[#E8F8F5] text-[#0E5E57] hover:bg-[#D1FAE5] font-display cursor-pointer">
              📋 คัดลอก LINE
            </button>

            <button id="sp-rep-print-pdf" type="button" class="px-3.5 py-1.5 rounded-full text-xs font-extrabold border-2 border-[#1D2B45] bg-[#10B981] text-white hover:bg-[#059669] shadow-[2px_2px_0px_#1D2B45] font-display cursor-pointer">
              🖨️ พิมพ์ / บันทึก PDF (A4)
            </button>

            <button id="sp-rep-close" type="button" class="w-9 h-9 rounded-full border-2 border-[#1D2B45] bg-white hover:bg-[#FEE2E2] text-[#1D2B45] font-black text-sm cursor-pointer" title="ปิดหน้ารายงาน">✕</button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#EFECE6]">
          ${activeTab === 'overview' ? renderOverviewTab(s, dateFull) : renderDaily3PageTab(s, dateFull)}
        </div>
      `;

      // Bind events
      root.querySelector('#sp-rep-close').onclick = () => root.classList.add('hidden');
      root.querySelector('#sp-rep-tab-overview').onclick = () => { activeTab = 'overview'; draw(); };
      root.querySelector('#sp-rep-tab-daily').onclick = () => { activeTab = 'daily3page'; draw(); };
      root.querySelector('#sp-rep-print-pdf').onclick = () => window.print();
      const btnRecap = root.querySelector('#sp-rep-recapture-views');
      if (btnRecap) {
        btnRecap.onclick = () => {
          refreshMultiViews(reportViewMode);
          draw();
          getBridge()?.showToast?.('อัปเดตภาพ 4 มุมมองล่าสุดแล้ว');
        };
      }
      const btnModeStatus = root.querySelector('#sp-rep-mode-status');
      const btnModeSketchup = root.querySelector('#sp-rep-mode-sketchup');
      if (btnModeStatus) {
        btnModeStatus.onclick = () => {
          refreshMultiViews('status');
          draw();
        };
      }
      if (btnModeSketchup) {
        btnModeSketchup.onclick = () => {
          refreshMultiViews('sketchup');
          draw();
        };
      }
      root.querySelector('#sp-rep-copy-line').onclick = async () => {
        try {
          await navigator.clipboard.writeText(buildLineSummary());
          getBridge()?.showToast?.('คัดลอกรายงานสรุป 3 หมวดส่ง LINE แล้ว');
        } catch {
          getBridge()?.showToast?.('ไม่สามารถคัดลอกข้อความได้');
        }
      };

      if (activeTab === 'daily3page') {
        // Bind form inputs
        ['reportNo', 'date', 'weatherAm', 'weatherPm', 'manpower', 'equipment', 'workSummary', 'issuesNote', 'engineerName', 'inspectorName'].forEach((k) => {
          const el = root.querySelector(`[data-cfg="${k}"]`);
          if (!el) return;
          el.oninput = (e) => {
            cfg[k] = e.target.value;
            saveCfg(cfg);
            const target = root.querySelector(`[data-bind="${k}"]`);
            if (target) target.textContent = k === 'date' ? formatThaiDate(cfg[k]) : cfg[k];
          };
        });

        // Capture 3D snapshot into Photo Slot 1
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

        // Photo file upload inputs & caption edits
        photos.forEach((slot) => {
          const inp = root.querySelector(`#sp-photo-file-${slot.id}`);
          if (inp) {
            inp.onchange = (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const r = new FileReader();
              r.onload = () => { slot.dataUrl = r.result; draw(); };
              r.readAsDataURL(file);
            };
          }
          const del = root.querySelector(`#sp-photo-del-${slot.id}`);
          if (del) {
            del.onclick = () => { slot.dataUrl = ''; draw(); };
          }
          const cap = root.querySelector(`#sp-photo-cap-${slot.id}`);
          if (cap) {
            cap.oninput = (e) => { slot.caption = e.target.value; };
          }
        });
      }
    }

    function renderOverviewTab(s, dateFull) {
      const mv = cachedMultiViews || {};
      const viewOrder = ['top', 'iso', 'pit', 'side'];
      const hasViews = viewOrder.some((k) => mv[k]?.dataUrl);

      return `
        <div class="sp-a4-page max-w-[210mm] mx-auto bg-white border border-[#1D2B45] p-6 sm:p-8 space-y-4">
          <!-- Clean Architectural Header (No Rounded SaaS Cards!) -->
          <div class="flex items-start justify-between gap-4 border-b-2 border-[#1D2B45] pb-2.5">
            <div class="min-w-0">
              <img src="Logo/png/Sansiri-logo-en-black.png" alt="Sansiri" style="height:18px;width:auto;display:block;margin-bottom:6px;" onerror="this.style.display='none'" />
              <h2 class="font-display text-base font-black text-[#1D2B45]">รายงานผังความก้าวหน้างานป้องกันดิน Sheet Pile &amp; ขุดดิน 4D</h2>
              <p class="text-[11px] text-[#3E4B69] font-semibold">โครงการ PYNN EKKAMAI 12 (สุขุมวิท 63 · เอกมัย 12) · อัปเดต ณ วันที่ ${esc(dateFull)}</p>
            </div>
            <div class="text-right shrink-0 whitespace-nowrap">
              <div class="text-xs font-mono font-black text-[#1D2B45]">ERSS PROGRESS PLAN</div>
              <div class="text-[11px] font-mono text-[#3E4B69] mt-0.5">SP ${s.sp.done}/${s.sp.total} (${s.sp.pct}%) · EL.-${s.ex.depth.toFixed(2)} ม.</div>
            </div>
          </div>

          <!-- 4-View Live 3D Plan & Progress Plates (No Cards — Pure Engineering Drawing Plates) -->
          <div>
            <div class="flex items-center justify-between flex-wrap gap-2 border-b border-[#1D2B45] pb-1.5 mb-2.5">
              <h3 class="font-display text-xs font-black text-[#1D2B45] uppercase tracking-wider">
                ผังแปลนแสดงความก้าวหน้า &amp; มุมมองวิศวกรรม 3 มิติ (4 มุมมองหลัก)
              </h3>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="flex items-center gap-2 text-[10px] font-bold text-[#1D2B45] whitespace-nowrap">
                  <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#0284C7] border border-[#1D2B45]"></span>ทำวันนี้</span>
                  <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#10B981] border border-[#1D2B45]"></span>เสร็จสะสม</span>
                  <span class="inline-flex items-center gap-1"><span class="inline-block w-2.5 h-2.5 bg-[#F8FAFC] border border-[#334155]"></span>ยังไม่ทำ (ขาว-เทา)</span>
                </div>
                <div class="no-print inline-flex border border-[#1D2B45] bg-[#FAF5EE] text-[10px] font-bold">
                  <button id="sp-rep-mode-status" type="button" class="px-2 py-0.5 cursor-pointer ${reportViewMode === 'status' ? 'bg-[#1D2B45] text-white' : 'text-[#1D2B45] hover:bg-white'}">📊 สีสถานะ (ชัด)</button>
                  <button id="sp-rep-mode-sketchup" type="button" class="px-2 py-0.5 cursor-pointer border-l border-[#1D2B45] ${reportViewMode === 'sketchup' ? 'bg-[#1D2B45] text-white' : 'text-[#1D2B45] hover:bg-white'}">🎨 สี SketchUp</button>
                </div>
                <button id="sp-rep-recapture-views" type="button" class="no-print px-2 py-0.5 border border-[#1D2B45] bg-[#FAF5EE] hover:bg-[#FEF3C7] text-[10px] font-bold text-[#1D2B45] cursor-pointer whitespace-nowrap">
                  🔄 อัปเดตภาพ
                </button>
              </div>
            </div>

            ${hasViews ? `
              <div class="grid grid-cols-2 gap-2.5">
                ${viewOrder.map((key) => {
                  const v = mv[key];
                  if (!v) return '';
                  return `
                    <figure class="border border-[#1D2B45] bg-white m-0">
                      <div class="bg-[#FAF5EE] border-b border-[#1D2B45] px-2 py-1 text-[10px] font-mono font-bold text-[#1D2B45] truncate">
                        ${esc(v.label)}
                      </div>
                      <img src="${v.dataUrl}" alt="${esc(v.label)}" class="w-full aspect-[16/10] object-contain bg-white block" />
                    </figure>
                  `;
                }).join('')}
              </div>
            ` : `<div class="border border-[#1D2B45] p-6 text-center text-xs text-[#64748B]">กำลังเตรียมภาพ 4 มุมมองจากโมเดล 3D...</div>`}
          </div>

          <!-- Compact Hairline 3-Package Summary Strip (Pure Table, Zero Cards) -->
          <table class="w-full border-collapse border border-[#1D2B45] text-[11px]">
            <thead>
              <tr class="bg-[#1D2B45] text-white text-left">
                <th class="border border-[#1D2B45] px-2 py-1.5">หมวดงานหลัก (ERSS 3 Packages)</th>
                <th class="border border-[#1D2B45] px-2 py-1.5 text-right">ผลงานสะสม</th>
                <th class="border border-[#1D2B45] px-2 py-1.5 text-right">เป้าหมายตามแบบ</th>
                <th class="border border-[#1D2B45] px-2 py-1.5 text-right">% ก้าวหน้า</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">1. งานกด/ตอกชีตไพล์ (FSP-III 13.50 ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-bold text-[#065F46]">${s.sp.done} แผ่น (${s.sp.meters} ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono">${s.sp.total} แผ่น (56.8 ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-black">${s.sp.pct}%</td>
              </tr>
              <tr class="bg-[#FAF5EE]/60">
                <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">2. งานติดตั้ง Waler / Strut / Preload &amp; เท Packing Concrete</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono">Waler ${s.bracing.walerDoneM}ม. · Strut ${s.bracing.strutDone}/6 · PC ${s.bracing.pcDoneM}ม.</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono">54.48ม. · 6 ต้น · 54.82ม.</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-black">${s.bracing.pct}%</td>
              </tr>
              <tr>
                <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">3. งานขุดดิน 4D (EL. 0.00 → -3.80 ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-bold text-[#0284C7]">EL.-${s.ex.depth.toFixed(2)} ม. (${s.ex.dugVol} ลบ.ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono">EL.-3.80 ม. (${s.ex.totalVol} ลบ.ม.)</td>
                <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-black">${s.ex.pct}%</td>
              </tr>
            </tbody>
          </table>

          <!-- Package 1 Table -->
          <div>
            <h3 class="font-display text-xs font-black text-[#1D2B45] uppercase tracking-wider border-b-2 border-[#1D2B45] pb-1 mb-2">
              หมวดที่ 1 · งานกด/ตอกชีตไพล์ FSP-III ยาว 13.50 ม. (แยก 4 ด้าน)
            </h3>
            <table class="w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#FAF5EE] text-left">
                  <th class="border border-[#1D2B45] px-2.5 py-1.5">แนวกำแพง</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">จำนวนตามแบบ</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">กดแล้ว (แผ่น)</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ความยาวสะสม (ม.)</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">คงเหลือ</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">% สำเร็จ</th>
                </tr>
              </thead>
              <tbody>
                ${Object.values(s.sp.sides).map((side) => {
                  const pct = side.total ? Math.round((side.done / side.total) * 100) : 0;
                  return `<tr>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 font-bold">${esc(side.label)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${side.total}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold text-[#065F46]">${side.done}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${(side.done * 0.4).toFixed(1)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono text-[#E64C3C]">${side.total - side.done}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold">${pct}%</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Package 2 Table -->
          <div>
            <h3 class="font-display text-xs font-black text-[#1D2B45] uppercase tracking-wider border-b-2 border-[#1D2B45] pb-1 mb-2">
              หมวดที่ 2 · งานติดตั้งค้ำยัน Waler / Strut / Preload Jack &amp; เทคอนกรีต Packing Concrete
            </h3>
            <table class="w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#FAF5EE] text-left">
                  <th class="border border-[#1D2B45] px-2.5 py-1.5">รายการงานโครงสร้างค้ำยัน</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ปริมาณตามแบบ</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ผลงานสะสม</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${s.bracing.walerRows.map((w) => `
                  <tr>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">${esc(w.label)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${w.len.toFixed(2)} ม.</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${w.status === 'done' ? w.len.toFixed(2) : '0.00'} ม.</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-center">${statusBadgeHtml(w.status)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">ค้ำยัน Strut &amp; Corner Brace (H-350)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">6 ต้น</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold">${s.bracing.strutDone}/6 ต้น</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-center">${statusBadgeHtml(s.bracing.strutDone === 6 ? 'done' : s.bracing.strutDone > 0 ? 'progress' : 'pending')}</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">เหล็กยึด Bracket (H-200BL · 20 ชุด)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">20 ชุด</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${s.bracing.bkStatus === 'done' ? '20/20 ชุด' : '0/20 ชุด'}</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-center">${statusBadgeHtml(s.bracing.bkStatus)}</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">เทคอนกรีตอุดช่องว่าง (Packing Concrete)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${s.bracing.pcTotalM} ม. (${s.bracing.pcTotalVol} ม³)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold">${s.bracing.pcDoneM} ม. (${s.bracing.pcDoneVol} ม³)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-center">${statusBadgeHtml(s.bracing.pcDoneCount >= s.bracing.pcTotalCount ? 'done' : s.bracing.pcDoneCount > 0 ? 'progress' : 'pending')}</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">อัดแรง Preload Hydraulic Jack (UJ-N40)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">2 จุด (80 ตัน)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${s.bracing.jackDone}/2 จุด (${s.bracing.jackTons} ตัน)</td>
                  <td class="border border-[#1D2B45] px-2.5 py-1.5 text-center">${statusBadgeHtml(s.bracing.jackDone === 2 ? 'done' : s.bracing.jackDone > 0 ? 'progress' : 'pending')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Package 3 Table -->
          <div>
            <h3 class="font-display text-xs font-black text-[#1D2B45] uppercase tracking-wider border-b-2 border-[#1D2B45] pb-1 mb-2">
              หมวดที่ 3 · งานขุดดิน 4D (บ่อขนาด 18.80 × 8.80 × ลึก 3.80 ม. · รวม 628.67 ลบ.ม.)
            </h3>
            <table class="w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#FAF5EE] text-left">
                  <th class="border border-[#1D2B45] px-2.5 py-1.5">ลำดับชั้นขุดดิน (Excavation Stage)</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ปริมาตรตามแบบ (ลบ.ม.)</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">ขุดแล้ว (ลบ.ม.)</th>
                  <th class="border border-[#1D2B45] px-2.5 py-1.5 text-right">% สำเร็จ</th>
                </tr>
              </thead>
              <tbody>
                ${s.ex.stages.map((st) => `
                  <tr>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 font-semibold">${esc(st.name)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono">${st.vol.toFixed(2)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold text-[#0284C7]">${st.dugVol.toFixed(2)}</td>
                    <td class="border border-[#1D2B45] px-2.5 py-1.5 text-right font-mono font-bold">${st.pct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    function renderDaily3PageTab(s, dateFull) {
      return `
        <div class="max-w-[210mm] mx-auto space-y-6">
          <!-- Editor Controls (No Print) -->
          <div class="no-print bg-white border-2 border-[#1D2B45] rounded-2xl shadow-[3px_3px_0px_#1D2B45] p-4">
            <div class="flex items-center justify-between border-b border-[#E2D9CC] pb-2 mb-3">
              <span class="font-display text-xs font-black text-[#F26B2A]">✏️ กรอกข้อมูล Daily Report ประจำวัน (อัปเดตลงหน้า A4 ทันที)</span>
              <button id="sp-cap-3d-photo1" type="button" class="px-2.5 py-1 rounded-full bg-[#E0F2FE] border-1.5 border-[#1D2B45] text-[#0369A1] text-[11px] font-bold cursor-pointer hover:bg-[#BAE6FD]">
                📸 ดึงภาพ 3D ปัจจุบันใส่หน้า 3
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <label class="font-bold text-[#3E4B69]">เลขที่รายงาน<input data-cfg="reportNo" value="${esc(cfg.reportNo)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs font-mono text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69]">วันที่รายงาน<input type="date" data-cfg="date" value="${esc(cfg.date)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs font-mono text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69]">สภาพอากาศ (เช้า)<input data-cfg="weatherAm" value="${esc(cfg.weatherAm)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69]">สภาพอากาศ (บ่าย)<input data-cfg="weatherPm" value="${esc(cfg.weatherPm)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69] sm:col-span-2">กำลังคนหน้างาน<input data-cfg="manpower" value="${esc(cfg.manpower)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69] sm:col-span-2">เครื่องจักรหลัก<input data-cfg="equipment" value="${esc(cfg.equipment)}" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]" /></label>
              <label class="font-bold text-[#3E4B69] sm:col-span-2">สรุปงานที่ทำวันนี้<textarea rows="2" data-cfg="workSummary" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]">${esc(cfg.workSummary)}</textarea></label>
              <label class="font-bold text-[#3E4B69] sm:col-span-2">ปัญหา / อุปสรรค / QC<textarea rows="2" data-cfg="issuesNote" class="mt-1 w-full border-1.5 border-[#1D2B45] rounded-lg px-2 py-1 text-xs text-[#1D2B45]">${esc(cfg.issuesNote)}</textarea></label>
            </div>
          </div>

          <!-- PAGE 1: OFFICIAL SANSIRI DAILY REPORT (SHEET PILE & EXCAVATION) -->
          <article class="sp-a4-page bg-white border border-[#1D2B45] p-6 sm:p-8 shadow-sm">
            <div class="flex items-start justify-between border-b-2 border-[#1D2B45] pb-3">
              <div>
                <img src="Logo/png/Sansiri-logo-en-black.png" alt="Sansiri" class="h-5 w-auto mb-1.5" onerror="this.style.display='none'" />
                <h1 class="font-display text-base font-black text-[#1D2B45]">DAILY CONSTRUCTION REPORT · งานป้องกันดิน Sheet Pile &amp; ขุดดิน</h1>
                <p class="text-xs text-[#3E4B69]">โครงการ PYNN EKKAMAI 12 (ซอยสุขุมวิท 63 · เอกมัย 12)</p>
              </div>
              <div class="text-right text-xs">
                <div class="font-mono font-black text-[#F26B2A]">NO: <span data-bind="reportNo">${esc(cfg.reportNo)}</span></div>
                <div class="font-bold text-[#1D2B45]">วันที่: <span data-bind="date">${esc(dateFull)}</span></div>
                <div class="text-[10px] text-[#64748B]">หน้า 1 / 3</div>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-2 gap-3 text-xs">
              <div class="border border-[#1D2B45] p-2.5">
                <div class="font-bold text-[#3E4B69]">สภาพอากาศ (Weather)</div>
                <div class="mt-1">เช้า: <span data-bind="weatherAm">${esc(cfg.weatherAm)}</span></div>
                <div>บ่าย: <span data-bind="weatherPm">${esc(cfg.weatherPm)}</span></div>
              </div>
              <div class="border border-[#1D2B45] p-2.5">
                <div class="font-bold text-[#3E4B69]">กำลังคน &amp; เครื่องจักร</div>
                <div class="mt-1">คนงาน: <span data-bind="manpower">${esc(cfg.manpower)}</span></div>
                <div>เครื่องจักร: <span data-bind="equipment">${esc(cfg.equipment)}</span></div>
              </div>
            </div>

            <h3 class="mt-4 font-display text-xs font-black border-b border-[#1D2B45] pb-1">1. สรุปผลงานสะสมทั้ง 3 หมวดงานหลัก (ERSS &amp; Excavation)</h3>
            <table class="mt-2 w-full border-collapse border border-[#1D2B45] text-xs">
              <thead>
                <tr class="bg-[#FAF5EE] text-left">
                  <th class="border border-[#1D2B45] px-2 py-1.5">หมวดงาน</th>
                  <th class="border border-[#1D2B45] px-2 py-1.5">ผลงานสะสม</th>
                  <th class="border border-[#1D2B45] px-2 py-1.5">รายละเอียดปริมาณ</th>
                  <th class="border border-[#1D2B45] px-2 py-1.5 text-right">% สำเร็จ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">1. งานกดชีตไพล์ (FSP-III 13.5m)</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">${s.sp.done} / ${s.sp.total} แผ่น</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">${s.sp.meters} / 56.8 ม.</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-bold text-[#065F46]">${s.sp.pct}%</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">2. งานติดตั้ง Waler / Strut &amp; เท Packing</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">Waler ${s.bracing.walerDoneM} ม. · Strut ${s.bracing.strutDone}/6</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">Packing ${s.bracing.pcDoneM} ม. (${s.bracing.pcDoneVol} ม³) · Jack ${s.bracing.jackDone}/2</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-bold text-[#9A3412]">${s.bracing.pct}%</td>
                </tr>
                <tr>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-bold">3. งานขุดดิน 4D (EL. 0.00 → -3.80 ม.)</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">ระดับ EL. -${s.ex.depth.toFixed(2)} ม.</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 font-mono">${s.ex.dugVol} / ${s.ex.totalVol} ลบ.ม.</td>
                  <td class="border border-[#1D2B45] px-2 py-1.5 text-right font-mono font-bold text-[#0284C7]">${s.ex.pct}%</td>
                </tr>
              </tbody>
            </table>

            <h3 class="mt-4 font-display text-xs font-black border-b border-[#1D2B45] pb-1">2. รายละเอียดงานประจำวันและบันทึกความปลอดภัย / QC</h3>
            <div class="mt-2 space-y-2 text-xs">
              <div class="border border-[#1D2B45] p-2.5">
                <div class="font-bold text-[#3E4B69]">งานที่ดำเนินการวันนี้:</div>
                <div data-bind="workSummary" class="mt-1 whitespace-pre-wrap">${esc(cfg.workSummary)}</div>
              </div>
              <div class="border border-[#1D2B45] p-2.5">
                <div class="font-bold text-[#3E4B69]">ปัญหา / อุปสรรค / การตรวจวัดการเคลื่อนตัว:</div>
                <div data-bind="issuesNote" class="mt-1 whitespace-pre-wrap">${esc(cfg.issuesNote)}</div>
              </div>
            </div>

            <div class="mt-10 grid grid-cols-2 gap-8 pt-6 text-center text-xs">
              <div>
                <div class="mx-auto w-52 border-b border-[#1D2B45] pb-6"></div>
                <div class="mt-1.5 font-bold" data-bind="engineerName">${esc(cfg.engineerName)}</div>
                <div class="text-[10px] text-[#64748B]">ผู้จัดทำรายงาน</div>
              </div>
              <div>
                <div class="mx-auto w-52 border-b border-[#1D2B45] pb-6"></div>
                <div class="mt-1.5 font-bold" data-bind="inspectorName">${esc(cfg.inspectorName)}</div>
                <div class="text-[10px] text-[#64748B]">ผู้ตรวจสอบ / รับรองรายงาน</div>
              </div>
            </div>
          </article>

          <!-- PAGE 2: 3-PACKAGE ENGINEERING LEDGER & DAILY LOGS -->
          <article class="sp-a4-page bg-white border border-[#1D2B45] p-6 sm:p-8 shadow-sm space-y-4">
            <div class="flex items-baseline justify-between border-b-2 border-[#1D2B45] pb-2">
              <div>
                <h2 class="font-display text-sm font-black">ตารางรายละเอียดผลงาน 3 หมวดงาน &amp; บันทึกประจำวัน (Daily Ledger)</h2>
                <p class="text-xs text-[#3E4B69]">PYNN EKKAMAI 12 · วันที่ ${esc(dateFull)}</p>
              </div>
              <span class="text-[10px] text-[#64748B]">หน้า 2 / 3</span>
            </div>

            ${renderOverviewTab(s, dateFull).replace(/<div class="sp-a4-page[^>]*>|<\/div>\s*$/g, '').replace(/<div class="flex items-start justify-between border-b-2[\s\S]*?<\/div>\s*<!-- 3 Work Package/, '<!-- 3 Work Package')}

            <div>
              <h3 class="font-display text-xs font-black border-b-2 border-[#1D2B45] pb-1 mb-2">ประวัติบันทึกผลงานรายวัน (${s.logs.length} รายการ)</h3>
              <table class="w-full border-collapse border border-[#1D2B45] text-[11px]">
                <thead>
                  <tr class="bg-[#FAF5EE] text-left">
                    <th class="border border-[#1D2B45] px-2 py-1">วันที่</th>
                    <th class="border border-[#1D2B45] px-2 py-1 text-right">ชีตไพล์ (แผ่น)</th>
                    <th class="border border-[#1D2B45] px-2 py-1 text-right">ระดับขุดดิน</th>
                    <th class="border border-[#1D2B45] px-2 py-1 text-right">Packing (ม.)</th>
                    <th class="border border-[#1D2B45] px-2 py-1">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  ${s.logs.length ? s.logs.map((l) => `
                    <tr>
                      <td class="border border-[#1D2B45] px-2 py-1 font-mono">${esc(l.date)}</td>
                      <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">${l.spDone}</td>
                      <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">EL.-${Math.abs(Number(l.depth) || 0).toFixed(2)}</td>
                      <td class="border border-[#1D2B45] px-2 py-1 text-right font-mono">${Number(l.pcM || 0).toFixed(1)}</td>
                      <td class="border border-[#1D2B45] px-2 py-1">${esc(l.note || '—')}</td>
                    </tr>
                  `).join('') : `<tr><td colspan="5" class="border border-[#1D2B45] px-2 py-2.5 text-center text-[#64748B]">ยังไม่มีบันทึกประวัติรายวัน (กดปุ่ม “บันทึกผลงาน” เพื่อเพิ่มบันทึกประจำวัน)</td></tr>`}
                </tbody>
              </table>
            </div>
          </article>

          <!-- PAGE 3: SITE PHOTO SHEET (6 PHOTOS) -->
          <article class="sp-a4-page bg-white border border-[#1D2B45] p-6 sm:p-8 shadow-sm">
            <div class="flex items-baseline justify-between border-b-2 border-[#1D2B45] pb-2">
              <div>
                <h2 class="font-display text-sm font-black">SITE PHOTO SHEET · แผ่นภาพถ่ายหน้างาน Sheet Pile &amp; ขุดดิน (6 ภาพ)</h2>
                <p class="text-xs text-[#3E4B69]">PYNN EKKAMAI 12 · วันที่ ${esc(dateFull)}</p>
              </div>
              <span class="text-[10px] text-[#64748B]">หน้า 3 / 3</span>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3.5">
              ${photos.map((slot) => `
                <div class="border border-[#1D2B45] p-2">
                  <div class="relative h-44 bg-[#FAF5EE] flex items-center justify-center overflow-hidden">
                    ${slot.dataUrl ? `
                      <img src="${slot.dataUrl}" alt="${esc(slot.caption)}" class="w-full h-full object-cover" />
                      <button id="sp-photo-del-${slot.id}" type="button" class="no-print absolute top-1.5 right-1.5 bg-white border border-[#1D2B45] rounded px-1.5 py-0.5 text-[10px] font-bold text-[#E64C3C] cursor-pointer">ลบ</button>
                    ` : `
                      <label class="no-print cursor-pointer flex flex-col items-center gap-1 text-xs font-bold text-[#3E4B69] hover:text-[#F26B2A]">
                        <span>📷 คลิกอัปโหลดภาพที่ ${slot.id}</span>
                        <input id="sp-photo-file-${slot.id}" type="file" accept="image/*" class="hidden" />
                      </label>
                    `}
                  </div>
                  <input id="sp-photo-cap-${slot.id}" type="text" value="${esc(slot.caption)}" class="mt-1.5 w-full border-b border-[#CBD5E1] text-center text-[11px] font-semibold text-[#1D2B45] bg-transparent focus:outline-none" />
                </div>
              `).join('')}
            </div>
          </article>
        </div>
      `;
    }

    draw();
    root.classList.remove('hidden');
  }

  window.openSheetPileReportStudio = function (tab) {
    renderStudio(tab || 'overview');
  };
})();
