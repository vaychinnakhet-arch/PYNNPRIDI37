/**
 * 3D PRECAST PRESTRESSED CONCRETE I-PILE ENGINE (Manga Flat Edition)
 * Built for Pynn Pridi 37 Construction Progress Portal
 * 
 * Features:
 * - Frameless Clean Fit: sits seamlessly inside the parent card without boxed borders
 * - Sized proportionally with refined scale (~34px height) & balanced horizontal margins
 * - Solid driven section (0% to actual %) with slate architectural concrete & dark ink borders
 * - Radiant pulsing neon emerald energy head & laser flare at active driving tip
 * - FULL remaining pile body (actual % to 100%) rendered in solid light precast concrete with crisp CAD manga outlines
 * - Steel driving shoe cap at 0% (left) and beveled concrete end cap at 100% (right)
 * - Ground ambient contact shadow grounding the full pile structure
 * - Dynamic 3D screen-projected HUD badge pinned over the tip
 * - Real-time sync API: window.update3DIPileProgress(pct, drivenCount, total)
 */

(function () {
  'use strict';

  function initWhenThreeReady() {
    if (typeof THREE === 'undefined') {
      setTimeout(initWhenThreeReady, 100);
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

    // --- 1. RENDERER SETUP (TRANSPARENT WHITE BACKDROP) ---
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xffffff, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // --- 2. SCENE & ORTHOGRAPHIC ISOMETRIC CAMERA ---
    const scene = new THREE.Scene();

    // Pile Span Parameters
    const TOTAL_X_SPAN = 10.0; // 0% to 100% world span
    const START_X = -TOTAL_X_SPAN / 2; // -5.0 (0%)
    const END_X = TOTAL_X_SPAN / 2;    // +5.0 (100%)

    // Width coverage: pile spans 88% of container width (leaves 6% balanced margins on left & right)
    const WIDTH_FILL_RATIO = 0.88;
    let frustumWidth = TOTAL_X_SPAN / WIDTH_FILL_RATIO;
    let aspect = (container.clientWidth || 380) / (container.clientHeight || 80);
    let frustumHeight = frustumWidth / aspect;
    // Lower pile slightly so floating HUD badge has comfortable headroom at top
    let yOffset = -0.06 * frustumHeight;

    const camera = new THREE.OrthographicCamera(
      -frustumWidth / 2,
      frustumWidth / 2,
      frustumHeight / 2 + yOffset,
      -frustumHeight / 2 + yOffset,
      0.1,
      50
    );
    camera.position.set(0, yOffset, 15);
    camera.lookAt(0, yOffset, 0);

    // --- 3. LIGHTING (ARCHITECTURAL SCULPTING) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(4, 7, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x94a3b8, 0.6);
    fillLight.position.set(-5, 2, 2);
    scene.add(fillLight);

    // Dynamic emerald point light at advancing tip
    const tipPointLight = new THREE.PointLight(0x10b981, 2.4, 4.5);
    tipPointLight.position.set(0, 0, 0.8);
    scene.add(tipPointLight);

    // --- 4. ROOT GROUP & 3D ISOMETRIC ORIENTATION ---
    const rootGroup = new THREE.Group();
    // Manga axonometric tilt: show top flange, recessed web, and front bevels
    rootGroup.rotation.x = 0.22;  // ~12.5 deg tilt forward to reveal top flange
    rootGroup.rotation.y = -0.04; // ~2.3 deg tilt to reveal driving shoe face
    rootGroup.position.y = -0.25; // Lower pile slightly for comfortable headroom
    scene.add(rootGroup);

    // --- 5. 2D CROSS SECTION (40x40 cm Prestressed Concrete I-Pile) ---
    // Refined proportioned scale: ~23% smaller than before so it fits comfortably
    const H = 0.98;       // Total cross-section depth
    const W = 0.98;       // Total cross-section width
    const tf = 0.24;      // Flange thickness
    const tw = 0.30;      // Web thickness
    const ch = 0.042;     // Outer corner chamfers
    const haunch = 0.070; // 45-degree haunch transitions

    const halfW = W / 2;
    const halfH = H / 2;
    const halfTw = tw / 2;

    const iShape = new THREE.Shape();
    // Start at top-right corner chamfer
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
    iShape.lineTo(halfH - ch, halfW); // Close shape

    // --- 6. MATERIALS ---
    // 1) Driven Solid Concrete (Completed scope: rich slate precast concrete)
    const drivenConcreteMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Solid architectural slate concrete
      roughness: 0.42,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const drivenEdgeMat = new THREE.LineBasicMaterial({
      color: 0x0f172a, // Bold manga black ink
      linewidth: 2.0
    });

    // 2) Remaining Precast Concrete Pile (Future scope: solid, light, tangible precast)
    const remainingConcreteMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Clean light precast concrete (stands out clearly against white background)
      roughness: 0.52,
      metalness: 0.04,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });

    const remainingEdgeMat = new THREE.LineBasicMaterial({
      color: 0x334155, // Slate manga CAD outline
      transparent: true,
      opacity: 0.88,
      linewidth: 1.5
    });

    // 3) Steel Driving Shoe Cap (at 0%)
    const steelHeadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.32,
      metalness: 0.8
    });

    // 4) Ground Ambient Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(TOTAL_X_SPAN + 0.5, 1.05);
    shadowGeo.rotateX(-Math.PI / 2);
    shadowGeo.translate(0, -halfW - 0.02, 0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.10
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    rootGroup.add(shadowMesh);

    // 5) Steel Driving Head Cap at 0% (Far Left)
    const capThickness = 0.12;
    const capGeo = new THREE.ExtrudeGeometry(iShape, { depth: capThickness, bevelEnabled: false });
    capGeo.rotateY(Math.PI / 2);
    const capMesh = new THREE.Mesh(capGeo, steelHeadMat);
    capMesh.position.set(START_X - capThickness, 0, 0);
    rootGroup.add(capMesh);

    const capEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(capGeo, 20),
      new THREE.LineBasicMaterial({ color: 0x020617, linewidth: 2 })
    );
    capEdges.position.copy(capMesh.position);
    rootGroup.add(capEdges);

    // 6) Beveled Concrete End Cap at 100% (Far Right)
    const endCapThickness = 0.08;
    const endCapGeo = new THREE.ExtrudeGeometry(iShape, { depth: endCapThickness, bevelEnabled: false });
    endCapGeo.rotateY(Math.PI / 2);
    const endCapMesh = new THREE.Mesh(endCapGeo, remainingConcreteMat);
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

    // --- 7. GLOWING ADVANCING TIP (หัวเรืองเเสง & LASER RING) ---
    const tipGlowGroup = new THREE.Group();
    rootGroup.add(tipGlowGroup);

    // Neon emerald face
    const glowFaceGeo = new THREE.ShapeGeometry(iShape);
    glowFaceGeo.rotateY(Math.PI / 2);
    const glowFaceMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide
    });
    const glowFaceMesh = new THREE.Mesh(glowFaceGeo, glowFaceMat);
    tipGlowGroup.add(glowFaceMesh);

    // Laser ring outline around I-beam perimeter
    const laserRingGeo = new THREE.EdgesGeometry(glowFaceGeo);
    const laserRingMat = new THREE.LineBasicMaterial({
      color: 0x34d399,
      linewidth: 3.0
    });
    const laserRingMesh = new THREE.LineSegments(laserRingGeo, laserRingMat);
    tipGlowGroup.add(laserRingMesh);

    // Radiant energy cone flare
    const beamLength = 0.85;
    const beamGeo = new THREE.CylinderGeometry(0.24, 0.08, beamLength, 16, 1, true);
    beamGeo.rotateZ(-Math.PI / 2);
    beamGeo.translate(beamLength / 2, 0, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    tipGlowGroup.add(beamMesh);

    // Pulse disk
    const ringGeo = new THREE.RingGeometry(0.24, 0.35, 24);
    ringGeo.rotateY(Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x059669,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    tipGlowGroup.add(ringMesh);

    // Current State
    let currentPercent = 14.0;
    let targetPercent = 14.0;
    let currentDrivenCount = 13;
    let targetDrivenCount = 13;

    // --- 8. REBUILD PILE MESHES ---
    function rebuildPileMeshes(pct) {
      const clampedPct = Math.max(0.5, Math.min(100, pct));
      const drivenLength = (clampedPct / 100) * TOTAL_X_SPAN;
      const remainingLength = TOTAL_X_SPAN - drivenLength;
      const currentTipX = START_X + drivenLength;

      // 1. Dispose old solid driven meshes
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
          new THREE.EdgesGeometry(solidGeo, 24),
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

      // Create Remaining Solid Concrete Pile (actual % to 100%) - VISIBLE, SOLID, FULL!
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
          new THREE.EdgesGeometry(remainingGeo, 24),
          remainingEdgeMat
        );
        remainingPileEdges.position.copy(remainingPileMesh.position);
        rootGroup.add(remainingPileEdges);
      }

      // 3. Position the Glowing Tip at the driving frontier
      tipGlowGroup.position.set(currentTipX, 0, 0);
      tipPointLight.position.set(currentTipX + 0.1, 0, 0.7);

      // 4. Update the Floating Tip % Badge with precision 3D screen projection
      updateTipCalloutPosition(clampedPct, currentTipX);
    }

    // --- 9. UPDATE 3D-TO-SCREEN TIP CALLOUT ---
    function updateTipCalloutPosition(pct, tipX) {
      const callout = document.getElementById('ipile-tip-callout');
      const textEl = document.getElementById('ipile-tip-text');
      const elMasterPct = document.getElementById('portal-piling-percent');

      if (callout && camera) {
        const clamped = Math.max(0.5, Math.min(100, pct));
        const posX = tipX !== undefined ? tipX : (START_X + (clamped / 100) * TOTAL_X_SPAN);
        // Anchor point atop the top flange at tipX
        const p = new THREE.Vector3(posX, halfW + 0.08, 0);
        p.applyMatrix4(rootGroup.matrixWorld);
        p.project(camera);

        // p.x is in NDC: -1.0 (left edge) to +1.0 (right edge)
        const screenPercentX = ((p.x + 1) / 2) * 100;
        const clampedScreen = Math.max(5, Math.min(95, screenPercentX));
        callout.style.left = `${clampedScreen}%`;
      }

      if (textEl) {
        if (elMasterPct && elMasterPct.textContent && elMasterPct.textContent.includes('%')) {
          textEl.textContent = elMasterPct.textContent.trim();
        } else {
          textEl.textContent = `${targetPercent.toFixed(1)}%`;
        }
      }
    }

    // --- 10. PUBLIC API: UPDATE PROGRESS ---
    window.update3DIPileProgress = function (newPercent, drivenCount, total) {
      targetPercent = Math.max(0, Math.min(100, parseFloat(newPercent) || 0));
      targetDrivenCount = drivenCount !== undefined ? drivenCount : Math.round((targetPercent / 100) * (total || 93));

      const textEl = document.getElementById('ipile-tip-text');
      const elMasterPct = document.getElementById('portal-piling-percent');
      if (textEl) {
        if (elMasterPct && elMasterPct.textContent && elMasterPct.textContent.includes('%')) {
          textEl.textContent = elMasterPct.textContent.trim();
        } else {
          textEl.textContent = `${targetPercent.toFixed(1)}%`;
        }
      }
    };

    // Auto-detect initial progress from DOM
    function syncInitialProgress() {
      const elPct = document.getElementById('portal-piling-percent');
      const elDriven = document.getElementById('portal-piling-driven-count');

      let pctVal = 14.0;
      let countVal = 13;

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
      const width = container.clientWidth;
      const height = container.clientHeight || 80;
      if (width === 0 || height === 0) return;

      aspect = width / height;
      frustumWidth = TOTAL_X_SPAN / WIDTH_FILL_RATIO;
      frustumHeight = frustumWidth / aspect;
      yOffset = -0.06 * frustumHeight;

      camera.left = -frustumWidth / 2;
      camera.right = frustumWidth / 2;
      camera.top = frustumHeight / 2 + yOffset;
      camera.bottom = -frustumHeight / 2 + yOffset;
      camera.position.set(0, yOffset, 15);
      camera.lookAt(0, yOffset, 0);
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
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
      const textEl = document.getElementById('ipile-tip-text');
      const elMasterPct = document.getElementById('portal-piling-percent');
      if (textEl && elMasterPct && elMasterPct.textContent) {
        const masterStr = elMasterPct.textContent.trim();
        if (masterStr.includes('%') && textEl.textContent !== masterStr) {
          textEl.textContent = masterStr;
        }
      }

      // Pulsating glowing beam & energy rings at the tip
      const pulse = 1.0 + Math.sin(elapsed * 4.5) * 0.22;
      glowFaceMat.opacity = 0.85 + Math.sin(elapsed * 4.5) * 0.14;
      beamMat.opacity = 0.35 + Math.sin(elapsed * 3.5) * 0.14;
      beamMesh.scale.set(1.0 + Math.sin(elapsed * 3.0) * 0.1, pulse, pulse);
      ringMesh.scale.set(pulse, pulse, 1.0);
      laserRingMesh.scale.set(1.0, pulse, 1.0);
      tipPointLight.intensity = 2.4 + Math.sin(elapsed * 4.5) * 0.7;

      renderer.render(scene, camera);
    }

    animate();
  }
})();
