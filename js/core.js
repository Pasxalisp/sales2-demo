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
  const pages = {};           // id -> { title, render(el,params)->cleanup?, nova?:()=>[{label,fn}], hideBar? }
  const stack = [];           // [{id, params}]
  let cleanup = null;
  PL.pages = pages;
  PL.register = (id, def) => { pages[id] = def; };

  PL.nav = {
    push(id, params) { stack.push({ id, params: params || {} }); show(); },
    back() { if (stack.length > 1) { stack.pop(); show(); } },
    /* «Πίσω» του χρήστη (κουμπί ή σύρσιμο): ρωτάει πρώτα τον φύλακα της σελίδας, μετά γυρνά */
    up() { if (!(PL.nav.guard && PL.nav.guard('back'))) PL.nav.back(); },
    home() { stack.length = 0; stack.push({ id: 'home', params: {} }); show(); },
    current: () => stack[stack.length - 1],
    depth: () => stack.length,
    trail: () => stack.map((s) => s.id),
  };

  function show() {
    const cur = stack[stack.length - 1];
    const def = pages[cur.id];
    const root = $('#app');
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    root.innerHTML = '';
    const el = document.createElement('section');
    el.className = 'page';
    el.dataset.page = cur.id;
    root.appendChild(el);
    cleanup = def.render(el, cur.params) || null;
    window.scrollTo(0, 0);
    PL.bar.update();
  }

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
