/* «Νέα εκκρεμότητα» / «Αλλαγή εκκρεμότητας» (απόφαση Πασχάλη 15/11): φόρμα όπως στο Google Calendar, χωρίς υπαγόρευση και
   χωρίς να περιμένει απάντηση. Ανοίγει με παρατεταμένο πάτημα σε μέρα του ημερολογίου, από το ➕ των Εκκρεμοτήτων ή με
   «Αλλαγή» σε εκκρεμότητα. Τι · πελάτης από το πελατολόγιο (προαιρετικά) · μέρα και ώρα · πού. Γράφει tasks/{id} μέσω PL.tasks.save.
   params: { day } για νέα (προεπιλογή σήμερα), { id } για αλλαγή υπάρχουσας. */
(function () {
  const PL = window.PL, u = PL.u, S = PL.store, D = PL.dlg, M = PL.model, esc = u.esc;
  const plus = (n) => new Date(Date.parse(u.today()) + n * 864e5).toISOString().slice(0, 10);
  const QUICK = [[0, 'Σήμερα'], [1, 'Αύριο'], [7, 'Σε μία εβδομάδα']];

  PL.register('taskedit', {
    title: 'Εκκρεμότητα',
    render(el, params) {
      ['clients', 'prospects', 'tasks'].forEach((c) => S.use(c));
      const id = params.id || '', old = id ? S.get('tasks', id) || {} : {};
      let cid = old.cid || '';
      el.innerHTML = `<h2>${id ? 'Αλλαγή εκκρεμότητας' : 'Νέα εκκρεμότητα'}</h2><form id="tef" autocomplete="off">` +
        `<div class="shbox"><h3>Τι</h3><textarea id="tet" rows="2" placeholder="π.χ. Να πάρω τηλέφωνο για την παραγγελία">${esc(old.t || '')}</textarea></div>` +
        `<div class="shbox"><h3>Πελάτης <span class="tew">(προαιρετικά)</span></h3><div id="tec"></div></div>` +
        `<div class="shbox"><h3>Πότε</h3><div class="tewhen"><input type="date" id="ted" value="${esc(old.next || params.day || u.today())}" required aria-label="Μέρα">` +
        `<input type="time" id="tetm" value="${esc(old.nt || '')}" aria-label="Ώρα (προαιρετικά)"></div>` +
        `<div class="chips wrap">${QUICK.map(([n, l]) => `<button type="button" class="chip" data-teq="${n}">${l}</button>`).join('')}</div></div>` +
        `<div class="shbox"><h3>Πού <span class="tew">(προαιρετικά)</span></h3><input type="text" id="tewh" value="${esc(old.w || '')}" placeholder="π.χ. στο κομμωτήριο, τηλεφωνικά, Καλαμαριά"></div>` +
        `<p class="teact"><button type="submit" class="pri" id="tesave">Αποθήκευση</button><span id="teerr" class="dn" aria-live="polite"></span></p></form>`;
      const $ = (s) => el.querySelector(s), err = (t) => { $('#teerr').textContent = t; };

      /* πελάτης: αναζήτηση στο πελατολόγιο ή ο επιλεγμένος με ✕ */
      const paintClient = () => {
        const c = cid && M.byId(cid);
        if (c) { $('#tec').innerHTML = `<div class="tecl"><span><b>${esc(c.name)}</b> <span class="mu">${esc(c.city || '')}</span></span><button type="button" id="tecx" aria-label="Χωρίς πελάτη">✕</button></div>`; return; }
        PL.picker($('#tec'), { placeholder: 'Γράψε όνομα πελάτη…', onPick: (x) => { cid = x.i; paintClient(); } });
      };
      paintClient();
      const offs = ['clients', 'prospects'].map((c) => S.on(c, () => { if (cid) paintClient(); }));

      el.addEventListener('input', () => err(''));
      el.addEventListener('click', (ev) => {
        if (ev.target.closest('#tecx')) { cid = ''; paintClient(); return; }
        const q = ev.target.closest('[data-teq]'); if (q) $('#ted').value = plus(+q.dataset.teq);
      });
      $('#tef').addEventListener('submit', async (ev) => {
        ev.preventDefault();
        const t = $('#tet').value.trim(), next = $('#ted').value, nt = $('#tetm').value;
        if (!t) { err('Γράψε τι εκκρεμεί.'); $('#tet').focus(); return; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(next)) { err('Διάλεξε μέρα.'); return; }
        $('#tesave').disabled = true; err('');
        try {
          await PL.tasks.save(id, { t, cid, next, nt, w: $('#tewh').value.trim() });
          PL.tasks.select(next);
          D.toast('📌 ' + (id ? 'Αποθηκεύτηκε' : 'Νέα εκκρεμότητα') + ' · ' + u.fd(next) + (nt ? ' ' + nt : ''));
          PL.nav.back();
        } catch (x) { err('Δεν αποθηκεύτηκε: ' + ((x && x.message) || x)); $('#tesave').disabled = false; }
      });
      if (!id) setTimeout(() => $('#tet').focus(), 60);
      return () => offs.forEach((f) => f());
    },
  });
})();
