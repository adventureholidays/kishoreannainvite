/* =========================================================
   Kishore & Abbrinna | interactions + scroll-mapped motion
   ========================================================= */
(function () {
  const html = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- language (EN / தமிழ்) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const langBtn = $('#langBtn');
  let onLangSwap = () => {};
  const fromUrl = new URLSearchParams(location.search).get('lang'); // share ?lang=ta with elders
  let lang = (fromUrl === 'ta' || fromUrl === 'en') ? fromUrl : (store.get('ka-lang') || 'en');
  function setLang(l) {
    lang = l;
    html.dataset.lang = l;
    html.lang = l;
    langBtn.textContent = l === 'en' ? 'தமிழ்' : 'English';
    langBtn.setAttribute('aria-label', l === 'en' ? 'தமிழில் படிக்க' : 'Read in English');
    store.set('ka-lang', l);
  }
  setLang(lang);
  langBtn.addEventListener('click', () => {
    setLang(lang === 'en' ? 'ta' : 'en');
    requestAnimationFrame(() => { ScrollTrigger.refresh(); onLangSwap(); });
  });

  /* ---------- calendar pages for the save-the-date ---------- */
  (function buildCalendar() {
    const wd = { en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], ta: ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'] };
    const month = { en: { 10: 'October', 11: 'November' }, ta: { 10: 'அக்டோபர்', 11: 'நவம்பர்' } };
    const ring = '<svg class="cal__ring" viewBox="0 0 40 40" aria-hidden="true"><path d="M21 4 C31 4 37 11 36.5 20.5 C36 30 29 36.5 19.5 36 C10 35.5 3.5 29 4 19.5 C4.5 10.5 11 4.5 20 4.2 C25 4 29.5 6 32 9.5"/></svg>';
    $$('.cal__page').forEach(pg => {
      const [y, m] = pg.dataset.month.split('-').map(Number);
      const first = new Date(y, m - 1, 1).getDay();
      const days = new Date(y, m, 0).getDate();
      let h = `<div class="cal__head"><span class="en">${month.en[m]} ${y}</span><span class="ta">${month.ta[m]} ${y}</span></div><div class="cal__grid">`;
      wd.en.forEach((d, i) => { h += `<b class="cal__wd"><span class="en">${d}</span><span class="ta">${wd.ta[i]}</span></b>`; });
      for (let i = 0; i < first; i++) h += '<i></i>';
      for (let d = 1; d <= days; d++) {
        const mark = m === 11 && d === 21 ? ' is-rec' : m === 11 && d === 22 ? ' is-wed' : '';
        h += `<span class="cal__day${mark}">${mark.includes('wed') ? '<i class="cal__fill"></i>' : ''}<span class="cal__n">${d}</span>${mark ? ring : ''}</span>`;
      }
      h += '</div>';
      if (m === 11) {
        h += '<div class="cal__legend"><span class="lg lg--rec"><span class="en">21 Reception</span><span class="ta">21 வரவேற்பு</span></span>'
           + '<span class="lg lg--wed"><span class="en">22 Wedding</span><span class="ta">22 திருமணம்</span></span></div>';
      }
      pg.innerHTML = h;
    });
  })();

  /* ---------- draw all ornaments ---------- */
  Art.render();
  const mono = AKMono.build($('#monoSvg'));

  /* ---------- per-letter text: every glyph blurs in and bounces up ---------- */
  const SPLIT = '.vow, .mono__cap, .save, .cal__note, .invite__lead, .invite__big, .name, .heading, '
    + '.event__name, .event__when, .event__time, .link, .count__cell > span, '
    + '.venue__name, .venue__addr, .venue__note, .close__lead, .close__sign, .close__date';
  const graphemes = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const letterSets = new Map();

  function splitChars(el) {
    const chars = [];
    (function walk(node) {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 1) { if (n.tagName !== 'BR' && n.tagName !== 'svg') walk(n); return; }
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        const sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = n.textContent;
        frag.appendChild(sr);
        n.textContent.split(/(\s+)/).forEach(tok => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.setAttribute('aria-hidden', 'true');
          (graphemes ? Array.from(graphemes.segment(tok), x => x.segment) : Array.from(tok)).forEach(c => {
            const ch = document.createElement('span');
            ch.className = 'ch';
            ch.textContent = c;
            w.appendChild(ch);
            chars.push(ch);
          });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      });
    })(el);
    return chars;
  }
  if (!reduce) $$(SPLIT).forEach(el => letterSets.set(el, splitChars(el)));
  const charsOf = sel => $$(sel).flatMap(el => letterSets.get(el) || []);

  // blur-fade first, then a springy rise with a little overshoot, letter by letter
  const rise = (i, t) => parseFloat(getComputedStyle(t).fontSize) * 0.6;
  function addLetters(tl, chars, at = 0, blur = 0.8) {
    const stagger = { amount: Math.min(chars.length * 0.03, 0.9) };
    return tl
      .fromTo(chars, { autoAlpha: 0, filter: 'blur(12px)' },
        { autoAlpha: 1, filter: 'blur(0px)', duration: blur, ease: 'power2.out', stagger }, at)
      .fromTo(chars, { y: rise, scale: 0.85 },
        { y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.8)', stagger }, at);
  }
  // squeeze any timeline so it plays out in at most `max` seconds
  const fit = (tl, max = 1.5) => { const d = tl.duration(); if (d > max) tl.timeScale(d / max); return tl; };
  const vowChars = [charsOf('.vow--1'), charsOf('.vow--2')];

  /* ---------- smooth scroll ---------- */
  html.classList.add('is-locked');
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085, virtualScroll: () => false }); // wheel/touch are driven by the section pager below
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* ---------- background music (only if assets/audio/music.mp3 exists) ---------- */
  const audio = $('#bgm'), musicBtn = $('#musicBtn');
  function markMusic(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
  }
  audio.addEventListener('loadedmetadata', () => { musicBtn.hidden = false; });
  audio.addEventListener('error', () => { musicBtn.hidden = true; });
  function playMusic() {
    const p = audio.play();
    if (p && p.then) p.then(() => { musicBtn.hidden = false; markMusic(true); }).catch(() => markMusic(false));
  }
  musicBtn.addEventListener('click', () => {
    if (audio.paused) playMusic(); else { audio.pause(); markMusic(false); }
  });

  /* ---------- hero states before the card opens ---------- */
  // the gilt ornaments of the opening card are drawn in, and its stars and beads pop into place
  const heroBits = ['.vow', '.rule'];
  if (!reduce) {
    gsap.set([...heroBits, '.chapter'], { autoAlpha: 0 });
    gsap.set('.intro .gl', { drawSVG: 0 });
    gsap.set('.s-bless .gs, .s-bless .gb', { scale: 0, transformOrigin: '50% 50%' });
  }

  function heroIntro() {
    const tl = gsap.timeline();
    tl.set(heroBits, { autoAlpha: 1 })
      .from('.bloom .stem', { drawSVG: 0, duration: 1.8, ease: 'power2.out' }, 0)
      .from('.bloom .lvs', { scale: 0, transformOrigin: '0% 50%', stagger: 0.035, duration: 0.5, ease: 'back.out(2)' }, 0.4)
      .from('.arch__crown .ln', { drawSVG: '50% 50%', duration: 1 }, 0.2)
      .from('.arch__crown .lotus', { scale: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'back.out(1.6)' }, 0.5)
      .from('.bloom .lotus', { scale: 0, transformOrigin: '50% 100%', duration: 1, ease: 'back.out(1.6)' }, 0.8)
      .from('.bloom .flw:not(.lotus)', { scale: 0, rotation: '-=60', transformOrigin: '50% 50%', ease: 'back.out(2)', stagger: { each: 0.12 } }, 1)
      .to('.intro__orn .gl', { drawSVG: '100%', duration: 1.2, ease: 'power2.out' }, 0.5)
      .to('.chapter', { autoAlpha: 1, duration: 1.2, ease: 'power1.out' }, 0.3)
      .to('.intro .gb', { scale: 1, duration: 0.5, ease: 'back.out(3)', stagger: { each: 0.03, from: 'random' } }, 0.7)
      .to('.intro .gs', { scale: 1, duration: 0.9, ease: 'back.out(2)', stagger: 0.15 }, 0.9)
      .from('.rule .gl', { drawSVG: '50% 50%', duration: 1 }, 1.9)
      .to('.rule .gs, .rule .gb', { scale: 1, duration: 0.6, ease: 'back.out(2)' }, 2.1)
      .call(() => gsap.to('.s-bless .gs', { scale: 0.82, opacity: 0.8, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: 0.4 }));
    if (!reduce) { addLetters(tl, vowChars[0], 0.7, 0.35); addLetters(tl, vowChars[1], 2.3, 0.35); }
    return tl.timeScale(0.8); // slow, unhurried vows (~5.5s)
  }

  /* ---------- the language pill sits inside the opening card, and tucks into the corner after it ---------- */
  ScrollTrigger.create({
    trigger: '#mono', start: 'top 85%',
    onEnter: () => html.classList.remove('is-cover'),
    onLeaveBack: () => html.classList.add('is-cover')
  });
  // the opening ornaments fade as it slides up out of the window
  gsap.to('.intro', { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '#bless', start: 'top top', end: 'bottom 35%', scrub: true } });

  /* ---------- the gate: tap the seal, doors swing open ---------- */
  const gate = $('#gate');
  function unlock() {
    gate.remove();
    html.classList.remove('is-locked');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  }
  function openGate() {
    if (gate.dataset.open) return;
    gate.dataset.open = '1';
    playMusic(); // inside the tap, so phones allow audio

    if (reduce) {
      gsap.to(gate, { autoAlpha: 0, duration: 0.4, onComplete: unlock });
      return;
    }
    const tl = gsap.timeline();
    tl.to('.seal-btn', { autoAlpha: 0, duration: 0.2 })
      .to('.gate__hint', { autoAlpha: 0, y: 10, duration: 0.3 }, 0)
      .to('.seal', { scale: 0.93, duration: 0.14, yoyo: true, repeat: 1, ease: 'power1.inOut' }, 0)
      .to('.seal--l', { x: -5, rotation: -5, duration: 0.3, ease: 'power2.out' }, 0.3)
      .to('.seal--r', { x: 5, rotation: 5, duration: 0.3, ease: 'power2.out' }, 0.3)
      .to('.thoranam--gate', { yPercent: -130, duration: 0.9, ease: 'power2.in' }, 0.35)
      .to('.door--l', { rotationY: 105, duration: 1.7, ease: 'power3.inOut' }, 0.5)
      .to('.door--r', { rotationY: -105, duration: 1.7, ease: 'power3.inOut' }, 0.5)
      .to(gate, { backgroundColor: 'rgba(221,231,216,0)', duration: 1.2 }, 0.6)
      .call(heroIntro, null, 1.15)
      .call(unlock, null, 2.2);
    fit(tl);
  }
  $('#openBtn').addEventListener('click', openGate);


  /* ---------- section pager: one scroll / swipe glides to the next slide and centres it ---------- */
  const scenes = $$('.scene');
  let paging = false;
  const topOf = el => el.getBoundingClientRect().top + scrollY;
  function goTo(y) {
    y = Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight));
    paging = true;
    setTimeout(() => { paging = false; }, 1250);
    if (lenis) lenis.scrollTo(y, { duration: 1.2, easing: t => 1 - Math.pow(1 - t, 4), force: true });
    else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
  }
  function page(dir) {
    if (html.classList.contains('is-locked') || paging) return;
    const mid = scrollY + innerHeight / 2;
    let i = scenes.findIndex(el => { const t = topOf(el); return mid >= t && mid < t + el.offsetHeight; });
    if (i < 0) i = mid < topOf(scenes[0]) ? -1 : scenes.length - 1;
    const cur = scenes[i];
    if (cur) { // a slide taller than the screen scrolls through first
      const r = cur.getBoundingClientRect();
      if (dir > 0 && r.bottom > innerHeight + 8) return goTo(Math.min(scrollY + innerHeight * 0.85, scrollY + r.bottom - innerHeight));
      if (dir < 0 && r.top < -8) return goTo(Math.max(scrollY - innerHeight * 0.85, scrollY + r.top));
    }
    const next = scenes[i + dir];
    if (!next) return;
    const h = next.offsetHeight, t = topOf(next);
    goTo(h <= innerHeight ? t - (innerHeight - h) / 2 : dir > 0 ? t : t + h - innerHeight);
  }
  addEventListener('wheel', e => {
    e.preventDefault();
    if (Math.abs(e.deltaY) > 4) page(e.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  let touchY = null;
  addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchmove', e => {
    if (html.classList.contains('is-locked')) return;
    if (e.target.closest('input, textarea, select')) return;
    e.preventDefault();
    if (touchY === null) return;
    const dy = touchY - e.touches[0].clientY;
    if (Math.abs(dy) > 36) { touchY = null; page(dy > 0 ? 1 : -1); }
  }, { passive: false });
  addEventListener('keydown', e => {
    if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    const d = { ArrowDown: 1, PageDown: 1, ' ': 1, ArrowUp: -1, PageUp: -1 }[e.key];
    if (d) { e.preventDefault(); page(d); }
  });

  /* ---------- scroll-mapped scenes ---------- */
  function initScroll() {
    if (reduce) return;
    // Everything reveals top-to-bottom: items that come into view together are queued in reading order
    // and started one after another, so the first line shows before the second, and so on.
    let pending = [], flushTimer = 0, freeAt = 0;
    function flush() {
      pending.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
      const now = gsap.ticker.time;
      let at = Math.max(0, freeAt - now);
      pending.forEach(({ tl, gap }) => { gsap.delayedCall(at, () => tl.play()); at += gap; });
      freeAt = now + at;
      pending = [];
    }
    function reveal(tl, el, start, gap, keepTime) {
      tl.pause();
      if (!keepTime) fit(tl);
      ScrollTrigger.create({
        trigger: el, start, once: true,
        onEnter: () => {
          pending.push({ tl, el: typeof el === 'string' ? $(el) : el, gap: gap === undefined ? Math.min(tl.duration() * 0.6, 0.15) : gap });
          clearTimeout(flushTimer); flushTimer = setTimeout(flush, 40);
        }
      });
      return tl;
    }

    // monogram: the gold axis drops through the card and the two hairline arcs swing out from it, beads and stars
    // pop into place, then A and K are inked on (gold edge first, green just behind) and a band of light glides over them
    const arrive = gsap.timeline();
    arrive
      .from(mono.lines, { drawSVG: 0, duration: 1.5, ease: 'power2.inOut', stagger: 0.07 }, 0)
      .from(mono.arcs, { drawSVG: 0, duration: 1.8, ease: 'power1.inOut', stagger: 0.18 }, 0.3)
      .from(mono.beads, { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(3)', stagger: { each: 0.09, from: 'random' } }, 0.5)
      .from(mono.stars.map(s => s.el), { scale: 0, rotation: -120, transformOrigin: '50% 50%', duration: 1, ease: 'back.out(2)', stagger: 0.25 }, 0.8)
      .fromTo(mono.mark, { scale: 1.04, y: 8 }, { scale: 1, y: 0, svgOrigin: '540 760', duration: 3, ease: 'expo.out' }, 0.8);
    [['A', 0.9], ['K', 0.9]].forEach(([L, at]) => {
      arrive
        .fromTo(mono.wipe(L, 'edge'), { attr: { r: 0 } }, { attr: { r: 700 }, duration: 1.5, ease: 'power2.inOut' }, at)
        .fromTo(mono.wipe(L, 'ink'), { attr: { r: 0 } }, { attr: { r: 700 }, duration: 1.5, ease: 'power2.inOut' }, at + 0.25);
    });
    const shine = () => gsap.timeline().fromTo(mono.sheen, { attr: { x: 0 } }, { attr: { x: 950 }, duration: 1.4, ease: 'power2.inOut' });
    arrive.add(shine(), 3.2);
    arrive.fromTo('.mono__cap', { '--r': 0 }, { '--r': 1, duration: 1.2, ease: 'power2.out' }, 2.6);
    arrive.add(fit(addLetters(gsap.timeline(), charsOf('.mono__cap'))), 2.7);
    arrive.from('#monoOrn .mono__orn-l', { drawSVG: 0, duration: 0.9, ease: 'power2.out' }, 3.1)
      .from('#monoOrn circle, #monoOrn .mono__orn-s', { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(3)', stagger: 0.1 }, 3.3);
    arrive.call(() => {
      // idle: the stars breathe, the beads glimmer, and a quiet glint crosses the letters every few seconds
      gsap.to(mono.stars.map(s => s.el), { scale: 0.78, opacity: 0.75, transformOrigin: '50% 50%', duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.5, from: 'start' } });
      gsap.to(mono.beads, { opacity: 0.55, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1, stagger: { each: 0.3, from: 'random' } });
      gsap.timeline({ repeat: -1, repeatDelay: 6, delay: 4 }).add(shine());
    });
    reveal(arrive, '#mono', 'top 75%', undefined, true);

    // text: each letter blurs in and bounces up as its line crosses the screen
    const groups = [];
    function lettersOnScroll(el, chars, at = 0) {
      if (!chars.length) return;
      const tl = fit(addLetters(gsap.timeline({ paused: true, onComplete: () => gsap.set(chars, { clearProps: 'filter,transform' }) }), chars, at));
      groups.push({ el, tl });
      ScrollTrigger.create({
        trigger: el, start: 'top 92%',
        onEnter: () => { // the hidden language waits until it is shown
          if (!el.offsetParent) return;
          pending.push({ tl, el, gap: 0.1 });
          clearTimeout(flushTimer); flushTimer = setTimeout(flush, 40);
        }
      });
    }
    const TRIGGERED = '.invite__lead, .invite__big, .name, .heading, .venue__name, .venue__addr, .venue__note, '
      + '.close__lead, .close__sign, .close__date';
    $$(TRIGGERED).forEach(el => lettersOnScroll(el, letterSets.get(el)));
    $$('.count__cell').forEach(cell => lettersOnScroll(cell, charsOf('.count__cell > span').filter(c => cell.contains(c))));
    $$('.event').forEach(ev => $$('.event__name, .event__when, .event__time, .link', ev).forEach((el, i) => lettersOnScroll(el, letterSets.get(el), i * 0.15)));
    onLangSwap = () => groups.forEach(g => {
      if (g.el.offsetParent && g.tl.progress() === 0 && !g.tl.isActive() && g.el.getBoundingClientRect().top < innerHeight * 0.92) g.tl.play();
    });

    // blocks that aren't text (buttons, form) blur-fade in as one
    $$('.btn-row, .rsvp').forEach(el => {
      reveal(gsap.timeline().from(el, {
        autoAlpha: 0, y: 30, filter: 'blur(12px)', duration: 1, ease: 'power3.out', clearProps: 'filter,transform'
      }), el, 'top 94%', 0.1);
    });

    // flourish + heart between the names
    $$('.knot').forEach(svg => {
      reveal(gsap.timeline()
        .from($$('.ln', svg), { drawSVG: '100% 100%', duration: 1, ease: 'none' })
        .from($$('.heart', svg), { scale: 0, transformOrigin: '50% 60%', duration: 0.5, ease: 'back.out(3)' }, 0.5), svg, 'top 90%');
    });

    // save the date: swirl + title arrive, then the calendar is pinned and flips to November
    const titleTl = gsap.timeline()
      .from('.swirl .swirl__line', { drawSVG: 0, duration: 2, ease: 'none' })
      .from('.swirl .lvs, .swirl .flw', { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.4 }, '-=0.4');
    addLetters(titleTl, charsOf('.save'), 0.6);
    fit(titleTl);
    const arriveDate = gsap.timeline().add(titleTl, 0);
    const flip = gsap.timeline();
    flip
      .to('.cal__page--oct', { rotationX: 160, transformOrigin: '50% 0%', duration: 1.4, ease: 'power2.in' })
      .to('.cal__page--oct', { autoAlpha: 0, duration: 0.3 }, '-=0.35')
      .from('.cal__page--nov .cal__day', { autoAlpha: 0, scale: 0.4, stagger: { each: 0.025 }, duration: 0.4 }, '-=0.3')
      .from('.cal .is-rec .cal__ring path', { drawSVG: 0, duration: 0.8, ease: 'none' })
      .from('.cal .is-wed .cal__ring path', { drawSVG: 0, duration: 1, ease: 'none' }, '-=0.2')
      .from('.cal .is-wed .cal__fill', { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)' }, '-=0.2')
      .to('.cal .is-wed .cal__n', { color: 'var(--paper)', duration: 0.3 }, '<')
      .from('.cal__legend > span', { autoAlpha: 0, y: 8, stagger: 0.2, duration: 0.5 })
    addLetters(flip, charsOf('.cal__note'));
    flip.to({}, { duration: 0.6 });
    flip.timeScale(flip.duration() / 3); // calendar sequence takes ~3s
    arriveDate.add(flip, 0); // October tears as the slide glides in, in step with the title
    reveal(arriveDate, '#date', 'top 98%', 0, true);

    // events: the gold thread is pulled down the page
    reveal(gsap.timeline().from('.thread__line .thread', { drawSVG: 0, ease: 'none', duration: 3 }), '.thread', 'top 78%', 0);
    $$('.event').forEach(ev => {
      reveal(gsap.timeline().from($('.event__node', ev), { scale: 0, duration: 0.4, ease: 'back.out(2)' }), ev, 'top 85%', 0.1);
    });

    // countdown arches
    reveal(gsap.timeline()
      .from('.count__cell', { autoAlpha: 0, y: 10, stagger: 0.1, duration: 0.5 }), '#countdown', 'top 88%');

    // venue arch + map
    reveal(gsap.timeline()
      .from('.venue__frame .frame', { drawSVG: '50% 50%', duration: 1, ease: 'none' })
      .from('.venue__map', { autoAlpha: 0, scale: 0.94, duration: 0.8 }, 0.4), '.venue__arch', 'top 88%');

    // closing: thoranam drops in
    reveal(gsap.timeline()
      .from('.thoranam--close .rope', { drawSVG: '50% 50%', duration: 0.6, ease: 'none' })
      .from('.thoranam--close .mango, .thoranam--close .mari', { y: -24, autoAlpha: 0, stagger: { each: 0.06, from: 'center' }, duration: 0.5 }, 0.2), '.thoranam--close', 'top 90%');

    ScrollTrigger.refresh();
  }

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(initScroll);

  /* ---------- countdown ---------- */
  const target = new Date('2026-11-22T10:00:00+05:30').getTime();
  const units = { d: $('[data-unit="d"]'), h: $('[data-unit="h"]'), m: $('[data-unit="m"]'), s: $('[data-unit="s"]') };
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
    if (left === 0) {
      $('#countdown').hidden = true;
      $('#countDone').hidden = false;
      return false;
    }
    units.d.textContent = pad(Math.floor(left / 86400));
    units.h.textContent = pad(Math.floor(left % 86400 / 3600));
    units.m.textContent = pad(Math.floor(left % 3600 / 60));
    units.s.textContent = pad(left % 60);
    return true;
  }
  if (tick()) { const id = setInterval(() => { if (!tick()) clearInterval(id); }, 1000); }

  /* ---------- RSVP → WhatsApp ---------- */
  const WHATSAPP = '917010933178';
  const form = $('#rsvpForm'), guestsOut = $('#guests'), err = $('#formError');
  let guests = 2;
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    guests = Math.min(20, Math.max(1, guests + Number(b.dataset.step)));
    guestsOut.textContent = guests;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = form.name.value.trim();
    if (!name) { err.hidden = false; form.name.focus(); return; }
    err.hidden = true;
    const ev = form.event.value;
    const wish = form.wish.value.trim();
    const event = {
      en: { both: 'the Reception & Wedding', reception: 'the Reception (21 Nov)', wedding: 'the Wedding (22 Nov)' },
      ta: { both: 'வரவேற்பு மற்றும் திருமண விழாவில்', reception: 'வரவேற்பு விழாவில் (21.11.2026)', wedding: 'திருமண விழாவில் (22.11.2026)' }
    }[lang][ev];
    const msg = lang === 'ta'
      ? `கிஷோர்! 🎉\n\n`
        + `*${name}* பேசுகிறேன். நீங்கள் புதிய வாழ்க்கையைத் தொடங்கும் இந்தத் தருணத்தை என்னால் தவறவிடவே முடியாது. நிச்சயம் வந்துவிடுவேன்.\n\n`
        + (guests === 1 ? `${event} உங்களுடன் கொண்டாட நான் வருகிறேன். ✨` : `${event} உங்களுடன் கொண்டாட நாங்கள் *${guests}* பேர் வருகிறோம். ✨`) + `\n\n`
        + (wish ? `${wish}\n\n` : '')
        + `தயாராக இருங்கள், நாங்கள் வருகிறோம்! 💃🕺`
      : `Kishore! 🎉\n\n`
        + `*${name}* here. Watching you start this new chapter is something I truly can't miss. I'll be right there.\n\n`
        + (guests === 1 ? `I'm coming for ${event} to celebrate with you. ✨` : `We're *${guests}* coming for ${event} to celebrate with you. ✨`) + `\n\n`
        + (wish ? `${wish}\n\n` : '')
        + `Get ready, we're coming! 💃🕺`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();
