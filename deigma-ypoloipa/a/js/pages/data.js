/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική), σε ενότητες (28/11/2026):
   Εμφάνιση (θέμα, μέγεθος γραμμάτων) · Ειδοποιήσεις: ΟΛΕΣ, η καθεμία με διακόπτη on/off (28/11/2026) — κατάθεση πελάτη, ώρα
   εκκρεμότητας, αριθμός στη μπάρα (settings/notify, js/notify.js), αιτήματα τεχνικού (settings/tnotify, js/treq.js) και ό,τι βάζουν
   τα δοκιμαστικά lab/ (π.χ. ειδοποιήσεις με κλειστή εφαρμογή) · Δεδομένα (κάδος, js/trash.js). Ενότητα χωρίς περιεχόμενο δεν φαίνεται.
   Ο «συνεργαζόμενος τεχνικός» διαλέγεται στην «Τεχνική υποστήριξη» (js/pages/tech.js). Τα δεδομένα του orders τα περνά το Claude. */
(function () {
  const PL = window.PL;
  PL.register('data', {
    title: 'Ρυθμίσεις',
    render(el) {
      el.innerHTML =
        `<h2>⚙️ Ρυθμίσεις</h2>
         <section class="dsec"><h3>Εμφάνιση</h3>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Θέμα</b>
             <p class="mu">Για αυτή τη συσκευή. «Αυτόματο» ακολουθεί το ανοιχτό ή σκούρο θέμα του κινητού.</p>
             <div class="chips wrap" id="thm">${PL.theme.L.map(([v, l]) => `<button class="chip${PL.theme.get() === v ? ' on' : ''}" data-th="${v}">${l}</button>`).join('')}</div></div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Μέγεθος γραμμάτων</b>
             <p class="mu">Για αυτή τη συσκευή. Έτσι θα φαίνονται τα γράμματα σε όλη την εφαρμογή.</p>
             <label class="fsauto"><input type="checkbox" id="fsa"> Όπως το κινητό</label>
             <div class="fsbox" id="fsb"><span class="fsa" aria-hidden="true">A</span><input type="range" id="fsr" min="1" max="7" step="1" aria-label="Μέγεθος γραμμάτων"><span class="fsa big" aria-hidden="true">A</span>
               <div class="fsdots" aria-hidden="true">${'<i></i>'.repeat(7)}</div></div></div></section>
         <section class="dsec" id="dnot"><h3>Ειδοποιήσεις</h3><div id="dntf"></div><div id="dtech"></div><div id="dlabs"></div></section>
         <section class="dsec"><h3>Δεδομένα</h3>
           <div class="card" id="trgo" style="margin-bottom:10px"><div class="row"><b>🗑 Κάδος</b><span class="mu" id="trn"></span></div>
             <p class="mu">Ό,τι διαγράφεις μένει εδώ ${PL.trash.DAYS} μέρες και επαναφέρεται με ένα πάτημα.</p></div></section>`;
      const $ = (s) => el.querySelector(s);
      /* Κάδος (js/trash.js): πόσα έχει, πάτημα → η λίστα με «Επαναφορά» */
      $('#trgo').onclick = () => PL.nav.push('trash');
      PL.store.use('trash').then(() => { const n = PL.trash.list().length; if (el.isConnected) $('#trn').textContent = n ? n + (n === 1 ? ' διαγραφή' : ' διαγραφές') : 'άδειος'; });
      $('#thm').onclick = (e) => { const b = e.target.closest('#thm [data-th]'); if (!b) return; PL.theme.set(b.dataset.th); el.querySelectorAll('#thm [data-th]').forEach((x) => x.classList.toggle('on', x === b)); };
      /* «Όπως το κινητό» ή ένα από τα 7 σκαλιά· το ρυθμιστικό δείχνει πάντα το σκαλί που ισχύει τώρα */
      const fsShow = () => { const auto = !PL.fontSize.get(); $('#fsa').checked = auto; $('#fsb').classList.toggle('auto', auto); $('#fsr').value = PL.fontSize.step(); };
      $('#fsr').oninput = (e) => { PL.fontSize.set(e.target.value); fsShow(); };
      $('#fsa').onchange = (e) => { PL.fontSize.set(e.target.checked ? '' : String(PL.fontSize.step())); fsShow(); };
      fsShow();
      /* η ενότητα «Ειδοποιήσεις» φαίνεται μόνο όταν έχει κάτι μέσα */
      const showNot = () => { $('#dnot').hidden = !$('#dntf').children.length && !$('#dtech').children.length && !$('#dlabs').children.length; };
      const esc = PL.u.esc;
      /* μία γραμμή με διακόπτη (κοινό στυλ .ntog / input.sw στο base.css)· attr: data-nf (js/notify.js) ή data-tn (js/treq.js) */
      const tog = (t, sub, attr, on) => `<label class="ntog"><span>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ''}</span><input type="checkbox" role="switch" class="sw" ${attr}${on ? ' checked' : ''}></label>`;
      const box = (title, rows) => `<div class="card ncard">${title ? `<b>${title}</b>` : ''}${rows}</div>`;
      /* Πελάτες (όποιος βλέπει ποσά) και Ημερολόγιο (όλοι) */
      const N = PL.notify;
      const paintMine = () => {
        $('#dntf').innerHTML = (PL.can('money') ? box('💶 Πελάτες', tog('Κατάθεση πελάτη', 'Όταν το λογιστήριο περάσει κατάθεση', 'data-nf="dep" id="ddepc"', N.on('dep'))) : '') +
          box('📅 Ημερολόγιο', tog('Την ώρα της εκκρεμότητας', 'Κόκκινο πλαίσιο με δόνηση και Κλήση', 'data-nf="alarm"', N.on('alarm')) +
            tog('Αριθμός στη μπάρα', 'Πόσες εκκρεμότητες περιμένουν σήμερα', 'data-nf="badge"', N.on('badge')));
        showNot();
      };
      $('#dntf').addEventListener('change', async (e) => {
        const k = e.target.dataset.nf; if (!k) return;
        try { await N.set(k, e.target.checked); } catch (x) { PL.dlg.toast('Δεν αποθηκεύτηκε'); paintMine(); }
      });
      /* Αιτήματα τεχνικού (js/treq.js, μόνο με λογαριασμούς): για ποια βήματα θέλει ειδοποίηση ο πωλητής / ο τεχνικός / ο υπεύθυνος */
      const TR = PL.treq;
      const paintTech = () => {
        if (TR.on()) {
          const kind = TR.notifyKind();
          $('#dtech').innerHTML = box(kind === 'sales' ? '🧰 Από τον τεχνικό' : '🧰 Αιτήματα', TR.NOTIFY[kind].map(([k, l]) => tog(l, '', `data-tn="${k}"`, TR.notifyOn(k))).join(''));
        }
        showNot();
      };
      PL.store.use('settings').then(() => { paintMine(); paintTech(); });
      $('#dtech').addEventListener('change', async (e) => {
        if (!e.target.dataset.tn) return;
        try { await TR.setNotify(e.target.dataset.tn, e.target.checked); } catch (x) { PL.dlg.toast('Δεν αποθηκεύτηκε'); paintTech(); }
      });
      /* δοκιμαστικά (φάκελος lab/): PL.labActs με page 'data' και mount(κουτί) → καθάρισμα (π.χ. ειδοποιήσεις, lab/push) */
      const labs = (PL.labActs || []).filter((x) => x.page === 'data' && x.mount).map((x) => x.mount($('#dlabs')));
      showNot();
      return () => labs.forEach((f) => f && f());
    },
  });
})();
