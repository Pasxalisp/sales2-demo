/* ΚΙΝΗΣΗ ΣΕΛΙΔΩΝ ΣΤΟ ΚΙΝΗΤΟ (απόφαση Πασχάλη 17/11/2026, όπως στο iPhone):
   - πιο μέσα (PL.nav.push): η νέα σελίδα έρχεται από δεξιά και η προηγούμενη φεύγει λίγο αριστερά, σκουραίνοντας·
   - «‹ Πίσω» (κουμπί): το αντίθετο· σύρσιμο από την άκρη (gestures.js): η σελίδα έχει ήδη φύγει με το δάχτυλο, τίποτα άλλο·
   - ενότητες της κάτω μπάρας και Αρχική: χωρίς κίνηση (όπως οι καρτέλες στο iPhone).
   Μόνο στο κινητό (όχι PL.WIDE) και όχι με «Μείωση κίνησης». Το core.js (show) καλεί PL.slide.shot(σελίδα που φεύγει) πριν
   τη βγάλει και PL.slide.play(τρόπος, φωτογραφία, νέα σελίδα) αφού βάλει τη νέα. Εμφάνιση: css/base.css («Κίνηση σελίδων»).
   «Φωτογραφία» = αντίγραφο της σελίδας που φεύγει, μόνο όσων φαίνονται στην οθόνη (σε μεγάλες λίστες τα πάνω από την οθόνη
   γίνονται ένα κενό ίδιου ύψους και τα κάτω παραλείπονται), χωρίς id και χωρίς πατήματα.
   Καθαρίζει μόλις τελειώσει η κίνηση (animationend της ίδιας της σελίδας), όχι με χρονόμετρο: στο δείγμα ένα χρονόμετρο
   μεγαλύτερο από την κίνηση άφηνε την πίσω σελίδα να «κολλάει» για λίγο στο τέλος. */
(function () {
  const PL = window.PL;
  const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
  const active = () => !PL.WIDE.matches && !REDUCE.matches;
  const KIND = { push: ['pgin', 'pgout', 'pg-in'], back: ['pgback', 'pgaway', 'pg-back'] };   // [σελίδα, φωτογραφία, όνομα κίνησης σελίδας]

  /* αντίγραφο μόνο όσων φαίνονται */
  const seen = (r) => r.bottom > 0 && r.top < innerHeight;
  function lite(node) {
    const c = node.cloneNode(false), kids = node.children;
    if (kids.length > 40 && /^(block|flow-root)$/.test(getComputedStyle(node).display)) {
      let first = -1, last = -1;
      for (let i = 0; i < kids.length; i++) {
        if (seen(kids[i].getBoundingClientRect())) { if (first < 0) first = i; last = i; } else if (first >= 0) break;
      }
      if (first < 0) return c;
      const gap = kids[first].getBoundingClientRect().top - kids[0].getBoundingClientRect().top;
      if (gap > 0) { const s = document.createElement('div'); s.style.height = gap + 'px'; c.appendChild(s); }
      for (let i = first; i <= last; i++) c.appendChild(kids[i].cloneNode(true));
      return c;
    }
    node.childNodes.forEach((n) => c.appendChild(n.nodeType === 1 && n.getElementsByTagName('*').length > 200 ? lite(n) : n.cloneNode(true)));
    return c;
  }
  function shot(el) {
    if (!el || !el.isConnected || !active()) return null;
    const r = el.getBoundingClientRect(), c = lite(el);
    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach((x) => x.removeAttribute('id'));
    const w = document.createElement('div'); w.className = 'pgsnap'; w.setAttribute('aria-hidden', 'true'); w.inert = true;
    w.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${Math.max(0, innerHeight - r.top)}px`;
    w.appendChild(c);
    return w;
  }
  function play(how, snap, page) {
    const k = KIND[how];
    if (!k || !page || !active()) return;
    page.classList.add(k[0]);
    if (snap) { snap.classList.add(k[1]); document.body.appendChild(snap); }
    let done = false;
    const end = () => { if (done) return; done = true; page.classList.remove(k[0]); page.removeEventListener('animationend', onEnd); if (snap) snap.remove(); };
    const onEnd = (ev) => { if (ev.target === page && ev.animationName === k[2]) end(); };   // όχι κινήσεις μέσα στη σελίδα
    page.addEventListener('animationend', onEnd);
    setTimeout(end, 700);   // ασφάλεια: αν η κίνηση δεν έτρεξε καθόλου (π.χ. εφαρμογή στο παρασκήνιο)
  }
  PL.slide = { shot, play };
})();
