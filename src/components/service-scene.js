// <service-scene> — Luce-style line-art 3D scenes for shop work, stepped by job phase.
// Attributes: scene="brake|tire|oil|bulk|battery"  phase="<scene phase name>"  accent="#rrggbb"  idle="true" (slow yaw)
// Phases — brake: worn | remove | install | new · tire: on | off | new · oil: idle | drain | filter | fill | done
//          bulk: idle | fill | full · battery: rest | load | pass
(function () {
  
  let threeP = null;
  const loadThree = () => (threeP = threeP || import('three'));
  const LINE = 0xd8dbe2, DIM = 0x8a8f99, OIL = 0xe0a33a;

  class ServiceScene extends HTMLElement {
    static get observedAttributes() { return ['scene', 'phase', 'accent', 'idle', 'params']; }
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = '<style>:host{display:block;position:relative;width:100%;height:100%;min-height:60px}canvas{display:block;width:100%;height:100%}</style><canvas></canvas>';
      this.canvas = this.shadowRoot.querySelector('canvas');
      this.p = {}; this.t = {}; this.visible = true; this.yaw = 0;
    }
    connectedCallback() { this.init(); }
    disconnectedCallback() { this.alive = false; cancelAnimationFrame(this.raf); if (this.ro) this.ro.disconnect(); if (this.io) this.io.disconnect(); if (this.renderer) this.renderer.dispose(); }
    attributeChangedCallback(n) { if (!this.THREE) return; if (n === 'scene') this.build(); else if (n === 'phase' || n === 'params') this.setPhase(); else if (n === 'accent') this.build(); }
    accent() { return new this.THREE.Color(this.getAttribute('accent') || '#e0312b'); }
    edges(geo, color, opacity, angle) {
      const T = this.THREE;
      const m = new T.LineBasicMaterial({ color: color === undefined ? LINE : color, transparent: true, opacity: opacity === undefined ? .55 : opacity });
      const l = new T.LineSegments(new T.EdgesGeometry(geo, angle || 18), m);
      return l;
    }
    ring(r, segs, color, opacity) {
      const T = this.THREE, pts = [];
      for (let i = 0; i <= (segs || 48); i++) { const a = i / (segs || 48) * Math.PI * 2; pts.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
      return new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: color === undefined ? LINE : color, transparent: true, opacity: opacity === undefined ? .55 : opacity }));
    }
    seg(a, b, color, opacity) {
      const T = this.THREE;
      return new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3().fromArray(a), new T.Vector3().fromArray(b)]), new T.LineBasicMaterial({ color: color === undefined ? LINE : color, transparent: true, opacity: opacity === undefined ? .55 : opacity }));
    }
    async init() {
      const THREE = await loadThree();
      if (!this.isConnected) return;
      this.THREE = THREE; this.alive = true;
      const r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      r.setPixelRatio(1); r.setClearColor(0x000000, 0);
      this.scene3 = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this);
      this.io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; }, { threshold: 0.01 }); this.io.observe(this);
      this.build(); this.resize(); this.loop();
    }
    resize() {
      const w = this.clientWidth || 300, h = this.clientHeight || 160;
      this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }
    setPhase() {
      const def = this.def; if (!def) return;
      const ph = def.phases[this.getAttribute('phase')] || def.phases[Object.keys(def.phases)[0]];
      let extra = {}; try { extra = JSON.parse(this.getAttribute('params') || '{}'); } catch (e) {} // params='{"pad":7}' overrides any phase value live
      this.t = Object.assign({}, ph, extra);
      if (!this.started) { this.p = Object.assign({}, ph); this.started = true; }
    }
    build() {
      const T = this.THREE, S = this.scene3;
      while (S.children.length) S.remove(S.children[0]);
      const g = this.group = new T.Group(); S.add(g);
      const kind = this.getAttribute('scene') || 'brake';
      this.def = this['build_' + kind] ? this['build_' + kind](g) : this.build_brake(g);
      const c = this.def.cam; this.camera.position.set(c[0], c[1], c[2]); this.camera.lookAt(c[3] || 0, c[4] || 0, c[5] || 0);
      this.started = false; this.setPhase(); this.def.apply(this.p);
    }
    // ---- Brake: rotor, hub, caliper, two pads. Pad thickness wears from 12 mm to 3 mm; service slides old pads out and new ones in.
    build_brake(g) {
      const T = this.THREE, acc = this.accent();
      const rotor = new T.Group();
      rotor.add(this.ring(1.25, 72), this.ring(1.25, 72), this.ring(0.42, 40), this.ring(0.42, 40));
      rotor.children[0].position.z = 0.06; rotor.children[1].position.z = -0.06; rotor.children[2].position.z = 0.06; rotor.children[3].position.z = -0.06;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const l = this.ring(0.07, 12, DIM, .8); l.position.set(Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0.061); rotor.add(l); }
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; rotor.add(this.seg([Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0.06], [Math.cos(a) * 1.25, Math.sin(a) * 1.25, -0.06], DIM, .35)); }
      g.add(rotor);
      const cal = this.edges(new T.BoxGeometry(0.9, 0.55, 0.62), LINE, .7); cal.position.set(0, 1.05, 0); g.add(cal);
      const padGeo = new T.BoxGeometry(0.8, 0.42, 1);
      const padL = this.edges(padGeo, acc, .95), padR = this.edges(padGeo, acc, .95);
      const newL = this.edges(padGeo, 0x30d158, .95), newR = this.edges(padGeo, 0x30d158, .95);
      g.add(padL, padR, newL, newR);
      g.rotation.y = -0.55; g.rotation.x = 0.12;
      const mm = 0.011;
      const apply = p => {
        const thick = p.pad * mm, nThick = 12 * mm, pc = p.pad <= 3.5 ? 0xe0312b : p.pad <= 5.5 ? 0xffd60a : 0x30d158;
        [padL, padR].forEach((pd, i) => { const s = i ? -1 : 1; pd.scale.set(1, 1, thick); pd.position.set(0 + p.out * 1.4, 0.98, s * (0.07 + thick / 2)); pd.material.opacity = p.oldA; pd.material.color.set(pc); });
        [newL, newR].forEach((pd, i) => { const s = i ? -1 : 1; pd.scale.set(1, 1, nThick); pd.position.set(p.inx, 0.98, s * (0.07 + nThick / 2)); pd.material.opacity = p.newA; });
        rotor.rotation.z = p.spin;
      };
      return { cam: [0, 0.3, 6.2, 0, 0.35, 0], apply, phases: {
        worn: { pad: 3, out: 0, oldA: .95, inx: 2.2, newA: 0, spin: 0 },
        remove: { pad: 3, out: 1, oldA: .25, inx: 2.2, newA: 0, spin: 0 },
        install: { pad: 3, out: 1.6, oldA: 0, inx: 0, newA: .95, spin: 0 },
        new: { pad: 3, out: 1.6, oldA: 0, inx: 0, newA: .95, spin: 2.4 }
      } };
    }
    // ---- Tire: wheel on a hub with five studs. Loosen studs, slide the wheel off along the axle, new one on.
    wheel(color) {
      const T = this.THREE, w = new T.Group();
      w.add(this.edges(new T.TorusGeometry(1.15, 0.3, 10, 40), color || LINE, .5, 30));
      const rim = this.ring(0.86, 56, color || LINE, .8); w.add(rim);
      const rim2 = this.ring(0.86, 56, color || LINE, .35); rim2.position.z = -0.3; w.add(rim2);
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; w.add(this.seg([Math.cos(a) * 0.2, Math.sin(a) * 0.2, 0.05], [Math.cos(a) * 0.84, Math.sin(a) * 0.84, 0.05], color || LINE, .8)); w.add(this.seg([Math.cos(a + 0.5) * 0.2, Math.sin(a + 0.5) * 0.2, 0.05], [Math.cos(a + 0.5) * 0.84, Math.sin(a + 0.5) * 0.84, 0.05], color || LINE, .8)); }
      w.add(this.ring(0.2, 24, color || LINE, .8));
      return w;
    }
    build_tire(g) {
      const T = this.THREE, acc = this.accent();
      const hub = new T.Group(); hub.add(this.ring(0.34, 32, DIM, .8)); const axle = this.edges(new T.CylinderGeometry(0.1, 0.1, 1.2, 12), DIM, .6); axle.rotation.x = Math.PI / 2; axle.position.z = -0.6; hub.add(axle);
      const studs = [];
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const st = this.edges(new T.CylinderGeometry(0.035, 0.035, 0.5, 8), DIM, .8); st.rotation.x = Math.PI / 2; st.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.1); hub.add(st); const nut = this.edges(new T.CylinderGeometry(0.07, 0.07, 0.08, 6), acc, .95); nut.rotation.x = Math.PI / 2; nut.position.set(Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.2); studs.push(nut); hub.add(nut); }
      g.add(hub);
      const old = this.wheel(LINE), nw = this.wheel(0x30d158); g.add(old, nw);
      g.rotation.y = -0.75; g.rotation.x = 0.1;
      const apply = p => {
        old.position.z = p.oldZ; old.children.forEach(c => c.material.opacity = (c.material.userData.o || (c.material.userData.o = c.material.opacity)) * p.oldA);
        nw.position.z = p.newZ; nw.children.forEach(c => c.material.opacity = (c.material.userData.o || (c.material.userData.o = c.material.opacity)) * p.newA);
        studs.forEach(n => { n.position.z = 0.2 + p.nut; });
        old.rotation.z = nw.rotation.z = p.spin;
      };
      return { cam: [0, 0.2, 6.6, 0, 0, 0.4], apply, phases: {
        on: { oldZ: 0, oldA: 1, newZ: 3.2, newA: 0, nut: 0, spin: 0 },
        off: { oldZ: 2.1, oldA: .5, newZ: 3.6, newA: 0, nut: 1.1, spin: 0.6 },
        new: { oldZ: 3.4, oldA: 0, newZ: 0, newA: 1, nut: 0, spin: 1.6 }
      } };
    }
    // ---- Oil: block, pan with sump level, drain plug stream into a catch pan, spin-on filter, top-fill stream.
    build_oil(g) {
      const T = this.THREE, acc = this.accent();
      const block = this.edges(new T.BoxGeometry(2.2, 1.3, 1.5), LINE, .6); block.position.y = 1.15; g.add(block);
      const cap = this.edges(new T.CylinderGeometry(0.18, 0.18, 0.12, 16), LINE, .8); cap.position.set(-0.6, 1.86, 0.2); g.add(cap);
      const pan = this.edges(new T.BoxGeometry(2.0, 0.5, 1.3), LINE, .7); pan.position.y = 0.25; g.add(pan);
      const level = new T.Mesh(new T.BoxGeometry(1.96, 1, 1.26), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .22 })); g.add(level);
      const plug = this.edges(new T.CylinderGeometry(0.08, 0.08, 0.1, 8), acc, .95); plug.position.set(0.6, -0.02, 0.3); g.add(plug);
      const stream = new T.Mesh(new T.CylinderGeometry(0.03, 0.05, 1, 8), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .9 })); g.add(stream);
      const catchPan = new T.Group(); catchPan.add(this.ring(0.9, 48, DIM, .6)); const cp2 = this.ring(0.9, 48, DIM, .4); cp2.position.y = 0.22; catchPan.add(cp2); catchPan.rotation.x = Math.PI / 2; catchPan.position.set(0.6, -1.5, 0.3); g.add(catchPan);
      const catchLevel = new T.Mesh(new T.CylinderGeometry(0.86, 0.86, 0.2, 32), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .3 })); catchLevel.position.set(0.6, -1.4, 0.3); g.add(catchLevel);
      const filt = this.edges(new T.CylinderGeometry(0.3, 0.3, 0.7, 20), acc, .95); filt.rotation.z = Math.PI / 2; g.add(filt);
      const nfilt = this.edges(new T.CylinderGeometry(0.3, 0.3, 0.7, 20), 0x30d158, .95); nfilt.rotation.z = Math.PI / 2; g.add(nfilt);
      const fill = new T.Mesh(new T.CylinderGeometry(0.04, 0.03, 1, 8), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .9 })); g.add(fill);
      g.rotation.y = 0.5; g.rotation.x = 0.1; g.position.y = 0.1;
      const apply = p => {
        level.scale.y = Math.max(0.01, p.sump * 0.44); level.position.y = 0.02 + level.scale.y / 2;
        stream.scale.y = Math.max(0.01, p.drain * 1.4); stream.position.set(0.6, -0.07 - stream.scale.y / 2, 0.3); stream.visible = p.drain > 0.02;
        catchLevel.scale.y = Math.max(0.01, p.caught); catchLevel.visible = p.caught > 0.02;
        plug.position.y = -0.02 - p.plugOut * 0.6;
        filt.position.set(1.55 + p.filtOut * 1.3, 0.75, 0.2); filt.material.opacity = p.filtA;
        nfilt.position.set(1.55 + p.nfiltIn * 1.3, 0.75, 0.2); nfilt.material.opacity = p.nfiltA;
        fill.scale.y = Math.max(0.01, p.fill * 1.1); fill.position.set(-0.6, 1.92 + fill.scale.y / 2, 0.2); fill.visible = p.fill > 0.02;
      };
      return { cam: [0, 0.6, 8.2, 0, 0.3, 0], apply, phases: {
        idle: { sump: 1, drain: 0, caught: 0, plugOut: 0, filtOut: 0, filtA: .95, nfiltIn: 1.6, nfiltA: 0, fill: 0 },
        drain: { sump: .08, drain: 1, caught: 1, plugOut: 1, filtOut: 0, filtA: .95, nfiltIn: 1.6, nfiltA: 0, fill: 0 },
        filter: { sump: .05, drain: 0, caught: 1, plugOut: 0, filtOut: 1.2, filtA: 0, nfiltIn: 0, nfiltA: .95, fill: 0 },
        fill: { sump: 1, drain: 0, caught: 1, plugOut: 0, filtOut: 1.2, filtA: 0, nfiltIn: 0, nfiltA: .95, fill: 1 },
        done: { sump: 1, drain: 0, caught: 0, plugOut: 0, filtOut: 1.2, filtA: 0, nfiltIn: 0, nfiltA: .95, fill: 0 }
      } };
    }
    // ---- Bulk: a shop oil tank with a level, hose to a nozzle, and a bottle filling underneath.
    build_bulk(g) {
      const T = this.THREE, acc = this.accent();
      const tank = this.edges(new T.CylinderGeometry(0.9, 0.9, 2.6, 28), LINE, .6); tank.position.set(-1.2, 1.3, 0); g.add(tank);
      for (let i = 1; i < 4; i++) { const r = this.ring(0.9, 48, DIM, .25); r.rotation.x = Math.PI / 2; r.position.set(-1.2, i * 0.65, 0); g.add(r); }
      const tLevel = new T.Mesh(new T.CylinderGeometry(0.86, 0.86, 1, 28), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .2 })); g.add(tLevel);
      const hose = new T.Group(); const curve = new T.CatmullRomCurve3([new T.Vector3(-0.3, 0.6, 0), new T.Vector3(0.5, 0.9, 0.1), new T.Vector3(1.3, 1.6, 0), new T.Vector3(1.4, 0.95, 0)]);
      hose.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(40)), new T.LineBasicMaterial({ color: LINE, transparent: true, opacity: .6 }))); g.add(hose);
      const nozzle = this.edges(new T.CylinderGeometry(0.07, 0.05, 0.3, 10), acc, .95); nozzle.position.set(1.4, 0.8, 0); g.add(nozzle);
      const bottle = new T.Group(); bottle.add(this.edges(new T.BoxGeometry(0.7, 1.1, 0.45), LINE, .7)); const neck = this.edges(new T.CylinderGeometry(0.12, 0.12, 0.2, 12), LINE, .7); neck.position.y = 0.65; bottle.add(neck); bottle.position.set(1.4, -0.4, 0); g.add(bottle);
      const bLevel = new T.Mesh(new T.BoxGeometry(0.66, 1, 0.41), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .3 })); g.add(bLevel);
      const stream = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 8), new T.MeshBasicMaterial({ color: OIL, transparent: true, opacity: .9 })); g.add(stream);
      g.rotation.y = -0.35; g.position.y = -0.4;
      const apply = p => {
        tLevel.scale.y = Math.max(0.01, p.tank * 2.5); tLevel.position.set(-1.2, 0.05 + tLevel.scale.y / 2, 0);
        bLevel.scale.y = Math.max(0.01, p.bottle * 1.04); bLevel.position.set(1.4, -0.92 + bLevel.scale.y / 2, 0); bLevel.visible = p.bottle > 0.01;
        stream.scale.y = Math.max(0.01, p.stream * 0.9); stream.position.set(1.4, 0.64 - stream.scale.y / 2, 0); stream.visible = p.stream > 0.02;
      };
      return { cam: [0.4, 0.9, 8.4, 0.1, 0.4, 0], apply, phases: {
        idle: { tank: .62, bottle: 0, stream: 0 },
        fill: { tank: .59, bottle: 1, stream: 1 },
        full: { tank: .59, bottle: 1, stream: 0 }
      } };
    }
    // ---- Battery: 12 V case with posts, two test leads, and a voltage arc that sags under load.
    build_battery(g) {
      const T = this.THREE, acc = this.accent();
      const box = this.edges(new T.BoxGeometry(2.4, 1.3, 1.5), LINE, .65); g.add(box);
      const top = this.edges(new T.BoxGeometry(2.4, 0.12, 1.5), LINE, .4); top.position.y = 0.6; g.add(top);
      const posts = [[-0.8, acc, .95], [0.8, 0x9aa0aa, .9]].map(x => { const p = this.edges(new T.CylinderGeometry(0.13, 0.13, 0.3, 12), x[1], x[2]); p.position.set(x[0], 0.8, -0.3); g.add(p); return p; });
      const leadR = new T.Line(new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3([new T.Vector3(-0.8, 0.95, -0.3), new T.Vector3(-1.4, 1.9, 0.4), new T.Vector3(-2.6, 2.6, 1.2)]).getPoints(30)), new T.LineBasicMaterial({ color: acc, transparent: true, opacity: .9 })); g.add(leadR);
      const leadB = new T.Line(new T.BufferGeometry().setFromPoints(new T.CatmullRomCurve3([new T.Vector3(0.8, 0.95, -0.3), new T.Vector3(1.5, 1.8, 0.5), new T.Vector3(2.6, 2.4, 1.3)]).getPoints(30)), new T.LineBasicMaterial({ color: 0x9aa0aa, transparent: true, opacity: .8 })); g.add(leadB);
      const arcPts = n => { const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI * (1 - i / 40); pts.push(new T.Vector3(Math.cos(a) * 0.9, 1.05 + Math.sin(a) * 0.5, 0.78)); } return pts.slice(0, n); };
      const arcBase = new T.Line(new T.BufferGeometry().setFromPoints(arcPts(41)), new T.LineBasicMaterial({ color: DIM, transparent: true, opacity: .35 })); g.add(arcBase);
      const arcGeo = new T.BufferGeometry().setFromPoints(arcPts(41));
      const arc = new T.Line(arcGeo, new T.LineBasicMaterial({ color: 0x30d158, transparent: true, opacity: .95 })); g.add(arc);
      g.rotation.y = 0.55; g.rotation.x = 0.18; g.position.y = -0.5;
      const apply = p => {
        arcGeo.setDrawRange(0, Math.max(2, Math.round(p.v * 41)));
        arc.material.color.set(p.v < 0.55 ? 0xffd60a : 0x30d158);
        leadR.material.opacity = leadB.material.opacity = p.leads;
      };
      return { cam: [0, 1.0, 7.6, 0, 0.3, 0], apply, phases: {
        rest: { v: .84, leads: .25 },
        load: { v: .5, leads: .95 },
        pass: { v: .84, leads: .95 }
      } };
    }
    loop() {
      if (!this.alive) return;
      this.raf = requestAnimationFrame(() => this.loop());
      if (!this.visible || document.hidden || !this.def) return;
      const now = performance.now(); if (now - (this.lastT || 0) < 33) return; this.lastT = now;
      let moving = false;
      for (const k in this.t) { const d = this.t[k] - (this.p[k] === undefined ? this.t[k] : this.p[k]); if (Math.abs(d) > 0.0005) moving = true; this.p[k] = (this.p[k] === undefined ? this.t[k] : this.p[k]) + d * 0.06; }
      this.def.apply(this.p);
      if (this.getAttribute('idle') !== 'false') { this.yaw += 0.004; this.group.rotation.y = (this.def.baseYaw === undefined ? (this.def.baseYaw = this.group.rotation.y) : this.def.baseYaw) + Math.sin(this.yaw) * 0.22; }
      this.renderer.render(this.scene3, this.camera);
    }
  }
  if (!customElements.get('service-scene')) customElements.define('service-scene', ServiceScene);
})();
