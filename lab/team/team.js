/* ΔΟΚΙΜΑΣΤΙΚΟ «Χρήστες και ρόλοι» (lab/team/, μόνο στη δοκιμαστική έκδοση).
   - Οθόνη εισόδου: email + κωδικός, και γρήγορη είσοδος ανά ρόλο.
   - Αρχική: ποιος είναι μέσα, «Αλλαγή», πλακίδια ανάλογα με τον ρόλο.
   - «Η ομάδα μου» (υπεύθυνος) / «Όλες οι ομάδες» (διευθυντής): λίστα πωλητών → πωλητής σε όλη την οθόνη με γραφήματα,
     → κατηγορία/μάρκα → πελάτες. ΜΟΝΟ ανάγνωση.
   - «Χρήστες και ρόλοι» (διαχειριστής).
   Χρήστες, ομάδες και δεδομένα πωλητών: ΜΟΝΟ από το PL.adapter.org (τους κανόνες πρόσβασης τους κρατά εκείνο).
   Νούμερα: ΜΟΝΟ από το μοντέλο (PL.model.over(δεδομένα πωλητή)) και το PL.flash — οι ίδιοι υπολογισμοί με τις σελίδες
   του πωλητή, ώστε ο υπεύθυνος να βλέπει ακριβώς ό,τι βλέπει ο πωλητής. Εδώ μόνο συνδυάζονται και ζωγραφίζονται. */
(function () {
  const PL = window.PL, O = PL.adapter.org; if (!PL || !O) return;
  const u = PL.u, esc = u.esc, money = u.money, me = O.me, H = PL.sheet;
  const m0 = (n) => Math.round(+n || 0).toLocaleString('el-GR') + ' €';
  const pct = (a, b) => (b ? Math.round(a / b * 100) : 0);
  const yo = (a, b) => (a > 0 ? Math.round((b - a) / a * 100) : null);
  const yoyTxt = (a, b) => { const p = yo(a, b); return p == null ? (b > 0 ? '▲ νέο' : '—') : (p >= 0 ? '▲ +' : '▼ −') + Math.abs(p) + '%'; };
  const yoyCls = (a, b) => (b >= a ? 'up' : 'dn');
  /* χρώμα ποσοστού στόχου: πράσινο από 90%, πορτοκαλί 60–89%, κόκκινο κάτω από 60% (ίδιο σε μπάρα, κύκλο και νούμερο) */
  const pc = (p) => (p >= 90 ? 'up' : p >= 60 ? 'mid' : 'dn');
  const MN = ['Ι', 'Φ', 'Μ', 'Α', 'Μ', 'Ι', 'Ι', 'Α', 'Σ', 'Ο', 'Ν', 'Δ'];
  const MNG = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const initials = (n) => String(n || '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('');
  const RO = '<span class="tmro">🔒 Μόνο ανάγνωση</span>';
  /* «υπεύθυνος + 3 πωλητές» / «3 υπεύθυνοι + 9 πωλητές» από μια λίστα χρηστών */
  const ppl = (U) => { const l = U.filter((x) => x.role === 'lead').length, n = U.length - l; return (l ? (l === 1 ? 'υπεύθυνος' : l + ' υπεύθυνοι') + ' + ' : '') + n + (n === 1 ? ' πωλητής' : ' πωλητές'); };
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ago = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const deny = (el, t) => { el.innerHTML = '<h2>Χωρίς πρόσβαση</h2><p class="mu">' + (t || 'Αυτή η οθόνη είναι για τον υπεύθυνο της ομάδας και τον διευθυντή.') + '</p>'; };
  const sum = (L, f) => L.reduce((a, x) => a + (+f(x) || 0), 0);

  /* ---------- νούμερα ενός πωλητή: από το μοντέλο, πάνω στα δεδομένα του ---------- */
  function figures(M) {
    const T = u.today(), d30 = ago(30), d60 = ago(60), F = M.flash(), FL = PL.flash;
    const tot = (k) => { const r = M.turnover(k); return { a: sum(r, (x) => x.a), b: sum(r, (x) => x.b), rows: r }; };
    const cls = M.clients().filter((c) => !c.prospect);
    const gold = cls.map((c) => M.gold(c)).filter(Boolean);
    const visits = M.visitDates(), last = {}; cls.forEach((c) => { last[c.i] = M.lastVisit(c.i); });
    /* FLASH: ο τρέχων μήνας, οι μήνες ως τώρα, η θέση στην εταιρεία */
    let fl = null;
    if (F && F.m && F.me) {
      const cur = FL.curM(F), rowsOf = (m) => (F.m[m] || []).map(FL.row), mine = (m) => rowsOf(m).find((x) => x.code === F.me) || null;
      const now = mine(cur), ranked = rowsOf(cur).filter((x) => x.target > 0).sort((a, b) => FL.ach(b) - FL.ach(a)), yr = FL.yearRows(F).find((x) => x.code === F.me);
      if (now) fl = { month: MNG[cur - 1], cur, now, rank: ranked.indexOf(now) + 1, of: ranked.length, months: Array.from({ length: cur }, (_, i) => mine(i + 1) || { target: 0, sales: 0, coll: 0 }), year: yr, d: F.d };
    }
    const deals = Object.entries(M.dealsAll()).filter(([k]) => k[0] !== '_' && M.byId(k)).map(([k, x]) => Object.assign({ id: k, name: M.byId(k).name }, x, M.deal(x)));
    const balIds = M.bal.ids();
    const notes = []; cls.forEach((c) => M.entries(c.i).forEach((e) => { if (e && (e.text || e.todo || e.products)) notes.push({ name: c.name, city: c.city, d: e.d || '', text: e.text || '', products: e.products || '', todo: e.todo || '' }); }));
    const [itRows] = M.itemRows(), items = M.itemAgg(itRows);
    return {
      n: cls.length, fl,
      all: tot('ALL'), gold: tot('Goldwell'), hasBrands: M.hasBrands(),
      cats: M.CATN.map((k) => Object.assign({ k, label: M.turnLabel(k) }, tot(k))).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b),
      brands: M.brandKeys().filter((b) => b !== 'GOLDWELL').map((b) => Object.assign({ k: 'B:' + b, label: M.turnLabel('B:' + b) }, tot('B:' + b))).filter((x) => x.a > 0 || x.b > 0).sort((x, y) => y.b - x.b),
      buyTy: gold.filter((g) => g[1] > 0).length, buyLy: gold.filter((g) => g[0] > 0).length,
      newc: gold.filter((g) => g[0] <= 0 && g[1] > 0).length, lost: gold.filter((g) => g[0] > 0 && g[1] <= 0).length,
      v30: visits.filter(([, d]) => d >= d30 && d <= T).length, vc30: new Set(visits.filter(([, d]) => d >= d30 && d <= T).map(([id]) => id)).size,
      weeks: Array.from({ length: 8 }, (_, w) => visits.filter(([, d]) => d > ago((8 - w) * 7) && d <= ago((7 - w) * 7)).length),
      due: M.dueList().map((x) => ({ name: x.c ? x.c.name : '—', d: x.e.next, t: x.e.todo || x.e.nt || 'Επόμενη επαφή' })),
      notes: notes.sort((a, b) => (a.d < b.d ? 1 : -1)),
      cold: cls.filter((c) => !M.out(c.i)).map((c) => ({ c, g: M.gold(c) })).filter((x) => x.g && (+x.g[2] || 0) >= 800 && !(last[x.c.i] >= d60))
        .sort((a, b) => b.g[2] - a.g[2]).map((x) => ({ name: x.c.name, city: x.c.city, ly: +x.g[2], last: last[x.c.i] })),
      deals: deals.sort((a, b) => b.pct - a.pct), dg: sum(deals, (x) => x.goal), dt: sum(deals, (x) => x.ty),
      debt: sum(balIds, (id) => Math.max(0, M.bal.v(id, 'amount'))), over: sum(balIds, (id) => Math.max(0, M.bal.v(id, 'over'))),
      debtors: balIds.filter(M.bal.big).map((id) => ({ name: M.byId(id).name, a: M.bal.v(id, 'amount'), o: M.bal.v(id, 'over') })).sort((a, b) => b.a - a.a),
      itemsTop: items.filter((o) => o.tc > 0).sort((a, b) => b.tc - a.tc).slice(0, 8),
      itemsDrop: items.filter((o) => o.qp > o.qc).sort((a, b) => (b.qp - b.qc) - (a.qp - a.qc)).slice(0, 8),
    };
  }
  const modelOf = (uid) => { const src = O.data(uid); return src ? PL.model.over(src) : null; };
  const figOf = (uid) => { const M = modelOf(uid); return M ? figures(M) : null; };
  /* για τα τεστ: τα νούμερα του συνδεδεμένου από τα ΔΙΚΑ του δεδομένα (PL.store) — πρέπει να είναι ίδια με όσα βλέπει ο υπεύθυνος */
  PL.teamFigures = { own: () => figures(PL.model), of: figOf };

  /* ---------- γραφήματα (SVG, χρώματα από το CSS για ανοιχτό/σκούρο) ---------- */
  const donut = (p, size, sub) => { const r = size / 2 - 8, c = 2 * Math.PI * r, f = Math.max(0, Math.min(p, 100)) / 100 * c;
    return `<svg class="tmdon" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p}% ${sub || ''}"><circle class="tk" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="v ${pc(p)}" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${f} ${c}" transform="rotate(-90 ${size / 2} ${size / 2})"/><text x="50%" y="${sub ? '47%' : '55%'}" class="big" style="font-size:${Math.round(size / 4.3)}px">${p}%</text>${sub ? `<text x="50%" y="66%" class="sm">${sub}</text>` : ''}</svg>`; };
  const bar = (p) => `<div class="tmbar"><i style="width:${Math.max(0, Math.min(100, p))}%" class="${pc(p)}"></i></div>`;
  const spark = (L) => { const mx = Math.max(1, ...L), w = 7; return `<svg class="tmspk" width="${L.length * w}" height="26" aria-hidden="true">${L.map((x, i) => `<rect x="${i * w}" y="${26 - x / mx * 24}" width="5" height="${Math.max(1, x / mx * 24)}" rx="1" class="${i === L.length - 1 ? 'on' : ''}"/>`).join('')}</svg>`; };
  function monthly(months) {
    const W = 340, Hh = 150, n = months.length, bw = W / Math.max(n, 6), mx = Math.max(1, ...months.map((x) => Math.max(x.target, x.sales))), y = (v) => Hh - 18 - v / mx * (Hh - 30);
    return `<svg class="tmch" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Πωλήσεις και στόχος ανά μήνα">` + months.map((x, i) => { const p = x.target ? x.sales / x.target * 100 : 0;
      return `<rect x="${i * bw + 5}" y="${y(x.sales)}" width="${bw - 10}" height="${Hh - 18 - y(x.sales)}" rx="3" class="b ${pc(p)}${i === n - 1 ? ' cur' : ''}"><title>${MNG[i]}: ${m0(x.sales)} / ${m0(x.target)}</title></rect>` +
        (x.target ? `<line x1="${i * bw + 2}" x2="${i * bw + bw - 2}" y1="${y(x.target)}" y2="${y(x.target)}" class="t"/>` : '') + `<text x="${i * bw + bw / 2}" y="${Hh - 3}" class="ax">${MN[i]}</text>`; }).join('') + '</svg>';
  }
  function simpleBars(L, labels, cur) {
    const W = 340, Hh = 96, bw = W / L.length, mx = Math.max(1, ...L);
    return `<svg class="tmch" viewBox="0 0 ${W} ${Hh}" role="img">` + L.map((v, i) => `<rect x="${i * bw + 6}" y="${Hh - 18 - v / mx * (Hh - 34)}" width="${bw - 12}" height="${Math.max(1, v / mx * (Hh - 34))}" rx="3" class="s${i === cur ? ' on' : ''}"/><text x="${i * bw + bw / 2}" y="${Hh - 22 - v / mx * (Hh - 34)}" class="vl">${typeof v === 'number' && v > 999 ? Math.round(v / 1000) + 'χ' : v}</text><text x="${i * bw + bw / 2}" y="${Hh - 3}" class="ax">${labels[i] || ''}</text>`).join('') + '</svg>';
  }
  /* γραμμές πέρσι/φέτος (κατηγορίες, μάρκες) — πατιούνται: data-cat */
  const pairs = (L, who) => { const mx = Math.max(1, ...L.map((x) => Math.max(x.a, x.b)));
    return '<div class="tmleg"><span><i class="ly"></i>πέρσι ίδια περίοδο</span><span><i class="ty"></i>φέτος</span></div>' + L.map((x) => { const dn = x.b < x.a;
      return `<div class="tmpair" data-cat="${esc(x.k)}" data-who="${esc(who)}"><span class="l">${esc(x.label)}</span><span class="bs"><i class="ly" style="width:${x.a / mx * 100}%"></i><i class="ty${dn ? ' dn' : ''}" style="width:${x.b / mx * 100}%"></i></span><span class="r"><b class="${dn ? 'dn' : 'up'}">${yoyTxt(x.a, x.b)}</b><small>${m0(x.b)}</small></span></div>`; }).join(''); };
  const rows = (L, f, empty) => (L.length ? L.map(f).join('') : `<span class="mu">${empty}</span>`);
  const kp = (label, val, cls, sub) => `<div><span>${label}</span><b class="${cls || ''}">${val}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const card = (title, body, cls) => `<section class="tmcard${cls ? ' ' + cls : ''}"><h3>${title}</h3>${body}</section>`;
  const more = (L, n, f, empty, key) => rows(L.slice(0, n), f, empty) + (L.length > n ? `<button class="shlink" data-more="${key}">+ ${L.length - n} ακόμα ▾</button>` : '');

  /* ---------- λίστα πωλητών (ομάδα) ---------- */
  const fp = (f) => (f.fl ? pct(f.fl.now.sales, f.fl.now.target) : 0);
  const sellerRow = (x, f, scope) => { const p = fp(f);
    return `<button class="tmrow${x.id === me.id ? ' me' : ''}" data-mem="${esc(x.id)}" data-scope="${esc(scope)}"><span class="tmav${x.role === 'lead' ? ' l' : ''}">${esc(initials(x.name))}</span><span class="tmrb"><b>${esc(x.name)}${x.id === me.id ? ' <small class="mu">(εσύ)</small>' : ''}</b>` +
      (f.fl ? `${bar(p)}<span class="tmmini"><span>FLASH <b class="${pc(p)}">${p}%</b></span>` : '<span class="tmmini">') +
      `<span>Goldwell <b class="${yoyCls(f.gold.a, f.gold.b)}">${yoyTxt(f.gold.a, f.gold.b)}</b></span><span>${f.v30} επισκ.</span>${f.due.length ? `<span class="dn">${f.due.length} εκκρ.</span>` : ''}</span></span>` +
      (f.fl ? spark(f.fl.months.map((m) => m.sales)) : '') + '<span class="tmchev">›</span></button>'; };
  /* σύγκριση πωλητών ανά κατηγορία: % αλλαγής φέτος/πέρσι (πίνακας-θερμότητα). Κάτω από M.WORKED πέρσι δεν βγαίνει
     ποσοστό (π.χ. 20 € → 2.000 € δεν είναι «+9.900%»): «νέο» αν φέτος πέρασε το όριο, αλλιώς «—». */
  function heat(list) {
    const W = PL.model.WORKED;
    const ks = PL.model.CATN.filter((k) => list.some(({ f }) => f.cats.some((c) => c.k === k)));
    return `<div class="tmheat"><table><thead><tr><th></th><th>Goldwell</th>${ks.map((k) => `<th>${esc(PL.model.CATL[k] || k)}</th>`).join('')}</tr></thead><tbody>` +
      list.map(({ x, f }) => `<tr data-mem="${esc(x.id)}"><th>${esc(x.name.split(' ')[0])}</th>${[{ a: f.gold.a, b: f.gold.b }].concat(ks.map((k) => f.cats.find((c) => c.k === k) || { a: 0, b: 0 })).map((c) => { const p = c.a >= W ? yo(c.a, c.b) : null, nw = c.a < W && c.b >= W;
        return `<td class="${p == null ? (nw ? 'hu' : '') : p >= 5 ? 'hu' : p <= -5 ? 'hd' : 'hm'}">${p == null ? (nw ? 'νέο' : '—') : (p > 0 ? '+' : '') + p + '%'}</td>`; }).join('')}</tr>`).join('') + '</tbody></table></div>';
  }
  function teamSummary(list, title) {
    const t = { target: sum(list, ({ f }) => f.fl && f.fl.now.target), sales: sum(list, ({ f }) => f.fl && f.fl.now.sales), ga: sum(list, ({ f }) => f.gold.a), gb: sum(list, ({ f }) => f.gold.b),
      v30: sum(list, ({ f }) => f.v30), due: sum(list, ({ f }) => f.due.length), n: sum(list, ({ f }) => f.n), debt: sum(list, ({ f }) => f.debt) };
    const mo = (list.find(({ f }) => f.fl) || { f: { fl: { month: '' } } }).f.fl.month, p = pct(t.sales, t.target);
    return `<section class="tmcard tmsum">${donut(p, 112, 'του στόχου')}<div class="tmsumb"><h3>${title} · FLASH ${esc(mo)}</h3><div class="tmbig"><b>${m0(t.sales)}</b> <span class="mu">από ${m0(t.target)}</span></div>` +
      `<div class="tmmini"><span>Goldwell <b class="${yoyCls(t.ga, t.gb)}">${yoyTxt(t.ga, t.gb)}</b></span><span>${t.v30} επισκ. / 30 ημ.</span><span>${t.n} πελάτες</span><span class="${t.due ? 'dn' : ''}">${t.due} εκκρεμότητες</span><span>Υπόλοιπα ${m0(t.debt)}</span></div></div></section>`;
  }
  /* κατάταξη πωλητών στο FLASH του μήνα */
  const ranking = (list, withTeam, cls) => card('FLASH μήνα ανά πωλητή', list.slice().sort((a, b) => fp(b.f) - fp(a.f)).map(({ x, f }, k) => `<button class="tmrk" data-mem="${esc(x.id)}"><span class="tmn1">${k + 1}</span><span class="tmrb"><b>${esc(x.name)}</b>${withTeam ? `<small class="mu">${esc((O.team(x.team) || {}).name || '')}</small>` : ''}${bar(fp(f))}</span><b class="${pc(fp(f))}">${fp(f)}%</b></button>`).join(''), cls);
  const canTeam = (tid) => me && (me.role === 'director' || (me.role === 'lead' && me.team === tid));

  PL.register('team', {
    title: 'Η ομάδα μου',
    render(el, params) {
      const tid = (params && params.team) || me.team, t = O.team(tid); if (!t || !canTeam(tid)) return deny(el);
      const list = O.sellers(tid).map((x) => ({ x, f: figOf(x.id) })), lead = list.filter(({ x }) => x.role === 'lead'), rest = list.filter(({ x }) => x.role !== 'lead');
      el.classList.add('tmpage');
      el.innerHTML = `<div class="tmhead"><h2>${ICON.team}${me.team === tid ? 'Η ομάδα μου' : esc(t.name)}</h2><p class="mu">${esc(t.name)} · ${ppl(list.map(({ x }) => x))} ${RO}</p></div>` +
        `<div class="tmgrid">${teamSummary(list, 'Ομάδα')}` + ranking(list) + card('Κατηγορίες ανά πωλητή · φέτος σε σχέση με πέρσι', heat(list), 'tmwide2') + '</div>' +
        (lead.length ? '<h3 class="tmsec">Υπεύθυνος ομάδας</h3><div class="tmrows">' + lead.map(({ x, f }) => sellerRow(x, f, tid)).join('') + '</div>' : '') +
        '<h3 class="tmsec">Πωλητές</h3><div class="tmrows">' + rest.map(({ x, f }) => sellerRow(x, f, tid)).join('') + '</div>' +
        '<p class="mu tmfoot">Πάτα σε έναν πωλητή για όλα του τα στοιχεία. Τα νούμερα βγαίνουν από τα δεδομένα του κάθε πωλητή, με τους ίδιους υπολογισμούς που βλέπει κι εκείνος.</p>';
      el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-mem]'); if (b) PL.nav.push('member', { id: b.dataset.mem, scope: tid }); });
    },
  });

  /* ---------- ένας πωλητής, σε όλη την οθόνη ---------- */
  const scopeIds = (scope) => O.sellers(scope && scope !== '*' ? scope : '').map((x) => x.id);
  PL.register('member', {
    title: 'Πωλητής',
    render(el, params) {
      const x = O.sellers().find((z) => z.id === params.id), M = x && modelOf(x.id);
      if (!x || !M || (me.role === 'sales')) return deny(el);
      const f = figures(M), t = O.team(x.team), ids = scopeIds(params.scope), k = ids.indexOf(x.id), prev = O.sellers().find((z) => z.id === ids[k - 1]), next = O.sellers().find((z) => z.id === ids[k + 1]);
      const p = fp(f), open = new Set();
      el.classList.add('tmpage');
      const paint = () => {
        el.innerHTML = `<div class="tmtop"><button class="shlink" data-shback="1">‹ ${params.scope === '*' ? 'Όλες οι ομάδες' : 'Ομάδα'}</button><span class="tmpn">${prev ? `<button data-go="${esc(prev.id)}">‹ ${esc(prev.name.split(' ')[0])}</button>` : ''}${next ? `<button data-go="${esc(next.id)}">${esc(next.name.split(' ')[0])} ›</button>` : ''}</span></div>` +
          `<div class="tmwho"><span class="tmav big${x.role === 'lead' ? ' l' : ''}">${esc(initials(x.name))}</span><div><h2>${esc(x.name)}</h2><div class="mu">${esc(O.ROLES[x.role])}${t ? ' · ' + esc(t.name) : ''} · ${f.n} πελάτες</div><div style="margin-top:4px">${RO}</div></div></div>` +
          '<div class="tmgrid">' +
          (f.fl ? `<section class="tmcard tmsum">${donut(p, 120, 'του στόχου')}<div class="tmsumb"><h3>FLASH ${esc(f.fl.month)}</h3><div class="tmbig"><b>${m0(f.fl.now.sales)}</b> <span class="mu">από ${m0(f.fl.now.target)}</span></div>` +
            `<div class="tmmini"><span>${f.fl.now.target > f.fl.now.sales ? 'Λείπουν <b class="dn">' + m0(f.fl.now.target - f.fl.now.sales) + '</b>' : '<b class="up">Πάνω από τον στόχο</b>'}</span><span>Προς εκτέλεση ${m0(f.fl.now.pend)}</span><span>Εισπράξεις ${m0(f.fl.now.coll)}</span>${f.fl.rank ? `<span>${f.fl.rank}ος από ${f.fl.of} στην εταιρεία</span>` : ''}</div></div></section>` : '') +
          `<section class="tmcard tmkp tmwide2">${kp('Γενικός τζίρος φέτος', m0(f.all.b), '', `<span class="${yoyCls(f.all.a, f.all.b)}">${yoyTxt(f.all.a, f.all.b)}</span> · πέρσι ${m0(f.all.a)}`)}` +
            kp('Goldwell φέτος', m0(f.gold.b), '', `<span class="${yoyCls(f.gold.a, f.gold.b)}">${yoyTxt(f.gold.a, f.gold.b)}</span> · πέρσι ${m0(f.gold.a)}`) +
            kp('Πελάτες Goldwell', f.buyTy, '', 'φέτος · πέρσι ' + f.buyLy) + kp('Νέοι / χάθηκαν', `<span class="up">+${f.newc}</span> / <span class="dn">${f.lost}</span>`, '', 'φέτος σε σχέση με πέρσι') +
            kp('Επισκέψεις 30 ημ.', f.v30, '', 'σε ' + f.vc30 + ' πελάτες') + kp('Συμφωνίες', f.deals.length ? pct(f.dt, f.dg) + '%' : '—', f.deals.length ? pc(pct(f.dt, f.dg)) : '', f.deals.length + ' πελάτες') +
            kp('Υπόλοιπα', m0(f.debt), f.debt ? 'dn' : '', f.over ? 'υπερβάσεις ' + m0(f.over) : '') + kp('Εκκρεμότητες σήμερα', f.due.length, f.due.length ? 'dn' : '') + '</section>' +
          (f.fl ? card('FLASH ανά μήνα · πωλήσεις και στόχος (γραμμή)', monthly(f.fl.months) + (f.fl.year ? `<div class="tmmini"><span>Ως τώρα φέτος: <b>${m0(sum(f.fl.months, (m) => m.sales))}</b> από ${m0(sum(f.fl.months, (m) => m.target))}</span><span>Στόχος έτους ${m0(f.fl.year.target)}</span></div>` : '')) +
            card('Εισπράξεις ανά μήνα', simpleBars(f.fl.months.map((m) => Math.round(m.coll)), MN, f.fl.months.length - 1)) : '') +
          card('Επισκέψεις ανά εβδομάδα · τελευταίες 8', simpleBars(f.weeks, ['', '', '', '', '', '', '', 'αυτή'], 7)) +
          card('Τζίρος ανά κατηγορία Goldwell · πάτα για πελάτες', pairs(f.cats, x.id)) +
          (f.brands.length ? card('Άλλες μάρκες · πάτα για πελάτες', pairs(f.brands, x.id)) : '') +
          card('Είδη: μεγαλύτερη πτώση (τεμ. πέρσι → φέτος)', rows(f.itemsDrop, (o) => `<div class="shr"><span>${esc(o.n)}<small class="mu"> · ${o.cp.size} → ${o.cc.size} πελ.</small></span><b class="dn" style="white-space:nowrap">${o.qp} → ${o.qc}</b></div>`, 'Καμία πτώση.')) +
          card('Είδη: κορυφαία φέτος', rows(f.itemsTop, (o) => `<div class="shr"><span>${esc(o.n)}<small class="mu"> · ${o.cc.size} πελ.</small></span><b style="white-space:nowrap">${m0(o.tc)}</b></div>`, '—')) +
          card(`Εκκρεμότητες σήμερα (${f.due.length})`, more(f.due, open.has('due') ? 99 : 6, (e) => `<div class="shr"><span><b>${esc(e.name)}</b><div class="mu">${esc(e.t)}</div></span><span class="dn" style="white-space:nowrap">${esc(u.fd(e.d))}</span></div>`, 'Καμία.', 'due')) +
          card('Τελευταίες σημειώσεις', more(f.notes, open.has('notes') ? 30 : 6, (e) => `<div class="tmn"><div class="mu">${esc(u.fd(e.d))} · <b>${esc(e.name)}</b>${e.city ? ' · ' + esc(e.city) : ''}</div><div>${esc(e.text)}${e.products ? ` <span class="mu">(${esc(e.products)})</span>` : ''}${e.todo ? `<div class="mu">Να πει: ${esc(e.todo)}</div>` : ''}</div></div>`, 'Καμία σημείωση ακόμα.', 'notes')) +
          card(`Καλοί πελάτες χωρίς επίσκεψη 60+ ημέρες (${f.cold.length})`, more(f.cold, open.has('cold') ? 99 : 6, (c) => `<div class="shr"><span><b>${esc(c.name)}</b><div class="mu">${esc(c.city)} · ${c.last ? 'τελευταία ' + esc(u.fd(c.last)) : 'καμία επίσκεψη'}</div></span><span style="white-space:nowrap">πέρσι ${m0(c.ly)}</span></div>`, 'Κανένας.', 'cold')) +
          (f.deals.length ? card('Συμφωνίες', more(f.deals, open.has('deals') ? 99 : 6, (d) => `<div class="tmdl"><span>${esc(d.name)}</span>${bar(d.pct)}<small>${m0(d.ty)} / ${m0(d.goal)} · <b class="${pc(d.pct)}">${Math.round(d.pct)}%</b></small></div>`, '', 'deals')) : '') +
          (f.debtors.length ? card('Μεγαλύτερα υπόλοιπα', more(f.debtors, open.has('debt') ? 99 : 6, (d) => `<div class="shr"><span>${esc(d.name)}${d.o > 0 ? `<div class="mu dn">υπέρβαση ${money(d.o)}</div>` : ''}</span><b class="dn">${money(d.a)}</b></div>`, '', 'debt')) : '') +
          '</div>' + `<p class="mu tmfoot">Στοιχεία orders${f.fl ? ' · FLASH ' + esc(u.fd(f.fl.d)) : ''}.</p>`;
      };
      paint();
      el.addEventListener('click', (ev) => {
        const g = ev.target.closest('[data-go]'); if (g) { PL.nav.back(); PL.nav.push('member', { id: g.dataset.go, scope: params.scope }); return; }
        const m = ev.target.closest('[data-more]'); if (m) { open.add(m.dataset.more); paint(); return; }
        const c = ev.target.closest('[data-cat]'); if (c) PL.nav.push('memcat', { id: c.dataset.who, k: c.dataset.cat });
      });
    },
  });

  /* ---------- κατηγορία/μάρκα ενός πωλητή → πελάτες ---------- */
  PL.register('memcat', {
    title: 'Κατηγορία',
    render(el, params) {
      const x = O.sellers().find((z) => z.id === params.id), M = x && modelOf(x.id); if (!x || !M || me.role === 'sales') return deny(el);
      const r = M.turnover(params.k), A = sum(r, (z) => z.a), B = sum(r, (z) => z.b), W = M.WORKED;
      const stop = r.filter((z) => z.a >= W && z.b <= 0).sort((a, b) => b.a - a.a), down = r.filter((z) => z.b > 0 && z.b < z.a).sort((a, b) => (a.b - a.a) - (b.b - b.a));
      const up = r.filter((z) => z.a > 0 && z.b >= z.a).sort((a, b) => (b.b - b.a) - (a.b - a.a)), nw = r.filter((z) => z.a <= 0 && z.b > 0).sort((a, b) => b.b - a.b);
      const line = (z) => `<div class="shr"><span><b>${esc(z.name)}</b><div class="mu">${esc(z.city)}</div></span><span style="white-space:nowrap;text-align:right">${m0(z.a)} → <b>${m0(z.b)}</b><div class="${z.b >= z.a ? 'up' : 'dn'}" style="font-size:calc(12.5*var(--u))">${yoyTxt(z.a, z.b)}</div></span></div>`;
      el.classList.add('tmpage');
      el.innerHTML = `<div class="tmtop"><button class="shlink" data-shback="1">‹ ${esc(x.name)}</button></div><div class="tmhead"><h2>${esc(M.turnLabel(params.k))}</h2><p class="mu">${esc(x.name)} · πέρσι ίδια περίοδο → φέτος ${RO}</p></div>` +
        `<div class="tmgrid"><section class="tmcard tmkp">${kp('Φέτος', m0(B), yoyCls(A, B), `<span class="${yoyCls(A, B)}">${yoyTxt(A, B)}</span> · πέρσι ${m0(A)}`)}${kp('Πελάτες φέτος', r.filter((z) => z.b > 0).length, '', 'πέρσι ' + r.filter((z) => z.a > 0).length)}${kp('Σταμάτησαν', stop.length, stop.length ? 'dn' : '', 'έπαιρναν ≥ ' + W + ' €')}${kp('Νέοι', nw.length, nw.length ? 'up' : '')}</section>` +
        card(`Σταμάτησαν (${stop.length})`, rows(stop, line, 'Κανένας.')) + card(`Πέφτουν (${down.length})`, rows(down, line, 'Κανένας.')) +
        card(`Ανεβαίνουν (${up.length})`, rows(up, line, 'Κανένας.')) + card(`Νέοι φέτος (${nw.length})`, rows(nw, line, 'Κανένας.')) + '</div>';
    },
  });

  /* ---------- Όλες οι ομάδες (διευθυντής) ---------- */
  PL.register('teams', {
    title: 'Όλες οι ομάδες',
    render(el) {
      if (!me || me.role !== 'director') return deny(el, 'Αυτή η οθόνη είναι για τον διευθυντή.');
      const all = O.teams().map((t) => ({ t, list: O.sellers(t.id).map((x) => ({ x, f: figOf(x.id) })) })), every = [].concat(...all.map((a) => a.list));
      el.classList.add('tmpage');
      el.innerHTML = `<div class="tmhead"><h2>${ICON.org}Όλες οι ομάδες</h2><p class="mu">${all.length} ομάδες · ${ppl(every.map(({ x }) => x))} ${RO}</p></div>` +
        `<div class="tmgrid">${teamSummary(every, 'Εταιρεία')}` +
        ranking(every, true, 'tmrow2') +
        all.map(({ t, list }) => { const p = pct(sum(list, ({ f }) => f.fl && f.fl.now.sales), sum(list, ({ f }) => f.fl && f.fl.now.target)), lead = list.find(({ x }) => x.role === 'lead');
          return `<section class="tmcard tmteam" data-team="${esc(t.id)}"><h3>${esc(t.name)}</h3><div class="tmteamh">${donut(p, 84)}<div><div class="mu">${lead ? 'Υπεύθυνος: ' + esc(lead.x.name) : ''}</div><div class="tmmini"><span>${list.filter(({ x }) => x.role !== 'lead').length} πωλητές</span><span>${sum(list, ({ f }) => f.n)} πελάτες</span><span>Goldwell <b class="${yoyCls(sum(list, ({ f }) => f.gold.a), sum(list, ({ f }) => f.gold.b))}">${yoyTxt(sum(list, ({ f }) => f.gold.a), sum(list, ({ f }) => f.gold.b))}</b></span></div></div></div>` +
            `<div class="tmppl">${list.map(({ x, f }) => `<button data-mem="${esc(x.id)}"><span class="tmav s${x.role === 'lead' ? ' l' : ''}">${esc(initials(x.name))}</span>${esc(x.name.split(' ')[0])} <b class="${pc(fp(f))}">${fp(f)}%</b></button>`).join('')}</div><button class="shlink" data-team="${esc(t.id)}">Όλη η ομάδα ›</button></section>`; }).join('') +
        card('Κατηγορίες ανά πωλητή · φέτος σε σχέση με πέρσι', heat(every), 'tmwide2') + '</div>';
      el.addEventListener('click', (ev) => {
        const m = ev.target.closest('[data-mem]'); if (m) { PL.nav.push('member', { id: m.dataset.mem, scope: '*' }); return; }
        const t = ev.target.closest('[data-team]'); if (t) PL.nav.push('team', { team: t.dataset.team });
      });
    },
  });

  /* ---------- Χρήστες και ρόλοι (διαχειριστής) ---------- */
  PL.register('users', {
    title: 'Χρήστες και ρόλοι',
    render(el) {
      if (!me.admin) return deny(el, 'Μόνο ο διαχειριστής της εφαρμογής βλέπει αυτή την οθόνη.');
      const U = O.users(), n = O.clientCounts(), codes = new Set(U.filter((x) => x.active && x.code).map((x) => x.code)), orphan = Object.entries(n).filter(([c]) => !codes.has(c)).reduce((a, [, v]) => a + v, 0);
      const grp = (title, L) => (L.length ? `<h3 class="tmsec">${esc(title)}</h3><div class="tmrows">` + L.map((x) => `<button class="tmrow tmu${x.active ? '' : ' off'}" data-uid="${esc(x.id)}"><span class="tmav${x.role === 'lead' ? ' l' : x.role === 'director' ? ' d' : ''}">${esc(initials(x.name))}</span><span class="tmrb"><b>${esc(x.name)}</b>` +
        `<span class="tmmini"><span class="tmrole ${esc(x.role)}">${esc(O.ROLES[x.role])}</span>${x.admin ? '<span>🛠 διαχειριστής</span>' : ''}<span>${esc(x.email)}</span>${x.code ? `<span>κωδ. ${esc(x.code)} · ${n[x.code] || 0} πελάτες</span>` : ''}${x.active ? '' : '<span class="dn">ανενεργός</span>'}</span></span><span class="tmchev">›</span></button>`).join('') + '</div>' : '');
      el.classList.add('tmpage');
      el.innerHTML = `<div class="tmhead"><h2>${ICON.users}Χρήστες και ρόλοι</h2><p class="mu">${U.filter((x) => x.active).length} ενεργοί χρήστες · ${O.teams().length} ομάδες</p></div>` +
        `<div class="tmgrid"><section class="tmcard tmwide2"><h3>Ποιος βλέπει τι</h3><div class="tmrl"><b>Πωλητής</b><span>Τους δικούς του πελάτες: όσους έχουν τον κωδικό πωλητή του στο orders.</span></div><div class="tmrl"><b>Υπεύθυνος ομάδας</b><span>Τους δικούς του πελάτες, και τα νούμερα και τις σημειώσεις των πωλητών της ομάδας του, μόνο για ανάγνωση.</span></div><div class="tmrl"><b>Διευθυντής</b><span>Όλες τις ομάδες, μόνο για ανάγνωση.</span></div><div class="tmrl"><b>Διαχειριστής</b><span>Προσθέτει χρήστες και αλλάζει ρόλους και ομάδες. Είναι και πωλητής.</span></div></section></div>` +
        `<p><button class="pri" id="tmnew">+ Νέος χρήστης</button></p>` +
        grp('Διεύθυνση', U.filter((x) => x.role === 'director')) + O.teams().map((t) => grp(t.name, U.filter((x) => x.role !== 'director' && x.team === t.id).sort((a, b) => (a.role === 'lead' ? -1 : b.role === 'lead' ? 1 : 0)))).join('') +
        (orphan ? `<p class="warn">${orphan} πελάτες έχουν κωδικό πωλητή που δεν ανήκει σε ενεργό χρήστη· δεν τους βλέπει κανείς.</p>` : '') +
        `<p class="mu tmfoot">Δοκιμαστική έκδοση: οι αλλαγές μένουν σε αυτή τη συσκευή. Στην κανονική μένουν στον server.</p><p><button id="tmrst">Επαναφορά αρχικών χρηστών</button></p>`;
      el.addEventListener('click', async (ev) => {
        const c = ev.target.closest('[data-uid]'); if (c) { PL.nav.push('useredit', { id: c.dataset.uid }); return; }
        if (ev.target.id === 'tmnew') PL.nav.push('useredit', { id: '' });
        else if (ev.target.id === 'tmrst' && await PL.dlg.confirm('Να γυρίσουν οι χρήστες και οι ρόλοι όπως ήταν στην αρχή; Τα δεδομένα των πωλητών μένουν.', 'Ναι, επαναφορά')) O.resetUsers();
      });
    },
  });

  PL.register('useredit', {
    title: 'Χρήστης',
    render(el, params) {
      if (!me.admin) return deny(el, 'Μόνο ο διαχειριστής.');
      const U = O.users(), n = O.clientCounts(), isNew = !params.id;
      const x = isNew ? { id: 'u' + Date.now().toString(36), name: '', email: '', role: 'sales', team: (O.teams()[0] || {}).id || '', code: '', active: true, admin: false } : U.find((z) => z.id === params.id);
      if (!x) { el.innerHTML = '<p class="mu">Δεν βρέθηκε ο χρήστης.</p>'; return; }
      const self = x.id === me.id, opt = (v, t, on) => `<option value="${esc(v)}"${on ? ' selected' : ''}>${esc(t)}</option>`;
      el.classList.add('tmpage');
      el.innerHTML = `<div class="tmtop"><button class="shlink" data-shback="1">‹ Χρήστες</button></div><div class="tmwho">${isNew ? '' : `<span class="tmav big">${esc(initials(x.name))}</span>`}<div><h2>${isNew ? 'Νέος χρήστης' : esc(x.name)}</h2><div class="mu">${isNew ? 'Συμπλήρωσε και πάτησε Αποθήκευση' : esc(O.ROLES[x.role])}</div></div></div>` +
        `<div class="tmform"><label>Όνομα<input id="ufn" value="${esc(x.name)}" placeholder="π.χ. Δημήτρης Αλεξίου"></label>` +
        `<label>Email (για την είσοδο)<input id="ufe" type="email" value="${esc(x.email)}" placeholder="onoma@sales2.demo"></label>` +
        `<label>Ρόλος<select id="ufr">${Object.entries(O.ROLES).map(([k, t]) => opt(k, t, x.role === k)).join('')}</select></label>` +
        `<label class="ufs">Ομάδα<select id="uft">${O.teams().map((t) => opt(t.id, t.name, x.team === t.id)).join('')}</select></label>` +
        `<label class="ufs">Κωδικός πωλητή στο orders<input id="ufc" value="${esc(x.code || '')}" placeholder="π.χ. 009" inputmode="numeric"><small class="mu" id="ufcn"></small></label>` +
        `<label class="tmck"><input type="checkbox" id="ufadm"${x.admin ? ' checked' : ''}${self ? ' disabled' : ''}> Διαχειριστής εφαρμογής</label>` +
        `<label class="tmck"><input type="checkbox" id="ufon"${x.active ? ' checked' : ''}${self ? ' disabled' : ''}> Ενεργός (μπορεί να μπει)</label>` +
        `<p class="mu">Οι πελάτες έρχονται από τον κωδικό πωλητή, όπως είναι στο orders. Κωδικός εισόδου στη δοκιμαστική: <b>demo</b>· στην κανονική ο καθένας βάζει δικό του.</p>` +
        `<p><button class="pri" id="ufsave">Αποθήκευση</button> <span id="uferr" class="dn"></span></p></div>`;
      const $ = (s) => el.querySelector(s);
      const sync = () => { const dir = $('#ufr').value === 'director'; el.querySelectorAll('.ufs').forEach((z) => { z.style.display = dir ? 'none' : ''; }); const c = $('#ufc').value.trim(); $('#ufcn').textContent = c ? (n[c] || 0) + ' πελάτες με αυτόν τον κωδικό' : ''; };
      $('#ufr').addEventListener('change', sync); $('#ufc').addEventListener('input', sync); sync();
      el.addEventListener('click', (ev) => {
        if (ev.target.id !== 'ufsave') return;
        const v = { name: $('#ufn').value.trim(), email: $('#ufe').value.trim().toLowerCase(), role: $('#ufr').value, team: $('#uft').value, code: $('#ufc').value.trim(), admin: $('#ufadm').checked, active: $('#ufon').checked };
        const err = (t) => { $('#uferr').textContent = t; };
        if (!v.name) return err('Γράψε όνομα.');
        if (!/^\S+@\S+\.\S+$/.test(v.email)) return err('Το email δεν φαίνεται σωστό.');
        if (U.some((z) => z.id !== x.id && z.email.toLowerCase() === v.email)) return err('Υπάρχει ήδη χρήστης με αυτό το email.');
        if (v.role === 'director') { v.team = ''; v.code = ''; }
        if (v.role !== 'director' && !v.code) return err('Ο πωλητής χρειάζεται κωδικό πωλητή.');
        if (v.code && U.some((z) => z.id !== x.id && z.active && z.code === v.code)) return err('Ο κωδικός ' + v.code + ' ανήκει ήδη σε άλλο χρήστη.');
        if (v.role === 'lead' && U.some((z) => z.id !== x.id && z.active && z.role === 'lead' && z.team === v.team)) return err('Η ομάδα έχει ήδη υπεύθυνο. Άλλαξε πρώτα τον άλλον σε πωλητή.');
        O.saveUser(Object.assign({}, x, v));
        PL.dlg.toast(isNew ? 'Ο χρήστης προστέθηκε' : 'Αποθηκεύτηκε');
        if (self) setTimeout(() => location.reload(), 900); else PL.nav.back();
      });
    },
  });

  /* ---------- Αρχική: ποιος είναι μέσα + πλακίδια ρόλου ---------- */
  const ICON = {
    team: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    org: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5M5 17v-2.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1V17"/></svg>',
    users: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 9-5.2"/><circle cx="18" cy="17" r="2.5"/><path d="M18 13v1.5M18 19.5V21M14.5 17H16M20 17h1.5"/></svg>',
  };
  const tile = (go, team, icon, title, sub, cls) => `<button class="duec tmtile ${cls || ''}" data-tmgo="${esc(go)}" data-tmp="${esc(team || '')}"><span class="dc">${icon}</span><span class="dt"><span class="dl">${title}</span><span class="dm">${sub}</span></span></button>`;
  const teamPct = (list) => pct(sum(list, (f) => f && f.fl && f.fl.now.sales), sum(list, (f) => f && f.fl && f.fl.now.target));
  PL.labActs = PL.labActs || [];
  PL.labActs.push({ page: 'home', mount(root) {
    if (!me) return null;
    const t = O.team(me.team), box = document.createElement('div'); box.id = 'tmhome';
    let tiles = '';
    if (me.role === 'lead') { const U = O.sellers(me.team), L = U.map((x) => figOf(x.id)); tiles += tile('team', '', ICON.team, 'Η ομάδα μου', `${ppl(U)} · FLASH ${teamPct(L)}%`, 'lead'); }
    if (me.role === 'director') {
      const U = O.sellers(), S = U.map((x) => figOf(x.id));
      tiles += tile('teams', '', ICON.org, 'Όλες οι ομάδες', `${ppl(U)} · FLASH ${teamPct(S)}%`, 'dir');
      tiles += O.teams().map((tt) => { const U = O.sellers(tt.id), L = U.map((x) => figOf(x.id)); return tile('team', tt.id, ICON.team, esc(tt.name), `${ppl(U)} · FLASH ${teamPct(L)}%`, 'lead'); }).join('');
    }
    if (me.admin) tiles += tile('users', '', ICON.users, 'Χρήστες και ρόλοι', O.users().filter((x) => x.active).length + ' χρήστες · ρόλοι, ομάδες', 'adm');
    box.innerHTML = `<div class="tmme"><span class="tmav">${esc(initials(me.name))}</span><div><b>${esc(me.name)}</b> <span class="mu">· ${me.admin ? 'Διαχειριστής' : esc(O.ROLES[me.role])}${t && !me.admin ? ' · ' + esc(t.name) : ''}</span></div><button id="tmout">Αλλαγή</button></div>` + tiles;
    const hh = root.querySelector('.hh'); hh.parentNode.insertBefore(box, hh.nextSibling);
    document.body.classList.toggle('tmdir', me.role === 'director');
    box.addEventListener('click', (ev) => {
      if (ev.target.closest('#tmout')) { ev.stopPropagation(); O.logout(); return; }
      const b = ev.target.closest('[data-tmgo]'); if (!b) return;
      ev.stopPropagation(); PL.nav.push(b.dataset.tmgo, b.dataset.tmp ? { team: b.dataset.tmp } : {});
    });
    return () => { document.body.classList.remove('tmdir'); };
  } });

  /* ---------- Οθόνη εισόδου ---------- */
  if (!me) {
    const LBL = { director: ['🏢', 'Διευθυντής'], lead: ['👥', 'Υπεύθυνος ομάδας'], sales: ['🧑‍💼', 'Πωλητής'] };
    const o = document.createElement('div'); o.id = 'tmlogin'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Είσοδος');
    o.innerHTML = `<form class="tmlb" autocomplete="on"><div class="tmlogo"><svg viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="9" fill="#2f6f5e"/><rect x="8" y="19" width="5" height="8" rx="1.5" fill="#fff"/><rect x="14.5" y="14" width="5" height="13" rx="1.5" fill="#fff"/><rect x="21" y="8" width="5" height="19" rx="1.5" fill="#8fe3c6"/></svg><span>Sales<small>2.0</small></span></div>` +
      `<p class="mu">Δοκιμαστική έκδοση · ψεύτικα δεδομένα</p>` +
      `<label>Email<input id="tme" type="email" autocomplete="username" placeholder="onoma@sales2.demo" required></label>` +
      `<label>Κωδικός<input id="tmpw" type="password" autocomplete="current-password" required></label>` +
      `<button class="pri" id="tmgo" type="submit">Είσοδος</button><p id="tmerr" class="dn" aria-live="polite"></p>` +
      `<div class="tmq"><h3>Γρήγορη είσοδος</h3>${O.quick().map((x) => { const [i, r] = x.admin ? ['🛠', 'Διαχειριστής'] : LBL[x.role]; const t = O.team(x.team);
        return `<button type="button" data-quick="${esc(x.id)}"><span class="tmqi">${i}</span><span><b>${r}</b><small>${esc(x.name)}${t && !x.admin ? ' · ' + esc(t.name) : ''}</small></span></button>`; }).join('')}</div>` +
      `<p class="mu tmhint">Όλοι οι δοκιμαστικοί λογαριασμοί έχουν κωδικό <b>demo</b>.</p></form>`;
    document.body.appendChild(o); document.body.classList.add('tmlock');
    o.querySelector('form').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const x = O.check(o.querySelector('#tme').value, o.querySelector('#tmpw').value);
      if (x) O.login(x.id); else o.querySelector('#tmerr').textContent = 'Λάθος email ή κωδικός.';
    });
    o.addEventListener('click', (ev) => { const b = ev.target.closest('[data-quick]'); if (b) O.login(b.dataset.quick); });
  }
})();
