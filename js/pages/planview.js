/* Ανοιχτό πρόγραμμα ημέρας (ίδιο με της παλιάς σελίδας): στοιχεία περιοχής, ταξινόμηση, κάρτες στάσεων με σύρσιμο, ραντεβού,
   αφαίρεση με λόγο, αλλαγή πελάτη χωρίς τζίρο, προσθήκη πελάτη / νέο κομμωτήριο, Excel, «Για χωρίς σήμα», ΟΚ-αποθήκευση πρόχειρου.
   Το «cur» είναι το ανοιχτό πρόγραμμα· αλλαγές γίνονται σε αυτό και γράφονται με savePlan(). */
(function () {
  const PL = window.PL, u = PL.u, M = PL.model, S = PL.store, E = PL.plans, D = PL.dlg, esc = u.esc, money = u.money, db = () => PL.adapter.db;
  const PV = (PL.planview = {});
  let cur = null;                                    // ανοιχτό πρόγραμμα: {id, saved, cities, created, stops, note, mode, sort, did}
  const plOpen = new Set();                          // στάσεις με ανοιχτές «Προτάσεις»
  let apEdit = -1;                                   // στάση με ανοιχτό πεδίο ραντεβού
  let aOpen = new Set(); try { aOpen = new Set(JSON.parse(localStorage.getItem('aopen') || '[]')); } catch (e) { /* τίποτα */ }
  const aPick = {};
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const pctOf = (ly, ty) => (ly > 0 ? (ty - ly) / ly * 100 : null);
  const pctTxt = (x) => (x == null ? '' : `<span class="${x >= 0 ? 'up' : 'dn'}">${x >= 0 ? '▲ +' : '▼ −'}${Math.abs(x).toFixed(0)}%</span>`);
  const cleanPlan = (p) => ({ sort: p.sort || '', mode: p.mode || '', cities: p.cities, created: p.created, closed: p.mode === 'free' || (p.stops.length > 0 && p.stops.every((s) => s.done)), stops: p.stops, note: p.note || '' });

  /* ---------- Άνοιγμα ---------- */
  PV.open = (id) => PL.nav.push('planview', { id });
  PV.openNew = (p) => { cur = p; if (p.saved) PL.nav.push('planview', { id: p.id }); else { if (!p.did) p.did = 'd' + Date.now(); PL.nav.push('planview', { did: p.did }); } };   // μόλις δημιουργημένο (ίσως και μη αποθηκευμένο)
  PV.current = () => cur;

  /* ---------- Στοιχεία περιοχής ---------- */
  function areaStats(cities) {
    const L = M.clients().filter((c) => cities.includes(c.city) && !c.prospect); let tz = 0, ty = 0, ly = 0, lf = 0, nT = 0, nL = 0, up = 0, dn = 0, lost = 0, debt = 0, over = 0;
    L.forEach((c) => {
      const t = M.tz(c); tz += t; if (t > 0) nT++;
      const g = M.gold(c); if (g) { ly += g[0] || 0; ty += g[1] || 0; lf += g[2] || 0; if ((g[0] || 0) > 0) nL++; if ((g[0] || 0) > 0 && (g[1] || 0) <= 0) lost++; else if ((g[1] || 0) > (g[0] || 0)) up++; else if ((g[1] || 0) < (g[0] || 0)) dn++; }
      const b = S.get('balances', c.i); if (b) { debt += +b.amount || 0; over += +b.over || 0; }
    });
    return { n: L.length, tz, ty, ly, lf, nT, nL, up, dn, lost, debt, over, pct: ly > 0 ? (ty - ly) / ly * 100 : null };
  }
  function areaCats(cities) {
    const CAT = S.get('cats', 'all') || {}, T = {};
    M.clients().forEach((c) => {
      if (!cities.includes(c.city)) return; const d = CAT[c.i]; if (!d) return;
      M.CATN.forEach((k) => { if (!Array.isArray(d[k])) return; const o = T[k] || (T[k] = [0, 0, 0, 0, 0]); o[0] += +d[k][0] || 0; o[1] += +d[k][1] || 0; o[2] += +d[k][2] || 0; if ((+d[k][0] || 0) > 0 && (+d[k][1] || 0) <= 0) o[3]++; if ((+d[k][1] || 0) > 0) o[4]++; });
    });
    const r = M.CATN.filter((k) => T[k] && (T[k][0] || T[k][1] || T[k][2])); if (!r.length) return '';
    return `<div style="margin-top:8px;font-weight:600">Ανά κατηγορία</div><div style="overflow-x:auto"><table class="ctab"><tr><th></th><th>Πέρσι ίδια περ.</th><th>Φέτος</th><th>%</th><th>Πελάτες</th></tr>${r.map((k) => { const [a, b, , l, n] = T[k]; return `<tr><td>${esc(M.CATL[k] || k)}</td><td>${money(a)}</td><td>${money(b)}</td><td>${pctTxt(pctOf(a, b))}</td><td>${n}${l ? ` <span class="dn">−${l}</span>` : ''}</td></tr>`; }).join('')}</table></div>`;
  }
  function areaBody(cities) {
    const a = areaStats(cities);
    return `<div class="row"><span>Τζίρος περιοχής φέτος</span><b>${money(a.tz)}</b></div>
 <div class="row"><span>Goldwell φέτος / πέρσι ίδια περίοδο</span><b>${money(a.ty)} / ${money(a.ly)}</b></div>
 <div class="row"><span>Διαφορά</span><b>${pctTxt(a.pct)} <span class="${a.ty >= a.ly ? 'up' : 'dn'}">(${a.ty >= a.ly ? '+' : '−'}${money(Math.abs(a.ty - a.ly))})</span></b></div>
 <div class="row"><span>Goldwell όλο το περσινό έτος</span><b>${money(a.lf)}</b>${a.lf > 0 ? ` <span class="mu">· έχεις πιάσει ${Math.round(a.ty / a.lf * 100)}%</span>` : ''}</div>
 <div class="row"><span>Πελάτες που αγόρασαν</span><b>${a.nT} φέτος · ${a.nL} πέρσι</b></div>
 <div class="mu" style="margin-top:4px"><span class="up">▲ ${a.up} ανεβαίνουν</span> · <span class="dn">▼ ${a.dn} πέφτουν</span>${a.lost ? ` · <span class="dn">${a.lost} δεν αγόρασαν φέτος</span>` : ''}</div>
 ${areaCats(cities)}${a.debt >= 1 || a.over > 0 ? `<div class="row" style="margin-top:4px"><span>💶 Χρέη περιοχής</span><b>${money(a.debt)}${a.over > 0 ? ` · <span class="dn">υπέρβαση ${money(a.over)}</span>` : ''}</b></div>` : ''}`;
  }
  function areaBox(cities, k, label) {
    const a = areaStats(cities), op = aOpen.has(k);
    return `<div class="warn" style="margin:8px 0;padding:0"><div data-atog="${esc(k)}" style="display:flex;align-items:center;gap:8px;padding:10px;cursor:pointer"><span style="font-size:18px;width:16px">${op ? '▾' : '▸'}</span><span style="flex:1">${label}</span><b>${money(a.tz)}</b> ${pctTxt(a.pct)}</div>${op ? `<div style="padding:0 10px 10px">${areaBody(cities)}</div>` : ''}</div>`;
  }
  function areaSum(cities) {
    const key = cities.slice().sort().join('|');
    if (cities.length < 2) return areaBox(cities, 'all:' + key, 'Στοιχεία περιοχής');
    const pk = (cur && cur.id) || 'x', sel = aPick[pk] && cities.includes(aPick[pk]) ? aPick[pk] : '';
    const chips = `<div style="display:flex;gap:6px;flex-wrap:wrap;margin:8px 0 0">${['', ...cities].map((c) => `<button class="chip${c === sel ? ' on' : ''}" data-apick="${esc(c)}" style="padding:6px 12px;border-radius:99px${c === sel ? ';background:var(--ac);color:#fff;border-color:var(--ac)' : ''}">${c ? esc(c) : 'Όλες οι περιοχές'}</button>`).join('')}</div>`;
    return chips + (sel ? areaBox([sel], 'city:' + sel, 'Στοιχεία ' + esc(sel)) : areaBox(cities, 'all:' + key, 'Στοιχεία όλων των περιοχών'));
  }

  const debtLine = (id) => { const b = S.get('balances', id); if (!b) return ''; const a = +b.amount || 0, o = +b.over || 0, d = +b.bounced || 0; if (Math.abs(a) < 1 && o < 1 && !d) return '';
    return `<div class="debt">💶 Χρέος ${money(a)}${o > 0 ? ` · <span class="dn">υπέρβαση ${money(o)}</span>` : ''}${d ? ` · <span class="dn">διαμαρτυρημένα ${money(d)}</span>` : ''}${b.d ? ` <span class="mu">(${esc(b.d)})</span>` : ''}</div>`; };

  /* ---------- Πρόχειρα (μη αποθηκευμένα προγράμματα) ---------- */
  let pdT = null;
  function draftSave() {
    if (!cur) return;
    if (cur.saved) { if (cur.did) { clearTimeout(pdT); const d = cur.did; delete cur.did; db().remove('pdrafts/' + d).catch(() => {}); S.drop('pdrafts', d); } return; }
    if (!cur.did) cur.did = 'd' + Date.now();
    clearTimeout(pdT); const d = cur.did, x = { cities: cur.cities || [], created: cur.created || u.today(), stops: cur.stops || [], note: cur.note || '', mode: cur.mode || '', sort: cur.sort || '', ts: new Date().toISOString() };
    pdT = setTimeout(() => { const doc = clone(x); db().set('pdrafts/' + d, doc).then(() => S.put('pdrafts', d, doc)).catch(() => {}); }, 600);
  }
  PV.draftsHtml = () => {
    const L = Object.entries(S.all('pdrafts')).sort((a, b) => String(b[1].ts).localeCompare(String(a[1].ts)));
    if (!L.length) return '';
    return '<h3>📝 Πρόχειρα (δεν αποθηκεύτηκαν)</h3>' + L.map(([id, x]) => `<div class="card" style="cursor:default;border-style:dashed"><div class="row"><span class="nm">${esc((x.cities || []).join(' + '))}</span><span class="mu">${(x.stops || []).length} πελάτες</span></div><div class="mu" style="font-size:13px">Τελευταία αλλαγή ${esc((() => { try { return new Date(x.ts).toLocaleString('el-GR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } })())}</div><div style="display:flex;gap:6px;margin-top:8px"><button class="pri" data-pdo="${esc(id)}">▶ Συνέχεια</button><button data-pdx="${esc(id)}">🗑 Διαγραφή</button></div></div>`).join('');
  };
  PV.openDraft = (id) => { const x = S.get('pdrafts', id); if (!x) return; PV.openNew(Object.assign(clone(x), { id: null, saved: false, did: id })); };
  PV.deleteDraft = async (id) => { try { await db().remove('pdrafts/' + id); } catch (e) { /* τίποτα */ } S.drop('pdrafts', id); };

  /* ---------- Οθόνη ---------- */
  PL.register('planview', {
    title: 'Πρόγραμμα',
    split: ['client', 'visit'],
    /* τάμπλετ, τίποτα πατημένο: δεξιά το φύλλο του επόμενου ανοιχτού πελάτη */
    aside(el, params) {
      const p = params.id && S.get('plans', params.id), s = p && (p.stops || []).find((x) => !x.done);
      if (!s) { el.innerHTML = '<p class="mu pgempty">' + (p ? '✅ Όλες οι επισκέψεις έγιναν.' : 'Πάτα έναν πελάτη από τη λίστα.') + '</p>'; return null; }
      return PL.pages.visit.render(el, { pid: params.id, id: s.id });
    },
    nova: () => PL.menu('Πρόγραμμα ημέρας', [
      { e: '👤', label: 'Πρόσθεσε πελάτη', d: 'από το πελατολόγιο', fn: () => { const i = document.getElementById('pladd'); if (i) { i.scrollIntoView({ block: 'center', behavior: 'smooth' }); setTimeout(() => i.focus(), 350); } } },
      { e: '🆕', label: 'Νέο κομμωτήριο', d: 'δεν υπάρχει στη λίστα', fn: () => { const b = document.getElementById('plnewb'); if (b) { b.click(); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); } } },
    ]),
    render(el, params) {
      el.innerHTML = `<h2 id="plt"></h2><div id="plp" class="mu"></div><div id="pllab" class="chips" style="margin:6px 0 0"></div><div id="plsum"></div><div id="plb"></div>
<div style="display:flex;gap:6px;margin-top:12px"><input id="pladd" list="dcl" placeholder="Πρόσθεσε πελάτη…" style="flex:1;min-width:0"><button id="pladdb">Προσθήκη</button></div>
<button id="plpick" style="width:100%;margin-top:6px;padding:12px;border-color:var(--ac);color:var(--ac)">📋 Επιλογή από όλο το πελατολόγιο</button>
<button id="plnewb" style="width:100%;margin-top:6px;padding:12px;border-color:var(--ac);color:var(--ac)">🆕 Νέο κομμωτήριο (δεν υπάρχει στο πελατολόγιο)</button>
<div id="plnew" class="card" style="cursor:default;margin-top:8px" hidden><b>Νέο κομμωτήριο</b>
<div class="mu" style="font-size:13px">Μπαίνει ως προσωρινός πελάτης και προστίθεται στο πρόγραμμα. Όταν ανοιχτεί στο σύστημα, το ενώνεις με τον κανονικό από την καρτέλα του.</div>
<label>Όνομα κομμωτηρίου / ιδιοκτήτη</label><input id="pnn" autocomplete="off"><label>Πόλη</label><input id="pnc" list="ccl" autocomplete="off"><label>Διεύθυνση</label><input id="pna" autocomplete="off">
<label>Τηλέφωνο</label><input id="pnp" type="tel" autocomplete="off"><label>Ώρα ραντεβού (αν έχεις κλείσει)</label><input id="pnh" type="time" style="width:auto"><label>Σημείωση (προαιρετικά)</label><input id="pnt" placeholder="π.χ. νέο σαλόνι, δουλεύει L'Oréal" autocomplete="off">
<p style="display:flex;gap:6px;margin:10px 0 0"><button class="pri" id="pnsave">Προσθήκη στο πρόγραμμα</button><button id="pncancel">Άκυρο</button></p><div id="pnst" class="mu"></div></div>
<p id="plact"></p><span id="dclh"></span>`;
      const $ = (s) => el.querySelector(s);
      /* Δοκιμαστικά (lab/, μόνο στη δοκιμαστική έκδοση): κουμπιά για αυτή τη σελίδα από το PL.labActs = [{page, label, fn(planId)}]. */
      const LA = (PL.labActs || []).filter((x) => x.page === 'planview');
      $('#pllab').innerHTML = LA.map((x, k) => `<button class="chip" data-plab="${k}">${x.label}</button>`).join('');
      $('#pllab').hidden = !LA.length;
      $('#pllab').addEventListener('click', (ev) => { const b = ev.target.closest('[data-plab]'); if (b && cur && cur.saved) LA[+b.dataset.plab].fn(cur.id); });
      let pDrag = null, pLP = null, pNoClick = false, alive = true;
      const canon = E.canonCity;

      const savePlan = async () => { if (!cur || !cur.saved) return; try { await E.savePlan(cur.id, cleanPlan(cur)); } catch (e) { D.toast('Δεν αποθηκεύτηκε η αλλαγή'); } };

      /* ---- σχεδίαση ---- */
      function renderPlan() {
        if (pDrag) { pDrag.pending = true; return; }
        const p = cur; if (!p || !alive) return; const scr = PL.scroller(el), sc = scr.scrollTop;
        $('#plt').textContent = p.cities.join(' + ') + E.modeLbl(p.mode); $('#plsum').innerHTML = areaSum(p.cities);
        const d = p.stops.filter((s) => s.done).length;
        $('#plp').textContent = p.saved ? d + '/' + p.stops.length + ' επισκέψεις · ' + p.created + ' · Κράτα πατημένο έναν πελάτη ή σύρε το ≡ για να αλλάξεις σειρά' : 'Πρόχειρο: αφαίρεσε ή πρόσθεσε πελάτες και πάτα ΟΚ για να αποθηκευτεί. Αν βγεις, κρατιέται στα «Πρόχειρα» του Προγράμματος ημέρας. Τα τικ για τις επισκέψεις εμφανίζονται μετά το ΟΚ.';
        const SOS = S.all('sos');
        let h = '', cc = '', ga = '';
        h += `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px"><span class="mu" style="font-size:13px">Ταξινόμηση:</span><button class="chip ${p.sort !== 'tz' ? 'on' : ''}" data-psort="area">📍 Κατά περιοχή</button><button class="chip ${p.sort === 'tz' ? 'on' : ''}" data-psort="tz">💶 Κατά τζίρο</button></div>`;
        const gkey = (c) => (E.areaOf(c) || '') + '|' + (c.zip || ''), gcnt = {};
        p.stops.forEach((x) => { const c = M.byId(x.id); if (c && !x.done) (gcnt[c.city] = gcnt[c.city] || new Set()).add(gkey(c)); });
        const ord = p.stops.map((s, k) => [s, k]), doneL = ord.filter((x) => x[0].done); let dh = false;
        ord.filter((x) => !x[0].done).concat(doneL).forEach(([s, k]) => {
          const c = M.byId(s.id); if (!c) return;
          if (s.done && !dh) { dh = true; cc = ''; ga = ''; h += `<h3 class="mu" style="margin-top:22px">✓ Ολοκληρωμένες (${doneL.length})</h3>`; }
          if (!s.done && c.city !== cc) { cc = c.city; ga = ''; h += `<h3>${esc(cc)}</h3>`; }
          if (!s.done) { const g = p.sort === 'tz' || (gcnt[c.city] || new Set()).size < 2 ? '' : gkey(c); if (g && g !== ga) { ga = g; h += `<div class="mu" style="margin:10px 0 2px;font-size:12px;letter-spacing:.04em">📍 ${esc(E.areaOf(c) || 'ΤΚ')}${c.zip ? ' · ' + esc(c.zip) : ''}</div>`; } }
          const callb = PL.call.cbtn(c, true), mapb = PL.call.map(c, true), tz = M.tz(c), sos = s.sos || !!SOS[s.id];
          h += `<div class="card pcard" data-sk="${k}" style="cursor:default${s.done ? ';opacity:.55' : ''}"><div style="display:flex;gap:10px;align-items:flex-start">${p.saved ? `<input type="checkbox" data-done="${k}" ${s.done ? 'checked' : ''} style="width:24px;height:24px;margin-top:2px;flex:none">` : ''}<div style="flex:1;min-width:0"><div class="nm" data-open="${esc(c.i)}" style="cursor:pointer${s.done ? ';text-decoration:line-through' : ''}">${s.appt ? `<span class="appt">🕐 ${esc(s.appt)}</span> ` : ''}${PL.names.badge(c)}${PL.prospects.tag(c)}${esc(c.name)}${s.sos ? ' <span class="dn">🆘 SOS</span>' : ''}${s.zero ? ' <span class="mu">· χωρίς τζίρο</span>' : ''}${tz > 0 ? ' <span class="mu" style="font-weight:600;white-space:nowrap">· ' + money(tz) + '</span>' : ''}</div><div class="mu pvad">${esc(c.addr)}</div>${callb || mapb ? `<div class="pvbt">${callb}${mapb}</div>` : ''}${debtLine(c.i)}${(s.why || (s.say || []).length) && plOpen.has(s.id) ? `<div style="margin-top:4px">${esc(s.why || '')}</div>${(s.say || []).length ? `<ul style="margin:4px 0 6px;padding-left:20px">${s.say.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}` : ''}</div><div style="display:flex;flex-direction:column;gap:6px;flex:none;align-items:center"><span class="grip" data-grip="1" aria-label="Μετακίνηση">≡</span><button data-rm="${k}" aria-label="Αφαίρεση" style="padding:2px 10px">✕</button>${s.zero && !s.done ? `<button data-swap="${k}" aria-label="Αλλαγή πελάτη" style="padding:2px 8px">🔄</button>` : ''}</div></div><div class="acts">${s.why || (s.say || []).length ? `<button data-exp="${k}">${plOpen.has(s.id) ? '▾ Λιγότερα' : '▸ Προτάσεις'}</button>` : ''}<button data-open="${esc(c.i)}">Καρτέλα</button>${s.done ? '' : `<button data-appt="${k}">🕐 ${s.appt ? 'Ώρα' : 'Ραντεβού'}</button>`}</div>${apEdit === k ? `<div class="aped"><label style="margin:0;color:var(--tx)">Ραντεβού</label><input type="date" id="apd" value="${esc(s.apptD || p.created || u.today())}"><input type="time" id="apt" value="${esc(s.appt || '')}"><button class="pri" data-apsave="${k}">OK</button>${s.appt ? `<button data-apdel="${k}">Χωρίς ραντεβού</button>` : ''}<button data-apx="1">Άκυρο</button></div>` : ''}</div>`;
          void sos;
        });
        const A = p.stops.filter((s) => s.appt && !s.done && M.byId(s.id)).sort((a, b) => ((a.apptD || '') + a.appt).localeCompare((b.apptD || '') + b.appt));
        if (A.length) h = `<div class="apsum"><b>📅 Ραντεβού:</b> ${A.map((s) => '<b>' + (s.apptD && s.apptD !== p.created ? esc(s.apptD.split('-').reverse().slice(0, 2).join('/')) + ' ' : '') + esc(s.appt) + '</b> ' + esc(M.byId(s.id).name)).join(' · ')}</div>` + h;
        $('#plb').innerHTML = h || '<p class="mu">Κανένας πελάτης.</p>'; scr.scrollTop = sc;
        $('#plact').innerHTML = p.saved ? (p.stops.length && p.stops.every((x) => x.done) ? '<div class="warn" style="font-weight:600">✅ Το πρόγραμμα ολοκληρώθηκε</div>' : '') + '<p style="display:flex;gap:6px;flex-wrap:wrap"><button class="pri" id="plxls">📤 Excel</button><button id="ploff">📴 Για χωρίς σήμα</button><button id="pldel">🗑 Διαγραφή προγράμματος</button></p><div id="plxst" class="mu"></div>' : '<button class="pri" id="plok">ΟΚ — αποθήκευση προγράμματος</button>';
        $('#dclh').innerHTML = PL.dcl() + `<datalist id="ccl">${[...new Set(M.clients().map((c) => c.city))].sort((a, b) => a.localeCompare(b, 'el')).map((k) => `<option value="${esc(k)}">`).join('')}</datalist>`;
        draftSave();
      }
      PV.repaint = renderPlan;
      const offs = [];
      /* το πρόγραμμα που ανοίγει: από τη βάση (id) ή πρόχειρο (did). Μένει στο «cur» όσο γυρνάς μέσα-έξω. */
      const start = () => {
        if (!alive) return;
        if (params.id) { if (!cur || cur.id !== params.id) { const p = S.get('plans', params.id); if (!p) { PL.nav.back(); return; } cur = Object.assign(clone(p), { id: params.id, saved: true }); } }
        else if (params.did) { if (!cur || cur.did !== params.did) { const x = S.get('pdrafts', params.did); if (!x) { PL.nav.back(); return; } cur = Object.assign(clone(x), { id: null, saved: false, did: params.did }); } }
        else { PL.nav.back(); return; }
        renderPlan();
        offs.push(...['plans', 'clients', 'prospects', 'sos', 'balances', 'cats'].map((c) => S.on(c, () => {
          if (cur && cur.saved && c === 'plans') { const p = S.get('plans', cur.id); if (p) { cur = Object.assign(clone(p), { id: cur.id, saved: true }); } else { cur = null; PL.nav.back(); return; } }
          if (apEdit < 0 && cur) renderPlan();
        })));
      };
      Promise.all([E.use(), S.use('pdrafts')]).then(start);

      /* ---- σύρσιμο ---- */
      const pdStart = (card, x, y) => {
        const cards = [...$('#plb').querySelectorAll('.pcard')], p = cards.indexOf(card); if (p < 0) return;
        const top0 = PL.scroller(el).scrollTop, mids = cards.map((c) => { const r = c.getBoundingClientRect(); return r.top + r.height / 2 + top0; });
        const cs = getComputedStyle(card), h = card.offsetHeight + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
        pDrag = { card, cards, p, t: p, mids, h, y0: y + top0 }; card.classList.add('drag'); cards.forEach((c) => { if (c !== card) c.classList.add('shift'); });
        try { navigator.vibrate && navigator.vibrate(25); } catch (e) { /* τίποτα */ }
      };
      const pdMove = (y) => {
        const d = pDrag; if (!d) return;
        const scr = PL.scroller(el); if (y < 90) scr.scrollBy(0, -14); else if (y > innerHeight - 130) scr.scrollBy(0, 14);
        const dy = y + scr.scrollTop - d.y0; d.card.style.transform = 'translateY(' + dy + 'px)';
        const c = d.mids[d.p] + dy; let t = 0; d.mids.forEach((m, i) => { if (i !== d.p && m < c) t++; }); d.t = t;
        d.cards.forEach((e2, i) => { if (i === d.p) return; let o = 0; if (d.p < t && i > d.p && i <= t) o = -d.h; else if (d.p > t && i >= t && i < d.p) o = d.h; e2.style.transform = o ? 'translateY(' + o + 'px)' : ''; });
      };
      const pdEnd = () => {
        const d = pDrag; if (!d) return; pDrag = null; pNoClick = true; setTimeout(() => { pNoClick = false; }, 350);
        if (cur && d.t !== d.p) {
          const mv = cur.stops[+d.cards[d.p].dataset.sk], tg = cur.stops[+d.cards[d.t].dataset.sk];
          if (mv && tg) { cur.stops.splice(cur.stops.indexOf(mv), 1); const i = cur.stops.indexOf(tg); cur.stops.splice(d.t > d.p ? i + 1 : i, 0, mv); if (cur.sort !== 'tz') E.learnRoute(cur.stops).catch(() => {}); renderPlan(); savePlan(); return; }
        }
        renderPlan();
      };
      const onDown = (ev) => {
        const card = ev.target.closest('.pcard'); if (!card || pDrag || !$('#plb').contains(card)) return;
        if (ev.target.closest('[data-grip]')) { ev.preventDefault(); pdStart(card, ev.clientX, ev.clientY); return; }
        if (ev.target.closest('button,input,a')) return;
        const x0 = ev.clientX, y0 = ev.clientY; clearTimeout(pLP && pLP.t);
        pLP = { x0, y0, x: x0, y: y0, t: setTimeout(() => { if (pLP) { pdStart(card, pLP.x, pLP.y); pLP = null; } }, 450) };
      };
      const onMove = (ev) => {
        if (pLP) { pLP.x = ev.clientX; pLP.y = ev.clientY; if (Math.abs(ev.clientX - pLP.x0) > 8 || Math.abs(ev.clientY - pLP.y0) > 8) { clearTimeout(pLP.t); pLP = null; } }
        if (pDrag) { ev.preventDefault(); pdMove(ev.clientY); }
      };
      const onTouch = (ev) => { if (pDrag) ev.preventDefault(); };
      const onUp = () => { if (pLP) { clearTimeout(pLP.t); pLP = null; } if (pDrag) pdEnd(); };
      const onClickCap = (ev) => { if (pNoClick) { ev.stopPropagation(); ev.preventDefault(); } };
      $('#plb').addEventListener('pointerdown', onDown);
      document.addEventListener('pointermove', onMove); document.addEventListener('touchmove', onTouch, { passive: false });
      document.addEventListener('pointerup', onUp); document.addEventListener('pointercancel', onUp);
      el.addEventListener('click', onClickCap, true);
      el.addEventListener('contextmenu', (ev) => { if (ev.target.closest('.pcard')) ev.preventDefault(); });

      /* ---- Για χωρίς σήμα / Excel ---- */
      const planOffline = async () => {
        const p = cur, st = $('#plxst'); if (!p) return;
        const e = (x) => String(x ?? '').replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
        const key = 'off_' + (p.id || 'x'); let h = '', cc = '';
        p.stops.forEach((x, k) => {
          const c = M.byId(x.id); if (!c) return;
          if (c.city !== cc) { cc = c.city; h += `<h2>${e(cc)}</h2>`; }
          const tels = [c.t1, c.t2].concat(c.more || []).filter(Boolean), b = S.get('balances', x.id) || {}, es = M.entries(x.id).slice(0, 2);
          h += `<div class="c${x.done ? ' d' : ''}"><label><input type="checkbox" data-k="${k}" ${x.done ? 'checked' : ''}> <b>${e(c.name)}</b>${x.sos ? ' <span class="r">SOS</span>' : ''}</label>
  <div class="m">${e(c.addr)}${c.area ? ' · ' + e(c.area) : ''}${M.tz(c) > 0 ? ' · τζίρος ' + e(money(M.tz(c))) : ''}</div>
  ${tels.length ? `<div>${tels.map((t) => `<a href="tel:${e(String(t).replace(/[^\d+]/g, ''))}">📞 ${e(t)}</a>`).join(' ')}</div>` : ''}
  ${(+b.amount || 0) >= 1 ? `<div class="r">💶 Χρέος ${e(money(+b.amount))}${(+b.over || 0) > 0 ? ' · υπέρβαση ' + e(money(+b.over)) : ''}</div>` : ''}
  ${x.why ? `<div>${e(x.why)}</div>` : ''}${(x.say || []).length ? `<ul>${x.say.map((y) => `<li>${e(y)}</li>`).join('')}</ul>` : ''}
  ${es.map((n) => `<div class="m">[${e(n.d)}] ${e(n.text || '')}${n.todo ? ' — Να πω: ' + e(n.todo) : ''}</div>`).join('')}
  <textarea data-n="${k}" placeholder="Σημείωση (θα την περάσεις μετά με υπαγόρευση)"></textarea></div>`;
        });
        const html = `<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Πρόγραμμα ${e(p.cities.join(' + '))}</title><style>body{font:16px -apple-system,sans-serif;margin:0;padding:14px;background:#f6f4ef;color:#1f2421}h1{font-size:20px;margin:0 0 4px}h2{font-size:17px;margin:20px 0 6px;color:#2f6f5e}.c{background:#fff;border:1px solid #e2ded4;border-radius:12px;padding:10px;margin:8px 0}.d{opacity:.55}.m{color:#6b716c;font-size:14px;margin:3px 0}.r{color:#b3402e;font-weight:600}a{display:inline-block;margin:4px 6px 4px 0;color:#2f6f5e;font-weight:600}ul{margin:4px 0;padding-left:20px}textarea{width:100%;box-sizing:border-box;margin-top:6px;font:inherit;border:1px solid #e2ded4;border-radius:8px;padding:6px;min-height:40px}input[type=checkbox]{width:20px;height:20px;vertical-align:-4px}</style></head><body>
 <h1>${e(p.cities.join(' + '))}</h1><div class="m">Αντίγραφο για χωρίς σήμα · ${e(p.created)} · τα τικ και οι σημειώσεις εδώ ΔΕΝ περνάνε στο Πελατολόγιο· πέρασέ τα μετά με υπαγόρευση.</div>${h}
 <script>try{var K=${JSON.stringify(key)},S=JSON.parse(localStorage.getItem(K)||'{}');document.querySelectorAll('[data-k]').forEach(function(b){var k='t'+b.dataset.k;if(k in S)b.checked=S[k];b.closest('.c').classList.toggle('d',b.checked);b.onchange=function(){S[k]=b.checked;b.closest('.c').classList.toggle('d',b.checked);localStorage.setItem(K,JSON.stringify(S))}});document.querySelectorAll('[data-n]').forEach(function(t){var k='n'+t.dataset.n;if(S[k])t.value=S[k];t.oninput=function(){S[k]=t.value;localStorage.setItem(K,JSON.stringify(S))}})}catch(e){}<\/script></body></html>`;
        if (!PL.adapter.files.available()) { st.textContent = 'Η λήψη δουλεύει μόνο μέσα στο claude.ai.'; return; }
        try { await PL.adapter.files.save('Programma ' + p.cities.join('-').replace(/[\\/:*?"<>|]/g, '-') + ' ' + p.created + '.html', html); st.textContent = '✓ Αποθηκεύτηκε. Άνοιξέ το από τα Αρχεία του iPhone όταν δεν έχεις σήμα.'; }
        catch (err) { const c = err && err.code; st.textContent = c === 'declined' ? 'Ακυρώθηκε.' : 'Δεν έγινε η λήψη (' + (c || 'σφάλμα') + ').'; }
      };
      let XP = null;
      const loadXlsx = () => { if (window.XLSX) return Promise.resolve(); if (!XP) XP = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; sc.onload = ok; sc.onerror = () => { XP = null; no(new Error('load')); }; document.head.appendChild(sc); }); return XP; };
      const planXlsx = async () => {
        const p = cur, st = $('#plxst'); if (!p) return; st.textContent = 'Ετοιμάζω το Excel…';
        try { await loadXlsx(); } catch (e) { st.textContent = 'Δεν φόρτωσε το Excel. Έλεγξε τη σύνδεση και ξαναπάτα.'; return; }
        const r2 = (x) => Math.round((+x || 0) * 100) / 100;
        const rows = p.stops.map((s, k) => {
          const c = M.byId(s.id) || {}, g = (c.i && M.gold(c)) || [], b = S.get('balances', s.id) || {}, es = M.entries(s.id).filter((e) => e.d >= p.created), e = es[0] || {};
          return { '#': k + 1, 'Πόλη': c.city || '', 'Πελάτης': c.name || '', 'Κωδικός': c.code || '', 'Διεύθυνση': c.addr || '', 'Τηλέφωνο': [c.t1, c.t2].filter(Boolean).join(' / '), 'Επίσκεψη': s.done ? '✓' : '', 'Ημερομηνία': s.doneDate || '', 'Τι συζητήσαμε': es.map((x) => x.text).filter(Boolean).join(' | '), 'Προϊόντα': es.map((x) => x.products).filter(Boolean).join(', '),
            'Να πω': e.todo || '', 'Εκκρεμότητα για': e.next || '', 'Τζίρος φέτος': r2(c.i ? M.tz(c) : 0), 'Goldwell φέτος': r2(g[1]), 'Goldwell πέρσι ίδια περίοδο': r2(g[0]), 'Υπόλοιπο': r2(b.amount), 'Υπέρβαση': r2(b.over), 'SOS': s.sos ? 'SOS' : '', 'Χωρίς τζίρο': s.zero ? 'ναι' : '', 'Πρόταση': s.why || '' };
        });
        const ws = XLSX.utils.json_to_sheet(rows); ws['!cols'] = [4, 14, 28, 9, 26, 22, 9, 11, 40, 22, 30, 13, 12, 12, 14, 11, 11, 6, 10, 40].map((w) => ({ wch: w })); ws['!autofilter'] = { ref: ws['!ref'] };
        const a = areaStats(p.cities);
        const ss = XLSX.utils.aoa_to_sheet([['Πρόγραμμα', p.cities.join(' + ')], ['Ημερομηνία', p.created], ['Επισκέψεις', p.stops.filter((x) => x.done).length + ' / ' + p.stops.length], [],
          ['Τζίρος περιοχής φέτος', r2(a.tz)], ['Goldwell φέτος', r2(a.ty)], ['Goldwell πέρσι ίδια περίοδο', r2(a.ly)], ['Διαφορά %', a.pct == null ? '' : Math.round(a.pct)], ['Goldwell όλο το περσινό', r2(a.lf)],
          ['Πελάτες που αγόρασαν φέτος', a.nT], ['Πελάτες που αγόρασαν πέρσι', a.nL], ['Ανεβαίνουν', a.up], ['Πέφτουν', a.dn], ['Χρέη περιοχής', r2(a.debt)], ['Υπέρβαση', r2(a.over)]]);
        ss['!cols'] = [{ wch: 30 }, { wch: 30 }];
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Πρόγραμμα'); XLSX.utils.book_append_sheet(wb, ss, 'Σύνοψη');
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const fn = 'Programma ' + p.cities.join('-').replace(/[\\/:*?"<>|]/g, '-') + ' ' + p.created + '.xlsx';
        if (!PL.adapter.files.available()) { st.textContent = 'Η λήψη δουλεύει μόνο μέσα στο claude.ai.'; return; }
        try { await PL.adapter.files.save(fn, new Blob([buf])); st.textContent = '✓ Έτοιμο. Από το αρχείο πάτα Κοινοποίηση για να το στείλεις.'; }
        catch (e) { const c = e && e.code; st.textContent = c === 'declined' ? 'Ακυρώθηκε.' : 'Δεν έγινε η λήψη (' + (c || 'σφάλμα') + '). Πες στη συνομιλία του project «στείλε μου σε Excel το πρόγραμμα ' + p.cities.join(' + ') + '» και θα σου το στείλω από εκεί.'; }
      };

      /* ---- αλλαγή πελάτη χωρίς τζίρο ---- */
      async function swapStop(k) {
        const s = cur && cur.stops[k]; if (!s) return; const old = M.byId(s.id), z = S.get('zskip', s.id) || { n: 0 };
        if ((z.n || 0) >= 1 && !(await D.confirm('Τον «' + (old ? old.name : '') + '» τον αλλάζεις για δεύτερη φορά, οπότε δεν θα σου ξαναπροταθεί για 6 μήνες. Συνέχεια;', 'Ναι, αλλαγή'))) return;
        if (!cur) return;
        const q = E.zeroQueue(new Set(cur.cities), new Set(cur.stops.map((x) => x.id))), nx = q.find((c) => old && c.city === old.city) || q[0];
        try { await E.bumpSkip(s.id); } catch (e) { /* τίποτα */ }
        if (!cur) return; const kk = cur.stops.findIndex((x) => x.id === s.id); if (kk < 0) return;
        if (!nx) { D.toast('Δεν υπάρχει άλλος πελάτης χωρίς τζίρο στην περιοχή.'); return; }
        cur.stops[kk] = { id: nx.i, why: 'Νέα πρόταση πελάτη χωρίς τζίρο', say: [], done: false, zero: true }; renderPlan(); savePlan();
        if (PL.adapter.ai.available()) { try { const r = await E.suggestOne(nx); if (!cur) return; const i2 = cur.stops.findIndex((y) => y.id === nx.i); if (i2 >= 0) { cur.stops[i2].why = r.why || cur.stops[i2].why; cur.stops[i2].say = r.say; renderPlan(); savePlan(); } } catch (e) { /* τίποτα */ } }
      }

      /* ---- τικ επίσκεψης ---- */
      el.addEventListener('change', async (ev) => {
        const k = ev.target.dataset.done; if (k === undefined || !cur) return;
        const s = cur.stops[+k], wasAll = cur.stops.every((x) => x.done);
        s.done = ev.target.checked; s.doneDate = s.done ? u.today() : ''; renderPlan(); savePlan();
        E.PLDONE = cur.mode !== 'free' && s.done && !wasAll && cur.stops.every((x) => x.done) ? { p: clone(cur) } : null;
        /* Επίσκεψη και SOS γράφονται στο παρασκήνιο· η ερώτηση δεν περιμένει τη βάση. */
        Promise.all([E.setVisit(s.id, s.done), s.done ? E.clearSos(s.id) : null]).catch(() => D.toast('Δεν αποθηκεύτηκε η επίσκεψη. Δοκίμασε ξανά.'));
        if (s.done) {
          const c = M.byId(s.id);
          if (c && (await D.confirm('Θες να πεις τι έγινε στον «' + c.name + '»;', 'Υπαγόρευση', 'Όχι τώρα'))) PL.dictation.open('Στον πελάτη ' + c.name + ' (' + c.city + '): ');
          else if (E.PLDONE) E.finishPlan();
        }
      });

      /* ---- κλικ ---- */
      el.addEventListener('click', async (ev) => {
        const t = ev.target;
        try {
          const at = t.closest('[data-atog]');
          if (at) { const k = at.dataset.atog; aOpen.has(k) ? aOpen.delete(k) : aOpen.add(k); try { localStorage.setItem('aopen', JSON.stringify([...aOpen])); } catch (e) { /* τίποτα */ } renderPlan(); return; }
          const ap = t.closest('[data-apick]');
          if (ap && cur) { aPick[cur.id || 'x'] = ap.dataset.apick; $('#plsum').innerHTML = areaSum(cur.cities); return; }
          if (!cur) return;
          /* τάμπλετ: πάτημα στην κάρτα ή στο όνομα (όχι σε κουμπί) → φύλλο επίσκεψης δεξιά */
          const pc = t.closest('.pcard');
          if (PL.WIDE.matches && cur.saved && pc && !t.closest('button,input,a,label,select,textarea')) { const s = cur.stops[+pc.dataset.sk]; if (s) PL.nav.push('visit', { pid: cur.id, id: s.id }); return; }
          const op = t.closest('[data-open]');  /* το όνομα του πελάτη ή το «Καρτέλα» */
          if (op) PL.nav.push('client', { id: op.dataset.open });
          else if (t.dataset.rm !== undefined) {
            const k = +t.dataset.rm, c = M.byId((cur.stops[k] || {}).id);
            const RS = [['later', 'Άλλη φορά (ξαναμπαίνει κανονικά)'], ['closed', 'Έκλεισε το κομμωτήριο'], ['no', 'Δεν ενδιαφέρεται'], ['x', 'Άκυρο']];
            const ri = await D.choice('Γιατί βγαίνει ο «' + (c ? c.name : '') + '» από το πρόγραμμα;', RS.map((r) => r[1])), rr = (RS[ri] || ['x'])[0];
            if (rr === 'x' || !cur) return;
            const sid = (cur.stops[k] || {}).id; cur.stops.splice(k, 1); renderPlan(); savePlan();
            if (sid) { try { await E.setExit(sid, rr); } catch (e) { /* τίποτα */ } }
          }
          else if (t.dataset.swap !== undefined) await swapStop(+t.dataset.swap);
          else if (t.dataset.exp !== undefined) { const id = (cur.stops[+t.dataset.exp] || {}).id; plOpen.has(id) ? plOpen.delete(id) : plOpen.add(id); renderPlan(); }
          else if (t.id === 'plok') {
            t.disabled = true; const id = 'pl' + Date.now(); cur.id = id; cur.saved = true; params.id = id; delete params.did;
            try { await E.savePlan(id, cleanPlan(cur)); } catch (e) { cur.saved = false; delete params.id; params.did = cur.did; D.toast('Δεν αποθηκεύτηκε'); t.disabled = false; return; }
            renderPlan();
          }
          else if (t.dataset.psort) { const m = t.dataset.psort; cur.stops = m === 'tz' ? E.tzSort(cur.stops) : E.routeSort(cur.stops); cur.sort = m === 'tz' ? 'tz' : 'area'; renderPlan(); savePlan(); }
          else if (t.id === 'ploff') { t.disabled = true; await planOffline(); t.disabled = false; }
          else if (t.id === 'plxls') { t.disabled = true; await planXlsx(); t.disabled = false; }
          else if (t.id === 'pldel') { $('#plact').innerHTML = `<span>Σίγουρα θες να διαγράψεις το πρόγραμμα «${esc(cur.cities.join(' + '))}»;</span><br><button class="pri" id="pldy" style="background:#d9382f;border-color:#d9382f;margin-top:8px">Ναι, διαγραφή</button> <button id="pldn" style="margin-top:8px">Άκυρο</button>`; }
          else if (t.id === 'pldn') renderPlan();
          else if (t.id === 'pldy') { const id = cur.id; cur = null; try { await E.deletePlan(id); } catch (e) { /* τίποτα */ } PL.nav.back(); }
          else if (t.id === 'pladdb') {
            const id = PL.dclId($('#pladd').value), c = M.byId(id);
            if (!c) { D.toast('Διάλεξε πελάτη από τη λίστα'); return; }
            if (cur.stops.some((s) => s.id === id)) { $('#pladd').value = ''; return; }
            E.insertStop(cur, { id, why: 'Προστέθηκε από εσένα', say: [], done: false, added: true });
            $('#pladd').value = ''; renderPlan(); savePlan();
          }
          else if (t.id === 'plpick') {
            PL.nav.push('smpick', {
              title: 'Για το πρόγραμμα: ' + (cur.cities || []).join(' + ') + ' · όσοι είναι ήδη μέσα φαίνονται γκρι', cities: cur.cities,
              inSet: () => new Set(((cur && cur.stops) || []).map((s) => s.id)),
              onOk: async (ids) => { if (!cur) return; ids.forEach((id) => { if (!M.byId(id) || cur.stops.some((s) => s.id === id)) return; E.insertStop(cur, { id, why: 'Προστέθηκε από εσένα', say: [], done: false, added: true }); }); await savePlan(); },
            });
          }
          else if (t.id === 'plnewb') {
            const f = $('#plnew'); f.hidden = !f.hidden;
            if (!f.hidden) { ['pnn', 'pna', 'pnp', 'pnt', 'pnh'].forEach((k) => { $('#' + k).value = ''; }); $('#pnc').value = (cur.cities && cur.cities[0]) || ''; $('#pnst').textContent = ''; setTimeout(() => $('#pnn').focus(), 50); }
          }
          else if (t.id === 'pncancel') $('#plnew').hidden = true;
          else if (t.id === 'pnsave') {
            const name = $('#pnn').value.trim(), st = $('#pnst');
            if (!name) { st.textContent = 'Γράψε όνομα.'; return; }
            t.disabled = true;
            const prg = (pc, msg) => { st.innerHTML = `<div class="pbw"><div class="pbt"><span>${msg}</span><span>${pc}%</span></div><div class="pbar"><i style="width:${pc}%"></i></div></div>`; };
            prg(10, 'Αποθηκεύω το κομμωτήριο…');
            try {
              const id = await E.newProspect({ name, city: canon($('#pnc').value || ''), addr: $('#pna').value.trim(), phone: $('#pnp').value.trim() }), c = M.byId(id);
              prg(45, 'Αποθηκεύω τη σημείωση…'); const note = $('#pnt').value.trim();
              if (note) { try { await PL.notes.update(id, (d) => { d.code = d.code || 'ΝΕΟΣ'; d.entries.unshift({ d: u.today(), products: '', text: note, todo: '', next: '' }); }); } catch (e) { /* τίποτα */ } }
              const stp = { id, why: 'Νέο κομμωτήριο' + (note ? ': ' + note : ''), say: [], done: false, added: true }, ht = $('#pnh').value; if (ht) { stp.appt = ht; stp.apptD = cur.created || u.today(); }
              E.insertStop(cur, stp); void c;
              prg(75, 'Ενημερώνω το πρόγραμμα…'); await savePlan(); await E.setManual(id); prg(100, 'Έτοιμο'); await new Promise((r) => setTimeout(r, 350));
              st.innerHTML = ''; $('#plnew').hidden = true; renderPlan();
            } catch (e) { st.textContent = 'Δεν αποθηκεύτηκε. Δοκίμασε ξανά.'; }
            t.disabled = false;
          }
          /* ραντεβού */
          else if (t.dataset.appt !== undefined) { apEdit = apEdit === +t.dataset.appt ? -1 : +t.dataset.appt; renderPlan(); setTimeout(() => { const i = document.getElementById('apt'); if (i) i.focus(); }, 50); }
          else if (t.dataset.apx) { apEdit = -1; renderPlan(); }
          else if (t.dataset.apsave !== undefined) {
            const s = cur.stops[+t.dataset.apsave], v = ($('#apt') || {}).value || '', dv = ($('#apd') || {}).value || '';
            if (s) { if (v) { s.appt = v; s.apptD = dv || cur.created || u.today(); } else { delete s.appt; delete s.apptD; } }
            apEdit = -1; renderPlan(); savePlan();
          }
          else if (t.dataset.apdel !== undefined) { const s = cur.stops[+t.dataset.apdel]; if (s) { delete s.appt; delete s.apptD; } apEdit = -1; renderPlan(); savePlan(); }
        } catch (e) { D.toast('Δεν έγινε. Δοκίμασε ξανά.'); }
      });

      return () => {
        alive = false; offs.forEach((f) => f()); PV.repaint = null; apEdit = -1;
        document.removeEventListener('pointermove', onMove); document.removeEventListener('touchmove', onTouch);
        document.removeEventListener('pointerup', onUp); document.removeEventListener('pointercancel', onUp);
        clearTimeout(pLP && pLP.t);
      };
    },
  });

  /* Όταν τελειώσει ένα πρόγραμμα: εφέ «Ολοκληρώθηκε» και γυρνάμε στην Αρχική. */
  E.PLDONE = null;
  E.finishPlan = () => { const pd = E.PLDONE; E.PLDONE = null; if (!pd) return; D.celebrate(pd.p, () => PL.nav.home()); };
})();
