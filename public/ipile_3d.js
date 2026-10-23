/**
 * 3D PRECAST PRESTRESSED CONCRETE I-PILE ENGINE (Anatomy Technical Edition)
 * Built for Pynn Pridi 37 Construction Progress Portal
 * 
 * Standards & Design Philosophy (/impeccable + /anatomy):
 * - Strict In-Frame Fit: Width fill ratio 0.74 guarantees 13% breathing margins on left & right.
 * - 4-Tone Architectural Shading: Crisp illuminated top flange, recessed web tone, grounded bottom flange.
 * - Calming Palette: Rich architectural emerald (#059669) for driven vs. soothing precast chalk (#f1f5f9) for remaining.
 * - Solid, not wireframe: Tangible physical solids with refined drafting pencil & ink contours.
 * - Balanced Anatomy Station Scale: Integrated with 0m - 21m station ruler and dynamic depth callout.
 * - Precision 3D screen-projected callout badge pinned over the advancing driving frontier.
 * - Real-time sync API: window.update3DIPileProgress(pct, drivenCount, total)
 */

(function () {
  'use strict';

  function initWhenThreeReady() {
    if (typeof THREE === 'undefined') {
      setTimeout(initWhenThreeReady, 80);
      return;
    }
    init3DIPileProgressBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWhenThreeReady);
  } else {
    initWhenThreeReady();
  }

  function init3DIPileProgressBar() {
    const canvas = document.getElementById('ipileProgressBarCanvas');
    const container = canvas ? canvas.parentElement : null;
    if (!canvas || !container) return;

    // --- 1. RENDERER SETUP (TRANSPARENT WITH HIGH-DPI SHARPNESS) ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // --- 2. SCENE & ORTHOGRAPHIC AXONOMETRIC CAMERA ---
    const scene = new THREE.Scene();

    // Pile Span Parameters (World units: 10.0 span = 21.00m physical pile)
    const TOTAL_X_SPAN = 10.0;
    const START_X = -TOTAL_X_SPAN / 2; // -5.0 (0.00m)
    const END_X = TOTAL_X_SPAN / 2;    // +5.0 (21.00m)

    // Strict in-frame fit: 0.74 fill ratio leaves generous 13% margin on left and 13% on right
    // This prevents any clipping or touching the container borders.
    const WIDTH_FILL_RATIO = 0.74;

    let width = container.clientWidth || 380;
    let height = container.clientHeight || 100;
    let aspect = width / height;
    let frustumWidth = TOTAL_X_SPAN / WIDTH_FILL_RATIO;
    let frustumHeight = frustumWidth / aspect;
    let yOffset = -0.02 * frustumHeight;

    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2 + yOffset,
      -frustumHeight / 2 + yOffset,
      0.1,
      60
    );
    camera.position.set(0, yOffset, 20);
    camera.lookAt(0, yOffset, 0);

    // --- 3. LIGHTING (4-TONE ARCHITECTURAL SCULPTING) ---
    // Gentle ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.90);
    scene.add(ambientLight);

    // Key light angled from top-front-right: illuminates top flange and front face
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.25);
    keyLight.position.set(5, 8, 7);
    scene.add(keyLight);

    // Fill light from bottom-left: softens underside shadows
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.45);
    fillLight.position.set(-6, -2, 4);
    scene.add(fillLight);

    // Gentle emerald point light at the active driving frontier
    const tipPointLight = new THREE.PointLight(0x10b981, 1.6, 3.5);
    tipPointLight.position.set(0, 0, 0.7);
    scene.add(tipPointLight);

    // --- 4. ROOT GROUP & BALANCED AXONOMETRIC PERSPECTIVE ---
    const rootGroup = new THREE.Group();
    // Subtle, clean tilt: shows top flange, recessed web, and beveled outer contour
    rootGroup.rotation.x = 0.16;  // ~9.2 deg forward tilt
    rootGroup.rotation.y = -0.015; // ~0.85 deg subtle axonometric reveal
    rootGroup.position.y = -0.05; // Centered vertically with breathing room
    scene.add(rootGroup);

    // --- 5. 2D CROSS SECTION (40x40 cm Prestressed Concrete I-Pile) ---
    // Refined proportioned scale: sits comfortably in the card
    const H = 0.72;       // Total cross-section depth
    const W = 0.72;       // Total cross-section width
    const tf = 0.17;      // Flange thickness
    const tw = 0.20;      // Web thickness
    const ch = 0.030;     // Outer corner chamfers
    const haunch = 0.050; // 45-degree haunch transitions

    const halfW = W / 2;
    const halfH = H / 2;
    const halfTw = tw / 2;

    const iShape = new THREE.Shape();
    iShape.moveTo(halfH - ch, halfW);
    iShape.lineTo(-halfH + ch, halfW);
    iShape.lineTo(-halfH, halfW - ch);
    iShape.lineTo(-halfH, halfW - tf + ch);
    iShape.lineTo(-halfH + ch, halfW - tf);
    // Haunch into web
    iShape.lineTo(-halfTw - haunch, halfW - tf);
    iShape.lineTo(-halfTw, halfW - tf - haunch);
    // Left side of web
    iShape.lineTo(-halfTw, -halfW + tf + haunch);
    // Haunch into bottom flange
    iShape.lineTo(-halfTw - haunch, -halfW + tf);
    iShape.lineTo(-halfH + ch, -halfW + tf);
    iShape.lineTo(-halfH, -halfW + tf - ch);
    iShape.lineTo(-halfH, -halfW + ch);
    iShape.lineTo(-halfH + ch, -halfW);
    // Bottom flange
    iShape.lineTo(halfH - ch, -halfW);
    iShape.lineTo(halfH, -halfW + ch);
    iShape.lineTo(halfH, -halfW + tf - ch);
    iShape.lineTo(halfH - ch, -halfW + tf);
    // Haunch into right side of web
    iShape.lineTo(halfTw + haunch, -halfW + tf);
    iShape.lineTo(halfTw, -halfW + tf + haunch);
    // Right side of web
    iShape.lineTo(halfTw, halfW - tf - haunch);
    // Haunch into top flange
    iShape.lineTo(halfTw + haunch, halfW - tf);
    iShape.lineTo(halfH - ch, halfW - tf);
    iShape.lineTo(halfH, halfW - tf + ch);
    iShape.lineTo(halfH, halfW - ch);
    iShape.lineTo(halfH - ch, halfW);

    // --- 6. MATERIALS (ANATOMY 4-TONE SOOTHING PALETTE) ---
    // 1) Driven Solid Concrete: Rich, calming architectural emerald green
    const drivenConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      roughness: 0.38,
      metalness: 0.06,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const drivenEdgeMat = new THREE.LineBasicMaterial({
      color: 0x064e3b,
      linewidth: 1.5
    });

    // 2) Remaining Precast Concrete Pile: Soothing off-white chalk architectural tone
    const remainingConcreteMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.52,
      metalness: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const remainingEdgeMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.75,
      linewidth: 1.0
    });

    // 3) Steel Driving Shoe Cap (0% - Far Left)
    const steelHeadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.28,
      metalness: 0.75
    });

    // 4) End Cap (100% - Far Right)
    const endCapMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.45,
      metalness: 0.04
    });

    // 5) Ground Ambient Contact Shadow (Grounds the pile structure on paper canvas)
    const shadowGeo = new THREE.PlaneGeometry(TOTAL_X_SPAN + 0.6, 0.90);
    shadowGeo.rotateX(-Math.PI / 2);
    shadowGeo.translate(0, -halfW - 0.025, 0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.08
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    rootGroup.add(shadowMesh);

    // 6) Steel Driving Shoe Mesh (Far Left)
    const capThickness = 0.10;
    const capGeo = new THREE.ExtrudeGeometry(iShape, { depth: capThickness, bevelEnabled: false });
    capGeo.rotateY(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, steelHeadMat);
    capMesh.position.set(START_X - capThickness, 0, 0);
    rootGroup.add(capMesh);

    const capEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(capGeo, 20),
      new THREE.LineBasicMaterial({ color: 0x090d16, linewidth: 1.5 })
    );
    capEdges.position.copy(capMesh.position);
    rootGroup.add(capEdges);

    // 7) Beveled Concrete End Cap (Far Right)
    const endCapThickness = 0.06;
    const endCapGeo = new THREE.ExtrudeGeometry(iShape, { depth: endCapThickness, bevelEnabled: false });
    endCapGeo.rotateY(Math.PI / 2);
    const endCapMesh = new THREE.Mesh(endCapGeo, endCapMat);
    endCapMesh.position.set(END_X, 0, 0);
    rootGroup.add(endCapMesh);

    const endCapEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(endCapGeo, 20),
      remainingEdgeMat
    );
    endCapEdges.position.copy(endCapMesh.position);
    rootGroup.add(endCapEdges);

    // Dynamic Meshes
    let solidPileMesh = null;
    let solidPileEdges = null;
    let remainingPileMesh = null;
    let remainingPileEdges = null;

    // --- 7. ADVANCING DRIVING FRONTIER (CRISP TECHNICAL CURSOR) ---
    const tipGlowGroup = new THREE.Group();
    rootGroup.add(tipGlowGroup);

    // Illuminated emerald slice at frontier joint
    const glowFaceGeo = new THREE.ShapeGeometry(iShape);
    glowFaceGeo.rotateY(Math.PI / 2);
    const glowFaceMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.90,
      side: THREE.DoubleSide
    });
    const glowFaceMesh = new THREE.Mesh(glowFaceGeo, glowFaceMat);
    tipGlowGroup.add(glowFaceMesh);

    // Clean luminous laser perimeter outline
    const laserRingGeo = new THREE.EdgesGeometry(glowFaceGeo);
    const laserRingMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      linewidth: 2.0
    });
    const laserRingMesh = new THREE.LineSegments(laserRingGeo, laserRingMat);
    tipGlowGroup.add(laserRingMesh);

    // Subtle soft pulse halo (calm, non-blinding)
    const ringGeo = new THREE.RingGeometry(0.18, 0.28, 24);
    ringGeo.rotateY(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    tipGlowGroup.add(ringMesh);

    // State Variables
    let currentPercent = 25.8;
    let targetPercent = 25.8;
    let currentDrivenCount = 24;
    let targetDrivenCount = 24;

    // --- 8. REBUILD PILE MESHES ---
    function rebuildPileMeshes(pct) {
      const clampedPct = Math.max(0.5, Math.min(100, pct));
      const drivenLength = (clampedPct / 100) * TOTAL_X_SPAN;
      const remainingLength = TOTAL_X_SPAN - drivenLength;
      const currentTipX = START_X + drivenLength;

      // 1. Dispose old driven meshes
      if (solidPileMesh) {
        rootGroup.remove(solidPileMesh);
        solidPileMesh.geometry.dispose();
      }
      if (solidPileEdges) {
        rootGroup.remove(solidPileEdges);
        solidPileEdges.geometry.dispose();
      }

      // Create Solid Driven Concrete Pile (0% to actual %)
      if (drivenLength > 0.02) {
        const solidGeo = new THREE.ExtrudeGeometry(iShape, {
          depth: drivenLength,
          bevelEnabled: false
        });
        solidGeo.rotateY(Math.PI / 2);

        solidPileMesh = new THREE.Mesh(solidGeo, drivenConcreteMat);
        solidPileMesh.position.set(START_X, 0, 0);
        rootGroup.add(solidPileMesh);

        solidPileEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(solidGeo, 20),
          drivenEdgeMat
        );
        solidPileEdges.position.copy(solidPileMesh.position);
        rootGroup.add(solidPileEdges);
      }

      // 2. Dispose old remaining meshes
      if (remainingPileMesh) {
        rootGroup.remove(remainingPileMesh);
        remainingPileMesh.geometry.dispose();
      }
      if (remainingPileEdges) {
        rootGroup.remove(remainingPileEdges);
        remainingPileEdges.geometry.dispose();
      }

      // Create Remaining Solid Concrete Pile (actual % to 100%)
      if (remainingLength > 0.02) {
        const remainingGeo = new THREE.ExtrudeGeometry(iShape, {
          depth: remainingLength,
          bevelEnabled: false
        });
        remainingGeo.rotateY(Math.PI / 2);

        remainingPileMesh = new THREE.Mesh(remainingGeo, remainingConcreteMat);
        remainingPileMesh.position.set(currentTipX, 0, 0);
        rootGroup.add(remainingPileMesh);

        remainingPileEdges = new THREE.LineSegments(
          new THREE.EdgesGeometry(remainingGeo, 20),
          remainingEdgeMat
        );
        remainingPileEdges.position.copy(remainingPileMesh.position);
        rootGroup.add(remainingPileEdges);
      }

      // 3. Position the Frontier Indicator
      tipGlowGroup.position.set(currentTipX, 0, 0);
      tipPointLight.position.set(currentTipX + 0.05, 0, 0.6);

      // 4. Update the Floating Callout Badge via 3D Screen Projection
      updateTipCalloutPosition(clampedPct, currentTipX);
    }

    // --- 9. PRECISION 3D-TO-SCREEN CALLOUT POSITIONING ---
    function updateTipCalloutPosition(pct, tipX) {
      const callout = document.getElementById('ipile-tip-callout');
      const textEl = document.getElementById('ipile-tip-text');
      const depthEl = document.getElementById('ipile-depth-text');
      const elMasterPct = document.getElementById('portal-piling-percent');

      const clamped = Math.max(0.5, Math.min(100, pct));

      if (callout && camera) {
        const posX = tipX !== undefined ? tipX : (START_X + (clamped / 100) * TOTAL_X_SPAN);
        // Anchor point atop the top flange at tipX
        const p = new THREE.Vector3(posX, halfW + 0.10, 0);
        p.applyMatrix4(rootGroup.matrixWorld);
        p.project(camera);

        // p.x in NDC [-1, +1] -> Screen percentage [0, 100]
        const screenPercentX = ((p.x + 1) / 2) * 100;
        // Clamp safely so badge never touches container borders
        const clampedScreen = Math.max(8, Math.min(92, screenPercentX));
        callout.style.left = `${clampedScreen}%`;
      }

      // Update text values
      let displayPct = clamped.toFixed(1) + '%';
      if (elMasterPct && elMasterPct.textContent && elMasterPct.textContent.includes('%')) {
        displayPct = elMasterPct.textContent.trim();
      }
      if (textEl) {
        textEl.textContent = displayPct;
      }
      if (depthEl) {
        depthEl.remove();
      }
    }

    // --- 10. PUBLIC API: UPDATE PROGRESS ---
    window.update3DIPileProgress = function (newPercent, drivenCount, total) {
      targetPercent = Math.max(0, Math.min(100, parseFloat(newPercent) || 0));
      targetDrivenCount = drivenCount !== undefined ? drivenCount : Math.round((targetPercent / 100) * (total || 93));

      updateTipCalloutPosition(targetPercent);
    };

    // Auto-detect initial progress from DOM
    function syncInitialProgress() {
      const elPct = document.getElementById('portal-piling-percent');
      const elDriven = document.getElementById('portal-piling-driven-count');

      let pctVal = 25.8;
      let countVal = 24;

      if (elPct && elPct.textContent) {
        const parsed = parseFloat(elPct.textContent.replace('%', ''));
        if (!isNaN(parsed) && parsed > 0) pctVal = parsed;
      }
      if (elDriven && elDriven.textContent) {
        const parsedCount = parseInt(elDriven.textContent, 10);
        if (!isNaN(parsedCount) && parsedCount > 0) countVal = parsedCount;
      }

      currentPercent = pctVal;
      targetPercent = pctVal;
      currentDrivenCount = countVal;
      targetDrivenCount = countVal;

      rootGroup.updateMatrixWorld(true);
      rebuildPileMeshes(currentPercent);
    }

    syncInitialProgress();

    // --- 11. RESIZE HANDLER (RESPONSIVE FULL-FIT PROJECTION) ---
    function onResize() {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 100;
      if (w === 0 || h === 0) return;

      aspect = w / h;
      frustumWidth = TOTAL_X_SPAN / WIDTH_FILL_RATIO;
      frustumHeight = frustumWidth / aspect;
      yOffset = -0.02 * frustumHeight;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2 + yOffset;
      camera.bottom = -frustumHeight / 2 + yOffset;
      camera.position.set(0, yOffset, 20);
      camera.lookAt(0, yOffset, 0);
      camera.updateProjectionMatrix();

      renderer.setSize(w, h);
      rootGroup.updateMatrixWorld(true);
      updateTipCalloutPosition(currentPercent);
    }

    window.addEventListener('resize', onResize);
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(onResize);
      ro.observe(container);
    }

    // --- 12. ANIMATION LOOP ---
    let lastRenderPct = currentPercent;
    let clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth lerp to target percent
      if (Math.abs(targetPercent - currentPercent) > 0.01) {
        currentPercent += (targetPercent - currentPercent) * 0.12;
        if (Math.abs(currentPercent - lastRenderPct) > 0.04) {
          rebuildPileMeshes(currentPercent);
          lastRenderPct = currentPercent;
        }
      } else if (currentPercent !== targetPercent || lastRenderPct !== targetPercent) {
        currentPercent = targetPercent;
        rebuildPileMeshes(currentPercent);
        lastRenderPct = targetPercent;
      }

      // Continuous lock-in with portal-piling-percent
      const elMasterPct = document.getElementById('portal-piling-percent');
      if (elMasterPct && elMasterPct.textContent) {
        const masterStr = elMasterPct.textContent.trim();
        const parsed = parseFloat(masterStr.replace('%', ''));
        if (!isNaN(parsed) && Math.abs(parsed - targetPercent) > 0.1) {
          targetPercent = parsed;
        }
      }

      // Calm, gentle breathing motion for the indicator (soothing to the eye)
      const pulse = 1.0 + Math.sin(elapsed * 2.8) * 0.12;
      glowFaceMat.opacity = 0.82 + Math.sin(elapsed * 2.8) * 0.10;
      ringMesh.scale.set(pulse, pulse, 1.0);
      laserRingMesh.scale.set(1.0, pulse, 1.0);
      tipPointLight.intensity = 1.4 + Math.sin(elapsed * 2.8) * 0.4;

      renderer.render(scene, camera);
    }

    animate();
  }
})();
