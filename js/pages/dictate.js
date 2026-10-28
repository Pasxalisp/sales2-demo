/* Σελίδα «Υπαγόρευση»: συνομιλία με το Claude, μικρόφωνο, στοπ. Η συζήτηση «ξεχνιέται» μετά από 30′ αδράνειας.
   Η κατάσταση ζει στο PL.dictation.state, ώστε να μένει όταν φεύγεις και γυρνάς. */
(function () {
  const PL = window.PL, u = PL.u, esc = u.esc, D = (PL.dictation = PL.dictation || {});
  const IDLE = 30 * 60 * 1000, KEEP = 10, SHOW = 40;
  const st = (D.state = { msgs: [], turns: [], last: 0, busy: false, ctl: null, rec: null });
  let ui = null;   // το ανοιχτό DOM (μόνο όσο η σελίδα είναι ανοιχτή)

  const MIC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3.5"/></svg>';
  const SEND = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>';
  const STOP = '<svg viewBox="0 0 24 24" width="18" height="18"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';
  const HELLO = 'Πες μου ποιους πελάτες είδες ή με ποιους μίλησες, τι συζητήσατε και τι θες να πεις την επόμενη φορά. Τα γράφω στις καρτέλες, και αν δεν είμαι σίγουρος για κάτι, σε ρωτάω.';

  const bubbleHtml = (m, k) => {
    if (m.kind === 'rem') return `<div class="mb mbc">📅 ${esc(m.title)}<br>${esc(m.date)}${m.time ? ' ' + esc(m.time) : ''}<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><button data-copy="${k}">Αντιγραφή για το chat</button></div><div class="mu" data-rmsg="${k}" style="margin-top:6px;font-size:13px">Η σελίδα δεν μπορεί να γράψει στο ημερολόγιο. Πάτα «Αντιγραφή για το chat» και επικόλλησέ το στη συνομιλία του project: εκεί μπαίνει κατευθείαν στο ημερολόγιο του iPhone.</div></div>`;
    return `<div class="mb ${m.kind === 'user' ? 'mbu' : m.kind === 'act' ? 'mba' : 'mbc'}">${esc(m.text)}</div>`;
  };
  const dfinUI = () => { if (ui) ui.fin.hidden = !PL.plans.PLDONE; };
  const paint = () => {
    if (!ui) return;
    const ch = ui.chat, n = st.msgs.length, from = Math.max(0, n - SHOW);
    ch.innerHTML = n ? st.msgs.slice(from).map((m, k) => bubbleHtml(m, from + k)).join('') : `<div class="mb mbc">${esc(HELLO)}</div>`;
    window.scrollTo(0, document.body.scrollHeight);
    ui.go.innerHTML = st.busy ? STOP : SEND;
    ui.info.textContent = st.turns.length ? 'Κλείνει μόνη της μετά από 30′ αδράνειας' : '';
    dfinUI();
  };
  const add = (m) => { st.msgs.push(m); paint(); return m; };
  const reset = (why) => { st.turns = []; st.msgs = [{ kind: 'bot', text: why || 'Νέα συζήτηση. Πες μου τι έγινε.' }]; st.last = 0; if (ui) { ui.st.textContent = ''; ui.info.textContent = ''; } paint(); };
  PL.tick.add(() => { if (!st.busy && st.turns.length && st.last && Date.now() - st.last > IDLE) reset('Η προηγούμενη συζήτηση έκλεισε μετά από μισή ώρα αδράνειας. Όσα γράφτηκαν είναι ήδη στις καρτέλες.'); }, 60);

  /* Ανοίγει την Υπαγόρευση με έτοιμη αρχή κειμένου (π.χ. «Νέος πελάτης: »). */
  D.open = (pre) => { D.prefill = pre || ''; PL.nav.push('dictate'); };
  D.onAct = (t) => add({ kind: 'act', text: t });
  D.onReminder = (r) => add(Object.assign({ kind: 'rem' }, r));

  async function send(txt) {
    const ai = PL.adapter.ai;
    if (!ai.available()) { ui && (ui.st.textContent = 'Η υπαγόρευση δουλεύει μόνο όταν ανοίξεις τη σελίδα συνδεδεμένος στο claude.ai.'); return; }
    if (st.rec) { try { st.rec.stop(); } catch (e) { } st.rec = null; micUI(false); }
    if (st.turns.length && st.last && Date.now() - st.last > IDLE) reset('Πέρασε μισή ώρα, ξεκίνησε νέα συζήτηση. Όσα γράφτηκαν πριν είναι ήδη στις καρτέλες.');
    add({ kind: 'user', text: txt });
    st.turns.push({ role: 'user', content: txt });
    if (st.turns.length > KEEP) { st.turns = st.turns.slice(-KEEP); while (st.turns.length && st.turns[0].role !== 'user') st.turns.shift(); }
    const input = st.turns.map((t, k) => (k === 0 ? { role: 'user', content: D.rules() + '\n\nΜΗΝΥΜΑ ΠΩΛΗΤΗ:\n' + t.content } : t));
    const bot = add({ kind: 'bot', text: 'Σκέφτομαι…' });
    const mark = st.msgs.length;
    st.busy = true; st.ctl = new AbortController(); paint();
    const acts = () => st.msgs.slice(mark).filter((m) => m.kind === 'act').map((m) => m.text);
    try {
      await Promise.all(['clients', 'prospects', 'notes', 'tasks', 'sos', 'tech', 'seminars'].map((c) => PL.store.use(c)));
      let tools = D.TOOLS, warn = '';
      try { const lm = await ai.limits(), mx = lm && lm.tools && lm.tools.maxCount; if (mx && tools.length > mx) { tools = tools.slice(0, mx); warn = '\n(Προσοχή: το όριο εργαλείων είναι ' + mx + ', κάποια δεν μπήκαν.)'; } } catch (e) { }
      const r = await ai.ask(input, { modelTier: 'default', cache: false, signal: st.ctl.signal, tools, onText: ({ text }) => { bot.text = text; paint(); } });
      bot.text = (r.text || 'Έγινε.') + warn;
      // η απάντηση πάει μετά από τις ενέργειες
      st.msgs.splice(st.msgs.indexOf(bot), 1); st.msgs.push(bot);
      st.turns.push({ role: 'assistant', content: (r.text || '') + (acts().length ? '\n[Έγιναν: ' + acts().join(' | ') + ']' : '') });
    } catch (e) {
      const m = e && e.code === 'cancelled' ? 'Σταμάτησε.' : e && e.code === 'not_granted' ? 'Χρειάζεται να επιτρέψεις στη σελίδα να χρησιμοποιήσει το Claude.' :
        'Δεν ολοκληρώθηκε (' + ((e && e.code) || 'σφάλμα') + (e && e.message ? ': ' + String(e.message).slice(0, 160) : '') + '). Δοκίμασε ξανά.';
      bot.text = (e && e.text ? e.text + '\n\n' : '') + m + (acts().length ? '\nΌσα φαίνονται με ✍️/🆘/🔧 γράφτηκαν.' : '');
      if (acts().length) st.turns.push({ role: 'assistant', content: '(διακόπηκε) [Έγιναν: ' + acts().join(' | ') + ']' }); else st.turns.pop();
    }
    st.busy = false; st.ctl = null; st.last = Date.now(); paint();
  }
  D.send = send;

  /* Όταν μόλις τελείωσε πρόγραμμα, το «Πίσω» της Υπαγόρευσης και η «Αρχική» κλείνουν πρώτα το πρόγραμμα (πράσινο τικ). */
  PL.nav.guard = (a) => {
    if (!PL.plans.PLDONE) return false;
    if (a === 'back' && (PL.nav.current().id !== 'dictate' || st.busy)) return false;
    PL.plans.finishPlan(); return true;
  };

  const micUI = (on) => { if (ui) { ui.mic.innerHTML = on ? STOP : MIC; ui.mic.classList.toggle('on', on); } };

  PL.register('dictate', {
    title: 'Υπαγόρευση',
    render(el) {
      el.id = 'dsh';   /* οι κανόνες body.dictnav #dsh … του CSS (όπως στην παλιά) */
      el.style.cssText = 'display:flex;flex-direction:column'; /* ύψος & θέση του πεδίου: css/dictate.css (#dsh), όπως στην παλιά */
      el.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><button id="dbk">← Πίσω</button><button id="dnew">Νέα συζήτηση</button></div>
        <h2>Υπαγόρευση</h2>
        <div id="dchat" style="flex:1"></div>
        <div style="position:sticky;bottom:0;background:var(--bg);padding:8px 0 4px">
        <div style="display:flex;gap:6px;margin-bottom:6px"><button id="dbk2">← Πίσω</button><button id="dnew2">Νέα συζήτηση</button><span id="dinfo" class="mu" style="margin-left:auto;align-self:center;font-size:12px"></span></div>
        <div class="dbar"><textarea id="dt" rows="2" placeholder="Γράψε ή πάτα το μικρόφωνο…"></textarea>
        <button id="dmic" class="rb" aria-label="Υπαγόρευση">${MIC}</button>
        <button class="rb pri" id="dgo" aria-label="Αποστολή"></button></div>
        <button id="dfin" class="pri" hidden style="width:100%;margin-top:8px;min-height:48px;font-weight:700">✓ Αποθήκευση</button>
        <div id="dst" class="mu"></div></div>`;
      ui = { chat: el.querySelector('#dchat'), go: el.querySelector('#dgo'), mic: el.querySelector('#dmic'), info: el.querySelector('#dinfo'), st: el.querySelector('#dst'), dt: el.querySelector('#dt'), fin: el.querySelector('#dfin') };
      micUI(!!st.rec);
      el.querySelectorAll('#dnew,#dnew2').forEach((b) => { b.onclick = () => { if (!st.busy) reset(); }; });
      el.querySelectorAll('#dbk,#dbk2').forEach((b) => { b.onclick = () => PL.nav.up(); });
      ui.fin.onclick = async () => {
        if (st.busy) return; const v = ui.dt.value.trim();
        if (v && !/\):$/.test(v)) { ui.fin.disabled = true; try { ui.dt.value = ''; ui.dt.style.height = ''; await send(v); } catch (e) { /* τίποτα */ } ui.fin.disabled = false; if (st.busy) return; }
        PL.plans.finishPlan();
      };
      ['clients', 'prospects', 'notes', 'tasks', 'sos', 'tech', 'seminars'].forEach((c) => PL.store.use(c));
      paint();
      /* όπως στην παλιά: η Υπαγόρευση ανοίγει με τον κέρσορα στο πεδίο (ανοίγει το πληκτρολόγιο) */
      if (D.prefill) { ui.dt.value = D.prefill; D.prefill = ''; }
      ui.dt.focus(); try { ui.dt.setSelectionRange(ui.dt.value.length, ui.dt.value.length); } catch (e) { /* τίποτα */ }
      const dt = ui.dt, grow = () => { dt.style.height = 'auto'; dt.style.height = Math.min(160, dt.scrollHeight) + 'px'; };
      dt.addEventListener('input', grow);
      ui.go.onclick = () => {
        if (st.busy) { if (st.ctl) st.ctl.abort(); return; }
        const txt = dt.value.trim(); if (!txt) return;
        dt.value = ''; dt.style.height = ''; send(txt);
      };
      ui.mic.onclick = () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition, s = ui.st;
        if (st.rec) { const r = st.rec; st.rec = null; micUI(false); s.textContent = 'Σταμάτησε.'; try { r.stop(); } catch (e) { } setTimeout(() => { try { r.abort(); } catch (e) { } }, 800); return; }
        let noMic = false; try { noMic = localStorage.getItem('nomic') === '1'; } catch (e) { }
        if (!SR || noMic) { dt.focus(); s.textContent = 'Πάτα το 🎤 κάτω δεξιά στο πληκτρολόγιο και μίλα.'; return; }
        const base = dt.value ? dt.value + ' ' : '', rec = new SR();
        rec.lang = 'el-GR'; rec.interimResults = true; rec.continuous = true;
        rec.onresult = (e) => { let t = ''; for (let k = 0; k < e.results.length; k++) t += e.results[k][0].transcript; dt.value = base + t; grow(); };
        rec.onerror = (ev) => {
          const c = ev && ev.error;
          if (c === 'no-speech' || c === 'aborted') { s.textContent = 'Δεν άκουσα τίποτα. Ξαναπάτα το μικρόφωνο.'; return; }
          try { localStorage.setItem('nomic', '1'); } catch (e) { }
          st.rec = null; micUI(false);
          s.textContent = 'Εδώ η σελίδα δεν μπορεί να ακούσει. Ξαναπάτα το μικρόφωνο: θα ανοίξει το πληκτρολόγιο και μιλάς με το 🎤 του πληκτρολογίου.';
        };
        rec.onend = () => { if (st.rec === rec) { st.rec = null; micUI(false); } };
        st.rec = rec; micUI(true); s.textContent = 'Ακούω…';
        try { rec.start(); } catch (e) { st.rec = null; micUI(false); dt.focus(); s.textContent = 'Πάτα το 🎤 κάτω δεξιά στο πληκτρολόγιο και μίλα.'; }
      };
      el.addEventListener('click', async (ev) => {
        const b = ev.target.closest('[data-copy]'); if (!b) return;
        const m = st.msgs[+b.dataset.copy], box = el.querySelector(`[data-rmsg="${b.dataset.copy}"]`);
        try { await navigator.clipboard.writeText(m.req); b.textContent = '✓ Αντιγράφηκε'; box.textContent = 'Τώρα επικόλλησέ το στη συνομιλία του project.'; }
        catch (e) { box.innerHTML = 'Κράτα πατημένο και αντίγραψε:<br><b style="user-select:text;-webkit-user-select:text">' + esc(m.req) + '</b>'; }
      });
      return () => { if (st.rec) { try { st.rec.abort(); } catch (e) { } st.rec = null; } ui = null; };
    },
  });
})();
