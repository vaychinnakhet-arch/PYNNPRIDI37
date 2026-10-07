# encoding: UTF-8
require 'json'
require 'base64'
require 'fileutils'

dir = File.dirname(__FILE__)
glb_path = File.join(dir, "model.glb")
meta_path = File.join(dir, "piles_metadata.json")
out_html = File.join(dir, "index.html")

unless File.exist?(glb_path)
  puts "ERROR: model.glb not found at #{glb_path}"
  exit 1
end

b64_glb = Base64.strict_encode64(File.binread(glb_path))
piles_json = File.exist?(meta_path) ? File.read(meta_path, encoding: 'UTF-8') : "[]"

html = <<~'HTML_PAGE'
<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>PYNN PRIDI 37 - Piling Progress Tracker & Report (Soft Ink Flat-Pop)</title>
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Sarabun:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>

  <style>
    :root {
      --fp-paper: #fffdf8;
      --fp-bg: #eef7f4;
      --fp-ink: #34383b;
      --fp-muted: #667277;
      --fp-line: #475569;
      --fp-blue: #7dbbd0;
      --fp-blue-soft: #dff1f5;
      --fp-green: #98cfad;
      --fp-green-soft: #e5f4e9;
      --fp-green-bold: #10b981;
      --fp-yellow: #ffc45b;
      --fp-yellow-soft: #fff0c8;
      --fp-coral: #ed6845;
      --fp-shadow: #c9dfd9;
    }

    body {
      margin: 0;
      overflow: hidden;
      background: var(--fp-bg);
      color: var(--fp-ink);
      font-family: 'Sarabun', sans-serif;
      user-select: none;
      -webkit-user-select: none;
    }

    #viewport {
      width: 100vw;
      height: 100vh;
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .pop-card {
      background: var(--fp-paper);
      border: 2px solid var(--fp-line);
      border-radius: 12px;
      box-shadow: 3px 4px 0 var(--fp-shadow);
    }

    .pop-header {
      background: var(--fp-yellow);
      border: 2px solid var(--fp-line);
      border-radius: 12px;
      box-shadow: 3px 3px 0 #475569;
    }

    .pop-btn {
      background: #f4ece7;
      color: var(--fp-ink);
      border: 1.5px solid var(--fp-line);
      border-radius: 8px;
      box-shadow: 2px 2px 0 var(--fp-shadow);
      font-weight: 700;
      transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.08s ease;
      cursor: pointer;
    }
    .pop-btn:hover {
      background: var(--fp-yellow-soft);
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 var(--fp-shadow);
    }
    .pop-btn:active {
      transform: translate(1.5px, 1.5px);
      box-shadow: 0 0 0 transparent;
    }
    .pop-btn.active {
      background: var(--fp-green);
      box-shadow: 2px 2px 0 #475569;
      color: #1e3a29;
    }
    .pop-btn-primary {
      background: var(--fp-coral);
      color: #fffaf7;
      border: 1.8px solid var(--fp-line);
      border-radius: 9px;
      box-shadow: 2.5px 2.5px 0 #9c3b23;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.08s ease, box-shadow 0.08s ease;
    }
    .pop-btn-primary:hover {
      background: #dc5b3a;
      transform: translate(-1px, -1px);
      box-shadow: 3.5px 3.5px 0 #9c3b23;
    }
    .pop-btn-primary:active {
      transform: translate(2px, 2px);
      box-shadow: 0 0 0 transparent;
    }

    .pop-btn-green {
      background: #10b981;
      color: white;
      border: 1.8px solid #064e3b;
      border-radius: 9px;
      box-shadow: 2px 2px 0 #064e3b;
      font-weight: 800;
      cursor: pointer;
    }
    .pop-btn-green:hover {
      background: #059669;
      transform: translate(-1px, -1px);
      box-shadow: 3px 3px 0 #064e3b;
    }

    .palette-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      border: 1px solid var(--fp-line);
      display: inline-block;
    }

    .modal-backdrop {
      background: rgba(30, 41, 59, 0.55);
      backdrop-filter: blur(4px);
    }

    /* Print Styles for Official Executive Progress Report Sheet */
    @media print {
      body {
        overflow: visible !important;
        background: white !important;
      }
      #viewport, header, .floating-hud, footer, #pile-card, #modal-scurve, #modal-cotable, #modal-quick-select {
        display: none !important;
      }
      #report-page {
        position: static !important;
        display: block !important;
        width: 100% !important;
        padding: 0 !important;
        background: white !important;
        box-shadow: none !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
      }
    }

    /* Dynamic Landscape Layout for Report Sheet (แนวนอน ไร้ขอบว่าง) */
    #report-page-card.is-landscape {
      max-width: 1420px !important;
      width: 96vw !important;
    }
    #report-page-card.is-landscape #report-main-grid {
      display: grid !important;
      grid-template-columns: 1.18fr 0.82fr !important;
      gap: 1.25rem !important;
      align-items: stretch !important;
    }
    #report-page-card.is-landscape #report-col-plan {
      height: 100% !important;
    }
    #report-page-card.is-landscape #report-sec-plan {
      height: 100% !important;
      display: flex !important;
      flex-direction: column !important;
    }
    #report-page-card.is-landscape #planSnapshotCanvasWrapper {
      flex: 1 !important;
      min-height: 520px !important;
      height: 540px !important;
    }
    #report-page-card.is-landscape #planSnapshotCanvasWrapper > div {
      height: 100% !important;
      min-height: 490px !important;
    }
    #report-page-card.is-landscape #report-col-side {
      display: flex !important;
      flex-direction: column !important;
      gap: 1.25rem !important;
      height: 100% !important;
      justify-content: space-between !important;
    }
    #report-page-card.is-landscape #report-sec-scurve .chart-wrapper {
      height: 220px !important;
    }
    #report-page-card.is-landscape #report-sec-table .table-wrapper {
      max-height: 240px !important;
    }
  </style>

  <script type="importmap">
    {
      "imports": {
        "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
        "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
      }
    }
  </script>
</head>
<body>

  <!-- 3D WebGL Canvas Container -->
  <div id="viewport"></div>

  <!-- Loading Screen -->
  <div id="loading-overlay" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#eef7f4]/95 backdrop-blur-sm transition-opacity duration-400">
    <div class="w-14 h-14 border-4 border-[#cfe5df] border-t-[#ed6845] rounded-full animate-spin mb-3"></div>
    <h2 class="text-lg font-extrabold font-montserrat text-[#34383b]">
      <span class="text-[#ed6845]">P</span>YNN PRIDI 37 PILING TRACKER
    </h2>
    <p id="loading-text" class="text-xs text-[#667277] mt-1 font-semibold">กำลังโหลดแปลนเสาเข็ม 93 ต้น...</p>
    <div class="w-56 h-2.5 bg-white border border-[#475569] rounded-full mt-3 overflow-hidden shadow-[2px_2px_0_#c9dfd9]">
      <div id="loading-bar" class="h-full bg-[#10b981] w-0 transition-all duration-200"></div>
    </div>
  </div>

  <!-- Top Bar: Brand, Stats & Quick Access Buttons -->
  <!-- Top Bar: Single Unified Responsive Executive Navbar -->
  <header class="absolute top-2 left-2 right-2 z-30 pointer-events-none">
    <div class="pop-header px-3 py-1.5 pointer-events-auto flex flex-wrap xl:flex-nowrap items-center justify-between gap-2 shadow-[3px_3px_0_#475569]">
      
      <!-- Left: Brand & Project Info -->
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-[#ed6845] text-white border-2 border-[#475569] flex items-center justify-center font-montserrat font-black text-xs shadow-[1px_1px_0_#475569]">
          P37
        </div>
        <div>
          <div class="flex items-center gap-1.5">
            <h1 class="text-xs font-black font-montserrat tracking-tight text-[#34383b]">
              PYNN PRIDI 37
            </h1>
            <span class="text-[9px] font-black px-1.5 py-0.5 rounded bg-white border border-[#475569] text-[#ed6845]">
              93 ต้น
            </span>
          </div>
          <p class="text-[9.5px] text-[#555d61] font-bold leading-none hidden sm:block">แผนงานเสาเข็ม 3 ต้น/วัน</p>
        </div>
      </div>

      <!-- Center: Key Metrics & Date Selector -->
      <div class="flex items-center gap-2 text-xs bg-white/70 px-2 py-1 rounded-lg border border-[#475569]/30">
        <!-- Cumulative Metric -->
        <div class="flex items-center gap-1.5 pr-2 border-r border-[#475569]/20">
          <span class="w-2 h-2 rounded-full bg-[#10b981]"></span>
          <span class="text-[10px] text-[#667277] font-bold hidden sm:inline">ตอกสะสม:</span>
          <span class="text-xs font-black text-[#34383b]">
            <span id="stat-driven-count" class="text-[#10b981]">0</span>/93
            <span id="stat-driven-pct" class="text-[10px] text-[#667277] font-bold">(0%)</span>
          </span>
        </div>

        <!-- Date & Today's Metric -->
        <div class="flex items-center gap-1.5 pr-2 border-r border-[#475569]/20">
          <input id="inp-report-date" type="date" class="text-[10px] bg-white border border-[#475569] rounded px-1 py-0.5 font-bold text-[#34383b] focus:outline-none">
          <span class="text-[10px] text-[#667277] font-bold hidden sm:inline">กดวันนี้:</span>
          <span class="text-xs font-black text-[#34383b]">
            <span id="stat-today-count" class="text-[#0284c7]">0</span> ต้น
          </span>
        </div>

        <!-- Remaining Pill -->
        <div class="flex items-center gap-1 text-[10px] font-bold text-[#667277]">
          <span>คงเหลือ:</span>
          <span id="stat-remain-count" class="text-xs font-black text-[#34383b]">93</span>
        </div>
      </div>

      <!-- Right: Action Buttons (Grouped & Compact) -->
      <div class="flex items-center gap-1.5">
        <button id="btn-quick-select" class="pop-btn-green px-2.5 py-1 text-xs flex items-center gap-1 shadow-[1.5px_1.5px_0_#064e3b]" title="ระบุต้นที่ตอกด่วน">
          <i data-lucide="check-square" class="w-3.5 h-3.5"></i>
          <span class="hidden md:inline font-bold">ระบุต้นที่ตอก</span>
        </button>

        <button id="btn-open-report" class="pop-btn-primary px-2.5 py-1 text-xs flex items-center gap-1 shadow-[1.5px_1.5px_0_#9c3b23]" title="หน้ารายงานความคืบหน้า">
          <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
          <span class="font-bold">หน้ารายงาน</span>
        </button>

        <button id="btn-open-export" class="pop-btn px-2 py-1 text-xs flex items-center gap-1 shadow-[1.5px_1.5px_0_#475569]" style="background:#fff0c8;" title="ส่งออกภาพรายงาน PNG">
          <i data-lucide="camera" class="w-3.5 h-3.5 text-[#ed6845]"></i>
          <span class="hidden sm:inline font-bold">ส่งออกภาพ</span>
        </button>

        <button id="btn-open-cotable" class="pop-btn px-2 py-1 text-xs flex items-center gap-1" style="background:#dff1f5;" title="ตารางระดับตัดหัวเข็ม CO">
          <i data-lucide="table" class="w-3.5 h-3.5 text-[#34383b]"></i>
          <span class="hidden lg:inline font-bold">ตาราง CO</span>
        </button>

        <button id="btn-reset-view" title="รีเซ็ตมุมมอง Top View" class="pop-btn p-1">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
        </button>

        <button id="btn-fullscreen" title="เต็มจอ" class="pop-btn p-1">
          <i data-lucide="maximize" class="w-3.5 h-3.5"></i>
        </button>
      </div>

    </div>
  </header>

  <!-- Left Floating Toolbar: Views & Pile Filters -->
  <div class="floating-hud absolute left-2 top-14 z-20 flex flex-col gap-1.5 pointer-events-auto">
    
    <!-- Views Card -->
    <div class="pop-card p-2 flex flex-col gap-1">
      <span class="text-[9.5px] text-[#667277] font-black px-1 uppercase tracking-wider">มุมมอง (Views)</span>
      <button id="view-top-ortho" class="pop-btn active px-2.5 py-1.5 text-xs flex items-center gap-2">
        <i data-lucide="layout-grid" class="w-3.5 h-3.5 text-[#1e3a29]"></i> แปลน Top View (2D)
      </button>
      <button id="view-iso3d" class="pop-btn px-2.5 py-1.5 text-xs flex items-center gap-2">
        <i data-lucide="box" class="w-3.5 h-3.5"></i> 3D สามมิติ (Iso)
      </button>
      <!-- Sub-controls for 3D View Angles -->
      <div id="sub-views-3d" class="hidden flex flex-col gap-1 pt-1.5 border-t border-[#475569]/20">
        <span class="text-[9px] font-bold text-[#667277]">ปรับมุมมอง 3D:</span>
        <div class="grid grid-cols-2 gap-1 text-[10px]">
          <button id="btn-view-front" class="pop-btn py-1 text-center font-bold" title="มองจากด้านหน้า ทิศใต้">
            หน้า (S)
          </button>
          <button id="btn-view-side" class="pop-btn py-1 text-center font-bold" title="มองจากด้านข้าง ทิศตะวันตก">
            ข้าง (W)
          </button>
        </div>
        <button id="btn-view-focus-center" class="pop-btn py-1 text-[10px] flex items-center justify-center gap-1 font-bold">
          <i data-lucide="target" class="w-3 h-3 text-[#ed6845]"></i> เล็งกึ่งกลางไซต์
        </button>
      </div>
    </div>

    <!-- Pile Filter Card -->
    <div class="pop-card p-2 flex flex-col gap-1">
      <span class="text-[9.5px] text-[#667277] font-black px-1 uppercase tracking-wider">กรองแสดงเข็ม</span>
      <button id="filter-all" class="pop-btn active px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
        <span class="flex items-center gap-1.5">
          <i data-lucide="layers" class="w-3.5 h-3.5"></i> ทั้งหมด
        </span>
        <span class="font-black px-1 py-0.2 rounded bg-white border border-[#475569] text-[10px]">93</span>
      </button>
      <button id="filter-driven" class="pop-btn px-2.5 py-1.5 text-xs flex items-center justify-between gap-2" style="background:#e5f4e9;">
        <span class="flex items-center gap-1.5 text-[#1e3a29]">
          <span class="w-2.5 h-2.5 rounded-full bg-[#10b981] border border-[#064e3b]"></span> ตอกแล้ว (เด่นชัด)
        </span>
        <span id="badge-driven" class="font-black px-1 py-0.2 rounded bg-white border border-[#475569] text-[10px]">0</span>
      </button>
      <button id="filter-pending" class="pop-btn px-2.5 py-1.5 text-xs flex items-center justify-between gap-2">
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-[#cbd5e1] border border-[#475569]"></span> ยังไม่ตอก
        </span>
        <span id="badge-pending" class="font-black px-1 py-0.2 rounded bg-white border border-[#475569] text-[10px]">93</span>
      </button>
    </div>

    <!-- Layer Toggles -->
    <div class="pop-card p-2 flex flex-col gap-1">
      <span class="text-[9.5px] text-[#667277] font-black px-1 uppercase tracking-wider">เลเยอร์แผนผัง</span>
      <label class="flex items-center gap-1.5 text-[11px] font-bold text-[#34383b] cursor-pointer px-1">
        <input id="layer-grid" type="checkbox" checked class="accent-[#ed6845]">
        <span>กริด & มิติ (Grid Lines)</span>
      </label>
      <label class="flex items-center gap-1.5 text-[11px] font-bold text-[#34383b] cursor-pointer px-1">
        <input id="layer-boundary" type="checkbox" checked class="accent-[#ed6845]">
        <span>แนวเขตที่ดิน (Boundary)</span>
      </label>
      <label class="flex items-center gap-1.5 text-[11px] font-bold text-[#34383b] cursor-pointer px-1">
        <input id="layer-hex" type="checkbox" class="accent-[#ed6845]">
        <span>เข็มถังบำบัด & ผนัง (137 ต้น)</span>
      </label>
    </div>

  </div>

  <!-- Bottom Helper Bar & Compass -->
  <footer class="absolute bottom-3 left-3 z-20 pointer-events-none flex items-center gap-2">
    <!-- 3D North Compass Widget -->
    <div id="compass-widget" class="pop-card p-1.5 flex items-center justify-center bg-white pointer-events-auto cursor-pointer shadow-md hover:bg-[#fff0c8] transition-colors" title="ทิศเหนือ (N) คลิกเพื่อปรับมุมมองหันตรงทิศเหนือ">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <svg id="compass-needle" class="w-7 h-7 transition-transform duration-100 ease-out" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="#f8fafc" stroke="#475569" stroke-width="1.5" />
          <path d="M18 5 L22 18 L18 15 L14 18 Z" fill="#ef4444" />
          <path d="M18 31 L22 18 L18 15 L14 18 Z" fill="#94a3b8" />
          <text x="18" y="11" font-size="6.5" font-weight="900" fill="#ffffff" text-anchor="middle">N</text>
        </svg>
      </div>
    </div>

    <div class="pop-card px-3 py-1.5 text-[11px] font-bold flex flex-wrap items-center gap-3 pointer-events-auto bg-white border-2 border-[#475569] shadow-[2px_2px_0_#475569]">
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 rounded-full bg-[#0284c7] border-2 border-[#0369a1] shadow-[0_0_8px_#00f0ff]"></span>
        <span class="font-black text-[#0369a1]">กดวันนี้ (สีฟ้าเรืองแสง)</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 rounded-full bg-[#10b981] border border-[#064e3b]"></span>
        <span>กดวันก่อน (สีเขียว)</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 rounded-full bg-[#e2e8f0] border border-[#64748b]"></span>
        <span class="text-[#64748b]">ยังไม่ตอก (สีเทา)</span>
      </span>
      <span id="nav-hint-text" class="text-[#475569] border-l border-[#475569]/30 pl-2">
        🖱️ <strong>คลิกซ้ายลาก:</strong> เลื่อนแปลน (Pan) | <strong>ล้อเลื่อน:</strong> ซูม | <strong>คลิกต้นเข็ม:</strong> ลงผลงาน
      </span>
    </div>
  </footer>

  <!-- ========================================================================= -->
  <!-- MODAL: QUICK PILE SELECTOR (การระบุต้นที่กด ของ่ายๆ 1-93) -->
  <!-- ========================================================================= -->
  <div id="modal-quick-select" class="fixed inset-0 z-40 modal-backdrop flex items-center justify-center p-3 hidden">
    <div class="pop-card w-full max-w-3xl p-4 bg-[#fffdf8] max-h-[92vh] flex flex-col">
      
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-[#475569] pb-3 mb-3">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-[#98cfad] border-2 border-[#475569] flex items-center justify-center text-[#1e3a29] shadow-[1.5px_1.5px_0_#475569]">
            <i data-lucide="check-square" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-sm font-black text-[#34383b]">แผงระบุเสาเข็มที่ตอก (Quick Pile Selector 1-93)</h3>
            <p class="text-[11px] text-[#667277] font-semibold">คลิกที่ปุ่มเบอร์เข็มเพื่อสลับสถานะ "ตอกแล้ว / ยังไม่ตอก" ได้ทันที</p>
          </div>
        </div>

        <button id="btn-close-quick-select" class="pop-btn p-1.5">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Quick Batch Actions Strip -->
      <div class="p-2.5 rounded-xl bg-[#fff0c8] border-[1.5px] border-[#475569] flex flex-wrap items-center justify-between gap-2 mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-black text-[#a84631]">คำสั่งด่วน:</span>
          <button id="btn-drive-next-3" class="pop-btn-green px-2.5 py-1 text-xs flex items-center gap-1 shadow-[1.5px_1.5px_0_#064e3b]">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> ตอก 3 ต้นถัดไป (ตามเป้าวันนี้)
          </button>
        </div>

        <!-- Range Input: e.g. 1-24 -->
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-bold text-[#34383b]">ระบุเป็นช่วง:</span>
          <input id="inp-batch-range" type="text" placeholder="เช่น 1-24 หรือ 25-27" class="w-36 text-xs bg-white border border-[#475569] rounded px-2 py-1 font-mono font-bold focus:outline-none">
          <button id="btn-apply-range" class="pop-btn px-2.5 py-1 text-xs font-black" style="background:#98cfad;">
            บันทึก
          </button>
        </div>
      </div>

      <!-- Filter / Search Row -->
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <span class="text-xs font-extrabold text-[#34383b]">ค้นหา / กรองกริด:</span>
          <input id="quick-search" type="text" placeholder="พิมพ์เบอร์เข็ม หรือกริด เช่น 7-A..." class="text-xs bg-white border border-[#475569] rounded-lg px-2.5 py-1 font-medium focus:outline-none w-48">
        </div>
        <div class="text-xs font-black text-[#34383b]">
          ตอกแล้ว <span id="quick-driven-stat" class="text-[#10b981]">0</span> / 93 ต้น
        </div>
      </div>

      <!-- 93 Pile Chips Grid -->
      <div id="quick-chips-container" class="flex-1 overflow-y-auto border-2 border-[#475569] rounded-xl p-3 bg-white grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 shadow-inner max-h-[50vh]">
        <!-- Injected by JavaScript -->
      </div>

      <!-- Footer Buttons -->
      <div class="mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#475569]/30">
        <span class="text-[#667277] font-semibold">🔵 สีฟ้า = กดวันนี้ | 🟢 สีเขียว = กดวันก่อน | ⚪ สีเทา = ยังไม่ตอก</span>
        <button id="btn-done-quick-select" class="pop-btn-primary px-4 py-1.5 text-xs font-black">
          เรียบร้อย (ปิดหน้าต่าง)
        </button>
      </div>

    </div>
  </div>

  <!-- Pile Mini Quick Card (Direct 1-Click Action on CAD Plan) -->
  <div id="pile-card" class="absolute bottom-5 right-5 z-30 w-72 pop-card p-3 transition-all duration-200 transform translate-y-4 opacity-0 pointer-events-auto hidden">
    <div class="flex items-start justify-between border-b-[1.5px] border-[#475569]/30 pb-1.5 mb-2">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-[#98cfad] border border-[#475569] flex items-center justify-center text-[#1e3a29]">
          <i data-lucide="hammer" class="w-4 h-4"></i>
        </div>
        <div>
          <span class="text-[9px] font-extrabold text-[#ed6845] uppercase">ข้อมูลเสาเข็ม</span>
          <h3 id="card-pile-tag" class="text-xs font-black text-[#34383b]">P01 (Grid 1-A)</h3>
        </div>
      </div>
      <button id="btn-close-card" class="text-[#667277] hover:text-[#34383b] p-1">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    </div>

    <!-- Quick Info -->
    <div class="space-y-1 text-xs mb-3">
      <div class="flex justify-between py-0.5 border-b border-[#e5f1ed]">
        <span class="text-[#667277]">ระดับตัดหัวเข็ม (CO):</span>
        <span id="card-pile-co" class="font-black text-[#ed6845]">-1.226 ม.</span>
      </div>
      <div class="flex justify-between py-0.5 border-b border-[#e5f1ed]">
        <span class="text-[#667277]">ขนาด / ความยาว:</span>
        <span id="card-pile-type" class="font-bold text-[#34383b]">I-0.40m (L=21.00m)</span>
      </div>
      <div class="flex justify-between py-0.5 border-b border-[#e5f1ed]">
        <span class="text-[#667277]">สถานะปัจจุบัน:</span>
        <span id="card-pile-status-text" class="font-black text-[#10b981]">ยังไม่ได้ตอก</span>
      </div>
    </div>

    <!-- 1-Click Toggle Action Buttons -->
    <div class="space-y-1.5">
      <button id="btn-card-toggle-driven" class="pop-btn-green w-full py-1.5 text-xs flex items-center justify-center gap-1.5">
        <i data-lucide="check" class="w-3.5 h-3.5"></i> กดว่าตอกแล้ววันนี้
      </button>
      <button id="btn-card-toggle-cancel" class="pop-btn w-full py-1 text-xs text-[#667277] flex items-center justify-center gap-1">
        <i data-lucide="rotate-ccw" class="w-3 h-3"></i> ยกเลิก (ตั้งเป็นยังไม่ตอก)
      </button>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- DEDICATED EXECUTIVE REPORT SHEET (หน้าออกรายงานความคืบหน้า) -->
  <!-- ========================================================================= -->
  <div id="report-page" class="fixed inset-0 z-50 overflow-y-auto bg-[#eef7f4] p-3 md:p-6 hidden">
    <div id="report-page-card" class="max-w-5xl mx-auto bg-white border-2 border-[#475569] rounded-2xl shadow-[6px_8px_0_#c9dfd9] p-5 md:p-7">
      
      <!-- Report Header & Controls Bar (Authentic Soft Ink Flat-Pop Style) -->
      <div class="bg-gradient-to-r from-[#fff0c8] via-[#fffdf8] to-[#e5f4e9] border-2 border-[#475569] rounded-2xl p-4 md:p-5 shadow-[4px_4px_0_#475569] mb-5">
        <!-- Top Row: Project Branding, Title & Controls -->
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between pb-3.5 border-b-2 border-[#475569] gap-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-xl bg-[#ffc45b] border-2 border-[#475569] flex flex-col items-center justify-center font-montserrat font-black text-[#34383b] shadow-[2px_2px_0_#475569] leading-tight">
              <span class="text-[9px] font-black uppercase text-[#a84631]">PYNN</span>
              <span class="text-base font-black">37</span>
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-2.5 py-0.5 rounded-md bg-[#ffc45b] border-2 border-[#475569] text-xs font-black text-[#34383b] shadow-[1px_1px_0_#475569]">
                  โครงการ PYNN PRIDI 37
                </span>
                <span class="text-xs font-bold text-[#667277]">ซอยปรีดี พนมยงค์ 37 (สุขุมวิท 71)</span>
              </div>
              <h2 class="text-xl md:text-2xl font-black text-[#34383b] mt-1">
                รายงานความคืบหน้างานเสาเข็ม <span class="text-xs md:text-sm font-bold text-[#667277] hidden sm:inline">(Piling Progress Report)</span>
              </h2>
            </div>
          </div>

          <!-- Action Controls & Date Badge -->
          <div class="flex items-center flex-wrap gap-2.5 self-end md:self-auto">
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#475569] text-xs font-black text-[#34383b] shadow-[1.5px_1.5px_0_#475569]">
              <i data-lucide="calendar" class="w-3.5 h-3.5 text-[#ed6845]"></i>
              <span>ประจำวันที่:</span>
              <span id="rep-header-date" class="text-[#ed6845] font-mono font-black">-</span>
            </div>

            <!-- Layout Orientation Switch (แนวตั้ง / แนวนอน) -->
            <div class="flex items-center bg-white rounded-lg border-2 border-[#475569] p-0.5 shadow-[1.5px_1.5px_0_#475569] no-print no-export">
              <button id="btn-layout-portrait" class="px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1" title="จัดหน้าแนวตั้ง (Portrait A4)">
                <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                <span>แนวตั้ง</span>
              </button>
              <button id="btn-layout-landscape" class="px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1" title="จัดหน้ารายงานแนวนอน (Side-by-Side 16:9 ไร้ขอบข้าง)">
                <i data-lucide="monitor" class="w-3.5 h-3.5"></i>
                <span>แนวนอน</span>
              </button>
            </div>

            <!-- Action buttons (Hidden during PNG Export & Print) -->
            <div class="flex items-center gap-2 no-print no-export">
              <button id="btn-export-png" class="pop-btn-green px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#064e3b]" title="ส่งออกภาพรายงาน PNG หลากหลายอัตราส่วน">
                <i data-lucide="camera" class="w-3.5 h-3.5"></i>
                <span>ส่งออกภาพ PNG</span>
              </button>
              <button id="btn-print-report" class="pop-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#9c3b23]">
                <i data-lucide="printer" class="w-3.5 h-3.5"></i>
                <span>พิมพ์ / PDF</span>
              </button>
              <button id="btn-close-report" class="pop-btn p-1.5 text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#475569]" title="ปิดหน้ารายงาน">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Row: 4 Exact Requested KPI Metric Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3.5">
          <!-- Card 1: แผนวันนี้ 3 ต้น / กดแล้ว X ต้น -->
          <div class="bg-[#f0f9ff] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-black text-[#0369a1]">
                <span class="w-5 h-5 rounded bg-[#0284c7] text-white flex items-center justify-center border border-[#475569] shadow-[0.5px_0.5px_0_#475569]">
                  <i data-lucide="hammer" class="w-3 h-3"></i>
                </span>
                แผนวันนี้ 3 ต้น
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#0369a1] shadow-[1px_1px_0_#475569]">
                เป้า 3 ต้น/วัน
              </span>
            </div>
            <div class="my-2 flex items-baseline gap-1.5">
              <span class="text-xs font-bold text-[#64748b]">กดแล้ว</span>
              <span id="rep-today-count" class="text-4xl md:text-5xl font-black font-montserrat text-[#0284c7] leading-none">0</span>
              <span class="text-sm font-black text-[#34383b]">ต้น</span>
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold text-[#667277] pt-1.5 border-t border-[#475569]/20">
              <span>แผนวันนี้: 3 ต้น</span>
              <span class="text-[#0284c7] font-black">กดแล้ว <span id="rep-today-sub">0</span> ต้น</span>
            </div>
          </div>

          <!-- Card 2: แผนกดสะสม .... ต้น -->
          <div class="bg-[#fff7ed] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-black text-[#c2410c]">
                <span class="w-5 h-5 rounded bg-[#ea580c] text-white flex items-center justify-center border border-[#475569] shadow-[0.5px_0.5px_0_#475569]">
                  <i data-lucide="calendar" class="w-3 h-3"></i>
                </span>
                แผนกดสะสม
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#ea580c] shadow-[1px_1px_0_#475569]">
                วันทำการที่ <span id="rep-elapsed-days">0</span>/31
              </span>
            </div>
            <div class="my-2 flex items-baseline gap-1.5">
              <span id="rep-plan-cum-count" class="text-4xl md:text-5xl font-black font-montserrat text-[#ea580c] leading-none">0</span>
              <span class="text-sm font-black text-[#34383b]">ต้น</span>
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold text-[#667277] pt-1.5 border-t border-[#475569]/20">
              <span>เป้าหมายสะสม</span>
              <span class="text-[#ea580c] font-black">(3 ต้น/วัน)</span>
            </div>
          </div>

          <!-- Card 3: กดสะสม .... ต้น -->
          <div class="bg-[#e5f4e9] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-black text-[#1e3a29]">
                <span class="w-5 h-5 rounded bg-[#10b981] text-white flex items-center justify-center border border-[#475569] shadow-[0.5px_0.5px_0_#475569]">
                  <i data-lucide="check-circle-2" class="w-3 h-3"></i>
                </span>
                กดสะสมจริง
              </span>
              <span id="rep-cum-pct" class="px-2 py-0.5 rounded-md text-[11px] font-black bg-white border-2 border-[#475569] text-[#10b981] shadow-[1px_1px_0_#475569]">
                0%
              </span>
            </div>
            <div class="my-2 flex items-baseline gap-1.5">
              <span id="rep-cum-count" class="text-4xl md:text-5xl font-black font-montserrat text-[#10b981] leading-none">0</span>
              <span class="text-sm font-black text-[#667277]">/ 93 ต้น</span>
            </div>
            <div class="space-y-1 pt-1.5 border-t border-[#475569]/20">
              <div class="w-full h-2.5 bg-white border border-[#475569] rounded-full overflow-hidden p-0.5">
                <div id="rep-cum-bar" class="h-full bg-[#10b981] rounded-full transition-all duration-300" style="width: 0%;"></div>
              </div>
            </div>
          </div>

          <!-- Card 4: ช้ากว่าแผน .... ต้น / ตามแผน / เร็วกว่าแผน -->
          <div id="rep-variance-card" class="bg-[#fff1f2] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-xs font-black text-[#881337]">
                <span class="w-5 h-5 rounded bg-[#e11d48] text-white flex items-center justify-center border border-[#475569] shadow-[0.5px_0.5px_0_#475569]">
                  <i data-lucide="activity" class="w-3 h-3"></i>
                </span>
                สถานะเทียบแผนงาน
              </span>
              <span id="rep-variance-badge" class="px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#e11d48] shadow-[1px_1px_0_#475569]">
                ตามแผน
              </span>
            </div>
            <div class="my-1.5">
              <div id="rep-variance-display" class="font-black text-xl md:text-2xl text-[#e11d48] leading-tight">
                ช้ากว่าแผน 0 ต้น
              </div>
            </div>
            <div class="flex items-center justify-between text-[11px] font-bold text-[#667277] pt-1.5 border-t border-[#475569]/20">
              <span>แผน <span id="rep-plan-sub" class="font-mono font-bold text-[#ea580c]">0</span> ต้น</span>
              <span>จริง <span id="rep-cum-sub" class="font-mono font-bold text-[#10b981]">0</span> ต้น</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===================================================================== -->
      <!-- MAIN REPORT BODY GRID (รองรับทั้งแนวตั้ง Portrait และแนวนอน Landscape 16:9) -->
      <!-- ===================================================================== -->
      <div id="report-main-grid" class="flex flex-col gap-5">
        
        <!-- COLUMN 1: LARGE PILING PROGRESS PLAN (สไตล์ Flat-Pop) -->
        <div id="report-col-plan" class="w-full">
          <div id="report-sec-plan" class="border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white h-full flex flex-col">
            <div class="bg-[#fff0c8] px-4 py-2.5 border-b-2 border-[#475569] flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs md:text-sm font-black text-[#34383b] flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-white border-2 border-[#475569] flex items-center justify-center shadow-[1px_1px_0_#475569]">
                  <i data-lucide="map" class="w-3.5 h-3.5 text-[#10b981]"></i>
                </span>
                แผนผังความคืบหน้างานเสาเข็ม (Piling Progress Plan)
              </span>
              
              <!-- Clear Legend with Flat-Pop Badges (ฟ้าเรืองแสง = วันนี้ | เขียว = วันก่อน | เทา = รอการตอก) -->
              <div class="flex items-center gap-2 text-xs font-black flex-wrap">
                <span class="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border-2 border-[#475569] shadow-[1px_1px_0_#475569]">
                  <span class="w-3 h-3 rounded-full bg-[#0284c7] border-2 border-[#00f0ff] ring-2 ring-[#38bdf8] shadow-[0_0_6px_#00f0ff]"></span> 
                  <span class="text-[#0284c7]">★ กดวันนี้ (สีฟ้าเรืองแสง)</span>
                </span>
                <span class="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border-2 border-[#475569] shadow-[1px_1px_0_#475569]">
                  <span class="w-3 h-3 rounded-full bg-[#10b981] border border-[#064e3b]"></span> 
                  <span class="text-[#10b981]">กดวันก่อน (สีเขียว)</span>
                </span>
                <span class="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-md border-2 border-[#475569] shadow-[1px_1px_0_#475569]">
                  <span class="w-3 h-3 rounded-full bg-[#f1f5f9] border border-[#94a3b8]"></span> 
                  <span class="text-[#64748b]">รอการตอก (สีเทา)</span>
                </span>
              </div>
            </div>

            <div id="planSnapshotCanvasWrapper" class="p-3 flex-1 flex flex-col">
              <!-- High-Resolution Large Canvas -->
              <div class="w-full h-[460px] md:h-[500px] flex-1 bg-white border-2 border-[#475569] rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                <canvas id="planSnapshotCanvas" class="w-full h-full block cursor-pointer" title="คลิกที่ต้นเข็มเพื่อดูหรือเปลี่ยนสถานะ"></canvas>
                <div class="absolute bottom-2 right-2 bg-white/95 border-2 border-[#475569] px-2.5 py-1 rounded-md text-[10.5px] font-black text-[#475569] shadow-[1px_1px_0_#475569] pointer-events-none">
                  💡 ทิศเหนือชี้ขึ้นบน | แนวเขตที่ดิน (เส้นประแดง) | กริด 1-10 ด้านบน | กริด A-E ด้านซ้าย
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: S-CURVE + TODAY'S TABLE -->
        <div id="report-col-side" class="w-full flex flex-col gap-5">
          <!-- SECTION 2: S-CURVE PROGRESS GRAPH -->
          <div id="report-sec-scurve" class="border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white">
            <div class="bg-[#dff1f5] px-4 py-2.5 border-b-2 border-[#475569] flex items-center justify-between">
              <span class="text-xs md:text-sm font-black text-[#34383b] flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-white border-2 border-[#475569] flex items-center justify-center shadow-[1px_1px_0_#475569]">
                  <i data-lucide="trending-up" class="w-3.5 h-3.5 text-[#ed6845]"></i>
                </span>
                กราฟเปรียบเทียบผลงานสะสม S-Curve (Actual vs Plan: 3 ต้น/วัน)
              </span>
              <span class="text-xs font-black bg-white px-2.5 py-1 rounded-lg border-2 border-[#475569] shadow-[1.5px_1.5px_0_#475569] text-[#34383b]">
                แผนงานรวม 93 ต้น / 31 วันทำการ
              </span>
            </div>
            <div class="p-3">
              <div class="chart-wrapper h-64 md:h-72 relative">
                <canvas id="reportScurveCanvas"></canvas>
              </div>
            </div>
          </div>

          <!-- SECTION 3: TODAY'S DRIVEN PILES LOG TABLE -->
          <div id="report-sec-table" class="border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white">
            <div class="bg-[#ffc45b] px-4 py-2.5 border-b-2 border-[#475569] flex items-center justify-between">
              <span class="text-xs md:text-sm font-black text-[#34383b] flex items-center gap-2">
                <span class="w-6 h-6 rounded-md bg-white border-2 border-[#475569] flex items-center justify-center shadow-[1px_1px_0_#475569]">
                  <i data-lucide="list-checks" class="w-3.5 h-3.5 text-[#34383b]"></i>
                </span>
                รายการเสาเข็มที่ตอกในวันที่รายงาน (Daily Driven Piles Log)
              </span>
              <span id="rep-today-table-badge" class="text-xs font-black px-2.5 py-1 rounded-lg bg-white border-2 border-[#475569] shadow-[1.5px_1.5px_0_#475569]">
                0 ต้น
              </span>
            </div>
            <div class="table-wrapper overflow-x-auto max-h-56 overflow-y-auto">
              <table class="w-full text-xs text-left border-collapse">
                <thead class="bg-[#fff0c8] text-[#34383b] border-b-2 border-[#475569] font-black text-xs">
                  <tr>
                    <th class="p-2.5 text-center border-r-2 border-[#475569]/30">No.</th>
                    <th class="p-2.5 border-r-2 border-[#475569]/30">รหัสเข็ม (ID)</th>
                    <th class="p-2.5 text-center border-r-2 border-[#475569]/30">ตำแหน่งกริด</th>
                    <th class="p-2.5 text-right border-r-2 border-[#475569]/30 text-[#a84631]">ระดับตัดหัวเข็ม CO (m)</th>
                    <th class="p-2.5 text-center border-r-2 border-[#475569]/30">ขนาด / ชนิดเข็ม</th>
                    <th class="p-2.5 text-center border-r-2 border-[#475569]/30">วันที่ตอก</th>
                    <th class="p-2.5 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody id="rep-today-table-body" class="divide-y divide-[#e5f1ed]">
                  <!-- Injected by JS -->
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- MODAL: EXPORT PROGRESS REPORT IMAGE (ส่งออกภาพรายงาน PNG ตามสัดส่วน) -->
  <!-- ========================================================================= -->
  <div id="modal-export-image" class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-3 md:p-6 hidden">
    <div class="pop-card bg-white w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl border-2 border-[#475569]">
      
      <!-- Modal Header -->
      <div class="bg-gradient-to-r from-[#fff0c8] via-[#f4ece7] to-[#e5f4e9] p-3 px-5 border-b-2 border-[#475569] flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-[#ed6845] text-white flex items-center justify-center border-2 border-[#475569] shadow-[1.5px_1.5px_0_#475569]">
            <i data-lucide="camera" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-sm md:text-base font-black text-[#34383b]">
              ส่งออกภาพรายงานความคืบหน้า (Export Progress Report Image)
            </h3>
            <p class="text-[11px] text-[#667277] font-semibold">
              สร้างภาพรายงานความละเอียดสูง สัดส่วนสวยงามตรงตามหน้าเว็บ พร้อมคัดลอกส่ง LINE หรือบันทึกไฟล์
            </p>
          </div>
        </div>
        <button id="btn-close-export" class="pop-btn p-1.5" title="ปิดหน้าต่างส่งออก">
          <i data-lucide="x" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Controls & Ratio Bar -->
      <div class="p-3 bg-[#f8fbf9] border-b border-[#475569]/20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        <!-- Mode Tabs -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#475569]/30">
          <button id="exp-tab-report" class="px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5">
            <i data-lucide="file-text" class="w-3.5 h-3.5"></i>
            <span>หน้ารายงานสรุป (Report Card)</span>
          </button>
          <button id="exp-tab-3d" class="px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5">
            <i data-lucide="cube" class="w-3.5 h-3.5"></i>
            <span>มุมมอง 3D / แปลน (3D CAD View)</span>
          </button>
        </div>

        <!-- Aspect Ratio Selector (อัตราส่วนรูปภาพ) -->
        <div class="flex items-center gap-2">
          <span class="font-black text-[#34383b]">สัดส่วนภาพ:</span>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button data-ratio="fit" class="exp-ratio-btn px-3 py-1.5 rounded-lg border-2 border-[#475569] font-black text-xs bg-[#ffc45b] text-[#34383b] shadow-[1.5px_1.5px_0_#475569]">
              📑 พอดีเอกสาร (Auto Fit / ไร้ขอบว่าง)
            </button>
            <button data-ratio="a4" class="exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]">
              📄 A4 แนวตั้ง (Portrait)
            </button>
            <button data-ratio="1:1" class="exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]">
              📱 จัตุรัส 1:1 (Square)
            </button>
            <button data-ratio="16:9" class="exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]">
              🔲 แนวนอน 16:9 (Slide)
            </button>
          </div>
        </div>

        <!-- Resolution Scale -->
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-[#667277]">ความคมชัด:</span>
          <select id="exp-scale" class="bg-white border border-[#475569] rounded px-2 py-1 font-bold text-xs text-[#34383b] focus:outline-none">
            <option value="2" selected>2x Ultra HD (คมกริบ)</option>
            <option value="1">1x Standard</option>
          </select>
        </div>

      </div>

      <!-- Preview Canvas Area -->
      <div class="flex-1 overflow-auto p-4 bg-slate-100/70 flex items-center justify-center min-h-[300px]">
        <div id="export-preview-wrapper" class="relative max-w-full flex items-center justify-center">
          <div id="export-loading-spinner" class="hidden absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs rounded-xl">
            <div class="w-8 h-8 border-3 border-[#10b981] border-t-transparent rounded-full animate-spin mb-2"></div>
            <span class="text-xs font-bold text-[#34383b]">กำลังสร้างภาพรายงานความละเอียดสูง...</span>
          </div>
          <!-- Live Preview Canvas -->
          <canvas id="exportPreviewCanvas" class="max-w-full max-h-[50vh] object-contain rounded-lg border-2 border-[#475569] shadow-lg bg-white"></canvas>
        </div>
      </div>

      <!-- Modal Footer Action Bar -->
      <div class="p-3.5 px-5 bg-white border-t-2 border-[#475569] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-xs text-[#667277] font-semibold flex items-center gap-2">
          <span id="export-dim-label" class="font-mono font-bold text-[#34383b] bg-[#f1f5f9] px-2 py-0.5 rounded border border-[#cbd5e1]">-</span>
          <span>• PNG คมชัดสูง เหมาะสำหรับแชร์ในแชทและแนบสไลด์</span>
        </div>

        <div class="flex items-center gap-2.5">
          <button id="btn-copy-export-png" class="pop-btn px-4 py-2 text-xs flex items-center gap-1.5 font-black shadow-xs" style="background:#fff0c8;">
            <i data-lucide="copy" class="w-4 h-4 text-[#ed6845]"></i>
            <span id="txt-copy-btn">คัดลอกรูปภาพ (Ctrl+V ใน LINE ได้ทันที)</span>
          </button>
          <button id="btn-download-export-png" class="pop-btn-green px-5 py-2 text-xs flex items-center gap-1.5 font-black shadow-[2px_2px_0_#064e3b]">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>ดาวน์โหลดภาพ PNG</span>
          </button>
        </div>
      </div>

    </div>
  </div>

  <!-- Modal: หน้าตารางค่า CO (Coordinate & Cut-Off Table) -->
  <div id="modal-cotable" class="fixed inset-0 z-40 modal-backdrop flex items-center justify-center p-4 hidden">
    <div class="pop-card w-full max-w-4xl p-4 bg-[#fffdf8] max-h-[90vh] flex flex-col">
      <div class="flex items-center justify-between border-b-2 border-[#475569]/30 pb-2 mb-3">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-[#dff1f5] border-2 border-[#475569] flex items-center justify-center text-[#34383b]">
            <i data-lucide="table" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="text-sm font-black text-[#34383b]">ตารางพิกัดและระดับตัดหัวเข็ม (CO & Coordinate Table)</h3>
            <p class="text-[11px] text-[#667277] font-semibold">ฐานข้อมูลเสาเข็มไอ 0.40 ม. ทั้งหมด 93 ต้น</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <input id="table-search" type="text" placeholder="ค้นหาเบอร์เข็ม / กริด..." class="text-xs bg-white border border-[#475569] rounded-lg px-2.5 py-1 font-medium focus:outline-none">
          <button id="btn-export-csv" class="pop-btn px-2.5 py-1 text-xs flex items-center gap-1" style="background:#e5f4e9;">
            <i data-lucide="download" class="w-3.5 h-3.5"></i> Export CSV
          </button>
          <button id="btn-close-cotable" class="pop-btn p-1.5">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto border-2 border-[#475569] rounded-xl bg-white shadow-[2px_2px_0_#c9dfd9]">
        <table class="w-full text-xs text-left border-collapse">
          <thead class="bg-[#ffc45b] text-[#34383b] sticky top-0 z-10 border-b-2 border-[#475569]">
            <tr>
              <th class="p-2.5 border-r border-[#475569]/30 font-black text-center">No.</th>
              <th class="p-2.5 border-r border-[#475569]/30 font-black">รหัสเข็ม</th>
              <th class="p-2.5 border-r border-[#475569]/30 font-black text-center">กริด</th>
              <th class="p-2.5 border-r border-[#475569]/30 font-black text-right text-[#a84631]">ระดับ CO (m)</th>
              <th class="p-2.5 border-r border-[#475569]/30 font-black text-center">สถานะ</th>
              <th class="p-2.5 border-r border-[#475569]/30 font-black text-center">วันที่ตอก</th>
              <th class="p-2.5 font-black text-center">สลับสถานะ</th>
            </tr>
          </thead>
          <tbody id="cotable-body" class="divide-y divide-[#e5f1ed]"></tbody>
        </table>
      </div>

      <div class="mt-2.5 flex justify-between items-center text-[11px] text-[#667277] font-semibold">
        <span>แสดงทั้งหมด 93 ต้น | คลิกปุ่มสลับสถานะเพื่อบันทึกทันที</span>
        <span id="cotable-summary-stat" class="font-black text-[#34383b]">ตอกแล้ว 0 / 93 ต้น</span>
      </div>
    </div>
  </div>

  <!-- EMBEDDED ZERO-CORS GLB DATA & PILES DATABASE -->
  <script id="embedded-data">
    window.__EMBEDDED_GLB_BASE64__ = "/*%%EMBEDDED_GLB_BASE64%%*/";
    window.__PILES_DB__ = /*%%EMBEDDED_PILES_DB%%*/;
  </script>

  <!-- Application Logic -->
  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    lucide.createIcons();

    const PILES_DATABASE = window.__PILES_DB__ || [];
    const STORAGE_KEY = 'PYNN37_PILING_PROGRESS_v2';

    // 1. Progress State Manager
    let progressRecords = {};

    function loadProgress() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('PYNN54_PILING_PROGRESS_v2');
        if (raw) {
          progressRecords = JSON.parse(raw);
        } else {
          initDemoProgress();
        }
      } catch (e) {
        initDemoProgress();
      }
    }

    function saveProgress() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progressRecords));
      updateUI();
      updatePileMeshVisuals();
      renderQuickChips();
      renderCoTable();
      renderReportSheet();
    }

    function initDemoProgress() {
      progressRecords = {};
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      for (let i = 1; i <= 24; i++) {
        const dayOffset = Math.floor((i - 1) / 3);
        const d = new Date(startDate);
        d.setDate(d.getDate() + dayOffset);
        const dateStr = d.toISOString().slice(0, 10);
        progressRecords[i] = {
          status: 'driven',
          date: dateStr
        };
      }
    }

    loadProgress();

    const todayStr = new Date().toISOString().slice(0, 10);
    const datePicker = document.getElementById('inp-report-date');
    datePicker.value = todayStr;
    datePicker.addEventListener('change', () => {
      updateUI();
      renderReportSheet();
      renderQuickChips();
    });

    // 2. Three.js Scene Setup (Pure White Canvas)
    const container = document.getElementById('viewport');
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const aspect = window.innerWidth / window.innerHeight;
    const frustumHeight = 32; // Crisp, well-framed CAD zoom
    const orthoCamera = new THREE.OrthographicCamera(
      -frustumHeight * aspect / 2,
       frustumHeight * aspect / 2,
       frustumHeight / 2,
      -frustumHeight / 2,
      0.1,
      2000
    );

    const perspCamera = new THREE.PerspectiveCamera(40, aspect, 0.1, 3000);
    let activeCamera = orthoCamera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0xffffff, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    // Site Plan Center Coordinates
    const PLAN_CENTER = new THREE.Vector3(16.5, 7.2, 0);

    // Dedicated Controls for 2D Orthographic Camera (CAD Pan/Zoom)
    const controlsOrtho = new OrbitControls(orthoCamera, renderer.domElement);
    controlsOrtho.enableRotate = false;
    controlsOrtho.screenSpacePanning = true;
    controlsOrtho.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controlsOrtho.target.copy(PLAN_CENTER);

    // Dedicated Controls for 3D Perspective Camera (Smooth Natural Orbit)
    perspCamera.up.set(0, 0, 1); // Z is vertical UP in Three.js world
    const controlsPersp = new OrbitControls(perspCamera, renderer.domElement);
    controlsPersp.enableRotate = true;
    controlsPersp.enableDamping = true;
    controlsPersp.dampingFactor = 0.08;
    controlsPersp.rotateSpeed = 0.85;
    controlsPersp.screenSpacePanning = true;
    // CRITICAL FIX: Ground is at Z=0. Clamp polar angle so camera NEVER dips under ground or flips upside down!
    controlsPersp.maxPolarAngle = Math.PI / 2 - 0.04; // ~87.7 deg: Ground plane always stays DOWN!
    controlsPersp.minPolarAngle = 0.05; // ~2.8 deg: Avoid straight-down gimbal lock spinning!
    controlsPersp.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    };
    controlsPersp.target.copy(PLAN_CENTER);

    function updateNavHints(mode) {
      const hint = document.getElementById('nav-hint-text');
      if (!hint) return;
      if (mode === '3d') {
        hint.innerHTML = '🖱️ <strong>คลิกซ้ายลาก:</strong> หมุนมุมมอง (ไม่กลับหัว) | <strong>Shift+ซ้าย หรือขวาลาก:</strong> เลื่อน (Pan) | <strong>ล้อเลื่อน:</strong> ซูม | <strong>ดับเบิ้ลคลิก:</strong> เล็งต้นเข็ม';
      } else {
        hint.innerHTML = '🖱️ <strong>คลิกซ้ายลาก:</strong> เลื่อนแปลน (Pan) | <strong>ล้อเลื่อน:</strong> ย่อ/ขยาย | <strong>คลิกต้นเข็ม:</strong> ลงผลงาน';
      }
    }

    function resetTopView() {
      activeCamera = orthoCamera;
      controlsOrtho.enabled = true;
      controlsPersp.enabled = false;

      orthoCamera.position.set(PLAN_CENTER.x, PLAN_CENTER.y, 80);
      orthoCamera.up.set(0, 1, 0);
      orthoCamera.lookAt(PLAN_CENTER.x, PLAN_CENTER.y, 0);

      controlsOrtho.target.copy(PLAN_CENTER);
      controlsOrtho.update();

      document.getElementById('view-top-ortho')?.classList.add('active');
      document.getElementById('view-iso3d')?.classList.remove('active');
      document.getElementById('sub-views-3d')?.classList.add('hidden');
      updateNavHints('ortho');
    }

    function resetIsoView() {
      activeCamera = perspCamera;
      controlsOrtho.enabled = false;
      controlsPersp.enabled = true;

      // Clean Isometric viewpoint (South-West angle looking North-East)
      perspCamera.position.set(PLAN_CENTER.x + 28, PLAN_CENTER.y - 36, 26);
      perspCamera.up.set(0, 0, 1);
      perspCamera.lookAt(PLAN_CENTER.x, PLAN_CENTER.y, 0);

      controlsPersp.target.copy(PLAN_CENTER);
      controlsPersp.update();

      document.getElementById('view-top-ortho')?.classList.remove('active');
      document.getElementById('view-iso3d')?.classList.add('active');
      document.getElementById('sub-views-3d')?.classList.remove('hidden');
      updateNavHints('3d');
    }

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfffaed, 0.85);
    sunLight.position.set(40, 50, 80);
    scene.add(sunLight);

    // Subtle Grid (Pure white ground)
    const grid = new THREE.GridHelper(100, 50, 0xd8e3e8, 0xf1f5f9);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    grid.material.opacity = 0.35;
    grid.material.transparent = true;
    scene.add(grid);

    // Materials with Crisp Lines
    const matToday = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant sky blue (กดวันนี้ - เด่นชัดเรืองแสง)
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const matDriven = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Vibrant emerald green (กดวันก่อน)
      roughness: 0.28,
      metalness: 0.08,
      side: THREE.DoubleSide
    });

    const matPending = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9, // Clean light soft white-grey (ยังไม่ตอก)
      roughness: 0.85,
      side: THREE.DoubleSide
    });

    // Badge materials (circular tag behind the number)
    const matBadgeToday = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue (กดวันนี้)
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.65,
      roughness: 0.2,
      side: THREE.DoubleSide
    });

    const matBadgeDriven = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Emerald green (กดวันก่อน)
      roughness: 0.3,
      side: THREE.DoubleSide
    });

    const matBadgePending = new THREE.MeshStandardMaterial({
      color: 0xffffff, // Pure white (ยังไม่ตอก)
      roughness: 0.85,
      side: THREE.DoubleSide
    });

    // Text materials (3D extrusion digits for pile numbers)
    const matTextWhite = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4
    });

    const matTextDark = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4
    });

    let currentModel = null;
    let modelRoot = new THREE.Group();
    scene.add(modelRoot);

    let pileMeshesMap = new Map();
    let pileEdgesMap = new Map();
    let activeFilter = 'all';

    // Load Embedded GLB
    const loader = new GLTFLoader();
    const dataUri = "data:model/gltf-binary;base64," + window.__EMBEDDED_GLB_BASE64__;

    loader.load(
      dataUri,
      (gltf) => {
        currentModel = gltf.scene;

        // CRITICAL FIX: Rotate model around X by +90 degrees to align North (+Y) UP and East (+X) RIGHT!
        currentModel.rotation.x = Math.PI / 2;
        modelRoot.add(currentModel);

        let lastBadgePileNo = null;

        currentModel.traverse((child) => {
          if (child.isMesh && child.geometry) {
            if (child.material) child.material.side = THREE.DoubleSide;

            const parentName = child.parent?.name || '';
            const myName = child.name || '';
            const nodeLayer = child.userData?.layer || child.parent?.userData?.layer || '';
            const matName = child.material?.name || '';

            // HIDE AUXILIARY HOLLOW PILES (WWTP 90, Grease Trap 25, Grid 10 22 = 137 piles) BY DEFAULT
            if (nodeLayer.includes('6M') || myName.includes('WWTP') || myName.includes('GT-') || myName.includes('Grid 10')) {
              child.userData.isHexPile = true;
              child.visible = false;
              return;
            }

            // CHECK IF THIS IS AN I-BEAM PILE (Pile_1..93)
            const beamMatch = (parentName + '_' + myName).match(/Pile_(\d+)/i);
            if (beamMatch) {
              const pileNo = parseInt(beamMatch[1], 10);
              if (!pileMeshesMap.has(pileNo)) {
                pileMeshesMap.set(pileNo, []);
                pileEdgesMap.set(pileNo, []);
              }
              child.userData.pileNo = pileNo;
              child.userData.isIBeam = true;
              pileMeshesMap.get(pileNo).push(child);

              // ADD CRISP OUTLINE EDGES (ขอเส้นขอบที่ชัดเจน)
              try {
                const edgeGeo = new THREE.EdgesGeometry(child.geometry, 25);
                const edgeMat = new THREE.LineBasicMaterial({
                  color: 0x1e293b,
                  linewidth: 2
                });
                const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
                child.add(edgeLine);
                pileEdgesMap.get(pileNo).push(edgeLine);
              } catch (e) {}
              return;
            }

            // CHECK IF THIS IS A PILE NUMBER CIRCLE BADGE (Group#142, 144... on PILE_01..93)
            const badgeLayerMatch = nodeLayer.match(/PILE_(\d+)/i);
            if (matName === 'Mat_Pile_Badge' || (badgeLayerMatch && myName.startsWith('Group'))) {
              const pileNo = badgeLayerMatch ? parseInt(badgeLayerMatch[1], 10) : lastBadgePileNo;
              if (pileNo) {
                lastBadgePileNo = pileNo;
                if (!pileMeshesMap.has(pileNo)) {
                  pileMeshesMap.set(pileNo, []);
                  pileEdgesMap.set(pileNo, []);
                }
                child.userData.pileNo = pileNo;
                child.userData.isBadge = true;
                child.renderOrder = 2;
                pileMeshesMap.get(pileNo).push(child);

                // Add crisp dark outline border around circular badge
                try {
                  const edgeGeo = new THREE.EdgesGeometry(child.geometry, 20);
                  const edgeMat = new THREE.LineBasicMaterial({
                    color: 0x475569,
                    linewidth: 1.5
                  });
                  const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
                  child.add(edgeLine);
                  pileEdgesMap.get(pileNo).push(edgeLine);
                } catch (e) {}
                return;
              }
            }

            // CHECK IF THIS IS A PILE NUMBER TEXT DIGIT (Group#143, 145... Mat_Pile_Text)
            if (matName === 'Mat_Pile_Text' && lastBadgePileNo !== null) {
              const pileNo = lastBadgePileNo;
              lastBadgePileNo = null;
              if (!pileMeshesMap.has(pileNo)) {
                pileMeshesMap.set(pileNo, []);
                pileEdgesMap.set(pileNo, []);
              }
              child.userData.pileNo = pileNo;
              child.userData.isText = true;
              child.renderOrder = 3;
              pileMeshesMap.get(pileNo).push(child);
              return;
            }

          } else if (child.isLine) {
            // High contrast CAD lines (Grid lines, boundary lines, leader lines)
            if (child.material) {
              child.material.color.setHex(0x334155);
              child.material.transparent = false;
              child.material.opacity = 1.0;
            }
          }
        });

        resetTopView();
        updatePileMeshVisuals();
        renderQuickChips();

        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.remove(), 400);
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          document.getElementById('loading-bar').style.width = pct + '%';
        }
      },
      (err) => {
        console.error('Error loading GLB:', err);
        document.getElementById('loading-text').textContent = 'โหลดโมเดลไม่สำเร็จ';
      }
    );

    // Update pile visuals with distinct fills and crisp dark outline borders (ฟ้าเรืองแสงวันนี้ / เขียววันก่อน)
    function updatePileMeshVisuals() {
      const curDate = datePicker.value || todayStr;
      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        const isDriven = rec && rec.status === 'driven';
        const isToday = isDriven && rec.date === curDate;
        const meshes = pileMeshesMap.get(p.no) || [];
        const edges = pileEdgesMap.get(p.no) || [];

        let visible = true;
        if (activeFilter === 'driven' && !isDriven) visible = false;
        if (activeFilter === 'pending' && isDriven) visible = false;

        meshes.forEach(m => {
          m.visible = visible;
          if (m.userData.isText) {
            m.material = (isToday || isDriven) ? matTextWhite : matTextDark;
          } else if (m.userData.isBadge) {
            if (isToday) m.material = matBadgeToday;
            else if (isDriven) m.material = matBadgeDriven;
            else m.material = matBadgePending;
          } else { // isIBeam
            if (isToday) m.material = matToday;
            else if (isDriven) m.material = matDriven;
            else m.material = matPending;
          }
        });

        edges.forEach(e => {
          e.visible = visible;
          if (e.material) {
            if (isToday) {
              e.material.color.setHex(0x00f0ff); // Neon Cyan outline
            } else if (isDriven) {
              e.material.color.setHex(0x064e3b); // Emerald outline
            } else {
              e.material.color.setHex(0x64748b); // Slate outline
            }
          }
        });
      });
    }

    // 3. UI Dashboard Calculations
    function updateUI() {
      let drivenCount = 0;
      let todayCount = 0;
      const curDate = datePicker.value;

      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        if (rec && rec.status === 'driven') {
          drivenCount++;
          if (rec.date === curDate) {
            todayCount++;
          }
        }
      });

      const pct = ((drivenCount / 93) * 100).toFixed(1);
      document.getElementById('stat-driven-count').textContent = drivenCount;
      document.getElementById('stat-driven-pct').textContent = `(${pct}%)`;
      document.getElementById('badge-driven').textContent = drivenCount;
      document.getElementById('badge-pending').textContent = 93 - drivenCount;
      document.getElementById('stat-today-count').textContent = todayCount;
      document.getElementById('stat-remain-count').textContent = `${93 - drivenCount} ต้น`;

      document.getElementById('cotable-summary-stat').textContent = `ตอกแล้ว ${drivenCount} / 93 ต้น (${pct}%)`;
      document.getElementById('quick-driven-stat').textContent = drivenCount;
    }

    // 4. Raycaster & 1-Click Pile Action Card
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedCardPileNo = null;

    let pointerDownPos = { x: 0, y: 0, time: 0 };

    window.addEventListener('pointerdown', (e) => {
      if (e.target !== renderer.domElement) return;
      pointerDownPos = { x: e.clientX, y: e.clientY, time: performance.now() };
    });

    // Raycast on pointerup ONLY if it was a quick stationary click (NOT a drag to rotate or pan!)
    window.addEventListener('pointerup', (e) => {
      if (e.target !== renderer.domElement) return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const dist = Math.hypot(dx, dy);
      const dt = performance.now() - pointerDownPos.time;

      // If user dragged more than 5px or held longer than 350ms, they were rotating or panning!
      if (dist > 5 || dt > 350) return;

      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, activeCamera);
      if (!currentModel) return;

      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find(h => h.object.userData?.pileNo);

      if (hit) {
        openPileCard(hit.object.userData.pileNo);
      }
    });

    // Double-click to Focus & Center rotation on clicked pile
    window.addEventListener('dblclick', (e) => {
      if (e.target !== renderer.domElement) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, activeCamera);
      if (!currentModel) return;

      const intersects = raycaster.intersectObjects(scene.children, true);
      const hit = intersects.find(h => h.object.userData?.pileNo);
      if (hit) {
        const pt = hit.point;
        if (activeCamera === perspCamera) {
          controlsPersp.target.set(pt.x, pt.y, 0);
          controlsPersp.update();
        } else {
          controlsOrtho.target.set(pt.x, pt.y, 0);
          controlsOrtho.update();
        }
      }
    });

    function openPileCard(pileNo) {
      selectedCardPileNo = pileNo;
      const pileData = PILES_DATABASE.find(p => p.no === pileNo);
      if (!pileData) return;

      const rec = progressRecords[pileNo];
      const isDriven = rec && rec.status === 'driven';

      document.getElementById('card-pile-tag').textContent = `${pileData.tag} (กริด ${pileData.grid})`;
      document.getElementById('card-pile-co').textContent = `${pileData.co_level.toFixed(3)} ม.`;
      document.getElementById('card-pile-type').textContent = `${pileData.type} (L=${pileData.length_m}m)`;

      const statusText = document.getElementById('card-pile-status-text');
      if (isDriven) {
        statusText.textContent = `✓ ตอกแล้ว (${rec.date || 'วันนี้'})`;
        statusText.className = 'font-black text-[#10b981]';
      } else {
        statusText.textContent = 'ยังไม่ได้ตอก';
        statusText.className = 'font-bold text-[#667277]';
      }

      const card = document.getElementById('pile-card');
      card.classList.remove('hidden');
      setTimeout(() => card.classList.remove('translate-y-4', 'opacity-0'), 10);
    }

    document.getElementById('btn-close-card').addEventListener('click', () => {
      const card = document.getElementById('pile-card');
      card.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => card.classList.add('hidden'), 200);
      selectedCardPileNo = null;
    });

    // 1-Click Button: Mark as driven today
    document.getElementById('btn-card-toggle-driven').addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      progressRecords[selectedCardPileNo] = {
        status: 'driven',
        date: datePicker.value || todayStr
      };
      saveProgress();
      document.getElementById('btn-close-card').click();
    });

    // 1-Click Button: Mark as pending
    document.getElementById('btn-card-toggle-cancel').addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      delete progressRecords[selectedCardPileNo];
      saveProgress();
      document.getElementById('btn-close-card').click();
    });

    // 5. Views Switcher (Top Ortho & 3D Isometric)
    document.getElementById('view-top-ortho').addEventListener('click', resetTopView);
    document.getElementById('btn-reset-view').addEventListener('click', resetTopView);
    document.getElementById('view-iso3d').addEventListener('click', resetIsoView);

    // Preset 3D Directional Views
    document.getElementById('btn-view-front')?.addEventListener('click', () => {
      if (activeCamera !== perspCamera) resetIsoView();
      perspCamera.position.set(PLAN_CENTER.x, PLAN_CENTER.y - 45, 14);
      controlsPersp.target.copy(PLAN_CENTER);
      controlsPersp.update();
    });

    document.getElementById('btn-view-side')?.addEventListener('click', () => {
      if (activeCamera !== perspCamera) resetIsoView();
      perspCamera.position.set(PLAN_CENTER.x - 45, PLAN_CENTER.y, 14);
      controlsPersp.target.copy(PLAN_CENTER);
      controlsPersp.update();
    });

    document.getElementById('btn-view-focus-center')?.addEventListener('click', () => {
      if (activeCamera === perspCamera) {
        controlsPersp.target.copy(PLAN_CENTER);
        controlsPersp.update();
      } else {
        controlsOrtho.target.copy(PLAN_CENTER);
        controlsOrtho.update();
      }
    });

    // Compass Click Listener (Align North)
    document.getElementById('compass-widget')?.addEventListener('click', () => {
      if (activeCamera === perspCamera) {
        const dist = Math.hypot(perspCamera.position.x - controlsPersp.target.x, perspCamera.position.y - controlsPersp.target.y);
        perspCamera.position.set(controlsPersp.target.x, controlsPersp.target.y - dist, perspCamera.position.z);
        controlsPersp.update();
      } else {
        resetTopView();
      }
    });

    // 6. Pile Filters
    function setFilter(filterName, btnId) {
      activeFilter = filterName;
      ['filter-all', 'filter-driven', 'filter-pending'].forEach(id => {
        document.getElementById(id).classList.remove('active');
      });
      document.getElementById(btnId).classList.add('active');
      updatePileMeshVisuals();
    }

    document.getElementById('filter-all').addEventListener('click', () => setFilter('all', 'filter-all'));
    document.getElementById('filter-driven').addEventListener('click', () => setFilter('driven', 'filter-driven'));
    document.getElementById('filter-pending').addEventListener('click', () => setFilter('pending', 'filter-pending'));

    // 7. Layer Visibility
    function toggleSubGroup(keyword, isVis) {
      if (!currentModel) return;
      currentModel.traverse(c => {
        const name = (c.name || '').toLowerCase();
        const layer = (c.userData?.layer || '').toLowerCase();
        const kw = keyword.toLowerCase();
        if (name.includes(kw) || layer.includes(kw)) {
          c.visible = isVis;
        }
      });
    }

    document.getElementById('layer-grid').addEventListener('change', (e) => {
      toggleSubGroup('GRID', e.target.checked);
    });
    document.getElementById('layer-boundary').addEventListener('change', (e) => {
      toggleSubGroup('BOUNDARY', e.target.checked);
    });
    document.getElementById('layer-hex').addEventListener('change', (e) => {
      if (!currentModel) return;
      currentModel.traverse(c => {
        if (c.userData?.isHexPile) {
          c.visible = e.target.checked;
        }
      });
    });

    // =========================================================================
    // 8. QUICK PILE SELECTOR DRAWER (การระบุต้นที่กด ของ่ายๆ 1-93)
    // =========================================================================
    function renderQuickChips() {
      const container = document.getElementById('quick-chips-container');
      if (!container) return;

      const query = (document.getElementById('quick-search')?.value || '').toLowerCase().trim();
      container.innerHTML = '';

      PILES_DATABASE.forEach(p => {
        if (query) {
          const matchNo = p.no.toString().includes(query);
          const matchTag = p.tag.toLowerCase().includes(query);
          const matchGrid = p.grid.toLowerCase().includes(query);
          if (!matchNo && !matchTag && !matchGrid) return;
        }

        const curDate = datePicker.value || todayStr;
        const rec = progressRecords[p.no];
        const isDriven = rec && rec.status === 'driven';
        const isToday = isDriven && rec.date === curDate;

        const btn = document.createElement('button');
        let colorClass = 'bg-[#f8fafc] text-[#34383b] border-[#475569] hover:bg-[#fff0c8] shadow-[1px_1px_0_#475569]';
        let badgeText = 'ยังไม่ตอก';
        if (isToday) {
          colorClass = 'bg-[#0284c7] text-white border-[#0369a1] shadow-[2px_2px_0_#0369a1] ring-2 ring-[#38bdf8]';
          badgeText = '★ กดวันนี้';
        } else if (isDriven) {
          colorClass = 'bg-[#10b981] text-white border-[#064e3b] shadow-[1.5px_1.5px_0_#064e3b]';
          badgeText = '✓ กดวันก่อน';
        }

        btn.className = `p-2 rounded-lg border-2 font-bold text-center transition-all ${colorClass}`;
        btn.innerHTML = `
          <div class="text-xs font-black">${p.tag}</div>
          <div class="text-[9.5px] opacity-90">${p.grid}</div>
          <div class="text-[9px] mt-0.5 font-extrabold">${badgeText}</div>
        `;

        btn.addEventListener('click', () => {
          if (isDriven) {
            delete progressRecords[p.no];
          } else {
            progressRecords[p.no] = {
              status: 'driven',
              date: datePicker.value || todayStr
            };
          }
          saveProgress();
        });

        container.appendChild(btn);
      });
    }

    document.getElementById('quick-search')?.addEventListener('input', renderQuickChips);

    // Quick Batch Button: Drive next 3 piles
    document.getElementById('btn-drive-next-3')?.addEventListener('click', () => {
      let added = 0;
      for (let i = 1; i <= 93 && added < 3; i++) {
        if (!progressRecords[i] || progressRecords[i].status !== 'driven') {
          progressRecords[i] = {
            status: 'driven',
            date: datePicker.value || todayStr
          };
          added++;
        }
      }
      saveProgress();
    });

    // Quick Batch Button: Apply range e.g. 1-24
    document.getElementById('btn-apply-range')?.addEventListener('click', () => {
      const raw = document.getElementById('inp-batch-range').value.trim();
      if (!raw) return;

      const curDate = datePicker.value || todayStr;
      if (raw.includes('-')) {
        const parts = raw.split('-').map(s => parseInt(s.trim(), 10));
        const start = Math.max(1, parts[0] || 1);
        const end = Math.min(93, parts[1] || 93);
        for (let i = start; i <= end; i++) {
          progressRecords[i] = { status: 'driven', date: curDate };
        }
      } else {
        const nums = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        nums.forEach(n => {
          if (n >= 1 && n <= 93) {
            progressRecords[n] = { status: 'driven', date: curDate };
          }
        });
      }
      saveProgress();
      document.getElementById('inp-batch-range').value = '';
    });

    document.getElementById('btn-quick-select').addEventListener('click', () => {
      document.getElementById('modal-quick-select').classList.remove('hidden');
      renderQuickChips();
    });
    document.getElementById('btn-close-quick-select').addEventListener('click', () => {
      document.getElementById('modal-quick-select').classList.add('hidden');
    });
    document.getElementById('btn-done-quick-select').addEventListener('click', () => {
      document.getElementById('modal-quick-select').classList.add('hidden');
    });

    // =========================================================================
    // 9. S-CURVE CHART (ขอกราฟชัดๆ)
    // =========================================================================
    let reportScurveChartInstance = null;

    function buildChartConfig() {
      const daysCount = 31;
      const labels = [];
      const planData = [];
      const actualData = [];

      const drivenDatesMap = {};
      Object.values(progressRecords).forEach(r => {
        if (r.status === 'driven' && r.date) {
          drivenDatesMap[r.date] = (drivenDatesMap[r.date] || 0) + 1;
        }
      });
      const sortedDates = Object.keys(drivenDatesMap).sort();

      let cumActual = 0;
      for (let day = 1; day <= daysCount; day++) {
        labels.push(`D${day}`);
        planData.push(Math.min(day * 3, 93));

        if (day <= sortedDates.length) {
          cumActual += drivenDatesMap[sortedDates[day - 1]];
          actualData.push(cumActual);
        } else if (sortedDates.length === 0 && day === 1) {
          actualData.push(0);
        }
      }

      return {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'แผนงานสะสม (3 ต้น/วัน)',
              data: planData,
              borderColor: '#ed6845',
              borderWidth: 2.5,
              borderDash: [6, 4],
              pointRadius: 2.5,
              pointBackgroundColor: '#ed6845',
              fill: false,
              tension: 0.1
            },
            {
              label: 'ผลงานจริงสะสม (Actual)',
              data: actualData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.18)',
              borderWidth: 3.5,
              pointRadius: 3.5,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#064e3b',
              pointBorderWidth: 1.5,
              fill: true,
              tension: 0.15
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                font: { family: 'Sarabun', size: 12, weight: 'bold' },
                color: '#34383b',
                padding: 12
              }
            },
            tooltip: {
              backgroundColor: '#34383b',
              titleFont: { family: 'Sarabun', size: 12, weight: 'bold' },
              bodyFont: { family: 'Sarabun', size: 12 },
              padding: 8
            }
          },
          scales: {
            y: {
              min: 0,
              max: 95,
              grid: { color: '#e2e8f0' },
              title: { display: true, text: 'จำนวนเสาเข็มสะสม (ต้น)', font: { family: 'Sarabun', size: 11, weight: 'bold' }, color: '#475569' },
              ticks: { stepSize: 15, font: { family: 'Sarabun', weight: 'bold' }, color: '#34383b' }
            },
            x: {
              grid: { color: '#f1f5f9' },
              title: { display: true, text: 'วันทำการ (Days: D1 - D31)', font: { family: 'Sarabun', size: 11, weight: 'bold' }, color: '#475569' },
              ticks: { maxTicksLimit: 16, font: { family: 'Sarabun', weight: 'bold' }, color: '#34383b' }
            }
          }
        }
      };
    }

    // =========================================================================
    // 10. LARGE PILING PROGRESS PLAN (อิงรูปแบบ Image 2 สัดส่วน 2:1 เป็นระเบียบ)
    // =========================================================================
    function renderPlanSnapshotCanvas() {
      const canvas = document.getElementById('planSnapshotCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || canvas.parentElement.clientWidth || 800;
      const h = rect.height || canvas.parentElement.clientHeight || 480;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Clean White Paper Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Physical coordinate bounds:
      // Pins: X [-4.06, 37.85], Y [-2.50, 17.22]
      // Grids: X [0.00, 32.90], Y [0.00, 12.40]
      // Natural aspect ratio is 2:1 (width 46.4m, height 23.2m)
      const minX = -6.2, maxX = 40.2; // spanX = 46.4m
      const minY = -4.2, maxY = 19.0; // spanY = 23.2m
      const spanX = maxX - minX;
      const spanY = maxY - minY;

      // UNIFORM ASPECT RATIO SCALING (Strictly 1m X = 1m Y):
      // Guaranteed exact 2:1 proportions with zero distortion in both Portrait and Landscape!
      const padX = 32;
      const padY = 26;
      const availW = Math.max(80, w - padX * 2);
      const availH = Math.max(80, h - padY * 2);
      const scale = Math.min(availW / spanX, availH / spanY);

      const drawW = spanX * scale;
      const drawH = spanY * scale;
      const offsetX = padX + (availW - drawW) / 2;
      const offsetY = padY + (availH - drawH) / 2;

      const mapX = (x) => offsetX + (x - minX) * scale;
      const mapY = (y) => h - (offsetY + (y - minY) * scale); // North UP!

      // 1. Draw Property Boundary Line (เส้นประสีแดงเข้ม ชัดเจนตาม Image 2)
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

      // Boundary Pins Circles & Labels (n114250, n117402, n115372, n115816, ปร)
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

      // 2. Draw Grid Lines & Bubbles (Vertical 1..10, Horizontal A..E)
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

      const bubbleRadius = Math.max(7.2, Math.min(9.5, scale * 0.38));
      const bubbleFontSize = Math.max(7.5, Math.min(9.5, bubbleRadius * 0.95));

      // Vertical Grids
      const yTopGrid = mapY(15.2);
      const yBotGrid = mapY(-0.8);

      gridX.forEach(g => {
        const gx = mapX(g.x);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(gx, yTopGrid);
        ctx.lineTo(gx, yBotGrid);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Top Bubbles (Group very close grids cleanly: 1 & 2, 4 & 5, 9 & 10)
      const topBubbles = [
        { name: '1', x: 0.00, dy: 0 },
        { name: '2', x: 0.50, dy: -8 },
        { name: '3', x: 5.70, dy: 0 },
        { name: '4', x: 10.85, dy: 0 },
        { name: '5', x: 12.20, dy: 0 },
        { name: '6', x: 20.00, dy: 0 },
        { name: '7', x: 27.50, dy: 0 },
        { name: '8', x: 29.45, dy: 0 },
        { name: '9', x: 32.70, dy: 0 },
        { name: '10', x: 32.90, dy: -8 }
      ];

      topBubbles.forEach(b => {
        const bx = mapX(b.x);
        const by = yTopGrid - bubbleRadius - 4 + (b.dy || 0);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, by, bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${bubbleFontSize}px Montserrat, Sarabun, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(b.name, bx, by);
      });

      // Horizontal Grids & Left Bubbles
      const xLeftGrid = mapX(-1.8);
      const xRightGrid = mapX(34.2);

      gridY.forEach(g => {
        const gy = mapY(g.y);

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(xLeftGrid, gy);
        ctx.lineTo(xRightGrid, gy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left Bubble
        const bx = xLeftGrid - bubbleRadius - 4;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, gy, bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${bubbleFontSize}px Montserrat, Sarabun, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.name, bx, gy);
      });

      // 3. Draw All 93 Piles (Image 2 style with glowing today pile)
      const curDate = datePicker.value || todayStr;
      const radius = Math.max(7.8, Math.min(10.8, scale * 0.42));
      const fontSize = Math.max(7.5, Math.min(10.0, radius * 0.95));

      PILES_DATABASE.forEach(p => {
        const cx = mapX(p.x);
        const cy = mapY(p.y);
        const rec = progressRecords[p.no];
        const isDriven = rec && rec.status === 'driven';
        const isToday = isDriven && rec.date === curDate;

        // 1. If driven today: Glowing Neon Halo & Ring (เรืองแสงสีฟ้าสดใสชัดเจน)
        if (isToday) {
          ctx.save();
          const glowGrad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius + 13);
          glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.95)');
          glowGrad.addColorStop(0.45, 'rgba(14, 165, 233, 0.5)');
          glowGrad.addColorStop(1, 'rgba(2, 132, 199, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 13, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 2.6;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, radius + 3.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Pile Body (ฟ้า = วันนี้ | เขียว = วันก่อน | เทา = ยังไม่ตอก)
        let fillColor = '#f8fafc';
        let strokeColor = '#94a3b8';
        let strokeWidth = 1.2;
        let textColor = '#334155';

        if (isToday) {
          fillColor = '#0284c7';
          strokeColor = '#0369a1';
          strokeWidth = 2.0;
          textColor = '#ffffff';
        } else if (isDriven) {
          fillColor = '#10b981';
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

        // 3. Pile Number Text (Bold & Centered)
        ctx.fillStyle = textColor;
        ctx.font = `bold ${fontSize}px Montserrat, Sarabun, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.no.toString(), cx, cy);
      });
    }

    // Allow clicking piles directly on the 2D Plan Canvas in Report!
    const planCanvas = document.getElementById('planSnapshotCanvas');
    planCanvas.addEventListener('click', (e) => {
      const rect = planCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const w = rect.width;
      const h = rect.height;
      const minX = -6.2, maxX = 40.2;
      const minY = -4.2, maxY = 19.0;
      const spanX = maxX - minX;
      const spanY = maxY - minY;

      const padX = 32;
      const padY = 26;
      const availW = Math.max(80, w - padX * 2);
      const availH = Math.max(80, h - padY * 2);
      const scale = Math.min(availW / spanX, availH / spanY);

      const drawW = spanX * scale;
      const drawH = spanY * scale;
      const offsetX = padX + (availW - drawW) / 2;
      const offsetY = padY + (availH - drawH) / 2;

      const mapX = (x) => offsetX + (x - minX) * scale;
      const mapY = (y) => h - (offsetY + (y - minY) * scale);

      let closest = null;
      let minDist = Math.max(13, scale * 0.65);

      PILES_DATABASE.forEach(p => {
        const px = mapX(p.x);
        const py = mapY(p.y);
        const dist = Math.hypot(clickX - px, clickY - py);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      });

      if (closest) {
        const cur = progressRecords[closest.no];
        if (cur && cur.status === 'driven') {
          delete progressRecords[closest.no];
        } else {
          progressRecords[closest.no] = {
            status: 'driven',
            date: datePicker.value || todayStr
          };
        }
        saveProgress();
      }
    });

    // =========================================================================
    // 11. EXECUTIVE REPORT SHEET LOGIC
    // =========================================================================
    let currentReportLayout = 'portrait'; // 'portrait' or 'landscape'

    function setReportLayout(layout) {
      currentReportLayout = layout;
      const card = document.getElementById('report-page-card');
      const bPort = document.getElementById('btn-layout-portrait');
      const bLand = document.getElementById('btn-layout-landscape');

      if (layout === 'landscape') {
        card?.classList.add('is-landscape');
        if (bLand) bLand.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1';
        if (bPort) bPort.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1';
      } else {
        card?.classList.remove('is-landscape');
        if (bPort) bPort.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1';
        if (bLand) bLand.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1';
      }

      setTimeout(() => {
        renderPlanSnapshotCanvas();
        if (reportScurveChartInstance) {
          reportScurveChartInstance.resize();
        }
      }, 40);
    }

    document.getElementById('btn-layout-portrait')?.addEventListener('click', () => setReportLayout('portrait'));
    document.getElementById('btn-layout-landscape')?.addEventListener('click', () => setReportLayout('landscape'));

    function renderReportSheet() {
      const curDate = datePicker.value || todayStr;
      document.getElementById('rep-header-date').textContent = curDate;

      let drivenCount = 0;
      let todayCount = 0;
      const todayPilesList = [];

      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        if (rec && rec.status === 'driven') {
          drivenCount++;
          if (rec.date === curDate) {
            todayCount++;
            todayPilesList.push({ pile: p, rec: rec });
          }
        }
      });

      // 1. Calculate Elapsed Working Days & Cumulative Plan
      const drivenRecords = Object.values(progressRecords).filter(r => r.status === 'driven');
      const uniqueDates = [...new Set(drivenRecords.map(r => r.date))].filter(Boolean).sort();
      
      let elapsedDays = 1;
      if (uniqueDates.length > 0) {
        const curIdx = uniqueDates.indexOf(curDate);
        if (curIdx >= 0) {
          elapsedDays = curIdx + 1;
        } else if (curDate > uniqueDates[uniqueDates.length - 1]) {
          elapsedDays = uniqueDates.length + 1;
        } else {
          elapsedDays = Math.max(1, uniqueDates.filter(d => d <= curDate).length);
        }
      }
      elapsedDays = Math.min(Math.max(elapsedDays, 1), 31);
      const planCumCount = Math.min(elapsedDays * 3, 93);
      const variance = drivenCount - planCumCount; // negative means delayed, positive means ahead

      // Update Card 1: แผนวันนี้ 3 ต้น / กดแล้ว X ต้น
      const repTodayCountEl = document.getElementById('rep-today-count');
      if (repTodayCountEl) repTodayCountEl.textContent = todayCount;
      const repTodaySubEl = document.getElementById('rep-today-sub');
      if (repTodaySubEl) repTodaySubEl.textContent = todayCount;

      // Update Card 2: แผนกดสะสม X ต้น
      const repPlanCumEl = document.getElementById('rep-plan-cum-count');
      if (repPlanCumEl) repPlanCumEl.textContent = planCumCount;
      const repElapsedEl = document.getElementById('rep-elapsed-days');
      if (repElapsedEl) repElapsedEl.textContent = elapsedDays;

      // Update Card 3: กดสะสมจริง X ต้น
      const pct = ((drivenCount / 93) * 100).toFixed(1);
      const repCumCountEl = document.getElementById('rep-cum-count');
      if (repCumCountEl) repCumCountEl.textContent = drivenCount;
      const repCumPctEl = document.getElementById('rep-cum-pct');
      if (repCumPctEl) repCumPctEl.textContent = `${pct}%`;
      const repCumBarEl = document.getElementById('rep-cum-bar');
      if (repCumBarEl) repCumBarEl.style.width = `${pct}%`;

      // Update Card 4: ช้ากว่าแผน X ต้น / เร็วกว่าแผน / ตามแผน
      const repPlanSubEl = document.getElementById('rep-plan-sub');
      if (repPlanSubEl) repPlanSubEl.textContent = planCumCount;
      const repCumSubEl = document.getElementById('rep-cum-sub');
      if (repCumSubEl) repCumSubEl.textContent = drivenCount;

      const varCard = document.getElementById('rep-variance-card');
      const varDisplay = document.getElementById('rep-variance-display');
      const varBadge = document.getElementById('rep-variance-badge');

      if (variance < 0) {
        const delayedCount = Math.abs(variance);
        if (varDisplay) {
          varDisplay.textContent = `ช้ากว่าแผน ${delayedCount} ต้น`;
          varDisplay.className = 'font-black text-xl md:text-2xl text-[#e11d48] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'ช้ากว่าแผน';
          varBadge.className = 'px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#e11d48] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = 'bg-[#fff1f2] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      } else if (variance > 0) {
        if (varDisplay) {
          varDisplay.textContent = `เร็วกว่าแผน +${variance} ต้น`;
          varDisplay.className = 'font-black text-xl md:text-2xl text-[#15803d] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'เร็วกว่าแผน';
          varBadge.className = 'px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#15803d] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = 'bg-[#ecfdf5] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      } else {
        if (varDisplay) {
          varDisplay.textContent = 'ตามแผนงานพอดี (0 ต้น)';
          varDisplay.className = 'font-black text-xl md:text-2xl text-[#15803d] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'ตามแผน';
          varBadge.className = 'px-2 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#15803d] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = 'bg-[#f0fdf4] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      }

      // Render Today's Driven Piles Table
      const tbody = document.getElementById('rep-today-table-body');
      tbody.innerHTML = '';
      document.getElementById('rep-today-table-badge').textContent = `${todayCount} ต้น`;

      if (todayPilesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-[#667277] font-semibold">ยังไม่มีการบันทึกเสาเข็มที่ตอกในวันที่ ${curDate} (สามารถคลิกที่ต้นเข็มบนแปลน หรือกดปุ่ม "ระบุต้นที่ตอกด่วน" เพื่อลงข้อมูลได้)</td></tr>`;
      } else {
        todayPilesList.forEach(({ pile: p, rec }) => {
          const tr = document.createElement('tr');
          tr.className = 'hover:bg-[#f0f9ff] transition-colors border-b border-[#e5f1ed]';
          tr.innerHTML = `
            <td class="p-2.5 text-center font-bold text-[#667277] border-r border-[#e5f1ed]">${p.no}</td>
            <td class="p-2.5 font-black text-[#34383b] border-r border-[#e5f1ed]">${p.tag}</td>
            <td class="p-2.5 text-center font-bold text-[#34383b] border-r border-[#e5f1ed]">${p.grid}</td>
            <td class="p-2.5 text-right font-black text-[#a84631] font-mono border-r border-[#e5f1ed]">${p.co_level.toFixed(3)}</td>
            <td class="p-2.5 text-center font-semibold text-[#34383b] border-r border-[#e5f1ed]">${p.type} (21m)</td>
            <td class="p-2.5 text-center font-mono text-[11px] text-[#667277] border-r border-[#e5f1ed]">${rec.date || curDate}</td>
            <td class="p-2.5 text-center">
              <span class="px-2.5 py-0.5 rounded-full text-[10.5px] font-black bg-[#e0f2fe] text-[#0369a1] border border-[#0284c7] shadow-[1px_1px_0_#475569]">
                ★ กดวันนี้
              </span>
            </td>
          `;
          tbody.appendChild(tr);
        });
      }

      // Render Large Piling Plan Canvas
      setTimeout(renderPlanSnapshotCanvas, 20);

      // Render Crisp S-Curve in Report
      const repChartEl = document.getElementById('reportScurveCanvas');
      if (repChartEl) {
        if (reportScurveChartInstance) reportScurveChartInstance.destroy();
        reportScurveChartInstance = new Chart(repChartEl, buildChartConfig());
      }
    }

    // Report Sheet Modal Toggles
    document.getElementById('btn-open-report').addEventListener('click', () => {
      document.getElementById('report-page').classList.remove('hidden');
      renderReportSheet();
    });
    document.getElementById('btn-close-report').addEventListener('click', () => {
      document.getElementById('report-page').classList.add('hidden');
    });

    document.getElementById('btn-print-report').addEventListener('click', () => {
      window.print();
    });

    // =========================================================================
    // 13. HIGH RESOLUTION IMAGE REPORT EXPORTER (ส่งออกภาพ PNG ตามสัดส่วน)
    // =========================================================================
    let currentExportMode = 'report'; // 'report' or '3d'
    let currentExportRatio = 'fit';   // 'fit', 'a4', '1:1', '16:9'
    let currentExportCanvas = null;

    function openExportModal() {
      const modal = document.getElementById('modal-export-image');
      if (!modal) return;
      modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      updateExportPreview();
    }

    function closeExportModal() {
      const modal = document.getElementById('modal-export-image');
      if (modal) modal.classList.add('hidden');
    }

    document.getElementById('btn-open-export')?.addEventListener('click', openExportModal);
    document.getElementById('btn-export-png')?.addEventListener('click', openExportModal);
    document.getElementById('btn-close-export')?.addEventListener('click', closeExportModal);

    // Switch Export Mode Tabs
    document.getElementById('exp-tab-report')?.addEventListener('click', () => {
      currentExportMode = 'report';
      const bRep = document.getElementById('exp-tab-report');
      const b3d = document.getElementById('exp-tab-3d');
      if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
      if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      updateExportPreview();
    });

    document.getElementById('exp-tab-3d')?.addEventListener('click', () => {
      currentExportMode = '3d';
      const bRep = document.getElementById('exp-tab-report');
      const b3d = document.getElementById('exp-tab-3d');
      if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
      if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      updateExportPreview();
    });

    // Ratio Buttons (Flat-Pop Style)
    document.querySelectorAll('.exp-ratio-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.exp-ratio-btn').forEach(b => {
          b.className = 'exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]';
        });
        btn.className = 'exp-ratio-btn px-3 py-1.5 rounded-lg border-2 border-[#475569] font-black text-xs bg-[#ffc45b] text-[#34383b] shadow-[1.5px_1.5px_0_#475569]';
        currentExportRatio = btn.getAttribute('data-ratio');
        updateExportPreview();
      });
    });

    document.getElementById('exp-scale')?.addEventListener('change', updateExportPreview);

    async function updateExportPreview() {
      const spinner = document.getElementById('export-loading-spinner');
      spinner?.classList.remove('hidden');

      const previewCanvas = document.getElementById('exportPreviewCanvas');
      if (!previewCanvas) return;
      const scale = parseInt(document.getElementById('exp-scale')?.value || '2', 10);
      const curDate = datePicker.value || todayStr;

      try {
        let sourceCanvas = null;

        if (currentExportMode === 'report') {
          // Auto-adjust report layout to match chosen aspect ratio
          const previousLayout = currentReportLayout;
          if (currentExportRatio === '16:9') {
            setReportLayout('landscape');
          } else if (currentExportRatio === 'a4' || currentExportRatio === '1:1') {
            setReportLayout('portrait');
          }

          // Render report data
          renderReportSheet();

          const reportPage = document.getElementById('report-page');
          const wasHidden = reportPage.classList.contains('hidden');
          if (wasHidden) {
            // Temporarily reveal off-screen so html2canvas can measure & render elements
            reportPage.style.display = 'block';
            reportPage.style.visibility = 'hidden';
            reportPage.style.position = 'fixed';
            reportPage.style.left = '-9999px';
            reportPage.classList.remove('hidden');
            renderPlanSnapshotCanvas();
          }

          // Let canvas elements settle
          await new Promise(r => setTimeout(r, 100));

          const reportCard = document.getElementById('report-page-card');
          if (window.html2canvas && reportCard) {
            // Temporarily hide action buttons so they do NOT appear in the captured image
            const noExportEls = reportCard.querySelectorAll('.no-export, .no-print');
            const savedDisplays = [];
            noExportEls.forEach((el, idx) => {
              savedDisplays[idx] = el.style.display;
              el.style.display = 'none';
            });

            try {
              sourceCanvas = await html2canvas(reportCard, {
                scale: scale,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
              });
            } finally {
              noExportEls.forEach((el, idx) => {
                el.style.display = savedDisplays[idx] || '';
              });
            }
          }

          if (wasHidden) {
            reportPage.style.display = '';
            reportPage.style.visibility = '';
            reportPage.style.position = '';
            reportPage.style.left = '';
            reportPage.classList.add('hidden');
          }
        } else {
          // 3D / CAD View mode
          renderer.render(scene, activeCamera);
          const webglDataUrl = renderer.domElement.toDataURL('image/png');
          const img = new Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = webglDataUrl;
          });

          // Compose CAD view canvas with project header stamp
          const w = img.width;
          const h = img.height;
          const cadCanvas = document.createElement('canvas');
          cadCanvas.width = w;
          cadCanvas.height = h;
          const ctx = cadCanvas.getContext('2d');

          // Draw 3D view
          ctx.drawImage(img, 0, 0, w, h);

          // Add sleek header stamp
          let drivenCount = 0;
          let todayCount = 0;
          Object.values(progressRecords).forEach(r => {
            if (r.status === 'driven') {
              drivenCount++;
              if (r.date === curDate) todayCount++;
            }
          });

          const bannerScale = Math.max(1, w / 1200);
          ctx.save();
          // Header banner
          const bH = 60 * bannerScale;
          const bPad = 16 * bannerScale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fillRect(bPad, bPad, w - bPad * 2, bH);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2 * bannerScale;
          ctx.strokeRect(bPad, bPad, w - bPad * 2, bH);

          // Brand tag
          const tagW = 110 * bannerScale;
          const tagH = 40 * bannerScale;
          ctx.fillStyle = '#ffc45b';
          ctx.fillRect(bPad + 10 * bannerScale, bPad + 10 * bannerScale, tagW, tagH);
          ctx.strokeRect(bPad + 10 * bannerScale, bPad + 10 * bannerScale, tagW, tagH);
          ctx.fillStyle = '#34383b';
          ctx.font = `bold ${13 * bannerScale}px Montserrat, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PYNN PRIDI 37', bPad + 10 * bannerScale + tagW / 2, bPad + 10 * bannerScale + tagH / 2);

          // Title & Stats
          ctx.textAlign = 'left';
          ctx.font = `bold ${15 * bannerScale}px Sarabun, sans-serif`;
          ctx.fillText('แปลนงานเสาเข็ม (Piling Progress CAD View)', bPad + tagW + 24 * bannerScale, bPad + 22 * bannerScale);
          ctx.font = `${11.5 * bannerScale}px Sarabun, sans-serif`;
          ctx.fillStyle = '#475569';
          ctx.fillText(`ประจำวันที่: ${curDate}  |  กดวันนี้: ${todayCount} ต้น  |  ตอกแล้วสะสม: ${drivenCount} / 93 ต้น (${((drivenCount/93)*100).toFixed(1)}%)  |  คงเหลือ: ${93 - drivenCount} ต้น`, bPad + tagW + 24 * bannerScale, bPad + 43 * bannerScale);

          ctx.restore();
          sourceCanvas = cadCanvas;
        }

        if (!sourceCanvas) {
          throw new Error('Unable to create source canvas');
        }

        // Apply chosen Aspect Ratio
        const finalCanvas = formatCanvasAspect(sourceCanvas, currentExportRatio);
        currentExportCanvas = finalCanvas;

        // Render to preview
        previewCanvas.width = finalCanvas.width;
        previewCanvas.height = finalCanvas.height;
        const pCtx = previewCanvas.getContext('2d');
        pCtx.drawImage(finalCanvas, 0, 0);

        const dimEl = document.getElementById('export-dim-label');
        if (dimEl) {
          const ratioName = currentExportRatio === 'fit' ? 'Auto Fit (พอดีเอกสาร)' : currentExportRatio.toUpperCase();
          dimEl.textContent = `${finalCanvas.width} × ${finalCanvas.height} px (${ratioName})`;
        }
      } catch (err) {
        console.error('Export error:', err);
      } finally {
        spinner?.classList.add('hidden');
      }
    }

    function formatCanvasAspect(src, ratioStr) {
      // Auto Fit or Full: return source canvas directly with NO padding or letterboxing
      if (ratioStr === 'fit' || ratioStr === 'full') {
        return src;
      }

      let targetAspect = 16 / 9;
      if (ratioStr === 'a4') targetAspect = 1 / 1.414; // Portrait A4
      if (ratioStr === '4:3') targetAspect = 4 / 3;
      if (ratioStr === '1:1') targetAspect = 1 / 1;
      if (ratioStr === '16:9') targetAspect = 16 / 9;

      const srcW = src.width;
      const srcH = src.height;
      const srcAspect = srcW / srcH;

      let outW, outH;
      if (srcAspect > targetAspect) {
        // Source is wider than target aspect -> height expands
        outW = srcW;
        outH = Math.round(srcW / targetAspect);
      } else {
        // Source is taller than target aspect -> width expands
        outH = srcH;
        outW = Math.round(srcH * targetAspect);
      }

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outW;
      outCanvas.height = outH;
      const ctx = outCanvas.getContext('2d');

      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);

      const padX = Math.round((outW - srcW) / 2);
      const padY = Math.round((outH - srcH) / 2);

      ctx.drawImage(src, padX, padY);
      return outCanvas;
    }

    // Download PNG
    document.getElementById('btn-download-export-png')?.addEventListener('click', () => {
      if (!currentExportCanvas) return;
      const curDate = datePicker.value || todayStr;
      const filename = `PYNN_PRIDI_37_Piling_Report_${curDate}_${currentExportRatio}.png`;

      currentExportCanvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement('a');
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
    });

    // Copy to Clipboard (Ctrl+V into LINE / Chat directly!)
    document.getElementById('btn-copy-export-png')?.addEventListener('click', () => {
      if (!currentExportCanvas) return;
      const btnTxt = document.getElementById('txt-copy-btn');
      currentExportCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          if (btnTxt) {
            const original = btnTxt.textContent;
            btnTxt.textContent = '✓ คัดลอกรูปภาพแล้ว! (กดวาง Ctrl+V ใน LINE ได้ทันที)';
            btnTxt.parentElement.style.background = '#98cfad';
            setTimeout(() => {
              btnTxt.textContent = original;
              btnTxt.parentElement.style.background = '#fff0c8';
            }, 3000);
          }
        } catch (e) {
          alert('เบราว์เซอร์ไม่รองรับการคัดลอกรูปภาพอัตโนมัติ กรุณากดปุ่ม "ดาวน์โหลดภาพ PNG" แทน');
        }
      }, 'image/png');
    });

    // 12. CO Table Modal
    function renderCoTable() {
      const tbody = document.getElementById('cotable-body');
      if (!tbody) return;

      const query = (document.getElementById('table-search')?.value || '').toLowerCase().trim();
      tbody.innerHTML = '';

      PILES_DATABASE.forEach(p => {
        if (query) {
          const matchNo = p.no.toString().includes(query);
          const matchTag = p.tag.toLowerCase().includes(query);
          const matchGrid = p.grid.toLowerCase().includes(query);
          if (!matchNo && !matchTag && !matchGrid) return;
        }

        const rec = progressRecords[p.no] || { status: 'pending', date: '-' };
        const isDriven = rec.status === 'driven';

        const tr = document.createElement('tr');
        tr.className = isDriven ? 'bg-[#f4fbf8] hover:bg-[#e6f7ef]' : 'hover:bg-[#fbfbfb]';

        tr.innerHTML = `
          <td class="p-2.5 border-r border-[#475569]/20 text-center font-bold text-[#667277]">${p.no}</td>
          <td class="p-2.5 border-r border-[#475569]/20 font-black text-[#34383b]">${p.tag}</td>
          <td class="p-2.5 border-r border-[#475569]/20 text-center font-bold text-[#34383b]">${p.grid}</td>
          <td class="p-2.5 border-r border-[#475569]/20 text-right font-black text-[#a84631] font-mono">${p.co_level.toFixed(3)}</td>
          <td class="p-2.5 border-r border-[#475569]/20 text-center">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${isDriven ? 'bg-[#98cfad] text-[#1e3a29] border-[#475569]' : 'bg-slate-100 text-[#667277] border-slate-300'}">
              ${isDriven ? '✓ ตอกแล้ว' : 'รอการตอก'}
            </span>
          </td>
          <td class="p-2.5 border-r border-[#475569]/20 text-center font-mono text-[11px] text-[#667277]">
            ${isDriven ? (rec.date || '-') : '-'}
          </td>
          <td class="p-2.5 text-center">
            <button class="px-2.5 py-0.5 rounded text-[10.5px] font-black border border-[#475569] shadow-[1px_1px_0_#475569] ${isDriven ? 'bg-[#f4ece7] hover:bg-[#fff0c8]' : 'bg-[#98cfad] text-[#1e3a29] hover:bg-[#10b981]'}" data-toggle-no="${p.no}">
              ${isDriven ? 'ยกเลิก' : 'ตอกแล้ว'}
            </button>
          </td>
        `;

        tbody.appendChild(tr);
      });

      tbody.querySelectorAll('button[data-toggle-no]').forEach(btn => {
        btn.addEventListener('click', () => {
          const no = parseInt(btn.getAttribute('data-toggle-no'), 10);
          const cur = progressRecords[no];
          if (cur && cur.status === 'driven') {
            delete progressRecords[no];
          } else {
            progressRecords[no] = {
              status: 'driven',
              date: datePicker.value || todayStr
            };
          }
          saveProgress();
        });
      });
    }

    document.getElementById('table-search')?.addEventListener('input', renderCoTable);

    document.getElementById('btn-open-cotable').addEventListener('click', () => {
      document.getElementById('modal-cotable').classList.remove('hidden');
      renderCoTable();
    });
    document.getElementById('btn-close-cotable').addEventListener('click', () => {
      document.getElementById('modal-cotable').classList.add('hidden');
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
      let csv = "\uFEFFNo,Pile_ID,Grid,CutOff_Level_m,Type,Length_m,Status,Drive_Date\n";
      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no] || { status: 'pending', date: '' };
        csv += `${p.no},${p.tag},${p.grid},${p.co_level},${p.type},${p.length_m},${rec.status},${rec.date || ''}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `PYNN_PRIDI_37_Piling_CO_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    });

    // Fullscreen
    document.getElementById('btn-fullscreen').addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });

    window.addEventListener('resize', () => {
      const asp = window.innerWidth / window.innerHeight;
      orthoCamera.left = -frustumHeight * asp / 2;
      orthoCamera.right = frustumHeight * asp / 2;
      orthoCamera.updateProjectionMatrix();

      perspCamera.aspect = asp;
      perspCamera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);

      if (!document.getElementById('report-page').classList.contains('hidden')) {
        renderPlanSnapshotCanvas();
      }
    });

    function updateCompass() {
      const needle = document.getElementById('compass-needle');
      if (!needle) return;
      if (activeCamera === orthoCamera) {
        needle.style.transform = 'rotate(0deg)';
      } else {
        const dx = perspCamera.position.x - controlsPersp.target.x;
        const dy = perspCamera.position.y - controlsPersp.target.y;
        const rad = Math.atan2(dx, dy); // 0 is looking North along +Y
        const deg = -(rad * 180 / Math.PI);
        needle.style.transform = `rotate(${deg}deg)`;
      }
    }

    function animate() {
      requestAnimationFrame(animate);
      if (activeCamera === orthoCamera) {
        controlsOrtho.update();
      } else {
        controlsPersp.update();
      }
      renderer.render(scene, activeCamera);
      updateCompass();
    }
    animate();
    updateUI();
  </script>
</body>
</html>
HTML_PAGE

# Replace embedded placeholders
html.gsub!('/*%%EMBEDDED_GLB_BASE64%%*/', b64_glb)
html.gsub!('/*%%EMBEDDED_PILES_DB%%*/', piles_json)

File.write(out_html, html, encoding: 'UTF-8')
puts "SUCCESS: Generated index.html (#{File.size(out_html)} bytes)"
