/* ΚΟΙΝΑ ΚΟΜΜΑΤΙΑ (μία φορά): bus, εικονίδια, κοινός χρονομετρητής, στοίβα πλοήγησης, γυάλινη μπάρα. */
(function () {
  const PL = (window.PL = window.PL || {});
  const $ = (s, r) => (r || document).querySelector(s);
  PL.$ = $;

  /* ---- bus ---- */
  const subs = {};
  PL.bus = {
    on(t, f) { (subs[t] = subs[t] || []).push(f); return () => { subs[t] = subs[t].filter((x) => x !== f); }; },
    emit(t, d) { (subs[t] || []).slice().forEach((f) => f(d)); },
  };

  /* ---- εικονίδια ---- */
  const S = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  PL.icon = {
    tech16: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="18" r="2.6"/><circle cx="11.5" cy="18" r="2.6"/><path d="M6.8 16 13.5 3.5"/><path d="M9.7 16 3 3.5"/><rect x="15.5" y="3.5" width="6.5" height="3" rx="1"/><path d="M16.6 6.5v8M18.2 6.5v8M19.8 6.5v8M21.4 6.5v8"/></svg>',
    back: S('<path d="M15 5l-7 7 7 7"/>'),
    home: S('<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>'),
    plus: S('<path d="M12 5v14M5 12h14"/>'),
    tasks: S('<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>'),
    mic: S('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>'),
    users: S('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16 5.5a3 3 0 010 5.6M18 14.8c1.8.6 3 2.2 3 4.7"/>'),
    route: S('<circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8 18h6a3 3 0 000-6h-4a3 3 0 010-6h6"/>'),
    euro: S('<path d="M17 6.5A6 6 0 007 9.5v5a6 6 0 0010 3"/><path d="M4 11h8M4 14h8"/>'),
    wrench: S('<path d="M14.5 5.5a4 4 0 005 5L10 20a2.1 2.1 0 01-3-3z"/><path d="M14.5 5.5l3 3"/>'),
    box: S('<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>'),
    chart: S('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    deal: S('<path d="M3 12l4-4 3 2 3-2 4 4"/><path d="M7 16l2 2 3-2 2 2 3-2"/><path d="M3 12v3M21 12v3"/>'),
    /* καρτέλα πελάτη: Κλήση, Οδηγίες, Παραγγελία, SOS, Σεμινάριο */
    phone: S('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>'),
    pin: S('<circle cx="12" cy="11" r="3"/><path d="M17.66 16.66l-4.25 4.24a2 2 0 01-2.83 0l-4.24-4.24a8 8 0 1111.32 0z"/>'),
    cart: S('<circle cx="6" cy="19" r="2"/><circle cx="17" cy="19" r="2"/><path d="M17 17H6V3H4"/><path d="M6 5l14 1-1 7H6"/>'),
    star: S('<path d="M12 17.75l-6.17 3.24 1.18-6.87-5-4.86 6.9-1L12 2l3.09 6.26 6.9 1-5 4.86 1.18 6.87z"/>'),
    cap: S('<path d="M22 9L12 5 2 9l10 4 10-4v6"/><path d="M6 10.6V16a6 3 0 0012 0v-5.4"/>'),
    msg: S('<path d="M8 9h8M8 13h6"/><path d="M18 4a3 3 0 013 3v8a3 3 0 01-3 3h-5l-5 3v-3H6a3 3 0 01-3-3V7a3 3 0 013-3z"/>'),
    /* σελίδα «Πρόγραμμα» */
    cal: S('<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/><path d="M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01"/>'),
    folder: S('<path d="M5 4h4l3 3h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2"/>'),
  };

  /* ---- ένας κοινός χρονομετρητής (όχι πολλά setInterval) ---- */
  const jobs = new Map();
  let timer = null, n = 0;
  PL.tick = {
    add(fn, everySec) { const id = ++n; jobs.set(id, { fn, every: everySec, left: everySec }); if (!timer) timer = setInterval(run, 1000); return id; },
    remove(id) { jobs.delete(id); if (!jobs.size && timer) { clearInterval(timer); timer = null; } },
    count: () => jobs.size,
    timers: () => (timer ? 1 : 0),
  };
  function run() {
    jobs.forEach((j) => { if (--j.left <= 0) { j.left = j.every; try { j.fn(); } catch (e) { console.error(e); } } });
  }

  /* ---- σελίδες & στοίβα πλοήγησης ---- */
  const pages = {};           // id -> { title, render(el,params)->cleanup?, nova?:()=>[{label,fn}], hideBar?, split?:['ids σελίδων λεπτομέρειας'], aside?(el)->cleanup? }
  const stack = [];           // [{id, params}]
  PL.pages = pages;
  PL.register = (id, def) => { pages[id] = def; };

  /* Οριζόντια οθόνη (τάμπλετ): μια σελίδα-λίστα με `split: ['client', …]` δείχνεται αριστερά και η λεπτομέρεια που
     ανοίγει από αυτήν δεξιά. Η ίδια συνθήκη υπάρχει στο CSS (base.css, «Οριζόντια οθόνη»).
     Η στοίβα μένει ίδια με του κινητού: [.., clients, client] — αλλάζει μόνο το πώς δείχνεται. */
  /* Το ύψος αποκλείει τα μεγάλα κινητά σε οριζόντια (π.χ. iPhone Pro Max: 932×430). */
  PL.WIDE = window.matchMedia('(min-width: 900px) and (min-height: 600px) and (orientation: landscape)');
  const details = (e) => [].concat(pages[e.id].split || []);
  const masterOf = () => {
    if (!PL.WIDE.matches) return null;
    const cur = stack[stack.length - 1], below = stack[stack.length - 2];
    if (details(cur).length) return cur;
    return below && details(below).includes(cur.id) ? below : null;
  };

  /* Το στοιχείο που κυλά για μια σελίδα: η δική της στήλη σε οριζόντια οθόνη με δύο στήλες, αλλιώς όλη η σελίδα. */
  PL.scroller = (el) => (el && el.closest('main.split>.page')) || document.scrollingElement;

  PL.nav = {
    push(id, params) {
      const e = { id, params: params || {} }, m = masterOf(), top = stack[stack.length - 1];
      /* Δίπλα στη λίστα: νέα λεπτομέρεια αντικαθιστά την προηγούμενη (το «Πίσω» γυρνά στη λίστα, όχι από πελάτη σε πελάτη). */
      if (m && m !== top && details(m).includes(id)) stack[stack.length - 1] = e; else stack.push(e);
      show();
    },
    back() { if (stack.length > 1) { stack.pop(); show(); } },
    /* «Πίσω» του χρήστη (κουμπί ή σύρσιμο): ρωτάει πρώτα τον φύλακα της σελίδας, μετά γυρνά */
    up() { if (!(PL.nav.guard && PL.nav.guard('back'))) PL.nav.back(); },
    home() { stack.length = 0; stack.push({ id: 'home', params: {} }); show(); },
    current: () => stack[stack.length - 1],
    depth: () => stack.length,
    trail: () => stack.map((s) => s.id),
  };

  /* Δύο θέσεις: L (κύρια ή λίστα) και R (λεπτομέρεια, μόνο σε οριζόντια οθόνη). */
  /* Κάθε θέση κρατά και τα μισογραμμένα κείμενα της σελίδας της (drafts.js): φυλάγονται όταν η σελίδα φεύγει. */
  const slot = { L: { e: null, el: null, off: null, dr: null, obs: null }, R: { e: null, el: null, off: null, dr: null } };
  const unmount = (k) => {
    const s = slot[k];
    if (s.obs) s.obs.disconnect();
    if (s.dr) { try { s.dr.off(); } catch (e) { console.error(e); } }
    if (s.off) { try { s.off(); } catch (e) { console.error(e); } }
    if (s.el) s.el.remove();
    slot[k] = { e: null, el: null, off: null, dr: null, obs: null };
  };
  /* asideOf: η σελίδα-λίστα· όταν δεξιά δεν είναι ανοιχτό τίποτα, δείχνει το δικό της aside(el) αν έχει (π.χ. ημερολόγιο). */
  const mount = (k, e, cls, asideOf) => {
    unmount(k);
    const el = document.createElement('section');
    el.className = 'page' + (cls ? ' ' + cls : '');
    if (e) el.dataset.page = e.id;
    $('#app').appendChild(el);
    if (k === 'L' && slot.R.el) $('#app').insertBefore(el, slot.R.el);
    const aside = !e && asideOf && pages[asideOf.id].aside;
    slot[k] = { e, el, off: e ? pages[e.id].render(el, e.params) || null : aside ? aside(el, asideOf.params) || null : null, dr: e ? PL.drafts.track(el, e) : null };
    if (!e && !aside) el.innerHTML = '<p class="mu pgempty">Διάλεξε από τη λίστα.</p>';
    /* Η λίστα ξαναζωγραφίζεται όταν αλλάζουν τα δεδομένα: η επιλογή ξαναμπαίνει. */
    if (cls === 'paneL') { slot.L.obs = new MutationObserver(() => requestAnimationFrame(markSel)); slot.L.obs.observe(el, { childList: true, subtree: true }); }
  };
  /* Στη λίστα αριστερά φαίνεται επιλεγμένο ό,τι είναι ανοιχτό δεξιά: το στοιχείο που έχει το id του σε κάποιο data-…
     (data-id, data-open, data-oo, data-sem …), μαζί με την κάρτα ή τη γραμμή που το περιέχει. */
  const SEL = '.card,.ndr,.wr';
  function markSel() {
    const L = slot.L.el; if (!L || !slot.L.obs) return;
    const pr = slot.R.e && slot.R.e.params, id = pr && (pr.id || pr.key), on = new Set();
    if (id) L.querySelectorAll('*').forEach((x) => { if (Object.values(x.dataset).includes(id)) on.add(x.closest(SEL) || x); });
    L.querySelectorAll('.sel').forEach((x) => { if (!on.has(x)) x.classList.remove('sel'); });
    on.forEach((x) => x.classList.add('sel'));
  }
  /* Κλείσιμο ή παρασκήνιο της εφαρμογής: φυλάγονται τα μισογραμμένα κείμενα των ανοιχτών σελίδων. */
  const keepDrafts = () => ['L', 'R'].forEach((k) => { if (slot[k].dr) slot[k].dr.keep(); });
  addEventListener('pagehide', keepDrafts);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keepDrafts(); });
  function show() {
    const cur = stack[stack.length - 1], m = masterOf(), root = $('#app');
    root.classList.toggle('split', !!m);
    if (!m) { unmount('R'); mount('L', cur); window.scrollTo(0, 0); }
    else {
      const newL = slot.L.e !== m, d = m === cur ? null : cur;
      if (newL) mount('L', m, 'paneL');
      if (newL || !slot.R.el || slot.R.e !== d) { mount('R', d, 'paneR', m); slot.R.el.scrollTop = 0; }
      markSel();
    }
    placeDiv();
    PL.bar.update();
  }
  PL.WIDE.addEventListener('change', () => { if (stack.length) { unmount('L'); unmount('R'); show(); } });

  /* Χερούλι ανάμεσα στις δύο στήλες: σέρνεις και αλλάζει το πλάτος της λίστας (μεταβλητή CSS --paneL).
     Η συσκευή θυμάται το πλάτος (localStorage, μόνο για ευκολία)· διπλό πάτημα = αρχικό. Όρια: λίστα ≥ 300px, λεπτομέρεια ≥ 420px. */
  const PK = 'pl.paneL', root = document.documentElement;
  try { const w = +localStorage.getItem(PK); if (w) root.style.setProperty('--paneL', w + 'px'); } catch (e) { /* τίποτα */ }
  const div = document.createElement('div');
  div.id = 'pdiv'; div.setAttribute('role', 'separator'); div.setAttribute('aria-label', 'Πλάτος στηλών'); div.hidden = true;
  document.body.appendChild(div);
  function placeDiv() {
    const L = $('#app').classList.contains('split') && slot.L.el;
    div.hidden = !L; if (L) div.style.left = (L.getBoundingClientRect().right - 9) + 'px';
  }
  addEventListener('resize', placeDiv);
  let drag = null;
  div.addEventListener('pointerdown', (e) => { const L = slot.L.el; if (!L) return; drag = { x0: L.getBoundingClientRect().left }; div.setPointerCapture(e.pointerId); div.classList.add('on'); e.preventDefault(); });
  div.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const w = Math.round(Math.max(300, Math.min(innerWidth - drag.x0 - 420, e.clientX - drag.x0)));
    root.style.setProperty('--paneL', w + 'px'); placeDiv();
  });
  const end = () => { if (!drag) return; drag = null; div.classList.remove('on'); try { localStorage.setItem(PK, parseInt(root.style.getPropertyValue('--paneL'), 10) || ''); } catch (e) { /* τίποτα */ } };
  div.addEventListener('pointerup', end); div.addEventListener('pointercancel', end);
  div.addEventListener('dblclick', () => { root.style.removeProperty('--paneL'); try { localStorage.removeItem(PK); } catch (e) { /* τίποτα */ } placeDiv(); });

  /* ---- κάτω μπάρα: ίδια με της παλιάς σελίδας (nav, pm, pmb) ---- */
  let badge = 0;
  const hideReasons = new Set();
  const SV = (p, sz, sw) => `<svg viewBox="0 0 24 24" width="${sz || 22}" height="${sz || 22}" fill="none" stroke="currentColor" stroke-width="${sw || 2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  /* Μενού του «Νέο»: τίτλος της οθόνης + επιλογές, όπως στην παλιά σελίδα. */
  PL.menu = (title, items) => { items.title = title; return items; };
  PL.bar = {
    setBadge(v) { badge = v; const b = $('#nav .bdg'); if (b) { b.textContent = v > 99 ? '99+' : v; b.style.display = v ? 'block' : 'none'; } },
    hide(reason) { hideReasons.add(reason); apply(); },
    unhide(reason) { hideReasons.delete(reason); apply(); },
    update() {
      const cur = stack[stack.length - 1];
      const def = pages[cur.id];
      const nova = def.nova ? def.nova(cur.params) : null;
      const has = nova && nova.length;
      const bar = $('#nav');
      bar.innerHTML =
        `<button class="nb" data-a="back" aria-label="Πίσω">${SV('<path d="M15 5l-7 7 7 7"/>')}<span>Πίσω</span></button>` +
        `<button class="nb" id="nvh" data-a="home" aria-label="Αρχική">${SV('<path d="M3.5 11.5 12 4.5l8.5 7"/><path d="M6 10v9.5h12V10"/><path d="M10 19.5v-5h4v5"/>')}<span>Αρχική</span></button>` +
        `<button class="nb nplus" data-a="nova" aria-label="Νέο"><span class="pc">${SV('<path d="M12 5v14M5 12h14"/>', 20, 2.4)}</span><span>Νέο</span></button>` +
        `<button class="nb" data-a="tasks" aria-label="Εκκρεμότητες">${SV('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>')}<span>Εκκρεμότ.</span><i class="bdg" style="display:${badge ? 'block' : 'none'}">${badge > 99 ? '99+' : badge}</i></button>` +
        `<button class="nb nmic" data-a="dictate" aria-label="Υπαγόρευση"><span class="mc">${SV('<rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/>', 18)}</span><span>Υπαγόρ.</span></button>`;
      $('[data-a=back]', bar).disabled = stack.length < 2;
      bar.classList.toggle('noplus', !has);
      closeMenu();
      PL.bar._nova = nova;
      apply();
    },
  };
  function apply() {
    $('#nav').classList.toggle('off', hideReasons.size > 0);
    /* Υπαγόρευση όπως στην παλιά: χωρίς πληκτρολόγιο φαίνεται η μπάρα (body.dictnav)· όσο γράφεις κρύβεται και φαίνεται το «← Πίσω» */
    const cur = stack[stack.length - 1];
    document.body.classList.toggle('dictnav', !!(cur && cur.id === 'dictate' && !hideReasons.has('typing')));
    PL.bus.emit('bar');   /* άλλαξε σελίδα ή φάνηκε/κρύφτηκε η μπάρα: ενημερώνονται το κουμπί «Ανοιχτό πρόγραμμα» και η μπάρα κύλισης */
  }

  function closeMenu() {
    $('#pm').classList.remove('on'); $('#pmb').classList.remove('on'); $('#pmb').innerHTML = '';
    const p = $('#nav .nplus'); if (p) { p.classList.remove('on'); p.setAttribute('aria-label', 'Νέο'); }
  }
  const EMO = { 'Νέα εκκρεμότητα': '📝', 'Υπενθύμιση': '⏰', 'Νέο σεμινάριο': '🎓', 'Πρόσθεσε πελάτη': '➕', 'Νέο κομμωτήριο': '💈' };
  function openMenu(items) {
    const m = $('#pmb');
    m.innerHTML = `<div class="pt">${items.title || 'Νέο'}</div>` + items.map((it, k) =>
      `<button data-pmi="${k}" role="menuitem"><span class="pe">${it.e || EMO[it.label] || '＋'}</span><span><span style="display:block">${it.label}</span>${it.d ? `<span class="pd">${it.d}</span>` : ''}</span></button>`).join('');
    m._items = items;
    $('#pm').classList.add('on'); m.classList.add('on');
    const p = $('#nav .nplus'); p.classList.add('on'); p.setAttribute('aria-label', 'Κλείσιμο');
  }

  function wire() {
    $('#nav').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'back') PL.nav.up();
      else if (a === 'home') { if (!(PL.nav.guard && PL.nav.guard(a))) PL.nav.home(); }
      else if (a === 'tasks') { if (PL.nav.current().id !== 'tasks') PL.nav.push('tasks'); }
      else if (a === 'dictate') { if (PL.nav.current().id !== 'dictate') PL.nav.push('dictate'); }
      else if (a === 'nova') {
        const items = PL.bar._nova || [];
        if (items.length === 1) items[0].fn();
        else if ($('#pmb').classList.contains('on')) closeMenu(); else openMenu(items);
      }
    });
    $('#pm').addEventListener('click', closeMenu);
    $('#pmb').addEventListener('click', (e) => {
      const b = e.target.closest('[data-pmi]'); if (!b) return;
      const it = $('#pmb')._items[+b.dataset.pmi]; closeMenu(); if (it) it.fn();
    });
    /* Η μπάρα κρύβεται όταν γράφεις σε πεδίο (και στην Υπαγόρευση, όπως στην παλιά). */
    document.addEventListener('focusin', (e) => {
      if (e.target.matches('input,textarea,select')) PL.bar.hide('typing');
    });
    /* η μπάρα ξαναφαίνεται λίγο μετά (όπως στην παλιά, 120ms), ώστε ένα πάτημα π.χ. στο «← Πίσω» να προλάβει να γίνει */
    document.addEventListener('focusout', () => setTimeout(() => {
      const a = document.activeElement;
      if (!(a && a.matches && a.matches('input,textarea,select'))) PL.bar.unhide('typing');
    }, 120));
  }

  PL.start = function () {
    wire();
    PL.nav.home();
  };
})();
