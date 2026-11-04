/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική): μέγεθος γραμμάτων και έλεγχος (μέτρηση της βάσης).
   Δεν γράφει τίποτα στη βάση. Τα δεδομένα του orders τα περνά το Claude απευθείας. */
(function () {
  const PL = window.PL, D = () => PL.dataio;
  PL.register('data', {
    title: 'Ρυθμίσεις',
    render(el) {
      el.innerHTML =
        `<h2>⚙️ Ρυθμίσεις</h2>
         <div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Μέγεθος γραμμάτων</b>
             <p class="mu">Για αυτή τη συσκευή. «Όπως το κινητό» ακολουθεί το μέγεθος κειμένου των ρυθμίσεων του κινητού.</p>
             <div class="chips wrap" id="fsz">${PL.fontSize.L.map(([v, l]) => `<button class="chip${PL.fontSize.get() === v ? ' on' : ''}" data-fs="${v}">${l}</button>`).join('')}</div></div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Έλεγχος</b>
             <p class="mu">Μετράει τι υπάρχει τώρα στη βάση. Δεν αλλάζει τίποτα.</p>
             <button id="cnt">Μέτρηση</button><div id="res"></div></div>
         </div>`;
      const $ = (s) => el.querySelector(s);
      $('#fsz').onclick = (e) => { const b = e.target.closest('[data-fs]'); if (!b) return; PL.fontSize.set(b.dataset.fs); el.querySelectorAll('#fsz [data-fs]').forEach((x) => x.classList.toggle('on', x === b)); };
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
