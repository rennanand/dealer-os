// <car-hero> — persistent 3D car (three.js, pinned 0.184.0) with Tesla-style camera flights between views.
// Attributes: view="side|quarter|rear|top|orbit|front"  paint="#rrggbb"  zoom="1" (framing multiplier; <1 pulls the camera back)  autorotate="true"  drag="true"
//             model="uploads/hardtop.glb.txt uploads/hardtop.obj" (optional, space-separated candidates; GLB or OBJ; falls back to the built-in crossover)
//             swipe-target="<css selector>" (a horizontal scroll-snap strip: swipes on the car scroll it, its scroll tilts the car)
(function () {
  
  let threeP = null;
  const loadThree = () => (threeP = threeP || import('three'));
  const VIEWS = { // [yaw, pitch, distance]
    side: [Math.PI / 2, 1.34, 6.4], quarter: [0.62, 1.2, 6.8], front: [0.18, 1.22, 6.6], rear: [Math.PI - 0.7, 1.22, 6.8],
    top: [Math.PI / 2, 0.16, 7.4], orbit: [1.1, 1.3, 6.7]
  };
  const PALETTE = { underbody: 0x0b0c0d, interior: 0x1a1612, chrome: 0xf1f3f4, glass: 0x18212b, satin_black: 0x121417, rubber: 0x141516, headlamp: 0xeef0ea, amber: 0xd9842a, taillamp: 0xa8130c };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  class CarHero extends HTMLElement {
    static get observedAttributes() { return ['view', 'paint', 'zoom', 'autorotate', 'drag', 'swipe-target', 'swipetarget', 'model']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = '<style>:host{display:block;position:relative;width:100%;height:100%;min-height:80px;touch-action:pan-y}canvas{display:block;width:100%;height:100%;outline:none}</style><canvas></canvas>';
      this.canvas = this.shadowRoot.querySelector('canvas');
      this.cur = { t: 1.1, p: 1.3, d: 6.7 }; this.tgt = { t: 1.1, p: 1.3, d: 6.7 }; this.from = null; this.tw0 = 0;
      this.tilt = 0; this.visible = true; this.dragging = false; this.idleT = 0;
    }
    connectedCallback() { this.init(); }
    disconnectedCallback() { this.alive = false; cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); if (this.renderer) this.renderer.dispose(); }
    attributeChangedCallback(n) { if (n === 'view') this.setView(); if (n === 'paint') this.setPaint(); }
    setView() {
      const v = VIEWS[this.getAttribute('view') || 'orbit'] || VIEWS.orbit;
      let t = v[0];
      // shortest yaw path from where we are
      while (t - this.cur.t > Math.PI) t -= Math.PI * 2;
      while (this.cur.t - t > Math.PI) t += Math.PI * 2;
      this.tgt = { t, p: v[1], d: v[2] };
      if (!this.started) { this.cur = Object.assign({}, this.tgt); return; }
      this.from = Object.assign({}, this.cur); this.tw0 = performance.now(); this.idleT = 0;
    }
    setPaint() { if (this.THREE) this.paintTarget = new this.THREE.Color(this.getAttribute('paint') || '#b9bdc3'); }
    async init() {
      const THREE = await loadThree();
      if (!this.isConnected) return;
      this.THREE = THREE; this.alive = true;
      const renderer = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
      const scene = this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      scene.environment = this.makeEnv(THREE, renderer);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1c22, 0.55));
      const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 7, 3); key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = key.shadow.camera.bottom = -4; key.shadow.camera.right = key.shadow.camera.top = 4; key.shadow.radius = 6; key.shadow.bias = -0.0005;
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xdfe8ff, 0.9); rim.position.set(-5, 4, -4); scene.add(rim);
      this.mats = this.makeMaterials(THREE);
      scene.add(this.buildGround(THREE));
      this.car = await this.loadModel(THREE);
      if (!this.alive) return;
      scene.add(this.car);
      this.addLampGlow(THREE, scene);
      this.setPaint(); if (this.paintTarget) this.mats.paint.color.copy(this.paintTarget);
      this.setView();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
      this.io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; }, { threshold: 0.01 }); this.io.observe(this);
      this.resize(); this.bindInput();
      this.started = true;
      this.loop();
    }
    addLampGlow(THREE, scene) {
      // Head and tail lamps glow: a tight point light at each lamp mesh, in the lamp's color.
      const groups = { headlamp: [], taillamp: [] };
      this.car.updateMatrixWorld(true);
      this.car.traverse(o => { if (o.isMesh && o.material && groups[o.material.name]) groups[o.material.name].push(o); });
      Object.keys(groups).forEach(k => {
        groups[k].slice(0, 4).forEach(m => {
          const box = new THREE.Box3().setFromObject(m); if (box.isEmpty()) return;
          const c = box.getCenter(new THREE.Vector3());
          const l = new THREE.PointLight(k === 'headlamp' ? 0xffc14a : 0xff2010, k === 'headlamp' ? 1.6 : 1.4, 1.6, 2);
          l.position.copy(c); scene.add(l);
        });
      });
    }
    makeEnv(THREE, renderer) {
      const s = new THREE.Scene();
      const panel = (w, h, x, y, z, i, rx, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(i) })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); s.add(m); };
      s.add(new THREE.Mesh(new THREE.SphereGeometry(30, 8, 8), new THREE.MeshBasicMaterial({ color: 0x0a0b0d, side: THREE.BackSide })));
      panel(18, 3, 0, 9, 0, 4.2, Math.PI / 2); panel(18, 1.2, 0, 9, 4.5, 2.4, Math.PI / 2); panel(10, 4, -9, 3, 0, 1.3, 0, Math.PI / 2); panel(10, 4, 9, 3, 0, 0.8, 0, -Math.PI / 2); panel(16, 3, 0, 2, -12, 0.5); panel(16, 2, 0, 1.5, 12, 0.35, 0, Math.PI);
      const pm = new THREE.PMREMGenerator(renderer); const tex = pm.fromScene(s, 0.04).texture; pm.dispose(); return tex;
    }
    makeMaterials(THREE) {
      const M = (name, c, rough, metal, extra) => { const m = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: rough, metalness: metal }, extra || {})); m.name = name; return m; };
      return {
        paint: (() => { const m = new THREE.MeshPhysicalMaterial({ color: 0xb9bdc3, roughness: 0.18, metalness: 0.88, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.0 }); m.name = 'paint'; return m; })(),
        glass: M('glass', PALETTE.glass, 0.1, 0.9, { transparent: true, opacity: 0.92, envMapIntensity: 1.8 }),
        chrome: M('chrome', PALETTE.chrome, 0.12, 1), satin_black: M('satin_black', PALETTE.satin_black, 0.6, 0.3),
        rubber: M('rubber', PALETTE.rubber, 0.95, 0), underbody: M('underbody', PALETTE.underbody, 0.9, 0.1), interior: M('interior', PALETTE.interior, 0.9, 0),
        headlamp: M('headlamp', 0xfff1c4, 0.15, 0.2, { emissive: 0xffc14a, emissiveIntensity: 2.4 }),
        amber: M('amber', PALETTE.amber, 0.3, 0.2, { emissive: 0xd9842a, emissiveIntensity: 0.5 }),
        taillamp: M('taillamp', 0xff3b2a, 0.25, 0.2, { emissive: 0xff1608, emissiveIntensity: 3.2 })
      };
    }
    async loadModel(THREE) {
      const urls = (this.getAttribute('model') || '').split(/[,\s]+/).filter(Boolean);
      for (const url of urls) {
        try {
          const r = await fetch(url); if (!r.ok) throw new Error(r.status);
          const buf = await r.arrayBuffer();
          const magic = String.fromCharCode.apply(null, new Uint8Array(buf, 0, 4));
          const g = magic === 'glTF' ? this.parseGLB(THREE, buf) : this.parseOBJ(THREE, new TextDecoder().decode(buf));
          if (g) { this.usingModel = true; Object.values(this.mats).forEach(m => { m.side = THREE.DoubleSide; m.needsUpdate = true; }); return g; } // exported shells are single-surface; render both faces so panels never cull away
        } catch (e) { console.warn('[car-hero] model failed, trying next', url, e); }
      }
      return this.buildCar(THREE);
    }
    parseGLB(THREE, buf) {
      // Minimal glTF 2.0 binary reader (no bare-specifier imports): JSON + BIN chunks → BufferGeometry per primitive, world transforms baked in.
      const dv = new DataView(buf); const total = dv.getUint32(8, true);
      let off = 12, json = null, bin = null;
      while (off + 8 <= total) {
        const cl = dv.getUint32(off, true), ct = dv.getUint32(off + 4, true); off += 8;
        if (ct === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, off, cl)));
        else if (ct === 0x004E4942) bin = buf.slice(off, off + cl);
        off += cl;
      }
      if (!json || !json.meshes || !bin) return null;
      const CT = { 5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array };
      const NC = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };
      const src = new DataView(bin);
      const rd = { 5120: o => src.getInt8(o), 5121: o => src.getUint8(o), 5122: o => src.getInt16(o, true), 5123: o => src.getUint16(o, true), 5125: o => src.getUint32(o, true), 5126: o => src.getFloat32(o, true) };
      const acc = i => {
        const a = json.accessors[i], bv = json.bufferViews[a.bufferView], T = CT[a.componentType], n = NC[a.type] || 1, bpe = T.BYTES_PER_ELEMENT;
        const base = (bv.byteOffset || 0) + (a.byteOffset || 0), stride = bv.byteStride || n * bpe;
        const out = new T(a.count * n), get = rd[a.componentType];
        if (stride === n * bpe) return { arr: new T(bin.slice(base, base + a.count * n * bpe)), n };
        for (let k = 0; k < a.count; k++) for (let j = 0; j < n; j++) out[k * n + j] = get(base + k * stride + j * bpe);
        return { arr: out, n };
      };
      const g = new THREE.Group(); g.name = 'hardtop';
      const nodes = json.nodes || [];
      const walk = (ni, parent) => {
        const nd = nodes[ni]; if (!nd) return; const m = new THREE.Matrix4();
        if (nd.matrix) m.fromArray(nd.matrix);
        else m.compose(new THREE.Vector3().fromArray(nd.translation || [0, 0, 0]), new THREE.Quaternion().fromArray(nd.rotation || [0, 0, 0, 1]), new THREE.Vector3().fromArray(nd.scale || [1, 1, 1]));
        m.premultiply(parent);
        if (nd.mesh !== undefined) (json.meshes[nd.mesh].primitives || []).forEach(p => {
          if ((p.mode !== undefined && p.mode !== 4) || !p.attributes || p.attributes.POSITION === undefined) return;
          const geo = new THREE.BufferGeometry();
          const pos = acc(p.attributes.POSITION); geo.setAttribute('position', new THREE.BufferAttribute(pos.arr, pos.n));
          if (p.attributes.NORMAL !== undefined) { const nr = acc(p.attributes.NORMAL); geo.setAttribute('normal', new THREE.BufferAttribute(nr.arr, nr.n)); }
          if (p.indices !== undefined) { const ix = acc(p.indices); geo.setIndex(new THREE.BufferAttribute(ix.arr, 1)); }
          geo.applyMatrix4(m);
          if (!geo.attributes.normal) geo.computeVertexNormals();
          const mat = p.material !== undefined && json.materials ? json.materials[p.material] : null;
          const name = (mat && mat.name) || json.meshes[nd.mesh].name || nd.name || 'paint';
          const mesh = new THREE.Mesh(geo, this.mats[this.matKey(name)]); mesh.name = name; mesh.castShadow = true; g.add(mesh);
        });
        (nd.children || []).forEach(c => walk(c, m));
      };
      const sc = json.scenes && json.scenes.length ? json.scenes[json.scene || 0] : { nodes: nodes.map((_, i) => i) };
      (sc.nodes || []).forEach(ni => walk(ni, new THREE.Matrix4()));
      if (!g.children.length) return null;
      return this.fitCar(THREE, g);
    }
    matKey(name) {
      return Object.keys(this.mats).find(k => name.toLowerCase().indexOf(k) >= 0) || (/glass|window/i.test(name) ? 'glass' : /tire|tyre/i.test(name) ? 'rubber' : /wheel|rim/i.test(name) ? 'satin_black' : 'paint');
    }
    fitCar(THREE, g) {
      // Ground it, center it, and bring it to car scale (≈4.75 m long) if the export used other units.
      const bb = new THREE.Box3().setFromObject(g); const size = bb.getSize(new THREE.Vector3());
      const len = Math.max(size.x, size.z); const sc = len > 0 ? 4.75 / len : 1;
      if (Math.abs(sc - 1) > 0.15) g.scale.setScalar(sc);
      if (size.z > size.x) g.rotation.y = Math.PI / 2; // long axis along x like the built-in car
      const bb2 = new THREE.Box3().setFromObject(g); const c = bb2.getCenter(new THREE.Vector3());
      g.position.set(-c.x, -bb2.min.y, -c.z);
      return g;
    }
    parseOBJ(THREE, text) {
      // Minimal OBJ reader: v / vn / f with usemtl groups; material names map onto the hardtop.mtl palette.
      const v = [], vn = [], groups = {}; let cur = 'paint';
      const push = (name, a, b, c) => { (groups[name] = groups[name] || { p: [], n: [] }); const G = groups[name]; [a, b, c].forEach(tok => { const i = tok.split('/'); const vi = parseInt(i[0], 10), ni = i[2] ? parseInt(i[2], 10) : 0; const P = v[(vi < 0 ? v.length + vi : vi - 1)]; G.p.push(P[0], P[1], P[2]); if (ni) { const N = vn[(ni < 0 ? vn.length + ni : ni - 1)]; G.n.push(N[0], N[1], N[2]); } }); };
      for (const line of text.split('\n')) {
        const s = line.trim(); if (!s || s[0] === '#') continue;
        const t = s.split(/\s+/);
        if (t[0] === 'v') v.push([+t[1], +t[2], +t[3]]);
        else if (t[0] === 'vn') vn.push([+t[1], +t[2], +t[3]]);
        else if (t[0] === 'usemtl') cur = t[1] || 'paint';
        else if (t[0] === 'f') { for (let i = 2; i < t.length - 1; i++) push(cur, t[1], t[i], t[i + 1]); }
      }
      if (!v.length) return null;
      const g = new THREE.Group(); g.name = 'hardtop';
      Object.keys(groups).forEach(name => {
        const G = groups[name]; const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3));
        if (G.n.length === G.p.length) geo.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3)); else geo.computeVertexNormals();
        const key = this.matKey(name);
        const m = new THREE.Mesh(geo, this.mats[key]); m.name = name; m.castShadow = true; g.add(m);
      });
      return this.fitCar(THREE, g);
    }
    buildCar(THREE) {
      const g = new THREE.Group(); g.name = 'hardtop';
      const { paint, glass, chrome, satin_black: satin, rubber, underbody: under, interior, headlamp: head, taillamp: tail } = this.mats;
      const mesh = (geo, mat, name, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = true; if (x !== undefined) m.position.set(x, y, z); g.add(m); return m; };
      const L = 4.75, W = 1.92;
      const taper = (geo, f) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setZ(i, z * f(x, y)); } p.needsUpdate = true; geo.computeVertexNormals(); return geo; };
      const planTaper = x => 1 - 0.13 * Math.pow(Math.abs(x) / (L / 2), 3);
      const body = new THREE.Shape();
      body.moveTo(-L / 2 + 0.05, 0.44); body.lineTo(-L / 2 + 0.05, 0.9); body.quadraticCurveTo(-L / 2 + 0.1, 1.04, -L / 2 + 0.38, 1.06);
      body.lineTo(-1.5, 1.07); body.quadraticCurveTo(0.3, 1.03, 1.35, 0.9); body.quadraticCurveTo(2.1, 0.82, L / 2 - 0.02, 0.68);
      body.lineTo(L / 2, 0.42); body.quadraticCurveTo(L / 2 - 0.1, 0.3, L / 2 - 0.4, 0.3); body.lineTo(-L / 2 + 0.4, 0.3); body.quadraticCurveTo(-L / 2 + 0.1, 0.3, -L / 2 + 0.05, 0.44);
      const bodyGeo = new THREE.ExtrudeGeometry(body, { depth: W - 0.16, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 5, curveSegments: 24 });
      bodyGeo.translate(0, 0, -(W - 0.16) / 2); taper(bodyGeo, (x, y) => planTaper(x) * (1 - 0.1 * Math.max(0, y - 0.62)));
      mesh(bodyGeo, paint, 'body');
      const cab = new THREE.Shape();
      cab.moveTo(-1.78, 1.04); cab.quadraticCurveTo(-1.74, 1.46, -1.02, 1.53); cab.lineTo(0.08, 1.53); cab.quadraticCurveTo(0.8, 1.49, 1.38, 1.04); cab.lineTo(-1.78, 1.04);
      const cabGeo = new THREE.ExtrudeGeometry(cab, { depth: W - 0.3, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 4, curveSegments: 24 });
      cabGeo.translate(0, 0, -(W - 0.3) / 2); taper(cabGeo, (x, y) => planTaper(x) * (1 - 0.3 * Math.max(0, y - 1.04)));
      mesh(cabGeo, glass, 'glass');
      mesh(new THREE.BoxGeometry(2.7, 0.34, W - 0.7), interior, 'interior', -0.3, 1.14, 0);
      mesh(new THREE.BoxGeometry(L - 0.5, 0.18, W - 0.3), under, 'underbody', 0, 0.3, 0);
      mesh(new THREE.BoxGeometry(L - 0.9, 0.1, W - 0.2), satin, 'sill', 0, 0.36, 0);
      const tireGeo = new THREE.CylinderGeometry(0.37, 0.37, 0.26, 40); tireGeo.rotateX(Math.PI / 2);
      const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.27, 32); rimGeo.rotateX(Math.PI / 2);
      const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.29, 20); hubGeo.rotateX(Math.PI / 2);
      const archGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.03, 40); archGeo.rotateX(Math.PI / 2);
      [[1.48, 0.86], [1.48, -0.86], [-1.48, 0.86], [-1.48, -0.86]].forEach((p, i) => {
        mesh(archGeo, satin, 'arch_' + i, p[0], 0.4, p[1] > 0 ? W / 2 - 0.085 : -W / 2 + 0.085);
        mesh(tireGeo, rubber, 'tire_' + i, p[0], 0.37, p[1]); mesh(rimGeo, satin, 'rim_' + i, p[0], 0.37, p[1]); mesh(hubGeo, chrome, 'hub_' + i, p[0], 0.37, p[1]);
        for (let s = 0; s < 5; s++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.3), chrome); sp.position.set(p[0], 0.37, p[1]); sp.rotation.z = (s / 5) * Math.PI * 2; sp.translateY(0.12); sp.name = 'spoke_' + i + '_' + s; g.add(sp); }
      });
      const headGeo = new THREE.BoxGeometry(0.08, 0.07, 0.42);
      mesh(headGeo, head, 'headlamp_l', L / 2 - 0.08, 0.76, 0.58); mesh(headGeo, head, 'headlamp_r', L / 2 - 0.08, 0.76, -0.58);
      mesh(new THREE.BoxGeometry(0.06, 0.06, W - 0.5), tail, 'taillamp_bar', -L / 2 + 0.06, 0.9, 0);
      mesh(new THREE.BoxGeometry(0.06, 0.05, 0.3), head, 'reverse_l', -L / 2 + 0.07, 0.72, 0.6); mesh(new THREE.BoxGeometry(0.06, 0.05, 0.3), head, 'reverse_r', -L / 2 + 0.07, 0.72, -0.6);
      mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), paint, 'mirror_l', 1.05, 1.08, W / 2 - 0.02); mesh(new THREE.BoxGeometry(0.16, 0.1, 0.22), paint, 'mirror_r', 1.05, 1.08, -W / 2 + 0.02);
      [0.55, -0.45].forEach((x, i) => { mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), chrome, 'handle_l' + i, x, 0.92, W / 2); mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), chrome, 'handle_r' + i, x, 0.92, -W / 2); });
      return g;
    }
    buildGround(THREE) {
      const grp = new THREE.Group(); grp.name = 'ground';
      const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d');
      const grd = ctx.createRadialGradient(128, 128, 10, 128, 128, 128); grd.addColorStop(0, 'rgba(255,255,255,0.10)'); grd.addColorStop(0.5, 'rgba(255,255,255,0.03)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd; ctx.fillRect(0, 0, 256, 256);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(9, 5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false })); pool.rotation.x = -Math.PI / 2; pool.position.y = 0.002; grp.add(pool);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.55 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.001; sh.receiveShadow = true; grp.add(sh);
      return grp;
    }
    resize() {
      if (!this.renderer) return;
      const w = Math.max(1, this.clientWidth), h = Math.max(1, this.clientHeight);
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
      this.fit = Math.max(1, 1.9 / Math.max(0.6, w / h));
    }
    strip() { const sel = this.getAttribute('swipe-target') || this.getAttribute('swipetarget'); return sel ? document.querySelector(sel) : null; }
    bindInput() {
      if (this.getAttribute('drag') !== 'true') return;
      let px = 0, py = 0, sx = 0, t0 = 0, moved = 0;
      const down = e => { this.dragging = true; px = sx = e.clientX; py = e.clientY; t0 = performance.now(); moved = 0; this.from = null; this.canvas.setPointerCapture(e.pointerId); };
      const move = e => {
        if (!this.dragging) return; const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        this.cur.t -= dx * 0.008; this.tgt.t = this.cur.t; this.cur.p = Math.min(1.5, Math.max(0.15, this.cur.p - dy * 0.006)); this.tgt.p = this.cur.p; this.idleT = 0;
      };
      const up = e => {
        if (!this.dragging) return; this.dragging = false;
        const dx = e.clientX - sx, dt = performance.now() - t0, st = this.strip();
        if (st && Math.abs(dx) > 70 && dt < 450) { // quick horizontal flick → switch vehicle on the strip
          const w = st.clientWidth, i = Math.round(st.scrollLeft / w) + (dx < 0 ? 1 : -1);
          const max = Math.round(st.scrollWidth / w) - 1;
          if (i >= 0 && i <= max) { st.scrollTo({ left: i * w, behavior: 'smooth' }); this.setView(); }
        }
        if (moved > 6) e.stopPropagation();
      };
      this.canvas.addEventListener('pointerdown', down); this.canvas.addEventListener('pointermove', move);
      this.canvas.addEventListener('pointerup', up); this.canvas.addEventListener('pointercancel', up);
      this.canvas.style.cursor = 'grab';
    }
    loop() {
      if (!this.alive) return;
      this.raf = requestAnimationFrame(() => this.loop());
      if (!this.visible || !this.renderer || !this.car) return;
      const now = performance.now();
      const st = this.strip();
      if (st && st.clientWidth) { const f = st.scrollLeft / st.clientWidth; this.tilt += ((f - Math.round(f)) * 2 - this.tilt) * 0.25; } else this.tilt *= 0.9;
      if (this.from) { // camera flight between views
        const k = Math.min(1, (now - this.tw0) / 750), e = ease(k);
        this.cur.t = this.from.t + (this.tgt.t - this.from.t) * e; this.cur.p = this.from.p + (this.tgt.p - this.from.p) * e; this.cur.d = this.from.d + (this.tgt.d - this.from.d) * e;
        if (k >= 1) this.from = null;
      } else if (!this.dragging) {
        this.idleT += 1 / 60;
        if (this.getAttribute('autorotate') === 'true' && this.idleT > 2.4) this.tgt.t += 0.0022;
        this.cur.t += (this.tgt.t - this.cur.t) * 0.08; this.cur.p += (this.tgt.p - this.cur.p) * 0.08; this.cur.d += (this.tgt.d - this.cur.d) * 0.08;
      }
      if (this.paintTarget) this.mats.paint.color.lerp(this.paintTarget, 0.08);
      const z = parseFloat(this.getAttribute('zoom')) || 1; // per-screen framing, eased like the camera flight instead of resizing the canvas
      this.zoomCur = this.zoomCur === undefined ? z : this.zoomCur + (z - this.zoomCur) * 0.09;
      const t = this.cur.t + this.tilt * 0.9, p = this.cur.p, d = this.cur.d * (this.fit || 1) / this.zoomCur;
      this.camera.position.set(d * Math.sin(p) * Math.cos(t), d * Math.cos(p) + 0.55, d * Math.sin(p) * Math.sin(t));
      this.camera.lookAt(0, 0.62, 0);
      this.renderer.render(this.scene, this.camera);
    }
  }
  if (!customElements.get('car-hero')) customElements.define('car-hero', CarHero);
})();
