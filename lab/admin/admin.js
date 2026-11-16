/* ΔΕΙΓΜΑ «Διαχείριση» (πρόταση Πασχάλη 17/11/2026· μόνο στη σελίδα diaxeirisi.html του demo, τάμπλετ και υπολογιστής).
   Η Διαχείριση ανοίγει σαν άλλο πρόγραμμα: αριστερά πάνελ με όλες τις επιλογές και υποκατηγορίες (ομάδες, πωλητές,
   χρήστες), δεξιά μία σελίδα κάθε φορά. Η κάτω μπάρα των πωλήσεων κρύβεται· «‹ Πίσω στις πωλήσεις» γυρνά στην εφαρμογή.
   - Επιλογές ανά ρόλο: Υπεύθυνος → Επισκόπηση ομάδας, Η ομάδα μου, Πωλητές της ομάδας. Διευθυντής → Επισκόπηση, Ομάδες,
     Πωλητές όλων. Διαχειριστής → επιπλέον Χρήστες και ρόλοι, Χρήση εφαρμογής. Ποιους πωλητές βλέπει ο καθένας το αποφασίζει
     το PL.adapter.org (ο κανόνας του server), όχι αυτό το αρχείο.
   - «Επισκόπηση» είναι νέα (κάρτες με τα κύρια νούμερα, γράφημα μηνών, «Χρειάζεται προσοχή», πίνακας πωλητών).
     Οι άλλες σελίδες είναι οι υπάρχουσες του lab/team και lab/usage (PL.pages), ζωγραφισμένες στο δεξί μέρος.
     Νούμερα και χρώματα: ΜΟΝΟ από το PL.teamFigures (ίδιοι κανόνες με «Η ομάδα μου»).
   - Όσο είναι ανοιχτή, οι σελίδες της ομάδας/χρηστών που ανοίγουν η μία την άλλη (PL.nav.push/back) μένουν μέσα της.
   - Στο κινητό δεν μπαίνει (απόφαση: «άσε το κινητό προς το παρόν»). Εμφάνιση: lab/admin/admin.css. */
(function () {
  const PL = window.PL, O = PL && PL.adapter && PL.adapter.org, me = O && O.me; if (!me) return;
  const u = PL.u, esc = u.esc, TF = PL.teamFigures;
  const ROOM = matchMedia('(min-width: 760px)');   // τάμπλετ (όρθιο ή πλάγιο) και υπολογιστής
  const LEADS = me.role === 'lead' || me.role === 'director', ADMIN = !!me.admin;
  if (!LEADS && !ADMIN) return;
  const m0 = (n) => Math.round(+n || 0).toLocaleString('el-GR') + ' €';
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const sum = (L, f) => L.reduce((a, x) => a + (+f(x) || 0), 0);
  const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  const short = (n) => { const w = String(n || '').split(/\s+/).filter(Boolean); return w.length > 1 ? w[0] + ' ' + w[w.length - 1][0] + '.' : w[0] || ''; };   // «Γιώργος Π.»
  const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const MN = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
  const LVT = { r: 'χρειάζεται βοήθεια', y: 'θέλει ματιά', g: 'πάει καλά' };
  const SV = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    overview: SV('<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>'),
    team: SV('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    seller: SV('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    users: SV('<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 9-5.2"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.5M18 19.5V21M14.5 17H16M20 17h1.5"/>'),
    usage: SV('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    exit: SV('<path d="M15 5l-7 7 7 7"/>'),
    money: SV('<path d="M17 7.5A5.5 5.5 0 1 0 17 16.5"/><path d="M5 10.5h8M5 13.5h8"/>'),
    target: SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    pin: SV('<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>'),
    clock: SV('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    search: SV('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
    chev: SV('<path d="M9 6l6 6-6 6"/>'),
  };

  /* ---------- νούμερα: πωλητές που βλέπει ο συνδεδεμένος, με τα στοιχεία τους (μία φορά σε κάθε άνοιγμα) ---------- */
  function load() {
    const L = O.sellers().map((x) => ({ x, f: TF.of(x.id) })).filter((r) => r.f);
    const ctx = {}; O.teams().forEach((t) => { ctx[t.id] = TF.ctxOf(L.filter((r) => r.x.team === t.id)); });
    L.forEach((r) => { r.st = TF.status(r.f, ctx[r.x.team] || TF.ctxOf(L)); r.p = TF.fp(r.f); });
    const teams = O.teams().map((t) => ({ t, L: L.filter((r) => r.x.team === t.id) })).filter((g) => g.L.length);
    return { L, teams };
  }
  const tot = (L) => ({ sales: sum(L, (r) => r.f.fl && r.f.fl.now.sales), target: sum(L, (r) => r.f.fl && r.f.fl.now.target) });
  const groupPct = (L) => { const t = tot(L); return pct(t.sales, t.target); };

  /* ---------- Επισκόπηση ---------- */
  const kpi = (icon, cls, label, val, sub, vcls) => `<div class="admkpi"><span class="admki ${cls}">${icon}</span><span class="admkl">${label}</span><b class="${vcls || ''}">${val}</b><small>${sub}</small></div>`;
  function chart(L) {
    const n = Math.max(0, ...L.map((r) => (r.f.fl ? r.f.fl.months.length : 0))); if (!n) return '<p class="mu">Δεν υπάρχουν στοιχεία FLASH.</p>';
    const M = Array.from({ length: n }, (_, i) => ({ s: sum(L, (r) => r.f.fl && r.f.fl.months[i] && r.f.fl.months[i].sales), t: sum(L, (r) => r.f.fl && r.f.fl.months[i] && r.f.fl.months[i].target) }));
    const W = 640, H = 220, pad = 26, bw = (W - 8) / 12, mx = Math.max(1, ...M.map((m) => Math.max(m.s, m.t))), y = (v) => H - pad - v / mx * (H - pad - 14);
    const grid = [0.25, 0.5, 0.75, 1].map((k) => `<line class="g" x1="0" x2="${W}" y1="${y(mx * k)}" y2="${y(mx * k)}"/>`).join('');
    return `<svg class="admch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Πωλήσεις και στόχος ανά μήνα">${grid}` + M.map((m, i) => {
      const x = 4 + i * bw, p = m.t ? m.s / m.t * 100 : 0;
      return `<rect class="b ${TF.pc(p)}${i === n - 1 ? ' cur' : ''}" x="${x + bw * 0.2}" y="${y(m.s)}" width="${bw * 0.6}" height="${H - pad - y(m.s)}" rx="5"><title>${m0(m.s)} / στόχος ${m0(m.t)}</title></rect>` +
        (m.t ? `<line class="t" x1="${x + bw * 0.12}" x2="${x + bw * 0.88}" y1="${y(m.t)}" y2="${y(m.t)}"/>` : '') + `<text x="${x + bw / 2}" y="${H - 6}">${MN[i]}</text>`;
    }).join('') + '</svg>';
  }
  const dot = (lvl) => `<i class="admdot ${lvl}" title="${LVT[lvl]}" aria-label="${LVT[lvl]}"></i>`;
  function attention(L) {
    const S = L.filter((r) => r.st.lvl !== 'g').sort((a, b) => (a.st.lvl === b.st.lvl ? a.p - b.p : a.st.lvl === 'r' ? -1 : 1)).slice(0, 6);
    if (!S.length) return '<p class="admok">👍 Όλοι στον ρυθμό. Κανείς δεν χρειάζεται βοήθεια αυτή τη στιγμή.</p>';
    return S.map((r) => `<button class="admatt" data-k="member" data-id="${esc(r.x.id)}">${dot(r.st.lvl)}<span class="admatn"><b>${esc(r.x.name)}</b>` +
      `<span class="admchips"><i>${esc(r.st.pace)}</i>${r.st.why.slice(0, 3).map((w) => `<i>${esc(w.t)}</i>`).join('')}</span></span><b class="admpct ${r.st.lvl}">${r.f.fl ? r.p + '%' : '—'}</b></button>`).join('');
  }
  /* πίνακας πωλητών: πάτημα στον τίτλο στήλης → ταξινόμηση, πάτημα στη γραμμή → καρτέλα πωλητή */
  const COLS = [
    ['name', 'Πωλητής', (r) => r.x.name],
    ['team', 'Ομάδα', (r) => (O.team(r.x.team) || {}).name || ''],
    ['p', 'Στόχος', (r) => (r.f.fl ? r.p : -1)],
    ['sales', 'Πωλήσεις μήνα', (r) => (r.f.fl ? r.f.fl.now.sales : 0)],
    ['v30', 'Επισκ. 30 ημ.', (r) => r.f.v30],
    ['due', 'Εκκρεμότητες', (r) => r.f.due.length],
    ['debt', 'Υπόλοιπα', (r) => r.f.debt],
  ];
  function table(L, sort, withTeam) {
    const cols = COLS.filter((c) => withTeam || c[0] !== 'team'), c = COLS.find((z) => z[0] === sort.k) || COLS[2];
    const rows = L.slice().sort((a, b) => { const x = c[2](a), y = c[2](b); return (typeof x === 'string' ? x.localeCompare(y, 'el') : x - y) * sort.dir; });
    const cell = (k, r) => ({
      name: `<td class="admtn">${dot(r.st.lvl)}<b>${esc(r.x.name)}</b>${r.x.role === 'lead' ? ' <span class="admtag">υπεύθυν.</span>' : ''}${r.x.id === me.id ? ' <small class="mu">(εσύ)</small>' : ''}</td>`,
      team: `<td>${esc((O.team(r.x.team) || {}).name || '')}</td>`,
      p: `<td><span class="admpct ${r.st.lvl}">${r.f.fl ? r.p + '%' : '—'}</span><span class="admbar"><i class="${r.st.lvl}" style="width:${Math.min(100, r.p)}%"></i>${r.f.fl ? `<u style="left:${Math.min(100, r.f.fl.exp)}%"></u>` : ''}</span></td>`,
      sales: `<td class="num">${r.f.fl ? m0(r.f.fl.now.sales) : '—'}</td>`,
      v30: `<td class="num">${r.f.v30}</td>`,
      due: `<td class="num${r.f.due.length >= 8 ? ' dn' : ''}">${r.f.due.length}</td>`,
      debt: `<td class="num">${m0(r.f.debt)}</td>`,
    })[k];
    return `<div class="admtw"><table class="admtbl"><thead><tr>${cols.map(([k, t]) => `<th data-sort="${k}" class="${k === sort.k ? 'on' : ''}${['sales', 'v30', 'due', 'debt'].includes(k) ? ' num' : ''}">${t}${k === sort.k ? (sort.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead>` +
      `<tbody>${rows.map((r) => `<tr data-k="member" data-id="${esc(r.x.id)}">${cols.map(([k]) => cell(k, r)).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  /* κοινή συμπεριφορά πίνακα: ταξινόμηση στη θέση του */
  function sortable(box, L, withTeam, start) {
    const sort = start || { k: 'p', dir: -1 }, slot = box.querySelector('[data-table]');
    const paint = () => { slot.innerHTML = table(L, sort, withTeam); };
    slot.addEventListener('click', (ev) => { const th = ev.target.closest('[data-sort]'); if (!th) return; ev.stopPropagation(); const k = th.dataset.sort; sort.dir = sort.k === k ? -sort.dir : (k === 'name' || k === 'team' ? 1 : -1); sort.k = k; paint(); });
    paint();
  }
  const teamCards = (teams) => `<div class="admteams">${teams.map((g) => { const p = groupPct(g.L), lead = g.L.find((r) => r.x.role === 'lead'), red = g.L.filter((r) => r.st.lvl === 'r').length;
    return `<button class="admteam" data-k="team" data-team="${esc(g.t.id)}"><span class="admtt">${esc(g.t.name)}</span><span class="mu">${lead ? 'Υπεύθυνος: ' + esc(lead.x.name) : g.L.length + ' πωλητές'}</span>` +
      `<b class="admpct ${TF.pc(p)}">${p}%</b><span class="admbar"><i class="${TF.pc(p)}" style="width:${Math.min(100, p)}%"></i></span><span class="mu">${g.L.length} πωλητές${red ? ` · <b class="dn">${red} χρειάζονται βοήθεια</b>` : ''}</span></button>`; }).join('')}</div>`;

  function overview(box, D) {
    const L = D.L, T = tot(L), p = pct(T.sales, T.target), fl = (L.find((r) => r.f.fl) || { f: {} }).f.fl, dir = me.role === 'director';
    box.innerHTML = `<div class="admkpis">` +
      kpi(IC.money, 'k1', 'Πωλήσεις ' + (fl ? fl.month : ''), m0(T.sales), 'από ' + m0(T.target) + ' στόχο') +
      kpi(IC.target, 'k2', 'Στόχος μήνα', p + '%', fl ? 'έπρεπε ~' + fl.exp + '% σήμερα' : '', 'admpct ' + TF.pc(p)) +
      kpi(IC.pin, 'k3', 'Επισκέψεις 30 ημερών', sum(L, (r) => r.f.v30), 'σε ' + sum(L, (r) => r.f.vc30) + ' πελάτες') +
      kpi(IC.clock, 'k4', 'Εκκρεμότητες', sum(L, (r) => r.f.due.length), 'ανοιχτά υπόλοιπα ' + m0(sum(L, (r) => r.f.debt))) + '</div>' +
      `<div class="admrow"><section class="admcard admwide"><h3>Πωλήσεις ανά μήνα <span class="admleg"><i class="b"></i>πωλήσεις <i class="t"></i>στόχος</span></h3>${chart(L)}</section>` +
      `<section class="admcard"><h3>Χρειάζεται προσοχή</h3><div class="admatts">${attention(L)}</div></section></div>` +
      (dir ? `<section class="admcard"><h3>Ομάδες</h3>${teamCards(D.teams)}</section>` : '') +
      `<section class="admcard"><h3>Πωλητές <span class="mu">· πάτα στήλη για ταξινόμηση</span></h3><div data-table></div></section>`;
    sortable(box, L, dir);
  }
  function sellersView(box, D) {
    box.innerHTML = `<section class="admcard"><h3>${D.L.length} πωλητές <span class="mu">· πάτα στήλη για ταξινόμηση, γραμμή για την καρτέλα</span></h3><div data-table></div></section>`;
    sortable(box, D.L, me.role === 'director', { k: 'name', dir: 1 });
  }
  function teamsView(box, D) { box.innerHTML = `<section class="admcard"><h3>Ομάδες</h3>${teamCards(D.teams)}</section>`; }

  /* ---------- Μενού (ανά ρόλο) ---------- */
  function menu(D) {
    const S = [];
    if (LEADS && D.L.length) {
      S.push({ h: 'Παρακολούθηση' });
      S.push({ k: 'overview', t: 'Επισκόπηση', i: IC.overview });
      if (me.role === 'director') S.push({ k: 'teams', t: 'Ομάδες', i: IC.team, sub: D.teams.map((g) => { const p = groupPct(g.L); return { k: 'team', p: { team: g.t.id }, t: g.t.name, r: p + '%', c: TF.pc(p) }; }) });
      else S.push({ k: 'team', p: { team: me.team }, t: 'Η ομάδα μου', i: IC.team });
      const sub = []; D.teams.forEach((g) => { if (me.role === 'director') sub.push({ h: g.t.name });
        g.L.forEach((r) => sub.push({ k: 'member', p: { id: r.x.id, scope: me.role === 'director' ? '*' : g.t.id }, t: short(r.x.name), full: r.x.name, r: r.f.fl ? r.p + '%' : '—', c: r.st.lvl, dot: r.st.lvl })); });
      S.push({ k: 'sellers', t: 'Πωλητές', i: IC.seller, sub, search: true });
    }
    if (ADMIN) {
      S.push({ h: 'Ρυθμίσεις' });
      const U = O.users().slice().sort((a, b) => a.name.localeCompare(b.name, 'el'));
      S.push({ k: 'users', t: 'Χρήστες και ρόλοι', i: IC.users, search: true,
        sub: [{ k: 'useredit', p: { id: '' }, t: '+ Νέος χρήστης', cls: 'admnew' }].concat(U.map((x) => ({ k: 'useredit', p: { id: x.id }, t: x.name, r: x.admin ? 'διαχ.' : { director: 'διευθ.', lead: 'υπεύθ.', sales: '' }[x.role] || '', off: !x.active }))) });
      S.push({ k: 'usage', t: 'Χρήση εφαρμογής', i: IC.usage });
    }
    return S;
  }
  const same = (a, b) => a.k === b.id && ['team', 'id'].every((q) => !a.p || a.p[q] == null || (b.params || {})[q] === a.p[q]);

  /* ---------- Το πρόγραμμα ---------- */
  const VIEWS = { overview, sellers: sellersView, teams: teamsView };
  const INNER = new Set(['team', 'teams', 'member', 'memcat', 'users', 'useredit', 'usage', 'usageuser', 'overview', 'sellers']);
  let A = null;   // ανοιχτή Διαχείριση: { go(id, params, keep), back() → αν έκανε κάτι }
  const push0 = PL.nav.push, back0 = PL.nav.back;
  PL.nav.push = function (id, params) { if (A && INNER.has(id)) return A.go(id, params || {}, true); return push0.apply(this, arguments); };
  PL.nav.back = function () { if (A && A.back()) return undefined; return back0.apply(this, arguments); };

  PL.register('admin', {
    title: 'Διαχείριση',
    noTop: true,
    render(el) {
      if (!ROOM.matches) { el.innerHTML = '<h2>Διαχείριση</h2><p class="mu">Η Διαχείριση ανοίγει σε τάμπλετ και υπολογιστή.</p>'; return null; }
      const D = load(), S = menu(D), open = new Set(), q = { s: '' };
      let cur = null, hist = [];
      PL.bar.hide('admin'); document.body.classList.add('admmode');
      el.innerHTML = `<div class="adm"><aside class="admside"><div class="admbrand">${PL.about.logo()}<span><b>Sales <sup>2.0</sup></b><small>Διαχείριση</small></span></div>` +
        `<div class="admclock" aria-hidden="true"><b id="admhm"></b><span id="admdate"></span></div><nav class="admnav" id="admnav" aria-label="Διαχείριση"></nav>` +
        `<button class="admexit" id="admexit">${IC.exit}<span>Πίσω στις πωλήσεις</span></button></aside>` +
        `<section class="admmain"><header class="admtop"><div class="admtl"><p class="admcrumb" id="admcrumb"></p><h1 id="admh1"></h1></div>` +
        `<div class="admtools">${PL.fontPick ? PL.fontPick.control() : ''}<span class="admrole">${esc(ADMIN ? 'Διαχειριστής' : O.ROLES[me.role])}</span><span class="admav" title="${esc(me.name)}">${esc(initials(me.name))}</span></div></header>` +
        `<div class="admbody" id="admbody"></div></section></div>`;
      const $ = (s) => el.querySelector(s), body = $('#admbody');
      const tick = () => { const d = new Date(); $('#admhm').textContent = u.pad(d.getHours()) + ':' + u.pad(d.getMinutes()); $('#admdate').textContent = d.toLocaleDateString('el-GR', { weekday: 'short', day: 'numeric', month: 'short' }); };
      tick(); const clk = setInterval(tick, 20000);

      /* πλευρικό μενού: ενότητες, επιλογές, υποκατηγορίες (ανοίγουν όταν πατηθούν ή όταν μέσα τους είναι η σελίδα που βλέπεις) */
      const subOn = (it) => it.sub && it.sub.some((z) => z.k && cur && same(z, cur));
      const item = (it) => `<button class="admi${cur && same(it, cur) && !subOn(it) ? ' on' : ''}${subOn(it) ? ' in' : ''}" data-k="${it.k}" ${it.p ? `data-p="${esc(JSON.stringify(it.p))}"` : ''}>${it.i}<span>${esc(it.t)}</span>${it.sub ? `<i class="admcar${open.has(it.k) ? ' op' : ''}">${IC.chev}</i>` : ''}</button>`;
      const subItem = (z) => (z.h ? `<h5>${esc(z.h)}</h5>` : `<button class="admsi${cur && same(z, cur) ? ' on' : ''}${z.cls ? ' ' + z.cls : ''}${z.off ? ' off' : ''}" data-k="${z.k}" data-p="${esc(JSON.stringify(z.p))}" data-n="${esc(fold(z.full || z.t))}"${z.full ? ` title="${esc(z.full)}"` : ''}>` +
        `${z.dot ? dot(z.dot) : ''}<span>${esc(z.t)}</span>${z.r ? `<em class="${z.c ? 'admpct ' + z.c : ''}">${esc(z.r)}</em>` : ''}</button>`);
      const paintSide = () => {
        $('#admnav').innerHTML = S.map((it) => (it.h ? `<h4>${esc(it.h)}</h4>` : `<div class="admg">${item(it)}${it.sub && open.has(it.k) ? `<div class="admsub">` +
          (it.search ? `<label class="admsrch">${IC.search}<input type="search" data-q="${it.k}" placeholder="Αναζήτηση" value="${esc(q[it.k] || '')}" aria-label="Αναζήτηση στο ${esc(it.t)}"></label>` : '') +
          it.sub.map(subItem).join('') + '</div>' : ''}</div>`)).join('');
        Object.keys(q).forEach((k) => filter(k));
      };
      const filter = (k) => { const s = fold(q[k]), box = el.querySelector(`[data-q="${k}"]`); if (!box) return;
        box.closest('.admsub').querySelectorAll('.admsi').forEach((b) => { b.hidden = !!s && !b.dataset.n.includes(s); }); };
      const crumbs = () => {
        const top = S.find((it) => it.k && (same(it, cur) || subOn(it))), sub = top && top.sub && top.sub.find((z) => z.k && same(z, cur));
        const own = !top || (!sub && !same(top, cur)) ? (PL.pages[cur.id] || {}).title : '';
        return ['Διαχείριση'].concat(top ? [top.t] : []).concat(sub ? [sub.t] : []).concat(own ? [own] : []);
      };
      const paintTop = () => {
        const c = crumbs(); $('#admcrumb').textContent = c.join(' › ');
        $('#admh1').textContent = c[c.length - 1];
      };

      function show(id, params) {
        if (cur && cur.off) { try { cur.off(); } catch (e) { /* τίποτα */ } }
        const box = document.createElement('div'); box.className = 'admpage admv-' + id; body.replaceChildren(box); body.scrollTop = 0;
        cur = { id, params: params || {}, off: null };
        S.forEach((it) => { if (subOn(it)) open.add(it.k); });
        const off = VIEWS[id] ? VIEWS[id](box, D, cur.params) : PL.pages[id] ? PL.pages[id].render(box, cur.params) : null;
        cur.off = typeof off === 'function' ? off : null;
        paintSide(); paintTop();
      }
      /* keep: άνοιξε από μέσα από σελίδα (το «Πίσω» της γυρνά εκεί)· αλλιώς από το μενού (νέα αρχή) */
      const go = (id, params, keep) => { if (keep && cur) hist.push({ id: cur.id, params: cur.params }); else hist = []; show(id, params); };
      A = { go, back: () => { const h = hist.pop(); if (!h) return false; show(h.id, h.params); return true; } };

      el.addEventListener('click', (ev) => {
        if (ev.target.closest('#admexit')) { back0.call(PL.nav); return; }
        if (ev.target.closest('[data-sort], input')) return;
        const b = ev.target.closest('[data-k]'); if (!b || !el.contains(b)) return;
        const k = b.dataset.k, p = b.dataset.p ? JSON.parse(b.dataset.p) : { id: b.dataset.id, team: b.dataset.team };
        if (k === 'member' && !p.scope) p.scope = me.role === 'director' ? '*' : me.team;
        const it = S.find((z) => z.k === k && z.sub);
        if (it && b.classList.contains('admi')) { if (cur && same(it, cur) && open.has(k)) { open.delete(k); paintSide(); return; } open.add(k); }
        go(k, p, !b.closest('.admside'));
      });
      el.addEventListener('input', (ev) => { const k = ev.target.dataset && ev.target.dataset.q; if (k) { q[k] = ev.target.value; filter(k); } });

      show(S.some((it) => it.k === 'overview') ? 'overview' : (S.find((it) => it.k) || { k: 'users' }).k, {});
      return () => { A = null; clearInterval(clk); if (cur && cur.off) { try { cur.off(); } catch (e) { /* τίποτα */ } } PL.bar.unhide('admin'); document.body.classList.remove('admmode'); };
    },
  });

  /* ---------- Είσοδος από την Αρχική (μόνο τάμπλετ/υπολογιστής): ένα κουμπί «Διαχείριση» στη θέση των πλακιδίων ρόλου ---------- */
  (PL.labActs = PL.labActs || []).push({ page: 'home', mount(root) {
    if (!ROOM.matches) return null;
    const host = root.querySelector('#tmhome') || root.querySelector('.hh'); if (!host) return null;
    const D = LEADS ? load() : { L: [] }, p = D.L.length ? groupPct(D.L) : null;
    const sub = [LEADS && D.L.length ? `${D.L.length} πωλητές · στόχος ${p}%` : '', ADMIN ? O.users().filter((x) => x.active).length + ' χρήστες' : ''].filter(Boolean).join(' · ');
    const b = document.createElement('button'); b.className = 'admentry'; b.type = 'button';
    b.innerHTML = `<span class="admei">${IC.overview}</span><span class="admet"><b>Διαχείριση</b><small>${esc(sub)}</small></span><span class="admec">${IC.chev}</span>`;
    b.addEventListener('click', (ev) => { ev.stopPropagation(); push0.call(PL.nav, 'admin'); });
    if (host.id === 'tmhome') host.appendChild(b); else host.parentNode.insertBefore(b, host.nextSibling);
    document.body.classList.add('admhome');
    return () => { b.remove(); document.body.classList.remove('admhome'); };
  } });
})();
