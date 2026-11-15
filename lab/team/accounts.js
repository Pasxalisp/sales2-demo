/* ΔΟΚΙΜΑΣΤΙΚΟ «Λογαριασμοί» (lab/team/, μαζί με το team.js). Δουλεύει μόνο όταν ο server τα προσφέρει (db.html, βάση Supabase):
   - O.setPassword:  ο χρήστης βάζει δικό του κωδικό· αν μπήκε με προσωρινό (me.mustChange), δεν προχωρά πριν τον βάλει.
   - O.accounts:     εργαλεία διαχειριστή (κατάσταση, ξεκλείδωμα, προσωρινός κωδικός, νέος χρήστης).
   Στο απλό demo (ψεύτικα δεδομένα στη συσκευή) δεν υπάρχουν, οπότε εδώ δεν γίνεται τίποτα.
   Κωδικούς δεν δείχνει ποτέ, εκτός από τον προσωρινό, μία φορά, στον διαχειριστή που τον έβγαλε για να τον δώσει.
   Το team.js καλεί: PL.teamAcc.badges(χρήστης) στη λίστα, PL.teamAcc.panel(θέση, χρήστης) στην καρτέλα χρήστη,
   PL.teamAcc.showTemp(χρήστης, κωδικός) μετά από νέο χρήστη. */
(function () {
  const PL = window.PL, O = PL && PL.adapter && PL.adapter.org; if (!O) return;
  const esc = PL.u.esc, me = O.me;
  const when = (iso) => (iso ? new Date(iso).toLocaleString('el-GR', { day: 'numeric', month: 'numeric', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
  /* παράθυρο πάνω από όλα· κλείνει με close() */
  function overlay(cls, html) {
    const o = document.createElement('div'); o.className = cls; o.setAttribute('role', 'dialog'); o.innerHTML = html;
    document.body.appendChild(o); document.body.classList.add('tmlock');
    const close = () => { o.remove(); if (!document.querySelector('#tmlogin, .tmover, .tmtemp')) document.body.classList.remove('tmlock'); };
    return { o, close };
  }

  /* ---------- Δικός μου κωδικός ---------- */
  function changePassword(forced) {
    const min = O.passwordMin || 8;
    const { o, close } = overlay('tmover', `<form class="tmlb" autocomplete="on"><h2>${forced ? 'Βάλε δικό σου κωδικό' : 'Αλλαγή κωδικού'}</h2>` +
      `<p class="mu">${forced ? 'Μπήκες με προσωρινό κωδικό. Διάλεξε δικό σου για να συνεχίσεις.' : 'Από την επόμενη είσοδο μπαίνεις με τον νέο κωδικό.'} Τον ξέρεις μόνο εσύ· δεν τον βλέπει κανείς, ούτε ο διαχειριστής.</p>` +
      `<input type="email" autocomplete="username" value="${esc(me.email)}" hidden>` +
      `<label>Νέος κωδικός<input id="tmpn" type="password" autocomplete="new-password" required></label>` +
      `<label>Ξανά ο ίδιος<input id="tmpr" type="password" autocomplete="new-password" required></label>` +
      `<p class="mu tmhint">Τουλάχιστον ${min} χαρακτήρες. Μια φράση που θυμάσαι εύκολα είναι καλύτερη από έναν δύσκολο κωδικό.</p>` +
      `<button class="pri" id="tmps" type="submit">Αποθήκευση</button><p id="tmpe" class="dn" aria-live="polite"></p>` +
      `<button type="button" id="tmpx">${forced ? 'Έξοδος' : 'Άκυρο'}</button></form>`);
    o.setAttribute('aria-label', forced ? 'Βάλε δικό σου κωδικό' : 'Αλλαγή κωδικού');
    const $ = (s) => o.querySelector(s), err = (t) => { $('#tmpe').textContent = t; };
    $('#tmpx').addEventListener('click', () => { if (forced) O.logout(); else close(); });
    $('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const a = $('#tmpn').value, b = $('#tmpr').value;
      if (a.length < min) return err('Ο κωδικός θέλει τουλάχιστον ' + min + ' χαρακτήρες.');
      if (a !== b) return err('Οι δύο κωδικοί δεν είναι ίδιοι.');
      $('#tmps').disabled = true; err('');
      const r = await O.setPassword(a);
      $('#tmps').disabled = false;
      if (r.error) return err(r.error);
      close(); PL.dlg.toast('Ο κωδικός σου αποθηκεύτηκε');
    });
    setTimeout(() => $('#tmpn').focus(), 50);
  }

  /* ---------- Προσωρινός κωδικός: φαίνεται μία φορά στον διαχειριστή ---------- */
  function showTemp(x, temp) {
    return new Promise((res) => {
      const { o, close } = overlay('tmtemp', `<div class="tmtb"><h3>Προσωρινός κωδικός</h3>` +
        `<p>Δώσε τον στον χρήστη <b>${esc(x.name)}</b>. Τον χρησιμοποιεί μία φορά: στην πρώτη είσοδο η εφαρμογή του ζητά να βάλει δικό του.</p>` +
        `<div class="tmtc"><code>${esc(temp)}</code><button type="button" id="tmtcp">Αντιγραφή</button></div>` +
        `<p class="mu">Είσοδος με το email <b>${esc(x.email)}</b>. Μόλις κλείσεις αυτό το παράθυρο, ο κωδικός δεν ξαναφαίνεται· αν χαθεί, βγάζεις νέο.</p>` +
        `<button class="pri" id="tmtok" type="button">Έγινε</button></div>`);
      o.setAttribute('aria-label', 'Προσωρινός κωδικός');
      o.querySelector('#tmtcp').addEventListener('click', async (ev) => {
        const b = ev.currentTarget;
        try { await navigator.clipboard.writeText(temp); b.textContent = '✓ Αντιγράφηκε'; } catch (e) { const r = document.createRange(); r.selectNodeContents(o.querySelector('code')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Επιλέχθηκε'; }
      });
      o.querySelector('#tmtok').addEventListener('click', () => { close(); res(); });
    });
  }

  /* ---------- Λίστα χρηστών: σημάδια λογαριασμού ---------- */
  function badges(x) {
    const st = O.accounts && O.accounts.status(x.id); if (!st) return '';
    return (st.locked ? '<span class="dn">🔒 κλειδωμένος</span>' : st.fails ? `<span>⚠️ ${st.fails} λάθος κωδικοί</span>` : '') +
      (st.must_change ? '<span>🔑 περιμένει δικό του κωδικό</span>' : '');
  }

  /* ---------- Καρτέλα χρήστη: λογαριασμός ---------- */
  function panel(slot, x) {
    if (!slot) return;
    const self = x.id === me.id;
    if (self) {   // ο ίδιος ο διαχειριστής: μόνο αλλαγή του δικού του κωδικού
      if (!O.setPassword) return;
      slot.innerHTML = `<section class="tmacc"><h3>Ο λογαριασμός μου</h3><p><button type="button" data-acc="pw">Αλλαγή του κωδικού μου</button></p></section>`;
      slot.onclick = (ev) => { if (ev.target.closest('[data-acc="pw"]')) changePassword(false); };
      return;
    }
    const A = O.accounts; if (!A) return;
    const paint = () => {
      const st = A.status(x.id);
      const line = !st ? '<span class="mu">Δεν φόρτωσε η κατάσταση του λογαριασμού.</span>'
        : st.locked ? `<b class="dn">🔒 Κλειδωμένος</b> από ${esc(when(st.locked_at))}, μετά από ${A.max} λάθος κωδικούς.${x.admin ? ` Ως διαχειριστής ξεκλειδώνει μόνος του σε ${A.adminLockMin} λεπτά.` : ''}`
          : st.must_change ? '<b>🔑 Περιμένει να βάλει δικό του κωδικό</b> (έχει προσωρινό).'
            : '<b class="up">✓ Κανονικός</b>' + (st.fails ? ` · ⚠️ ${st.fails} λάθος κωδικοί (κλειδώνει στους ${A.max})` : '');
      const last = st ? (st.last ? 'Τελευταία είσοδος: ' + esc(when(st.last)) : 'Δεν έχει μπει ακόμη.') : '';
      slot.innerHTML = `<section class="tmacc"><h3>Λογαριασμός</h3><p class="tmaccst">${line}</p>${last ? `<p class="mu">${last}</p>` : ''}` +
        `<p class="tmaccb">${st && st.locked ? '<button type="button" class="pri" data-acc="unlock">Ξεκλείδωμα</button>' : ''}<button type="button" data-acc="temp">Νέος προσωρινός κωδικός</button></p>` +
        `<p class="mu">Τον κωδικό του δεν τον βλέπει κανείς, ούτε ο διαχειριστής. Αν τον ξεχάσει, του δίνεις νέο προσωρινό και στην είσοδο βάζει δικό του.</p></section>`;
    };
    paint();
    slot.onclick = async (ev) => {
      const b = ev.target.closest('[data-acc]'); if (!b || b.disabled) return;
      b.disabled = true;
      try {
        if (b.dataset.acc === 'unlock') { await A.unlock(x.id); PL.dlg.toast('Ο λογαριασμός ξεκλειδώθηκε'); }
        else if (await PL.dlg.confirm(`Νέος προσωρινός κωδικός για τον χρήστη ${x.name}; Ο τωρινός του κωδικός σταματά να δουλεύει.`, 'Ναι, νέος κωδικός')) await showTemp(x, await A.temp(x.id));
      } catch (e) { PL.dlg.toast(e.message); }
      b.disabled = false;
      if (slot.isConnected) paint();
    };
    A.refresh().then(() => { if (slot.isConnected) paint(); }, () => {});
  }

  PL.teamAcc = { badges, panel, showTemp, changePassword };

  /* μπήκε με προσωρινό κωδικό: πρώτα δικός του κωδικός */
  if (me && O.setPassword) Promise.resolve(O.ready).then(() => { if (me.mustChange) changePassword(true); }, () => {});
})();
