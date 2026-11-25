/* KRAFTLINE — packing web 1 — interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  document.body.classList.add('is-loading');

  /* ---------- Fallback: no GSAP → show everything ---------- */
  function revealAllStatic() {
    document.body.classList.remove('is-loading');
    $('.loader')?.remove();
    $$('.hero__title .word,.loader__word span').forEach(e => (e.style.transform = 'none'));
    const vc = $('.hero__video-card'); if (vc) vc.style.clipPath = 'none';
    const ef = $('.expand__frame'); if (ef) ef.style.clipPath = 'none';
    $$('.clip-reveal').forEach(e => (e.style.clipPath = 'none'));
    $$('.intro__imgs img,.hero__video-card video').forEach(e => (e.style.transform = 'none'));
    const ov = $('.expand__overlay'); if (ov) ov.style.opacity = 1;
    $$('[data-count]').forEach(e => (e.textContent = e.dataset.count));
    lazyVideos(true);
  }

  /* ---------- Lazy videos ---------- */
  function lazyVideos(force) {
    $$('video[data-lazy-video]').forEach(v => {
      let loaded = false;
      const load = () => {
        if (loaded) return;
        loaded = true;
        $$('source[data-src]', v).forEach(s => { s.src = s.dataset.src; s.removeAttribute('data-src'); });
        v.preload = 'auto';
        v.load(); v.play().catch(() => {});
      };
      if (force || !('IntersectionObserver' in window)) return load();
      const io = new IntersectionObserver((en) => { en.forEach(e => { if (e.isIntersecting) { load(); io.disconnect(); } }); }, { rootMargin: '1400px 0px' });
      io.observe(v);
      // Warm up video buffer once the page is idle so it's ready before scrolling
      if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 2500 });
      else setTimeout(load, 1200);
    });
  }

  /* ---------- Nav ---------- */
  const nav = $('#nav'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-scrolled', y > 40);
    nav.classList.toggle('is-hidden', y > lastY && y > 500 && !$('#mmenu').classList.contains('is-open'));
    lastY = y;
  }, { passive: true });
  const burger = $('.nav__burger'), mm = $('#mmenu');
  burger.addEventListener('click', () => {
    const open = mm.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', mm).forEach(a => a.addEventListener('click', () => { mm.classList.remove('is-open'); burger.setAttribute('aria-expanded', false); document.body.style.overflow = ''; }));

  /* ---------- Testimonials slider ---------- */
  const tTrack = $('#tTrack'); let tIdx = 0;
  const tMove = (d) => {
    const cards = $$('.tcard', tTrack);
    const vis = Math.max(1, Math.floor(tTrack.parentElement.clientWidth / (cards[0].offsetWidth + 20)));
    tIdx = Math.min(Math.max(tIdx + d, 0), cards.length - vis);
    tTrack.style.transform = `translateX(${-tIdx * (cards[0].offsetWidth + 20)}px)`;
  };
  $('#tNext').addEventListener('click', () => tMove(1));
  $('#tPrev').addEventListener('click', () => tMove(-1));
  let tsx = 0; tTrack.addEventListener('touchstart', e => (tsx = e.touches[0].clientX), { passive: true });
  tTrack.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tsx; if (Math.abs(dx) > 40) tMove(dx < 0 ? 1 : -1); });

  /* ---------- Quote form ---------- */
  const form = $('#qform'), msg = $('.qform__msg', form);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(inp => {
      const bad = !inp.checkValidity();
      inp.closest('.field').classList.toggle('is-error', bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.className = 'qform__msg err'; msg.textContent = 'Please fill name, a valid email and phone.'; return; }
    const btn = $('button[type=submit]', form);
    btn.disabled = true; btn.firstChild.textContent = 'Sending… ';
    setTimeout(() => {
      form.reset(); btn.disabled = false; btn.firstChild.textContent = 'Send request ';
      msg.className = 'qform__msg ok'; msg.textContent = '✓ Thanks! Our packaging engineer will reply within 4 working hours.';
    }, 900);
  });

  /* ---------- Custom cursor ---------- */
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine) {
    const cur = $('.cursor');
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() {
      cx += (mx - cx) * .22; cy += (my - cy) * .22;
      cur.style.transform = `translate(${cx}px,${cy}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
    $$('.pcard,.intro__imgs figure').forEach(el => {
      el.addEventListener('mouseenter', () => cur.classList.add('is-big'));
      el.addEventListener('mouseleave', () => cur.classList.remove('is-big'));
    });
    // magnetic buttons
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
      b.addEventListener('mouseleave', () => (b.style.transform = ''));
    });
  }

  /* ---------- Split intro text into words ---------- */
  $$('.reveal-words').forEach(p => { p.innerHTML = p.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' '); });

  if (!hasGSAP || reduce) { revealAllStatic(); if (reduce) $$('.intro__text .w').forEach(w => (w.style.opacity = 1)); initStepsIO(); return; }

  /* =================== GSAP =================== */
  gsap.registerPlugin(ScrollTrigger);

  // Lenis smooth scroll
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.14, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const t = $(id); if (!t) return; e.preventDefault(); lenis.scrollTo(t, { offset: -20, duration: 1.0 });
    }));
  }

  /* ---------- Preloader ---------- */
  const countEl = $('#loadCount');
  const counter = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.to('.loader__word span', { y: 0, duration: 0.55, stagger: 0.03 })
    .to(counter, { v: 100, duration: 0.75, ease: 'power2.inOut', onUpdate: () => (countEl.textContent = Math.round(counter.v)) }, 0)
    .to('.loader__inner', { opacity: 0, y: -20, duration: .3, ease: 'power2.in' }, '+=0.05')
    .to('.loader__panel--a', { yPercent: -100, duration: 0.65, ease: 'expo.inOut' }, '-=0.05')
    .to('.loader__panel--b', { yPercent: 100, duration: 0.65, ease: 'expo.inOut' }, '<')
    .add(() => { $('.loader').style.pointerEvents = 'none'; document.body.classList.remove('is-loading'); }, '-=0.45')
    .to('.hero__title .word', { y: 0, duration: 0.8, stagger: 0.06 }, '-=0.5')
    .to('.hero__video-card', { clipPath: 'inset(0% 0 0 0 round 48px)', duration: 0.85, ease: 'expo.inOut' }, '<')
    .to('.hero__video-card video', { scale: 1, duration: 1.0 }, '<')
    .from('.hero__lead,.hero__actions,.hero__trust', { y: 24, opacity: 0, duration: 0.65, stagger: 0.07 }, '-=0.7')
    .add(() => $('.loader')?.remove());

  // hero parallax out
  gsap.to('.hero__media', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  lazyVideos(false);

  /* ---------- Expand video ---------- */
  const mmq = gsap.matchMedia();
  const frame = $('.expand__frame');
  gsap.timeline({
    scrollTrigger: {
      trigger: '#expand',
      start: 'top top',
      end: '+=80%',
      pin: true,
      scrub: 0.2,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  })
    .fromTo(frame,
      { clipPath: () => innerWidth <= 1024 ? 'inset(20% 8% 20% 8% round 28px)' : 'inset(18% 22% 18% 22% round 36px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 }
    )
    .to('.expand__overlay', { opacity: 1, ease: 'none', duration: 0.35 }, 0.65)
    .from('.expand__overlay h2', { y: 36, ease: 'none', duration: 0.35 }, 0.65);

  /* ---------- Intro word highlight ---------- */
  gsap.to('.intro__text .w', { opacity: 1, stagger: 0.1, ease: 'none', scrollTrigger: { trigger: '.intro__text', start: 'top 85%', end: 'bottom 50%', scrub: true } });
  $$('.clip-reveal').forEach(f => {
    gsap.timeline({ scrollTrigger: { trigger: f, start: 'top 92%' } })
      .to(f, { clipPath: 'inset(0 0 0% 0 round 36px)', duration: 0.8, ease: 'expo.out' })
      .to($('img', f), { scale: 1, duration: 1.0, ease: 'expo.out' }, '<');
  });
  gsap.to('.intro__imgs figure:last-child', { yPercent: -15, ease: 'none', scrollTrigger: { trigger: '.intro__imgs', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* ---------- Products horizontal pin (desktop) ---------- */
  mmq.add('(min-width: 721px)', () => {
    const track = $('#prodTrack');
    const dist = () => track.scrollWidth - innerWidth;
    const st = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.products__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.25, invalidateOnRefresh: true,
        onUpdate: s => ($('#prodBar').style.width = (s.progress * 100) + '%') }
    });
    return () => st.scrollTrigger && st.scrollTrigger.kill();
  });
  mmq.add('(max-width: 720px)', () => {
    const t = $('#prodTrack');
    t.addEventListener('scroll', () => { $('#prodBar').style.width = (t.scrollLeft / (t.scrollWidth - t.clientWidth) * 100) + '%'; }, { passive: true });
  });
  // products pin on mobile scroll container: make pin element horizontally scrollable
  gsap.from('.pcard', { y: 50, opacity: 0, duration: 0.7, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: '.products', start: 'top 90%' } });

  /* ---------- Stats counters ---------- */
  $$('[data-count]').forEach(el => {
    const o = { v: 0 };
    gsap.to(o, { v: +el.dataset.count, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => (el.textContent = Math.round(o.v)) });
  });
  gsap.from('.stat', { y: 36, opacity: 0, duration: 0.65, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 92%' } });

  /* ---------- Section heading reveals ---------- */
  $$('.h2').forEach(h => gsap.from(h, { y: 36, opacity: 0, duration: 0.7, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 92%' } }));
  gsap.from('.ind-list li', { y: 28, opacity: 0, duration: 0.6, stagger: .05, ease: 'expo.out', scrollTrigger: { trigger: '.ind-list', start: 'top 92%' } });

  /* ---------- Process steps + sticky image ---------- */
  const pImgs = $$('.process__imgs img'), pNum = $('#stepNum'), pSteps = $$('.step');
  const setStep = (i) => {
    pSteps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    pImgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
    if (pNum) pNum.textContent = String(i + 1).padStart(2, '0');
  };
  setStep(0);
  pSteps.forEach((step, i) => {
    ScrollTrigger.create({
      trigger: step,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => setStep(i),
      onEnterBack: () => setStep(i)
    });
  });
  mmq.add('(min-width: 1025px)', () => {
    const st = ScrollTrigger.create({
      trigger: '.process__grid',
      start: 'top 100px',
      end: () => '+=' + Math.max(0, $('.process__steps').offsetHeight - $('.process__sticky').offsetHeight),
      pin: '.process__sticky',
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true
    });
    return () => st.kill();
  });

  /* ---------- Sustain parallax ---------- */
  gsap.fromTo('.sustain__bg', { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.sustain', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.sustain__card', { x: -50, opacity: 0, duration: 0.8, ease: 'expo.out', scrollTrigger: { trigger: '.sustain', start: 'top 85%' } });

  gsap.from('.tcard', { y: 40, opacity: 0, rotate: 1.5, duration: 0.7, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.testi', start: 'top 90%' } });
  gsap.from('.qform', { y: 50, opacity: 0, duration: 0.75, ease: 'expo.out', scrollTrigger: { trigger: '.quote', start: 'top 88%' } });
  gsap.from('.footer__word', { yPercent: 50, opacity: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 92%' } });

  addEventListener('load', () => ScrollTrigger.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());

  /* ---------- helper: process step activation ---------- */
  function initStepsIO() {
    const imgs = $$('.process__imgs img'), num = $('#stepNum');
    const steps = $$('.step');
    const io = new IntersectionObserver(en => {
      en.forEach(e => {
        if (!e.isIntersecting) return;
        const i = +e.target.dataset.step;
        steps.forEach(s => s.classList.toggle('is-active', s === e.target));
        imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
        num.textContent = String(i + 1).padStart(2, '0');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    steps[0].classList.add('is-active');
  }
})();
