/* ΜΙΣΟΓΡΑΜΜΕΝΑ ΚΕΙΜΕΝΑ: ό,τι έγραψε ο χρήστης σε πεδίο και δεν αποθήκευσε, δεν χάνεται όταν φεύγει από τη σελίδα
   (Πίσω, άλλος πελάτης στο τάμπλετ, γύρισμα οθόνης, κλείσιμο εφαρμογής). Όταν ξανανοίξει την ίδια σελίδα
   (ίδια σελίδα + ίδιες παράμετροι, π.χ. ίδια καρτέλα πελάτη) το κείμενο ξαναμπαίνει στη θέση του.
   - Κρατά μόνο πεδία κειμένου με id που ΑΓΓΙΞΕ ο χρήστης (συμβάν input), όχι τιμές που έβαλε η σελίδα.
   - Αν η σελίδα άδειασε το πεδίο (αποθήκευση) ή το ξανάφτιαξε, δεν κρατά τίποτα: ό,τι αποθηκεύτηκε δεν ξαναγυρνά.
   - Φυλάγεται στη συσκευή (localStorage, μόνο για ευκολία) και σβήνεται μετά από 7 μέρες.
   Το καλεί μόνο το core.js (mount/unmount σελίδας). */
(function () {
  const PL = window.PL;
  const KEY = 'pl.drafts', DAYS = 7;
  /* κείμενα και ημερομηνίες· όχι αναζητήσεις (type=search) και αριθμοί-ρυθμίσεις (type=number) */
  const TXT = 'textarea,input:not([type]),input[type=text],input[type=tel],input[type=email],input[type=url],input[type=date],input[type=time]';
  let all = {};
  try { all = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { all = {}; }
  const old = Date.now() - DAYS * 864e5;
  Object.keys(all).forEach((k) => { if (!all[k] || !(all[k].t > old)) delete all[k]; });
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* μένει στη μνήμη για αυτή τη συνεδρία */ } };
  const keyOf = (e) => e.id + '|' + JSON.stringify(e.params || {});
  const field = (el, id) => { const f = el.querySelector('#' + CSS.escape(id)); return f && f.matches(TXT) ? f : null; };

  /* Παρακολουθεί μια σελίδα που μόλις φτιάχτηκε· επιστρέφει { off(): τη φυλάει, keep(): φυλάει χωρίς να σταματά }. */
  function track(el, e) {
    const k = keyOf(e), dirty = new Set(), done = new Set(), want = Object.assign({}, (all[k] || {}).f);
    const onInput = (ev) => { const t = ev.target; if (t.id && t.matches && t.matches(TXT)) dirty.add(t.id); };
    el.addEventListener('input', onInput, true);

    /* Επαναφορά: κάποια πεδία εμφανίζονται λίγο μετά (όταν φορτώσουν τα δεδομένα), γι' αυτό κοιτάμε για λίγα δευτερόλεπτα.
       Κάθε πεδίο επανέρχεται ΜΙΑ φορά· αν η σελίδα το ξαναφτιάξει (π.χ. μετά από αποθήκευση), δεν ξαναμπαίνει. */
    let told = false, obs = null, stop = null;
    const apply = () => {
      Object.keys(want).forEach((id) => {
        if (done.has(id) || dirty.has(id)) return;
        const f = field(el, id); if (!f) return;
        done.add(id);
        if (f.value === want[id]) return;
        f.value = want[id]; dirty.add(id);
        f.dispatchEvent(new Event('input', { bubbles: true }));
        if (!told) { told = true; setTimeout(() => PL.dlg && PL.dlg.toast('Κράτησα ό,τι είχες γράψει'), 0); }
      });
      if (done.size === Object.keys(want).length) end();
    };
    const end = () => { if (obs) obs.disconnect(); obs = null; clearTimeout(stop); };
    if (Object.keys(want).length) {
      apply();
      if (done.size < Object.keys(want).length) { obs = new MutationObserver(apply); obs.observe(el, { childList: true, subtree: true }); stop = setTimeout(end, 4000); }
    }

    const keep = () => {
      const f = {};
      dirty.forEach((id) => { const x = field(el, id); if (x && x.value.trim()) f[id] = x.value; });
      /* Πεδία που είχαν μείνει από πριν και η σελίδα δεν τα έδειξε (π.χ. κλειστή ενότητα που δεν φτιάχτηκε) δεν χάνονται. */
      Object.keys(want).forEach((id) => { if (!done.has(id) && !dirty.has(id)) f[id] = want[id]; });
      if (Object.keys(f).length) all[k] = { t: Date.now(), f }; else delete all[k];
      save();
    };
    return { keep, off() { end(); keep(); el.removeEventListener('input', onInput, true); } };
  }

  PL.drafts = { track, has: (e) => !!all[keyOf(e)], clear: (e) => { delete all[keyOf(e)]; save(); } };
})();
