/* ------------------------------------------------------------------
   Line-art generator
   Every ornament on the page (jasmine, lotus, mango-leaf thoranam,
   kuthuvilakku, frames) is built here as SVG so GSAP can "draw" it.
   Classes:  .ln = gold line   .pt = petal (line + paper fill)
             .lf = leaf        .fl = flame   .mari = marigold
------------------------------------------------------------------- */
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  function E(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function G(parent, x, y, rot = 0, s = 1, cls = '') {
    return E('g', { transform: `translate(${x} ${y}) rotate(${rot}) scale(${s})`, class: cls }, parent);
  }

  const PATH = {
    petal: 'M0 0 C-4.5 -5 -4 -13 0 -15.5 C4 -13 4.5 -5 0 0Z',
    bud: 'M0 0 C-2.6 -4 -2.2 -10 0 -13 C2.2 -10 2.6 -4 0 0Z',
    leaf: 'M0 0 C5 -5 14 -5.5 22 0 C14 5.5 5 5 0 0Z',
    mango: 'M0 0 C6 9 6.5 30 0 46 C-6.5 30 -6 9 0 0Z',
    flame: 'M0 0 C-4 -5 -3.5 -12 0 -19 C3.5 -12 4 -5 0 0Z'
  };

  /* ---------- primitives ---------- */
  function jasmine(p, x, y, s = 1, rot = 0, cls = 'flw') {
    const g = G(p, x, y, rot, s, cls);
    for (let i = 0; i < 5; i++) E('path', { d: PATH.petal, transform: `rotate(${i * 72})`, class: 'pt' }, g);
    E('circle', { r: 1.8, class: 'pt' }, g);
    return g;
  }
  function bud(p, x, y, s = 1, rot = 0, cls = 'flw') {
    const g = G(p, x, y, rot, s, cls);
    E('path', { d: PATH.bud, class: 'pt' }, g);
    E('path', { d: 'M-2.2 -1.4 Q0 1.2 2.2 -1.4', class: 'ln' }, g);
    return g;
  }
  function leaf(p, x, y, s = 1, rot = 0, cls = 'lvs') {
    const g = G(p, x, y, rot, s, cls);
    E('path', { d: PATH.leaf, class: 'lf' }, g);
    E('path', { d: 'M1.5 0 Q11 -0.8 19 0', class: 'ln vein' }, g);
    return g;
  }
  function lotus(p, x, y, s = 1, rot = 0, cls = 'flw') {
    const g = G(p, x, y, rot, s, cls + ' lotus');
    [
      'M0 0 C-22 -2 -40 -14 -46 -30 C-30 -31 -13 -20 0 0Z',
      'M0 0 C22 -2 40 -14 46 -30 C30 -31 13 -20 0 0Z',
      'M0 0 C-16 -8 -26 -28 -24 -50 C-12 -43 -4 -24 0 0Z',
      'M0 0 C16 -8 26 -28 24 -50 C12 -43 4 -24 0 0Z',
      'M0 0 C-12 -16 -11 -42 0 -61 C11 -42 12 -16 0 0Z'
    ].forEach(d => E('path', { d, class: 'pt' }, g));
    E('path', { d: 'M0 -6 L0 -50', class: 'ln vein' }, g);
    E('path', { d: 'M-8 -8 Q-12 -26 -9 -38 M8 -8 Q12 -26 9 -38', class: 'ln vein' }, g);
    E('path', { d: 'M-15 2 Q0 9 15 2', class: 'ln' }, g);
    return g;
  }

  /* a curved stem with leaves, buds and jasmine placed along it */
  function sprig(p, d, o = {}) {
    const { leaves = 6, flowers = [], buds = [], s = 1, from = 0.1, to = 0.85, stemCls = 'stem' } = o;
    const stem = E('path', { d, class: 'ln ' + stemCls }, p);
    const L = stem.getTotalLength();
    const at = t => {
      const a = stem.getPointAtLength(t * L), b = stem.getPointAtLength(Math.min(L, t * L + 0.5));
      const c = t * L + 0.5 > L ? stem.getPointAtLength(t * L - 0.5) : a;
      const ang = t * L + 0.5 > L ? Math.atan2(a.y - c.y, a.x - c.x) : Math.atan2(b.y - a.y, b.x - a.x);
      return { x: a.x, y: a.y, ang: ang * 180 / Math.PI };
    };
    for (let i = 0; i < leaves; i++) {
      const t = from + i * ((to - from) / Math.max(1, leaves - 1));
      const q = at(t);
      leaf(p, q.x, q.y, s * (1 - 0.35 * t), q.ang + (i % 2 ? 42 : -42));
    }
    buds.forEach(t => { const q = at(t); bud(p, q.x, q.y, s, q.ang + 90); });
    flowers.forEach(t => { const q = at(t); jasmine(p, q.x, q.y, s * 0.85, q.ang); });
    return stem;
  }

  /* ---------- compositions ---------- */
  const ART = {
    bloom(svg) {
      sprig(svg, 'M10 30 C55 8 120 6 206 30', { leaves: 7, flowers: [0.46, 0.8], buds: [0.99, 0.63], s: 1.05 });
      sprig(svg, 'M30 10 C8 55 6 120 30 206', { leaves: 7, flowers: [0.46, 0.8], buds: [0.99, 0.63], s: 1.05 });
      sprig(svg, 'M40 40 C70 52 92 70 104 104', { leaves: 3, flowers: [0.7], buds: [0.99], s: 0.9, from: 0.25, to: 0.7 });
      lotus(svg, 26, 26, 0.72, 135);
      jasmine(svg, 64, 26, 0.7, 10); jasmine(svg, 26, 64, 0.7, 40);
    },

    crown(svg) {
      E('path', { d: 'M2 42 C14 42 18 32 28 34 M78 42 C66 42 62 32 52 34', class: 'ln' }, svg);
      lotus(svg, 40, 44, 0.62, 0);
    },

    rule(svg) {
      E('path', { d: 'M8 10 L98 10 M142 10 L232 10', class: 'ln' }, svg);
      E('circle', { cx: 104, cy: 10, r: 1.6, class: 'pt' }, svg);
      E('circle', { cx: 136, cy: 10, r: 1.6, class: 'pt' }, svg);
      jasmine(svg, 120, 10, 0.55, 0);
    },

    knot(svg) {
      const left = 'M6 22 C28 22 36 9 50 13 C60 16 58 27 50 25 C44 23 48 15 58 17 C70 19 76 22 88 22';
      E('path', { d: left, class: 'ln' }, svg);
      E('path', { d: left, class: 'ln', transform: 'translate(200 0) scale(-1 1)' }, svg);
      E('path', { d: 'M100 32 C89 24 88 13 94.5 12 C97.5 11.5 100 14 100 16.5 C100 14 102.5 11.5 105.5 12 C112 13 111 24 100 32Z', class: 'pt heart' }, svg);
    },

    swirl(svg) {
      E('path', { d: 'M10 100 C58 34 118 118 164 72 C192 44 168 20 148 42 C126 66 188 106 290 26', class: 'ln swirl__line' }, svg);
      leaf(svg, 290, 26, 0.7, -150); leaf(svg, 290, 26, 0.6, -110);
      jasmine(svg, 290, 26, 0.6, 0);
      bud(svg, 10, 100, 0.8, -125);
    },

    archframe(svg) {
      E('path', { d: 'M2 218 L2 80 A78 78 0 0 1 158 80 L158 218 Z', class: 'ln frame', 'vector-effect': 'non-scaling-stroke' }, svg);
      E('path', { d: 'M8 212 L8 82 A72 72 0 0 1 152 82 L152 212 Z', class: 'ln frame thin', 'vector-effect': 'non-scaling-stroke' }, svg);
    },

    thread(svg) {
      E('path', { d: 'M10 0 C3 60 17 130 10 200 C3 270 17 340 10 400', class: 'ln thread', 'vector-effect': 'non-scaling-stroke' }, svg);
    },

    cellarch(svg) {
      E('path', { d: 'M3 82 L3 32 A29 29 0 0 1 61 32 L61 82 Z', class: 'ln frame' }, svg);
    },

    venueframe(svg) {
      E('path', { d: 'M1 159 L1 60 A59 59 0 0 1 119 60 L119 159 Z', class: 'ln frame', 'vector-effect': 'non-scaling-stroke' }, svg);
      E('path', { d: 'M6 154 L6 61 A54 54 0 0 1 114 61 L114 154 Z', class: 'ln frame thin', 'vector-effect': 'non-scaling-stroke' }, svg);
    },

    thoranam(svg) {
      const rope = E('path', { d: 'M0 6 Q200 30 400 6', class: 'ln rope' }, svg);
      const L = rope.getTotalLength();
      const n = 13;
      for (let i = 0; i < n; i++) {
        const q = rope.getPointAtLength((i + 0.5) / n * L);
        if (i % 2 === 0) {
          const g = G(svg, q.x, q.y, (i - (n - 1) / 2) * -1.2, 0.95, 'mango');
          E('path', { d: PATH.mango, class: 'lf mango__leaf' }, g);
          E('path', { d: 'M0 2 L0 42', class: 'ln vein' }, g);
        } else {
          const g = G(svg, q.x, q.y + 2, 0, 1, 'mari');
          E('path', { d: 'M0 0 L0 6', class: 'ln' }, g);
          E('circle', { cy: 12, r: 6.5, class: 'mari__ball' }, g);
          E('circle', { cy: 12, r: 2.8, class: 'mari__core' }, g);
        }
      }
    },

    lamp(svg) {
      const L = (d, c = 'ln') => E('path', { d, class: c }, svg);
      L('M60 4 C55 12 55 20 60 25 C65 20 65 12 60 4Z', 'pt');
      L('M57 25 L57 42 M63 25 L63 42');
      E('ellipse', { cx: 60, cy: 46, rx: 16, ry: 4.5, class: 'pt' }, svg);
      L('M57 51 L57 64 M63 51 L63 64');
      L('M26 70 Q60 96 94 70');
      E('ellipse', { cx: 60, cy: 70, rx: 34, ry: 6.5, class: 'pt' }, svg);
      [28, 44, 60, 76, 92].forEach((x, i) => {
        const g = G(svg, x, i === 2 ? 64 : 67, 0, 0.9, 'flame');
        E('path', { d: PATH.flame, class: 'fl' }, g);
      });
      L('M56 88 C53 108 53 128 55 150 M64 88 C67 108 67 128 65 150');
      E('ellipse', { cx: 60, cy: 104, rx: 9, ry: 3, class: 'pt' }, svg);
      E('ellipse', { cx: 60, cy: 126, rx: 8, ry: 3, class: 'pt' }, svg);
      E('ellipse', { cx: 60, cy: 154, rx: 14, ry: 4, class: 'pt' }, svg);
      L('M47 156 Q43 174 26 190 M73 156 Q77 174 94 190');
      E('ellipse', { cx: 60, cy: 192, rx: 36, ry: 7, class: 'pt' }, svg);
      L('M22 194 L22 205 M98 194 L98 205');
      L('M22 205 Q60 218 98 205');
      jasmine(svg, 60, 178, 0.55, 0);
    },

    seal(svg) {
      // the A & K monogram pressed into the wax, fully inked
      window.MONO.parts.forEach(p => p.d.forEach(d => E('path', { d }, svg)));
      E('path', { d: window.MONO.star }, svg);
    },

    door(svg) {
      // left door, seam on the right (x = 200). Right door is mirrored in CSS.
      sprig(svg, 'M26 512 C46 430 16 340 44 258 C64 196 34 126 62 44', { leaves: 11, flowers: [0.24, 0.5, 0.76], buds: [0.99, 0.62], s: 1.15 });
      sprig(svg, 'M120 500 C150 470 172 430 190 400', { leaves: 4, flowers: [0.6], buds: [0.99], s: 0.95, from: 0.2, to: 0.75 });
      sprig(svg, 'M194 120 C150 96 110 104 70 70', { leaves: 4, flowers: [0.55], buds: [0.99], s: 0.95, from: 0.2, to: 0.75 });
      lotus(svg, 112, 512, 1.15, 0);
      // garland of jasmine around the seal (seal centre at 200,260)
      for (let a = 100; a <= 260; a += 16) {
        const r = a * Math.PI / 180;
        const x = 200 + Math.cos(r) * 62, y = 260 - Math.sin(r) * 62;
        if ((a / 16) % 2 < 1) jasmine(svg, x, y, 0.55, a); else bud(svg, x, y, 0.75, 90 - a);
      }
    }
  };

  /* ---------- monogram ----------
     Each stroke is a filled shape revealed by a "pen" path in its mask,
     so drawing the pen (DrawSVG) inks the letter in writing order.     */
  function monogram(svg) {
    const M = window.MONO;
    svg.setAttribute('viewBox', M.viewBox);
    const defs = E('defs', {}, svg);
    const foil = E('linearGradient', {
      id: 'monoFoil', gradientUnits: 'userSpaceOnUse', x1: 130, y1: 70, x2: 790, y2: 870,
      gradientTransform: 'translate(-760 0)'
    }, defs);
    [[0, 'var(--gold)'], [0.44, 'var(--gold)'], [0.5, '#F3DDA8'], [0.56, 'var(--gold)'], [1, 'var(--gold)']]
      .forEach(([o, c]) => E('stop', { offset: o, style: `stop-color:${c}` }, foil));

    const pen = {};
    M.parts.forEach((p, i) => {
      const mask = E('mask', { id: `monoMask${i}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: 900, height: 900 }, defs);
      pen[p.n] = E('path', { d: p.g, fill: 'none', stroke: '#fff', 'stroke-width': p.w }, mask);
      const g = E('g', { class: 'glyph', mask: `url(#monoMask${i})` }, svg);
      p.d.forEach(d => E('path', { d }, g));
    });
    const star = E('path', { d: M.star, class: 'mono__star' }, svg);
    return { pen, star, foil };
  }

  function render(root = document) {
    root.querySelectorAll('svg[data-art]').forEach(svg => {
      const fn = ART[svg.dataset.art];
      if (fn && !svg.childElementCount) fn(svg);
    });
  }

  window.Art = { render, monogram };
})();
