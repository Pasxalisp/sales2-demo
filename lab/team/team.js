/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήστες και ρόλοι» (lab/team/, μόνο στη δοκιμαστική έκδοση).
   - Οθόνη εισόδου: email + κωδικός, και γρήγορη είσοδος ανά ρόλο.
   - Αρχική: ποιος είναι συνδεδεμένος, «Αλλαγή χρήστη», και πλακίδια ανάλογα με τον ρόλο.
   - «Η ομάδα μου» (υπεύθυνος ομάδας), «Όλες οι ομάδες» (διευθυντής): νούμερα και σημειώσεις των πωλητών, ΜΟΝΟ ανάγνωση.
   - «Χρήστες και ρόλοι» (διαχειριστής): ρόλος, ομάδα, περιοχές, ενεργός.
   Τα δεδομένα κάθε χρήστη τα δίνει το session.js (PL_DEMO.dataFor), όπως θα τα έδινε ο server. */
(function () {
  const PL = window.PL, D = window.PL_DEMO; if (!PL || !D) return;
  const u = PL.u, esc = u.esc, money = u.money, me = D.me;
  const pad = (n) => (n < 10 ? '0' : '') + n, iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const yoyTxt = (ty, ly) => (ly > 0 ? (ty >= ly ? '▲ +' : '▼ −') + Math.abs(Math.round((ty - ly) / ly * 100)) + '%' : '');
  const MONTHS = ['', 'Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const m0 = (n) => Math.round(+n || 0).toLocaleString('el-GR') + ' €';   /* ποσά χωρίς δεκαδικά στις λίστες */
  const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  const team = (id) => D.TEAMS.find((t) => t.id === id) || null;
  const roleOf = (x) => D.ROLES[x.role] + (x.admin ? ' · διαχειριστής' : '');
  const sellers = (tid) => D.users().filter((x) => x.active && x.role !== 'director' && (!tid || x.team === tid))
    .sort((a, b) => (a.role === 'lead' ? -1 : b.role === 'lead' ? 1 : a.name < b.name ? -1 : 1));
  const RO = '<span class="tmro">🔒 Μόνο ανάγνωση</span>';
  const kp = (label, val, cls) => `<div><span>${label}</span><b class="${cls || ''}">${val}</b></div>`;
  /* χρώμα ποσοστού στόχου: πράσινο από 90%, πορτοκαλί 60–89%, κόκκινο κάτω από 60% (ίδιο στη μπάρα και στο νούμερο) */
  const pc = (p) => (p >= 90 ? 'up' : p >= 60 ? 'mid' : 'dn');
  const bar = (p) => `<div class="tmbar"><i style="width:${Math.max(0, Math.min(100, p))}%" class="${pc(p)}"></i></div>`;

  /* ---------- νούμερα ενός πωλητή, από τα δεδομένα του ---------- */
  function stats(uid) {
    const m = D.dataFor(uid), T = u.today(), d30 = ago(30), d60 = ago(60);
    const list = (c) => { const L = []; m.forEach((d, p) => { if (p.startsWith(c + '/') && d) L.push([p.slice(c.length + 1), d]); }); return L; };
    const cl = list('clients').concat(list('prospects')), byId = Object.fromEntries(cl), cats = m.get('cats/all') || {};
    const gold = (id, c) => { const k = cats[id]; return (k && Array.isArray(k.Goldwell) && k.Goldwell.map((x) => +x || 0)) || (c.yoy && c.yoy.Goldwell) || null; };
    let ly = 0, ty = 0; cl.forEach(([id, c]) => { const g = gold(id, c); if (g) { ly += +g[0] || 0; ty += +g[1] || 0; } });
    const lastV = {}; let v30 = 0;
    list('visits').forEach(([id, v]) => (v.dates || []).forEach((d) => { if (d >= d30 && d <= T) v30++; if (!lastV[id] || d > lastV[id]) lastV[id] = d; }));
    const notes = [], late = [];
    list('notes').forEach(([id, n]) => { const c = byId[id]; if (!c) return; (n.entries || []).forEach((e) => {
      if (e.text || e.todo || e.products) notes.push({ id, name: c.name, city: c.city, d: e.d || '', text: e.text || '', products: e.products || '', todo: e.todo || '' });
      if (e.next && !e.done && e.next < T) late.push({ name: c.name, d: e.next, t: e.todo || 'Επόμενη επαφή' }); }); });
    list('tasks').forEach(([, x]) => { if (x && !x.done && (x.next || x.d || T) < T && byId[x.cid]) late.push({ name: byId[x.cid].name, d: x.next || x.d, t: x.t || 'Εκκρεμότητα' }); });
    notes.sort((a, b) => (a.d < b.d ? 1 : -1)); late.sort((a, b) => (a.d < b.d ? -1 : 1));
    const dl = Object.entries(m.get('deals/all') || {}).filter(([k]) => k[0] !== '_' && byId[k]).map(([k, x]) => ({ name: byId[k].name, goal: +x.goal || 0, ty: +x.ty || 0 }));
    const dg = dl.reduce((a, x) => a + x.goal, 0), dt = dl.reduce((a, x) => a + x.ty, 0);
    let debt = 0, over = 0, debtors = []; list('balances').forEach(([id, b]) => { if (!byId[id]) return; const a = +b.amount || 0; if (a >= 1) { debt += a; debtors.push({ name: byId[id].name, a }); } over += Math.max(0, +b.over || 0); });
    debtors.sort((a, b) => b.a - a.a);
    const cold = cl.map(([id, c]) => ({ id, c, g: gold(id, c) })).filter((x) => x.g && (+x.g[2] || 0) >= 800 && !(lastV[x.id] >= d60))
      .sort((a, b) => b.g[2] - a.g[2]).map((x) => ({ name: x.c.name, city: x.c.city, ly: +x.g[2], last: lastV[x.id] || '' }));
    /* FLASH της εταιρείας: ο πιο πρόσφατος μήνας, η γραμμή με τον κωδικό του πωλητή */
    /* ο μήνας της τελευταίας ενημέρωσης (F.d)· οι επόμενοι μήνες έχουν μόνο στόχο */
    const F = m.get('flash/2026') || {}, mk = F.d ? +F.d.slice(5, 7) : Object.keys(F.m || {}).map(Number).sort((a, b) => b - a)[0], x = D.user(uid);
    const row = mk && x && x.code ? (F.m[mk] || []).find((r) => r[0] === x.code) : null;
    const fl = row ? { month: MONTHS[mk], target: +row[2] || 0, sales: +row[3] || 0 } : null;
    return { n: cl.length, ly, ty, v30, notes, late, deals: dl.sort((a, b) => b.ty / (b.goal || 1) - a.ty / (a.goal || 1)), dg, dt, debt, over, debtors, cold, fl,
      visited: Object.values(lastV).filter((d) => d >= d30).length };
  }
  const sum = (L, f) => L.reduce((a, x) => a + (f(x) || 0), 0);
  const total = (S) => ({ target: sum(S, (s) => s.fl && s.fl.target), sales: sum(S, (s) => s.fl && s.fl.sales), ly: sum(S, (s) => s.ly), ty: sum(S, (s) => s.ty),
    v30: sum(S, (s) => s.v30), late: sum(S, (s) => s.late.length), n: sum(S, (s) => s.n), debt: sum(S, (s) => s.debt), cold: sum(S, (s) => s.cold.length) });
  const month = (S) => (S.find((s) => s.fl) || { fl: {} }).fl.month || '';
  const kpis = (t, mo) => `<div class="shk">${kp('FLASH ' + esc(mo), pct(t.sales, t.target) + '%', pc(pct(t.sales, t.target)))}` +
    kp('Goldwell φέτος', m0(t.ty) + ' <small class="' + (t.ty >= t.ly ? 'up' : 'dn') + '">' + yoyTxt(t.ty, t.ly) + '</small>', t.ty >= t.ly ? 'up' : 'dn') + kp('Επισκέψεις 30 ημ.', t.v30) + kp('Εκκρεμότητες που πέρασαν', t.late, t.late ? 'dn' : '') + '</div>';

  /* κάρτα πωλητή μέσα σε λίστα ομάδας */
  const memberCard = (x, s) => {
    const p = s.fl ? pct(s.fl.sales, s.fl.target) : 0;
    return `<div class="card tmm${x.id === (me && me.id) ? ' me' : ''}" data-mem="${esc(x.id)}"><div class="row"><span class="nm"><span class="tmav s">${esc(initials(x.name))}</span>${esc(x.name)}</span><span class="tmrole ${esc(x.role)}">${esc(D.ROLES[x.role])}</span></div>` +
      (s.fl ? `<div class="tmfl"><span>FLASH ${esc(s.fl.month)}: <b>${m0(s.fl.sales)}</b> / ${m0(s.fl.target)}</span><b class="${pc(p)}">${p}%</b></div>${bar(p)}` : '') +
      `<div class="tmmini"><span>${s.n} πελάτες</span><span>Goldwell <b class="${s.ty >= s.ly ? 'up' : 'dn'}">${yoyTxt(s.ty, s.ly) || '—'}</b></span><span>${s.v30} επισκ. / 30 ημ.</span>` +
      `<span class="${s.late.length ? 'dn' : ''}">${s.late.length} εκκρ. πέρασαν</span>${s.cold.length ? `<span class="dn">${s.cold.length} καλοί χωρίς επίσκεψη</span>` : ''}</div></div>`;
  };
  const noteRows = (L, who) => (L.length ? L.map((e) => `<div class="tmn"><div class="mu">${esc(u.fd(e.d))}${who ? ' · ' + esc(who(e)) : ''} · <b>${esc(e.name)}</b>${e.city ? ' · ' + esc(e.city) : ''}</div><div>${esc(e.text)}${e.products ? ' <span class="mu">(' + esc(e.products) + ')</span>' : ''}${e.todo ? `<div class="mu">Να πει: ${esc(e.todo)}</div>` : ''}</div></div>`).join('') : '<span class="mu">Καμία σημείωση ακόμα.</span>');
  const rows = (L, f, empty) => (L.length ? L.map(f).join('') : `<span class="mu">${empty}</span>`);
  const canSee = (tid) => me && (me.role === 'director' || (me.role === 'lead' && me.team === tid));
  const deny = (el) => { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Αυτή η οθόνη είναι για τον υπεύθυνο της ομάδας και τον διευθυντή.</p>'; };

  /* ---------- Η ομάδα μου ---------- */
  PL.register('team', {
    title: 'Η ομάδα μου',
    split: ['member'],
    aside(el, params) {
      const tid = (params && params.team) || (me && me.team); if (!canSee(tid)) return deny(el);
      const L = sellers(tid).map((x) => ({ x, s: stats(x.id) }));
      const late = [].concat(...L.map(({ x, s }) => s.late.map((e) => Object.assign({ who: x.name }, e)))).sort((a, b) => (a.d < b.d ? -1 : 1));
      const notes = [].concat(...L.map(({ x, s }) => s.notes.map((e) => Object.assign({ who: x.name }, e)))).sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 10);
      el.innerHTML = `<h2>Πού χρειάζεται προσοχή</h2><p class="mu">${RO} Διάλεξε πωλητή από τη λίστα για όλα τα νούμερά του.</p>` +
        PL.sheet.box('Εκκρεμότητες που πέρασαν (' + late.length + ')', rows(late.slice(0, 10), (e) => `<div class="shr"><span><b>${esc(e.name)}</b> <span class="mu">· ${esc(e.who)}</span><div class="mu">${esc(e.t)}</div></span><span class="dn" style="white-space:nowrap">${esc(u.fd(e.d))}</span></div>`, 'Καμία. Όλοι είναι εντάξει.')) +
        PL.sheet.box('Τελευταίες σημειώσεις της ομάδας', noteRows(notes, (e) => e.who.split(' ')[0]));
    },
    render(el, params) {
      const tid = (params && params.team) || (me && me.team), t = team(tid); if (!t || !canSee(tid)) return deny(el);
      const L = sellers(tid).map((x) => ({ x, s: stats(x.id) })), lead = L.find(({ x }) => x.role === 'lead'), T = total(L.map((z) => z.s));
      el.innerHTML = `<h2 class="tmh">${ICON.team}${me.team === tid ? 'Η ομάδα μου' : esc(t.name)}</h2><p class="mu">${esc(t.name)} · ${L.length} πωλητές${lead ? ' · υπεύθυνος ' + esc(lead.x.name) : ''} ${RO}</p>` +
        kpis(T, month(L.map((z) => z.s))) + '<h3>Πωλητές</h3>' + L.map(({ x, s }) => memberCard(x, s)).join('') +
        '<p class="mu tmfoot">Τα νούμερα έρχονται από τα δεδομένα κάθε πωλητή (FLASH, orders, καρτέλες). Ο υπεύθυνος τα βλέπει, δεν τα αλλάζει.</p>';
      el.addEventListener('click', (ev) => { const c = ev.target.closest('[data-mem]'); if (c) PL.nav.push('member', { id: c.dataset.mem }); });
    },
  });

  /* ---------- Ένας πωλητής (μόνο ανάγνωση) ---------- */
  PL.register('member', {
    title: 'Πωλητής',
    render(el, params) {
      const x = D.user(params.id); if (!x || !canSee(x.team)) return deny(el);
      const s = stats(x.id), p = s.fl ? pct(s.fl.sales, s.fl.target) : 0, H = PL.sheet, t = team(x.team);
      el.innerHTML = `<div class="shh"><div><h2><span class="tmav">${esc(initials(x.name))}</span>${esc(x.name)}</h2><div class="mu">${esc(roleOf(x))}${t ? ' · ' + esc(t.name) : ''} · ${esc(x.email)}</div></div><div class="shstep">${RO}</div></div>` +
        (s.fl ? H.box('FLASH ' + esc(s.fl.month), `<div class="tmfl big"><span><b>${money(s.fl.sales)}</b> από ${money(s.fl.target)}</span><b class="${pc(p)}">${p}%</b></div>${bar(p)}<div class="mu" style="margin-top:6px">Λείπουν ${money(Math.max(0, s.fl.target - s.fl.sales))}</div>`, 'hi') : '') +
        `<div class="shk">${kp('Πελάτες', s.n)}${kp('Goldwell φέτος', money(s.ty), s.ty >= s.ly ? 'up' : 'dn')}${kp('Πέρσι ίδια περίοδο', money(s.ly))}${kp('Επισκέψεις 30 ημ.', s.v30 + ' <small class="mu">σε ' + s.visited + ' πελ.</small>')}` +
        `${kp('Συμφωνίες', s.deals.length ? s.deals.length + ' · ' + pct(s.dt, s.dg) + '%' : '—')}${kp('Υπόλοιπα', money(s.debt), s.debt ? 'dn' : '')}</div><div style="height:10px"></div>` +
        H.box('Εκκρεμότητες που πέρασαν (' + s.late.length + ')', rows(s.late.slice(0, 8), (e) => `<div class="shr"><span><b>${esc(e.name)}</b><div class="mu">${esc(e.t)}</div></span><span class="dn" style="white-space:nowrap">${esc(u.fd(e.d))}</span></div>`, 'Καμία.')) +
        H.box('Τελευταίες σημειώσεις', noteRows(s.notes.slice(0, 8))) +
        H.box('Καλοί πελάτες χωρίς επίσκεψη 60+ ημέρες (' + s.cold.length + ')', rows(s.cold.slice(0, 8), (c) => `<div class="shr"><span><b>${esc(c.name)}</b><div class="mu">${esc(c.city)} · ${c.last ? 'τελευταία ' + esc(u.fd(c.last)) : 'καμία επίσκεψη'}</div></span><span style="white-space:nowrap">πέρσι ${money(c.ly)}</span></div>`, 'Κανένας. Όλοι οι καλοί πελάτες έχουν επίσκεψη.')) +
        (s.deals.length ? H.box('Συμφωνίες', s.deals.slice(0, 8).map((d) => `<div class="shr"><span>${esc(d.name)}</span><span style="white-space:nowrap">${money(d.ty)} / ${money(d.goal)} · <b class="${d.ty >= d.goal ? 'up' : ''}">${pct(d.ty, d.goal)}%</b></span></div>`).join('')) : '') +
        (s.debtors.length ? H.box('Μεγαλύτερα υπόλοιπα', s.debtors.slice(0, 6).map((d) => `<div class="shr"><span>${esc(d.name)}</span><b class="dn">${money(d.a)}</b></div>`).join('')) : '') +
        H.nav(null, 'Ομάδα');
    },
  });

  /* ---------- Όλες οι ομάδες (διευθυντής) ---------- */
  PL.register('teams', {
    title: 'Όλες οι ομάδες',
    split: ['team', 'member'],
    aside(el) {
      if (!me || me.role !== 'director') return deny(el);
      const L = sellers().map((x) => ({ x, s: stats(x.id) })).sort((a, b) => (b.s.fl ? b.s.fl.sales / (b.s.fl.target || 1) : 0) - (a.s.fl ? a.s.fl.sales / (a.s.fl.target || 1) : 0));
      el.innerHTML = `<h2>Κατάταξη πωλητών</h2><p class="mu">FLASH ${esc(month(L.map((z) => z.s)))} · στόχος μήνα ${RO}</p>` +
        PL.sheet.box('Όλοι οι πωλητές', L.map(({ x, s }, k) => { const p = s.fl ? pct(s.fl.sales, s.fl.target) : 0;
          return `<div class="tmrk" data-mem="${esc(x.id)}"><span class="tmn1">${k + 1}</span><div><b>${esc(x.name)}</b><div class="mu">${esc((team(x.team) || {}).name || '')}</div>${bar(p)}</div><b class="${pc(p)}">${p}%</b></div>`; }).join(''));
      el.addEventListener('click', (ev) => { const c = ev.target.closest('[data-mem]'); if (c) PL.nav.push('member', { id: c.dataset.mem }); });
    },
    render(el) {
      if (!me || me.role !== 'director') return deny(el);
      const all = D.TEAMS.map((t) => { const L = sellers(t.id).map((x) => ({ x, s: stats(x.id) })); return { t, L, T: total(L.map((z) => z.s)) }; });
      const S = [].concat(...all.map((a) => a.L.map((z) => z.s))), T = total(S);
      el.innerHTML = `<h2 class="tmh">${ICON.org}Όλες οι ομάδες</h2><p class="mu">${all.length} ομάδες · ${S.length} πωλητές · ${T.n} πελάτες ${RO}</p>` + kpis(T, month(S)) + '<h3>Ομάδες</h3>' +
        all.map(({ t, L, T: tt }) => { const lead = L.find(({ x }) => x.role === 'lead'), p = pct(tt.sales, tt.target);
          return `<div class="card tmteam" data-team="${esc(t.id)}"><div class="row"><span class="nm">${esc(t.name)}</span><b class="${pc(p)}">${p}%</b></div><div class="mu">${lead ? 'Υπεύθυνος ομάδας: ' + esc(lead.x.name) + ' · ' : ''}${L.length} πωλητές · ${tt.n} πελάτες</div>` +
            `<div class="tmfl"><span>FLASH ${esc(month(L.map((z) => z.s)))}: <b>${m0(tt.sales)}</b> / ${m0(tt.target)}</span></div>${bar(p)}` +
            `<div class="tmmini"><span>Goldwell <b class="${tt.ty >= tt.ly ? 'up' : 'dn'}">${yoyTxt(tt.ty, tt.ly) || '—'}</b></span><span>${tt.v30} επισκ. / 30 ημ.</span><span class="${tt.late ? 'dn' : ''}">${tt.late} εκκρ. πέρασαν</span></div>` +
            `<div class="tmppl">${L.map(({ x, s }) => `<button data-mem="${esc(x.id)}"><span class="tmav s">${esc(initials(x.name))}</span>${esc(x.name.split(' ')[0])} <b class="${s.fl ? pc(pct(s.fl.sales, s.fl.target)) : ''}">${s.fl ? pct(s.fl.sales, s.fl.target) + '%' : ''}</b></button>`).join('')}</div>` +
            `<button class="shlink" data-team="${esc(t.id)}">Όλη η ομάδα ›</button></div>`; }).join('');
      el.addEventListener('click', (ev) => {
        const m = ev.target.closest('[data-mem]'); if (m) { PL.nav.push('member', { id: m.dataset.mem }); return; }
        const t = ev.target.closest('[data-team]'); if (t) PL.nav.push('team', { team: t.dataset.team });
      });
    },
  });

  /* ---------- Χρήστες και ρόλοι (διαχειριστής) ---------- */
  const isAdmin = () => me && me.admin;
  const owned = () => { const own = D.ownerMap(), seed = D.seedAll(), n = {}; seed.forEach((c) => { const o = own(c); n[o] = (n[o] || 0) + 1; }); return n; };
  PL.register('users', {
    title: 'Χρήστες και ρόλοι',
    split: ['useredit'],
    aside(el) {
      el.innerHTML = `<h2>Ποιος βλέπει τι</h2>` + PL.sheet.box('Ρόλοι', `<div class="tmrl"><b>Πωλητής</b><span>Τους δικούς του πελάτες (από τις περιοχές του). Γράφει επισκέψεις, σημειώσεις, προγράμματα.</span></div>` +
        `<div class="tmrl"><b>Υπεύθυνος ομάδας</b><span>Ό,τι ο πωλητής για τους δικούς του πελάτες, και «Η ομάδα μου»: τα νούμερα και τις σημειώσεις των πωλητών της ομάδας του, μόνο για ανάγνωση.</span></div>` +
        `<div class="tmrl"><b>Διευθυντής</b><span>Όλες τις ομάδες και όλους τους πωλητές, μόνο για ανάγνωση.</span></div>` +
        `<div class="tmrl"><b>Διαχειριστής εφαρμογής</b><span>Προσθέτει χρήστες, αλλάζει ρόλους, ομάδες και περιοχές. Μπορεί να είναι και πωλητής.</span></div>`) +
        `<p class="mu">Δοκιμαστική έκδοση: οι χρήστες και οι αλλαγές τους μένουν σε αυτή τη συσκευή. Στην κανονική έκδοση μένουν στον server και οι κανόνες ελέγχονται εκεί.</p>`;
    },
    render(el) {
      if (!isAdmin()) { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">Μόνο ο διαχειριστής της εφαρμογής βλέπει αυτή την οθόνη.</p>'; return; }
      const n = owned(), U = D.users();
      const grp = (title, L) => (L.length ? `<h3>${esc(title)}</h3>` + L.map((x) => `<div class="card tmu${x.active ? '' : ' off'}" data-uid="${esc(x.id)}"><div class="row"><span class="nm"><span class="tmav s">${esc(initials(x.name))}</span>${esc(x.name)}</span><span class="tmrole ${esc(x.role)}">${esc(D.ROLES[x.role])}</span></div>` +
        `<div class="mu">${esc(x.email)}${x.role !== 'director' ? ' · ' + (n[x.id] || 0) + ' πελάτες' : ''}${x.admin ? ' · 🛠 διαχειριστής' : ''}${x.active ? '' : ' · ανενεργός'}</div></div>`).join('') : '');
      el.innerHTML = `<h2 class="tmh">${ICON.users}Χρήστες και ρόλοι</h2><p class="mu">${U.filter((x) => x.active).length} ενεργοί χρήστες · ${D.TEAMS.length} ομάδες</p>` +
        `<p><button class="pri" id="tmnew">+ Νέος χρήστης</button></p>` +
        grp('Διεύθυνση', U.filter((x) => x.role === 'director')) + D.TEAMS.map((t) => grp(t.name, U.filter((x) => x.role !== 'director' && x.team === t.id).sort((a, b) => (a.role === 'lead' ? -1 : b.role === 'lead' ? 1 : 0)))).join('') +
        grp('Χωρίς ομάδα', U.filter((x) => x.role !== 'director' && !team(x.team))) +
        `<p class="mu tmfoot">Οι πελάτες μοιράζονται στους πωλητές από τις περιοχές τους. Όσοι δεν ανήκουν σε καμία περιοχή πάνε στον διαχειριστή.</p>` +
        `<p><button id="tmrst">Επαναφορά αρχικών χρηστών</button></p>`;
      el.addEventListener('click', async (ev) => {
        const c = ev.target.closest('[data-uid]'); if (c) { PL.nav.push('useredit', { id: c.dataset.uid }); return; }
        if (ev.target.id === 'tmnew') PL.nav.push('useredit', { id: 'new' });
        else if (ev.target.id === 'tmrst') {
          if (!(await PL.dlg.confirm('Να γυρίσουν οι χρήστες, οι ρόλοι και οι περιοχές όπως ήταν στην αρχή; Οι σημειώσεις και οι επισκέψεις των πωλητών μένουν.', 'Ναι, επαναφορά'))) return;
          D.resetUsers();
        }
      });
    },
  });

  PL.register('useredit', {
    title: 'Χρήστης',
    render(el, params) {
      if (!isAdmin()) { el.innerHTML = '<p class="mu">Μόνο ο διαχειριστής.</p>'; return; }
      const U = D.users(), isNew = params.id === 'new';
      const x = isNew ? { id: 'u' + Date.now().toString(36), name: '', email: '', role: 'sales', team: D.TEAMS[0].id, code: '', cities: [], active: true } : U.find((z) => z.id === params.id);
      if (!x) { el.innerHTML = '<p class="mu">Δεν βρέθηκε ο χρήστης.</p>'; return; }
      const self = x.id === me.id, n = owned();
      /* περιοχές που υπάρχουν στο πελατολόγιο και ποιος τις έχει τώρα */
      const own = D.ownerMap(true), areas = {}; D.seedAll().forEach((c) => { if (own(c)) return; const k = c.area && c.area !== c.city ? c.city + '|' + c.area : c.city; areas[k] = (areas[k] || 0) + 1; });
      const freeA = Object.entries(areas).sort((a, b) => b[1] - a[1]);
      const opt = (v, t, on) => `<option value="${esc(v)}"${on ? ' selected' : ''}>${esc(t)}</option>`;
      el.innerHTML = `<div class="shh"><div><h2>${isNew ? 'Νέος χρήστης' : `<span class="tmav">${esc(initials(x.name))}</span>` + esc(x.name)}</h2><div class="mu">${isNew ? 'Συμπλήρωσε και πάτησε Αποθήκευση' : esc(roleOf(x)) + (x.role !== 'director' ? ' · ' + (n[x.id] || 0) + ' πελάτες τώρα' : '')}</div></div></div>` +
        `<div class="tmform"><label>Όνομα<input id="ufn" value="${esc(x.name)}" placeholder="π.χ. Δημήτρης Αλεξίου"></label>` +
        `<label>Email (για την είσοδο)<input id="ufe" type="email" value="${esc(x.email)}" placeholder="onoma@sales2.demo"></label>` +
        `<label>Ρόλος<select id="ufr">${Object.entries(D.ROLES).map(([k, t]) => opt(k, t, x.role === k)).join('')}</select></label>` +
        `<label id="uftl">Ομάδα<select id="uft">${D.TEAMS.map((t) => opt(t.id, t.name, x.team === t.id)).join('')}</select></label>` +
        `<label id="ufcl">Κωδικός πωλητή στο FLASH<input id="ufc" value="${esc(x.code || '')}" placeholder="π.χ. 009" inputmode="numeric"></label>` +
        `<label id="ufal">Περιοχές (μία σε κάθε γραμμή· «ΠΟΛΗ» ή «ΠΟΛΗ | ΠΕΡΙΟΧΗ»)<textarea id="ufa" rows="6">${esc((x.cities || []).map((k) => k.replace('|', ' | ')).join('\n'))}</textarea></label>` +
        (freeA.length ? `<div id="uffr" class="mu">Περιοχές χωρίς πωλητή (τώρα πάνε στον διαχειριστή) · πάτα για προσθήκη:<div class="tmchips">${freeA.map(([k, c]) => `<button data-addc="${esc(k)}">${esc(k.replace('|', ' | '))} <small>${c}</small></button>`).join('')}</div></div>` : '') +
        `<label class="tmck"><input type="checkbox" id="ufadm"${x.admin ? ' checked' : ''}${self ? ' disabled' : ''}> Διαχειριστής εφαρμογής</label>` +
        `<label class="tmck"><input type="checkbox" id="ufon"${x.active ? ' checked' : ''}${self ? ' disabled' : ''}> Ενεργός (μπορεί να μπει)</label>` +
        `<p class="mu">Κωδικός εισόδου στη δοκιμαστική έκδοση: <b>demo</b>. Στην κανονική, ο χρήστης βάζει δικό του κωδικό με το πρώτο μήνυμα.</p>` +
        `<p><button class="pri" id="ufsave">Αποθήκευση</button> <span id="uferr" class="dn"></span></p></div>` + PL.sheet.nav(null, 'Χρήστες');
      const $ = (s) => el.querySelector(s);
      const sync = () => { const r = $('#ufr').value; ['#uftl', '#ufcl', '#ufal', '#uffr'].forEach((s) => { if ($(s)) $(s).style.display = r === 'director' ? 'none' : ''; }); };
      $('#ufr').addEventListener('change', sync); sync();
      el.addEventListener('click', (ev) => {
        const a = ev.target.closest('[data-addc]');
        if (a) { const t = $('#ufa'); t.value = (t.value.trim() ? t.value.trim() + '\n' : '') + a.dataset.addc.replace('|', ' | '); a.remove(); return; }
        if (ev.target.id !== 'ufsave') return;
        const v = { name: $('#ufn').value.trim(), email: $('#ufe').value.trim().toLowerCase(), role: $('#ufr').value, team: $('#uft').value, code: $('#ufc').value.trim(),
          cities: $('#ufa').value.split('\n').map((k) => k.split('|').map((z) => z.trim().toUpperCase()).filter(Boolean).join('|')).filter(Boolean),
          admin: $('#ufadm').checked, active: $('#ufon').checked };
        const err = (t) => { $('#uferr').textContent = t; };
        if (!v.name) return err('Γράψε όνομα.');
        if (!/^\S+@\S+\.\S+$/.test(v.email)) return err('Το email δεν φαίνεται σωστό.');
        if (U.some((z) => z.id !== x.id && z.email.toLowerCase() === v.email)) return err('Υπάρχει ήδη χρήστης με αυτό το email.');
        if (v.role === 'director') { v.team = ''; v.code = ''; v.cities = []; }
        if (v.role === 'lead' && U.some((z) => z.id !== x.id && z.active && z.role === 'lead' && z.team === v.team)) return err('Η ομάδα έχει ήδη υπεύθυνο. Άλλαξε πρώτα τον άλλον σε πωλητή.');
        const taken = {}; U.forEach((z) => { if (z.id !== x.id) (z.cities || []).forEach((k) => { taken[k] = z.name; }); });
        const clash = v.cities.filter((k) => taken[k]); if (clash.length) return err('Η περιοχή «' + clash[0].replace('|', ' | ') + '» είναι ήδη του/της ' + taken[clash[0]] + '.');
        const nx = Object.assign({}, x, v), L = isNew ? U.concat([nx]) : U.map((z) => (z.id === x.id ? nx : z));
        D.saveUsers(L);
        PL.dlg.toast(isNew ? 'Ο χρήστης προστέθηκε' : 'Αποθηκεύτηκε');
        /* αν άλλαξαν οι περιοχές του συνδεδεμένου, χρειάζεται νέα φόρτωση για να έρθουν οι σωστοί πελάτες */
        if (self && JSON.stringify(x.cities) !== JSON.stringify(nx.cities)) setTimeout(() => location.reload(), 900);
        else PL.nav.back();
      });
    },
  });

  /* ---------- Αρχική: ποιος είναι μέσα + πλακίδια ρόλου ---------- */
  const ICON = {
    team: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    org: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-2.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1V17"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 9-5.2"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.5M18 19.5V21M14.5 17H16M20 17h1.5"/></svg>',
  };
  const tile = (go, params, icon, title, sub, cls) => `<button class="duec tmtile ${cls || ''}" data-tmgo="${esc(go)}" data-tmp="${esc(params || '')}"><span class="dc">${icon}</span><span class="dt"><span class="dl">${title}</span><span class="dm">${sub}</span></span></button>`;
  PL.labActs = PL.labActs || [];
  PL.labActs.push({ page: 'home', mount(root) {
    if (!me) return null;
    const t = team(me.team), box = document.createElement('div'); box.id = 'tmhome';
    let tiles = '';
    if (me.role === 'lead') {
      const L = sellers(me.team).map((x) => stats(x.id)), T = total(L);
      tiles += tile('team', '', ICON.team, 'Η ομάδα μου', `${L.length} πωλητές · FLASH ${pct(T.sales, T.target)}%`, 'lead');
    }
    if (me.role === 'director') {
      const S = sellers().map((x) => stats(x.id)), T = total(S);
      tiles += tile('teams', '', ICON.org, 'Όλες οι ομάδες', `${S.length} πωλητές · FLASH ${pct(T.sales, T.target)}%`, 'dir');
      tiles += D.TEAMS.map((tt) => { const L = sellers(tt.id).map((x) => stats(x.id)), T2 = total(L); return tile('team', tt.id, ICON.team, esc(tt.name), `${L.length} πωλητές · FLASH ${pct(T2.sales, T2.target)}%`, 'lead'); }).join('');
    }
    if (me.admin) tiles += tile('users', '', ICON.users, 'Χρήστες και ρόλοι', D.users().filter((x) => x.active).length + ' χρήστες · ρόλοι, περιοχές', 'adm');
    box.innerHTML = `<div class="tmme"><span class="tmav">${esc(initials(me.name))}</span><div><b>${esc(me.name)}</b> <span class="mu">· ${me.admin ? 'Διαχειριστής' : esc(D.ROLES[me.role])}${t && !me.admin ? ' · ' + esc(t.name) : ''}</span></div><button id="tmout">Αλλαγή</button></div>` + tiles;
    const hh = root.querySelector('.hh'); hh.parentNode.insertBefore(box, hh.nextSibling);
    document.body.classList.toggle('tmdir', me.role === 'director');
    const click = (ev) => {
      if (ev.target.closest('#tmout')) { ev.stopPropagation(); D.logout(); return; }
      const b = ev.target.closest('[data-tmgo]'); if (!b) return;
      ev.stopPropagation(); PL.nav.push(b.dataset.tmgo, b.dataset.tmp ? { team: b.dataset.tmp } : {});
    };
    box.addEventListener('click', click);
    return () => { document.body.classList.remove('tmdir'); };
  } });

  /* ---------- Οθόνη εισόδου ---------- */
  if (D.needLogin) {
    const QUICK = [['u3', '🧑‍💼', 'Πωλητής'], ['u2', '👥', 'Υπεύθυνος ομάδας'], ['u1', '🏢', 'Διευθυντής'], ['u7', '🛠', 'Διαχειριστής']];
    const o = document.createElement('div'); o.id = 'tmlogin'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Είσοδος');
    o.innerHTML = `<form class="tmlb" autocomplete="on"><div class="tmlogo"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#2f6f5e"/><rect x="8" y="19" width="5" height="8" rx="1.5" fill="#fff"/><rect x="14.5" y="14" width="5" height="13" rx="1.5" fill="#fff"/><rect x="21" y="8" width="5" height="19" rx="1.5" fill="#8fe3c6"/></svg><span>Sales<small>2.0</small></span></div>` +
      `<p class="mu">Δοκιμαστική έκδοση · ψεύτικα δεδομένα</p>` +
      `<label>Email<input id="tme" type="email" autocomplete="username" placeholder="onoma@sales2.demo" required></label>` +
      `<label>Κωδικός<input id="tmpw" type="password" autocomplete="current-password" required></label>` +
      `<button class="pri" id="tmgo" type="submit">Είσοδος</button><p id="tmerr" class="dn" aria-live="polite"></p>` +
      `<div class="tmq"><h3>Γρήγορη είσοδος</h3>${QUICK.map(([id, i, r]) => { const x = D.user(id); return x && x.active ? `<button type="button" data-quick="${id}"><span class="tmqi">${i}</span><span><b>${r}</b><small>${esc(x.name)}${x.team && team(x.team) && !x.admin ? ' · ' + esc(team(x.team).name) : ''}</small></span></button>` : ''; }).join('')}</div>` +
      `<p class="mu tmhint">Όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό <b>demo</b>.</p></form>`;
    document.body.appendChild(o); document.body.classList.add('tmlock');
    o.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const x = D.check(o.querySelector('#tme').value, o.querySelector('#tmpw').value);
      if (x) D.login(x.id); else o.querySelector('#tmerr').textContent = 'Λάθος email ή κωδικός.';
    });
    o.addEventListener('click', (ev) => { const b = ev.target.closest('[data-quick]'); if (b) D.login(b.dataset.quick); });
  }
})();
