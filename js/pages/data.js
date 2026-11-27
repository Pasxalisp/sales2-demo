/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική), σε ενότητες (28/11/2026):
   Εμφάνιση (θέμα, μέγεθος γραμμάτων) · Ειδοποιήσεις (αιτήματα τεχνικού, settings/tnotify· και ό,τι βάζουν τα δοκιμαστικά lab/,
   π.χ. ειδοποιήσεις με κλειστή εφαρμογή) · Δεδομένα (κάδος, js/trash.js). Ενότητα χωρίς περιεχόμενο δεν φαίνεται.
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
         <section class="dsec" id="dnot"><h3>Ειδοποιήσεις</h3><div id="dtech"></div><div id="dlabs"></div></section>
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
      const showNot = () => { $('#dnot').hidden = !$('#dtech').children.length && !$('#dlabs').children.length; };
      /* Αιτήματα τεχνικού (js/treq.js, μόνο με λογαριασμούς): για ποια βήματα θέλει ειδοποίηση ο πωλητής / ο τεχνικός */
      const TR = PL.treq;
      const paintTech = () => {
        if (TR.on()) {
          const tech = TR.isTech(), esc = PL.u.esc;
          const tog = TR.NOTIFY[tech ? 'tech' : 'sales'].map(([k, l]) => `<label class="trtog">${esc(l)} <input type="checkbox" data-tn="${k}"${TR.notifyOn(k) ? ' checked' : ''}></label>`).join('');
          $('#dtech').innerHTML = `<div class="card" style="cursor:default;margin-bottom:10px"><b>🧰 ${tech ? 'Αιτήματα' : 'Από τον τεχνικό'}</b><p class="mu">${tech ? 'Να σε ειδοποιεί όταν:' : 'Να σε ειδοποιεί όταν ο τεχνικός:'}</p>${tog}</div>`;
        }
        showNot();
      };
      PL.store.use('settings').then(paintTech);
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
