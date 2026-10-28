/* «FLASH πωλήσεων & εισπράξεων» (κουμπί στο Πελατολόγιο): η αναφορά 07 του orders, και οι 12 μήνες και σύνολο έτους.
   Στοιχεία στο flash/{έτος} = {d, y, me, cols, m:{μήνας:[[κωδ, πωλητής, στόχος, πωλήσεις, προς εκτέλεση, υπόλ. για 100%, %, υπόλοιπο, υπέρβαση, διαμαρτ., εισπράξεις, εκπτ.%, νέοι]]}}.
   Έρχονται με κάθε ενημέρωση από το orders (μόνο ανάγνωση), και οι μελλοντικοί μήνες (στόχος χωρίς πωλήσεις).
   Το «Σύνολο έτους» το υπολογίζει η σελίδα από τους μήνες: στόχος = άθροισμα και των 12 μηνών. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, esc = u.esc, eur = u.eur, money = u.money;
  const MN = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  const MNL = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const MNG = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const st = { p: '', all: false, sort: 'pct' };
  const R = (r) => ({ code: r[0], name: r[1], target: r[2], sales: r[3], pend: r[4], bal: r[7], over: r[8], prot: r[9], coll: r[10], disc: r[11], newc: r[12] });
  const ach = (x) => (x.target > 0 ? x.sales / x.target * 100 : null);
  /* ο τρέχων μήνας = ο μήνας των στοιχείων (μετά από αυτόν, οι μήνες έχουν μόνο στόχο) */
  const curM = (F) => (String(F.d).slice(0, 4) === String(F.y) ? +String(F.d).slice(5, 7) : 12);

  /* σύνολο έτους ανά πωλητή: άθροισμα μηνών· υπόλοιπα και «προς εκτέλεση» από τον τρέχοντα μήνα· εκπτώσεις σταθμισμένες με τις πωλήσεις */
  function yearRows(F) {
    const ms = Object.keys(F.m).map(Number).sort((a, b) => a - b), c = curM(F), snap = Math.max(...ms.filter((m) => m <= c), ms[0]), by = {};
    ms.forEach((m) => F.m[m].map(R).forEach((x) => {
      const y = by[x.code] || (by[x.code] = { code: x.code, name: x.name, target: 0, sales: 0, pend: 0, bal: 0, over: 0, prot: 0, coll: 0, newc: 0, dw: 0 });
      y.target += x.target; y.sales += x.sales; y.coll += x.coll; y.newc += x.newc; y.dw += x.disc * Math.max(0, x.sales);
      if (m === snap) Object.assign(y, { pend: x.pend, bal: x.bal, over: x.over, prot: x.prot });
    }));
    return Object.values(by).map((y) => Object.assign(y, { disc: y.sales > 0 ? y.dw / y.sales : 0 }));
  }
  const total = (L) => { const t = { name: 'Σύνολο', target: 0, sales: 0, pend: 0, bal: 0, over: 0, prot: 0, coll: 0, newc: 0, dw: 0 };
    L.forEach((x) => { ['target', 'sales', 'pend', 'bal', 'over', 'prot', 'coll', 'newc'].forEach((k) => { t[k] += x[k]; }); t.dw += x.disc * Math.max(0, x.sales); });
    t.disc = t.sales > 0 ? t.dw / t.sales : 0; return t; };

  PL.flash = { yearRows, total, ach, curM };

  PL.register('flash', {
    title: 'FLASH πωλήσεων & εισπράξεων',
    render(el) {
      el.classList.add('gv');
      el.innerHTML = '<h2>📈 FLASH πωλήσεων & εισπράξεων</h2><div class="gsub" id="fld"></div><div class="chips" id="flp" style="flex-wrap:wrap;margin-bottom:10px"></div><div id="flb"></div>';
      const $ = (q) => el.querySelector(q);
      S.use('flash');
      const paint = () => {
        const ys = Object.keys(S.all('flash')).sort(), F = ys.length ? S.get('flash', ys[ys.length - 1]) : null;
        if (!F || !F.m) { $('#flb').innerHTML = `<p class="mu">${S.loaded('flash') ? 'Δεν υπάρχουν ακόμα στοιχεία. Έρχονται με την επόμενη ενημέρωση από το orders.' : 'Φορτώνω…'}</p>`; return; }
        const ms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], cur = curM(F), rowsOf = (m) => (F.m[m] || []).map(R);
        if (!st.p) st.p = String(cur);
        $('#fld').textContent = 'Από το orders (αναφορά 07) · στοιχεία της ' + u.fd(F.d) + ' · ' + F.y;
        $('#flp').innerHTML = ms.map((m) => `<button class="chip${st.p === String(m) ? ' on' : ''}${m > cur ? ' fut' : ''}" data-flp="${m}">${MN[m - 1]}</button>`).join('') + `<button class="chip${st.p === 'Y' ? ' on' : ''}" data-flp="Y">Σύνολο ${F.y}</button>`;
        const Y = st.p === 'Y', fut = !Y && +st.p > cur, L = Y ? yearRows(F) : rowsOf(st.p), T = total(L), me = L.find((x) => x.code === F.me), per = Y ? 'Σύνολο ' + F.y + ' (στόχος και των 12 μηνών)' : MNL[+st.p - 1] + ' ' + F.y + (fut ? ' · δεν έχει ξεκινήσει' : '');
        const ranked = L.filter((x) => x.target > 0).sort((a, b) => ach(b) - ach(a)), rank = me && !fut ? ranked.indexOf(me) + 1 : 0;
        /* στο σύνολο έτους: πού είμαι ως τον τρέχοντα μήνα (στόχος Ιαν–τρέχων) */
        const toNow = Y && me ? ms.filter((m) => m <= cur).reduce((t, m) => t + ((rowsOf(m).find((x) => x.code === F.me) || {}).target || 0), 0) : 0;
        let h = L.length ? '' : '<p class="mu">Δεν υπάρχουν ακόμα στοιχεία για αυτόν τον μήνα. Έρχονται με την επόμενη ενημέρωση από το orders.</p>';
        if (me) {
          const a = ach(me) || 0, gap = me.target - me.sales, w = (v) => (me.target > 0 ? Math.max(0, Math.min(100, v / me.target * 100)) : 0);
          h += `<div class="gcard"><div class="gsub">${esc(per)} · ${esc(me.name)}</div>
<div class="flhero"><span>${eur(me.sales)}</span><span class="mu"> / στόχος ${eur(me.target)}</span></div>
<div class="flbar"><i style="width:${w(me.sales)}%"></i><b style="left:${w(me.sales)}%;width:${Math.max(0, Math.min(100 - w(me.sales), w(me.pend)))}%"></b></div>
<div class="flrow"><b class="${a >= 100 ? 'up' : 'dn'}">${a.toFixed(1).replace('.', ',')}% του στόχου</b>${rank ? `<span class="mu">${rank}ος από ${ranked.length} πωλητές</span>` : ''}</div>
<div class="flgrid">
<div><span class="mu">${gap > 0 ? 'Λείπουν για το 100%' : 'Πάνω από τον στόχο'}</span><b class="${gap > 0 ? 'dn' : 'up'}">${money(Math.abs(gap))}</b></div>
<div><span class="mu">Παραγγελίες προς εκτέλεση</span><b>${money(me.pend)}</b></div>
<div><span class="mu">Εισπράξεις</span><b>${money(me.coll)}</b></div>
<div><span class="mu">Εκπτώσεις</span><b>${me.disc.toFixed(2).replace('.', ',')}%</b></div>
<div><span class="mu">Νέοι πελάτες</span><b>${me.newc}</b></div>
${Y ? `<div><span class="mu">Στόχος Ιαν–${MN[cur - 1]}</span><b>${eur(toNow)}</b></div><div><span class="mu">Επίτευξη Ιαν–${MN[cur - 1]}</span><b class="${me.sales >= toNow ? 'up' : 'dn'}">${toNow > 0 ? (me.sales / toNow * 100).toFixed(1).replace('.', ',') + '%' : '—'}</b></div>` : ''}
<div><span class="mu">Μ.Ο. ομάδας (επίτευξη)</span><b>${T.target > 0 ? (T.sales / T.target * 100).toFixed(1).replace('.', ',') + '%' : '—'}</b></div>
</div>
${st.p === String(cur) && gap > 0 ? `<div class="warn" style="margin-top:10px">Για τον στόχο του ${MNG[cur - 1]} χρειάζονται ακόμα <b>${money(Math.max(0, gap - me.pend))}</b>${me.pend > 0 ? ` (μετά τις παραγγελίες προς εκτέλεση των ${money(me.pend)})` : ''}.</div>` : ''}</div>`;
          h += `<div class="gcard"><h3>Υπόλοιπα των πελατών μου</h3><div class="gsub">Τωρινή εικόνα (δεν αλλάζει ανά μήνα)</div><div class="flgrid">
<div><span class="mu">Υπόλοιπο</span><b>${money(me.bal)}</b></div><div><span class="mu">Υπέρβαση</span><b class="${me.over > 0 ? 'dn' : ''}">${money(me.over)}</b></div><div><span class="mu">Διαμαρτυρημένα</span><b class="${me.prot > 0 ? 'dn' : ''}">${money(me.prot)}</b></div></div></div>`;
          /* μήνας προς μήνα: πωλήσεις και στόχος */
          const MS = ms.map((m) => { const x = rowsOf(m).find((r) => r.code === F.me) || { sales: 0, target: 0 }; return { m, s: x.sales, t: x.target }; }), mx = Math.max(1, ...MS.map((x) => Math.max(x.s, x.t)));
          h += `<div class="gcard"><h3>Μήνα με μήνα</h3><div class="gsub">Πωλήσεις (μπάρα) και στόχος (γραμμή) · πάτα έναν μήνα</div><div class="flmon">${MS.map((x) => `<button class="flm${st.p === String(x.m) ? ' on' : ''}${x.m > cur ? ' fut' : ''}" data-flp="${x.m}" aria-label="${MNL[x.m - 1]}"><span class="flc"><i class="${x.t > 0 && x.s >= x.t ? 'ok' : ''}" style="height:${x.s / mx * 100}%"></i><b style="bottom:${x.t / mx * 100}%"></b></span><span class="fll">${MN[x.m - 1]}</span></button>`).join('')}</div>
<div class="flrow" style="margin-top:8px"><span class="mu">Στόχος πιάστηκε σε <b>${MS.filter((x) => x.m <= cur && x.t > 0 && x.s >= x.t).length}</b> από ${MS.filter((x) => x.m <= cur && x.t > 0).length} μήνες (ως τον ${MN[cur - 1]})</span></div></div>`;
        }
        /* όλοι οι πωλητές */
        const SK = { pct: (a, b) => (ach(b) ?? -1) - (ach(a) ?? -1), sales: (a, b) => b.sales - a.sales, coll: (a, b) => b.coll - a.coll };
        const rows = L.slice().sort(SK[st.sort]), pc = (x) => (ach(x) == null ? '—' : ach(x).toFixed(0) + '%');
        const cell = (x, k) => (k === 'pct' ? pc(x) : k === 'disc' ? x.disc.toFixed(1).replace('.', ',') + '%' : k === 'newc' ? x.newc : eur(x[k]));
        const C = st.all ? [['target', 'Στόχος'], ['sales', 'Πωλήσεις'], ['pct', '%'], ['pend', 'Προς εκτέλ.'], ['coll', 'Εισπράξεις'], ['disc', 'Εκπτ.'], ['newc', 'Νέοι'], ['bal', 'Υπόλοιπο'], ['over', 'Υπέρβαση'], ['prot', 'Διαμαρτ.']] : [['sales', 'Πωλήσεις'], ['target', 'Στόχος'], ['pct', '%'], ['coll', 'Εισπράξεις']];
        h += `<div class="gcard"><h3>Όλοι οι πωλητές</h3><div class="gsub">${esc(per)} · ταξινόμηση: <span class="chips" style="display:inline-flex">${[['pct', '% στόχου'], ['sales', 'πωλήσεις'], ['coll', 'εισπράξεις']].map(([k, l]) => `<button class="chip${st.sort === k ? ' on' : ''}" data-fls="${k}">${l}</button>`).join('')}</span></div>
<div class="fltw"><table class="fltab"><thead><tr><th>Πωλητής</th>${C.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr class="${x.code === F.me ? 'me' : ''}"><td>${esc(x.name)}</td>${C.map(([k]) => `<td class="${k === 'pct' && ach(x) != null ? (ach(x) >= 100 ? 'up' : 'dn') : ''}">${cell(x, k)}</td>`).join('')}</tr>`).join('')}</tbody>
<tfoot><tr><td>Σύνολο</td>${C.map(([k]) => `<td>${cell(T, k)}</td>`).join('')}</tr></tfoot></table></div>
<p style="margin:8px 0 0"><button id="flall" style="padding:6px 12px">${st.all ? '▾ Λιγότερες στήλες' : '▸ Όλες οι στήλες'}</button></p></div>`;
        $('#flb').innerHTML = h;
      };
      paint();
      const off = S.on('flash', paint);
      el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-flp],[data-fls],#flall'); if (!b) return;
        if (b.dataset.flp) st.p = b.dataset.flp; else if (b.dataset.fls) st.sort = b.dataset.fls; else st.all = !st.all;
        paint();
      });
      return off;
    },
  });
})();
