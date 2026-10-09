const fs = require('fs');

let html = fs.readFileSync('piling.html', 'utf8');
const badgeOffsets = fs.readFileSync('badge_offsets.json', 'utf8');

console.log('Original piling.html length:', html.length);

// 1. UPDATE SUB-VIEWS-3D HTML: Add "บน (Top)" button
const oldSubViewsHtml = `<div class="grid grid-cols-2 gap-1 text-[9.5px]">
          <button id="btn-view-front" class="pop-btn py-0.5 text-center font-bold" title="มองจากด้านหน้า ทิศใต้">
            หน้า (S)
          </button>
          <button id="btn-view-side" class="pop-btn py-0.5 text-center font-bold" title="มองจากด้านข้าง ทิศตะวันตก">
            ข้าง (W)
          </button>
        </div>`;

const newSubViewsHtml = `<div class="grid grid-cols-3 gap-1 text-[9.5px]">
          <button id="btn-view-top-3d" class="pop-btn py-0.5 text-center font-bold" title="มองจากด้านบน (Top View ใน 3D)">
            บน (Top)
          </button>
          <button id="btn-view-front" class="pop-btn py-0.5 text-center font-bold" title="มองจากด้านหน้า ทิศใต้">
            หน้า (S)
          </button>
          <button id="btn-view-side" class="pop-btn py-0.5 text-center font-bold" title="มองจากด้านข้าง ทิศตะวันตก">
            ข้าง (W)
          </button>
        </div>`;

if (html.includes(oldSubViewsHtml)) {
  html = html.replace(oldSubViewsHtml, newSubViewsHtml);
  console.log('1. Replaced sub-views-3d HTML successfully.');
} else {
  console.warn('1. Warning: oldSubViewsHtml not found exactly.');
}

// 2. ADD EVENT LISTENER FOR btn-view-top-3d
const oldViewButtonsJs = `    // Preset 3D Directional Views
    document.getElementById('btn-view-front')?.addEventListener('click', () => {`;

const newViewButtonsJs = `    // Preset 3D Directional Views
    document.getElementById('btn-view-top-3d')?.addEventListener('click', () => {
      if (activeCamera !== perspCamera) resetIsoView();
      perspCamera.position.set(PLAN_CENTER.x, PLAN_CENTER.y - 0.05, 65);
      controlsPersp.target.copy(PLAN_CENTER);
      controlsPersp.update();
    });

    document.getElementById('btn-view-front')?.addEventListener('click', () => {`;

if (html.includes(oldViewButtonsJs)) {
  html = html.replace(oldViewButtonsJs, newViewButtonsJs);
  console.log('2. Added btn-view-top-3d event listener successfully.');
} else {
  console.warn('2. Warning: oldViewButtonsJs not found exactly.');
}

// 3. REPLACE getPileAtPointer WITH PIN-POINT PRECISION LOGIC
const oldRaycastTargetStart = `    // 4. High-Precision 3D Raycaster & Pin-Point Pile Picking (แก้ปัญหาคลิกติดต้นข้างๆ 100%)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedCardPileNo = null;

    let pointerDownPos = { x: 0, y: 0, time: 0 };`;

const oldRaycastTargetEnd = `    // Raycast on pointerup ONLY if it was a quick stationary click (NOT a drag to rotate or pan!)`;

const startIdx = html.indexOf(oldRaycastTargetStart);
const endIdx = html.indexOf(oldRaycastTargetEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newRaycastCode = `    // 4. High-Precision 3D Raycaster & Pin-Point Pile Picking (แก้ปัญหาคลิกติดต้นข้างๆ 100%)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let selectedCardPileNo = null;

    let pointerDownPos = { x: 0, y: 0, time: 0 };

    window.addEventListener('pointerdown', (e) => {
      if (e.target !== renderer.domElement) return;
      pointerDownPos = { x: e.clientX, y: e.clientY, time: performance.now() };
    });

    // พิกัดวงกลมหัวเข็ม (Badge World Coordinates) อ้างอิงโมเดล 3D ที่แท้จริงครบทั้ง 93 ต้น
    const PILE_BADGE_OFFSETS = ${badgeOffsets};

    /**
     * ค้นหาเสาเข็มที่ตำแหน่งเคอร์เซอร์ด้วยความแม่นยำระดับพินพอยต์ (Pin-Point Precision 100%):
     * แก้ไขปัญหามุมมอง 3D และ Top View ที่คลิกต้นหนึ่งแล้วไปติดต้นข้างๆ:
     * 1. คำนวณ Screen-Space Distance (พิกเซล 2D บนหน้าจอ) ของทั้งหัวเข็ม (Head Cap) และวงกลมตัวเลข (Badge) ทุกต้น
     *    เพราะเมื่อผู้ใช้คลิกบนหน้าจอ ดวงตาของผู้ใช้มองที่ตำแหน่งหัวเข็ม/วงกลมตัวเลขบนหน้าจอโดยตรง
     * 2. กรองลำแสง 3D Raycaster โดยแยกแยะ:
     *    - การคลิกโดนหัวเข็ม / Badge / Text โดยตรง
     *    - ป้องกันไม่ให้เสาเข็มต้นหน้า (Foreground Shaft) ที่อยู่ใต้ดินลึก 6 เมตรแย่งคลิกเสาเข็มต้นหลัง
     * 3. เลือกเสาเข็มที่ตรงกับตำแหน่งที่ผู้ใช้คลิกอย่างแม่นยำที่สุด
     */
    function getPileAtPointer(e) {
      if (!renderer || !renderer.domElement || !activeCamera || !currentModel) return null;

      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // ป้องกันการคลิกนอกพื้นที่ Canvas ของ 3D
      if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return null;

      const normX = (clickX / rect.width) * 2 - 1;
      const normY = -(clickY / rect.height) * 2 + 1;

      mouse.set(normX, normY);
      raycaster.setFromCamera(mouse, activeCamera);

      // รัศมีค้นหา 2D บนหน้าจอสำหรับเสาเข็มทุกต้น
      const projVec = new THREE.Vector3();
      const candidates = [];

      for (const p of PILES_DATABASE) {
        const meshes = pileMeshesMap.get(p.no);
        if (meshes && meshes.length > 0 && !meshes[0].visible) continue;

        const topZ = (p.pco_level !== undefined ? p.pco_level : (p.co_level || -1.226));
        
        // 1. ตรวจสอบพิกัดหัวเข็มบนหน้าจอ
        projVec.set(p.x, p.y, topZ);
        projVec.project(activeCamera);

        let minPixelDist = Infinity;
        let isFront = false;

        if (projVec.z > -1 && projVec.z < 1) {
          isFront = true;
          const sx = (projVec.x * 0.5 + 0.5) * rect.width;
          const sy = (-(projVec.y * 0.5) + 0.5) * rect.height;
          const distHead = Math.hypot(clickX - sx, clickY - sy);
          minPixelDist = Math.min(minPixelDist, distHead);
        }

        // 2. ตรวจสอบพิกัดวงกลมหัวเข็ม (Badge) บนหน้าจอ
        const bOffset = PILE_BADGE_OFFSETS[p.no];
        if (bOffset) {
          projVec.set(bOffset[0], bOffset[1], 0.02);
        } else {
          projVec.set(p.x, p.y, 0.02);
        }
        projVec.project(activeCamera);

        if (projVec.z > -1 && projVec.z < 1) {
          isFront = true;
          const sx = (projVec.x * 0.5 + 0.5) * rect.width;
          const sy = (-(projVec.y * 0.5) + 0.5) * rect.height;
          const distBadge = Math.hypot(clickX - sx, clickY - sy);
          minPixelDist = Math.min(minPixelDist, distBadge);
        }

        if (isFront) {
          candidates.push({
            no: p.no,
            dist: minPixelDist,
            data: p
          });
        }
      }

      // เรียงลำดับเสาเข็มตามระยะพิกเซลบนหน้าจอจากใกล้ไปไกล
      candidates.sort((a, b) => a.dist - b.dist);

      // ยิง 3D Raycaster เพื่อดูวัตถุที่ถูกชนโดยตรง
      raycaster.params.Line.threshold = 0.02;
      const allIntersects = raycaster.intersectObjects(currentModel.children, true);

      // กรอง Mesh ที่มี pileNo
      const validMeshHits = [];
      for (const h of allIntersects) {
        const obj = h.object;
        if (!obj || !obj.isMesh || !obj.visible) continue;
        let p = obj.parent;
        let isVis = true;
        while (p && p !== scene) {
          if (!p.visible) { isVis = false; break; }
          p = p.parent;
        }
        if (!isVis) continue;
        const pNo = obj.userData?.pileNo;
        if (pNo) {
          validMeshHits.push({
            pNo,
            hit: h,
            isBadge: Boolean(obj.userData?.isBadge),
            isText: Boolean(obj.userData?.isText),
            isIBeam: Boolean(obj.userData?.isIBeam)
          });
        }
      }

      // หากคลิกโดน Badge หรือ Text หรือ Head Cap ของเสาเข็มที่อยู่ใกล้เคอร์เซอร์บนหน้าจอ (< 35px)
      if (validMeshHits.length > 0) {
        // หา hit ที่ตรงกับ candidate ที่ใกล้บนหน้าจอที่สุด
        for (const cand of candidates.slice(0, 3)) {
          if (cand.dist > 35) break;
          // ตรวจว่า candidate นี้มี hit หรือไม่
          const matchHit = validMeshHits.find(v => v.pNo === cand.no);
          if (matchHit) {
            return cand.no;
          }
        }

        // หาก candidate อันดับ 1 อยู่ใกล้เคอร์เซอร์มาก (< 18px) ให้เลือก candidate อันดับ 1 ทันที
        // เพื่อป้องกันกรณี Ray ไปชนเสาเข็มต้นข้างๆ หรือต้นหน้า
        if (candidates.length > 0 && candidates[0].dist < 18) {
          return candidates[0].no;
        }

        // ถ้าไม่มี candidate ใกล้เคียงมาก ให้เลือก hit แรกที่มีระยะห่างบนหน้าจอสมเหตุสมผล (< 42px)
        for (const v of validMeshHits) {
          const cand = candidates.find(c => c.no === v.pNo);
          if (cand && cand.dist < 42) {
            return v.pNo;
          }
        }
      }

      // หากไม่โดน Mesh โดยตรง หรือคลิกเฉียดบนจอมือถือ (Touch / Tap)
      // เลือกต้นที่ใกล้ตำแหน่งคลิกบนหน้าจอมากที่สุด (รัศมีไม่เกิน 26 พิกเซล)
      if (candidates.length > 0 && candidates[0].dist <= 26) {
        return candidates[0].no;
      }

      return null;
    }

`;
  html = html.slice(0, startIdx) + newRaycastCode + html.slice(endIdx);
  console.log('3. Replaced getPileAtPointer with pin-point precision logic successfully.');
} else {
  console.warn('3. Warning: Raycast block not found!');
}

// 4. UPDATE POINTERUP DIST THRESHOLD (relax from 5px to 8px for mobile tap)
const oldPointerUpCheck = `      // If user dragged more than 5px or held longer than 350ms, they were rotating or panning!
      if (dist > 5 || dt > 350) return;`;

const newPointerUpCheck = `      // If user dragged more than 8px or held longer than 400ms, they were rotating or panning!
      if (dist > 8 || dt > 400) return;`;

if (html.includes(oldPointerUpCheck)) {
  html = html.replace(oldPointerUpCheck, newPointerUpCheck);
  console.log('4. Updated pointerup threshold successfully.');
}

// 5. UPDATE POINTERMOVE HOVER LOGIC TO PROVIDE VISUAL POINTER CURSOR
const oldHoverLogic = `    // ให้ฟีดแบ็กเคอร์เซอร์เมื่อเลื่อนเมาส์ผ่านเสาเข็มในโหมดเช็คข้อมูล
    renderer.domElement.addEventListener('pointermove', (e) => {
      if (isPcoInspectMode && currentModel) {
        const hitPileNo = getPileAtPointer(e);
        renderer.domElement.style.cursor = hitPileNo ? 'pointer' : 'crosshair';
      }
    });`;

const newHoverLogic = `    // ให้ฟีดแบ็กเคอร์เซอร์เมื่อเลื่อนเมาส์ผ่านเสาเข็ม (ทั้งโหมดปกติและโหมดเช็คข้อมูล)
    renderer.domElement.addEventListener('pointermove', (e) => {
      if (!currentModel) return;
      const hitPileNo = getPileAtPointer(e);
      if (isPcoInspectMode) {
        renderer.domElement.style.cursor = hitPileNo ? 'pointer' : 'crosshair';
      } else {
        renderer.domElement.style.cursor = hitPileNo ? 'pointer' : 'default';
      }
    });`;

if (html.includes(oldHoverLogic)) {
  html = html.replace(oldHoverLogic, newHoverLogic);
  console.log('5. Updated pointermove hover logic successfully.');
}

fs.writeFileSync('piling.html', html);
console.log('Saved piling.html, new length:', html.length);
