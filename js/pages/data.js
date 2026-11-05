/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική): θέμα, μέγεθος γραμμάτων και έλεγχος (μέτρηση της βάσης).
   Δεν γράφει τίποτα στη βάση. Τα δεδομένα του orders τα περνά το Claude απευθείας. */
(function () {
  const PL = window.PL, D = () => PL.dataio;
  PL.register('data', {
    title: 'Ρυθμίσεις',
    render(el) {
      el.innerHTML =
        `<h2>⚙️ Ρυθμίσεις</h2>
         <div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Θέμα</b>
             <p class="mu">Για αυτή τη συσκευή. «Αυτόματο» ακολουθεί το ανοιχτό ή σκούρο θέμα του κινητού.</p>
             <div class="chips wrap" id="thm">${PL.theme.L.map(([v, l]) => `<button class="chip${PL.theme.get() === v ? ' on' : ''}" data-th="${v}">${l}</button>`).join('')}</div></div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Μέγεθος γραμμάτων</b>
             <p class="mu">Για αυτή τη συσκευή. Έτσι θα φαίνονται τα γράμματα σε όλη την εφαρμογή.</p>
             <label class="fsauto"><input type="checkbox" id="fsa"> Όπως το κινητό</label>
             <div class="fsbox" id="fsb"><span class="fsa" aria-hidden="true">A</span><input type="range" id="fsr" min="1" max="7" step="1" aria-label="Μέγεθος γραμμάτων"><span class="fsa big" aria-hidden="true">A</span>
               <div class="fsdots" aria-hidden="true">${'<i></i>'.repeat(7)}</div></div></div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Έλεγχος</b>
             <p class="mu">Μετράει τι υπάρχει τώρα στη βάση. Δεν αλλάζει τίποτα.</p>
             <button id="cnt">Μέτρηση</button><div id="res"></div></div>
         </div>`;
      const $ = (s) => el.querySelector(s);
      $('#thm').onclick = (e) => { const b = e.target.closest('#thm [data-th]'); if (!b) return; PL.theme.set(b.dataset.th); el.querySelectorAll('#thm [data-th]').forEach((x) => x.classList.toggle('on', x === b)); };
      /* «Όπως το κινητό» ή ένα από τα 7 σκαλιά· το ρυθμιστικό δείχνει πάντα το σκαλί που ισχύει τώρα */
      const fsShow = () => { const auto = !PL.fontSize.get(); $('#fsa').checked = auto; $('#fsb').classList.toggle('auto', auto); $('#fsr').value = PL.fontSize.step(); };
      $('#fsr').oninput = (e) => { PL.fontSize.set(e.target.value); fsShow(); };
      $('#fsa').onchange = (e) => { PL.fontSize.set(e.target.checked ? '' : String(PL.fontSize.step())); fsShow(); };
      fsShow();
      $('#cnt').onclick = async () => {
        $('#res').textContent = 'Μετράω…';
        try {
          const c = await D().count();
          const row = (l, a) => `<tr><td>${l}</td><td style="text-align:right"><b>${a}</b></td></tr>`;
          $('#res').innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:calc(14*var(--u));margin-top:8px">` +
            row('Πελάτες', c.clients) + row('Εγγραφές', c.docs) + row('Συλλογές με δεδομένα', c.collections) + `</table>`;
        } catch (e) { $('#res').textContent = 'Σφάλμα: ' + ((e && e.message) || e); }
      };
    },
  });
})();
