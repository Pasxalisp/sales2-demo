/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήση εφαρμογής» (lab/usage/, μόνο στη δοκιμαστική έκδοση).
   1. Μέτρηση: για τον συνδεδεμένο χρήστη, ανά μέρα και ανά σελίδα πόσες φορές άνοιξε και πόσο χρόνο ήταν μπροστά του
      (μόνο όσο η σελίδα φαίνεται και ως 2' μετά το τελευταίο άγγιγμα), πόσες ενέργειες έκανε (εγγραφές στη βάση ανά είδος)
      και πότε μπήκε τελευταία. Στέλνεται στον «server» (PL.adapter.org.usage) κάθε λεπτό και όταν κρύβεται η σελίδα.
      «Online τώρα» (απόφαση 15/11): όσο η εφαρμογή φαίνεται στην οθόνη στέλνει κάθε λεπτό «last»· όταν κρυφτεί, «away».
      Online = τελευταίο «last» μέσα στα 2½ λεπτά και μετά το τελευταίο «away». Ο διαχειριστής το βλέπει ζωντανά (onChange).
   2. Σελίδες του διαχειριστή: «Χρήση εφαρμογής» (ανά οθόνη και ανά χρήστη) και ένας χρήστης αναλυτικά.
   Στην κανονική έκδοση η μέτρηση μένει ίδια και τα στοιχεία τα κρατά ο server (90 μέρες). */
(function () {
  const PL = window.PL, O = PL.adapter.org, me = O && O.me;
  if (!me) return;
  const u = PL.u, esc = u.esc;

  /* ---------- μέτρηση ---------- */
  const IDLE = 120e3;
  const ACT = { notes: 'Σημειώσεις', visits: 'Επισκέψεις', plans: 'Προγράμματα', tasks: 'Εκκρεμότητες', campaigns: 'Καμπάνιες', seminars: 'Σεμινάρια',
    tech: 'Τεχνικός', sos: 'SOS', orders: 'Παραγγελίες', balnotes: 'Υπόλοιπα', prospects: 'Νέοι πελάτες', xout: 'Εκτός πελατολογίου', ndfix: 'Γιορτές' };
  let page = null, t = Date.now(), act = Date.now(), d = { p: {}, a: {} }, dirty = false;
  /* χρόνος από το προηγούμενο μέτρημα ως τώρα, όσο η σελίδα φαίνεται και ως IDLE μετά το τελευταίο άγγιγμα */
  const tick = () => {
    const now = Date.now();
    if (page && document.visibilityState === 'visible') { const s = Math.max(0, Math.min(now, act + IDLE) - t) / 1000; if (s) { (d.p[page] = d.p[page] || [0, 0])[1] += s; dirty = true; } }
    t = now;
  };
  /* στέλνει ό,τι μαζεύτηκε μαζί με «last» (και «away» όταν κρύβεται η εφαρμογή) */
  const send = (away) => {
    tick();
    const p = {}, now = new Date().toISOString(); Object.entries(d.p).forEach(([k, [n, s]]) => { p[k] = [n, Math.round(s)]; });
    try { O.usage.record(Object.assign({ d: u.today(), p, a: d.a, last: now }, away ? { away: now } : {})); } catch (e) { /* ξαναδοκιμάζει στο επόμενο */ return; }
    d = { p: {}, a: {} }; dirty = false;
  };
  const flush = () => { tick(); if (dirty) send(false); };
  const beat = () => { if (document.visibilityState === 'visible') send(false); };   // κάθε λεπτό: «είμαι εδώ»
  PL.bus.on('page', (id) => { tick(); page = id; (d.p[id] = d.p[id] || [0, 0])[0]++; dirty = true; });
  PL.bus.on('write', (path) => { const k = ACT[path.split('/')[0]]; if (k) { d.a[k] = (d.a[k] || 0) + 1; dirty = true; } });
  ['pointerdown', 'keydown', 'wheel', 'touchmove'].forEach((ev) => addEventListener(ev, () => { tick(); act = Date.now(); }, { capture: true, passive: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') send(true); else { t = Date.now(); act = Date.now(); beat(); } });
  addEventListener('pagehide', () => send(true));
  PL.tick.add(beat, 60);
  setTimeout(beat, 1500);   // μόλις ανοίξει: online

  /* online τώρα / τελευταία φορά, για έναν χρήστη (μόνο ο διαχειριστής έχει τα στοιχεία όλων) */
  const ONLINE = 150e3;
  const seen = (id) => { let last = '', away = ''; O.usage.all().forEach((z) => { if (z.u !== id) return; if ((z.last || '') > last) last = z.last; if ((z.away || '') > away) away = z.away; });
    return { on: !!last && last > away && Date.now() - Date.parse(last) < ONLINE, last }; };
  /* ζωντανή ανανέωση μιας οθόνης του διαχειριστή: όταν αλλάζει η χρήση κάποιου και κάθε 30″ (για να «σβήνει» το online) */
  const live = (el, draw) => {
    const off = O.usage.onChange ? O.usage.onChange(() => { if (el.isConnected) draw(); }) : null, id = PL.tick.add(() => { if (el.isConnected) draw(); }, 30);
    return () => { if (off) off(); PL.tick.remove(id); };
  };
  PL.usage = { flush, seen, live, ACT };   // ACT: ονόματα συλλογών (και για το «Ιστορικό αλλαγών», lab/history)

  if (!me.admin) return;

  /* ---------- σελίδες διαχειριστή ---------- */
  const st = { per: 7 };
  const PER = [[1, 'Σήμερα'], [7, '7 μέρες'], [30, '30 μέρες'], [90, '3 μήνες']];
  const HIDE = new Set(['usage', 'usageuser', 'users', 'useredit']);                 // σελίδες του διαχειριστή: δεν μετράνε στις οθόνες
  /* ονόματα όπου ο τίτλος της σελίδας δεν αρκεί (ίδιος τίτλος σε δύο σελίδες, ή σελίδα που δεν έχει φορτώσει ακόμα) */
  const NAMES = { dictate: 'Υπαγόρευση (αφαιρέθηκε 19/11)', plan: 'Πρόγραμμα (αρχική)', planview: 'Πρόγραμμα (ανοιχτό)', flash: 'FLASH', charts: 'Τζίρος', sales: 'Πωλήσεις ανά κατηγορία', salesitem: 'Είδος', card: 'Η κάρτα μου' };
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
  /* χρόνος: «45″», «4′ 12″», «1 ώ 05′» */
  const dur = (sec) => { const t = Math.round(sec || 0); if (t < 60) return t + '″'; if (t < 3600) return Math.floor(t / 60) + '′ ' + u.pad(t % 60) + '″'; return Math.floor(t / 3600) + ' ώ ' + u.pad(Math.floor(t % 3600 / 60)) + '′'; };
  const pct = (v, tot) => (tot > 0 ? (v / tot * 100 < 1 && v > 0 ? '<1' : Math.round(v / tot * 100)) + '%' : '—');
  const secsOf = (z) => Object.entries(z.p || {}).reduce((a, [k, [, q]]) => a + (HIDE.has(k) ? 0 : q), 0);   // χρόνος ενός εγγράφου, χωρίς τις σελίδες του διαχειριστή
  const when = (iso) => { if (!iso) return '—'; const dt = new Date(iso), dd = ymd(dt.getTime()), t0 = u.today();
    return (dd === t0 ? 'σήμερα' : dd === ymd(Date.now() - 864e5) ? 'χθες' : u.fd(dd)) + ' ' + u.pad(dt.getHours()) + ':' + u.pad(dt.getMinutes()); };
  /* «🟢 Online τώρα» ή «τελευταία φορά σήμερα 18:17» */
  const status = (id) => { const s = seen(id); return s.on ? '<span class="uson">🟢 Online τώρα</span>' : s.last ? 'τελευταία φορά ' + esc(when(s.last)) : 'δεν έχει μπει ακόμη'; };
  PL.usage.status = status;   // και για τη λίστα «Χρήστες και ρόλοι» (lab/team)
  const card = (title, body, cls) => `<section class="tmcard${cls ? ' ' + cls : ''}"><h3>${title}</h3>${body}</section>`;
  const chips = () => `<div class="chips wrap">${PER.map(([n, l]) => `<button class="chip${st.per === n ? ' on' : ''}" data-usper="${n}">${l}</button>`).join('')}</div>`;
  /* σύνολα ανά οθόνη από μια λίστα εγγράφων: [{id, title, n, s, who:Set}] */
  const screens = (L) => { const m = {};
    L.forEach((x) => Object.entries(x.p || {}).forEach(([k, [n, s]]) => { if (HIDE.has(k)) return; const o = m[k] || (m[k] = { id: k, title: name(k), n: 0, s: 0, who: new Set() }); o.n += n; o.s += s; o.who.add(x.u); }));
    return Object.values(m).sort((a, b) => b.s - a.s || b.n - a.n); };
  const acts = (L) => { const m = {}; L.forEach((x) => Object.entries(x.a || {}).forEach(([k, n]) => { m[k] = (m[k] || 0) + n; })); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  /* δείκτες πάνω-πάνω: [[τίτλος, τιμή, υπότιτλος]] */
  const kpis = (L) => `<div class="uskpi">${L.map(([t, v, sub]) => `<div><span>${t}</span><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`).join('')}</div>`;
  /* όλες οι σελίδες που χρησιμοποιήθηκαν: χρόνος, % του συνόλου, φορές (και πόσοι χρήστες, όταν είναι πολλοί) */
  const pageTable = (S, nUsers) => {
    if (!S.length) return '<p class="mu">Καμία χρήση σε αυτή την περίοδο.</p>';
    const tot = S.reduce((a, x) => a + x.s, 0), max = Math.max(1, ...S.map((x) => x.s));
    return `<table class="ustbl"><thead><tr><th>Σελίδα</th><th>Χρόνος</th><th>%</th><th>Φορές</th></tr></thead><tbody>` +
      S.map((x) => `<tr><td><b>${esc(x.title)}</b><small>${esc(groupOf(x.id))}${nUsers > 1 ? ` · ${x.who.size} ${x.who.size === 1 ? 'χρήστης' : 'χρήστες'}` : ''}</small><span class="usbar"><i style="width:${Math.max(1, Math.round(x.s / max * 100))}%"></i></span></td>` +
        `<td>${dur(x.s)}</td><td>${pct(x.s, tot)}</td><td>${x.n}</td></tr>`).join('') +
      `</tbody><tfoot><tr><td>Σύνολο · ${S.length} σελίδες</td><td>${dur(tot)}</td><td>100%</td><td>${S.reduce((a, x) => a + x.n, 0)}</td></tr></tfoot></table>`;
  };
  /* χρόνος ανά ενότητα (Πελάτες, Πρόγραμμα, …): χρόνος και % του συνόλου */
  const sections = (S) => { const m = {}, tot = S.reduce((a, x) => a + x.s, 0); S.forEach((x) => { const g = groupOf(x.id); m[g] = (m[g] || 0) + x.s; });
    const L = Object.entries(m).sort((a, b) => b[1] - a[1]), mx = (L[0] || [0, 1])[1] || 1;
    return L.map(([g, v]) => `<div class="usg"><span class="usgi">${GICO[g]}</span><span class="usgn">${esc(g)}</span><span class="usgb"><i style="width:${Math.max(2, Math.round(v / mx * 100))}%"></i></span><b>${dur(v)}</b><em>${pct(v, tot)}</em></div>`).join('') || '<p class="mu">Καμία χρήση σε αυτή την περίοδο.</p>'; };
  /* ποιος μπαίνει κάθε μέρα: χρήστες × μέρες (ως 30 στήλες· για 3 μήνες ανά εβδομάδα), όσο πιο σκούρο τόσο περισσότερος χρόνος */
  const heatmap = (L, U) => {
    const span = Math.max(st.per, 7), wk = span > 30, cells = [];
    if (wk) for (let k = Math.ceil(span / 7) - 1; k >= 0; k--) cells.push([ymd(Date.now() - (k * 7 + 6) * 864e5), ymd(Date.now() - k * 7 * 864e5)]);
    else for (let k = span - 1; k >= 0; k--) { const d = ymd(Date.now() - k * 864e5); cells.push([d, d]); }
    const secs = (uid, [a, b]) => L.filter((z) => z.u === uid && z.d >= a && z.d <= b).reduce((t, z) => t + secsOf(z), 0);
    const lv = (s) => (s <= 0 ? 0 : s < (wk ? 3000 : 600) ? 1 : s < (wk ? 9000 : 1800) ? 2 : 3);
    return `<div class="ushm" style="--n:${cells.length}">` + U.map((x) => `<span class="ushn">${esc(x.name.split(' ')[0])}</span>` + cells.map((c) => { const s = secs(x.id, c); return `<i class="l${lv(s)}" title="${esc(u.fd(c[0]))}${wk ? '–' + esc(u.fd(c[1])) : ''} · ${dur(s)}"></i>`; }).join('')).join('') + '</div>' +
      `<div class="ushl"><i class="l0"></i>καθόλου <i class="l1"></i>${wk ? '&lt;50′' : '&lt;10′'} <i class="l2"></i>${wk ? '50′–2½ ώ' : '10–30′'} <i class="l3"></i>${wk ? '2½ ώ+' : '30′+'}${wk ? ' · ένα τετράγωνο = μία εβδομάδα' : ' · ανά μέρα'}</div>`; };
  const actList = (A) => (A.length ? `<div class="usacts">${A.map(([k, n]) => `<div><span>${esc(k)}</span><b>${n}</b></div>`).join('')}</div>` : '<p class="mu">Καμία ενέργεια.</p>');
  const deny = (el) => { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Αυτή η οθόνη είναι μόνο για τον διαχειριστή.</p>'; };
  const ICO = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>';

  PL.register('usage', {
    title: 'Χρήση εφαρμογής',
    render(el) {
      el.classList.add('tmpage');
      const draw = () => {
        const L = docs(), U = O.users().filter((x) => x.active), S = screens(L), on = new Set(L.filter((z) => secsOf(z) > 0).map((x) => x.u));
        const tot = S.reduce((a, x) => a + x.s, 0), udays = L.filter((z) => secsOf(z) > 0).length, nAct = acts(L).reduce((a, [, n]) => a + n, 0);
        const never = PL.pageIds().filter((id) => !HIDE.has(id) && !S.some((x) => x.id === id)).map(name).sort((a, b) => a.localeCompare(b, 'el'));
        const rows = U.map((x) => { const M = L.filter((z) => z.u === x.id);
          return { x, s: M.reduce((a, z) => a + secsOf(z), 0), days: M.filter((z) => secsOf(z) > 0).length, n: acts(M).reduce((a, [, q]) => a + q, 0) }; }).sort((a, b) => b.s - a.s);
        el.innerHTML = `<div class="tmhead"><h2>${ICO}Χρήση εφαρμογής</h2><p class="mu">Χρόνος μπροστά στην οθόνη ανά σελίδα και χρήστη</p></div>` + chips() +
          kpis([['Ενεργοί χρήστες', `${on.size}<small>/${U.length}</small>`, ''], ['Online τώρα', U.filter((x) => seen(x.id).on).length, ''],
            ['Συνολικός χρόνος', dur(tot), ''], ['Μέσος χρόνος', udays ? dur(tot / udays) : '—', 'ανά χρήστη και μέρα'], ['Αποθηκεύσεις', nAct, '']]) +
          `<div class="tmgrid">` +
          card('Χρόνος ανά σελίδα', pageTable(S, on.size) + (never.length ? `<p class="usnever">Χωρίς χρήση: ${never.map(esc).join(' · ')}</p>` : ''), 'tmwide2') +
          card('Χρήστες', `<div class="usuh"><span>Χρήστης</span><span>Χρόνος</span></div>` + rows.map((r) => `<button class="usu" data-usu="${esc(r.x.id)}"><span class="usn"><b>${esc(r.x.name)}</b><small class="mu">${esc(r.x.admin ? 'Διαχειριστής' : O.ROLES[r.x.role] || '')} · ${status(r.x.id)}</small>` +
            `</span><span class="usv"><b>${r.s ? dur(r.s) : '—'}</b><small class="mu">${r.days} ${r.days === 1 ? 'μέρα' : 'μέρες'} · ${r.n} αποθ.</small></span></button>`).join('')) +
          card('Χρόνος ανά ενότητα', sections(S)) +
          card('Ποιος μπαίνει κάθε μέρα', heatmap(L, rows.map((r) => r.x)), 'tmwide2') +
          card('Αποθηκεύσεις ανά είδος', actList(acts(L))) + `</div>`;
      };
      draw();
      el.addEventListener('click', (ev) => {
        const p = ev.target.closest('[data-usper]'); if (p) { st.per = +p.dataset.usper; draw(); return; }
        const b = ev.target.closest('[data-usu]'); if (b) PL.nav.push('usageuser', { id: b.dataset.usu });
      });
      return live(el, draw);
    },
  });

  PL.register('usageuser', {
    title: 'Χρήση · χρήστης',
    render(el, params) {
      el.classList.add('tmpage');
      const x = O.users().find((z) => z.id === params.id); if (!x) { deny(el); return; }
      const draw = () => {
        const L = docs().filter((z) => z.u === x.id), S = screens(L), tot = S.reduce((a, q) => a + q.s, 0), nAct = acts(L).reduce((a, [, n]) => a + n, 0);
        const days = []; for (let k = st.per - 1; k >= 0; k--) days.push(ymd(Date.now() - k * 864e5));
        const per = days.map((dd) => { const z = L.find((q) => q.d === dd); return [dd, z ? secsOf(z) : 0]; }), mx = Math.max(60, ...per.map((q) => q[1])), act = per.filter((q) => q[1] > 0).length;
        /* params.bare: μέσα σε καρτέλα της Διαχείρισης, χωρίς επικεφαλίδα (το όνομα είναι ήδη από πάνω) */
        el.innerHTML = (params.bare ? '' : `<div class="tmhead"><h2>${esc(x.name)}</h2><p class="mu">${esc(x.admin ? 'Διαχειριστής' : O.ROLES[x.role] || '')} · ${status(x.id)}</p></div>`) + chips() +
          kpis([['Συνολικός χρόνος', dur(tot), ''], ['Ενεργές μέρες', `${act}<small>/${per.length}</small>`, ''], ['Μέσος χρόνος', act ? dur(tot / act) : '—', 'ανά ενεργή μέρα'],
            ['Σελίδες', S.length, ''], ['Αποθηκεύσεις', nAct, '']]) +
          `<div class="tmgrid">` +
          (st.per > 1 ? card('Χρόνος ανά μέρα', `<div class="usdays">${per.map(([dd, s]) => `<span title="${esc(u.fd(dd))} · ${dur(s)}"><i style="height:${Math.round(s / mx * 100)}%"></i></span>`).join('')}</div><div class="usdl"><span>${esc(u.fd(days[0]))}</span><span>${esc(u.fd(days[days.length - 1]))}</span></div>`, 'tmwide2') : '') +
          card('Χρόνος ανά σελίδα', pageTable(S, 1), 'tmwide2') + card('Χρόνος ανά ενότητα', sections(S)) + card('Αποθηκεύσεις ανά είδος', actList(acts(L))) + `</div>`;
      };
      draw();
      el.addEventListener('click', (ev) => { const p = ev.target.closest('[data-usper]'); if (p) { st.per = +p.dataset.usper; draw(); } });
      return live(el, draw);
    },
  });
})();
