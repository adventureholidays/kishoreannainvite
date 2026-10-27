/* ------------------------------------------------------------------
   Line-art generator
   Every ornament on the page (jasmine, lotus, mango-leaf thoranam,
   frames) is built here as SVG so GSAP can "draw" it.
   Classes:  .ln = gold line   .pt = petal (line + paper fill)
             .lf = leaf        .mari = marigold
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

  let sealCount = 0;
  const PATH = {
    petal: 'M0 0 C-4.5 -5 -4 -13 0 -15.5 C4 -13 4.5 -5 0 0Z',
    bud: 'M0 0 C-2.6 -4 -2.2 -10 0 -13 C2.2 -10 2.6 -4 0 0Z',
    leaf: 'M0 0 C5 -5 14 -5.5 22 0 C14 5.5 5 5 0 0Z',
    mango: 'M0 0 C6 9 6.5 30 0 46 C-6.5 30 -6 9 0 0Z'
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

  /* ---------- gilt pieces for the opening card (after References/Intro Section II.png) ---------- */
  function giltDefs() { // gradients shared by every gilt piece on the page, made once
    if (document.getElementById('giltFill')) return;
    const svg = E('svg', { class: 'art-defs', width: 0, height: 0, 'aria-hidden': 'true' });
    const defs = E('defs', {}, svg);
    const grad = (tag, id, attrs, stops) => {
      const g = E(tag, Object.assign({ id }, attrs), defs);
      stops.forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, g));
    };
    grad('linearGradient', 'giltFill', { x1: 0, y1: 0, x2: 1, y2: 1 }, [[0, '#F7E9B0'], [.45, '#D6B25A'], [1, '#9A7424']]);
    grad('radialGradient', 'giltBead', { cx: .35, cy: .3, r: .75 }, [[0, '#FFF6CF'], [.5, '#D8B458'], [1, '#8E6A1C']]);
    document.body.prepend(svg);
  }

  // four-point star: a gold rim around a bevelled face lit from the top left
  function star(p, x, y, w, h) {
    const g = G(p, x, y, 0, 1, 'gs');
    const c = w * .2;
    E('path', { d: `M0 ${-h} Q${c} ${-c} ${w} 0 Q${c} ${c} 0 ${h} Q${-c} ${c} ${-w} 0 Q${-c} ${-c} 0 ${-h}Z`, class: 'gs__rim' }, g);
    const W = w * .6, H = h * .6, k = W * .2;
    [`M0 0 L${-W} 0 Q${-k} ${-k} 0 ${-H}Z`, `M0 0 L0 ${-H} Q${k} ${-k} ${W} 0Z`, `M0 0 L0 ${H} Q${-k} ${k} ${-W} 0Z`, `M0 0 L${W} 0 Q${k} ${k} 0 ${H}Z`]
      .forEach((d, i) => E('path', { d, class: 'gs__f' + i }, g));
    return g;
  }
  const bead = (p, x, y, r) => E('circle', { cx: x, cy: y, r, class: 'gb' }, p);

  // a vertical gold ornament on the centre line of a 30-wide viewBox: [b]ead, [l]ine, [s]tar
  function strand(svg, parts) {
    parts.forEach(([t, y, a, b]) => {
      if (t === 'l') E('path', { d: `M15 ${y} V${a}`, class: 'gl gl--fine' }, svg);
      else if (t === 'b') bead(svg, 15, y, a);
      else star(svg, 15, y, a, b);
    });
  }
  const DROP = [['b', 2, 1.9], ['b', 9.5, 1.4], ['l', 12.5, 27], ['s', 42.5, 11.3, 14.8], ['l', 58, 71],
    ['b', 74, 1.4], ['b', 80, 1.7], ['b', 88, 1.9], ['b', 96.5, 1.4]];

  /* ---------- compositions ---------- */
  const ART = {
    drop(svg) { strand(svg, DROP); },
    dropup(svg) { strand(svg, DROP.map(([t, y, a, b]) => t === 'l' ? [t, 99 - a, 99 - y] : [t, 99 - y, a, b])); },
    sidel(svg) {
      strand(svg, [['b', 2, 1.6], ['b', 12, 1.2], ['l', 16, 81], ['s', 91, 6.5, 8.5], ['b', 104, 1.2], ['b', 111, 1.5],
        ['b', 118, 1.2], ['l', 123, 189], ['b', 197, 1.6]]);
    },
    sider(svg) {
      strand(svg, [['b', 2, 1.2], ['b', 8, 1.5], ['b', 14, 1.2], ['l', 18, 86], ['s', 97, 6.5, 8.5], ['b', 109, 1.2],
        ['b', 115, 1.5], ['l', 120, 227], ['b', 233, 2.4], ['b', 241, 1.4], ['b', 248, 1.2], ['b', 255, 1]]);
    },


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
      E('path', { d: 'M2 12 L98 12 M142 12 L238 12', class: 'gl gl--fine' }, svg);
      bead(svg, 107, 12, 1.8); bead(svg, 133, 12, 1.8);
      star(svg, 120, 12, 8.5, 10.5);
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

    landscape(svg) {
      // misty lake at sunrise (after References/Outro.png); its top and bottom edges are faded in CSS
      const defs = E('defs', {}, svg);
      const grad = (id, stops, attrs = { x1: 0, y1: 0, x2: 0, y2: 1 }) => {
        const g = E('linearGradient', Object.assign({ id }, attrs), defs);
        stops.forEach(([o, c, a = 1]) => E('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
      };
      grad('lsSky', [[0, '#E9EFD6', 0], [.6, '#EEF1D4', .9], [1, '#F3F0CF']]);
      grad('lsWater', [[0, '#E6EACB'], [1, '#D3DFC0']]);
      grad('lsMist', [[0, '#EEF2DE', 0], [.6, '#EEF2DE', .85], [1, '#EEF2DE', 0]]);
      const sun = E('radialGradient', { id: 'lsSun', cx: .5, cy: .55, r: .6 }, defs);
      E('stop', { offset: 0, 'stop-color': '#FFFBE6' }, sun);
      E('stop', { offset: 1, 'stop-color': '#F4ECBE' }, sun);

      const art = E('g', {}, svg);
      E('rect', { width: 400, height: 210, fill: 'url(#lsSky)' }, art);
      E('circle', { cx: 196, cy: 150, r: 72, fill: 'url(#lsSun)', stroke: '#D7B661', 'stroke-width': .9 }, art);

      // ridges, far to near: each lighter ridge sits in haze
      const ridge = (d, fill, op) => E('path', { d, fill, opacity: op }, art);
      ridge('M0 150 C40 132 70 140 100 128 C130 116 150 138 180 150 C210 162 230 156 260 146 C300 132 340 140 400 124 L400 220 L0 220Z', '#C3CFAE', .75);
      ridge('M0 168 C30 150 60 142 92 154 C120 164 150 176 190 184 L260 182 C290 170 310 168 340 158 C365 150 385 156 400 162 L400 222 L0 222Z', '#A9BC94', .8);
      E('rect', { y: 160, width: 400, height: 40, fill: 'url(#lsMist)' }, art);
      ridge('M0 186 C40 176 80 180 120 194 C150 204 180 208 220 208 L400 204 L400 224 L0 224Z', '#93A97F', .75);
      E('rect', { y: 186, width: 400, height: 34, fill: 'url(#lsMist)' }, art);

      // lake with the sun's reflection
      E('rect', { y: 210, width: 400, height: 130, fill: 'url(#lsWater)' }, art);
      [[214, 34], [222, 28], [232, 40], [244, 30], [258, 46], [274, 34], [292, 52]].forEach(([y, w]) =>
        E('path', { d: `M${196 - w} ${y} H${196 + w}`, stroke: '#F3E3A6', 'stroke-width': 1.6, 'stroke-linecap': 'round', opacity: .8 }, art));

      // left shore: rocky slope with a stand of cypress
      E('path', { d: 'M0 178 C30 182 70 196 110 214 C140 226 170 236 196 244 C150 250 90 256 0 262Z', fill: '#5F7C51' }, art);
      E('path', { d: 'M0 214 C40 220 90 236 150 248 C100 256 50 262 0 266Z', fill: '#4A6741' }, art);
      // right shore
      E('path', { d: 'M236 230 C280 216 330 206 400 200 L400 246 C350 244 290 240 236 230Z', fill: '#6E8A5E' }, art);
      const cypress = (x, y, s) => E('path', { d: `M${x} ${y} C${x - 6 * s} ${y - 12 * s} ${x - 5 * s} ${y - 34 * s} ${x} ${y - 52 * s} C${x + 5 * s} ${y - 34 * s} ${x + 6 * s} ${y - 12 * s} ${x} ${y}Z`, fill: '#2C4E2C' }, art);
      [[14, 196, 1.3], [30, 194, 1.7], [46, 200, 1.4], [62, 206, 1.1], [78, 210, .9], [96, 218, .6]].forEach(t => cypress(...t));
      [[300, 220, .7], [314, 214, 1], [328, 212, .8], [346, 208, 1.1], [362, 206, .9], [378, 205, .7]].forEach(t => cypress(...t));

      // low mist over the water
      E('rect', { y: 240, width: 400, height: 50, fill: 'url(#lsMist)' }, art);

      // golden threads with beads sweeping across the scene
      [['M-10 40 C60 60 110 130 170 168 S300 230 410 210', .9], ['M-10 70 C70 80 120 150 190 186 S320 240 410 226', .7], ['M-10 100 C80 110 140 176 210 204 S330 248 410 244', .55]].forEach(([d, op], i) => {
        const p = E('path', { d, fill: 'none', stroke: '#C9A64A', 'stroke-width': 1, opacity: op, class: 'ls__thread' }, art);
        const L = p.getTotalLength();
        [.12, .22, .3, .7].forEach(f => {
          const q = p.getPointAtLength((f + i * .04) * L);
          E('circle', { cx: q.x, cy: q.y, r: 2, fill: '#C9A64A', opacity: op }, art);
        });
      });

      // birds
      [[300, 70, 1], [334, 50, .85], [270, 92, .75]].forEach(([x, y, s]) =>
        E('path', { d: `M${x - 10 * s} ${y + 2 * s} Q${x - 5 * s} ${y - 5 * s} ${x} ${y} Q${x + 5 * s} ${y - 5 * s} ${x + 10 * s} ${y + 2 * s}`, stroke: '#7A6A45', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round' }, art));
    },

    seal(svg) {
      // the same A / K, axis, stars and arcs as the invitation monogram, pressed into the wax (flattened to one colour in CSS).
      // The viewBox is centred on the letters so A and K sit in the middle of the seal; there are two seals, so ids differ.
      AKMono.build(svg, `seal${sealCount++}`);
      svg.setAttribute('viewBox', '175 380 760 760');
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

  function render(root = document) {
    giltDefs();
    root.querySelectorAll('svg[data-art]').forEach(svg => {
      const fn = ART[svg.dataset.art];
      if (fn && !svg.childElementCount) fn(svg);
    });
  }

  window.Art = { render };
})();
