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
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  /* ---------- draw all ornaments ---------- */
  Art.render();
  const mono = Art.monogram($('#monoSvg'));

  /* ---------- smooth scroll ---------- */
  html.classList.add('is-locked');
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.085 });
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
  const heroBits = ['.pillaiyar', '.thunai', '.title', '.rule', '.kural', '.tagline', '.scroll-cue'];
  if (!reduce) gsap.set(heroBits, { autoAlpha: 0 });

  function heroIntro() {
    const tl = gsap.timeline();
    tl.set(heroBits, { autoAlpha: 1 })
      .from('.bloom .stem', { drawSVG: 0, duration: 1.8, ease: 'power2.out' }, 0)
      .from('.bloom .lvs', { scale: 0, transformOrigin: '0% 50%', stagger: 0.035, duration: 0.5, ease: 'back.out(2)' }, 0.4)
      .from('.arch__crown .ln', { drawSVG: '50% 50%', duration: 1 }, 0.2)
      .from('.arch__crown .lotus', { scale: 0, transformOrigin: '50% 100%', duration: 0.9, ease: 'back.out(1.6)' }, 0.5)
      .from('.bloom .lotus', { scale: 0, transformOrigin: '50% 100%', duration: 1, ease: 'back.out(1.6)' }, 0.8)
      .fromTo('.pillaiyar', { autoAlpha: 0, scale: 0.5, filter: 'blur(8px)' }, { autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }, 0.1)
      .from('.thunai span', { autoAlpha: 0, y: 8, stagger: 0.1, duration: 0.7 }, 0.6)
      .from('.title', { clipPath: 'inset(0% 50% 0% 50%)', duration: 1.1, ease: 'power2.inOut' }, 1.4)
      .from('.rule .ln', { drawSVG: '50% 50%', duration: 1 }, 1.3)
      .from('.rule .flw', { scale: 0, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2)' }, 1.5)
      .fromTo('.kural', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 1.6)
      .from('.tagline', { clipPath: 'inset(-20% 100% -20% -5%)', duration: 1.3, ease: 'power1.inOut' }, 0.8)
      .fromTo('.scroll-cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 2.8);
    return tl;
  }

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
      gsap.to(gate, { autoAlpha: 0, duration: 0.5, onComplete: unlock });
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
      .to(gate, { backgroundColor: 'rgba(227,202,189,0)', duration: 1.2 }, 0.6)
      .add(heroIntro(), 1.15)
      .call(unlock, null, 2.2);
  }
  $('#openBtn').addEventListener('click', openGate);

  /* ---------- scroll-mapped scenes ---------- */
  function initScroll() {
    if (reduce) return;

    // corner blooms open up as you read deeper into the card
    $$('.bloom').forEach(svg => {
      gsap.from($$('.flw:not(.lotus)', svg), {
        scale: 0, rotation: '-=60', transformOrigin: '50% 50%', ease: 'back.out(2)',
        stagger: { each: 0.25 },
        scrollTrigger: { trigger: '#invite', start: 'top top', end: 'bottom bottom', scrub: 1 }
      });
    });

    // monogram: the A is inked as the scene arrives, then the K and its swashes, then the star and a foil glint
    const P = mono.pen;
    const ink = (t, el, d, at) => t.from(el, { drawSVG: 0, duration: d, ease: 'none' }, at);
    const arrive = gsap.timeline({ scrollTrigger: { trigger: '#mono', start: 'top 70%', end: 'top top', scrub: 1 } });
    ink(arrive, P.aThin, 1);
    ink(arrive, P.aThick, 1, '-=0.5');
    ink(arrive, [P.aFlag, P.aFoot], 0.3);
    ink(arrive, P.aBar, 0.3);
    const write = gsap.timeline({ scrollTrigger: { trigger: '#mono', start: 'top top', end: '+=150%', pin: true, scrub: 1 } });
    ink(write, P.kStem, 0.7);
    ink(write, P.kFoot, 0.25);
    ink(write, P.kLeg, 0.6);
    ink(write, P.legFoot, 0.2);
    ink(write, P.arm, 1.8);
    ink(write, P.tail, 1.4);
    write
      .from(mono.star, { scale: 0, rotation: -120, transformOrigin: '50% 50%', duration: 0.6, ease: 'back.out(2.5)' })
      .to(mono.foil, { attr: { gradientTransform: 'translate(760 0)' }, duration: 1.2, ease: 'power1.inOut' }, '<')
      .from('.mono__cap', { autoAlpha: 0, y: 14, duration: 0.6 }, '-=0.3')
      .to({}, { duration: 0.5 });

    // text lines unveil as they cross the screen
    $$('.reveal').forEach(el => {
      gsap.from(el, {
        autoAlpha: 0, y: 24, clipPath: 'inset(0% 0% 100% 0%)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 94%', end: 'top 68%', scrub: 0.6 }
      });
    });

    // names are "written" left to right
    $$('.wipe').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(-25% 100% -25% -12%)' }, {
        clipPath: 'inset(-25% -12% -25% -12%)', ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 52%', scrub: 0.6 }
      });
    });

    // flourish + heart between the names
    $$('.knot').forEach(svg => {
      gsap.timeline({ scrollTrigger: { trigger: svg, start: 'top 90%', end: 'top 62%', scrub: 0.6 } })
        .from($$('.ln', svg), { drawSVG: '100% 100%', duration: 1, ease: 'none' })
        .from($$('.heart', svg), { scale: 0, transformOrigin: '50% 60%', duration: 0.5, ease: 'back.out(3)' }, 0.5);
    });

    // save the date (pinned)
    gsap.timeline({ scrollTrigger: { trigger: '#date', start: 'top 75%', end: 'top top', scrub: 1 } })
      .from('.swirl .swirl__line', { drawSVG: 0, duration: 2, ease: 'none' })
      .from('.swirl .lvs, .swirl .flw', { scale: 0, transformOrigin: '50% 50%', stagger: 0.1, duration: 0.4 }, '-=0.4')
      .from('.save', { clipPath: 'inset(-30% 100% -30% -10%)', duration: 1.4, ease: 'none' }, 0.6);
    gsap.timeline({ scrollTrigger: { trigger: '#date', start: 'top top', end: '+=130%', pin: true, scrub: 1 } })
      .from('.date__frame .frame', { drawSVG: '50% 50%', duration: 1.6, ease: 'none' })
      .from('.date__day', { autoAlpha: 0, y: 10, duration: 0.5 }, 0.9)
      .from('.date__num', { autoAlpha: 0, scale: 0.7, filter: 'blur(10px)', duration: 0.9 }, 1.1)
      .from('.date__month, .date__tamil', { autoAlpha: 0, y: 10, duration: 0.5, stagger: 0.15 }, 1.5)
      .from('.date__time', { autoAlpha: 0, y: 12, duration: 0.6 }, 1.8)
      .to({}, { duration: 0.6 });

    // events: the gold thread is pulled down the page
    gsap.from('.thread__line .thread', {
      drawSVG: 0, ease: 'none',
      scrollTrigger: { trigger: '.thread', start: 'top 78%', end: 'bottom 72%', scrub: 0.6 }
    });
    $$('.event').forEach(ev => {
      gsap.timeline({ scrollTrigger: { trigger: ev, start: 'top 82%', end: 'top 56%', scrub: 0.6 } })
        .from($('.event__node', ev), { scale: 0, duration: 0.4, ease: 'back.out(2)' })
        .from($$(':scope > p, :scope > h4, :scope > a', ev), { autoAlpha: 0, x: 16, stagger: 0.1, duration: 0.5 }, '<0.1');
    });

    // countdown arches
    gsap.timeline({ scrollTrigger: { trigger: '#countdown', start: 'top 88%', end: 'top 58%', scrub: 0.6 } })
      .from('.count__cell .frame', { drawSVG: '50% 50%', stagger: 0.15, duration: 0.8, ease: 'none' })
      .from('.count__cell b, .count__cell > span', { autoAlpha: 0, y: 8, stagger: 0.05, duration: 0.4 }, 0.4);

    // venue arch + map
    gsap.timeline({ scrollTrigger: { trigger: '.venue__arch', start: 'top 88%', end: 'top 45%', scrub: 0.6 } })
      .from('.venue__frame .frame', { drawSVG: '50% 50%', duration: 1, ease: 'none' })
      .from('.venue__map', { autoAlpha: 0, scale: 0.94, duration: 0.8 }, 0.4);

    // closing: thoranam drops in, lamp is drawn, flames light
    gsap.timeline({ scrollTrigger: { trigger: '.thoranam--close', start: 'top 90%', end: 'top 50%', scrub: 0.6 } })
      .from('.thoranam--close .rope', { drawSVG: '50% 50%', duration: 0.6, ease: 'none' })
      .from('.thoranam--close .mango, .thoranam--close .mari', { y: -24, autoAlpha: 0, stagger: { each: 0.06, from: 'center' }, duration: 0.5 }, 0.2);
    gsap.timeline({ scrollTrigger: { trigger: '.lamp', start: 'top 85%', end: 'top 35%', scrub: 0.6 } })
      .from('.lamp .ln, .lamp .pt', { drawSVG: 0, stagger: 0.05, duration: 0.6, ease: 'none' })
      .from('.lamp .flame', { scale: 0, transformOrigin: '50% 100%', stagger: 0.08, duration: 0.4 }, '-=0.2');

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
  const WHATSAPP = '919092605807';
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
    const label = {
      en: { both: 'Reception & Wedding', reception: 'Reception (21 Nov)', wedding: 'Wedding (22 Nov)' },
      ta: { both: 'வரவேற்பு & திருமணம்', reception: 'வரவேற்பு (21.11.2026)', wedding: 'திருமணம் (22.11.2026)' }
    }[lang][ev];
    const msg = lang === 'ta'
      ? `வணக்கம்! கிஷோர் & அப்ரின்னா திருமணத்திற்கு வருகை உறுதி.\nபெயர்: ${name}\nகலந்து கொள்வது: ${label}\nநபர்கள்: ${guests}` + (wish ? `\nவாழ்த்து: ${wish}` : '')
      : `Hello! RSVP for Kishore & Abbrinna's wedding.\nName: ${name}\nAttending: ${label}\nGuests: ${guests}` + (wish ? `\nWishes: ${wish}` : '');
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();
