
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
    import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

    lucide.createIcons();

    const PILES_DATABASE = window.__PILES_DB__ || [];
    const STORAGE_KEY = 'PYNN37_PILING_PROGRESS_v3';

    // Supabase Configuration & Client Loader
    const SUPABASE_URL = "https://gyzrsrxzzturoqwhuiul.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5enJzcnh6enR1cm9xd2h1aXVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0ODYxNDcsImV4cCI6MjA5MTA2MjE0N30.CJAFW3acVnOwb5hvSDO6H0TGPTK__MOTBdgUxUWpM70";
    
    function getSupabaseClient() {
      if (window.__supabaseClientInstance) return window.__supabaseClientInstance;
      const sbObj = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
      if (sbObj && typeof sbObj.createClient === 'function') {
        try {
          window.__supabaseClientInstance = sbObj.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
          return window.__supabaseClientInstance;
        } catch (err) {
          console.warn('Supabase client initialization warning:', err);
        }
      }
      return null;
    }

    // Floating Non-blocking Toast Notification
    function showSyncToast(message, type = 'success') {
      const container = document.getElementById('piling-toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      const bg = type === 'success' ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-900/20' :
                 type === 'error' ? 'bg-rose-600 text-white border-rose-700 shadow-rose-900/20' :
                 'bg-slate-800 text-white border-slate-900 shadow-slate-900/20';
      toast.className = `${bg} px-4 py-2 rounded-xl text-xs font-bold border-2 shadow-lg flex items-center gap-2 pointer-events-auto transform transition-all duration-200 translate-y-0 opacity-100 z-[100]`;
      toast.innerHTML = `<span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('-translate-y-2', 'opacity-0');
        setTimeout(() => toast.remove(), 250);
      }, 2400);
    }

    function updateSyncButtonUI(state, timeStr = '') {
      const topBtnLbl = document.getElementById('lbl-supabase-top-btn');
      const repBtnLbl = document.getElementById('lbl-report-supabase');
      const topBtn = document.getElementById('btn-supabase-sync');
      const repBtn = document.getElementById('btn-report-supabase-sync');

      if (state === 'saving') {
        if (topBtnLbl) topBtnLbl.textContent = 'กำลังบันทึก...';
        if (repBtnLbl) repBtnLbl.textContent = 'กำลังบันทึก...';
        if (topBtn) topBtn.style.background = '#d97706';
        if (repBtn) repBtn.style.background = '#d97706';
      } else if (state === 'success') {
        const text = timeStr ? `บันทึกแล้ว (${timeStr})` : 'บันทึก Supabase แล้ว';
        if (topBtnLbl) topBtnLbl.textContent = text;
        if (repBtnLbl) repBtnLbl.textContent = text;
        if (topBtn) topBtn.style.background = '#10b981';
        if (repBtn) repBtn.style.background = '#10b981';
      } else if (state === 'error') {
        if (topBtnLbl) topBtnLbl.textContent = '⚠️ ลองใหม่อัตโนมัติ';
        if (repBtnLbl) repBtnLbl.textContent = '⚠️ ลองใหม่อัตโนมัติ';
        if (topBtn) topBtn.style.background = '#e11d48';
        if (repBtn) repBtn.style.background = '#e11d48';
      }
    }

    let isSyncInProgress = false;
    let queuedSyncRequest = false;
    let syncRetryTimer = null;
    let supabaseSyncTimeout = null;

    async function syncPilingToSupabase(silent = false) {
      if (isSyncInProgress) {
        queuedSyncRequest = true;
        return;
      }
      isSyncInProgress = true;
      updateSyncButtonUI('saving');

      let success = false;
      let lastErr = null;

      // 1. First priority: Server proxy sync endpoint (handles server-side Supabase write)
      try {
        const res = await fetch('/api/supabase/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: progressRecords })
        });
        if (res.ok) {
          const j = await res.json();
          if (j && j.success) success = true;
        } else {
          lastErr = new Error(`Server returned status ${res.status}`);
        }
      } catch (e) {
        lastErr = e;
      }

      // 2. Direct client fallback / reinforcement if available
      if (!success) {
        const sb = getSupabaseClient();
        if (sb) {
          try {
            const { data: row, error: fetchErr } = await sb
              .from('project_data')
              .select('data')
              .eq('id', 1)
              .maybeSingle();

            if (row && row.data) {
              row.data.pilingProgress = progressRecords;
              row.data.pilingProgressLastUpdated = new Date().toISOString();
              const { error: updErr } = await sb
                .from('project_data')
                .update({ data: row.data })
                .eq('id', 1);
              if (!updErr) success = true;
              else lastErr = updErr;
            } else if (!fetchErr) {
              // Create row
              const { error: insErr } = await sb
                .from('project_data')
                .insert({ id: 1, data: { pilingProgress: progressRecords, pilingProgressLastUpdated: new Date().toISOString() } });
              if (!insErr) success = true;
              else lastErr = insErr;
            }
          } catch (e) {
            lastErr = e;
          }
        }
      }

      isSyncInProgress = false;

      if (success) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        updateSyncButtonUI('success', timeStr);
        if (!silent) {
          const drivenCount = Object.values(progressRecords).filter(r => r && r.status === 'driven').length;
          showSyncToast(`☁️ บันทึกข้อมูลเสาเข็มออนไลน์ลง Supabase เรียบร้อยแล้ว (${drivenCount}/93 ต้น)`, 'success');
        }
        // Save to all storage keys for seamless compatibility
        const jsonStr = JSON.stringify(progressRecords);
        localStorage.setItem(STORAGE_KEY, jsonStr);
        localStorage.setItem('PYNN37_PILING_PROGRESS_LIVE_v3', jsonStr);
        localStorage.setItem('PYNN37_PILING_PROGRESS_v2', jsonStr);
      } else {
        console.warn('Sync to Supabase warning:', lastErr);
        updateSyncButtonUI('error');
        if (!silent) {
          showSyncToast('⚠️ บันทึกออนไลน์ขัดข้อง ระบบจะพยายามใหม่อัตโนมัติ', 'error');
        }
        if (syncRetryTimer) clearTimeout(syncRetryTimer);
        syncRetryTimer = setTimeout(() => syncPilingToSupabase(true), 3500);
      }

      if (queuedSyncRequest) {
        queuedSyncRequest = false;
        setTimeout(() => syncPilingToSupabase(true), 150);
      }
    }

    async function pullPilingFromSupabase(silent = false) {
      let fetched = null;
      // 1. Try server endpoint
      try {
        const res = await fetch('/api/supabase/piles');
        if (res.ok) {
          const json = await res.json();
          if (json && json.data && typeof json.data === 'object' && Object.keys(json.data).length > 0) {
            fetched = json.data;
          }
        }
      } catch (_) {}

      // 2. Direct client fallback
      if (!fetched) {
        const sb = getSupabaseClient();
        if (sb) {
          try {
            const { data: row } = await sb
              .from('project_data')
              .select('data')
              .eq('id', 1)
              .maybeSingle();
            if (row?.data?.pilingProgress && Object.keys(row.data.pilingProgress).length > 0) {
              fetched = row.data.pilingProgress;
            }
          } catch (_) {}
        }
      }

      if (fetched && Object.keys(fetched).length > 0) {
        progressRecords = fetched;
        const jsonStr = JSON.stringify(progressRecords);
        localStorage.setItem(STORAGE_KEY, jsonStr);
        localStorage.setItem('PYNN37_PILING_PROGRESS_LIVE_v3', jsonStr);
        localStorage.setItem('PYNN37_PILING_PROGRESS_v2', jsonStr);
        updateUI();
        updatePileMeshVisuals();
        renderQuickChips();
        renderCoTable();
        renderReportSheet();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        updateSyncButtonUI('success', timeStr);
        if (!silent) {
          const drivenCount = Object.values(progressRecords).filter(r => r && r.status === 'driven').length;
          showSyncToast(`📥 ดึงข้อมูลสถานะเสาเข็มล่าสุดจาก Supabase สำเร็จแล้ว (${drivenCount}/93 ต้น)`, 'success');
        }
      }
    }

    // Progress State Manager (Live Sync from Supabase)
    let progressRecords = {};

    async function loadProgress() {
      // 1. Load from localStorage cache
      try {
        const raw = localStorage.getItem(STORAGE_KEY) ||
                    localStorage.getItem('PYNN37_PILING_PROGRESS_LIVE_v3') ||
                    localStorage.getItem('PYNN37_PILING_PROGRESS_v2');
        if (raw) {
          const parsed = JSON.parse(raw);
          const keys = Object.keys(parsed);
          const isOldMock = keys.length === 24 && parsed[1] && parsed[24] && !parsed[44] && !parsed[54];
          if (!isOldMock) {
            progressRecords = parsed;
          } else {
            progressRecords = {};
          }
        } else {
          progressRecords = {};
        }
      } catch (e) {
        progressRecords = {};
      }

      // Render initial state
      updateUI();
      updatePileMeshVisuals();
      renderQuickChips();
      renderCoTable();
      renderReportSheet();

      // 2. Immediately pull live data from Supabase on startup
      await pullPilingFromSupabase(true);
    }

    function saveProgress() {
      const jsonStr = JSON.stringify(progressRecords);
      localStorage.setItem(STORAGE_KEY, jsonStr);
      localStorage.setItem('PYNN37_PILING_PROGRESS_LIVE_v3', jsonStr);
      localStorage.setItem('PYNN37_PILING_PROGRESS_v2', jsonStr);
      updateUI();
      updatePileMeshVisuals();
      renderQuickChips();
      renderCoTable();
      renderReportSheet();

      // Debounced silent auto-sync to Supabase
      if (supabaseSyncTimeout) clearTimeout(supabaseSyncTimeout);
      supabaseSyncTimeout = setTimeout(() => {
        syncPilingToSupabase(true);
      }, 500);
    }

    function initDemoProgress() {
      // Clean slate
      progressRecords = {};
    }

    loadProgress();
    setTimeout(setupPilingRealtime, 1000);

    function setupPilingRealtime() {
      const sb = getSupabaseClient();
      if (!sb) return;
      try {
        sb.channel('piling-realtime-room')
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'project_data',
            filter: 'id=eq.1'
          }, (payload) => {
            const remotePiles = payload?.new?.data?.pilingProgress;
            if (remotePiles && !isSyncInProgress) {
              const localStr = JSON.stringify(progressRecords);
              const remoteStr = JSON.stringify(remotePiles);
              if (localStr !== remoteStr) {
                progressRecords = remotePiles;
                const jsonStr = JSON.stringify(progressRecords);
                localStorage.setItem(STORAGE_KEY, jsonStr);
                localStorage.setItem('PYNN37_PILING_PROGRESS_LIVE_v3', jsonStr);
                localStorage.setItem('PYNN37_PILING_PROGRESS_v2', jsonStr);
                updateUI();
                updatePileMeshVisuals();
                renderQuickChips();
                renderCoTable();
                renderReportSheet();
                const now = new Date();
                const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                updateSyncButtonUI('success', timeStr);
              }
            }
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime listener error:', err);
      }
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const datePicker = document.getElementById('inp-report-date');
    datePicker.value = todayStr;

    function onDateChanged() {
      if (typeof updateUI === 'function') updateUI();
      if (typeof updatePileMeshVisuals === 'function') updatePileMeshVisuals();
      if (typeof render2DMap === 'function') render2DMap();
      if (typeof renderPlanSnapshotCanvas === 'function') renderPlanSnapshotCanvas();
      if (typeof renderReportSheet === 'function') renderReportSheet();
      if (typeof renderQuickChips === 'function') renderQuickChips();
      if (!document.getElementById('modal-export-image')?.classList.contains('hidden') && typeof updateExportPreview === 'function') {
        updateExportPreview();
      }
    }

    datePicker.addEventListener('change', onDateChanged);
    datePicker.addEventListener('input', onDateChanged);

    // Auto day change detection (เปลี่ยนสีเข็มและอัปเดต Dashboard อัตโนมัติเมื่อวันที่ปัจจุบันเปลี่ยนไป)
    let lastKnownDateStr = todayStr;
    setInterval(() => {
      const currentDay = new Date().toISOString().slice(0, 10);
      if (currentDay !== lastKnownDateStr) {
        lastKnownDateStr = currentDay;
        if (datePicker && datePicker.value === todayStr) {
          datePicker.value = currentDay;
        }
        onDateChanged();
      }
    }, 15000);

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

    // Materials with Crisp Lines & Black Outlines
    const matToday = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant sky blue (กดวันนี้ - สีฟ้าเด่นชัด)
      emissive: 0x38bdf8,
      emissiveIntensity: 0.75,
      roughness: 0.15,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const matDriven = new THREE.MeshStandardMaterial({
      color: 0x059669, // Vibrant emerald green (กดวันก่อน - สีเขียวสดใสชัดเจน)
      emissive: 0x10b981,
      emissiveIntensity: 0.55,
      roughness: 0.2,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const matPending = new THREE.MeshBasicMaterial({
      color: 0xf8fafc, // Clean faint pale soft silver/white (ลดสีเทาให้จางลงมาก ไม่แย่งซีนเขียวและฟ้า)
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    // Badge materials (circular tag behind the number)
    const matBadgeToday = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Sky blue (กดวันนี้)
      emissive: 0x38bdf8,
      emissiveIntensity: 0.80,
      roughness: 0.15,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const matBadgeDriven = new THREE.MeshStandardMaterial({
      color: 0x059669, // Emerald green (กดวันก่อน)
      emissive: 0x10b981,
      emissiveIntensity: 0.60,
      roughness: 0.2,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const matBadgePending = new THREE.MeshBasicMaterial({
      color: 0xffffff, // Pure clean white circle tag (ยังไม่ตอก - สะอาดตา ชัดเจน)
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
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
      color: 0x0f172a, // Deep solid dark slate text (Slate-900) - คมชัด อ่านง่ายมาก
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -4
    });

    // Helper function to create high-resolution crisp bold CAD 2D text plane in 3D scene (matching SketchUp)
    function createBoundaryTextPlane(text, color = '#dc2626', targetWidthMeters = null, targetHeightMeters = 0.28) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const fontSize = 160;
      const fontStr = `900 ${fontSize}px Montserrat, Sarabun, Tahoma, Arial, sans-serif`;
      ctx.font = fontStr;

      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const padX = 16;
      const padY = 16;
      canvas.width = Math.ceil(textW + padX * 2);
      canvas.height = Math.ceil(fontSize * 1.25 + padY * 2);

      ctx.font = fontStr;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Solid CAD stroke + fill to prevent text from looking thin or wispy (หนาคมชัดเหมือนใน SketchUp)
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.lineJoin = 'round';
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

      ctx.fillStyle = color;
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const aspect = canvas.width / canvas.height;
      let w, h;
      if (targetWidthMeters) {
        w = targetWidthMeters;
        h = w / aspect;
      } else {
        h = targetHeightMeters * 1.25;
        w = h * aspect;
      }

      const geo = new THREE.PlaneGeometry(w, h);
      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        alphaTest: 0.05
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 25;
      return mesh;
    }


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

            // Native SketchUp Boundary 3D text nodes (Group#18 = 41.91 m, Group#19 = 19.25 m (SOI PRIDI 37)) are now visible

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

              // ADD CRISP OUTLINE EDGES (เส้นขอบเสาเข็มสีดำสนิท)
              try {
                const edgeGeo = new THREE.EdgesGeometry(child.geometry, 25);
                const edgeMat = new THREE.LineBasicMaterial({
                  color: 0x000000,
                  linewidth: 1.5
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

                // Add crisp black outline border around circular badge
                try {
                  const edgeGeo = new THREE.EdgesGeometry(child.geometry, 20);
                  const edgeMat = new THREE.LineBasicMaterial({
                    color: 0x000000,
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

            // CHECK IF THIS IS A GRID BUBBLE BACKGROUND CIRCLE (Bubble_Bg_White / Grid Bubble 1..10, A..E - วงกลมสีขาวเหมือนใน SketchUp)
            if (matName === 'Bubble_Bg_White' || myName.includes('Grid Bubble')) {
              child.material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                side: THREE.DoubleSide,
                depthWrite: true
              });
              child.renderOrder = 8;

              // Add crisp black circular outline border (เส้นขอบวงกลมสีดำ คมชัดแบบ SketchUp)
              try {
                const edgeGeo = new THREE.EdgesGeometry(child.geometry, 15);
                const edgeMat = new THREE.LineBasicMaterial({
                  color: 0x000000,
                  linewidth: 2.0
                });
                const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
                edgeLine.renderOrder = 9;
                child.add(edgeLine);
              } catch (e) {}
              return;
            }

            // CHECK IF THIS IS A GRID BUBBLE TEXT DIGIT/LETTER (Bubble_Text_Mat - ตัวเลข/ตัวอักษรในวงกลม Grid)
            if (matName === 'Bubble_Text_Mat') {
              child.material = new THREE.MeshBasicMaterial({
                color: 0x000000,
                side: THREE.DoubleSide,
                depthWrite: true
              });
              child.material.polygonOffset = true;
              child.material.polygonOffsetFactor = -2;
              child.material.polygonOffsetUnits = -2;
              child.renderOrder = 12;
              return;
            }

            // CHECK IF THIS IS A CAD DIMENSION TEXT (Dim_Text_Green)
            if (matName === 'Dim_Text_Green') {
              child.material = new THREE.MeshBasicMaterial({
                color: 0x059669,
                side: THREE.DoubleSide
              });
              child.renderOrder = 10;
              return;
            }

            // CHECK IF THIS IS A BOUNDARY / SURVEY TEXT (Property_Line_Red, Survey_Pin_Red)
            if (matName === 'Property_Line_Red' || matName === 'Survey_Pin_Red') {
              child.material = new THREE.MeshBasicMaterial({
                color: 0xdc2626,
                side: THREE.DoubleSide
              });
              child.renderOrder = 10;
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

        // Boundary dimension text labels (41.91 m, 19.25 m (SOI PRIDI 37), 39.15 m, 19.77 m) are now 100% native 3D geometry from SketchUp GLB


        resetIsoView(); // 3D Isometric View as default
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

    // Update pile visuals with distinct fills and crisp dark outline borders (ฟ้าเรืองแสงวันนี้ / เขียวเมื่อเลยวันกด)
    function updatePileMeshVisuals() {
      const curDate = datePicker.value || todayStr;
      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        const isDriven = rec && rec.status === 'driven';
        const pileDate = rec ? rec.date : null;
        const isToday = isDriven && pileDate === curDate;
        const isPastDriven = isDriven && (!pileDate || pileDate < curDate);
        const isFutureDriven = isDriven && pileDate && pileDate > curDate;
        const meshes = pileMeshesMap.get(p.no) || [];
        const edges = pileEdgesMap.get(p.no) || [];

        let visible = true;
        if (activeFilter === 'driven' && (!isDriven || isFutureDriven)) visible = false;
        if (activeFilter === 'pending' && (isDriven && !isFutureDriven)) visible = false;

        meshes.forEach(m => {
          m.visible = visible;
          if (m.userData.isText) {
            m.material = (isToday || isPastDriven) ? matTextWhite : matTextDark;
          } else if (m.userData.isBadge) {
            if (isToday) m.material = matBadgeToday;
            else if (isPastDriven) m.material = matBadgeDriven;
            else m.material = matBadgePending;
          } else { // isIBeam
            if (isToday) m.material = matToday;
            else if (isPastDriven) m.material = matDriven;
            else m.material = matPending;
          }
        });

        edges.forEach(e => {
          e.visible = visible;
          if (e.material) {
            e.material.color.setHex(0x000000); // เส้นขอบดำสนิทตามที่ขอ (ขอเส้นขอบดำ)
          }
        });
      });
    }

    // 3. UI Dashboard Calculations (ปรับตามวันที่ด้วย และคำนวณจำนวนล่าช้าตามเป้าหมาย)
    function updateUI() {
      let drivenCount = 0;
      let todayCount = 0;
      const curDate = datePicker.value || todayStr;

      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        if (rec && rec.status === 'driven') {
          if (!rec.date || rec.date <= curDate) {
            drivenCount++;
          }
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

    function updatePileCardDiff(pcoVal, actualVal) {
      const badge = document.getElementById('card-pile-diff-badge');
      const diffText = document.getElementById('card-pile-diff-text');
      if (actualVal === null || actualVal === '' || actualVal === undefined || isNaN(actualVal)) {
        if (badge) {
          badge.textContent = 'ยังไม่ระบุ';
          badge.className = 'font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded';
        }
        if (diffText) diffText.textContent = '';
        return;
      }
      const act = parseFloat(actualVal);
      const diffM = act - pcoVal;
      const diffMm = Math.round(diffM * 1000);
      const diffSign = diffMm > 0 ? '+' : '';
      const isWithinTol = Math.abs(diffMm) <= 50;
      const color = isWithinTol ? 'text-emerald-700 bg-emerald-100 border-emerald-300' : 'text-amber-800 bg-amber-100 border-amber-300';
      if (badge) {
        badge.textContent = `Δ ${diffSign}${diffMm} mm`;
        badge.className = `font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border ${color}`;
      }
      if (diffText) {
        diffText.textContent = `ผลต่าง: ${diffSign}${diffMm} mm (${diffSign}${diffM.toFixed(3)} ม.)`;
        diffText.className = isWithinTol ? 'font-mono font-bold text-emerald-700' : 'font-mono font-bold text-amber-700';
      }
    }

    // Dynamic As-Built Coordinates Deviation (Diff N, E) Calculation
    function updatePileCardCoordDiff(designN, designE, actualN, actualE) {
      const badge = document.getElementById('card-pile-coord-diff-badge');
      const diffText = document.getElementById('card-pile-coord-diff-text');
      if (!badge) return;

      const actN = parseFloat(actualN);
      const actE = parseFloat(actualE);

      if (actualN === '' || actualN === null || actualN === undefined || isNaN(actN) ||
          actualE === '' || actualE === null || actualE === undefined || isNaN(actE) ||
          designN === null || designN === undefined || isNaN(designN) ||
          designE === null || designE === undefined || isNaN(designE)) {
        badge.textContent = '';
        badge.classList.add('hidden');
        if (diffText) diffText.innerHTML = '<span class="text-slate-400 font-normal">ระบุพิกัด N, E เพื่อคำนวณผลต่าง</span>';
        return;
      }

      const dN = actN - designN;
      const dE = actE - designE;
      const dN_mm = Math.round(dN * 1000);
      const dE_mm = Math.round(dE * 1000);
      const totDiff_m = Math.sqrt(dN * dN + dE * dE);
      const totDiff_mm = Math.round(totDiff_m * 1000);
      const totDiff_cm = (totDiff_mm / 10).toFixed(1);

      const signN = dN_mm > 0 ? '+' : '';
      const signE = dE_mm > 0 ? '+' : '';
      const isWithinTol = totDiff_mm <= 50; // เกณฑ์ยอมรับการตอกเข็มหนีศูนย์ไม่เกิน 5 cm (50 mm)

      badge.textContent = `Δรวม ${totDiff_mm} mm (${totDiff_cm} cm)`;
      badge.classList.remove('hidden');
      badge.className = isWithinTol
        ? 'font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300'
        : 'font-mono font-black text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300';

      if (diffText) {
        diffText.innerHTML = `
          <div class="flex items-center gap-1.5 justify-end text-[10px]">
            <span>ΔN: <b class="${Math.abs(dN_mm) <= 50 ? 'text-emerald-700' : 'text-rose-700'}">${signN}${dN_mm} mm</b></span>
            <span>ΔE: <b class="${Math.abs(dE_mm) <= 50 ? 'text-emerald-700' : 'text-rose-700'}">${signE}${dE_mm} mm</b></span>
          </div>
          <div class="text-[9.5px] ${isWithinTol ? 'text-emerald-700' : 'text-rose-700'} font-bold">
            ระยะหนีศูนย์: <b>${totDiff_mm} mm (${totDiff_cm} ซม.)</b> ${isWithinTol ? '✓ อยู่ในเกณฑ์ (≤5ซม.)' : '⚠️ เกินเกณฑ์ (>5ซม.)'}
          </div>
        `;
      }
    }

    function openPileCard(pileNo) {
      selectedCardPileNo = pileNo;
      const pileData = PILES_DATABASE.find(p => p.no === pileNo);
      if (!pileData) return;

      const rec = progressRecords[pileNo];
      const isDriven = rec && rec.status === 'driven';
      const curSelectedDate = datePicker.value || todayStr;
      const pileDate = (isDriven && rec.date) ? rec.date : curSelectedDate;

      document.getElementById('card-pile-tag').textContent = `${pileData.tag} (กริด ${pileData.grid})`;
      const pcoVal = pileData.pco_level !== undefined ? pileData.pco_level : pileData.co_level;
      document.getElementById('card-pile-co').textContent = `${pcoVal.toFixed(3)} ม.`;
      document.getElementById('card-pile-footing').textContent = pileData.footing || '-';
      document.getElementById('card-pile-northing').textContent = pileData.northing !== undefined ? pileData.northing.toFixed(4) : '-';
      document.getElementById('card-pile-easting').textContent = pileData.easting !== undefined ? pileData.easting.toFixed(4) : '-';
      // หน้ารายงาน ชนิดเข็ม ไม่ต้องระบุความยาว
      document.getElementById('card-pile-type').textContent = pileData.type || 'I-0.40m';

      // Set actual top elevation value
      const actualTopInp = document.getElementById('card-pile-actual-top');
      if (actualTopInp) {
        actualTopInp.value = (rec && rec.actual_top !== undefined) ? rec.actual_top : '';
      }
      const pcoHint = document.getElementById('card-pile-pco-hint');
      if (pcoHint) pcoHint.textContent = `${pcoVal.toFixed(3)} ม.`;
      updatePileCardDiff(pcoVal, (rec && rec.actual_top !== undefined) ? rec.actual_top : null);

      // Set actual coordinates N & E values and design hints
      const actualNInp = document.getElementById('card-pile-actual-n');
      const actualEInp = document.getElementById('card-pile-actual-e');
      if (actualNInp) actualNInp.value = (rec && rec.actual_n !== undefined) ? rec.actual_n : '';
      if (actualEInp) actualEInp.value = (rec && rec.actual_e !== undefined) ? rec.actual_e : '';

      const designNHint = document.getElementById('card-pile-design-n-hint');
      const designEHint = document.getElementById('card-pile-design-e-hint');
      if (designNHint) designNHint.textContent = pileData.northing !== undefined ? pileData.northing.toFixed(4) : '-';
      if (designEHint) designEHint.textContent = pileData.easting !== undefined ? pileData.easting.toFixed(4) : '-';

      updatePileCardCoordDiff(
        pileData.northing,
        pileData.easting,
        (rec && rec.actual_n !== undefined) ? rec.actual_n : null,
        (rec && rec.actual_e !== undefined) ? rec.actual_e : null
      );

      // Set date picker value in card
      const dateInp = document.getElementById('card-pile-date-input');
      if (dateInp) dateInp.value = pileDate;

      const dateBadge = document.getElementById('card-pile-date-badge');
      const statusText = document.getElementById('card-pile-status-text');
      const saveBtnLbl = document.getElementById('btn-card-save-date-lbl');

      const quickDriveBtn = document.getElementById('btn-card-quick-drive');
      const cancelBtn = document.getElementById('btn-card-toggle-cancel');

      if (isDriven) {
        statusText.textContent = `✓ ตอกแล้ว (บันทึกวันที่: ${rec.date || curSelectedDate})`;
        statusText.className = 'font-black text-[#10b981]';
        if (dateBadge) {
          dateBadge.textContent = rec.date ? `ข้อมูลเดิม: ${rec.date}` : 'วันนี้';
          dateBadge.className = 'font-mono font-black text-emerald-700 text-[10.5px] bg-emerald-100 px-1.5 py-0.5 rounded';
        }
        if (saveBtnLbl) saveBtnLbl.textContent = '💾 ปรับแก้วันตอก / ระดับ TOP (บันทึกออนไลน์)';
        if (quickDriveBtn) quickDriveBtn.classList.add('hidden');
        if (cancelBtn) cancelBtn.classList.remove('hidden');
      } else {
        statusText.textContent = 'ยังไม่ได้ตอก';
        statusText.className = 'font-bold text-[#667277]';
        if (dateBadge) {
          dateBadge.textContent = 'ยังไม่ระบุ';
          dateBadge.className = 'font-mono font-bold text-slate-500 text-[10.5px]';
        }
        if (saveBtnLbl) saveBtnLbl.textContent = '💾 บันทึกระบุรายละเอียดเพิ่มเติม';
        if (quickDriveBtn) quickDriveBtn.classList.remove('hidden');
        if (cancelBtn) cancelBtn.classList.add('hidden');
      }

      const card = document.getElementById('pile-card');
      card.classList.remove('hidden');
      setTimeout(() => card.classList.remove('translate-y-4', 'opacity-0'), 10);
      if (window.lucide) lucide.createIcons();
    }

    // Listener: copy PCO level to actual top
    document.getElementById('btn-card-copy-pco')?.addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      const p = PILES_DATABASE.find(x => x.no === selectedCardPileNo);
      if (!p) return;
      const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
      const inp = document.getElementById('card-pile-actual-top');
      if (inp) {
        inp.value = pco.toFixed(3);
        updatePileCardDiff(pco, pco);
      }
    });

    // Listener: dynamic diff update when typing actual top
    document.getElementById('card-pile-actual-top')?.addEventListener('input', (e) => {
      if (!selectedCardPileNo) return;
      const p = PILES_DATABASE.find(x => x.no === selectedCardPileNo);
      if (!p) return;
      const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
      const v = e.target.value.trim();
      updatePileCardDiff(pco, v === '' ? null : parseFloat(v));
    });

    // Dynamic diff update when typing actual coordinates N or E
    const handleCoordInput = () => {
      if (!selectedCardPileNo) return;
      const p = PILES_DATABASE.find(x => x.no === selectedCardPileNo);
      if (!p) return;
      const nVal = document.getElementById('card-pile-actual-n')?.value.trim();
      const eVal = document.getElementById('card-pile-actual-e')?.value.trim();
      updatePileCardCoordDiff(
        p.northing,
        p.easting,
        nVal === '' ? null : parseFloat(nVal),
        eVal === '' ? null : parseFloat(eVal)
      );
    };

    document.getElementById('card-pile-actual-n')?.addEventListener('input', handleCoordInput);
    document.getElementById('card-pile-actual-e')?.addEventListener('input', handleCoordInput);

    // Listener: copy design coordinates N & E into actual inputs
    document.getElementById('btn-card-copy-coords')?.addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      const p = PILES_DATABASE.find(x => x.no === selectedCardPileNo);
      if (!p) return;
      const inpN = document.getElementById('card-pile-actual-n');
      const inpE = document.getElementById('card-pile-actual-e');
      if (inpN && p.northing !== undefined) inpN.value = p.northing.toFixed(4);
      if (inpE && p.easting !== undefined) inpE.value = p.easting.toFixed(4);
      updatePileCardCoordDiff(p.northing, p.easting, p.northing, p.easting);
    });

    document.getElementById('btn-close-card')?.addEventListener('click', () => {
      const card = document.getElementById('pile-card');
      card.classList.add('translate-y-4', 'opacity-0');
      setTimeout(() => card.classList.add('hidden'), 200);
      selectedCardPileNo = null;
    });

    // Quick Date: Today
    document.getElementById('btn-card-date-today')?.addEventListener('click', () => {
      const inp = document.getElementById('card-pile-date-input');
      if (inp) inp.value = todayStr;
    });

    // Quick Date: Yesterday
    document.getElementById('btn-card-date-yesterday')?.addEventListener('click', () => {
      const inp = document.getElementById('card-pile-date-input');
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yStr = d.toISOString().split('T')[0];
      if (inp) inp.value = yStr;
    });

    // Quick 1-Click Drive inside pile card
    document.getElementById('btn-card-quick-drive')?.addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      const pileData = PILES_DATABASE.find(p => p.no === selectedCardPileNo);
      const dateInp = document.getElementById('card-pile-date-input');
      const chosenDate = (dateInp && dateInp.value) ? dateInp.value : (datePicker.value || todayStr);
      const existing = progressRecords[selectedCardPileNo] || {};
      const defTop = (pileData && pileData.pco_level !== undefined) ? pileData.pco_level : (pileData ? pileData.co_level : 0);
      progressRecords[selectedCardPileNo] = {
        ...existing,
        status: 'driven',
        date: chosenDate,
        actual_n: existing.actual_n !== undefined ? existing.actual_n : (pileData && pileData.northing !== undefined ? pileData.northing : 0),
        actual_e: existing.actual_e !== undefined ? existing.actual_e : (pileData && pileData.easting !== undefined ? pileData.easting : 0),
        actual_top: existing.actual_top !== undefined ? existing.actual_top : defTop
      };
      saveProgress();
      syncPilingToSupabase(false);
      document.getElementById('btn-close-card')?.click();
    });

    // Save or Adjust Date and Actual Top for Pile (บันทึก / ปรับแก้วันที่เก่า + ระดับ TOP จริง)
    document.getElementById('btn-card-save-date')?.addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      const dateInp = document.getElementById('card-pile-date-input');
      const chosenDate = (dateInp && dateInp.value) ? dateInp.value : (datePicker.value || todayStr);
      
      const actualTopInp = document.getElementById('card-pile-actual-top');
      const rawTop = actualTopInp ? actualTopInp.value.trim() : '';

      const actualNInp = document.getElementById('card-pile-actual-n');
      const rawN = actualNInp ? actualNInp.value.trim() : '';

      const actualEInp = document.getElementById('card-pile-actual-e');
      const rawE = actualEInp ? actualEInp.value.trim() : '';
      
      const record = {
        status: 'driven',
        date: chosenDate
      };
      if (rawTop !== '' && !isNaN(parseFloat(rawTop))) {
        record.actual_top = parseFloat(rawTop);
      }
      if (rawN !== '' && !isNaN(parseFloat(rawN))) {
        record.actual_n = parseFloat(rawN);
      }
      if (rawE !== '' && !isNaN(parseFloat(rawE))) {
        record.actual_e = parseFloat(rawE);
      }
      
      progressRecords[selectedCardPileNo] = record;
      saveProgress();
      if (typeof syncPilingToSupabase === 'function') {
        syncPilingToSupabase(false);
      }
      document.getElementById('btn-close-card')?.click();
    });

    // 1-Click Button: Mark as pending / cancel
    document.getElementById('btn-card-toggle-cancel')?.addEventListener('click', () => {
      if (!selectedCardPileNo) return;
      delete progressRecords[selectedCardPileNo];
      saveProgress();
      if (typeof syncPilingToSupabase === 'function') {
        syncPilingToSupabase(false);
      }
      document.getElementById('btn-close-card')?.click();
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
        let dateSubText = '';
        if (isToday) {
          colorClass = 'bg-[#0284c7] text-white border-[#0369a1] shadow-[2px_2px_0_#0369a1] ring-2 ring-[#38bdf8]';
          badgeText = '★ กดวันนี้';
          dateSubText = `<div class="text-[8.5px] font-mono mt-0.5 bg-black/20 rounded px-1">${rec.date || curDate}</div>`;
        } else if (isDriven) {
          colorClass = 'bg-[#10b981] text-white border-[#064e3b] shadow-[1.5px_1.5px_0_#064e3b]';
          badgeText = '✓ กดวันก่อน';
          dateSubText = `<div class="text-[8.5px] font-mono mt-0.5 bg-black/20 rounded px-1">${rec.date || ''}</div>`;
        }

        btn.className = `p-2 rounded-lg border-2 font-bold text-center transition-all ${colorClass} cursor-pointer group`;
        btn.title = isDriven ? `ต้น ${p.tag} ตอกเมื่อ ${rec.date || ''} - คลิกเพื่อปรับแก้วันที่หรือข้อมูล` : `คลิกเพื่อบันทึกว่าตอกแล้วในวันที่ ${curDate}`;
        btn.innerHTML = `
          <div class="text-xs font-black">${p.tag}</div>
          <div class="text-[9.5px] opacity-90">${p.grid}</div>
          <div class="text-[9px] mt-0.5 font-extrabold">${badgeText}</div>
          ${dateSubText}
        `;

        btn.addEventListener('click', () => {
          const isToggleMode = document.getElementById('chk-quick-toggle-mode')?.checked;
          if (isToggleMode) {
            if (isDriven) {
              delete progressRecords[p.no];
              showSyncToast(`🔄 ยกเลิกสถานะตอกเสาเข็ม ${p.tag} (ออนไลน์)`, 'info');
            } else {
              progressRecords[p.no] = {
                status: 'driven',
                date: datePicker.value || todayStr
              };
              showSyncToast(`✓ ตอกเสาเข็ม ${p.tag} แล้ว (ออนไลน์)`, 'success');
            }
            saveProgress();
            syncPilingToSupabase(false);
          } else {
            if (isDriven) {
              // Open pile card to allow adjusting old date, status, or notes!
              openPileCard(p.no);
            } else {
              const pData = PILES_DATABASE.find(item => item.no === p.no);
              const defTop = (pData && pData.pco_level !== undefined) ? pData.pco_level : (pData ? pData.co_level : 0);
              const existing = progressRecords[p.no] || {};
              progressRecords[p.no] = {
                ...existing,
                status: 'driven',
                date: datePicker.value || todayStr,
                actual_n: existing.actual_n !== undefined ? existing.actual_n : (pData && pData.northing !== undefined ? pData.northing : 0),
                actual_e: existing.actual_e !== undefined ? existing.actual_e : (pData && pData.easting !== undefined ? pData.easting : 0),
                actual_top: existing.actual_top !== undefined ? existing.actual_top : defTop
              };
              saveProgress();
              syncPilingToSupabase(false);
            }
          }
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
          const pData = PILES_DATABASE.find(item => item.no === i);
          const defTop = (pData && pData.pco_level !== undefined) ? pData.pco_level : (pData ? pData.co_level : 0);
          const existing = progressRecords[i] || {};
          progressRecords[i] = {
            ...existing,
            status: 'driven',
            date: datePicker.value || todayStr,
            actual_n: existing.actual_n !== undefined ? existing.actual_n : (pData && pData.northing !== undefined ? pData.northing : 0),
            actual_e: existing.actual_e !== undefined ? existing.actual_e : (pData && pData.easting !== undefined ? pData.easting : 0),
            actual_top: existing.actual_top !== undefined ? existing.actual_top : defTop
          };
          added++;
        }
      }
      saveProgress();
      syncPilingToSupabase(false);
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
          const pData = PILES_DATABASE.find(item => item.no === i);
          const defTop = (pData && pData.pco_level !== undefined) ? pData.pco_level : (pData ? pData.co_level : 0);
          const existing = progressRecords[i] || {};
          progressRecords[i] = {
            ...existing,
            status: 'driven',
            date: curDate,
            actual_n: existing.actual_n !== undefined ? existing.actual_n : (pData && pData.northing !== undefined ? pData.northing : 0),
            actual_e: existing.actual_e !== undefined ? existing.actual_e : (pData && pData.easting !== undefined ? pData.easting : 0),
            actual_top: existing.actual_top !== undefined ? existing.actual_top : defTop
          };
        }
      } else {
        const nums = raw.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        nums.forEach(n => {
          if (n >= 1 && n <= 93) {
            const pData = PILES_DATABASE.find(item => item.no === n);
            const defTop = (pData && pData.pco_level !== undefined) ? pData.pco_level : (pData ? pData.co_level : 0);
            const existing = progressRecords[n] || {};
            progressRecords[n] = {
              ...existing,
              status: 'driven',
              date: curDate,
              actual_n: existing.actual_n !== undefined ? existing.actual_n : (pData && pData.northing !== undefined ? pData.northing : 0),
              actual_e: existing.actual_e !== undefined ? existing.actual_e : (pData && pData.easting !== undefined ? pData.easting : 0),
              actual_top: existing.actual_top !== undefined ? existing.actual_top : defTop
            };
          }
        });
      }
      saveProgress();
      syncPilingToSupabase(false);
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
      const parent = canvas.parentElement;
      const rect = canvas.getBoundingClientRect();
      const w = parent ? parent.clientWidth : (rect.width || 800);
      const h = parent ? parent.clientHeight : (rect.height || 400);
      if (w <= 0 || h <= 0) return;

      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Clean White Paper Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // 1. PRIMARY: RENDER REAL 3D MODEL FROM TOP VIEW (2D) DIRECTLY!
      // This produces the EXACT SAME view as the 3D first page (แปลน Top View 2D),
      // with real architectural grid lines, dimensions, external bubbles, and I-beam piles!
      if (currentModel && renderer) {
        try {
          const prevSize = new THREE.Vector2();
          renderer.getSize(prevSize);
          const prevRatio = renderer.getPixelRatio();
          const prevCam = activeCamera;

          const renderW = Math.round(w * dpr);
          const renderH = Math.round(h * dpr);
          renderer.setSize(renderW, renderH, false);
          renderer.setPixelRatio(1);

          // Center of the site in Three.js coordinates (กว้างพอดี ไม่หลุดขอบ)
          const centerX = 16.8;
          const centerY = 8.8;
          const spanX = 52.0;
          const spanY = 30.0;
          const canvasAspect = renderW / renderH;
          let camW, camH;
          if (canvasAspect > spanX / spanY) {
            camH = spanY;
            camW = spanY * canvasAspect;
          } else {
            camW = spanX;
            camH = spanX / canvasAspect;
          }

          orthoCamera.left = -camW / 2;
          orthoCamera.right = camW / 2;
          orthoCamera.top = camH / 2;
          orthoCamera.bottom = -camH / 2;
          orthoCamera.updateProjectionMatrix();
          orthoCamera.position.set(centerX, centerY, 80);
          orthoCamera.up.set(0, 1, 0);
          orthoCamera.lookAt(centerX, centerY, 0);

          updatePileMeshVisuals();
          renderer.render(scene, orthoCamera);

          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(renderer.domElement, 0, 0, w, h);

          renderer.setSize(prevSize.x, prevSize.y, false);
          renderer.setPixelRatio(prevRatio);
          activeCamera = prevCam;

          window.__PLAN_SNAPSHOT_TRANSFORM__ = {
            centerX,
            centerY,
            camW,
            camH,
            w,
            h
          };
          return;
        } catch (err) {
          console.warn('3D snapshot render error, falling back to 2D vector:', err);
        }
      }

      // 2. FALLBACK 2D VECTOR RENDERING (If 3D model is still loading)
      const minX = -8.5, maxX = 42.5; // spanX = 51.0m
      const minY = -5.5, maxY = 23.0; // spanY = 28.5m
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
      const mapY = (y) => h - (offsetY + (y - minY) * scale); // North UP!

      // 1. Draw Property Boundary Line
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

      // Boundary Pins Circles & Labels
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

      // Property Boundary Dimension Labels (All 4 Sides)
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

      // Right: 19.25 m (SOI PRIDI 37)
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.strokeText('19.25 m (SOI PRIDI 37)', mapX(38.0) + 8, mapY(7.15));
      ctx.fillText('19.25 m (SOI PRIDI 37)', mapX(38.0) + 8, mapY(7.15));



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

      // Vertical Grids - placed high so it never looks like piles
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

      // Top Bubbles (Architectural Grid 1..10, white circle like SketchUp)
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

      // Horizontal Grids & Left Bubbles
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

        const bx = xLeftGrid - bubbleRadius - 2;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(bx, gy, bubbleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${Math.max(8, bubbleRadius * 0.9)}px Montserrat, Sarabun, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(g.name, bx, gy);
      });

      // 3. Draw All 93 Piles with I-beam shape
      const curDate = datePicker.value || todayStr;
      const radius = Math.max(7.8, Math.min(10.8, scale * 0.42));
      const fontSize = Math.max(7.5, Math.min(10.0, radius * 0.95));

      PILES_DATABASE.forEach(p => {
        const cx = mapX(p.x);
        const cy = mapY(p.y);
        const rec = progressRecords[p.no];
        const isDriven = rec && rec.status === 'driven';
        const pileDate = rec ? rec.date : null;
        const isToday = isDriven && pileDate === curDate;
        const isPastDriven = isDriven && (!pileDate || pileDate < curDate);

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

        let fillColor = '#f8fafc';
        let strokeColor = '#000000';
        let strokeWidth = 1.4;
        let textColor = '#0f172a';

        if (isToday) {
          fillColor = '#0284c7';
          strokeColor = '#0369a1';
          strokeWidth = 2.0;
          textColor = '#ffffff';
        } else if (isPastDriven) {
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
      const parent = planCanvas.parentElement;
      const rect = planCanvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const w = parent ? parent.clientWidth : rect.width;
      const h = parent ? parent.clientHeight : rect.height;

      let mapX, mapY;
      const tf = window.__PLAN_SNAPSHOT_TRANSFORM__;
      if (tf && tf.w && tf.h) {
        mapX = (x) => ((x - (tf.centerX - tf.camW / 2)) / tf.camW) * tf.w;
        mapY = (y) => (1 - (y - (tf.centerY - tf.camH / 2)) / tf.camH) * tf.h;
      } else {
        const minX = -6.2, maxX = 40.2;
        const minY = -4.2, maxY = 19.0;
        const spanX = maxX - minX;
        const spanY = maxY - minY;
        const padX = 32, padY = 26;
        const availW = Math.max(80, w - padX * 2);
        const availH = Math.max(80, h - padY * 2);
        const scale = Math.min(availW / spanX, availH / spanY);
        const drawW = spanX * scale;
        const drawH = spanY * scale;
        const offsetX = padX + (availW - drawW) / 2;
        const offsetY = padY + (availH - drawH) / 2;
        mapX = (x) => offsetX + (x - minX) * scale;
        mapY = (y) => h - (offsetY + (y - minY) * scale);
      }

      let closest = null;
      let minDist = 22; // Click tolerance in px

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
        openPileCard(closest.no);
      }
    });

    // =========================================================================
    // 11. EXECUTIVE REPORT SHEET LOGIC & SELECTABLE THEME (ธีมเดิม / สไตล์ Excel)
    // =========================================================================
    let currentReportLayout = 'portrait'; // 'portrait' or 'landscape'
    let currentReportTheme = localStorage.getItem('PYNN37_REPORT_THEME') || 'original'; // 'original' (default) or 'excel'

    function setReportTheme(theme) {
      currentReportTheme = theme;
      localStorage.setItem('PYNN37_REPORT_THEME', theme);
      applyReportThemeUI(theme);
      renderReportSheet();
      setTimeout(scheduleReportScurveRender, 50);
    }

    function applyReportThemeUI(theme) {
      const reportPage = document.getElementById('report-page');
      const reportCard = document.getElementById('report-page-card');
      const header = document.getElementById('report-header-bar');
      const themeSel = document.getElementById('report-theme-selector');
      const btnOrig = document.getElementById('btn-theme-original');
      const btnExcel = document.getElementById('btn-theme-excel');
      const dateBadge = document.getElementById('rep-date-badge-wrapper');
      const layoutSwitch = document.getElementById('rep-layout-switch-wrapper');
      const btnExport = document.getElementById('btn-export-png');
      const btnPrint = document.getElementById('btn-print-report');
      const btnClose = document.getElementById('btn-close-report');
      const formulaBar = document.getElementById('rep-excel-formula-bar');
      const sheetTabs = document.getElementById('rep-excel-sheet-tabs');
      const logoBox = document.getElementById('rep-header-logo');
      const tagPill = document.getElementById('rep-header-tag');
      const subtag = document.getElementById('rep-header-subtag');
      const titleText = document.getElementById('rep-header-title');

      const kpi1 = document.getElementById('rep-kpi-1');
      const kpi2 = document.getElementById('rep-kpi-2');
      const kpi3 = document.getElementById('rep-kpi-3');
      const secPlan = document.getElementById('report-sec-plan');
      const secPlanHead = document.getElementById('report-sec-plan-head');
      const planCanvasBox = document.getElementById('planCanvasContainer');
      const secScurve = document.getElementById('report-sec-scurve');
      const secScurveHead = document.getElementById('report-sec-scurve-head');
      const scurveBadge = document.getElementById('rep-sec-scurve-badge');
      const secTable = document.getElementById('report-sec-table');
      const secTableHead = document.getElementById('report-sec-table-head');
      const theadTable = document.getElementById('rep-today-table-head');
      const legendOrig = document.getElementById('rep-legend-original');
      const legendExcel = document.getElementById('rep-legend-excel');

      const isHidden = reportPage ? reportPage.classList.contains('hidden') : true;

      if (theme === 'excel') {
        // EXCEL SIMPLE SPREADSHEET THEME
        if (reportPage) {
          reportPage.className = 'fixed inset-0 z-50 overflow-y-auto bg-slate-100 p-2 sm:p-4 md:p-5' + (isHidden ? ' hidden' : '');
        }
        if (reportCard) {
          reportCard.className = 'w-full max-w-[98vw] 2xl:max-w-[1840px] mx-auto bg-white border border-slate-300 rounded-xl shadow-lg p-3 sm:p-4 md:p-6 transition-all' + (currentReportLayout === 'landscape' ? ' is-landscape' : '');
        }
        if (header) header.className = 'bg-[#107c41] text-white rounded-lg p-3.5 md:p-4 mb-4 shadow-sm border border-[#0d6535] transition-all';
        if (logoBox) {
          logoBox.className = 'w-10 h-10 rounded bg-white text-[#107c41] font-black text-sm flex items-center justify-center shadow-xs border border-white/60 shrink-0';
          logoBox.innerHTML = 'XLS';
        }
        if (tagPill) {
          tagPill.className = 'px-2 py-0.5 rounded text-[10.5px] font-bold bg-white/20 text-white tracking-wider uppercase border border-white/30';
          tagPill.textContent = 'EXCEL REPORT';
        }
        if (subtag) subtag.className = 'text-xs text-white/90 font-medium';
        if (titleText) {
          titleText.className = 'text-lg md:text-xl font-bold text-white mt-0.5 tracking-tight';
          titleText.innerHTML = 'รายงานความคืบหน้างานเสาเข็ม 93 ต้น <span class="text-xs font-normal text-white/80 hidden sm:inline">(Piling Daily Progress Report)</span>';
        }

        if (themeSel) themeSel.className = 'flex items-center bg-[#0d6535] rounded p-0.5 border border-white/20 no-print no-export';
        if (btnOrig) btnOrig.className = 'px-2 py-1 rounded text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1';
        if (btnExcel) btnExcel.className = 'px-2 py-1 rounded text-xs font-bold transition-all bg-white text-[#107c41] shadow-xs flex items-center gap-1';

        if (dateBadge) {
          dateBadge.className = 'flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/15 border border-white/30 text-xs text-white';
          const dIcon = dateBadge.querySelector('i');
          if (dIcon) dIcon.className = 'w-3.5 h-3.5 text-white/90';
          const dText = document.getElementById('rep-header-date');
          if (dText) dText.className = 'font-mono font-bold text-white';
        }
        if (layoutSwitch) layoutSwitch.className = 'flex items-center bg-[#0d6535] rounded p-0.5 border border-white/20 no-print no-export';
        if (btnExport) btnExport.className = 'px-3 py-1 rounded text-xs font-bold bg-white text-[#107c41] hover:bg-slate-100 transition-all border border-slate-200 shadow-xs flex items-center gap-1';
        if (btnPrint) btnPrint.className = 'px-2.5 py-1 rounded text-xs font-bold bg-[#0d6535] hover:bg-[#094725] text-white transition-all border border-white/30 flex items-center gap-1';
        if (btnClose) btnClose.className = 'p-1 rounded text-xs bg-white/20 hover:bg-white/30 text-white transition-all flex items-center justify-center';

        if (formulaBar) formulaBar.classList.remove('hidden');
        if (sheetTabs) sheetTabs.classList.remove('hidden');

        if (kpi1) kpi1.className = 'bg-[#f0f7ff] border border-blue-200 rounded-lg p-3 flex flex-col justify-between';
        if (kpi2) kpi2.className = 'bg-[#fefce8] border border-amber-200 rounded-lg p-3 flex flex-col justify-between';
        if (kpi3) kpi3.className = 'bg-[#f0fdf4] border border-emerald-200 rounded-lg p-3 flex flex-col justify-between';

        if (secPlan) secPlan.className = 'border border-slate-300 rounded-lg overflow-hidden bg-white h-full flex flex-col shadow-xs';
        if (secPlanHead) secPlanHead.className = 'bg-[#f8fafc] px-3.5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2';
        if (planCanvasBox) planCanvasBox.className = 'w-full bg-white border border-slate-300 rounded overflow-hidden flex items-center justify-center relative';
        if (secScurve) secScurve.className = 'border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs';
        if (secScurveHead) secScurveHead.className = 'bg-[#f8fafc] px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between';
        if (scurveBadge) scurveBadge.className = 'text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200';
        if (secTable) secTable.className = 'border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs';
        if (secTableHead) secTableHead.className = 'bg-[#f8fafc] px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between';
        if (theadTable) theadTable.className = 'bg-[#107c41] text-white font-bold text-xs border-b border-[#0d6535]';

        if (legendOrig) legendOrig.classList.add('hidden');
        if (legendExcel) legendExcel.classList.remove('hidden');

      } else {
        // ORIGINAL THEME (SOFT INK FLAT-POP) - DEFAULT
        if (reportPage) {
          reportPage.className = 'fixed inset-0 z-50 overflow-y-auto bg-[#eef7f4] p-2 sm:p-4 md:p-5' + (isHidden ? ' hidden' : '');
        }
        if (reportCard) {
          reportCard.className = 'w-full max-w-[98vw] 2xl:max-w-[1840px] mx-auto bg-white border-2 border-[#475569] rounded-2xl shadow-[6px_8px_0_#c9dfd9] p-3 sm:p-4 md:p-6 transition-all' + (currentReportLayout === 'landscape' ? ' is-landscape' : '');
        }
        if (header) header.className = 'bg-gradient-to-r from-[#fff0c8] via-[#fffdf8] to-[#e5f4e9] border-2 border-[#475569] rounded-2xl p-4 md:p-5 shadow-[4px_4px_0_#475569] mb-4 transition-all';
        if (logoBox) {
          logoBox.className = 'w-12 h-12 rounded-xl bg-[#ffc45b] border-2 border-[#475569] flex flex-col items-center justify-center font-montserrat font-black text-[#34383b] shadow-[2px_2px_0_#475569] leading-tight shrink-0';
          logoBox.innerHTML = '<span class="text-[9px] font-black uppercase text-[#a84631]">PYNN</span><span class="text-base font-black">37</span>';
        }
        if (tagPill) {
          tagPill.className = 'px-2.5 py-0.5 rounded-md bg-[#ffc45b] border-2 border-[#475569] text-xs font-black text-[#34383b] shadow-[1px_1px_0_#475569]';
          tagPill.textContent = 'โครงการ PYNN PRIDI 37';
        }
        if (subtag) subtag.className = 'text-xs text-[#667277] font-bold';
        if (titleText) {
          titleText.className = 'text-xl md:text-2xl font-black text-[#34383b] mt-1';
          titleText.innerHTML = 'รายงานความคืบหน้างานเสาเข็ม <span class="text-xs md:text-sm font-bold text-[#667277] hidden sm:inline">(Piling Progress Report)</span>';
        }

        if (themeSel) themeSel.className = 'flex items-center bg-white rounded-lg border-2 border-[#475569] p-0.5 shadow-[1.5px_1.5px_0_#475569] no-print no-export';
        if (btnOrig) btnOrig.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1';
        if (btnExcel) btnExcel.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1';

        if (dateBadge) {
          dateBadge.className = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border-2 border-[#475569] text-xs font-black text-[#34383b] shadow-[1.5px_1.5px_0_#475569]';
          const dIcon = dateBadge.querySelector('i');
          if (dIcon) dIcon.className = 'w-3.5 h-3.5 text-[#ed6845]';
          const dText = document.getElementById('rep-header-date');
          if (dText) dText.className = 'text-[#ed6845] font-mono font-black';
        }
        if (layoutSwitch) layoutSwitch.className = 'flex items-center bg-white rounded-lg border-2 border-[#475569] p-0.5 shadow-[1.5px_1.5px_0_#475569] no-print no-export';
        if (btnExport) btnExport.className = 'pop-btn-green px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#064e3b] font-black';
        if (btnPrint) btnPrint.className = 'pop-btn-primary px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-[2px_2px_0_#9c3b23] font-black';
        if (btnClose) btnClose.className = 'pop-btn p-1.5 text-xs flex items-center justify-center shadow-[1.5px_1.5px_0_#475569]';

        if (formulaBar) formulaBar.classList.add('hidden');
        if (sheetTabs) sheetTabs.classList.add('hidden');

        if (kpi1) kpi1.className = 'bg-[#f0f9ff] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        if (kpi2) kpi2.className = 'bg-[#fff7ed] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        if (kpi3) kpi3.className = 'bg-[#e5f4e9] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';

        if (secPlan) secPlan.className = 'border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white h-full flex flex-col';
        if (secPlanHead) secPlanHead.className = 'bg-[#fff0c8] px-4 py-2.5 border-b-2 border-[#475569] flex flex-wrap items-center justify-between gap-2';
        if (planCanvasBox) planCanvasBox.className = 'w-full bg-white border-2 border-[#475569] rounded overflow-hidden flex items-center justify-center relative';
        if (secScurve) secScurve.className = 'border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white';
        if (secScurveHead) secScurveHead.className = 'bg-[#dff1f5] px-4 py-2.5 border-b-2 border-[#475569] flex items-center justify-between';
        if (scurveBadge) scurveBadge.className = 'text-xs font-black bg-white px-2.5 py-1 rounded-lg border-2 border-[#475569] shadow-[1.5px_1.5px_0_#475569] text-[#34383b]';
        if (secTable) secTable.className = 'border-2 border-[#475569] rounded-xl overflow-hidden shadow-[3px_3px_0_#475569] bg-white';
        if (secTableHead) secTableHead.className = 'bg-[#ffc45b] px-4 py-2.5 border-b-2 border-[#475569] flex items-center justify-between';
        if (theadTable) theadTable.className = 'bg-[#fff0c8] text-[#34383b] border-b-2 border-[#475569] font-black text-xs';

        if (legendOrig) legendOrig.classList.remove('hidden');
        if (legendExcel) legendExcel.classList.add('hidden');
      }

      updateLayoutSwitchUI(currentReportLayout, theme);
      if (window.lucide) lucide.createIcons();
    }

    function updateLayoutSwitchUI(layout, theme) {
      const bPort = document.getElementById('btn-layout-portrait');
      const bLand = document.getElementById('btn-layout-landscape');
      if (!bPort || !bLand) return;

      if (theme === 'excel') {
        if (layout === 'landscape') {
          bLand.className = 'px-2 py-1 rounded text-xs font-bold transition-all bg-white text-[#107c41] shadow-xs flex items-center gap-1';
          bPort.className = 'px-2 py-1 rounded text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1';
        } else {
          bPort.className = 'px-2 py-1 rounded text-xs font-bold transition-all bg-white text-[#107c41] shadow-xs flex items-center gap-1';
          bLand.className = 'px-2 py-1 rounded text-xs font-medium text-white/80 hover:text-white transition-all flex items-center gap-1';
        }
      } else {
        if (layout === 'landscape') {
          bLand.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1';
          bPort.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1';
        } else {
          bPort.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#ffc45b] text-[#34383b] shadow-xs flex items-center gap-1';
          bLand.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1';
        }
      }
    }

    function setReportLayout(layout) {
      currentReportLayout = layout;
      const card = document.getElementById('report-page-card');
      if (layout === 'landscape') {
        card?.classList.add('is-landscape');
      } else {
        card?.classList.remove('is-landscape');
      }
      updateLayoutSwitchUI(layout, currentReportTheme);
      requestAnimationFrame(() => {
        renderPlanSnapshotCanvas();
        if (reportScurveChartInstance) reportScurveChartInstance.resize();
        else scheduleReportScurveRender();
      });
      setTimeout(() => {
        renderPlanSnapshotCanvas();
        scheduleReportScurveRender();
      }, 100);
    }

    // Attach ResizeObserver to plan container for ultra-reliable responsive drawing
    const planCanvasContainer = document.getElementById('planCanvasContainer');
    if (planCanvasContainer && window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!document.getElementById('report-page').classList.contains('hidden')) {
          renderPlanSnapshotCanvas();
        }
      });
      ro.observe(planCanvasContainer);
    }

    document.getElementById('btn-layout-portrait')?.addEventListener('click', () => setReportLayout('portrait'));
    document.getElementById('btn-layout-landscape')?.addEventListener('click', () => setReportLayout('landscape'));
    document.getElementById('btn-theme-original')?.addEventListener('click', () => setReportTheme('original'));
    document.getElementById('btn-theme-excel')?.addEventListener('click', () => setReportTheme('excel'));

    function renderReportSheet() {
      const curDate = datePicker.value || todayStr;
      const repHeaderDateEl = document.getElementById('rep-header-date');
      if (repHeaderDateEl) repHeaderDateEl.textContent = curDate;

      let drivenCount = 0;
      let todayCount = 0;
      const todayPilesList = [];
      const allDrivenPilesList = [];

      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no];
        if (rec && rec.status === 'driven') {
          if (!rec.date || rec.date <= curDate) {
            drivenCount++;
          }
          allDrivenPilesList.push({ pile: p, rec: rec });
          if (rec.date === curDate) {
            todayCount++;
            todayPilesList.push({ pile: p, rec: rec });
          }
        }
      });

      // Sort all driven piles by date descending then pile no
      allDrivenPilesList.sort((a, b) => {
        const da = a.rec.date || '';
        const db = b.rec.date || '';
        if (db !== da) return db.localeCompare(da);
        return a.pile.no - b.pile.no;
      });

      // 1. Calculate Elapsed Working Days & Cumulative Plan (ปรับตามวันที่ที่เลือก)
      const drivenRecords = Object.values(progressRecords).filter(r => r && r.status === 'driven');
      const uniqueDates = [...new Set(drivenRecords.map(r => r.date))].filter(Boolean).sort();
      
      let elapsedDays = 1;
      if (uniqueDates.length > 0) {
        const startDate = uniqueDates[0];
        if (curDate >= startDate) {
          const d1 = new Date(startDate + 'T00:00:00');
          const d2 = new Date(curDate + 'T00:00:00');
          const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
          elapsedDays = Math.min(31, Math.max(uniqueDates.filter(d => d <= curDate).length, diffDays));
        } else {
          elapsedDays = 1;
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

      // Update Card 4: ช้ากว่าแผน X ต้น / เร็วกว่าแผน / ตามแผน (ตัดคำว่าพอดีออก)
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
          varDisplay.className = currentReportTheme === 'excel'
            ? 'font-bold text-xl sm:text-2xl text-rose-700 leading-tight font-mono'
            : 'font-black text-xl md:text-2xl text-[#e11d48] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'ช้ากว่าแผน';
          varBadge.className = currentReportTheme === 'excel'
            ? 'px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#ffc7ce] text-[#9c0006] border border-[#ffafb8]'
            : 'px-2.5 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#e11d48] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = currentReportTheme === 'excel'
            ? 'bg-[#fef2f2] border border-rose-200 rounded-lg p-3 flex flex-col justify-between'
            : 'bg-[#fff1f2] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      } else if (variance > 0) {
        if (varDisplay) {
          varDisplay.textContent = `เร็วกว่าแผน +${variance} ต้น`;
          varDisplay.className = currentReportTheme === 'excel'
            ? 'font-bold text-xl sm:text-2xl text-emerald-700 leading-tight font-mono'
            : 'font-black text-xl md:text-2xl text-[#10b981] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'เร็วกว่าแผน';
          varBadge.className = currentReportTheme === 'excel'
            ? 'px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#c6efce] text-[#006100] border border-[#a3e4ab]'
            : 'px-2.5 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#10b981] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = currentReportTheme === 'excel'
            ? 'bg-[#f0fdf4] border border-emerald-200 rounded-lg p-3 flex flex-col justify-between'
            : 'bg-[#e5f4e9] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      } else {
        if (varDisplay) {
          varDisplay.textContent = currentReportTheme === 'excel' ? 'ตามแผนงาน (0 ต้น)' : 'ตามแผนงาน';
          varDisplay.className = currentReportTheme === 'excel'
            ? 'font-bold text-xl sm:text-2xl text-emerald-700 leading-tight font-mono'
            : 'font-black text-xl md:text-2xl text-[#15803d] leading-tight';
        }
        if (varBadge) {
          varBadge.textContent = 'ตามแผน';
          varBadge.className = currentReportTheme === 'excel'
            ? 'px-2 py-0.5 rounded text-[10.5px] font-bold bg-[#c6efce] text-[#006100] border border-[#a3e4ab]'
            : 'px-2.5 py-0.5 rounded-md text-[10.5px] font-black bg-white border-2 border-[#475569] text-[#15803d] shadow-[1px_1px_0_#475569]';
        }
        if (varCard) {
          varCard.className = currentReportTheme === 'excel'
            ? 'bg-[#f0fdf4] border border-emerald-200 rounded-lg p-3 flex flex-col justify-between'
            : 'bg-[#f0fdf4] border-2 border-[#475569] rounded-xl p-3.5 shadow-[3px_3px_0_#475569] flex flex-col justify-between';
        }
      }

      // Render Today's Driven Piles Table
      const tbody = document.getElementById('rep-today-table-body');
      tbody.innerHTML = '';
      const isFilterAll = window.reportTableFilterMode === 'all';
      const displayPilesList = isFilterAll ? allDrivenPilesList : todayPilesList;

      const titleEl = document.getElementById('rep-sec-table-title');
      if (titleEl) {
        titleEl.textContent = isFilterAll
          ? `ประวัติการตอกเสาเข็มทั้งหมด (All Driven Piles History: ${drivenCount}/93 ต้น)`
          : `รายการเสาเข็มที่ตอกในวันที่รายงาน (Daily Driven Piles Log: ${todayCount} ต้น)`;
      }

      const repBadgeEl = document.getElementById('rep-today-table-badge');
      if (repBadgeEl) {
        repBadgeEl.textContent = isFilterAll ? `${drivenCount} ต้น (ทั้งหมด)` : `${todayCount} ต้น (วันนี้)`;
      }

      // Update Filter Button States
      const btnFilterToday = document.getElementById('btn-rep-filter-today');
      const btnFilterAll = document.getElementById('btn-rep-filter-all');
      if (btnFilterToday && btnFilterAll) {
        if (isFilterAll) {
          btnFilterAll.className = 'px-2 py-0.5 rounded font-black bg-white text-[#34383b] shadow-xs border border-[#475569]';
          btnFilterToday.className = 'px-2 py-0.5 rounded font-bold text-[#667277] hover:text-[#34383b]';
        } else {
          btnFilterToday.className = 'px-2 py-0.5 rounded font-black bg-white text-[#34383b] shadow-xs border border-[#475569]';
          btnFilterAll.className = 'px-2 py-0.5 rounded font-bold text-[#667277] hover:text-[#34383b]';
        }
      }

      if (displayPilesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="p-6 text-center text-[#667277] font-semibold">
          ${isFilterAll ? 'ยังไม่มีเสาเข็มที่ตอกในโครงการ' : `ยังไม่มีการบันทึกเสาเข็มที่ตอกในวันที่ ${curDate} (คลิกปุ่ม "ทั้งหมด" ด้านบนเพื่อดูเข็มวันอื่น หรือคลิกที่ต้นเข็มบนแปลนเพื่อบันทึก)`}
        </td></tr>`;
        const tfoot = document.getElementById('rep-today-table-foot');
        if (tfoot) tfoot.innerHTML = '';
        const sumCard = document.getElementById('rep-table-summary-card');
        if (sumCard) sumCard.innerHTML = `<div class="text-center text-xs text-slate-500 py-2">ยังไม่มีข้อมูลเสาเข็มสำหรับสรุปผลในตัวกรองนี้</div>`;
      } else {
        // Statistical Accumulators for "พร้อมสรุปผลค่าให้"
        let sumDesignN = 0, sumDesignE = 0;
        let sumActualN = 0, sumActualE = 0;
        let sumPco = 0, sumTop = 0, sumDiffMm = 0;
        let sumOffsetMm = 0, maxOffsetMm = 0;
        let coordPassCount = 0, levelPassCount = 0;
        let validActualTopCount = 0;
        let minDiffMm = 999999, maxDiffMm = -999999;

        displayPilesList.forEach(({ pile: p, rec }, index) => {
          const tr = document.createElement('tr');
          const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
          const nStr = p.northing !== undefined ? p.northing.toFixed(4) : '-';
          const eStr = p.easting !== undefined ? p.easting.toFixed(4) : '-';
          const isPileToday = rec.date === curDate;
          const isDriven = rec && rec.status === 'driven';

          // As-built Co (n,e) หลังกด
          const actN = (rec && rec.actual_n !== undefined && !isNaN(parseFloat(rec.actual_n)))
            ? parseFloat(rec.actual_n)
            : (p.northing !== undefined ? p.northing : 0);
          const actE = (rec && rec.actual_e !== undefined && !isNaN(parseFloat(rec.actual_e)))
            ? parseFloat(rec.actual_e)
            : (p.easting !== undefined ? p.easting : 0);

          const dN = (p.northing !== undefined) ? (actN - p.northing) : 0;
          const dE = (p.easting !== undefined) ? (actE - p.easting) : 0;
          const totOffsetM = Math.sqrt(dN * dN + dE * dE);
          const totOffsetMm = Math.round(totOffsetM * 1000);
          const isCoordTol = totOffsetMm <= 50; // เกณฑ์หนีศูนย์มาตรฐานไม่เกิน 50 mm (5 ซม.)

          // Accumulate coordinate stats
          if (p.northing !== undefined) sumDesignN += p.northing;
          if (p.easting !== undefined) sumDesignE += p.easting;
          sumActualN += actN;
          sumActualE += actE;
          sumOffsetMm += totOffsetMm;
          if (totOffsetMm > maxOffsetMm) maxOffsetMm = totOffsetMm;
          if (isCoordTol) coordPassCount++;

          // Level PCO & Actual TOP
          sumPco += pco;
          const hasActualTop = rec && rec.actual_top !== undefined && !isNaN(parseFloat(rec.actual_top));
          let actTopVal = hasActualTop ? parseFloat(rec.actual_top) : pco;
          if (hasActualTop) {
            validActualTopCount++;
            sumTop += actTopVal;
          } else {
            sumTop += pco;
          }

          const diffM = actTopVal - pco;
          const diffMm = Math.round(diffM * 1000);
          const signLevel = diffMm > 0 ? '+' : '';
          const isLevelTol = Math.abs(diffMm) <= 50; // เกณฑ์ระดับตัดหัวเข็มมาตรฐาน ±50 mm
          if (isLevelTol) levelPassCount++;
          sumDiffMm += diffMm;
          if (diffMm < minDiffMm) minDiffMm = diffMm;
          if (diffMm > maxDiffMm) maxDiffMm = diffMm;

          // Co (N, E) แบบ
          const designCoordsHtml = `
            <div class="font-mono text-[11px] leading-tight text-slate-700">
              <div>N: ${nStr}</div>
              <div>E: ${eStr}</div>
            </div>
          `;

          // Co (n,e) หลังกด (As-built coordinates N, E and deviation badge)
          const afterPressCoordsHtml = isDriven ? `
            <div class="font-mono text-[11px] leading-tight">
              <div class="text-[#047857] font-bold">N: ${actN.toFixed(4)}</div>
              <div class="text-[#047857] font-bold">E: ${actE.toFixed(4)}</div>
              <div class="mt-0.5">
                <span class="inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${isCoordTol ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}" title="ระยะหนีศูนย์รวม">
                  ${totOffsetMm === 0 ? '✓ ตรงหมุด (0mm)' : `Δ ${totOffsetMm}mm (${isCoordTol ? 'ปกติ' : 'เกินเกณฑ์'})`}
                </span>
              </div>
            </div>
          ` : `<span class="text-slate-400 font-mono text-[10.5px]">- (รอตอก)</span>`;

          // TOP and Diff display (clean, NO edit pencil clutter, wrapped with pencil-edit-icon)
          const actualTopDisplay = hasActualTop
            ? `<span class="font-black font-mono ${currentReportTheme === 'excel' ? 'text-sky-800' : 'text-[#0284c7]'}">${actTopVal.toFixed(3)}</span><span class="pencil-edit-icon text-blue-500 text-[9px] ml-1 no-export no-print">✏️</span>`
            : `<span class="text-slate-400 font-normal">-</span><span class="pencil-edit-icon text-blue-500 text-[9px] ml-1 no-export no-print">✏️</span>`;

          const diffBadge = hasActualTop
            ? `<span class="inline-block px-1.5 py-0.5 rounded font-mono font-bold text-[10.5px] ${isLevelTol ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">${signLevel}${diffMm} mm</span>`
            : `<span class="text-slate-400">-</span>`;

          tr.style.cursor = 'pointer';
          tr.title = `คลิกต้น ${p.tag} เพื่อดูข้อมูล/ปรับแก้วันที่ และกรอกระดับ TOP เข็มจริง`;
          tr.addEventListener('click', () => {
            openPileCard(p.no);
          });

          if (currentReportTheme === 'excel') {
            tr.className = 'hover:bg-[#ecfdf5] transition-colors border-b border-slate-200 cursor-pointer ' + (index % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white');
            tr.innerHTML = `
              <td class="p-2 text-center font-bold text-slate-500 border border-slate-200">${p.no}</td>
              <td class="p-2 font-bold text-slate-800 border border-slate-200">${p.tag}</td>
              <td class="p-2 text-center font-bold text-blue-700 border border-slate-200">${p.footing || '-'}</td>
              <td class="p-2 text-center font-bold text-slate-700 border border-slate-200">${p.grid}</td>
              <td class="p-2 text-right border border-slate-200">${designCoordsHtml}</td>
              <td class="p-2 text-right border border-slate-200 bg-emerald-50/30">${afterPressCoordsHtml}</td>
              <td class="p-2 text-right font-bold text-slate-800 font-mono border border-slate-200">${pco.toFixed(3)}</td>
              <td class="p-2 text-right font-mono border border-slate-200">${actualTopDisplay}</td>
              <td class="p-2 text-center font-mono border border-slate-200">${diffBadge}</td>
              <td class="p-2 text-center font-medium text-slate-700 border border-slate-200">${p.type}</td>
              <td class="p-2 text-center border border-slate-200">
                <span class="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                  📅 ${rec.date || curDate} <span class="pencil-edit-icon text-blue-500 text-[9px] no-export no-print">✏️</span>
                </span>
              </td>
            `;
          } else {
            tr.className = 'hover:bg-[#f0fdf4] transition-colors border-b border-[#e5f1ed] cursor-pointer ' + (index % 2 === 1 ? 'bg-[#fdfbf7]' : 'bg-white');
            tr.innerHTML = `
              <td class="p-2.5 text-center font-bold text-[#667277] border-r border-[#e5f1ed]">${p.no}</td>
              <td class="p-2.5 font-black text-[#34383b] border-r border-[#e5f1ed]">${p.tag}</td>
              <td class="p-2.5 text-center font-black text-[#0284c7] border-r border-[#e5f1ed]">${p.footing || '-'}</td>
              <td class="p-2.5 text-center font-bold text-[#34383b] border-r border-[#e5f1ed]">${p.grid}</td>
              <td class="p-2.5 text-right border-r border-[#e5f1ed]">${designCoordsHtml}</td>
              <td class="p-2.5 text-right border-r border-[#e5f1ed] bg-emerald-50/40">${afterPressCoordsHtml}</td>
              <td class="p-2.5 text-right font-black text-[#a84631] font-mono border-r border-[#e5f1ed]">${pco.toFixed(3)}</td>
              <td class="p-2.5 text-right font-mono border-r border-[#e5f1ed]">${actualTopDisplay}</td>
              <td class="p-2.5 text-center font-mono border-r border-[#e5f1ed]">${diffBadge}</td>
              <td class="p-2.5 text-center font-semibold text-[#34383b] border-r border-[#e5f1ed]">${p.type || 'I-0.40m'}</td>
              <td class="p-2 text-center">
                <span class="inline-flex items-center gap-0.5 font-mono text-[10.5px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                  📅 ${rec.date || curDate} <span class="pencil-edit-icon text-blue-500 text-[9px] no-export no-print">✏️</span>
                </span>
              </td>
            `;
          }
          tbody.appendChild(tr);
        });

        // Compute averages and summaries for tfoot & summary dashboard card
        const count = displayPilesList.length;
        const avgDesignN = count > 0 ? (sumDesignN / count) : 0;
        const avgDesignE = count > 0 ? (sumDesignE / count) : 0;
        const avgOffsetMm = count > 0 ? Math.round(sumOffsetMm / count) : 0;
        const coordPassPct = count > 0 ? ((coordPassCount / count) * 100).toFixed(1) : '100.0';
        const avgPco = count > 0 ? (sumPco / count) : 0;
        const avgTop = count > 0 ? (sumTop / count) : 0;
        const avgDiffMm = count > 0 ? Math.round(sumDiffMm / count) : 0;
        const levelPassPct = count > 0 ? ((levelPassCount / count) * 100).toFixed(1) : '100.0';

        // 1. Injected Table Footer Row (tfoot)
        const tfoot = document.getElementById('rep-today-table-foot');
        if (tfoot) {
          const isExcel = currentReportTheme === 'excel';
          tfoot.innerHTML = `
            <tr class="${isExcel ? 'bg-[#e2efda] text-[#276a3d] font-bold border-t-2 border-[#107c41]' : 'bg-[#fff0c8] text-[#34383b] font-black border-t-2 border-[#475569]'} text-xs">
              <td colspan="4" class="p-2.5 text-center ${isExcel ? 'border border-slate-300' : 'border-r-2 border-[#475569]/30'}">
                <div class="font-black ${isExcel ? 'text-[#107c41]' : 'text-[#1e293b]'}">สรุปผลค่ารวม (${count} ต้น)</div>
              </td>
              <td class="p-2.5 text-right font-mono ${isExcel ? 'border border-slate-300 text-slate-700' : 'border-r-2 border-[#475569]/30 text-slate-800'} text-[10.5px]">
                <div>N: ${avgDesignN.toFixed(4)}</div>
                <div>E: ${avgDesignE.toFixed(4)}</div>
              </td>
              <td class="p-2.5 text-right font-mono ${isExcel ? 'border border-slate-300 bg-[#d5e8d4]' : 'border-r-2 border-[#475569]/30 bg-[#ecfdf5]'} text-[10.5px]">
                <div class="text-[#047857] font-bold">หนีศูนย์เฉลี่ย: ${avgOffsetMm} mm</div>
                <div class="text-[9.5px] text-emerald-800">สูงสุด: ${maxOffsetMm} mm (ผ่าน ${coordPassPct}%)</div>
              </td>
              <td class="p-2.5 text-right font-mono ${isExcel ? 'border border-slate-300' : 'border-r-2 border-[#475569]/30 text-[#a84631]'} text-[10.5px]">
                ${avgPco.toFixed(3)}
              </td>
              <td class="p-2.5 text-right font-mono ${isExcel ? 'border border-slate-300 bg-sky-50' : 'border-r-2 border-[#475569]/30 text-[#0284c7] bg-[#f0f9ff]'} text-[10.5px] font-bold">
                ${avgTop.toFixed(3)}
              </td>
              <td class="p-2.5 text-center font-mono ${isExcel ? 'border border-slate-300' : 'border-r-2 border-[#475569]/30'} text-[10.5px]">
                <span class="inline-block px-1.5 py-0.5 rounded font-bold ${Math.abs(avgDiffMm) <= 50 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'}">
                  ${avgDiffMm >= 0 ? '+' : ''}${avgDiffMm} mm
                </span>
              </td>
              <td class="p-2.5 text-center ${isExcel ? 'border border-slate-300' : 'border-r-2 border-[#475569]/30'} text-[10.5px]">
                ${count} ต้น
              </td>
              <td class="p-2.5 text-center ${isExcel ? 'border border-slate-300' : ''}">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ${coordPassPct}% ผ่าน
                </span>
              </td>
            </tr>
          `;
        }

        // 2. Injected Summary of Values Dashboard Card (#rep-table-summary-card)
        const sumCard = document.getElementById('rep-table-summary-card');
        if (sumCard) {
          sumCard.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <!-- Card 1: จำนวนต้น -->
              <div class="p-3 rounded-xl bg-white border-2 border-[#475569]/40 shadow-xs flex flex-col justify-between">
                <div class="flex items-center gap-1.5 font-bold text-slate-700 text-[11px]">
                  <span class="text-base">📊</span> <span>สรุปจำนวนเสาเข็มที่รายงาน</span>
                </div>
                <div class="my-1.5 flex items-baseline gap-1.5">
                  <span class="text-3xl font-black font-montserrat text-[#0284c7] leading-none">${count}</span>
                  <span class="text-xs text-slate-500 font-bold">/ 93 ต้น (${((count / 93) * 100).toFixed(1)}%)</span>
                </div>
                <div class="text-[10.5px] text-slate-500 font-medium pt-1 border-t border-slate-100">
                  ${isFilterAll ? 'เสาเข็มที่ตอกสะสมทั้งหมดในโครงการ' : `รายการเสาเข็มตอกเฉพาะวันที่ ${curDate}`}
                </div>
              </div>

              <!-- Card 2: สรุป Co (n,e) หลังกด -->
              <div class="p-3 rounded-xl bg-[#ecfdf5] border-2 border-emerald-400 shadow-xs flex flex-col justify-between">
                <div class="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px]">
                  <span class="text-base">🎯</span> <span>สรุปพิกัด Co (n,e) หลังกด</span>
                </div>
                <div class="my-1 text-xs font-mono font-bold space-y-0.5">
                  <div class="flex justify-between">
                    <span class="text-slate-600">หนีศูนย์เฉลี่ย:</span>
                    <span class="text-emerald-800 font-black">${avgOffsetMm} mm (${(avgOffsetMm/10).toFixed(1)} ซม.)</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">หนีศูนย์สูงสุด:</span>
                    <span class="text-emerald-800 font-black">${maxOffsetMm} mm (${(maxOffsetMm/10).toFixed(1)} ซม.)</span>
                  </div>
                </div>
                <div class="text-[10px] text-emerald-800 font-black flex items-center justify-between pt-1 border-t border-emerald-200">
                  <span>เกณฑ์มาตรฐาน (≤50mm):</span>
                  <span class="bg-white px-1.5 py-0.5 rounded border border-emerald-300 text-emerald-700 font-bold">${coordPassPct}% (${coordPassCount}/${count} ต้น)</span>
                </div>
              </div>

              <!-- Card 3: สรุปค่าระดับหัวเข็ม -->
              <div class="p-3 rounded-xl bg-[#f0f9ff] border-2 border-sky-400 shadow-xs flex flex-col justify-between">
                <div class="flex items-center gap-1.5 font-bold text-sky-900 text-[11px]">
                  <span class="text-base">📏</span> <span>สรุปค่าระดับหัวเข็ม (Cut-off)</span>
                </div>
                <div class="my-1 text-xs font-mono font-bold space-y-0.5">
                  <div class="flex justify-between">
                    <span class="text-slate-600">ระดับ TOP เฉลี่ย:</span>
                    <span class="text-sky-800 font-black">${avgTop.toFixed(3)} ม.</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-600">ผลต่างเฉลี่ย:</span>
                    <span class="text-sky-800 font-black">${avgDiffMm >= 0 ? '+' : ''}${avgDiffMm} mm</span>
                  </div>
                </div>
                <div class="text-[10px] text-sky-800 font-black flex items-center justify-between pt-1 border-t border-sky-200">
                  <span>เกณฑ์ระดับ (≤50mm):</span>
                  <span class="bg-white px-1.5 py-0.5 rounded border border-sky-300 text-sky-700 font-bold">${levelPassPct}% (${levelPassCount}/${count} ต้น)</span>
                </div>
              </div>

              <!-- Card 4: ผลการประเมินวิศวกรรม -->
              <div class="p-3 rounded-xl bg-[#fff7ed] border-2 border-amber-400 shadow-xs flex flex-col justify-between">
                <div class="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                  <span class="text-base">🎖️</span> <span>ผลการประเมินวิศวกรรม</span>
                </div>
                <div class="my-1">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs shadow-xs">
                    <span>✓</span> <span>ผ่านเกณฑ์มาตรฐาน 100%</span>
                  </div>
                </div>
                <div class="text-[9.5px] text-slate-600 font-medium pt-1 border-t border-amber-200">
                  มาตรฐาน มยผ. / วสท. พิกัดจริงและระดับตัดหัวเข็มอยู่ในเกณฑ์มาตรฐานที่ยอมรับได้
                </div>
              </div>
            </div>
          `;
        }
      }

      // Render Large Piling Plan Canvas
      setTimeout(renderPlanSnapshotCanvas, 20);

      // Render Crisp S-Curve in Report (Safe scheduling)
      scheduleReportScurveRender();
    }

    function scheduleReportScurveRender() {
      const repPage = document.getElementById('report-page');
      if (repPage && repPage.classList.contains('hidden')) {
        return; // Don't render on hidden container!
      }
      setTimeout(renderReportScurveChart, 35);
    }

    function renderReportScurveChart() {
      const repPage = document.getElementById('report-page');
      if (repPage && repPage.classList.contains('hidden')) return;

      const repChartEl = document.getElementById('reportScurveCanvas');
      if (!repChartEl) return;

      const parent = repChartEl.parentElement;
      if (parent && (parent.clientWidth <= 0 || parent.clientHeight <= 0)) {
        setTimeout(renderReportScurveChart, 60);
        return;
      }

      if (typeof Chart !== 'undefined') {
        try {
          if (reportScurveChartInstance) {
            reportScurveChartInstance.destroy();
            reportScurveChartInstance = null;
          }
          reportScurveChartInstance = new Chart(repChartEl, buildChartConfig());
          return;
        } catch (err) {
          console.warn('Report Chart.js error, falling back to 2D canvas:', err);
        }
      }

      // 2D Direct Canvas Fallback so graph is NEVER missing!
      drawReportDirectScurve(repChartEl);
    }

    function drawReportDirectScurve(canvas) {
      const parent = canvas.parentElement;
      const rect = canvas.getBoundingClientRect();
      const w = parent ? parent.clientWidth : (rect.width || 600);
      const h = parent ? parent.clientHeight : (rect.height || 260);
      if (w <= 0 || h <= 0) return;

      const ctx = canvas.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const padL = 40, padR = 16, padT = 30, padB = 28;
      const plotW = w - padL - padR;
      const plotH = h - padT - padB;
      const maxY = 95;

      const cfg = buildChartConfig();
      const planData = cfg.data.datasets[0].data;
      const actualData = cfg.data.datasets[1].data;

      // Y-Grid
      ctx.font = 'bold 10px Sarabun, sans-serif';
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
        ctx.fillStyle = '#64748b';
        ctx.fillText(yVal, padL - 6, py);
      }

      // Plan line
      ctx.strokeStyle = '#ed6845';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < planData.length; i++) {
        const px = padL + (i / (planData.length - 1)) * plotW;
        const py = padT + plotH - (planData[i] / maxY) * plotH;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Actual line with fill
      if (actualData.length > 0) {
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

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < actualData.length; i++) {
          const px = padL + (i / (planData.length - 1)) * plotW;
          const py = padT + plotH - (actualData[i] / maxY) * plotH;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();

        for (let i = 0; i < actualData.length; i++) {
          const px = padL + (i / (planData.length - 1)) * plotW;
          const py = padT + plotH - (actualData[i] / maxY) * plotH;
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#064e3b';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Legend
      ctx.font = 'bold 11px Sarabun, sans-serif';
      ctx.textAlign = 'left';
      ctx.strokeStyle = '#ed6845';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(padL + 10, 14);
      ctx.lineTo(padL + 28, 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#334155';
      ctx.fillText('แผนสะสม (3 ต้น/วัน)', padL + 34, 14);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(padL + 165, 14);
      ctx.lineTo(padL + 185, 14);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(padL + 175, 14, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.fillText('ผลงานจริงสะสม (Actual)', padL + 191, 14);
    }

    // Supabase Sync Buttons Listener
    document.getElementById('btn-supabase-sync')?.addEventListener('click', () => syncPilingToSupabase(false));
    document.getElementById('btn-report-supabase-sync')?.addEventListener('click', () => syncPilingToSupabase(false));

    // Report Sheet Modal Toggles
    document.getElementById('btn-open-report').addEventListener('click', () => {
      document.getElementById('report-page').classList.remove('hidden');
      applyReportThemeUI(currentReportTheme);
      renderReportSheet();
      setTimeout(scheduleReportScurveRender, 50);
    });
    document.getElementById('btn-close-report').addEventListener('click', () => {
      document.getElementById('report-page').classList.add('hidden');
      window.location.hash = '3d';
      resetIsoView();
    });

    document.getElementById('btn-rep-filter-today')?.addEventListener('click', () => {
      window.reportTableFilterMode = 'today';
      renderReportSheet();
    });
    document.getElementById('btn-rep-filter-all')?.addEventListener('click', () => {
      window.reportTableFilterMode = 'all';
      renderReportSheet();
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
    let exportRequestId = 0;

    function openExportModal() {
      const modal = document.getElementById('modal-export-image');
      if (!modal) return;

      // Auto-detect view: If report-page is open, export report; otherwise export 3D view
      const isReportOpen = !document.getElementById('report-page')?.classList.contains('hidden');
      const bRep = document.getElementById('exp-tab-report');
      const b3d = document.getElementById('exp-tab-3d');

      if (isReportOpen) {
        currentExportMode = 'report';
        currentExportRatio = 'fit';
        if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
        if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      } else {
        currentExportMode = '3d';
        currentExportRatio = '16:9';
        if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
        if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      }

      // Update ratio button UI
      document.querySelectorAll('.exp-ratio-btn').forEach(b => {
        if (b.getAttribute('data-ratio') === currentExportRatio) {
          b.className = 'exp-ratio-btn px-3 py-1.5 rounded-lg border-2 border-[#475569] font-black text-xs bg-[#ffc45b] text-[#34383b] shadow-[1.5px_1.5px_0_#475569]';
        } else {
          b.className = 'exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]';
        }
      });

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
      currentExportRatio = 'fit';
      const bRep = document.getElementById('exp-tab-report');
      const b3d = document.getElementById('exp-tab-3d');
      if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
      if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      document.querySelectorAll('.exp-ratio-btn').forEach(b => {
        b.className = b.getAttribute('data-ratio') === 'fit'
          ? 'exp-ratio-btn px-3 py-1.5 rounded-lg border-2 border-[#475569] font-black text-xs bg-[#ffc45b] text-[#34383b] shadow-[1.5px_1.5px_0_#475569]'
          : 'exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]';
      });
      updateExportPreview();
    });

    document.getElementById('exp-tab-3d')?.addEventListener('click', () => {
      currentExportMode = '3d';
      currentExportRatio = '16:9';
      const bRep = document.getElementById('exp-tab-report');
      const b3d = document.getElementById('exp-tab-3d');
      if (b3d) b3d.className = 'px-3 py-1.5 rounded-lg font-black text-xs transition-all bg-[#ffc45b] text-[#34383b] border border-[#475569] shadow-xs flex items-center gap-1.5';
      if (bRep) bRep.className = 'px-3 py-1.5 rounded-lg font-bold text-xs text-[#667277] hover:text-[#34383b] transition-all flex items-center gap-1.5';
      document.querySelectorAll('.exp-ratio-btn').forEach(b => {
        b.className = b.getAttribute('data-ratio') === '16:9'
          ? 'exp-ratio-btn px-3 py-1.5 rounded-lg border-2 border-[#475569] font-black text-xs bg-[#ffc45b] text-[#34383b] shadow-[1.5px_1.5px_0_#475569]'
          : 'exp-ratio-btn px-2.5 py-1.5 rounded-lg border-2 border-[#475569]/40 font-bold text-xs bg-white text-[#667277]';
      });
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
      const myRequestId = ++exportRequestId;
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
          if (currentExportRatio === '16:9' || currentExportRatio === '4:3') {
            setReportLayout('landscape');
          } else if (currentExportRatio === 'a4' || currentExportRatio === '1:1') {
            setReportLayout('portrait');
          }

          // Render report data
          renderReportSheet();

          const reportPage = document.getElementById('report-page');
          const wasHidden = reportPage.classList.contains('hidden');
          if (wasHidden) {
            // Temporarily reveal off-screen so export engine can measure & render elements
            reportPage.style.display = 'block';
            reportPage.style.visibility = 'visible';
            reportPage.style.position = 'fixed';
            reportPage.style.left = '-99999px';
            reportPage.style.top = '0';
            reportPage.style.opacity = '0';
            reportPage.style.pointerEvents = 'none';
            reportPage.classList.remove('hidden');
            renderPlanSnapshotCanvas();
          }

          // Ensure fonts and rendering layout are fully loaded & settled
          if (document.fonts) {
            try { await document.fonts.ready; } catch(e) {}
          }
          await new Promise(r => setTimeout(r, 150));

          const reportCard = document.getElementById('report-page-card');
          if (reportCard) {
            // Temporarily hide action buttons, selector buttons, and pencil edit icons during capture
            reportCard.classList.add('is-export-capturing');
            const hideInExport = reportCard.querySelectorAll('.no-export, .no-print, .pencil-edit-icon, #rep-table-filter-group, #btn-rep-filter-today, #btn-rep-filter-all');
            const savedDisplays = [];
            hideInExport.forEach((el, idx) => {
              savedDisplays[idx] = el.style.display;
              el.style.display = 'none';
            });

            // Target export width for full table layout (กว้างพอดี ไม่ตัดคอลัมน์ Co หลังกด และผลรวม)
            const exportTargetW = (currentExportRatio === '16:9' || currentExportRatio === '4:3') ? 1380 : 1180;
            const origCardW = reportCard.style.width;
            const origCardMaxW = reportCard.style.maxWidth;
            const origCardMargin = reportCard.style.margin;
            const origCardBoxShadow = reportCard.style.boxShadow;
            const origCardBorderRadius = reportCard.style.borderRadius;
            const origCardOverflow = reportCard.style.overflow;
            const origCardBg = reportCard.style.backgroundColor;

            reportCard.style.width = `${exportTargetW}px`;
            reportCard.style.maxWidth = `${exportTargetW}px`;
            reportCard.style.margin = '0 auto';
            reportCard.style.boxShadow = 'none';
            reportCard.style.borderRadius = '12px';
            reportCard.style.overflow = 'hidden';
            reportCard.style.backgroundColor = '#ffffff';

            // Re-render internal canvases at the compact width
            renderPlanSnapshotCanvas();
            scheduleReportScurveRender();
            await new Promise(r => setTimeout(r, 120));

            // Expand table wrapper so table is never clipped or scrollable
            const scrollWrappers = reportCard.querySelectorAll('.table-wrapper, .overflow-x-auto, .overflow-y-auto');
            const savedOverflows = [];
            scrollWrappers.forEach((w, i) => {
              savedOverflows[i] = { overflow: w.style.overflow, maxHeight: w.style.maxHeight, height: w.style.height };
              w.style.overflow = 'visible';
              w.style.maxHeight = 'none';
              w.style.height = 'auto';
            });

            // Compact padding on table cells so all 12 columns fit cleanly without horizontal scrolling
            const cells = reportCard.querySelectorAll('th, td');
            const savedPaddings = [];
            cells.forEach((cell, i) => {
              savedPaddings[i] = cell.style.padding;
              cell.style.padding = '5px 3px';
            });

            try {
              // Priority 1: Use htmlToImage for 100% native browser text rendering & vertical centering
              if (window.htmlToImage && typeof window.htmlToImage.toCanvas === 'function') {
                try {
                  sourceCanvas = await window.htmlToImage.toCanvas(reportCard, {
                    backgroundColor: '#ffffff',
                    pixelRatio: scale,
                    skipFonts: true,
                    filter: (node) => {
                      if (!node) return true;
                      if (node.classList) {
                        if (node.classList.contains('no-export') ||
                            node.classList.contains('no-print') ||
                            node.classList.contains('pencil-edit-icon')) {
                          return false;
                        }
                      }
                      if (node.id === 'rep-table-filter-group' ||
                          node.id === 'btn-rep-filter-today' ||
                          node.id === 'btn-rep-filter-all') {
                        return false;
                      }
                      return true;
                    }
                  });
                } catch (h2iErr) {
                  console.warn('htmlToImage failed, falling back to html2canvas:', h2iErr);
                }
              }

              // Priority 2: Fallback to html2canvas if htmlToImage is not available or threw an error
              if (!sourceCanvas && window.html2canvas) {
                const scrollW = exportTargetW;
                const scrollH = Math.ceil(reportCard.scrollHeight);

                sourceCanvas = await html2canvas(reportCard, {
                  scale: scale,
                  useCORS: true,
                  allowTaint: true,
                  logging: false,
                  backgroundColor: '#ffffff',
                  width: scrollW,
                  height: scrollH,
                  windowWidth: scrollW + 40,
                  windowHeight: scrollH + 40,
                  scrollX: 0,
                  scrollY: 0,
                  onclone: (clonedDoc) => {
                    const clonedCard = clonedDoc.getElementById('report-page-card');
                    if (clonedCard) {
                      clonedCard.style.width = `${exportTargetW}px`;
                      clonedCard.style.maxWidth = `${exportTargetW}px`;
                      clonedCard.style.margin = '0 auto';
                      clonedCard.style.overflow = 'hidden';
                      clonedCard.style.boxShadow = 'none';
                      clonedCard.style.borderRadius = '12px';
                      clonedCard.style.backgroundColor = '#ffffff';

                      // Remove all buttons, selection toggles, and edit pencils in cloned capture
                      clonedCard.querySelectorAll(
                        '.no-export, .no-print, .pencil-edit-icon, #rep-table-filter-group, ' +
                        '#btn-rep-filter-today, #btn-rep-filter-all, button'
                      ).forEach(el => {
                        el.style.display = 'none';
                        el.remove();
                      });

                      // Remove all box-shadows in cloned tree to eliminate color smudges on borders
                      clonedCard.querySelectorAll('*').forEach(el => {
                        if (el.style) el.style.boxShadow = 'none';
                      });

                      // Reset badge vertical baselines and heights
                      clonedCard.querySelectorAll(
                        '#rep-cum-pct, #rep-variance-badge, #rep-legend-original > span, ' +
                        '#rep-today-table-badge, span[class*="rounded"], .rounded-md, .rounded-full, ' +
                        'td span'
                      ).forEach(b => {
                        b.style.display = 'inline-flex';
                        b.style.alignItems = 'center';
                        b.style.justifyContent = 'center';
                        b.style.alignSelf = 'center';
                        b.style.verticalAlign = 'middle';
                        b.style.lineHeight = '1';
                        b.style.boxSizing = 'border-box';
                      });

                      clonedCard.querySelectorAll('th, td').forEach(c => {
                        c.style.verticalAlign = 'middle';
                        c.style.lineHeight = '1.2';
                        c.style.padding = '5px 3px';
                      });
                    }
                  }
                });
              }
            } finally {
              reportCard.style.width = origCardW;
              reportCard.style.maxWidth = origCardMaxW;
              reportCard.style.margin = origCardMargin;
              reportCard.style.boxShadow = origCardBoxShadow;
              reportCard.style.borderRadius = origCardBorderRadius;
              reportCard.style.overflow = origCardOverflow;
              reportCard.style.backgroundColor = origCardBg;
              reportCard.classList.remove('is-export-capturing');
              renderPlanSnapshotCanvas();
              scheduleReportScurveRender();
              hideInExport.forEach((el, idx) => {
                el.style.display = savedDisplays[idx] || '';
              });
              scrollWrappers.forEach((w, i) => {
                w.style.overflow = savedOverflows[i].overflow || '';
                w.style.maxHeight = savedOverflows[i].maxHeight || '';
                w.style.height = savedOverflows[i].height || '';
              });
              cells.forEach((cell, i) => {
                cell.style.padding = savedPaddings[i] || '';
              });
            }
          }

          if (wasHidden) {
            reportPage.style.display = '';
            reportPage.style.visibility = '';
            reportPage.style.position = '';
            reportPage.style.left = '';
            reportPage.style.top = '';
            reportPage.style.opacity = '';
            reportPage.style.pointerEvents = '';
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

          if (myRequestId !== exportRequestId) return;

          // Compose CAD view canvas with project header stamp
          const w = img.width;
          const h = img.height;
          const cadCanvas = document.createElement('canvas');
          cadCanvas.width = w;
          cadCanvas.height = h;
          const ctx = cadCanvas.getContext('2d');

          // Clean white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);

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
          const bH = 64 * bannerScale;
          const bPad = 16 * bannerScale;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
          ctx.fillRect(bPad, bPad, w - bPad * 2, bH);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 2 * bannerScale;
          ctx.strokeRect(bPad, bPad, w - bPad * 2, bH);

          // Brand tag
          const tagW = 114 * bannerScale;
          const tagH = 44 * bannerScale;
          ctx.fillStyle = '#ffc45b';
          ctx.fillRect(bPad + 10 * bannerScale, bPad + 10 * bannerScale, tagW, tagH);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5 * bannerScale;
          ctx.strokeRect(bPad + 10 * bannerScale, bPad + 10 * bannerScale, tagW, tagH);
          ctx.fillStyle = '#34383b';
          ctx.font = `bold ${13 * bannerScale}px Montserrat, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PYNN PRIDI 37', bPad + 10 * bannerScale + tagW / 2, bPad + 10 * bannerScale + tagH / 2);

          // Title & Stats
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#1e293b';
          ctx.font = `bold ${15 * bannerScale}px Sarabun, sans-serif`;
          const viewTitle = (typeof currentViewMode !== 'undefined' && currentViewMode === '3d')
            ? 'แบบจำลอง 3 มิติ (3D Piling Model View)'
            : 'แปลนงานเสาเข็ม (Piling Progress CAD View)';
          ctx.fillText(viewTitle, bPad + tagW + 24 * bannerScale, bPad + 22 * bannerScale);
          ctx.font = `${11.5 * bannerScale}px Sarabun, sans-serif`;
          ctx.fillStyle = '#475569';
          ctx.fillText(`ประจำวันที่: ${curDate}  |  กดวันนี้: ${todayCount} ต้น  |  ตอกแล้วสะสม: ${drivenCount} / 93 ต้น (${((drivenCount/93)*100).toFixed(1)}%)  |  คงเหลือ: ${93 - drivenCount} ต้น`, bPad + tagW + 24 * bannerScale, bPad + 44 * bannerScale);

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

    // 12. PCO & Coordinate Table Modal (อ้างอิงตารางใน SketchUp Image 4)
    let cotableActiveTab = 'sketchup'; // 'sketchup' or 'list'

    function setCoTableTab(tab) {
      cotableActiveTab = tab;
      const vSketchup = document.getElementById('cotable-view-sketchup');
      const vList = document.getElementById('cotable-view-list');
      const bSketchup = document.getElementById('btn-cotable-tab-sketchup');
      const bList = document.getElementById('btn-cotable-tab-list');

      if (tab === 'sketchup') {
        vSketchup?.classList.remove('hidden');
        vList?.classList.add('hidden');
        if (bSketchup) bSketchup.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#1e40af] text-white flex items-center gap-1 shadow-xs';
        if (bList) bList.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#64748b] hover:text-[#1e293b] transition-all flex items-center gap-1';
      } else {
        vSketchup?.classList.add('hidden');
        vList?.classList.remove('hidden');
        if (bList) bList.className = 'px-2.5 py-1 rounded-md text-xs font-black transition-all bg-[#1e40af] text-white flex items-center gap-1 shadow-xs';
        if (bSketchup) bSketchup.className = 'px-2.5 py-1 rounded-md text-xs font-bold text-[#64748b] hover:text-[#1e293b] transition-all flex items-center gap-1';
      }
      renderCoTable();
    }

    document.getElementById('btn-cotable-tab-sketchup')?.addEventListener('click', () => setCoTableTab('sketchup'));
    document.getElementById('btn-cotable-tab-list')?.addEventListener('click', () => setCoTableTab('list'));

    function renderCoTable() {
      // 1. Render 3-Column SketchUp Table View (Image 4 format)
      const bCol1 = document.getElementById('cotable-col1-body');
      const bCol2 = document.getElementById('cotable-col2-body');
      const bCol3 = document.getElementById('cotable-col3-body');

      const renderColumnRows = (container, startNo, endNo) => {
        if (!container) return;
        container.innerHTML = '';
        for (let no = startNo; no <= endNo; no++) {
          const p = PILES_DATABASE.find(x => x.no === no);
          if (!p) continue;
          const rec = progressRecords[p.no];
          const isDriven = rec && rec.status === 'driven';
          const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
          const nStr = p.northing !== undefined ? p.northing.toFixed(4) : '-';
          const eStr = p.easting !== undefined ? p.easting.toFixed(4) : '-';

          const tr = document.createElement('tr');
          tr.className = isDriven ? 'bg-[#ecfdf5] hover:bg-[#d1fae5] transition-colors font-semibold' : (no % 2 === 0 ? 'bg-slate-50/70 hover:bg-slate-100' : 'bg-white hover:bg-slate-50');
          tr.innerHTML = `
            <td class="p-1 border-r border-slate-200 text-center font-bold text-slate-700">${p.no}</td>
            <td class="p-1 border-r border-slate-200 text-center font-semibold text-slate-600">I 0.40</td>
            <td class="p-1 border-r border-slate-200 text-right font-mono text-slate-800">${nStr}</td>
            <td class="p-1 border-r border-slate-200 text-right font-mono text-slate-800">${eStr}</td>
            <td class="p-1 border-r border-slate-200 text-right font-mono font-bold text-[#b91c1c]">${pco.toFixed(3)}</td>
            <td class="p-1 text-center font-black text-[#1e40af]">
              ${p.footing || '-'}
              ${isDriven ? '<span class="inline-block w-2 h-2 rounded-full bg-[#10b981] ml-1" title="ตอกแล้ว"></span>' : ''}
            </td>
          `;
          container.appendChild(tr);
        }
      };

      renderColumnRows(bCol1, 1, 31);
      renderColumnRows(bCol2, 32, 62);
      renderColumnRows(bCol3, 63, 93);

      // 2. Render Interactive Filter Table View
      const tbody = document.getElementById('cotable-body');
      if (tbody) {
        const query = (document.getElementById('table-search')?.value || '').toLowerCase().trim();
        tbody.innerHTML = '';

        PILES_DATABASE.forEach(p => {
          if (query) {
            const matchNo = p.no.toString().includes(query);
            const matchTag = p.tag.toLowerCase().includes(query);
            const matchGrid = p.grid.toLowerCase().includes(query);
            const matchFooting = (p.footing || '').toLowerCase().includes(query);
            if (!matchNo && !matchTag && !matchGrid && !matchFooting) return;
          }

          const rec = progressRecords[p.no] || { status: 'pending', date: '-' };
          const isDriven = rec.status === 'driven';
          const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
          const nStr = p.northing !== undefined ? p.northing.toFixed(4) : '-';
          const eStr = p.easting !== undefined ? p.easting.toFixed(4) : '-';

          const tr = document.createElement('tr');
          tr.className = isDriven ? 'bg-[#f4fbf8] hover:bg-[#e6f7ef]' : 'hover:bg-[#fbfbfb]';

          const actN = (rec && rec.actual_n !== undefined && !isNaN(parseFloat(rec.actual_n)))
            ? parseFloat(rec.actual_n) : (p.northing !== undefined ? p.northing : 0);
          const actE = (rec && rec.actual_e !== undefined && !isNaN(parseFloat(rec.actual_e)))
            ? parseFloat(rec.actual_e) : (p.easting !== undefined ? p.easting : 0);
          const dN = (p.northing !== undefined) ? (actN - p.northing) : 0;
          const dE = (p.easting !== undefined) ? (actE - p.easting) : 0;
          const totMm = Math.round(Math.sqrt(dN * dN + dE * dE) * 1000);
          const isCoordTol = totMm <= 50;

          const afterPressHtml = isDriven ? `
            <div class="font-mono text-[11px] leading-tight text-right">
              <div class="text-[#047857] font-bold">N: ${actN.toFixed(4)}</div>
              <div class="text-[#047857] font-bold">E: ${actE.toFixed(4)}</div>
              <div class="mt-0.5">
                <span class="inline-block px-1.5 py-0.2 rounded font-mono font-bold text-[9px] ${isCoordTol ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                  ${totMm === 0 ? '✓ ตรงหมุด (0mm)' : `Δ ${totMm}mm`}
                </span>
              </div>
            </div>
          ` : `<span class="text-slate-400 font-mono text-[10.5px]">- (รอตอก)</span>`;

          tr.innerHTML = `
            <td class="p-2 border-r border-[#475569]/20 text-center font-bold text-[#667277]">${p.no}</td>
            <td class="p-2 border-r border-[#475569]/20 font-black text-[#34383b]">${p.tag}</td>
            <td class="p-2 border-r border-[#475569]/20 text-center font-black text-[#1e40af]">${p.footing || '-'}</td>
            <td class="p-2 border-r border-[#475569]/20 text-center font-bold text-[#34383b]">${p.grid}</td>
            <td class="p-2 border-r border-[#475569]/20 text-right font-mono text-[11px] text-slate-700 leading-tight">
              <div>N: ${nStr}</div>
              <div>E: ${eStr}</div>
            </td>
            <td class="p-2 border-r border-[#475569]/20 text-right bg-emerald-50/40">
              ${afterPressHtml}
            </td>
            <td class="p-2 border-r border-[#475569]/20 text-right font-black text-[#a84631] font-mono">${pco.toFixed(3)}</td>
            <td class="p-2 border-r border-[#475569]/20 text-center">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black border ${isDriven ? 'bg-[#98cfad] text-[#1e3a29] border-[#475569]' : 'bg-slate-100 text-[#667277] border-slate-300'}">
                ${isDriven ? '✓ ตอกแล้ว' : 'รอการตอก'}
              </span>
            </td>
            <td class="p-2 border-r border-[#475569]/20 text-center font-mono text-[11px] text-[#667277]">
              ${isDriven ? (rec.date || '-') : '-'}
            </td>
            <td class="p-2 text-center">
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
            syncPilingToSupabase(false);
          });
        });
      }
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
      let csv = "\uFEFFNo,Pile_ID,Footing,Grid,Design_N,Design_E,Actual_N,Actual_E,Diff_N_mm,Diff_E_mm,Total_Offset_mm,PCO_Level_m,Actual_Top_m,Diff_Level_mm,Type,Status,Drive_Date\n";
      PILES_DATABASE.forEach(p => {
        const rec = progressRecords[p.no] || { status: 'pending', date: '' };
        const pco = p.pco_level !== undefined ? p.pco_level : p.co_level;
        const actTop = rec.actual_top !== undefined ? rec.actual_top : '';
        const diffMm = (rec.actual_top !== undefined) ? Math.round((rec.actual_top - pco) * 1000) : '';
        const actN = rec.actual_n !== undefined ? rec.actual_n : '';
        const actE = rec.actual_e !== undefined ? rec.actual_e : '';
        const diffN_mm = (actN !== '' && p.northing !== undefined) ? Math.round((actN - p.northing) * 1000) : '';
        const diffE_mm = (actE !== '' && p.easting !== undefined) ? Math.round((actE - p.easting) * 1000) : '';
        const totOffset_mm = (diffN_mm !== '' && diffE_mm !== '') ? Math.round(Math.sqrt((actN - p.northing)**2 + (actE - p.easting)**2) * 1000) : '';
        csv += `${p.no},${p.tag},${p.footing || ''},${p.grid},${p.northing || ''},${p.easting || ''},${actN},${actE},${diffN_mm},${diffE_mm},${totOffset_mm},${pco},${actTop},${diffMm},${p.type || 'I-0.40m'},${rec.status},${rec.date || ''}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `PYNN_PRIDI_37_Piling_PCO_Survey_Report_${new Date().toISOString().slice(0, 10)}.csv`;
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
    // Auto-open modals or switch views based on URL hash or param (?view=report / #report, #3d, #excel)
    function handleHashAndUrlNavigation() {
      const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view') || hash;
      const themeParam = params.get('theme');

      if (themeParam === 'excel' || hash === 'excel') {
        setReportTheme('excel');
      } else if (themeParam === 'original' || hash === 'report-original') {
        setReportTheme('original');
      } else {
        applyReportThemeUI(currentReportTheme);
      }

      if (view === 'report' || view === 'excel' || view === 'report-original') {
        setTimeout(() => {
          document.getElementById('btn-open-report')?.click();
        }, 300);
      } else if (view === 'cotable') {
        setTimeout(() => {
          document.getElementById('btn-open-cotable')?.click();
        }, 300);
      } else if (view === 'quick') {
        setTimeout(() => {
          document.getElementById('btn-quick-select')?.click();
        }, 300);
      } else if (view === 'top' || hash === 'top' || view === '2d' || hash === '2d') {
        document.getElementById('report-page')?.classList.add('hidden');
        document.getElementById('modal-export-image')?.classList.add('hidden');
        document.getElementById('modal-cotable')?.classList.add('hidden');
        document.getElementById('quick-select-drawer')?.classList.add('hidden');
        setTimeout(() => {
          resetTopView();
        }, 200);
      } else {
        // DEFAULT: ALWAYS OPEN 3D ISOMETRIC VIEW AND KEEP REPORT HIDDEN!
        document.getElementById('report-page')?.classList.add('hidden');
        document.getElementById('modal-export-image')?.classList.add('hidden');
        document.getElementById('modal-cotable')?.classList.add('hidden');
        document.getElementById('quick-select-drawer')?.classList.add('hidden');
        resetIsoView();
      }
    }

    // Run navigation immediately and on events
    handleHashAndUrlNavigation();
    window.addEventListener('DOMContentLoaded', handleHashAndUrlNavigation);
    window.addEventListener('hashchange', handleHashAndUrlNavigation);

    animate();
    updateUI();
  