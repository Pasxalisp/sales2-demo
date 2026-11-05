/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήση εφαρμογής» (lab/usage/, μόνο στη δοκιμαστική έκδοση).
   1. Μέτρηση: για τον συνδεδεμένο χρήστη, ανά μέρα και ανά σελίδα πόσες φορές άνοιξε και πόσο χρόνο ήταν μπροστά του
      (μόνο όσο η σελίδα φαίνεται και ως 2' μετά το τελευταίο άγγιγμα), πόσες ενέργειες έκανε (εγγραφές στη βάση ανά είδος)
      και πότε μπήκε τελευταία. Στέλνεται στον «server» (PL.adapter.org.usage) κάθε λεπτό και όταν κρύβεται η σελίδα.
   2. Σελίδες του διαχειριστή: «Χρήση εφαρμογής» (ανά οθόνη και ανά χρήστη) και ένας χρήστης αναλυτικά.
   Στην κανονική έκδοση η μέτρηση μένει ίδια και τα στοιχεία τα κρατά ο server (90 μέρες). */
(function () {
  const PL = window.PL, O = PL.adapter.org, me = O && O.me;
  if (!me) return;
  const u = PL.u, esc = u.esc;

  /* ---------- μέτρηση ---------- */
  const IDLE = 120e3;
  const ACT = { notes: 'Σημειώσεις', visits: 'Επισκέψεις', plans: 'Προγράμματα', tasks: 'Εκκρεμότητες', campaigns: 'Καμπάνιες', seminars: 'Σεμινάρια',
    tech: 'Τεχνικός', sos: 'SOS', orders: 'Παραγγελίες', balnotes: 'Υπόλοιπα', prospects: 'Νέοι πελάτες', xout: 'Εκτός πελατολογίου' };
  let page = null, t = Date.now(), act = Date.now(), d = { p: {}, a: {} }, dirty = false;
  /* χρόνος από το προηγούμενο μέτρημα ως τώρα, όσο η σελίδα φαίνεται και ως IDLE μετά το τελευταίο άγγιγμα */
  const tick = () => {
    const now = Date.now();
    if (page && document.visibilityState === 'visible') { const s = Math.max(0, Math.min(now, act + IDLE) - t) / 1000; if (s) { (d.p[page] = d.p[page] || [0, 0])[1] += s; dirty = true; } }
    t = now;
  };
  const flush = () => {
    tick(); if (!dirty) return;
    const p = {}; Object.entries(d.p).forEach(([k, [n, s]]) => { p[k] = [n, Math.round(s)]; });
    try { O.usage.record({ d: u.today(), p, a: d.a, last: new Date().toISOString() }); } catch (e) { /* ξαναδοκιμάζει στο επόμενο */ return; }
    d = { p: {}, a: {} }; dirty = false;
  };
  PL.bus.on('page', (id) => { tick(); page = id; (d.p[id] = d.p[id] || [0, 0])[0]++; dirty = true; });
  PL.bus.on('write', (path) => { const k = ACT[path.split('/')[0]]; if (k) { d.a[k] = (d.a[k] || 0) + 1; dirty = true; } });
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((ev) => addEventListener(ev, () => { tick(); act = Date.now(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else { t = Date.now(); act = Date.now(); } });
  addEventListener('pagehide', flush);
  PL.tick.add(flush, 60);
  PL.usage = { flush };

  if (!me.admin) return;

  /* ---------- σελίδες διαχειριστή ---------- */
  const st = { per: 7 };
  const PER = [[1, 'Σήμερα'], [7, '7 μέρες'], [30, '30 μέρες'], [90, '3 μήνες']];
  const HIDE = new Set(['usage', 'usageuser', 'users', 'useredit']);                 // σελίδες του διαχειριστή: δεν μετράνε στις οθόνες
  /* ονόματα όπου ο τίτλος της σελίδας δεν αρκεί (ίδιος τίτλος σε δύο σελίδες, ή σελίδα που δεν έχει φορτώσει ακόμα) */
  const NAMES = { plan: 'Πρόγραμμα (αρχική)', planview: 'Πρόγραμμα (ανοιχτό)', flash: 'FLASH', charts: 'Τζίρος', sales: 'Πωλήσεις ανά κατηγορία', salesitem: 'Είδος', card: 'Η κάρτα μου' };
  const name = (id) => NAMES[id] || PL.pageTitle(id);
  /* ομάδες οθονών: για να φαίνεται με μια ματιά τι δουλεύεται (οι υπόλοιπες σελίδες πάνε στα «Άλλα») */
  const GROUPS = [
    ['Πελάτες', '👥', ['clients', 'client', 'visit', 'buyer']],
    ['Πρόγραμμα', '🗓', ['plan', 'dayplan', 'planview', 'month', 'free', 'myplans', 'labmap']],
    ['Υπαγόρευση', '🎙', ['dictate']],
    ['Εκκρεμότητες', '✅', ['tasks', 'task']],
    ['Αναφορές', '📊', ['flash', 'charts', 'sales', 'salesitem', 'whobought', 'products', 'balances', 'debt', 'deals', 'deal']],
    ['Ενέργειες', '%', ['tech', 'techlist', 'techreq', 'semlist', 'seminar', 'smpick', 'camplist', 'campaign']],
    ['Ομάδα', '🧑‍🤝‍🧑', ['team', 'teams', 'member', 'memcat']],
  ];
  const groupOf = (id) => (GROUPS.find((g) => g[2].includes(id)) || ['Αρχική και άλλα', '🏠'])[0];
  const GICO = Object.fromEntries(GROUPS.map((g) => [g[0], g[1]]).concat([['Αρχική και άλλα', '🏠']]));
  const ymd = (ms) => { const x = new Date(ms); return x.getFullYear() + '-' + u.pad(x.getMonth() + 1) + '-' + u.pad(x.getDate()); };   // τοπική ημερομηνία
  const from = () => ymd(Date.now() - (st.per - 1) * 864e5);
  const docs = () => { flush(); const f = from(); return O.usage.all().filter((x) => x.d >= f); };
  const mins = (s) => { const m = Math.round(s / 60); return s > 0 && m < 1 ? '<1′' : m < 60 ? m + '′' : Math.floor(m / 60) + 'ω ' + String(m % 60).padStart(2, '0') + '′'; };
  const when = (iso) => { if (!iso) return '—'; const dt = new Date(iso), dd = ymd(dt.getTime()), t0 = u.today();
    return (dd === t0 ? 'σήμερα' : dd === ymd(Date.now() - 864e5) ? 'χθες' : u.fd(dd)) + ' ' + u.pad(dt.getHours()) + ':' + u.pad(dt.getMinutes()); };
  const card = (title, body, cls) => `<section class="tmcard${cls ? ' ' + cls : ''}"><h3>${title}</h3>${body}</section>`;
  const chips = () => `<div class="chips wrap">${PER.map(([n, l]) => `<button class="chip${st.per === n ? ' on' : ''}" data-usper="${n}">${l}</button>`).join('')}</div>`;
  /* σύνολα ανά οθόνη από μια λίστα εγγράφων: [{id, title, n, s, who:Set}] */
  const screens = (L) => { const m = {};
    L.forEach((x) => Object.entries(x.p || {}).forEach(([k, [n, s]]) => { if (HIDE.has(k)) return; const o = m[k] || (m[k] = { id: k, title: name(k), n: 0, s: 0, who: new Set() }); o.n += n; o.s += s; o.who.add(x.u); }));
    return Object.values(m).sort((a, b) => b.s - a.s || b.n - a.n); };
  const acts = (L) => { const m = {}; L.forEach((x) => Object.entries(x.a || {}).forEach(([k, n]) => { m[k] = (m[k] || 0) + n; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const bars = (S, nUsers) => { const max = Math.max(1, ...S.map((x) => x.s)), tot = S.reduce((a, x) => a + x.s, 0) || 1;
    return S.map((x) => { const low = nUsers > 1 && x.s / tot < 0.01;   /* κάτω από 1% του χρόνου όλων */
      return `<div class="usr"><div class="usn"><b>${esc(x.title)}</b>${low ? ' <span class="usflag">λίγη χρήση</span>' : ''}</div>` +
        `<div class="usv">${mins(x.s)} · ${x.n} φορές${nUsers > 1 ? ` · ${x.who.size}/${nUsers} χρήστες` : ''}</div><div class="tmbar"><i class="up" style="width:${Math.max(2, Math.round(x.s / max * 100))}%"></i></div></div>`; }).join('') || '<p class="mu">Καμία χρήση σε αυτή την περίοδο.</p>'; };
  /* χρόνος ανά ομάδα οθονών, ως ποσοστό του συνόλου */
  const groups = (S) => { const m = {}, tot = S.reduce((a, x) => a + x.s, 0) || 1; S.forEach((x) => { const g = groupOf(x.id); m[g] = (m[g] || 0) + x.s; });
    const L = Object.entries(m).sort((a, b) => b[1] - a[1]), mx = (L[0] || [0, 1])[1];
    return L.map(([g, v]) => `<div class="usg"><span class="usgi">${GICO[g]}</span><span class="usgn">${esc(g)}</span><span class="usgb"><i style="width:${Math.max(3, Math.round(v / mx * 100))}%"></i></span><b>${Math.round(v / tot * 100)}%</b></div>`).join('') || '<p class="mu">Καμία χρήση σε αυτή την περίοδο.</p>'; };
  /* τρεις ομάδες οθονών: πολύ (≥4% του χρόνου), λίγο (<1%), κανείς — η μία κάτω από την άλλη, ονόματα στη σειρά */
  const cols = (S, never) => { const tot = S.reduce((a, x) => a + x.s, 0) || 1, col = (cls, h, L) => `<div class="usc ${cls}"><b>${h}</b>${L.length ? L.map(esc).join(' · ') : '<span class="mu">—</span>'}</div>`;
    return `<div class="uscols">${col('c1', '👍 Πολύ', S.filter((x) => x.s / tot >= 0.04).map((x) => x.title))}${col('c2', '🤏 Λίγο', S.filter((x) => x.s / tot < 0.01).map((x) => x.title))}${col('c3', '🚫 Κανείς', never)}</div>`; };
  /* ποιος μπαίνει κάθε μέρα: χρήστες × μέρες (ως 30 στήλες· για 3 μήνες ανά εβδομάδα), όσο πιο σκούρο τόσο περισσότερος χρόνος */
  const heatmap = (L, U) => {
    const span = Math.max(st.per, 7), wk = span > 30, cells = [];
    if (wk) for (let k = Math.ceil(span / 7) - 1; k >= 0; k--) cells.push([ymd(Date.now() - (k * 7 + 6) * 864e5), ymd(Date.now() - k * 7 * 864e5)]);
    else for (let k = span - 1; k >= 0; k--) { const d = ymd(Date.now() - k * 864e5); cells.push([d, d]); }
    const secs = (uid, [a, b]) => L.filter((z) => z.u === uid && z.d >= a && z.d <= b).reduce((t, z) => t + Object.values(z.p || {}).reduce((q, [, v]) => q + v, 0), 0);
    const lv = (s) => (s <= 0 ? 0 : s < (wk ? 3000 : 600) ? 1 : s < (wk ? 9000 : 1800) ? 2 : 3);
    return `<div class="ushm" style="--n:${cells.length}">` + U.map((x) => `<span class="ushn">${esc(x.name.split(' ')[0])}</span>` + cells.map((c) => { const s = secs(x.id, c); return `<i class="l${lv(s)}" title="${esc(u.fd(c[0]))}${wk ? '–' + esc(u.fd(c[1])) : ''} · ${mins(s)}"></i>`; }).join('')).join('') + '</div>' +
      `<div class="ushl">λίγο <i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i> πολύ${wk ? ' · ένα τετράγωνο = μία εβδομάδα' : ''}</div>`; };
  const actList = (A) => (A.length ? `<div class="usacts">${A.map(([k, n]) => `<div><span>${esc(k)}</span><b>${n}</b></div>`).join('')}</div>` : '<p class="mu">Καμία ενέργεια.</p>');
  const deny = (el) => { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Αυτή η οθόνη είναι μόνο για τον διαχειριστή.</p>'; };
  const ICO = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';

  PL.register('usage', {
    title: 'Χρήση εφαρμογής',
    render(el) {
      el.classList.add('tmpage');
      let allOpen = false;
      const draw = () => {
        const L = docs(), U = O.users().filter((x) => x.active), S = screens(L), on = new Set(L.map((x) => x.u));
        const never = PL.pageIds().filter((id) => !HIDE.has(id) && !S.some((x) => x.id === id)).map(name).sort((a, b) => a.localeCompare(b, 'el'));
        const rows = U.map((x) => { const M = L.filter((z) => z.u === x.id), s = M.reduce((a, z) => a + Object.values(z.p || {}).reduce((b, [, q]) => b + q, 0), 0);
          return { x, s, days: M.length, last: M.reduce((a, z) => (z.last > a ? z.last : a), ''), top: screens(M).slice(0, 3).map((q) => q.title) }; }).sort((a, b) => b.s - a.s);
        el.innerHTML = `<div class="tmhead"><h2>${ICO}Χρήση εφαρμογής</h2><p class="mu">${on.size} από ${U.length} χρήστες μπήκαν σε αυτή την περίοδο</p></div>` + chips() +
          `<div class="tmgrid">` +
          card('Τι δουλεύεται', groups(S)) + card('Οθόνες', cols(S, never)) +
          card('Ποιος μπαίνει κάθε μέρα', heatmap(L, rows.map((r) => r.x)), 'tmwide2') +
          card('Ενέργειες (αποθηκεύσεις)', actList(acts(L))) +
          card('Χρήστες', rows.map((r) => `<button class="usu" data-usu="${esc(r.x.id)}"><span class="usn"><b>${esc(r.x.name)}</b><small class="mu">${esc(r.x.admin ? 'Διαχειριστής' : O.ROLES[r.x.role] || '')} · τελευταία ${esc(when(r.last))}</small>` +
            `</span><span class="usv"><b>${mins(r.s)}</b><small class="mu">${r.days} ${r.days === 1 ? 'μέρα' : 'μέρες'}</small></span></button>`).join('')) +
          `</div><button class="tmmore" data-usall="1">${allOpen ? 'Λιγότερα ▴' : 'Όλες οι οθόνες αναλυτικά ▾'}</button>` + (allOpen ? `<div class="tmgrid tmdet">${card('Οθόνες · χρόνος μπροστά τους', bars(S, on.size), 'tmwide2')}</div>` : '');
      };
      draw();
      el.addEventListener('click', (ev) => {
        const p = ev.target.closest('[data-usper]'); if (p) { st.per = +p.dataset.usper; draw(); return; }
        if (ev.target.closest('[data-usall]')) { allOpen = !allOpen; draw(); return; }
        const b = ev.target.closest('[data-usu]'); if (b) PL.nav.push('usageuser', { id: b.dataset.usu });
      });
    },
  });

  PL.register('usageuser', {
    title: 'Χρήση · χρήστης',
    render(el, params) {
      el.classList.add('tmpage');
      const x = O.users().find((z) => z.id === params.id); if (!x) { deny(el); return; }
      const draw = () => {
        const L = docs().filter((z) => z.u === x.id), S = screens(L), last = L.reduce((a, z) => (z.last > a ? z.last : a), '');
        const days = []; for (let k = st.per - 1; k >= 0; k--) days.push(ymd(Date.now() - k * 864e5));
        const per = days.map((dd) => { const z = L.find((q) => q.d === dd); return [dd, z ? Object.values(z.p || {}).reduce((a, [, q]) => a + q, 0) : 0]; }), mx = Math.max(60, ...per.map((q) => q[1]));
        el.innerHTML = `<div class="tmhead"><h2>${esc(x.name)}</h2><p class="mu">${esc(x.admin ? 'Διαχειριστής' : O.ROLES[x.role] || '')} · τελευταία είσοδος ${esc(when(last))}</p></div>` + chips() +
          `<div class="tmgrid">` +
          (st.per > 1 ? card('Ανά μέρα', `<div class="usdays">${per.map(([dd, s]) => `<span title="${esc(u.fd(dd))} · ${mins(s)}"><i style="height:${Math.round(s / mx * 100)}%"></i></span>`).join('')}</div><p class="mu">${per.filter((q) => q[1] > 0).length} από ${per.length} μέρες · σύνολο ${mins(per.reduce((a, q) => a + q[1], 0))}</p>`) : '') +
          card('Τι δουλεύει', groups(S)) + card('Οθόνες', bars(S, 1)) + card('Ενέργειες (αποθηκεύσεις)', actList(acts(L))) + `</div>`;
      };
      draw();
      el.addEventListener('click', (ev) => { const p = ev.target.closest('[data-usper]'); if (p) { st.per = +p.dataset.usper; draw(); } });
    },
  });
})();
