/* A / K monogram tucked into a watercolour bouquet: sage-green anemones with gilded petal edges,
   gold stems and gold baby's-breath. Florals live on two layers: most sit behind the letters, a few
   front petals sit in front, so A and K look nestled inside the flowers. The bloom animation lives in main.js. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const E = (tag, attrs, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  };

  // seeded random so the drawing is identical on every load
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const between = (a, b) => a + (b - a) * rnd();
  const f = n => Math.round(n * 10) / 10;
  const D = Math.PI / 180;

  // ids are prefixed per build: the two wax seals and the monogram all live in one document
  let uid = 0, P = '', gid = 0, defs = null, gold = '';

  /* ---------- palette (from the watercolour reference) ---------- */
  const SAGE = [[0, '#2C6347'], [.2, '#3E7C5C'], [.52, '#7DAF92'], [.84, '#C4DECC'], [1, '#E0EEE3']];
  const DEEP = [[0, '#22543C'], [.3, '#3A7858'], [.68, '#6CA284'], [1, '#B3D2BC']];
  const BUD = [[0, '#B9D8C3'], [.55, '#6FA486'], [1, '#2F6B4E']];
  const FLORET = [[0, '#F4E3AE'], [.6, '#D9B65E'], [1, '#B58A36']];
  const STAMEN = '#1D3A2A', ANTHER = '#D8B24E';

  // local (x right, y up-negative) -> world: rotate by deg, squash y by sq (a flower seen at an angle), rotate by tilt, move to (ox, oy)
  function place(ox, oy, deg, sq = 1, tilt = 0) {
    const c = Math.cos(deg * D), s = Math.sin(deg * D), ct = Math.cos(tilt * D), st = Math.sin(tilt * D);
    return (x, y) => { const u = x * c - y * s, v = (x * s + y * c) * sq; return [ox + u * ct - v * st, oy + u * st + v * ct]; };
  }

  // closed Catmull-Rom through pts -> cubic bezier path
  function smooth(pts) {
    const n = pts.length;
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} `
        + `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + 'Z';
  }

  function radial(cx, cy, r, stops) {
    const id = `${P}g${++gid}`;
    const g = E('radialGradient', { id, gradientUnits: 'userSpaceOnUse', cx: f(cx), cy: f(cy), r: f(r) }, defs);
    stops.forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, g));
    return `url(#${id})`;
  }
  function linear(stops, x2 = .3, y2 = 1) {
    const id = `${P}g${++gid}`;
    const g = E('linearGradient', { id, x1: 0, y1: 0, x2, y2 }, defs);
    stops.forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, g));
    return `url(#${id})`;
  }
  const paint = (fill, stroke = 'none', w = 0) => `fill:${fill};stroke:${stroke};stroke-width:${w}`;

  /* ---------- the anemone ---------- */
  // a broad petal with a ruffled rim; tip points along local -y
  function petalPath(F, L, W) {
    const pts = [[0, -.04 * L], [.3 * W, -.16 * L], [.48 * W, -.4 * L]];
    for (let i = 0; i <= 8; i++) {
      const th = (90 - i * 22.5) * D, wob = 1 + between(-.06, .06);
      pts.push([.5 * W * Math.sin(th) * (1 + between(-.04, .04)), -(.62 * L + .38 * L * Math.cos(th)) * wob]);
    }
    pts.push([-.48 * W, -.4 * L], [-.3 * W, -.16 * L]);
    return smooth(pts.map(([x, y]) => F(x, y)));
  }

  // petals: [angle, length, width, front?, deep tone?]; front petals cup over the stamens (and over the letters)
  function anemone(back, front, cx, cy, R, sq, tilt, petals) {
    const soft = radial(cx, cy, R * 1.05, SAGE), deep = radial(cx, cy, R * 1.05, DEEP);
    const headB = E('g', {}, back), headF = E('g', {}, front);
    const out = { cx, cy, petals: [], heads: [headB, headF] };
    const make = ([ang, l, w, isFront, isDeep], parent) => {
      const F = place(cx, cy, ang + between(-5, 5), sq, tilt), L = R * l, W = R * w;
      const g = E('g', { class: 'petal' }, parent);
      E('path', { d: petalPath(F, L, W), class: 'f', style: paint(isDeep ? deep : soft, gold, 1.3) }, g);
      // translucent light streaks fanning from the heart, like pigment lifted with a damp brush
      let s = '';
      for (let i = 0; i < 3; i++) {
        const x = between(-.22, .22) * W, [a, b] = F(x * .3, -.25 * L), [c, d] = F(x, -between(.7, .85) * L);
        s += `M${f(a)} ${f(b)}L${f(c)} ${f(d)}`;
      }
      E('path', { d: s, class: 'h', style: 'fill:none;stroke:#fff;stroke-opacity:.28;stroke-width:3;stroke-linecap:round' }, g);
      out.petals.push(g);
    };
    petals.filter(p => !p[3]).forEach(p => make(p, headB));

    // stamens: a dark heart, fine filaments and gold-tipped anthers
    const C = place(cx, cy, 0, sq, tilt);
    const st = E('g', { class: 'stamens' }, headB);
    E('circle', { cx: f(cx), cy: f(cy), r: f(R * .1), class: 'dot', style: paint(STAMEN) }, st);
    let d = '';
    const tips = [];
    for (let i = 0; i < 26; i++) {
      const a = i / 26 * Math.PI * 2 + between(-.12, .12), r1 = R * between(.18, .34);
      const [x0, y0] = C(Math.cos(a) * R * .06, Math.sin(a) * R * .06), [x1, y1] = C(Math.cos(a) * r1, Math.sin(a) * r1);
      d += `M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}`;
      tips.push([x1, y1]);
    }
    out.filaments = E('path', { d, style: `fill:none;stroke:${STAMEN};stroke-width:.9;stroke-linecap:round` }, st);
    out.anthers = tips.map(([x, y], i) => E('circle', { cx: f(x), cy: f(y), r: f(between(1.2, 2)), class: 'dot', style: paint(i % 4 ? ANTHER : STAMEN) }, st));

    petals.filter(p => p[3]).forEach(p => make(p, headF));
    return out;
  }

  // a closed bud: two overlapping petals and a little calyx, its base at (x, y)
  function bud(g, x, y, deg, L) {
    const F = place(x, y, deg), fill = linear(BUD, 1, .2), W = L * .55;
    const el = E('g', { class: 'bud' }, g);
    const shape = (o, w) => smooth([[0, 0], [w * .5, -.3 * L], [w * .42, -.7 * L], [o * w * .1, -L], [-w * .4, -.72 * L], [-w * .5, -.3 * L]].map(([a, b]) => F(a + o * w * .12, b)));
    E('path', { d: shape(-1, W), class: 'f', style: paint(fill, gold, 1.1) }, el);
    E('path', { d: shape(1, W * .8), class: 'f', style: paint(fill, gold, 1.1) }, el);
    E('path', { d: smooth([[-W * .45, -.12 * L], [0, -.3 * L], [W * .45, -.12 * L], [W * .15, .08 * L], [-W * .15, .08 * L]].map(([a, b]) => F(a, b))), class: 'f', style: paint('#3E7C5C', gold, .8) }, el);
    return { el, origin: `${f(x)} ${f(y)}` };
  }

  /* ---------- gold work: stems, baby's-breath, dust ---------- */
  // a stem of cubic segments [x0,y0, c1x,c1y, c2x,c2y, x1,y1, ...]; returns the path and t (0..1) -> [x, y, heading]
  function stem(g, pts, w) {
    let d = `M${pts[0]} ${pts[1]}`;
    const segs = [];
    for (let i = 2; i < pts.length; i += 6) {
      d += `C${pts.slice(i, i + 6).join(' ')}`;
      segs.push([pts[i - 2], pts[i - 1], ...pts.slice(i, i + 6)]);
    }
    const el = E('path', { d, style: `fill:none;stroke:${gold};stroke-width:${w};stroke-linecap:round` }, g);
    const at = t => {
      const n = segs.length, k = Math.min(n - 1, Math.floor(t * n)), u = t * n - k, m = 1 - u;
      const [a, b, c, dd, e, ff, gg, h] = segs[k];
      return [m * m * m * a + 3 * m * m * u * c + 3 * m * u * u * e + u * u * u * gg,
        m * m * m * b + 3 * m * m * u * dd + 3 * m * u * u * ff + u * u * u * h,
        Math.atan2(3 * m * m * (dd - b) + 6 * m * u * (ff - dd) + 3 * u * u * (h - ff), 3 * m * m * (c - a) + 6 * m * u * (e - c) + 3 * u * u * (gg - e)) / D];
    };
    return { el, at };
  }

  // tiny five-petal gold floret
  function floret(g, x, y, r) {
    const el = E('g', { class: 'tip' }, g), fill = radial(x, y, r * 1.1, FLORET);
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 + between(-8, 8)) * D;
      E('circle', { cx: f(x + Math.cos(a) * r * .55), cy: f(y + Math.sin(a) * r * .55), r: f(r * .5), class: 'dot', style: paint(fill) }, el);
    }
    E('circle', { cx: f(x), cy: f(y), r: f(r * .22), class: 'dot', style: paint('#9C7428') }, el);
    return el;
  }

  // a gold sprig of baby's-breath: twigs off a main stem, tipped with florets, sage berries or gold seeds
  function sprig(g, pts, ts, out) {
    const s = stem(g, pts, .9);
    out.lines.push(s.el);
    ts.forEach((t, i) => {
      const [x, y, a] = s.at(t), side = i % 2 ? 1 : -1, ang = (a + side * between(35, 60)) * D, len = between(12, 24);
      const tx = x + Math.cos(ang) * len, ty = y + Math.sin(ang) * len;
      out.lines.push(E('path', { d: `M${f(x)} ${f(y)}Q${f(x + Math.cos(ang - side * .3) * len * .55)} ${f(y + Math.sin(ang - side * .3) * len * .55)} ${f(tx)} ${f(ty)}`, style: `fill:none;stroke:${gold};stroke-width:.7;stroke-linecap:round` }, g));
      const kind = i % 3;
      out.tips.push(kind === 0 ? floret(g, tx, ty, between(3.2, 4.6))
        : E('circle', { cx: f(tx), cy: f(ty), r: f(kind === 1 ? between(2.6, 3.6) : between(1.4, 2)), class: 'dot tip', style: paint(kind === 1 ? (i % 2 ? '#7FA88E' : '#4E7F65') : ANTHER) }, g));
    });
    const [ex, ey] = s.at(1);
    out.tips.push(floret(g, ex, ey, 4.2));
  }

  function dust(g, cx, cy, spread, n, out) {
    for (let i = 0; i < n; i++) {
      out.push(E('circle', { cx: f(cx + between(-spread, spread)), cy: f(cy + between(-spread, spread) * .8), r: f(between(.7, 2.3)), class: 'dot dust', style: paint(ANTHER) }, g));
    }
  }

  function build(svg, opts = {}) {
    seed = 7; gid = 0; P = `fm${++uid}`;
    svg.setAttribute('viewBox', '0 0 400 560');
    svg.innerHTML = '';
    defs = E('defs', {}, svg);
    const ink = E('linearGradient', { id: `${P}ink`, x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    [[0, '#264E12'], [.55, '#5B7F20'], [1, '#264E12']].forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, ink));
    const goldId = `${P}gold`;
    const gg = E('linearGradient', { id: goldId, gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 400, y2: 560 }, defs);
    [[0, '#E9CF86'], [.35, '#B88A35'], [.6, '#E2C075'], [1, '#A97A2A']].forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, gg));
    gold = `url(#${goldId})`;

    // watercolour: ragged, bleeding edges plus a mottled wash
    const wc = E('filter', { id: `${P}wc`, x: '-10%', y: '-10%', width: '120%', height: '120%' }, defs);
    E('feTurbulence', { type: 'fractalNoise', baseFrequency: .045, numOctaves: 3, seed: 3, result: 'edge' }, wc);
    E('feDisplacementMap', { in: 'SourceGraphic', in2: 'edge', scale: 4.5, xChannelSelector: 'R', yChannelSelector: 'G', result: 'bled' }, wc);
    E('feTurbulence', { type: 'fractalNoise', baseFrequency: .022, numOctaves: 2, seed: 11, result: 'wash' }, wc);
    E('feComposite', { in: 'bled', in2: 'wash', operator: 'arithmetic', k1: .55, k2: .72, k3: 0, k4: 0 }, wc);
    const paper = opts.animated ? { filter: `url(#${P}wc)` } : {};

    const back = E('g', { class: 'fm fm--back' }, svg);
    const front = E('g', { class: 'fm fm--front' });
    const bloom = { stems: [], flowers: [], buds: [], sprigs: { lines: [], tips: [] }, dust: [] };

    // gold stems gathering into one bouquet at the bottom, threading behind both letters
    const stemsG = E('g', {}, back);
    [[212, 552, 222, 470, 246, 330, 262, 230],   // big anemone
      [208, 552, 186, 520, 132, 486, 104, 436],  // anemone by K's foot
      [216, 552, 250, 512, 288, 452, 300, 404],  // anemone in K's crook
      [206, 552, 120, 480, 30, 330, 70, 158],    // tall bud left of A
      [250, 306, 236, 220, 214, 150, 204, 98],   // bud above A
      [246, 330, 290, 320, 338, 306, 362, 286]   // bud on the right
    ].forEach(p => bloom.stems.push(stem(stemsG, p, 1.6).el));

    // baby's-breath and gold dust, behind everything
    const sprigG = E('g', {}, back);
    sprig(sprigG, [218, 548, 270, 512, 320, 492, 382, 452], [.25, .4, .55, .68, .8, .9], bloom.sprigs);
    sprig(sprigG, [204, 548, 160, 524, 110, 524, 44, 500], [.3, .5, .66, .82], bloom.sprigs);
    sprig(sprigG, [296, 118, 318, 84, 340, 62, 370, 42], [.3, .55, .8], bloom.sprigs);
    sprig(sprigG, [44, 334, 30, 292, 26, 252, 40, 206], [.35, .6, .85], bloom.sprigs);
    const dustG = E('g', {}, back);
    dust(dustG, 360, 70, 30, 9, bloom.dust);
    dust(dustG, 368, 500, 26, 8, bloom.dust);
    dust(dustG, 34, 170, 22, 6, bloom.dust);
    dust(dustG, 180, 30, 18, 4, bloom.dust);

    const budsG = E('g', paper, back);
    bloom.buds.push(bud(budsG, 70, 158, -8, 44), bud(budsG, 204, 98, 12, 32), bud(budsG, 362, 286, 52, 28));

    // anemones: back petals and stamens behind the letters, front petals in front
    const backFl = E('g', paper, back), frontFl = E('g', paper, front);
    // big one, upper right; its lower-left petal crosses A's right leg
    bloom.flowers.push(anemone(backFl, frontFl, 258, 180, 70, .7, -18,
      [[300, 1, 1.05], [0, 1.05, 1.1], [60, 1, 1.05], [120, .95, 1.15, 1, 1], [180, .9, 1.2, 1, 1], [240, 1, 1.1, 1, 1]]));
    // by K's foot; two front petals cover the bottom of K's stem
    bloom.flowers.push(anemone(backFl, frontFl, 100, 410, 58, .66, 15,
      [[10, 1, 1.05], [310, 1, 1.05], [70, .95, 1.05, 1], [130, .9, 1.15, 1, 1], [190, .88, 1.2, 1, 1], [250, .95, 1.1, 1]]));
    // small one in the crook of K, front petal over the leg
    bloom.flowers.push(anemone(backFl, frontFl, 296, 378, 46, .6, -25,
      [[20, 1, 1.05], [80, 1, 1.05], [320, 1, 1.05], [140, .92, 1.15, 1, 1], [200, .9, 1.2, 1, 1], [260, .95, 1.1, 1]]));

    // the letters sit between the two floral layers
    const glyphs = parent => {
      const A = E('text', { x: 60, y: 262, class: 'fm__glyph fm__a' }, parent); A.textContent = 'A';
      const K = E('text', { x: 135, y: 440, class: 'fm__glyph fm__k' }, parent); K.textContent = 'K';
      return [A, K];
    };
    let out;
    if (!opts.animated) { // the wax seal only needs the flat letters
      const txt = E('g', { class: 'fm__letters', fill: `url(#${P}ink)` }, svg);
      out = { letters: glyphs(txt) };
    } else {
      // ink rises through the letters behind a soft diagonal edge (mask rect slides from y 40 to -600)
      const wipe = E('linearGradient', { id: `${P}wipe`, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      [[0, '#000'], [.45, '#000'], [.55, '#fff'], [1, '#fff']].forEach(([o, c]) => E('stop', { offset: o, 'stop-color': c }, wipe));
      const mask = E('mask', { id: `${P}fill`, maskUnits: 'userSpaceOnUse', x: -200, y: -200, width: 800, height: 960 }, defs);
      const wipeRect = E('rect', { x: -200, y: -600, width: 800, height: 1120, fill: `url(#${P}wipe)`, transform: 'rotate(-25 200 280)' }, mask);
      // a band of light that glides across the letters only
      glyphs(E('clipPath', { id: `${P}clip` }, defs));
      const sheenGrad = E('linearGradient', { id: `${P}sheen` }, defs);
      [[0, 0], [.5, .55], [1, 0]].forEach(([o, a]) => E('stop', { offset: o, 'stop-color': '#fff', 'stop-opacity': a }, sheenGrad));
      // depth: letters cast a soft shadow on the flowers behind, the front petals cast one on the letters
      const shadow = (id, dy, blur, op) => {
        const fl = E('filter', { id, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
        E('feDropShadow', { dx: 0, dy, stdDeviation: blur, 'flood-color': '#01261E', 'flood-opacity': op }, fl);
      };
      shadow(`${P}lsh`, 3, 3, .28);
      shadow(`${P}fsh`, 2, 2.4, .32);
      front.setAttribute('filter', `url(#${P}fsh)`);

      const mark = E('g', { class: 'fm__mark' }, svg);
      const outline = E('g', { class: 'fm__outline', opacity: 0 }, mark); // pen trace, shown only while animating
      const outlines = glyphs(outline);
      const txt = E('g', { class: 'fm__letters', fill: `url(#${P}ink)`, mask: `url(#${P}fill)`, filter: `url(#${P}lsh)` }, mark);
      const letters = glyphs(txt);
      const sheen = E('rect', { x: -300, y: -100, width: 150, height: 760, fill: `url(#${P}sheen)`, transform: 'rotate(18 200 280)' },
        E('g', { 'clip-path': `url(#${P}clip)` }, mark));
      out = { letters, mark, outline, outlines, wipe: wipeRect, sheen };
    }
    svg.appendChild(front);
    out.bloom = bloom;
    return out;
  }

  window.FloralMono = { build };
})();
