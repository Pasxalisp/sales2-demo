/* Σελίδα «Ρυθμίσεις» (κουμπί ⚙️ πάνω δεξιά στην Αρχική): έλεγχος (μέτρηση της βάσης) και λήψη αντιγράφου.
   Δεν γράφει τίποτα στη βάση. Τα δεδομένα του orders τα περνά το Claude απευθείας. */
(function () {
  const PL = window.PL, D = () => PL.dataio;
  PL.register('data', {
    title: 'Ρυθμίσεις',
    render(el) {
      el.innerHTML =
        `<h2>⚙️ Ρυθμίσεις</h2>
         <div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Έλεγχος</b>
             <p class="mu">Μετράει τι υπάρχει τώρα στη βάση. Δεν αλλάζει τίποτα.</p>
             <button id="cnt">Μέτρηση</button><div id="res"></div></div>
           <div class="card" style="cursor:default;margin-bottom:10px"><b>Λήψη αντιγράφου</b>
             <p class="mu">Όλα τα δεδομένα σε ένα αρχείο JSON.</p>
             <button id="exp">Λήψη αντιγράφου</button><p class="mu" id="emsg"></p></div>
         </div>`;
      const $ = (s) => el.querySelector(s);
      $('#cnt').onclick = async () => {
        $('#res').textContent = 'Μετράω…';
        try {
          const c = await D().count();
          const row = (l, a) => `<tr><td>${l}</td><td style="text-align:right"><b>${a}</b></td></tr>`;
          $('#res').innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px">` +
            row('Πελάτες', c.clients) + row('Εγγραφές', c.docs) + row('Συλλογές με δεδομένα', c.collections) + `</table>`;
        } catch (e) { $('#res').textContent = 'Σφάλμα: ' + ((e && e.message) || e); }
      };
      $('#exp').onclick = async () => {
        try { const all = await D().exportAll(); await PL.adapter.files.save('pelatologio-' + all._meta.date + '.json', JSON.stringify(all)); $('#emsg').textContent = 'Έτοιμο.'; }
        catch (e) { $('#emsg').textContent = 'Δεν έγινε λήψη: ' + ((e && e.message) || e); }
      };
    },
  });
})();
