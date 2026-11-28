/* «FLASH πωλήσεων & εισπράξεων» (κουμπί στο Πελατολόγιο): η αναφορά 07 του orders, και οι 12 μήνες και σύνολο έτους.
   Στοιχεία στο flash/{έτος} = {d, y, me, cols, m:{μήνας:[[κωδ, πωλητής, στόχος, πωλήσεις, προς εκτέλεση, υπόλ. για 100%, %, υπόλοιπο, υπέρβαση, διαμαρτ., εισπράξεις, εκπτ.%, νέοι]]}}.
   Έρχονται με κάθε ενημέρωση από το orders (μόνο ανάγνωση), και οι μελλοντικοί μήνες (στόχος χωρίς πωλήσεις).
   Το «Σύνολο έτους» το υπολογίζει η σελίδα από τους μήνες: στόχος = άθροισμα και των 12 μηνών.
   Εμφάνιση 28/11/2026: τίτλος με πράσινο εικονίδιο, θέση στην κατάταξη σε κουτάκι με κύπελλο, στοιχεία σε δύο στήλες με
   εικονίδια, μήνες σε πράσινες μπάρες (σκούρα όπου πιάστηκε ο στόχος). Υπολογισμοί ίδιοι. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, esc = u.esc, eur = u.eur, money = u.money;
  const MN = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μάι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
  const MNL = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος', 'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const MNG = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
  const st = { p: '', all: false, sort: 'pct' };
  const { yearRows, total, ach, curM, row: R } = PL.flash;   /* υπολογισμοί: model.js */
  const SV = (q) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${q}</svg>`;
  const IC = {
    bars: SV('<path d="M5 20v-6M10 20V9M15 20v-8M20 20V4"/>'),
    goal: SV('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
    layers: SV('<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>'),
    card: SV('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/>'),
    tag: SV('<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.3"/>'),
    users: SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>'),
    cal: SV('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    trophy: SV('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>'),
    euro: SV('<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5"/><path d="M4 10.5h9M4 13.5h9"/>'),
    alert: SV('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4M12 17.5v.01"/>'),
  };
  /* ένα κουτάκι των στοιχείων: εικονίδιο · ετικέτα · τιμή */
  const cell = (ic, label, val, cls) => `<div><span class="flgi">${ic}</span><span class="flgt"><span class="mu">${label}</span><b class="${cls || ''}">${val}</b></span></div>`;
  /* γραμμή λίστας: εικονίδιο · ετικέτα · τιμή δεξιά (Υπόλοιπα των πελατών μου) */
  const line = (ic, label, val, cls) => `<div><span class="flgi">${ic}</span><span class="mu">${label}</span><b class="${cls || ''}">${val}</b></div>`;
  const head = (ic, t) => `<div class="flhd"><span class="flhi">${ic}</span><h3>${t}</h3></div>`;

  PL.register('flash', {
    title: 'FLASH πωλήσεων & εισπράξεων',
    render(el) {
      el.classList.add('gv');
      el.innerHTML = `<h2 class="pgh"><span class="pghi">${IC.bars}</span>FLASH πωλήσεων & εισπράξεων</h2><div class="gsub" id="fld"></div><div class="flps" id="flp"></div><div id="flb"></div>`;
      const $ = (q) => el.querySelector(q);
      S.use('flash');
      const paint = () => {
        const F = PL.model.flash();
        if (!F || !F.m) { $('#flb').innerHTML = `<p class="mu">${S.loaded('flash') ? 'Δεν υπάρχουν ακόμα στοιχεία. Έρχονται με την επόμενη ενημέρωση από το orders.' : 'Φορτώνω…'}</p>`; return; }
        const ms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], cur = curM(F), rowsOf = (m) => (F.m[m] || []).map(R);
        if (!st.p) st.p = String(cur);
        $('#fld').textContent = 'Από το orders (αναφορά 07) · στοιχεία της ' + u.fd(F.d) + ' · ' + F.y;
        $('#flp').innerHTML = ms.map((m) => `<button class="chip${st.p === String(m) ? ' on' : ''}${m > cur ? ' fut' : ''}" data-flp="${m}">${MN[m - 1]}</button>`).join('') + `<button class="chip fly${st.p === 'Y' ? ' on' : ''}" data-flp="Y">Σύνολο ${F.y}</button>`;
        const Y = st.p === 'Y', fut = !Y && +st.p > cur, L = Y ? yearRows(F) : rowsOf(st.p), T = total(L), me = L.find((x) => x.code === F.me), per = Y ? 'Σύνολο ' + F.y + ' (στόχος και των 12 μηνών)' : MNL[+st.p - 1] + ' ' + F.y + (fut ? ' · δεν έχει ξεκινήσει' : '');
        const ranked = L.filter((x) => x.target > 0).sort((a, b) => ach(b) - ach(a)), rank = me && !fut ? ranked.indexOf(me) + 1 : 0;
        /* στο σύνολο έτους: πού είμαι ως τον τρέχοντα μήνα (στόχος Ιαν–τρέχων) */
        const toNow = Y && me ? ms.filter((m) => m <= cur).reduce((t, m) => t + ((rowsOf(m).find((x) => x.code === F.me) || {}).target || 0), 0) : 0;
        let h = L.length ? '' : '<p class="mu">Δεν υπάρχουν ακόμα στοιχεία για αυτόν τον μήνα. Έρχονται με την επόμενη ενημέρωση από το orders.</p>';
        if (me) {
          const a = ach(me) || 0, gap = me.target - me.sales, w = (v) => (me.target > 0 ? Math.max(0, Math.min(100, v / me.target * 100)) : 0);
          h += `<div class="gcard flme"><div class="fltop"><div class="gsub">${esc(per)} · ${esc(me.name)}</div>${rank ? `<div class="flrk"><span>${IC.trophy}</span><b>${rank}ος από<br>${ranked.length} πωλητές</b></div>` : ''}</div>
<div class="flhero"><span>${eur(me.sales)}</span><span class="mu"> / στόχος ${eur(me.target)}</span></div>
<div class="flbar"><i style="width:${w(me.sales)}%"></i><b style="left:${w(me.sales)}%;width:${Math.max(0, Math.min(100 - w(me.sales), w(me.pend)))}%"></b></div>
<div class="flrow"><b class="${a >= 100 ? 'up' : 'dn'}">${a.toFixed(1).replace('.', ',')}% του στόχου</b>${me.pend > 0 ? '<span class="mu flpl"><i></i>προς εκτέλεση</span>' : ''}</div>
<div class="flgrid">
${cell(IC.goal, gap > 0 ? 'Λείπουν για το 100%' : 'Πάνω από τον στόχο', money(Math.abs(gap)), gap > 0 ? 'dn' : 'up')}
${cell(IC.layers, 'Παραγγελίες προς εκτέλεση', money(me.pend))}
${cell(IC.card, 'Εισπράξεις', money(me.coll))}
${cell(IC.tag, 'Εκπτώσεις', me.disc.toFixed(2).replace('.', ',') + '%')}
${cell(IC.users, 'Νέοι πελάτες', me.newc)}
${Y ? cell(IC.cal, 'Στόχος Ιαν–' + MN[cur - 1], eur(toNow)) + cell(IC.goal, 'Επίτευξη Ιαν–' + MN[cur - 1], toNow > 0 ? (me.sales / toNow * 100).toFixed(1).replace('.', ',') + '%' : '—', me.sales >= toNow ? 'up' : 'dn') : ''}
${cell(IC.users, 'Μ.Ο. ομάδας (επίτευξη)', T.target > 0 ? (T.sales / T.target * 100).toFixed(1).replace('.', ',') + '%' : '—')}
</div>
${st.p === String(cur) && gap > 0 ? `<div class="flwarn"><span>${IC.alert}</span><span>Για τον στόχο του ${MNG[cur - 1]} χρειάζονται ακόμα <b>${money(Math.max(0, gap - me.pend))}</b>${me.pend > 0 ? ` (μετά τις παραγγελίες προς εκτέλεση των ${money(me.pend)})` : ''}.</span></div>` : ''}</div>`;
          h += `<div class="gcard">${head(IC.euro, 'Υπόλοιπα των πελατών μου')}<div class="gsub">Τωρινή εικόνα (δεν αλλάζει ανά μήνα)</div><div class="fllist">
${line(IC.euro, 'Υπόλοιπο', money(me.bal))}${line(IC.alert, 'Υπέρβαση', money(me.over), me.over > 0 ? 'dn' : '')}${line(IC.card, 'Διαμαρτυρημένα', money(me.prot), me.prot > 0 ? 'dn' : '')}</div></div>`;
          /* μήνας προς μήνα: πωλήσεις και στόχος */
          const MS = ms.map((m) => { const x = rowsOf(m).find((r) => r.code === F.me) || { sales: 0, target: 0 }; return { m, s: x.sales, t: x.target }; }), mx = Math.max(1, ...MS.map((x) => Math.max(x.s, x.t)));
          h += `<div class="gcard">${head(IC.bars, 'Μήνα με μήνα')}<div class="gsub">Πωλήσεις (μπάρα) και στόχος (γραμμή) · πάτα έναν μήνα</div><div class="flmon">${MS.map((x) => `<button class="flm${st.p === String(x.m) ? ' on' : ''}${x.m > cur ? ' fut' : ''}" data-flp="${x.m}" aria-label="${MNL[x.m - 1]}"><span class="flc"><i class="${x.t > 0 && x.s >= x.t ? 'ok' : ''}" style="height:${x.s / mx * 100}%"></i><b style="bottom:${x.t / mx * 100}%"></b></span><span class="fll">${MN[x.m - 1]}</span></button>`).join('')}</div>
<div class="flok"><span>${IC.goal}</span><span>Στόχος πιάστηκε σε <b>${MS.filter((x) => x.m <= cur && x.t > 0 && x.s >= x.t).length}</b> από <b>${MS.filter((x) => x.m <= cur && x.t > 0).length}</b> μήνες (ως τον ${MN[cur - 1]})</span></div></div>`;
        }
        /* όλοι οι πωλητές */
        const SK = { pct: (a, b) => (ach(b) ?? -1) - (ach(a) ?? -1), sales: (a, b) => b.sales - a.sales, coll: (a, b) => b.coll - a.coll };
        const rows = L.slice().sort(SK[st.sort]), pc = (x) => (ach(x) == null ? '—' : ach(x).toFixed(0) + '%');
        const tcell = (x, k) => (k === 'pct' ? pc(x) : k === 'disc' ? x.disc.toFixed(1).replace('.', ',') + '%' : k === 'newc' ? x.newc : Math.round(x[k]).toLocaleString('el-GR'));   /* χωρίς «€» σε κάθε κελί (γράφεται μία φορά πάνω), για να χωράει ο πίνακας στο κινητό */
        const C = st.all ? [['target', 'Στόχος'], ['sales', 'Πωλήσεις'], ['pct', '%'], ['pend', 'Προς εκτέλ.'], ['coll', 'Εισπράξεις'], ['disc', 'Εκπτ.'], ['newc', 'Νέοι'], ['bal', 'Υπόλοιπο'], ['over', 'Υπέρβαση'], ['prot', 'Διαμαρτ.']] : [['sales', 'Πωλήσεις'], ['target', 'Στόχος'], ['pct', '%'], ['coll', 'Εισπρ.']];
        h += `<div class="gcard">${head(IC.users, 'Όλοι οι πωλητές')}<div class="gsub">${esc(per)} · ποσά σε € · ταξινόμηση:</div><div class="chips flsort">${[['pct', '% στόχου'], ['sales', 'πωλήσεις'], ['coll', 'εισπράξεις']].map(([k, l]) => `<button class="chip${st.sort === k ? ' on' : ''}" data-fls="${k}">${l}</button>`).join('')}</div>
<div class="fltw"><table class="fltab"><thead><tr><th>Πωλητής</th>${C.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${rows.map((x) => `<tr class="${x.code === F.me ? 'me' : ''}"><td>${esc(x.name)}</td>${C.map(([k]) => `<td class="${k === 'pct' && ach(x) != null ? (ach(x) >= 100 ? 'up' : 'dn') : ''}">${tcell(x, k)}</td>`).join('')}</tr>`).join('')}</tbody>
<tfoot><tr><td>Σύνολο</td>${C.map(([k]) => `<td>${tcell(T, k)}</td>`).join('')}</tr></tfoot></table></div>
<p style="margin:10px 0 0"><button id="flall" class="flall">${st.all ? '▾ Λιγότερες στήλες' : '▸ Όλες οι στήλες'}</button></p></div>`;
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
