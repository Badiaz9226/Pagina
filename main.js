// Lumetrix — interacciones del sitio.
(() => {
  'use strict';

  const CONFIG = {
    // Correo que recibe las solicitudes del formulario de contacto.
    email: 'administracion@agencialumetrix.com',
  };

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  let lang = 'es';
  const t = (es, en) => (lang === 'en' ? en : es);
  const fmt = (n, d = 0) => new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-CO', { maximumFractionDigits: d }).format(n);
  const money = (n) => '$' + fmt(Math.round(n));
  const onLang = [];

  /* ---------- Idioma ---------- */
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    $$('[data-en]').forEach((el) => {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.es;
    });
    $$('[data-en-aria]').forEach((el) => {
      if (el.dataset.esAria === undefined) el.dataset.esAria = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enAria : el.dataset.esAria);
    });
    $$('[data-en-placeholder]').forEach((el) => {
      if (el.dataset.esPlaceholder === undefined) el.dataset.esPlaceholder = el.placeholder;
      el.placeholder = lang === 'en' ? el.dataset.enPlaceholder : el.dataset.esPlaceholder;
    });
    $$('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    document.title = t('Lumetrix — Claridad para decidir. Apoyo que se siente.', 'Lumetrix — Clarity to decide. Support you can feel.');
    try { localStorage.setItem('lumetrix-lang', lang); } catch (e) { /* sin almacenamiento */ }
    const url = new URL(location.href);
    if (lang === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang');
    history.replaceState(null, '', url);
    onLang.forEach((fn) => fn());
  }
  $$('.lang-switch button').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  /* ---------- Header, progreso, menú ---------- */
  const header = $('.site-header');
  const toTop = $('.to-top');
  const progress = $('.scroll-progress');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 20);
    toTop.classList.toggle('show', y > 900);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? y / max : 0);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = $('#main-nav');
  const toggle = $('.menu-toggle');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  const navLinks = $$('.main-nav a[href^="#"]:not(.button)');
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) sectionObs.observe(s); });

  /* ---------- Revelado al hacer scroll ---------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach((el) => revealObs.observe(el));

  /* ---------- Cursor y botones magnéticos ---------- */
  if (finePointer && !reduceMotion) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', (e) => {
      glow.style.setProperty('--mx', e.clientX + 'px');
      glow.style.setProperty('--my', e.clientY + 'px');
    }, { passive: true });
    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Fondo de estrellas del hero ---------- */
  function stars() {
    const c = $('#stars');
    const ctx = c.getContext('2d');
    let w, h, pts = [], running = true, mx = 0, my = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: Math.round(w * h / 14000) }, () => ({
        x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.3 + .3,
        p: Math.random() * Math.PI * 2, z: Math.random() * .8 + .2,
      }));
    };
    resize();
    addEventListener('resize', resize);
    addEventListener('pointermove', (e) => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) requestAnimationFrame(draw); }).observe(c);
    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      pts.forEach((p) => {
        const a = .25 + .45 * (Math.sin(time / 900 + p.p) * .5 + .5);
        ctx.fillStyle = `rgba(160,220,255,${a * p.z})`;
        ctx.beginPath();
        ctx.arc(p.x - mx * 30 * p.z, p.y - my * 30 * p.z, p.r, 0, 7);
        ctx.fill();
      });
      if (running && !reduceMotion) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
  stars();

  /* ---------- Observatorio: señales que fluyen por el embudo ---------- */
  function observatory() {
    const stage = $('.obs-stage');
    const c = $('#obs-canvas');
    const ctx = c.getContext('2d');
    const rings = $$('.funnel-rings ellipse');
    const chans = $$('.obs-channels li');
    const stIn = $('#st-in'), stLeak = $('#st-leak'), stOut = $('#st-out');
    const CY = [70, 135, 200, 265, 330];
    const STAGES = [135, 200, 262, 320];
    const LEAK = [0.33, 0.35, 0.4, 0.3];
    const CX = 290;
    let s = 1, parts = [], pulses = [], focus = -1, running = false, last = 0, spawnAcc = 0;
    let nIn = 0, nLeak = 0, nOut = 0;
    const rx = (y) => 95 - (Math.min(Math.max(y, 70), 320) - 70) * (77 / 250);

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = stage.clientWidth;
      s = w / 560;
      c.width = w * dpr; c.height = w * (460 / 560) * dpr;
      ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    };
    resize();
    addEventListener('resize', resize);

    chans.forEach((li) => {
      li.addEventListener('pointerenter', () => { focus = +li.dataset.ch; chans.forEach((x) => x.classList.toggle('on', x === li)); });
      li.addEventListener('pointerleave', () => { focus = -1; chans.forEach((x) => x.classList.remove('on')); });
    });

    const spawn = () => {
      const ch = Math.floor(Math.random() * 5);
      const off = (Math.random() * 2 - 1) * 0.85;
      parts.push({ ch, off, ph: 'in', t: 0, sp: 0.008 + Math.random() * 0.006, x: 132, y: CY[ch], stage: 0, life: 1, vx: 0, vy: 0, trail: [] });
      nIn++;
    };
    const flash = (i) => { const r = rings[i + 1]; if (!r) return; r.classList.add('flash'); setTimeout(() => r.classList.remove('flash'), 220); };

    function step(dt) {
      spawnAcc += dt;
      while (spawnAcc > 120) { spawnAcc -= 120; spawn(); }
      parts.forEach((p) => {
        p.trail.push([p.x, p.y]);
        if (p.trail.length > 6) p.trail.shift();
        if (p.ph === 'in') {
          p.t += p.sp * dt / 16;
          const t = Math.min(p.t, 1), u = 1 - t;
          const x0 = 132, y0 = CY[p.ch], cx = 215, cy = CY[p.ch], x2 = CX + p.off * 95, y2 = 70;
          p.x = u * u * x0 + 2 * u * t * cx + t * t * x2;
          p.y = u * u * y0 + 2 * u * t * cy + t * t * y2;
          if (p.t >= 1) p.ph = 'fall';
        } else if (p.ph === 'fall') {
          p.y += 0.9 * dt / 16;
          p.x = CX + p.off * rx(p.y);
          const b = STAGES[p.stage];
          if (b !== undefined && p.y >= b) {
            if (Math.random() < LEAK[p.stage]) {
              p.ph = 'leak'; p.vx = (p.off >= 0 ? 1 : -1) * (1.2 + Math.random()); p.vy = 0.2 + Math.random() * 0.4;
              nLeak++; flash(p.stage);
            } else p.stage++;
          }
          if (p.y >= 320 && p.ph === 'fall') p.ph = 'out';
        } else if (p.ph === 'out') {
          p.x += (CX - p.x) * 0.2;
          p.y += 1.6 * dt / 16;
          if (p.y >= 410) { p.dead = true; nOut++; pulses.push({ r: 10, a: 0.9 }); }
        } else if (p.ph === 'leak') {
          p.x += p.vx * dt / 16; p.y += p.vy * dt / 16; p.vy += 0.02;
          p.life -= 0.012 * dt / 16;
          if (p.life <= 0) p.dead = true;
        }
      });
      parts = parts.filter((p) => !p.dead);
      pulses.forEach((q) => { q.r += 0.9 * dt / 16; q.a -= 0.02 * dt / 16; });
      pulses = pulses.filter((q) => q.a > 0);
    }

    function draw() {
      ctx.clearRect(0, 0, 560, 460);
      // Guías de los canales al embudo
      CY.forEach((y, i) => {
        ctx.strokeStyle = focus === i ? 'rgba(0,177,215,.65)' : 'rgba(0,177,215,.16)';
        ctx.lineWidth = focus === i ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(132, y); ctx.quadraticCurveTo(215, y, CX - 60 + i * 30, 70); ctx.stroke();
        ctx.fillStyle = '#00b1d7'; ctx.beginPath(); ctx.arc(132, y, 3, 0, 7); ctx.fill();
      });
      parts.forEach((p) => {
        const dim = focus !== -1 && p.ch !== focus;
        const leak = p.ph === 'leak';
        const col = leak ? '255,92,138' : p.ph === 'out' ? '33,191,115' : '0,177,215';
        const alpha = (leak ? p.life : 1) * (dim ? 0.18 : 1);
        p.trail.forEach(([x, y], i) => {
          ctx.fillStyle = `rgba(${col},${alpha * (i / p.trail.length) * 0.35})`;
          ctx.beginPath(); ctx.arc(x, y, 1.6, 0, 7); ctx.fill();
        });
        const r = !dim && focus !== -1 ? 3.4 : 2.4;
        ctx.fillStyle = `rgba(${col},${alpha * 0.25})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, 7); ctx.fill();
        ctx.fillStyle = `rgba(${leak ? col : '230,250,255'},${alpha})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 7); ctx.fill();
      });
      pulses.forEach((q) => {
        ctx.strokeStyle = `rgba(33,191,115,${q.a})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(CX, 410, q.r, 0, 7); ctx.stroke();
      });
    }

    let statTick = 0;
    function loop(now) {
      if (!running) return;
      const dt = Math.min(now - (last || now), 50);
      last = now;
      step(dt); draw();
      if ((statTick += dt) > 150) {
        statTick = 0;
        stIn.textContent = fmt(nIn); stLeak.textContent = fmt(nLeak); stOut.textContent = fmt(nOut);
      }
      requestAnimationFrame(loop);
    }
    if (reduceMotion) {
      for (let i = 0; i < 400; i++) step(30);
      draw();
      stIn.textContent = fmt(nIn); stLeak.textContent = fmt(nLeak); stOut.textContent = fmt(nOut);
      return;
    }
    new IntersectionObserver(([en]) => {
      const was = running;
      running = en.isIntersecting && !document.hidden;
      if (running && !was) { last = 0; requestAnimationFrame(loop); }
    }).observe(stage);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) running = false;
      else if (!running) { running = true; last = 0; requestAnimationFrame(loop); }
    });
    onLang.push(() => { stIn.textContent = fmt(nIn); stLeak.textContent = fmt(nLeak); stOut.textContent = fmt(nOut); });
  }
  observatory();

  /* ---------- Pilares ---------- */
  const PILLARS = [
    { es: ['Social media', 'Contenido con propósito: cada pieza tiene un rol dentro del embudo, no solo un espacio en el calendario.', ['Pilares editoriales conectados a la oferta', 'Comunidad que se convierte en demanda', 'Aprendizaje orgánico que alimenta la pauta']],
      en: ['Social media', 'Content with purpose: every piece has a role in the funnel, not just a slot in the calendar.', ['Editorial pillars connected to the offer', 'Community that turns into demand', 'Organic learning that feeds paid media']] },
    { es: ['Paid media', 'Inversión con dirección: estructura, audiencias y creatividades pensadas para aprender antes de escalar.', ['Meta, Google, LinkedIn y más, según encaje', 'Límites de prueba y criterios de pausa', 'Optimización por señales reales, no por intuición']],
      en: ['Paid media', 'Investment with direction: structure, audiences and creatives designed to learn before scaling.', ['Meta, Google, LinkedIn and more, when they fit', 'Test limits and pause criteria', 'Optimization based on real signals, not gut feeling']] },
    { es: ['Funnel strategy', 'Sistemas que convierten: conectamos atención, intención, lead, respuesta comercial y venta en un solo recorrido.', ['Mapa del embudo con fugas e hipótesis', 'Tracking confiable y señales claras', 'Decisiones trazables: mantener, ajustar, pausar o escalar']],
      en: ['Funnel strategy', 'Systems that convert: we connect attention, intent, lead, sales response and purchase in one journey.', ['Funnel map with leaks and hypotheses', 'Reliable tracking and clear signals', 'Traceable decisions: keep, adjust, pause or scale']] },
  ];
  let pillar = 0;
  function renderPillar(animate = true) {
    const [title, text, list] = PILLARS[pillar][lang];
    const panel = $('.pillar-panel');
    $('#pillar-title').textContent = title;
    $('#pillar-text').textContent = text;
    $('#pillar-list').innerHTML = list.map((x) => `<li>${x}</li>`).join('');
    if (animate) { panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap'); }
    $$('.pillar-tabs button').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.pillar === pillar)));
    $$('.mline').forEach((l) => { l.classList.toggle('on', +l.dataset.line === pillar); l.classList.toggle('g', pillar === 2); });
  }
  $$('.pillar-tabs button').forEach((b) => b.addEventListener('click', () => { pillar = +b.dataset.pillar; clearInterval(pillarTimer); renderPillar(); }));
  let pillarTimer = setInterval(() => { if (!reduceMotion) { pillar = (pillar + 1) % 3; renderPillar(); } }, 5500);
  onLang.push(() => renderPillar(false));

  /* ---------- Calculadora de embudo ---------- */
  const REF = [3, 30, 25];
  const DIAG = [
    { es: ['La fuga está entre la visita y el lead', 'Mucha gente llega, pero pocos dejan sus datos. Antes de comprar más tráfico, revisa si el mensaje y la oferta cumplen lo que prometió el anuncio.', ['Coherencia entre anuncio y landing', 'Claridad de la oferta y del llamado a la acción', 'Fricción del formulario y velocidad de carga']],
      en: ['The leak is between visit and lead', 'Plenty of people arrive, but few leave their details. Before buying more traffic, check whether the message and offer deliver what the ad promised.', ['Ad ↔ landing page consistency', 'Clarity of the offer and call to action', 'Form friction and page speed']] },
    { es: ['La fuga está en la calidad del lead', 'Llegan contactos, pero pocos se convierten en oportunidades reales. Suele ser un problema de segmentación, calificación o seguimiento, no de volumen.', ['Preguntas de calificación en el formulario', 'Velocidad de respuesta comercial', 'Segmentación y audiencias de la pauta']],
      en: ['The leak is lead quality', 'Contacts come in, but few become real opportunities. It is usually a targeting, qualification or follow-up issue — not a volume issue.', ['Qualifying questions on the form', 'Sales response speed', 'Ad targeting and audiences']] },
    { es: ['La fuga está en el cierre', 'Hay oportunidades, pero no se convierten en ventas. Puede ser la oferta, el precio, el proceso comercial o el seguimiento.', ['Proceso y guion comercial', 'Nutrición y seguimiento (email, retargeting)', 'Prueba social y respuesta a objeciones']],
      en: ['The leak is at closing', 'There are opportunities, but they don\'t turn into sales. It may be the offer, pricing, the sales process or follow-up.', ['Sales process and script', 'Nurturing and follow-up (email, retargeting)', 'Social proof and objection handling']] },
  ];
  const HEALTHY = {
    es: ['Tu embudo está sobre la referencia', 'Ninguna etapa está por debajo de los rangos genéricos. El siguiente paso es validar estos datos con tracking confiable y escalar con criterio, no con ansiedad.', ['Validar que el tracking mide lo que crees', 'Definir criterios de escala y límites de prueba', 'Probar nuevas audiencias sin romper lo que funciona']],
    en: ['Your funnel is above the reference', 'No stage is below the generic ranges. The next step is to validate this data with reliable tracking and scale with judgment, not anxiety.', ['Validate tracking measures what you think', 'Define scaling criteria and test limits', 'Test new audiences without breaking what works']],
  };
  const calc = {
    visits: $('#c-visits'), r1: $('#c-r1'), r2: $('#c-r2'), r3: $('#c-r3'), ticket: $('#c-ticket'),
  };
  let lastWorst = -2;
  function runCalc() {
    const V = +calc.visits.value, r = [+calc.r1.value, +calc.r2.value, +calc.r3.value], tk = Math.max(0, +calc.ticket.value || 0);
    [calc.visits, calc.r1, calc.r2, calc.r3].forEach((inp) => {
      inp.style.setProperty('--fill', ((inp.value - inp.min) / (inp.max - inp.min)) * 100 + '%');
    });
    $('#o-visits').textContent = fmt(V);
    $('#o-r1').textContent = fmt(r[0], 1) + '%';
    $('#o-r2').textContent = fmt(r[1]) + '%';
    $('#o-r3').textContent = fmt(r[2]) + '%';
    const counts = [V];
    r.forEach((x, i) => counts.push(counts[i] * x / 100));
    const ratios = r.map((x, i) => x / REF[i]);
    const minR = Math.min(...ratios);
    const worst = minR < 1 ? ratios.indexOf(minR) : -1;
    $$('.cf-row').forEach((row, i) => {
      const c = counts[i];
      row.querySelector('.cf-val').textContent = fmt(c, c < 10 ? 1 : 0);
      row.querySelector('.cf-bar').style.setProperty('--w', Math.max(24, 100 * Math.log10(c + 1) / Math.log10(V + 1)) + '%');
      const leak = row.querySelector('.cf-leak');
      if (leak) leak.textContent = '−' + fmt(counts[i - 1] - c) + ' ' + t('se pierden', 'lost');
      row.classList.toggle('worst', worst === i - 1);
    });
    const sales = counts[3];
    $('#calc-rev').textContent = money(sales * tk);
    let title, text, checks;
    if (worst === -1) {
      [title, text, checks] = HEALTHY[lang];
      $('#calc-up').textContent = '—';
    } else {
      [title, text, checks] = DIAG[worst][lang];
      const r2 = r.slice(); r2[worst] = REF[worst];
      const better = V * r2[0] / 100 * r2[1] / 100 * r2[2] / 100;
      $('#calc-up').textContent = '+' + money((better - sales) * tk);
    }
    $('#calc-title').textContent = title;
    $('#calc-text').textContent = text;
    $('#calc-checks').innerHTML = checks.map((x) => `<li>${x}</li>`).join('');
    const res = $('.calc-result');
    res.style.borderColor = worst === -1 ? 'rgba(33,191,115,.45)' : '';
    res.style.background = worst === -1 ? 'rgba(33,191,115,.06)' : '';
    $('.result-tag').style.color = worst === -1 ? 'var(--green)' : '';
    if (worst !== lastWorst) { res.classList.remove('swap'); void res.offsetWidth; res.classList.add('swap'); lastWorst = worst; }
  }
  Object.values(calc).forEach((inp) => inp.addEventListener('input', runCalc));
  onLang.push(() => { lastWorst = -2; runCalc(); });

  /* ---------- Social: caminos y teléfono ---------- */
  const PATHS = [
    [['i-user', 'Estrategia y perfiles', 'Strategy & profiles', 'Definimos objetivos, audiencia, tono y configuramos perfiles listos para crecer.', 'We define goals, audience and tone, and set up profiles ready to grow.'],
      ['i-cards', 'Identidad y contenido', 'Identity & content', 'Pilares, línea gráfica, calendario y primeras piezas con propósito.', 'Pillars, visual line, calendar and first pieces with purpose.'],
      ['i-megaphone', 'Lanzamiento', 'Launch', 'Publicación, primeras pautas de alcance y lectura de las señales iniciales.', 'Publishing, first reach campaigns and reading early signals.']],
    [['i-search', 'Auditoría', 'Audit', 'Revisamos contenido, comunidad, métricas y coherencia con tu oferta.', 'We review content, community, metrics and fit with your offer.'],
      ['i-gear', 'Optimización', 'Optimization', 'Ajustamos pilares, formatos, ritmo y creatividades según lo que dicen los datos.', 'We adjust pillars, formats, cadence and creatives based on what data says.'],
      ['i-target', 'Crecimiento continuo', 'Continuous growth', 'Comunidad, contenido y pauta trabajando juntos con aprendizaje en cada ciclo.', 'Community, content and ads working together, learning every cycle.']],
  ];
  let path = 0;
  function renderPath() {
    $('.segmented').dataset.active = path;
    $$('.segmented button').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.path === path)));
    $('#path-steps').innerHTML = PATHS[path].map(([ic, es, en, des, den], i) =>
      `<li style="--i:${i}"><span class="icon-ring"><svg><use href="#${ic}"/></svg></span><div><strong>${t(es, en)}</strong><p>${t(des, den)}</p></div></li>`).join('');
  }
  $$('.segmented button').forEach((b) => b.addEventListener('click', () => { path = +b.dataset.path; renderPath(); }));
  onLang.push(renderPath);

  let likes = 312, followers = 1248, liked = false;
  const likeEl = $('#ph-likes');
  const renderFollowers = () => { $('#ph-followers').innerHTML = `${fmt(followers)} <span>${t('seguidores', 'followers')}</span>`; };
  $('.ph-post').addEventListener('click', () => {
    const heart = $('.ph-heart');
    heart.classList.remove('pop'); void heart.offsetWidth; heart.classList.add('pop');
    if (!liked) { liked = true; likes++; $('.ph-like').classList.add('liked'); likeEl.textContent = fmt(likes); }
  });
  if (!reduceMotion) setInterval(() => {
    likes += Math.random() < .6 ? 1 : 0; followers += Math.random() < .5 ? 1 : 0;
    likeEl.textContent = fmt(likes); renderFollowers();
  }, 1800);
  onLang.push(renderFollowers);

  /* ---------- Recorrido del cliente ---------- */
  const JOURNEY = [
    ['¿A quién le hablamos y qué necesita? Segmentos, dolores y mercado.', 'Who are we talking to and what do they need? Segments, pains and market.',
      'Hablarle a todos: mensajes genéricos que no conectan con nadie.', 'Talking to everyone: generic messages that connect with no one.',
      'Calidad de la audiencia que interactúa, no solo su tamaño.', 'Quality of the audience that engages, not just its size.'],
    ['Cómo te encuentran: búsqueda, redes, pauta, referidos y contenido.', 'How they find you: search, social, ads, referrals and content.',
      'Alcance alto con baja intención: muchas vistas, poco interés real.', 'High reach, low intent: lots of views, little real interest.',
      'Visitas de calidad y costo por visita con intención.', 'Quality visits and cost per intentful visit.'],
    ['Qué ven al evaluarte: landing, prueba social, oferta y claridad.', 'What they see when evaluating you: landing page, social proof, offer and clarity.',
      'La promesa del anuncio no coincide con lo que encuentran.', 'The ad\'s promise doesn\'t match what they find.',
      'Tasa de visita a lead y tiempo en la página.', 'Visit-to-lead rate and time on page.'],
    ['El paso a la acción: formulario, compra, agenda o mensaje.', 'The step into action: form, purchase, booking or message.',
      'Leads que nadie atiende a tiempo o que no estaban calificados.', 'Leads nobody answers in time, or that were never qualified.',
      'Calidad del lead y velocidad de respuesta comercial.', 'Lead quality and sales response speed.'],
    ['Lo que pasa después de la venta: experiencia, recompra y referidos.', 'What happens after the sale: experience, repeat purchase and referrals.',
      'Clientes que compran una vez y nunca vuelven a saber de ti.', 'Customers who buy once and never hear from you again.',
      'Recompra, referidos y valor del cliente en el tiempo.', 'Repeat purchase, referrals and customer lifetime value.'],
  ];
  let jStep = 0, jTimer;
  function renderJourney() {
    const d = JOURNEY[jStep];
    $$('.j-node').forEach((n) => n.classList.toggle('active', +n.dataset.j === jStep));
    $('#jd-look').textContent = t(d[0], d[1]);
    $('#jd-leak').textContent = t(d[2], d[3]);
    $('#jd-signal').textContent = t(d[4], d[5]);
    const box = $('.journey-detail');
    box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
  }
  $$('.j-node').forEach((n) => n.addEventListener('click', () => { clearInterval(jTimer); jStep = +n.dataset.j; renderJourney(); }));
  if (!reduceMotion) jTimer = setInterval(() => { jStep = (jStep + 1) % 5; renderJourney(); }, 4200);
  onLang.push(renderJourney);

  /* ---------- Método LUMEN ---------- */
  const LUMEN = [
    ['L', 'Leer', 'Learn', 'Entender el negocio antes de tocar una campaña', 'Understand the business before touching a campaign',
      'Negocio, oferta, objetivos, audiencia, mercado, activos, operación comercial y contexto internacional.', 'Business, offer, goals, audience, market, assets, sales operation and international context.',
      'brief construido contigo.', 'a brief built with you.'],
    ['U', 'Ubicar', 'Uncover', 'Encontrar dónde se pierde la oportunidad', 'Find where opportunity is lost',
      'Mapeamos el embudo e identificamos fugas, riesgos y dependencias entre canales, equipo y oferta.', 'We map the funnel and identify leaks, risks and dependencies between channels, team and offer.',
      'mapa de oportunidades priorizado.', 'a prioritized opportunity map.'],
    ['M', 'Medir', 'Measure', 'Asegurar que los datos dicen la verdad', 'Make sure the data tells the truth',
      'Validamos tracking, línea base, calidad de datos, señales tempranas y criterios de decisión.', 'We validate tracking, baseline, data quality, early signals and decision criteria.',
      'scorecard inicial.', 'an initial scorecard.'],
    ['E', 'Ejecutar', 'Execute', 'Activar el plan con foco y disciplina', 'Activate the plan with focus and discipline',
      'Ponemos en marcha el plan a la medida en social, paid media, contenido, creatividades y medición.', 'We launch the tailored plan across social, paid media, content, creatives and measurement.',
      'backlog de pruebas con responsables.', 'a test backlog with owners.'],
    ['N', 'Navegar', 'Navigate', 'Decidir qué mantener, ajustar, pausar o escalar', 'Decide what to keep, adjust, pause or scale',
      'Revisamos resultados, calidad de leads y cambios del negocio. El ciclo vuelve a empezar con mejor información.', 'We review results, lead quality and business changes. The cycle starts again with better information.',
      'Clarity Review y siguiente ciclo.', 'Clarity Review and the next cycle.'],
  ];
  let lStep = 0, lPlaying = !reduceMotion, lTimer;
  function renderLumen() {
    const d = LUMEN[lStep];
    $$('.lumen-track button').forEach((b) => {
      const i = +b.dataset.step;
      b.setAttribute('aria-selected', String(i === lStep));
      b.classList.toggle('done', i < lStep);
    });
    $('.lumen-progress').style.setProperty('--lp', (lStep / 4) * 100 + '%');
    $('#lumen-letter').textContent = d[0];
    $('#lumen-kicker').textContent = `${lStep + 1}. ${t(d[1], d[2])} · ${t(d[2], d[1])}`;
    $('#lumen-title').textContent = t(d[3], d[4]);
    $('#lumen-text').textContent = t(d[5], d[6]);
    $('#lumen-out').textContent = t(d[7], d[8]);
    const p = $('.lumen-panel');
    p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap');
  }
  const lumenGo = (i) => { lStep = (i + 5) % 5; renderLumen(); };
  const setPlay = (on) => {
    lPlaying = on;
    clearInterval(lTimer);
    if (on) lTimer = setInterval(() => lumenGo(lStep + 1), 4500);
    const b = $('#lumen-play');
    b.textContent = on ? '❚❚' : '▶';
    b.setAttribute('aria-label', on ? t('Pausar', 'Pause') : t('Reproducir', 'Play'));
  };
  $$('.lumen-track button').forEach((b) => b.addEventListener('click', () => { setPlay(false); lumenGo(+b.dataset.step); }));
  $('#lumen-prev').addEventListener('click', () => { setPlay(false); lumenGo(lStep - 1); });
  $('#lumen-next').addEventListener('click', () => { setPlay(false); lumenGo(lStep + 1); });
  $('#lumen-play').addEventListener('click', () => setPlay(!lPlaying));
  onLang.push(() => { renderLumen(); setPlay(lPlaying); });

  /* ---------- Servicios ---------- */
  $$('.chip[data-filter]').forEach((chip) => chip.addEventListener('click', () => {
    $$('.chip[data-filter]').forEach((c) => c.classList.toggle('is-active', c === chip));
    const f = chip.dataset.filter;
    $$('.service-card').forEach((card) => card.classList.toggle('dim', f !== 'all' && card.dataset.cat !== f));
  }));
  $$('.service-card').forEach((card) => card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--x', e.clientX - r.left + 'px');
    card.style.setProperty('--y', e.clientY - r.top + 'px');
  }));

  /* ---------- Casos ---------- */
  const caseTabs = $('.case-tabs');
  let caseIdx = 0, caseTimer;
  const showCase = (i) => {
    caseIdx = i;
    $$('button', caseTabs).forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.case === i)));
    $$('.case').forEach((c) => c.classList.toggle('is-active', +c.dataset.case === i));
  };
  $$('button', caseTabs).forEach((b) => b.addEventListener('click', () => {
    clearInterval(caseTimer); caseTabs.classList.add('paused'); showCase(+b.dataset.case);
  }));
  if (reduceMotion) caseTabs.classList.add('paused');
  else new IntersectionObserver(([en], obs) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    showCase(0);
    caseTimer = setInterval(() => showCase((caseIdx + 1) % 3), 9000);
  }, { threshold: .3 }).observe(caseTabs);

  /* ---------- Quiz ---------- */
  const QUIZ = [
    ['¿Cómo describes tu situación hoy?', 'How would you describe your situation today?', [
      ['Invierto en anuncios, pero no sé qué está funcionando.', 'I invest in ads, but I don\'t know what\'s working.'],
      ['Necesito construir o corregir algo concreto: redes, campaña o tracking.', 'I need to build or fix something specific: social, a campaign or tracking.'],
      ['Ya tengo una base y quiero crecer con acompañamiento continuo.', 'I have a base and want to grow with ongoing support.']]],
    ['¿Qué te preocupa más?', 'What worries you most?', [
      ['Desperdiciar presupuesto en lo que no es.', 'Wasting budget on the wrong things.'],
      ['No tener un sistema: todo está desordenado.', 'Not having a system: everything is scattered.'],
      ['No tener equipo para ejecutar y optimizar cada semana.', 'Not having a team to execute and optimize every week.']]],
    ['¿Confías en tus datos (tracking, conversiones, CRM)?', 'Do you trust your data (tracking, conversions, CRM)?', [
      ['No mucho, no sé si miden bien.', 'Not really, I\'m not sure they measure correctly.'],
      ['A medias: hay cosas configuradas, pero incompletas.', 'Partly: some things are set up, but incomplete.'],
      ['Sí, tenemos datos confiables.', 'Yes, we have reliable data.']]],
  ];
  const MODES = [
    ['Diagnostic Sprint', 'sprint', 'Necesitas foco antes de ejecutar.', 'You need focus before executing.',
      'Empezamos con línea base, mapa del embudo y prioridades. Sales con un plan de acción claro, aunque decidas ejecutarlo con otro equipo.',
      'We start with a baseline, funnel map and priorities. You leave with a clear action plan, even if you execute it with another team.'],
    ['Build & Launch', 'build', 'Necesitas construir o corregir un sistema.', 'You need to build or fix a system.',
      'Dejamos lista la campaña, el sistema social, el tracking o los activos que faltan, con documentación para operar.',
      'We deliver the campaign, social system, tracking or missing assets, ready to operate and documented.'],
    ['Continuous Growth Partnership', 'partnership', 'Necesitas un socio que ejecute y aprenda contigo.', 'You need a partner who executes and learns with you.',
      'Operación integrada de social y paid media, Clarity Review mensual y optimización por ciclos LUMEN.',
      'Integrated social and paid media operation, monthly Clarity Review and optimization in LUMEN cycles.'],
  ];
  let qStep = 0, qScore = [0, 0, 0];
  const quizBody = $('#quiz-body');
  function renderQuiz() {
    $$('.modes li').forEach((li) => li.classList.remove('match'));
    $('.quiz-progress').style.setProperty('--qp', (qStep / 3) * 100 + '%');
    if (qStep < 3) {
      const [qes, qen, opts] = QUIZ[qStep];
      quizBody.innerHTML = `<div class="swap"><p class="q-step">${t('PREGUNTA', 'QUESTION')} ${qStep + 1} / 3</p><h3>${t(qes, qen)}</h3><div class="q-options">${opts.map((o, i) => `<button type="button" data-i="${i}"><b>${'ABC'[i]}</b><span>${t(o[0], o[1])}</span></button>`).join('')}</div></div>`;
      $$('.q-options button', quizBody).forEach((b) => b.addEventListener('click', () => { qScore[+b.dataset.i]++; qStep++; renderQuiz(); }));
    } else {
      const max = Math.max(...qScore);
      const m = qScore.indexOf(max);
      const d = MODES[m];
      $(`.modes li[data-mode="${m}"]`).classList.add('match');
      quizBody.innerHTML = `<div class="q-result swap"><span class="badge">✓ ${t('Tu punto de partida recomendado', 'Your recommended starting point')}</span><h3>${d[0]}</h3><p><strong>${t(d[2], d[3])}</strong></p><p>${t(d[4], d[5])}</p><div class="q-actions"><a class="button" href="#contacto" data-prefill="${d[1]}">${t('Quiero empezar así', 'I want to start this way')} <svg><use href="#i-arrow"/></svg></a><button type="button" class="link-btn" id="q-restart">${t('Repetir', 'Retake')}</button></div></div>`;
      $('#q-restart').addEventListener('click', () => { qStep = 0; qScore = [0, 0, 0]; renderQuiz(); });
    }
  }
  onLang.push(renderQuiz);

  /* ---------- Reporte vs decisión ---------- */
  const reportToggle = $('#report-toggle');
  reportToggle.addEventListener('change', () => $('#report').classList.toggle('is-decision', reportToggle.checked));
  // Muestra primero el reporte decorativo y gira solo cuando la sección aparece.
  $('#report').classList.remove('is-decision');
  reportToggle.checked = false;
  new IntersectionObserver(([en], obs) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    setTimeout(() => { reportToggle.checked = true; $('#report').classList.add('is-decision'); }, 1600);
  }, { threshold: .5 }).observe($('#report'));

  /* ---------- Entregables (tacto) ---------- */
  $$('.deliv').forEach((d) => d.addEventListener('click', () => d.classList.toggle('flipped')));

  /* ---------- Contadores ---------- */
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countObs.unobserve(en.target);
      const el = en.target, to = +el.dataset.to, start = performance.now();
      const tick = (now) => {
        const k = Math.min((now - start) / 1200, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('.counter').forEach((c) => countObs.observe(c));

  /* ---------- Máquina de escribir bilingüe ---------- */
  (function typer() {
    const el = $('#typer');
    const phrases = ['Claridad para decidir. Apoyo que se siente.', 'Clarity to decide. Support you can feel.', 'No adivinamos. Diagnosticamos.', 'We don\'t guess. We diagnose.', 'Antes de escalar, ordena.', 'Before you scale, get organized.'];
    if (reduceMotion) { el.textContent = phrases[0]; return; }
    let i = 0, n = 0, del = false;
    (function tick() {
      const p = phrases[i];
      n += del ? -1 : 1;
      el.textContent = p.slice(0, n);
      let wait = del ? 28 : 55;
      if (!del && n === p.length) { del = true; wait = 1900; }
      else if (del && n === 0) { del = false; i = (i + 1) % phrases.length; wait = 350; }
      setTimeout(tick, wait);
    })();
  })();

  /* ---------- Contacto ---------- */
  const form = $('#contact-form');
  const status = $('#form-status');
  const mailHref = (subject = '', body = '') => `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}${body ? '&body=' + encodeURIComponent(body) : ''}`;
  const renderMail = () => {
    $('#mail-text').textContent = CONFIG.email;
    $('#mail-link').href = mailHref(t('Revisión de embudo — Lumetrix', 'Funnel review — Lumetrix'));
  };
  onLang.push(renderMail);

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-prefill]');
    if (!a) return;
    const sel = $('#f-interes');
    if ([...sel.options].some((o) => o.value === a.dataset.prefill)) sel.value = a.dataset.prefill;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach((f) => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    if (!ok) {
      status.className = 'form-status err';
      status.textContent = t('Revisa los campos marcados: nombre, correo válido y mensaje.', 'Please check the highlighted fields: name, valid email and message.');
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const interes = $('#f-interes').selectedOptions[0].textContent;
    const subject = t('Revisión de embudo', 'Funnel review') + ' — ' + (data.empresa || data.nombre);
    const body = [
      `${t('Nombre', 'Name')}: ${data.nombre}`,
      `${t('Correo', 'Email')}: ${data.email}`,
      `${t('Empresa', 'Company')}: ${data.empresa || '—'}`,
      `${t('Me interesa', 'Interested in')}: ${interes}`,
      `${t('Idioma preferido', 'Preferred language')}: ${data.idioma}`,
      '',
      data.mensaje,
    ].join('\n');
    location.href = mailHref(subject, body);
    status.className = 'form-status';
    status.textContent = t('¡Listo! Se abrió tu correo con el mensaje preparado. Solo presiona enviar y te respondemos pronto.', 'Done! Your email app opened with the message ready. Just hit send and we\'ll get back to you soon.');
  });
  $$('[required]', form).forEach((f) => f.addEventListener('input', () => f.classList.remove('invalid')));

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Inicio ---------- */
  let initial = new URLSearchParams(location.search).get('lang');
  if (!initial) { try { initial = localStorage.getItem('lumetrix-lang'); } catch (e) { /* nada */ } }
  setPlay(lPlaying);
  applyLang(initial === 'en' ? 'en' : 'es');
  runCalc();
})();
