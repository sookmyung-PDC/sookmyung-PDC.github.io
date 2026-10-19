// Live 3D peptide-drug conjugate for the home capsule (three.js r128).
(() => {
  // The 3D hero runs for everyone. Windows turns "animation effects" off in several
  // power profiles, so the OS flag would silence the figure for visitors who never asked for that.
  // To honour the setting again, put the matchMedia check back here.
  const reduce = document.documentElement.dataset.motion === "off";
  const heroCanvas = document.getElementById("heroGL");
  if (!heroCanvas || !window.THREE) return;
  /* ---------- 3D: MPD1 drug conjugate and caspase-3 (three.js) ---------- */
  const T3 = window.THREE;
  const ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
  function radialTexture(r, g, b, mid = 0.25) {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(mid, `rgba(${r},${g},${b},.5)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    return new T3.CanvasTexture(c);
  }
  const hash3 = (x, y, z) => { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), f = t => t * t * (3 - 2 * t), u = f(x - xi), v = f(y - yi), w = f(z - zi);
    const L = (a, b, t) => a + (b - a) * t, c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
    return L(L(L(c(0,0,0), c(1,0,0), u), L(c(0,1,0), c(1,1,0), u), v), L(L(c(0,0,1), c(1,0,1), u), L(c(0,1,1), c(1,1,1), u), v), w) * 2 - 1;
  }
  const fbm = (x, y, z) => 0.5 * vnoise(x, y, z) + 0.25 * vnoise(x * 2.03, y * 2.03, z * 2.03) + 0.125 * vnoise(x * 4.1, y * 4.1, z * 4.1);

  // MPD1 after the published structure: EMC – Ac-Lys-Gly-Asp-Glu-Val-Asp – PABC – doxorubicin
  function buildMPD1() {
    const A = [], B = [];
    const add = (x, y, z, e, part) => { A.push({ p: new T3.Vector3(x, y, z), e, part }); return A.length - 1; };
    const bond = (i, j) => B.push([i, j]);
    const ringAt = (c, r, n, rot, els, part, inPlane = true) => {
      const ids = [];
      for (let k = 0; k < n; k++) { const a = rot + k * 2 * Math.PI / n; ids.push(add(c.x + r * Math.cos(a), c.y + (inPlane ? r * Math.sin(a) : 0), c.z + (inPlane ? 0 : r * Math.sin(a)), els[k] || "C", part)); }
      for (let k = 0; k < n; k++) bond(ids[k], ids[(k + 1) % n]);
      return ids;
    };
    const branch = (from, els, dir, part) => { let prev = from; const p0 = A[from].p, out = []; els.forEach((e, k) => { const q = add(p0.x + dir.x * 1.25 * (k + 1) + 0.3 * k, p0.y + dir.y * 1.25 * (k + 1), p0.z + dir.z * 1.25 * (k + 1), e, part); bond(prev, q); prev = q; out.push(q); }); return out; };
    const mal = ringAt(new T3.Vector3(0, 0, 0), 1.15, 5, 0, ["N", "C", "C", "C", "C"], "emc");
    [mal[1], mal[4]].forEach(id => { const p = A[id].p, d = p.clone().normalize(); bond(id, add(p.x + d.x * 1.2, p.y + d.y * 1.2, 0, "O", "emc")); });
    let x = A[mal[0]].p.x, prev = mal[0], zig = 0;
    const step = (e, part) => { x += 1.25; zig ^= 1; const id = add(x, zig ? 0.55 : -0.55, 0.25 * Math.sin(x * 0.7), e, part); bond(prev, id); prev = id; return id; };
    for (let k = 0; k < 5; k++) step("C", "emc");
    const co = step("C", "emc"); branch(co, ["O"], new T3.Vector3(0, 1, 0.2), "emc");
    step("N", "pep");
    for (let k = 0; k < 4; k++) step("C", "pep");
    const caK = step("C", "pep"); { const ac = branch(caK, ["N", "C", "C"], new T3.Vector3(0, 0.3, 1), "pep"); branch(ac[1], ["O"], new T3.Vector3(0, 1, 0), "pep"); }
    const residue = (side, d) => { const c = step("C", "pep"); branch(c, ["O"], new T3.Vector3(0, zig ? 1 : -1, 0.3), "pep"); step("N", "pep"); const ca = step("C", "pep"); if (side) side(ca, d); return ca; };
    const acid = n => (ca, d) => { const s = branch(ca, Array(n).fill("C"), d, "pep"); branch(s[s.length - 1], ["O"], new T3.Vector3(0.6, d.y, d.z), "pep"); branch(s[s.length - 1], ["O"], new T3.Vector3(-0.6, d.y, d.z), "pep"); };
    residue(null);
    residue(acid(2), new T3.Vector3(0, 0.2, -1));
    residue(acid(3), new T3.Vector3(0, -0.2, 1));
    residue((ca, d) => { const s = branch(ca, ["C"], d, "pep"); branch(s[0], ["C"], new T3.Vector3(0.7, 0.6, d.z), "pep"); branch(s[0], ["C"], new T3.Vector3(-0.5, -0.7, d.z), "pep"); }, new T3.Vector3(0, 0.2, -1));
    residue(acid(2), new T3.Vector3(0, -0.2, 1));
    const cD = step("C", "pep"); branch(cD, ["O"], new T3.Vector3(0, 1, 0.3), "pep");
    const nAm = step("N", "pabc");
    const benz = ringAt(new T3.Vector3(x + 2.45, 0, 0), 1.2, 6, Math.PI, [], "pabc", false);
    bond(nAm, benz[0]); x = A[benz[3]].p.x; prev = benz[3]; zig = 0;
    step("C", "pabc"); step("O", "pabc"); const cc = step("C", "pabc"); branch(cc, ["O"], new T3.Vector3(0, -1, 0.3), "pabc");
    const nDox = step("N", "pay");
    const sug = ringAt(new T3.Vector3(x + 1.6, 1.3, 0.4), 1.2, 6, Math.PI * 1.15, ["C", "C", "C", "O", "C", "C"], "pay");
    bond(nDox, sug[0]); branch(sug[2], ["C"], new T3.Vector3(0.2, 1, 0.4), "pay");
    const gly = branch(sug[4], ["O"], new T3.Vector3(0.7, -0.7, 0), "pay")[0];
    const a = 1.25, s3 = Math.sqrt(3), base = A[gly].p.clone().add(new T3.Vector3(1.2, -1.4, 0));
    const key = new Map(), rings = [];
    for (let j = 0; j < 4; j++) {
      const cx = base.x + j * s3 * a, ids = [];
      for (let v = 0; v < 6; v++) { const ang = Math.PI / 6 + v * Math.PI / 3, px = cx + a * Math.cos(ang), py = base.y + a * Math.sin(ang), k = Math.round(px * 100) + "," + Math.round(py * 100); let id = key.get(k); if (id === undefined) { id = add(px, py, base.z, "C", "pay"); key.set(k, id); } ids.push(id); }
      rings.push(ids);
    }
    const seen = new Set();
    rings.forEach(ids => { for (let v = 0; v < 6; v++) { const p = ids[v], q = ids[(v + 1) % 6], k = p < q ? p + "-" + q : q + "-" + p; if (!seen.has(k)) { seen.add(k); bond(p, q); } } });
    bond(gly, rings[0][3]);
    const sub = (id, dx, dy, els) => branch(id, els, new T3.Vector3(dx, dy, 0), "pay");
    sub(rings[0][1], 0, 1, ["O"]); sub(rings[0][4], 0, -1, ["C", "C", "O"]);
    sub(rings[1][1], 0, 1, ["O"]); sub(rings[1][4], 0, -1, ["O"]);
    sub(rings[2][1], 0, 1, ["O"]); sub(rings[2][4], 0, -1, ["O"]);
    sub(rings[3][0], 1, 0.4, ["O", "C"]);
    const pc = new T3.Vector3(); let n = 0; A.forEach(t => { if (t.part === "pay") { pc.add(t.p); n++; } }); pc.divideScalar(n);
    const tilt = new T3.Matrix4().makeRotationX(0.9);
    A.forEach(t => { if (t.part === "pay") t.p.sub(pc).applyMatrix4(tilt).add(pc); });
    A.forEach(t => { const ang = t.p.x * 0.05, y = t.p.y, z = t.p.z; t.p.y = y * Math.cos(ang) - z * Math.sin(ang); t.p.z = y * Math.sin(ang) + z * Math.cos(ang); });
    const c = new T3.Vector3(); A.forEach(t => c.add(t.p)); c.divideScalar(A.length); A.forEach(t => t.p.sub(c));
    return { A, B, cut: [cD, nAm] };
  }

  // colour sweep along the molecule: white at the albumin binder, through the eight palette colours, magenta at the drug
  const SPEC = [[0, 0xDADDE4], [0.14, 0xFAFAFA], [0.28, 0x4CA8FF], [0.4, 0x22D3EE], [0.5, 0xA3E635], [0.58, 0x3DDC84], [0.68, 0xFFB01F], [0.78, 0xFB7185], [0.89, 0xA78BFA], [1, 0xE05BC8]];
  const specAt = t => {
    t = Math.min(1, Math.max(0, t));
    for (let i = 1; i < SPEC.length; i++) if (t <= SPEC[i][0]) { const [t0, c0] = SPEC[i - 1], [t1, c1] = SPEC[i]; return new T3.Color(c0).lerp(new T3.Color(c1), (t - t0) / (t1 - t0)); }
    return new T3.Color(SPEC[SPEC.length - 1][1]);
  };

  function moleculeScene(canvas, opts) {
    let renderer;
    // preserveDrawingBuffer keeps the last frame on screen through resizes and page captures
    try { renderer = new T3.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" }); }
    catch (e) { return null; }
    renderer.setClearColor(0x000000, 0);
    const scene = new T3.Scene();
    scene.fog = new T3.FogExp2(0x09090b, opts.fog ?? 0.02);
    const camera = new T3.PerspectiveCamera(34, 1, 0.1, 200);
    camera.position.set(0, 0, 30);
    scene.add(new T3.AmbientLight(0x2c2c34, 0.7));
    scene.add(new T3.HemisphereLight(0xffffff, 0x0b0b0d, 0.42));
    const key = new T3.DirectionalLight(0xffffff, 0.95); key.position.set(-10, 12, 18); scene.add(key);
    const rim = new T3.DirectionalLight(0xa78bfa, 1.0); rim.position.set(12, -5, -14); scene.add(rim);
    const rim2 = new T3.DirectionalLight(0x22d3ee, 0.55); rim2.position.set(-14, -8, -10); scene.add(rim2);

    const mol = buildMPD1();
    let minX = Infinity, maxX = -Infinity; mol.A.forEach(t => { minX = Math.min(minX, t.p.x); maxX = Math.max(maxX, t.p.x); });
    const tOf = p => (p.x - minX) / (maxX - minX);
    const centroid = f => { const v = new T3.Vector3(); let k = 0; mol.A.forEach(t => { if (f(t)) { v.add(t.p); k++; } }); return v.divideScalar(k || 1); };
    const doxC = centroid(t => t.part === "pay"), pabcC = centroid(t => t.part === "pabc"), emcC = centroid(t => t.part === "emc"), devdC = centroid(t => t.part === "pep");
    const stage = new T3.Group(); scene.add(stage);
    const molGroup = new T3.Group(); stage.add(molGroup);
    const anchor = new T3.Group(), rel = new T3.Group(); molGroup.add(anchor, rel); rel.position.copy(doxC);

    const sphere = new T3.SphereGeometry(1, 24, 18), cyl = new T3.CylinderGeometry(1, 1, 1, 12, 1, false);
    const cache = new Map(), fadeLnk = [], fadePay = [], WHITE = new T3.Color(0xffffff);
    const phys = (color, extra) => new T3.MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0.04, clearcoat: 0.8, clearcoatRoughness: 0.18, ...extra });
    const keep = (m, grp) => { if (grp === "lnk") fadeLnk.push(m); if (grp === "pay") fadePay.push(m); return m; };
    function atomMat(t, el, grp) {
      const q = Math.round(t * 40) / 40, k = "a" + q + el + grp;
      if (!cache.has(k)) {
        const c = specAt(q); if (el === "O") c.lerp(WHITE, 0.42); else if (el === "N") c.lerp(WHITE, 0.22);
        cache.set(k, keep(phys(c, { emissive: c.clone().multiplyScalar(grp === "pay" ? 0.34 : 0.12), transparent: grp !== "base" }), grp));
      }
      return cache.get(k);
    }
    function bondMat(t, grp) {
      const q = Math.round(t * 40) / 40, k = "b" + q + grp;
      if (!cache.has(k)) { const c = specAt(q).multiplyScalar(0.6); cache.set(k, keep(phys(c, { roughness: 0.42, clearcoat: 0.45, emissive: c.clone().multiplyScalar(grp === "pay" ? 0.3 : 0.08), transparent: grp !== "base" }), grp)); }
      return cache.get(k);
    }
    const R = { C: 0.5, N: 0.48, O: 0.46 };
    const cutMat = new T3.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1 });
    const grpOf = t => t.part === "pay" ? "pay" : t.part === "pabc" ? "lnk" : "base";
    mol.A.forEach(t => {
      const g = grpOf(t), m = new T3.Mesh(sphere, atomMat(tOf(t.p), t.e, g));
      m.scale.setScalar(g === "pay" && t.e === "C" ? 0.52 : R[t.e]);
      if (g === "base") { m.position.copy(t.p); anchor.add(m); } else { m.position.copy(t.p).sub(doxC); rel.add(m); }
    });
    const cylBetween = (a, b, mat, r) => { const d = new T3.Vector3().subVectors(b, a), len = d.length(), m = new T3.Mesh(cyl, mat); m.scale.set(r, len, r); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T3.Vector3(0, 1, 0), d.normalize()); return m; };
    let cutBond = null; const cutMid = new T3.Vector3();
    const inRel = t => t.part === "pay" || t.part === "pabc";
    mol.B.forEach(([i, j]) => {
      const A = mol.A[i], B = mol.A[j];
      if ((i === mol.cut[0] && j === mol.cut[1]) || (i === mol.cut[1] && j === mol.cut[0])) { cutBond = cylBetween(A.p, B.p, cutMat, 0.17); molGroup.add(cutBond); cutMid.copy(A.p).add(B.p).multiplyScalar(0.5); return; }
      const tm = (tOf(A.p) + tOf(B.p)) / 2;
      if (inRel(A) && inRel(B)) rel.add(cylBetween(A.p.clone().sub(doxC), B.p.clone().sub(doxC), bondMat(tm, A.part === "pay" && B.part === "pay" ? "pay" : "lnk"), 0.15));
      else anchor.add(cylBetween(A.p, B.p, bondMat(tm, "base"), 0.15));
    });

    // caspase-3: a lumpy violet enzyme that docks at the DEVD–PABC bond
    const eg = new T3.SphereGeometry(1, 72, 54), ep = eg.attributes.position, ev = new T3.Vector3();
    for (let i = 0; i < ep.count; i++) { ev.fromBufferAttribute(ep, i).normalize(); const r = 2.5 * (1 + 0.16 * fbm(ev.x * 2.2 + 4, ev.y * 2.2, ev.z * 2.2) + 0.05 * fbm(ev.x * 6, ev.y * 6, ev.z * 6)); ep.setXYZ(i, ev.x * r, ev.y * r, ev.z * r); }
    eg.computeVertexNormals();
    const enzMat = new T3.MeshPhysicalMaterial({ color: 0xa78bfa, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3, emissive: 0x241a52, transparent: true, opacity: 0 });
    const enzyme = new T3.Mesh(eg, enzMat); molGroup.add(enzyme);
    const enzDir = new T3.Vector3(0.15, 1, 0.65).normalize();

    const magentaT = radialTexture(224, 91, 200), cool = radialTexture(240, 240, 240, 0.2), cyanT = radialTexture(34, 211, 238, 0.22);
    const sprite = (tex, op) => new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true, opacity: op, depthWrite: false, blending: T3.AdditiveBlending }));
    const payGlow = sprite(magentaT, 0); payGlow.scale.set(10, 10, 1); rel.add(payGlow);
    const payLight = new T3.PointLight(0xe05bc8, 0, 16, 2); rel.add(payLight);
    const flash = sprite(cool, 0); flash.position.copy(cutMid); molGroup.add(flash);
    const bondGlow = sprite(cyanT, 0.4); bondGlow.position.copy(cutMid); bondGlow.scale.set(2.8, 2.8, 1); molGroup.add(bondGlow);
    const pabcRel = pabcC.clone().sub(doxC);
    const lnkFlash = sprite(cool, 0); lnkFlash.position.copy(pabcRel); lnkFlash.scale.set(5, 5, 1); rel.add(lnkFlash);

    // fluorescent bokeh in the eight palette colours
    const NB = opts.bokeh ?? 240, pos = new Float32Array(NB * 3), col = new Float32Array(NB * 3);
    const PAL = [0x4ca8ff, 0x22d3ee, 0xa3e635, 0x3ddc84, 0xffb01f, 0xfb7185, 0xa78bfa, 0xe05bc8, 0xfafafa];
    const sp = opts.spread || [80, 44, 48];
    for (let i = 0; i < NB; i++) { pos[i * 3] = (Math.random() - 0.5) * sp[0]; pos[i * 3 + 1] = (Math.random() - 0.5) * sp[1]; pos[i * 3 + 2] = -38 + Math.random() * sp[2]; const c = new T3.Color(PAL[i % PAL.length]); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    const pg = new T3.BufferGeometry(); pg.setAttribute("position", new T3.BufferAttribute(pos, 3)); pg.setAttribute("color", new T3.BufferAttribute(col, 3));
    const dust = new T3.Points(pg, new T3.PointsMaterial({ size: opts.dustSize ?? 0.75, map: radialTexture(255, 255, 255), vertexColors: true, transparent: true, opacity: opts.dustOpacity ?? 0.5, depthWrite: false, blending: T3.AdditiveBlending, sizeAttenuation: true }));
    scene.add(dust);

    const T = 10, uc = 4.2;
    const drift = new T3.Vector3(1, 0.3, 0.5).normalize();
    let frameState = null;
    function update(t) {
      molGroup.rotation.y = -0.32 + 0.26 * Math.sin(t * 0.16);
      molGroup.rotation.x = 0.16 * Math.sin(t * 0.11);
      molGroup.rotation.z = (opts.rotZ || 0) + 0.05 * Math.sin(t * 0.07);
      dust.rotation.y = t * 0.01;
      const u = t % T, s = u - uc;
      const dist = 1.7 + 5.5 * (1 - ss(uc - 2.4, uc - 0.2, u)) + 6.5 * ss(uc + 0.5, uc + 2.4, u);
      enzyme.position.copy(cutMid).addScaledVector(enzDir, 0.9 + dist);
      enzyme.rotation.set(t * 0.25, t * 0.18, 0);
      enzMat.opacity = 0.9 * ss(uc - 2.9, uc - 2.0, u) * (1 - ss(uc + 1.7, uc + 2.5, u));
      let off = 0, spin = 0, payOp = 1, lnkOp = 1, glowV = 0, fl = 0, fl2 = 0, attached = true;
      if (s >= 0) {
        if (u < T - 0.6) {
          attached = false; off = 6.5 * (1 - Math.exp(-0.85 * s)); spin = s * 0.5;
          lnkOp = 1 - ss(0.6, 1.5, s); payOp = 1 - ss(4.1, 5.0, s);
          glowV = ss(0, 0.7, s) * (1 - ss(3.8, 4.7, s)); fl = s < 0.8 ? 1 - s / 0.8 : 0; fl2 = s > 0.6 && s < 1.6 ? Math.sin((s - 0.6) * Math.PI) : 0;
        } else { payOp = lnkOp = ss(T - 0.6, T, u); }
      }
      rel.position.copy(doxC).addScaledVector(drift, off);
      rel.rotation.set(spin * 0.5, spin, spin * 0.25);
      fadeLnk.forEach(m => { m.opacity = lnkOp; });
      fadePay.forEach(m => { m.opacity = payOp; });
      payGlow.material.opacity = 0.95 * glowV; payLight.intensity = 2.6 * glowV;
      cutBond.visible = attached; cutMat.opacity = attached ? Math.min(lnkOp, payOp) : 0;
      const near = 1 - ss(1.7, 4.5, dist);
      bondGlow.material.opacity = attached ? (0.3 + 0.16 * Math.sin(t * 3) + 0.6 * near) * payOp : 0;
      flash.material.opacity = fl; const fs = 1 + 9 * (1 - fl); flash.scale.set(fs, fs, 1);
      lnkFlash.material.opacity = 0.7 * fl2;
      frameState = { anchor, rel, emcC, devdC, pabcRel, lnkOp, payOp };
      if (opts.onFrame) opts.onFrame({ camera });
    }
    function layout() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
      if (opts.layout) opts.layout(stage, camera, { w, h, molLen: maxX - minX });
    }
    let raf = 0, visible = true, lastT = null; const t0 = performance.now();
    const frame = now => { lastT = (now - t0) / 1000; update(lastT); renderer.render(scene, camera); if (opts.afterRender) opts.afterRender(); raf = requestAnimationFrame(frame); };
    const start = () => { if (raf || reduce || !visible || document.hidden) return; raf = requestAnimationFrame(frame); };
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
    const still = () => { update(lastT != null ? lastT : uc + 1.2); renderer.render(scene, camera); if (opts.afterRender) opts.afterRender(); };
    layout(); still();
    if ("ResizeObserver" in window) new ResizeObserver(() => { layout(); still(); }).observe(canvas);
    if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    document.addEventListener("visibilitychange", () => document.hidden ? stop() : start());
    start();
    return { camera, state: () => frameState, still, relayout: () => { layout(); still(); } };
  }

  // places the molecule so that it is centred on canvas pixel (px, py) and spans widthPx
  function placeAt(stage, camera, m, px, py, widthPx) {
    const halfH = Math.tan(camera.fov * Math.PI / 360) * 30, halfW = halfH * camera.aspect;
    stage.position.set((px / m.w * 2 - 1) * halfW, -(py / m.h * 2 - 1) * halfH, 0);
    stage.scale.setScalar((widthPx / m.w) * 2 * halfW / m.molLen);
  }

  const ptr = { x: 0, y: 0 };
  window.addEventListener("pointermove", e => { ptr.x = e.clientX / innerWidth - 0.5; ptr.y = e.clientY / innerHeight - 0.5; }, { passive: true });
  const narrow = () => window.matchMedia("(max-width: 760px)").matches;
  const scene = moleculeScene(heroCanvas, {
    bokeh: 70, spread: [40, 40, 40], rotZ: 0.1, dustOpacity: 0.4, dustSize: 0.6,
    layout(stage, camera, m) { const p = narrow(); placeAt(stage, camera, m, m.w * 0.5, m.h * (p ? 0.5 : 0.47), m.w * (p ? 0.92 : 0.98)); },
    onFrame({ camera }) { camera.position.x += (ptr.x * 0.7 - camera.position.x) * 0.04; camera.position.y += (-ptr.y * 0.45 - camera.position.y) * 0.04; camera.lookAt(0, 0, 0); }
  });
  if (scene) scene.still();
})();
